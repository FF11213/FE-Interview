import { isArray, isIntegerKey, isMap, isSymbol } from '@vue/shared'
import { DirtyLevels, type TrackOpTypes, TriggerOpTypes } from './constants'
import { type Dep, createDep } from './dep'
import {
  activeEffect,
  pauseScheduling,
  resetScheduling,
  shouldTrack,
  trackEffect,
  triggerEffects,
} from './effect'

// 存储 {target -> key -> dep} 连接的主 WeakMap。
// 从概念上讲，将依赖关系视为 Dep 类更容易理解
// 它维护一组订阅者，但我们只是将它们存储为原始映射以减少内存开销。
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<object, KeyToDepMap>()

export const ITERATE_KEY = Symbol(__DEV__ ? 'iterate' : '')
export const MAP_KEY_ITERATE_KEY = Symbol(__DEV__ ? 'Map key iterate' : '')

/**
 * Tracks access to a reactive property.
 *
 * This will check which effect is running at the moment and record it as dep
 * which records all effects that depend on the reactive property.
 *
 * @param target - Object holding the reactive property.
 * @param type - Defines the type of access to the reactive property.
 * @param key - Identifier of the reactive property to track.
 */
export function track(target: object, type: TrackOpTypes, key: unknown) {
  // shouldTrack 用来判断当前是否需要收集依赖
  // activeEffect 指向的是当前正在执行的 effect，收集依赖收集的就是它
  // 如果 shouldTrack 为 false 或者 activeEffect 为 null，说明不需要收集依赖
  if (shouldTrack && activeEffect) {
    // 如果 targetMap 中没有 target，就会创建一个 Map
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    // 如果 depsMap 中没有 key，就会创建一个 Set
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap!.delete(key))))
    }

    // 如果 dep 中没有当前的 ReactiveEffect 对象，就会添加进去
    trackEffect(
      activeEffect,
      dep,
      __DEV__
        ? {
            target,
            type,
            key,
          }
        : void 0,
    )
  }
}

/**
 * Finds all deps associated with the target (or a specific property) and
 * triggers the effects stored within.
 *
 * @param target - The reactive object.
 * @param type - Defines the type of the operation that needs to trigger effects.
 * @param key - Can be used to target a specific reactive property in the target object.
 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>,
) {
  // 获取 targetMap 中的 depsMap
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }

  // 创建一个数组，用来存放需要执行的 ReactiveEffect 对象
  let deps: (Dep | undefined)[] = []
  // 如果 type 为 clear，就会将 depsMap 中的所有 ReactiveEffect 对象都添加到 deps 中
  if (type === TriggerOpTypes.CLEAR) {
    // 执行所有的 副作用函数
    deps = [...depsMap.values()]
  }
  // 如果 key 为 length ，并且 target 是一个数组
  else if (key === 'length' && isArray(target)) {
    // 修改数组的长度，会导致数组的索引发生变化
    // 但是只有两种情况，一种是数组的长度变大，一种是数组的长度变小
    // 如果数组的长度变大，那么执行所有的副作用函数就可以了
    // 如果数组的长度变小，那么就需要执行索引大于等于新数组长度的副作用函数
    const newLength = Number(newValue)
    depsMap.forEach((dep, key) => {
      if (key === 'length' || (!isSymbol(key) && key >= newLength)) {
        deps.push(dep)
      }
    })
  }
  // 其他情况
  else {
    // schedule runs for SET | ADD | DELETE
    // key 不是 undefined，就会将 depsMap 中 key 对应的 ReactiveEffect 对象添加到 deps 中
    if (key !== void 0) {
      deps.push(depsMap.get(key))
    }

    // 执行 add、delete、set 操作时，就会触发的依赖变更
    switch (type) {
      case TriggerOpTypes.ADD:
        // 如果 target 不是数组，就会触发迭代器
        if (!isArray(target)) {
          // ITERATE_KEY 再上面介绍过，用来标识迭代属性
          // 例如：for...in、for...of，这个时候依赖会收集到 ITERATE_KEY 上
          // 而不是收集到具体的 key 上
          deps.push(depsMap.get(ITERATE_KEY))

          // 如果 target 是一个 Map，就会触发 MAP_KEY_ITERATE_KEY
          if (isMap(target)) {
            // MAP_KEY_ITERATE_KEY 同上面的 ITERATE_KEY 一样
            // 不同的是，它是用来标识 Map 的迭代器
            // 例如：Map.prototype.keys()、Map.prototype.values()、Map.prototype.entries()
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        // 如果 key 是一个数字，就会触发 length 依赖
        else if (isIntegerKey(key)) {
          // 因为数组的索引是可以通过 arr[0] 这种方式来访问的
          // 也可以通过这种方式来修改数组的值，所以会触发 length 依赖
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        // 如果 target 不是数组，就会触发迭代器，同上面的 add 操作
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        break
      case TriggerOpTypes.SET:
        // 如果 target 是一个 Map，就会触发迭代器，同上面的 add 操作
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }

  // 类似一个调用栈
  pauseScheduling()
  for (const dep of deps) {
    if (dep) {
      triggerEffects(
        dep,
        DirtyLevels.Dirty,
        __DEV__
          ? {
              target,
              type,
              key,
              newValue,
              oldValue,
              oldTarget,
            }
          : void 0,
      )
    }
  }
  resetScheduling()
}

export function getDepFromReactive(object: any, key: string | number | symbol) {
  const depsMap = targetMap.get(object)
  return depsMap && depsMap.get(key)
}
