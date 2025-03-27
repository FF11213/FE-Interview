function random5() {
  return Math.floor(Math.random() * 5);
}

function random7() {
  while (true) {
    // 生成一个0到24之间的随机整数
    let num = 5 * random5() + random5();
    // 如果这个整数在0到20之间，我们就返回它模7的结果
    if (num < 21) {
      return num % 7;
    }
  }
}

console.log(random7());
