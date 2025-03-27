import { ErrorCodes, callWithErrorHandling, handleError } from './errorHandling'
import { type Awaited, NOOP, isArray } from '@vue/shared'
import { type ComponentInternalInstance, getComponentName } from './component'

export interface SchedulerJob extends Function {
  id?: number
  pre?: boolean
  active?: boolean
  computed?: boolean
  /**
   * Indicates whether the effect is allowed to recursively trigger itself
   * when managed by the scheduler.
   *
   * By default, a job cannot trigger itself because some built-in method calls,
   * e.g. Array.prototype.push actually performs reads as well (#1740) which
   * can lead to confusing infinite loops.
   * The allowed cases are component update functions and watch callbacks.
   * Component update functions may update child component props, which in turn
   * trigger flush: "pre" watch callbacks that mutates state that the parent
   * relies on (#1801). Watch callbacks doesn't track its dependencies so if it
   * triggers itself again, it's likely intentional and it is the user's
   * responsibility to perform recursive state mutation that eventually
   * stabilizes (#1727).
   */
  allowRecurse?: boolean
  /**
   * Attached by renderer.ts when setting up a component's render effect
   * Used to obtain component information when reporting max recursive updates.
   * dev only.
   */
  ownerInstance?: ComponentInternalInstance
}

export type SchedulerJobs = SchedulerJob | SchedulerJob[]

let isFlushing = false // 是否正在刷新
let isFlushPending = false // 是否有任务需要刷新

const queue: SchedulerJob[] = [] // 刷新的任务队列
let flushIndex = 0 // 当前刷新的任务索引

const pendingPostFlushCbs: SchedulerJob[] = []
let activePostFlushCbs: SchedulerJob[] | null = null
let postFlushIndex = 0

const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null // 表示当前就需要刷新的任务

const RECURSION_LIMIT = 100
type CountMap = Map<SchedulerJob, number>

export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R,
): Promise<Awaited<R>> {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

// #2768
// Use binary-search to find a suitable position in the queue,
// so that the queue maintains the increasing order of job's id,
// which can prevent the job from being skipped and also can avoid repeated patching.
function findInsertionIndex(id: number) {
  // the start index should be `flushIndex + 1`
  let start = flushIndex + 1
  let end = queue.length

  while (start < end) {
    const middle = (start + end) >>> 1
    const middleJob = queue[middle]
    const middleJobId = getId(middleJob)
    if (middleJobId < id || (middleJobId === id && middleJob.pre)) {
      start = middle + 1
    } else {
      end = middle
    }
  }

  return start
}

/* 添加任务，这个方法会在下面的 queueFlush 方法中被调用 */
export function queueJob(job: SchedulerJob) {
  // 通过 Array.includes() 的 startIndex 参数来搜索任务队列中是否已经存在相同的任务
  // 默认情况下，搜索的起始索引包含了当前正在执行的任务
  // 所以它不能递归地再次触发自身
  // 如果任务是一个 watch() 回调，那么搜索的起始索引就是 +1，这样就可以递归调用了
  // 但是这个递归调用是由用户来保证的，不能无限递归
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex,
    )
  ) {
    // 如果任务没有 id 属性，那么就将任务插入到任务队列中
    if (job.id == null) {
      queue.push(job)
    }
    // 如果任务有 id 属性，那么就将任务插入到任务队列的合适位置
    else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }

    // 刷新任务队列
    queueFlush()
  }
}

/**
 * 用来刷新任务队列的方法
 * 其实就是利用Promise的then方法可以注册多个回调函数的特性，
 * 将需要刷新的任务都注册到同一个Promise的then方法中，
 * 这样就可以保证这些任务的执行顺序，就是一个队列。
 */
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

export function invalidateJob(job: SchedulerJob) {
  const i = queue.indexOf(job)
  if (i > flushIndex) {
    queue.splice(i, 1)
  }
}

export function queuePostFlushCb(cb: SchedulerJobs) {
  if (!isArray(cb)) {
    if (
      !activePostFlushCbs ||
      !activePostFlushCbs.includes(
        cb,
        cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex,
      )
    ) {
      pendingPostFlushCbs.push(cb)
    }
  } else {
    // if cb is an array, it is a component lifecycle hook which can only be
    // triggered by a job, which is already deduped in the main queue, so
    // we can skip duplicate check here to improve perf
    pendingPostFlushCbs.push(...cb)
  }
  queueFlush()
}

export function flushPreFlushCbs(
  instance?: ComponentInternalInstance,
  seen?: CountMap,
  // if currently flushing, skip the current job itself
  i = isFlushing ? flushIndex + 1 : 0,
) {
  if (__DEV__) {
    seen = seen || new Map()
  }
  for (; i < queue.length; i++) {
    const cb = queue[i]
    if (cb && cb.pre) {
      if (instance && cb.id !== instance.uid) {
        continue
      }
      if (__DEV__ && checkRecursiveUpdates(seen!, cb)) {
        continue
      }
      queue.splice(i, 1)
      i--
      cb()
    }
  }
}

/* 用来执行生命周期的回调 */
export function flushPostFlushCbs(seen?: CountMap) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)].sort(
      (a, b) => getId(a) - getId(b),
    )
    pendingPostFlushCbs.length = 0

    // #1947 already has active queue, nested flushPostFlushCbs call
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped)
      return
    }

    activePostFlushCbs = deduped
    if (__DEV__) {
      seen = seen || new Map()
    }

    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      if (
        __DEV__ &&
        checkRecursiveUpdates(seen!, activePostFlushCbs[postFlushIndex])
      ) {
        continue
      }
      activePostFlushCbs[postFlushIndex]()
    }
    activePostFlushCbs = null
    postFlushIndex = 0
  }
}

const getId = (job: SchedulerJob): number =>
  job.id == null ? Infinity : job.id

const comparator = (a: SchedulerJob, b: SchedulerJob): number => {
  const diff = getId(a) - getId(b)
  if (diff === 0) {
    if (a.pre && !b.pre) return -1
    if (b.pre && !a.pre) return 1
  }
  return diff
}

/**
 *
 * @param seen
 */
function flushJobs(seen?: CountMap) {
  // 将 isFlushPending 设置为 false，表示当前没有任务需要等待刷新了
  isFlushPending = false

  // 将 isFlushing 设置为 true，表示正在刷新
  isFlushing = true
  if (__DEV__) {
    seen = seen || new Map()
  }

  // 刷新前，需要对任务队列进行排序
  // 这样可以确保：
  // 1. 组件的更新是从父组件到子组件的。
  //    因为父组件总是在子组件之前创建，所以它的渲染优先级要低于子组件。
  // 2. 如果父组件在更新的过程中卸载了子组件，那么子组件的更新可以被跳过。
  queue.sort(comparator)

  // 非生产环境下，检查是否有递归更新
  // checkRecursiveUpdates 方法的使用必须在 try ... catch 代码块之外确定，
  // 因为 Rollup 默认会在 try-catch 代码块中进行 treeshaking 优化。
  // 这可能会导致所有警告代码都不会被 treeshaking 优化。
  // 虽然它们最终会被像 terser 这样的压缩工具 treeshaking 优化，
  // 但有些压缩工具会失败（例如：https://github.com/evanw/esbuild/issues/1610)
  const check = __DEV__
    ? (job: SchedulerJob) => checkRecursiveUpdates(seen!, job)
    : NOOP

  // 检测递归调用
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        if (__DEV__ && check(job)) {
          continue
        }
        callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    // 刷新生命周期的回调
    flushPostFlushCbs(seen)

    // 将 isFlushing 设置为 false，表示当前刷新结束
    isFlushing = false
    // 将 currentFlushPromise 设置为 null，表示当前没有任务需要刷新了
    currentFlushPromise = null

    // pendingPostFlushCbs 存放的是生命周期的回调，
    // 所以可能在刷新的过程中又有新的任务需要刷新
    // 所以这里需要判断一下，如果有新添加的任务，就需要再次刷新
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen)
    }
  }
}

function checkRecursiveUpdates(seen: CountMap, fn: SchedulerJob) {
  if (!seen.has(fn)) {
    seen.set(fn, 1)
  } else {
    const count = seen.get(fn)!
    if (count > RECURSION_LIMIT) {
      const instance = fn.ownerInstance
      const componentName = instance && getComponentName(instance.type)
      handleError(
        `Maximum recursive updates exceeded${
          componentName ? ` in component <${componentName}>` : ``
        }. ` +
          `This means you have a reactive effect that is mutating its own ` +
          `dependencies and thus recursively triggering itself. Possible sources ` +
          `include component template, render function, updated hook or ` +
          `watcher source function.`,
        null,
        ErrorCodes.APP_ERROR_HANDLER,
      )
      return true
    } else {
      seen.set(fn, count + 1)
    }
  }
}
