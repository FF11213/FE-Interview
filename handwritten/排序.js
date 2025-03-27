const arr = [21, 3, 24, 341, 23, 212, 34, 545, 6, 4, 1, 3123, 34, 5, 34, 5, 532];
/**
 * @description: 冒泡排序
 * 时间复杂度: O(n^2)
 * 空间复杂度: O(1)
 */
const bubbleSort = (arr) => {
  const len = arr.length;
  if (len < 2) return arr;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};
// console.log(bubbleSort(arr));

/**
 * @description: 插入排序
 * 时间复杂度: O(n^2)
 * 空间复杂度: O(1)
 */
const insertSort = (arr) => {
  let len = arr.length;
  let cur, pre;
  for (let i = 1; i < len; i++) {
    cur = arr[i];
    pre = i - 1;
    while (pre >= 0 && arr[pre] > cur) {
      arr[pre + 1] = arr[pre];
      pre--;
    }
    arr[pre + 1] = cur;
    console.log(arr);
  }
  return arr;
};
// console.log(insertSort(arr));

/**
 * @description: 选择排序
 * 时间复杂度: O(n^2)
 * 空间复杂度: O(1)
 */
const selectSort = (arr) => {
  const len = arr.length;
  let miniIndex;
  for (let i = 0; i < len - 1; i++) {
    miniIndex = i;
    for (let j = i + 1; j < len; j++) {
      if (arr[miniIndex] > arr[j]) {
        miniIndex = j;
      }
    }
    [arr[i], arr[miniIndex]] = [arr[miniIndex], arr[i]];
  }
  return arr;
};
console.log(selectSort(arr));
