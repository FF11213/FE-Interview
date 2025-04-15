function myInterval(fn, time = 0) {
  let timer = null;
  let startTime = Date.now();
  let loop = function () {
    timer = requestAnimationFrame(() => {
      let currentTime = Date.now();
      if (currentTime - startTime >= time) {
        fn();
        startTime = currentTime;
      }
      loop();
    });
  };
  timer = requestAnimationFrame(loop);
  return {
    timer,
    cancel: () => {
      cancelAnimationFrame(timer);
    },
  };
}

function mySetTimeout(fn, time = 0) {
  let timer = null;
  let startTime = Data.now();
  let loop = function () {
    let currentTime = Data.now();
    timer = requestAnimationFrame(loop);
    if (currentTime - startTime >= time) {
      startTime = currentTime;
      fn();
    }
  };
  timer = requestAnimationFrame(loop);
  return {
    timer,
    cancel: () => {
      cancelAnimationFrame(timer);
    },
  };
}
