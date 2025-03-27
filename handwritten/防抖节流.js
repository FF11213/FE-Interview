/**
 * 防抖函数
 * @param {*} fn
 * @param {*} delay
 */
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param {*} fn
 * @param {*} delay
 * @returns
 */
function throttle(fn, delay) {
  let pre = 0;
  return function (...args) {
    let now = Date.now();
    if (now - pre > delay) {
      fn.apply(this, args);
      pre = now;
    }
  };
}
function throttle(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}