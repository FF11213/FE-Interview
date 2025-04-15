function deepClone(obj, cache = new WeakMap()) {
  // 如果是基本类型或者 null，则直接返回
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 如果已经拷贝过该对象，则直接返回缓存的拷贝对象
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  // 创建一个新的对象或数组
  const clone = Array.isArray(obj) ? [] : {};

  // 将当前对象添加到缓存中
  cache.set(obj, clone);

  // 递归复制每一个属性
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key], cache);
    }
  }

  return clone;
}
