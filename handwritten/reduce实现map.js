function myMap(array, fn) {
  return array.reduce((pre, cur, index, arr) => {
    return pre.concat(fn(cur, index, arr));
  }, []);
}

Array.prototype.map = function (fn) {
  const array = this;
  return array.reduce((pre, cur, index) => {
    return pre.concat(fn(cur, index, array));
  }, []);
};
