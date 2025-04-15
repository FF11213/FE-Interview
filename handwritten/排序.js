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
  }
  return arr;
};

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

/**
 * @description: 快速排序
 * 时间复杂度: O(nlogn)
 * 空间复杂度: O(logn)
 */
const quickSort = (arr) => {
  if (arr.length < 2) return arr;
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr.splice(pivotIndex, 1)[0];
  const left = arr.filter((item) => item < pivot);
  const right = arr.filter((item) => item > pivot);
  return quickSort(left).concat(pivot, quickSort(right));
};

/**
 * @description: 归并排序
 * 时间复杂度: O(nlogn)
 * 空间复杂度: O(n)
 */
const mergeSort = (arr) => {
  if (arr.length < 2) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
};
const merge = (left, right) => {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
};

console.log(quickSort(arr));
