Array.prototype.myReduce = function (fn, initialValue) {
  let array = this;
  let pre = initialValue === undefined ? array[0] : initialValue; // 初始值为第一个元素
  let startIndex = initialValue === undefined ? 1 : 0; // 如果没有初始值，从第一个元素开始遍历
  for (let i = startIndex; i < array.length; i++) {
    pre = fn(pre, array[i], i, array);
  }
  return pre;
};

const a = [1, 2, 3, 4, 5];
const b = a.myReduce((pre, cur) => {
  console.log(pre, cur);
  return pre + cur;
}, 0);
console.log(b); // 15

const array = [
  [0, 1],
  [2, 3],
  [4, 5],
  [5, 6],
];
const flattenedArray = array.myReduce((pre, cur) => pre.concat(cur), []);
console.log(flattenedArray);
