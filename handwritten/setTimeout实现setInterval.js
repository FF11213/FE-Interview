function myInterval(fn, time) {
  let timer = null;
  function interval() {
    timer = setTimeout(() => {
      fn();
      interval();
    }, time);
  }
  interval();

  return {
    cancel: () => {
      clearTimeout(timer);
    },
  };
}
