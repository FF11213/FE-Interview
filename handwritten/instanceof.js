function myInstanceof(left, right) {
  if ([null, undefined].includes(left)) return false;

  let proto = Object.getPrototypeOf(left);

  // 判断构造函数的 prototype 对象是否在对象的原型链上
  while (true) {
    if (!proto) return false;
    if (proto === right.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
}
