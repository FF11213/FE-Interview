// 如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状态的 Promise
if (promises.length === 0) return resolve(promises);

/**
 * Promise.all
 * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
 */
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    let result = []; // 存储结果
    let count = 0; // 计数器
    promises.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          count++;
          result[index] = value;
          count === promises.length && resolve(result);
        },
        (reason) => {
          reject(reason);
        }
      );
    });
  });
}

/**
 * Promise.allSettled
 * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
 */
function promiseAllSettled(promises) {
  return new Promise((resolve) => {
    let result = []; // 存储结果
    let count = 0; // 计数器
    promises.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          count++;
          result[index] = { status: "fulfilled", value };
          count === promises.length && resolve(result);
        },
        (reason) => {
          count++;
          result[index] = { status: "fulfilled", reason };
          count === promises.length && resolve(result);
        }
      );
    });
  });
}

/**
 * Promise.any
 * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
 */
function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    let errors = []; // 存储结果
    let count = 0; // 计数器
    promises.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          resolve(value);
        },
        (reason) => {
          count++;
          errors[index] = reason;
          count === promises.length && reject(new AggregateError(errors));
        }
      );
    });
  });
}

/**
 * Promise.race
 * @param {iterable} promises 一个promise的iterable类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
 */
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach((item) => {
      Promise.resolve(item).then.resolve(item).then(resolve, reject);
    });
  });
}
