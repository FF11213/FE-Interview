/* 柯里化函数 */
function curryES6(fn, ...args) {
  return args.length >= fn.length ? fn(...args) : curryES6.bind(null, fn, ...args);
}

function curry(fn, args) {
  console.log(fn, args);
  // 获取函数需要的参数长度
  let length = fn.length;

  args = args || [];

  return function () {
    let subArgs = args.slice(0);

    // 拼接得到现有的所有参数
    for (let i = 0; i < arguments.length; i++) {
      subArgs.push(arguments[i]);
    }

    // 判断参数的长度是否已经满足函数所需参数的长度
    if (subArgs.length >= length) {
      // 如果满足，执行函数
      return fn.apply(this, subArgs);
    } else {
      // 如果不满足，递归返回科里化的函数，等待参数的传入
      console.log(subArgs);
      return curry.call(this, fn, subArgs);
    }
  };
}

const add = (a, b, c) => a + b + c;
const curryAdd = curry(add);

console.log(curryAdd(2, 3)(3));

/**
 * 实现一个"占位符"函数，它可以使任何函数允许部分应用任何参数组合，而不管它们的位置如何。
 * "_"是一个特殊的占位符值，用于指定柯里化函数中的“间隙”
 */
const _ = Symbol("placeholder");
let finalArgs = [];
let argIndex = 0;

function placeholder(fn, ...args) {
  const newArgs = args.slice(argIndex);
  !finalArgs.length && (finalArgs = new Array(fn.length).fill(null));

  let num = 0;
  newArgs.forEach((arg) => {
    argIndex++;
    arg === _ && num++;
    arg !== _ && (finalArgs[finalArgs.indexOf(null) + num] = arg);
  });

  return fn.length <= finalArgs.filter((item) => item).length ? fn(...finalArgs) : placeholder.bind(null, fn, ...args);
}

const g = (a, b, c, d) => {
  return (a + b) * c - d;
};
const equals = (fn1, fn2) => console.log(fn1 === fn2);

equals(g(3, 4, 3, 2), placeholder(g, 3)(_, _)(4, _, 2)(3));
equals(g(1, 2, 3, 4), placeholder(g, _, _, _, 4)(1, _, 3)(2));
