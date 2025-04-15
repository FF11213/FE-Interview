class MyPromise {
  constructor(executor) {
    this.status = "pending"; // 'fulfuilled' 'rejected'
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.status === "pending") {
        this.status = "fulfuilled";
        this.value = value;
        while (this.onFulfilledCallbacks.length) {
          this.onFulfilledCallbacks.shift()(value);
        }
      }
    };

    const reject = (error) => {
      if (this.status === "pending") {
        this.status = "rejected";
        this.reason = error;
        while (this.onRejectedCallbacks.length) {
          this.onRejectedCallbacks.shift()(reason);
        }
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };
    const thenPromise = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            const res = onFulfilled(this.value);
            reslovePromise(thenPromise, res, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };
      const rejectedMiscrotask = () => {
        queueMicrotask(() => {
          try {
            const res = onRejected(this.reason);
            reslovePromise(thenPromise, res, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };
      if (this.status === "fulfuilled") {
        fulfilledMicrotask();
      } else if (this.status === "rejected") {
        onRejected(rejectedMiscrotask);
      } else {
        this.onFulfilledCallbacks.push(fulfilledMicrotask);
        this.onRejectedCallbacks.push(rejectedMiscrotask);
      }
    });

    return thenPromise;
  }

  // resolve 静态方法
  static resolve(parameter) {
    // 如果传入 MyPromise 就直接返回
    if (parameter instanceof MyPromise) {
      return parameter;
    }

    // 转成常规方式
    return new MyPromise((resolve) => {
      resolve(parameter);
    });
  }
}

function reslovePromise(thenPromise, res, resolve, reject) {
  if (thenPromise === res) {
    return reject(new TypeError("Chaining cycle detected for promise #<Promise>"));
  }
  if (res instanceof MyPromise) {
    res.then(resolve, reject);
  } else {
    resolve(res);
  }
}

console.log(MyPromise);
// console.log(fn);
