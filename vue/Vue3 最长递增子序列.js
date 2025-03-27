const test = [9, 2, 5, 3, 7, 101, 4, 18, 1];
function getSequence(arr) {
  const p = arr.slice(); // 回溯专用
  const result = [0]; // 记录下标
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    // 排除了等于0的情况，原因是0并不代表任何dom元素，只是用来做占位的
    // if (arrI !== 0) {
    j = result[result.length - 1];
    // 当前值大于子序列最后一项
    if (arr[j] < arrI) {
      // p内存储当前值的前一位下标
      p[i] = j;
      // 存储当前值的下标
      result.push(i);
      continue;
    }
    u = 0;
    v = result.length - 1;
    // 当前数值小于子序列最后一项时，使用二分法找到第一个大于当前数值的下标
    while (u < v) {
      console.log(u, v);
      c = ((u + v) / 2) | 0;
      if (arr[result[c]] < arrI) {
        u = c + 1;
      } else {
        v = c;
      }
    }
    if (arrI < arr[result[u]]) {
      // 第一位不需要操作，因为它没有前一项
      if (u > 0) {
        // p内存储找到的下标的前一位
        p[i] = result[u - 1];
      }
      // 找到下标，直接替换result中的数值
      result[u] = i;
    }
    // }
    console.log(result, p);
  }
  console.log(result, p);
  u = result.length;
  v = result[u - 1];
  // 回溯，从最后一位开始，将result全部覆盖，
  while (u-- > 0) {
    console.log(result[u], v);
    result[u] = v;
    v = p[v];
  }
  // console.log(result, arr, p);
  return result;
}
getSequence(test);

function getOfLIS(nums) {
  const n = nums.length;
  if (n <= 1) return nums;

  let result = [0]; // 由原来存储具体值改为存储下标
  let chain = new Map(); // 通过下标存储映射关系
  for (let i = 0; i < n; i++) {
    const j = result[result.length - 1];
    if (nums[i] > nums[j]) {
      chain.set(i, { val: i, pre: j });
      result.push(i);
    } else {
      let left = 0,
        right = result.length;
      while (left < right) {
        const mid = (left + right) >> 1;
        if (nums[result[mid]] < nums[i]) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      chain.set(i, { val: i, pre: result[left - 1] });
      result[left] = i;
    }
    console.log(chain);
  }
  let preIdx = result[result.length - 1];
  let len = result.length;
  // 从后往前进行回溯，修正覆盖result中的值，找到正确的顺序
  while (chain.get(preIdx)) {
    let lastObj = chain.get(preIdx);
    result[--len] = nums[lastObj.val];
    preIdx = lastObj.pre;
  }
  return result;
}

// console.log(getOfLIS(test)); // [2,3,4,18]
