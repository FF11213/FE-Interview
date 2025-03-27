// const array = [1, [2, [3, [4, 5]]]];
const array = [1, [2, [3, [4, 6]], 5]];

function flattenA(arr, depth = Infinity) {
  return depth > 0
    ? arr.reduce((pre, cur) => pre.concat(Array.isArray(cur) ? flattenA(cur, depth - 1) : cur), [])
    : arr.filter((item) => item !== undefined);
}

function flattenB(arr, depth = Infinity) {
  let result = [];

  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i]) && depth > 0) {
      result = result.concat(flattenB(arr[i], depth - 1));
    } else {
      result.push(arr[i]);
    }
  }

  return result;
}

function flattenC(arr, depth = Infinity) {
  while (arr.some((item) => Array.isArray(item)) && depth > 0) {
    arr = [].concat(...arr);
    depth--;
  }

  return arr;
}

console.log(array.flat(2));
console.log(flattenA(array, 2));
// console.log(flattenB(array, 3));
// console.log(flattenC(array, 3));
