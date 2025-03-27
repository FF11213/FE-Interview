// using literal strings instead of numbers so that it's easier to inspect
// debugger events

export enum TrackOpTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate',
}

export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export enum ReactiveFlags {
  // 用于标识一个对象是否不可被转为代理对象
  SKIP = '__v_skip',
  // 用于标识一个对象是否是响应式的代理
  IS_REACTIVE = '__v_isReactive',
  // 用于标识一个对象是否是只读的代理
  IS_READONLY = '__v_isReadonly',
  // 用于标识一个对象是否是浅层代理
  IS_SHALLOW = '__v_isShallow',
  // 用于保存原始对象的 key
  RAW = '__v_raw',
}

export enum DirtyLevels {
  NotDirty = 0,
  QueryingDirty = 1,
  MaybeDirty_ComputedSideEffect = 2,
  MaybeDirty = 3,
  Dirty = 4,
}
