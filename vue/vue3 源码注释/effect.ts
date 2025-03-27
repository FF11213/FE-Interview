import { NOOP, extend } from '@vue/shared'
import type { ComputedRefImpl } from './computed'
import {
  DirtyLevels,
  type TrackOpTypes,
  type TriggerOpTypes,
} from './constants'
import type { Dep } from './dep'
import { type EffectScope, recordEffectScope } from './effectScope'

export type EffectScheduler = (...args: any[]) => any

export type DebuggerEvent = {
  effect: ReactiveEffect
} & DebuggerEventExtraInfo

export type DebuggerEventExtraInfo = {
  target: object
  type: TrackOpTypes | TriggerOpTypes
  key: any
  newValue?: any
  oldValue?: any
  oldTarget?: Map<any, any> | Set<any>
}

export let activeEffect: ReactiveEffect | undefined

/**
 * 这个类的作用是创建一个响应式副作用函数，
 * 这个函数会在依赖的数据发生变化的时候执行
 */
export class ReactiveEffect<T = any> {
  // 表示这个副作用是否处于活跃状态。如果为false，则副作用不会再响应依赖数据的变化。
  active = true
  // 存储了这个副作用所依赖的所有数据的集合（Dep类型）。每个Dep代表一个响应式数据的依赖关系。
  deps: Dep[] = []

  /**
   * 某些属性或方法可以在 ReactiveEffect 类的实例被创建后添加或修改，computed属性就是一个例子。
   * 可选属性，这个属性用于指示副作用是否与计算属性相关联，可以在创建 ReactiveEffect 实例之后附加上去
   * @internal - @internal标记意味着这部分内容主要供框架内部使用，并非设计为库或框架的公开API的一部分
   */
  computed?: ComputedRefImpl<T>
  /**
   * @internal
   * 可选属性，表示是否允许这个副作用递归地调用自身
   */
  allowRecurse?: boolean

  // 可选回调函数，当这个副作用被停止时调用
  onStop?: () => void
  // dev only：仅在开发模式下使用的回调函数，用于调试跟踪
  onTrack?: (event: DebuggerEvent) => void
  // dev only：仅在开发模式下使用的回调函数，用于触发更新
  onTrigger?: (event: DebuggerEvent) => void

  // _dirtyLevel等内部属性: 用于内部状态管理，比如判断副作用的脏检查级别等
  /**
   * @internal
   */
  _dirtyLevel = DirtyLevels.Dirty
  /**
   * @internal
   */
  _trackId = 0
  /**
   * @internal
   */
  _runnings = 0
  /**
   * @internal
   */
  _shouldSchedule = false
  /**
   * @internal
   */
  _depsLength = 0

  /**
   * 构造函数
   * fn：副作用函数
   * trigger：触发函数（内部使用，通常为NOOP，即空操作）
   * scheduler：可选的调度器函数
   * scope：可选的作用域
   */
  constructor(
    public fn: () => T,
    public trigger: () => void,
    public scheduler?: EffectScheduler,
    scope?: EffectScope,
  ) {
    recordEffectScope(this, scope)
  }

  /**
   * dirty属性的get方法在 ReactiveEffect 类中是用来确定副作用函数是否需要被重新执行的。
   * 这个机制主要用于优化计算属性和其他依赖缓存的场景
   */
  public get dirty() {
    // 检查_dirtyLevel：检查当前副作用的_dirtyLevel（脏检查级别）
    if (
      this._dirtyLevel === DirtyLevels.MaybeDirty_ComputedSideEffect ||
      this._dirtyLevel === DirtyLevels.MaybeDirty
    ) {
      // 查询脏数据：为了确定是否真的需要重新计算，会将 _dirtyLevel 设置为QueryingDirty，
      this._dirtyLevel = DirtyLevels.QueryingDirty
      // 并暂时停止依赖追踪（以避免在这个过程中不必要地收集新的依赖）
      pauseTracking()
      /**
       * 检查计算属性：遍历所有已注册的依赖（这些依赖代表副作用函数所依赖的数据）。
       */
      for (let i = 0; i < this._depsLength; i++) {
        const dep = this.deps[i]
        // 如果其中的依赖是计算属性（dep.computed），
        // 则会尝试触发这些计算属性的重新计算（通过triggerComputed函数）。
        if (dep.computed) {
          triggerComputed(dep.computed)
          // 如果在这个过程中发现 _dirtyLevel 变为 Dirty，表示确实有数据变化，
          // 需要重新计算副作用函数，那么循环就会提前结束
          if (this._dirtyLevel >= DirtyLevels.Dirty) {
            break
          }
        }
      }
      /**
       * 重置脏检查级别：如果遍历完所有依赖后 _dirtyLevel 仍然是 QueryingDirty，
       * 表示没有发现需要更新的数据，那么将 _dirtyLevel 设置为 NotDirty ，意味着不需要重新执行副作用函数。
       */
      if (this._dirtyLevel === DirtyLevels.QueryingDirty) {
        this._dirtyLevel = DirtyLevels.NotDirty
      }
      // 最后，恢复依赖追踪
      resetTracking()
    }
    // 最后，通过检查 _dirtyLevel 是否大于等于 Dirty 来决定是否标记为"脏"，
    // 如果是，则表示需要重新执行副作用函数
    return this._dirtyLevel >= DirtyLevels.Dirty
  }

  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NotDirty
  }

  /**
   * 执行副作用函数
   * 在执行之前，会设置全局的 activeEffect 为当前实例，以便在副作用函数执行期间能够收集依赖。
   * 执行完成后，恢复 activeEffect 和 shouldTrack 的状态。
   * 如果副作用当前不处于活跃状态，直接执行副作用函数而不进行依赖收集
   */
  run() {
    this._dirtyLevel = DirtyLevels.NotDirty
    if (!this.active) {
      return this.fn()
    }
    let lastShouldTrack = shouldTrack
    let lastEffect = activeEffect
    try {
      // shouldTrack 设置为 true，允许依赖收集
      shouldTrack = true
      /**
       * this引用的是 ReactiveEffect 类的当前实例
       * 将全局的 activeEffect 变量设置为当前的副作用实例
       */
      activeEffect = this
      this._runnings++
      preCleanupEffect(this)
      return this.fn()
    } finally {
      postCleanupEffect(this)
      this._runnings--
      activeEffect = lastEffect
      shouldTrack = lastShouldTrack
    }
  }

  /**
   * 停止这个副作用响应其依赖数据的变化。
   * 在停止前后，会执行一些清理操作，并调用 onStop 回调（如果有的话）
   */
  stop() {
    if (this.active) {
      preCleanupEffect(this)
      postCleanupEffect(this)
      this.onStop && this.onStop()
      this.active = false
    }
  }
}

function triggerComputed(computed: ComputedRefImpl<any>) {
  return computed.value
}

function preCleanupEffect(effect: ReactiveEffect) {
  effect._trackId++
  effect._depsLength = 0
}

function postCleanupEffect(effect: ReactiveEffect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanupDepEffect(effect.deps[i], effect)
    }
    effect.deps.length = effect._depsLength
  }
}

function cleanupDepEffect(dep: Dep, effect: ReactiveEffect) {
  const trackId = dep.get(effect)
  if (trackId !== undefined && effect._trackId !== trackId) {
    dep.delete(effect)
    if (dep.size === 0) {
      dep.cleanup()
    }
  }
}

export interface DebuggerOptions {
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
}

export interface ReactiveEffectOptions extends DebuggerOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
  scope?: EffectScope
  allowRecurse?: boolean
  onStop?: () => void
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

/**
 * 注册给定函数来跟踪反应性更新
 * The given function will be run once immediately. Every time any reactive
 * 在其中访问的属性得到更新，该函数将再次运行
 *
 * @param fn - The function that will track reactive updates.
 * @param options - Allows to control the effect's behaviour.
 * @returns 创建后可用于控制效果的 runner
 */
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions,
): ReactiveEffectRunner {
  // 如果 fn 已经是一个 effect 函数，则获取其原始函数进行重新包装
  if ((fn as ReactiveEffectRunner).effect instanceof ReactiveEffect) {
    // 那么就将 fn 替换为 fn.effect.fn
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  // 创建一个响应式副作用函数，封装副作用函数fn
  const _effect = new ReactiveEffect(fn, NOOP, () => {
    if (_effect.dirty) {
      _effect.run()
    }
  })
  // 如果有配置项
  if (options) {
    // 将配置项合并到响应式副作用函数上
    extend(_effect, options)
    // 如果配置项中有 scope 属性（该属性的作用是指定副作用函数的作用域）
    // 那么就将 scope 属性记录到响应式副作用函数上（类似一个作用域链）
    if (options.scope) recordEffectScope(_effect, options.scope)
  }
  // 如果没有配置项，或者配置项中没有 lazy 属性，或者配置项中的 lazy 属性为 false
  if (!options || !options.lazy) {
    // 那么就执行响应式副作用函数
    _effect.run()
  }
  // 将 _effect.run 的 this 指向 _effect
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  // 将响应式副作用函数赋值给 runner.effect
  runner.effect = _effect

  /**
   * 简化API：通过返回一个函数（runner），使用者可以直接执行这个函数来触发副作用，
   * 而不需要从_effect实例中调用run方法。这样的API更加简洁直观。
   */
  return runner
}

/**
 * Stops the effect associated with the given runner.
 *
 * @param runner - Association with the effect to stop tracking.
 */
export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}

// 当前执行的 effect 是否需要收集依赖
export let shouldTrack = true
export let pauseScheduleStack = 0

// 调用链栈，用来处理嵌套的 effect 调用情况
// 记录这个链上的 effect 是否需要收集依赖
const trackStack: boolean[] = []

/**
 * Temporarily pauses tracking.
 */
export function pauseTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

/**
 * Re-enables effect tracking (if it was paused).
 */
export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

/**
 * Resets the previous global effect tracking state.
 */
export function resetTracking() {
  // 弹出栈顶的 shouldTrack 值，表示当前的 shouldTrack 值已经失效，需要恢复上一个 shouldTrack 值
  const last = trackStack.pop()
  // 如果 last 为 undefined，说明栈中没有 shouldTrack 值，这时候将 shouldTrack 设置为 true
  shouldTrack = last === undefined ? true : last
}

export function pauseScheduling() {
  pauseScheduleStack++
}

export function resetScheduling() {
  pauseScheduleStack--
  while (!pauseScheduleStack && queueEffectSchedulers.length) {
    queueEffectSchedulers.shift()!()
  }
}

export function trackEffect(
  effect: ReactiveEffect,
  dep: Dep,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo,
) {
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId)
    const oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect)
      }
      effect.deps[effect._depsLength++] = dep
    } else {
      effect._depsLength++
    }
    if (__DEV__) {
      effect.onTrack?.(extend({ effect }, debuggerEventExtraInfo!))
    }
  }
}

const queueEffectSchedulers: EffectScheduler[] = []

export function triggerEffects(
  dep: Dep,
  dirtyLevel: DirtyLevels,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo,
) {
  pauseScheduling()
  for (const effect of dep.keys()) {
    // dep.get(effect) 非常昂贵，我们需要惰性计算并重用结果
    let tracking: boolean | undefined
    if (
      effect._dirtyLevel < dirtyLevel &&
      (tracking ??= dep.get(effect) === effect._trackId)
    ) {
      effect._shouldSchedule ||= effect._dirtyLevel === DirtyLevels.NotDirty
      effect._dirtyLevel = dirtyLevel
    }
    if (
      effect._shouldSchedule &&
      (tracking ??= dep.get(effect) === effect._trackId)
    ) {
      if (__DEV__) {
        effect.onTrigger?.(extend({ effect }, debuggerEventExtraInfo))
      }
      effect.trigger()
      if (
        (!effect._runnings || effect.allowRecurse) &&
        effect._dirtyLevel !== DirtyLevels.MaybeDirty_ComputedSideEffect
      ) {
        effect._shouldSchedule = false
        if (effect.scheduler) {
          queueEffectSchedulers.push(effect.scheduler)
        }
      }
    }
  }
  resetScheduling()
}
