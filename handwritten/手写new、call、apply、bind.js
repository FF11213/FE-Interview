function myNew(Fn) {
  if (typeof Fn !== "function") throw new TypeError("This is not a constructor"); // Fn校验
  let args = [...arguments].slice(1); // 取入参
  let obj = {}; // 1.创建一个空的简单JavaScript对象（即`  {}  `）
  obj.__proto__ = Fn.prototype; // 2.  为步骤1新创建的对象添加属性`  __proto__  `，将该属性链接至构造函数的原型对象
  let res = Fn.call(obj, ...args); // 3.  将步骤1新创建的对象作为this的上下文并传入参数；
  return Object(res) === res ? res : obj; // 4.  如果该函数没有返回对象，则返回this。
}

function simpleNew(obj, ...args) {
  const newObj = Object.create(obj.prototype); // 创建一个新对象，原型为构造函数的原型
  const result = obj.apply(newObj, args); // 调用构造函数，并将新对象作为this
  return typeof result === "object" && typeof result !== null ? result : newObj; // 如果构造函数返回的是对象，则返回该对象，否则返回新对象
}

Function.prototype.myCall = function (context, ...args) {
  if (typeof this !== "function") throw new TypeError("Error"); // 判断调用对象是否为函数
  context = context || window; // 如果没有提供 context，则默认为全局对象
  const fn = Symbol("fn"); // 使用 Symbol 创建唯一的属性名，防止属性名冲突
  context[fn] = this; // 将当前函数绑定到 context 上
  const res = args.length ? context[fn](...args) : context[fn]();
  // 调用后删除创建的属性，防止污染 context
  delete context[fn];
  return res;
};

Function.prototype.myApply = function (context, args) {
  if (typeof this !== "function") throw new TypeError("Error"); // 判断调用对象是否为函数
  context = context || window; // 如果没有提供 context，则默认为全局对象
  const fn = Symbol("fn"); // 使用 Symbol 创建唯一的属性名，防止属性名冲突
  context[fn] = this; // 将当前函数绑定到 context 上
  const res = Array.isArray(args) ? context[fn](...args) : context[fn](); // 调用函数
  delete context[fn]; // 调用后删除创建的属性，防止污染 context
  return res;
};

Function.prototype.myBind = function (context, ...bindArgs) {
  if (typeof this !== "function") throw new TypeError("Error"); // 判断调用对象是否为函数
  const fn = this;
  return function boundFunction(...callArgs) {
    // 根据调用方式，传入不同绑定值
    return fn.apply(this instanceof boundFunction ? this : context, [...bindArgs, ...callArgs]);
  };
};
