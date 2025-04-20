/* class Animal {
  constructor(name) {
    this.name = name;
  }
  get name() {
    return 'Jack';
  }
  set name(value) {
    console.log('setter: ' + value);
  }
}

let a = new Animal('Kitty'); // setter: Kitty
a.name = 'Tom'; // setter: Tom
console.log(a.name); // Jack */

// const User = {
//   count: 1,
//   action: {
//     count: 1,

//     getCount() {
//       console.log(this);
//       return this.count;
//     },
//   },
// };

// const action = User.action;
// const getCount = User.action.getCount;
// console.log(User.action.getCount());
// console.log(action.getCount());
// console.log(getCount());

// function Person(name) {
//   this.name = name;
// }
// 修改原型
// Person.prototype.getName = function () {};
// var p = new Person("hello");
// console.log(Person.prototype); // true
// console.log(p.constructor); // true
// 重写原型
// Person.prototype = {
//   getName: function () {},
// };
// var p = new Person("hello");
// console.log(p.__proto__ === Person.prototype); // true
// console.log(p.__proto__); // false
// console.log(a);

// var a = 1;

// function sum() {
//   // let a = 2;
//   a = 2;
// }

// sum();

// function myNew(fn, ...args) {
//   const obj = Object.create(fn.prototype);
//   const res = fn.call(obj, args);
//   return res instanceof Object ? res : obj;
// }

// Function.prototype.myCall = function (context, ...args) {
//   if (typeof this !== "function") {
//     throw Error;
//   }
//   context = context || window;
//   const fn = Symbol();
//   context[fn] = this;
//   const res = args.length ? context[fn](...args) : context[fn];
//   delete context[fn];
//   return res;
// };
// Function.prototype.myApply = function (context, args) {
//   if (typeof this !== "function") throw Error;
//   context = context || window;
//   const fn = Symbol();
//   context[fn] = this;
//   const res = Array.isArray(args) ? context[fn](...args) : context[fn];
//   delete context[fn];
//   return res;
// };
// Function.prototype.myBind = function (context, ...bindArgs) {
//   if (typeof this !== "function") throw Error;
//   const fn = this;
//   return function Fn(...callArgs2) {
//     return fn.apply(this instanceof Fn ? this : context, [...bindArgs, ...callArgs2]);
//   };
// };

// function demo(a) {
//   console.log(a.prototype);
// }

// demo(1); // [Arguments] { '0': 1, '1': 2, '2': 3, '3': 4, '4': 5 }

function flatten(array) {
  return array.reduce((pre, cur) => {
    pre.concat(Array.isArray(cur) ? flatten(cur) : cur);
  }, []);
}
