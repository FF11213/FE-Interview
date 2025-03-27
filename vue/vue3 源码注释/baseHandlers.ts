import {
  type Target,
  isReadonly,
  isShallow,
  reactive,
  reactiveMap,
  readonly,
  readonlyMap,
  shallowReactiveMap,
  shallowReadonlyMap,
  toRaw,
} from './reactive'
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from './constants'
import {
  pauseScheduling,
  pauseTracking,
  resetScheduling,
  resetTracking,
} from './effect'
import { ITERATE_KEY, track, trigger } from './reactiveEffect'
import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isSymbol,
  makeMap,
} from '@vue/shared'
import { isRef } from './ref'
import { warn } from './warning'

const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`)

const builtInSymbols = new Set(
  /*#__PURE__*/
  Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => (Symbol as any)[key])
    .filter(isSymbol),
)

const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, TrackOpTypes.GET, i + '')
      }
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      pauseScheduling()
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetScheduling()
      resetTracking()
      return res
    }
  })
  return instrumentations
}

function hasOwnProperty(this: object, key: unknown) {
  // #10455 hasOwnProperty may be called with non-string values
  if (!isSymbol(key)) key = String(key)
  const obj = toRaw(this)
  track(obj, TrackOpTypes.HAS, key)
  return obj.hasOwnProperty(key as string)
}

class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _isShallow = false,
  ) {}

  // 返回 get 拦截器方法
  get(target: Target, key: string | symbol, receiver: object) {
    const isReadonly = this._isReadonly,
      isShallow = this._isShallow

    // 如果访问的是 __v_isReactive 属性，那么返回 isReadonly 的取反值
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    }
    // 如果访问的是 __v_isReadonly 属性，那么返回 isReadonly 的值
    else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    // 如果访问的是 __v_isShallow 属性，那么返回 shallow 的值
    else if (key === ReactiveFlags.IS_SHALLOW) {
      return isShallow
    }
    // 如果访问的是 __v_raw 属性，并且有一堆条件满足，那么返回 target
    else if (key === ReactiveFlags.RAW) {
      if (
        receiver ===
          (isReadonly
            ? isShallow
              ? shallowReadonlyMap
              : readonlyMap
            : isShallow
              ? shallowReactiveMap
              : reactiveMap
          ).get(target) ||
        // receiver is not the reactive proxy, but has the same prototype
        // this means the reciever is a user proxy of the reactive proxy
        Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
      ) {
        return target
      }
      // early return undefined
      return
    }

    // target 是否是数组
    const targetIsArray = isArray(target)

    if (!isReadonly) {
      // 如果是数组，并且访问的是数组的一些方法，那么返回对应的方法
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        // Reflect.get 解决Proxy的this指向问题
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      // 如果访问的是 hasOwnProperty 方法，那么返回 hasOwnProperty 方法
      if (key === 'hasOwnProperty') {
        return hasOwnProperty
      }
    }

    // 获取 target 的 key 属性值，Reflect.get 解决Proxy的this指向问题
    const res = Reflect.get(target, key, receiver)

    // 如果是内置的 Symbol，或者是不可追踪的 key，那么直接返回 res
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res
    }

    // 如果不是只读的，那么进行依赖收集
    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    // 如果是浅的不需要进行递归代理，直接返回 res
    if (isShallow) {
      return res
    }

    // 如果 res 是 ref，对返回的值进行解包
    if (isRef(res)) {
      // 对于数组和整数类型的 key，不进行解包
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    // 如果 res 是对象，递归代理
    if (isObject(res)) {
      // 将返回的值也转换为代理。我们在这里进行 isObject 检查，以避免无效的值警告。
      // 还需要延迟访问 readonly 和 reactive，以避免循环依赖。
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow)
  }

  set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    // 获取旧值
    let oldValue = (target as any)[key]
    if (!this._isShallow) {
      const isOldValueReadonly = isReadonly(oldValue)
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue)
        value = toRaw(value)
      }
      // 如果旧值是只读的，并且是 ref，并且新值不是 ref，那么直接返回 false，代表设置失败
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        if (isOldValueReadonly) {
          return false
        }
        // 如果目标对象不是数组，并且旧值是 ref，并且新值不是 ref，那么设置旧值的 value 为新值，并且返回 true，代表设置成功
        // ref 的值是在 value 属性上的，这里判断了旧值的代理类型，所以设置到了旧值的 value 上
        else {
          oldValue.value = value
          return true
        }
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
    }

    // 如果是数组，并且 key 是整数类型
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? // 如果 key 小于数组的长度，那么就是有这个 key
          Number(key) < target.length
        : // 如果不是数组，那么就是普通对象，直接判断是否有这个 key
          hasOwn(target, key)

    // 通过 Reflect.set 设置值
    const result = Reflect.set(target, key, value, receiver)
    // 如果目标对象是原始数据的原型链中的某个元素，则不会触发依赖收集
    if (target === toRaw(receiver)) {
      // 如果没有这个 key，那么就是新增了一个属性，触发 add 事件
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      }
      // 如果有这个 key，那么就是修改了一个属性，触发 set 事件
      else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }

    // 返回结果，这个结果为 boolean 类型，代表是否设置成功
    // 只是代理相关，和业务无关，必须要返回是否设置成功的结果
    return result
  }

  deleteProperty(target: object, key: string | symbol): boolean {
    // 当前对象是否有这个 key
    const hadKey = hasOwn(target, key)
    // 旧值
    const oldValue = (target as any)[key]
    // 通过 Reflect.deleteProperty 删除属性
    const result = Reflect.deleteProperty(target, key)
    // 如果删除成功，并且当前对象有这个 key，那么就触发 delete 事件
    if (result && hadKey) {
      trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    // 返回结果，这个结果为 boolean 类型，代表是否删除成功
    return result
  }

  has(target: object, key: string | symbol): boolean {
    // 通过 Reflect.has 判断当前对象是否有这个 key
    const result = Reflect.has(target, key)
    // 如果当前对象不是 Symbol 类型，或者当前对象不是内置的 Symbol 类型，那么就触发 has 事件
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, TrackOpTypes.HAS, key)
    }
    // 返回结果，这个结果为 boolean 类型，代表当前对象是否有这个 key
    return result
  }
  ownKeys(target: object): (string | symbol)[] {
    // 直接触发 iterate 事件
    track(
      target,
      TrackOpTypes.ITERATE,
      isArray(target) ? 'length' : ITERATE_KEY,
    )
    // 通过 Reflect.ownKeys 获取当前对象的所有 key
    return Reflect.ownKeys(target)
  }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(true, isShallow)
  }

  set(target: object, key: string | symbol) {
    if (__DEV__) {
      warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target,
      )
    }
    return true
  }

  deleteProperty(target: object, key: string | symbol) {
    if (__DEV__) {
      warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target,
      )
    }
    return true
  }
}

export const mutableHandlers: ProxyHandler<object> =
  /*#__PURE__*/ new MutableReactiveHandler()

export const readonlyHandlers: ProxyHandler<object> =
  /*#__PURE__*/ new ReadonlyReactiveHandler()

export const shallowReactiveHandlers = /*#__PURE__*/ new MutableReactiveHandler(
  true,
)

// Props handlers are special in the sense that it should not unwrap top-level
// refs (in order to allow refs to be explicitly passed down), but should
// retain the reactivity of the normal readonly object.
export const shallowReadonlyHandlers =
  /*#__PURE__*/ new ReadonlyReactiveHandler(true)
