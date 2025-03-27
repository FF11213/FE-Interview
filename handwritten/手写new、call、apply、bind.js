function myNew(Fn) {
  if (typeof Fn !== "function") throw new TypeError("This is not a constructor"); // Fn校验
  let args = [...arguments].slice(1); // 取入参
  let obj = {}; // 1.创建一个空的简单JavaScript对象（即`  {}  `）
  obj.__proto__ = Fn.prototype; // 2.  为步骤1新创建的对象添加属性`  __proto__  `，将该属性链接至构造函数的原型对象
  let res = Fn.call(obj, ...args); // 3.  将步骤1新创建的对象作为this的上下文并传入参数；
  return Object(res) === res ? res : obj; // 4.  如果该函数没有返回对象，则返回this。
}

Function.prototype.myCall = function (context) {
  if (typeof this !== "function") throw new TypeError("Error"); // 判断调用对象
  let args = [...arguments].slice(1), // 获取参数
    result = null;
  context = context || window; // 判断 context 是否传入，如果未传入则设置为 window
  context.fn = this; // 将调用函数设为对象的方法
  result = context.fn(...args); // 调用函数
  delete context.fn; // 将属性删除
  return result;
};

Function.prototype.myApply = function (context) {
  if (typeof this !== "function") throw new TypeError("Error"); // 判断调用对象是否为函数
  let result = null;
  context = context || window; // 判断 context 是否存在，如果未传入则为 window
  context.fn = this; // 将函数设为对象的方法
  // 调用方法
  if (arguments[1]) {
    result = context.fn(...arguments[1]);
  } else {
    result = context.fn();
  }
  delete context.fn; // 将属性删除
  return result;
};

Function.prototype.myBind = function (context) {
  if (typeof this !== "function") throw new TypeError("Error"); // 判断调用对象是否为函数
  let args = [...arguments].slice(1), // 获取参数
    fn = this;
  return function Fn() {
    // 根据调用方式，传入不同绑定值
    return fn.apply(this instanceof Fn ? this : context, args.concat(...arguments));
  };
};
