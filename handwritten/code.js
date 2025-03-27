// const obj = {
//   a: 1,

//   get get() {
//     return this.a;
//   },
// };

// (function (value) {
//   console.log(Object.getPrototypeOf(value));
//   console.log(Object.prototype.hasOwnProperty.call(value, "adb"));
//   console.log(Object.prototype.toString.call(value).slice(8, -1));
//   console.log(Reflect.get(value, "get", value));
// })(obj);

// Promise.resolve()
//   .then(() => {
//     console.log(0);
//     return Promise.resolve(4);
//   })
//   .then((res) => {
//     console.log(res);
//   });

// Promise.resolve()
//   .then(() => {
//     console.log(1);
//   })
//   .then(() => {
//     console.log(2);
//   })
//   .then(() => {
//     console.log(3);
//   })
//   .then(() => {
//     console.log(5);
//   })
//   .then(() => {
//     console.log(6);
//   });

// const map = new Map();

// map.set(1, 1);
// map.set(3, 3);
// map.set(2, 2);

// console.log(map.keys().next());

const _permute = (string) => {
  // 结果集数组
  const res = [];
  // 元素获取数组
  let path = "";
  // 调用backTracking函数
  // 参数1：需要全排的数组 参数2：数组的长度 参数3：used数组记录当前元素是否已被使用
  backTracking(Array.from(string), string.length, []);
  // 返回最后的结果
  return res;

  // 递归函数
  function backTracking(n, k, used) {
    // 当获取的元素个数等于传入数组长度时（此时说明找到了一组结果）
    if (path.length === k) {
      // 将这组数据存进结果集数组
      res.push(path);
      // 结束递归
      return;
    }
    for (let i = 0; i < k; i++) {
      if (used[i]) continue; // 当前元素已被使用， 结束此次循环
      path = path + n[i]; // 将符合条件的元素存进path数组
      used[i] = true; // 并将该元素标为true，表示已使用同支
      backTracking(n, k, used);
      path = path.substring(0, path.length - 1);
      used[i] = false;
    }
  }
};
console.log(_permute("abc"));
