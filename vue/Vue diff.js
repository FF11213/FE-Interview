// vue2 双端 diff 算法
function patchKeyedChildren(n1, n2, container) {
  const oldChildren = n1.children;
  const newChildren = n2.children;

  // 1. 获取新旧 children 的首尾索引
  // 2. 从新旧 children 的首尾索引开始向中间遍历，直到遍历完毕
  // 3. 遍历过程中，对比新旧 children 的节点，找到相同节点后，调用 patch 方法进行更新
  // 4. 如果新旧 children 的节点不一样，调用 mountElement 方法进行挂载
  // 5. 遍历结束后，如果新 children 还有剩余节点，调用 mountElement 方法进行挂载
  // 6. 遍历结束后，如果旧 children 还有剩余节点，调用 unmountNode 方法进行卸载

  let oldStartIdx = 0;
  let oldEndIdx = oldChildren.length - 1;
  let newStartIdx = 0;
  let newEndIdx = newChildren.length - 1;

  let oldStartVNode = oldChildren[oldStartIdx];
  let oldEndVNode = oldChildren[oldEndIdx];
  let newStartVNode = newChildren[newStartIdx];
  let newEndVNode = newChildren[newEndIdx];

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVNode.key === newStartVNode.key) {
      patch(oldStartVNode, newStartVNode, container);
      oldStartVNode = oldChildren[++oldStartIdx];
      newStartVNode = newChildren[++newStartIdx];
    } else if (oldEndVNode.key === newEndVNode.key) {
      patch(oldEndVNode, newEndVNode, container);
      oldEndVNode = oldChildren[--oldEndIdx];
      newEndVNode = newChildren[--newEndIdx];
    } else if (oldStartVNode.key === newEndVNode.key) {
      patch(oldStartVNode, newEndVNode, container);
      insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling);
      oldStartVNode = oldChildren[++oldStartIdx];
      newEndVNode = newChildren[--newEndIdx];
    } else if (oldEndVNode.key === newStartVNode.key) {
      patch(oldEndVNode, newStartVNode, container);
      insert(oldEndVNode.el, container, oldStartVNode.el);
      oldEndVNode = oldChildren[--oldEndIdx];
      newStartVNode = newChildren[++newStartIdx];
    } else {
      const idxInOld = oldChildren.findIndex((node) => node.key === newStartVNode.key);
      if (idxInOld >= 0) {
        const vnodeToMove = oldChildren[idxInOld];
        patch(vnodeToMove, newStartVNode, container);
        insert(vnodeToMove.el, container, oldStartVNode.el);
        oldChildren[idxInOld] = undefined;
      } else {
        // 未找到新 children 的节点在旧 children 中的对应节点，说明是新增节点2
        patch(null, newStartVNode, container, oldStartVNode.el);
      }
      newStartVNode = newChildren[++newStartIdx];
    }
  }

  // 旧节点遍历完，还有新节点
  if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
    const anchor = newChildren[newEndIdx + 1] ? newChildren[newEndIdx + 1].el : null;
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      patch(null, newChildren[i], container, anchor);
    }
  }
  // 新节点遍历完，还有旧节点
  else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      unmount(oldChildren[i]);
    }
  }
}

// vue3 diff 算法
const patchKeyedChildren = (oldChildren, newChildren, container, parentAnchor) => {
  // 索引
  let i = 0;
  // 新的子节点的长度
  const newChildrenLength = newChildren.length;
  // 旧的子节点最大（最后一个）下标
  let oldChildrenEnd = oldChildren.length - 1;
  // 新的子节点最大（最后一个）下标
  let newChildrenEnd = newChildrenLength - 1;

  // 1. 自前向后的 diff 对比。经过该循环之后，从前开始的相同 vnode 将被处理
  while (i <= oldChildrenEnd && i <= newChildrenEnd) {
    const oldVNode = oldChildren[i];
    const newVNode = normalizeVNode(newChildren[i]);
    // 如果 oldVNode 和 newVNode 被认为是同一个 vnode，则直接 patch 即可
    if (isSameVNodeType(oldVNode, newVNode)) {
      patch(oldVNode, newVNode, container, null);
    }
    // 如果不被认为是同一个 vnode，则直接跳出循环
    else {
      break;
    }
    // 下标自增
    i++;
  }

  // 2. 自后向前的 diff 对比。经过该循环之后，从后开始的相同 vnode 将被处理
  while (i <= oldChildrenEnd && i <= newChildrenEnd) {
    const oldVNode = oldChildren[oldChildrenEnd];
    const newVNode = normalizeVNode(newChildren[newChildrenEnd]);
    if (isSameVNodeType(oldVNode, newVNode)) {
      patch(oldVNode, newVNode, container, null);
    } else {
      break;
    }
    oldChildrenEnd--;
    newChildrenEnd--;
  }

  // 3. 多余的新节点
  if (i > oldChildrenEnd && i <= newChildrenEnd) {
    const nextPos = newChildrenEnd + 1;
    const anchor = nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor;
    while (i <= newChildrenEnd) {
      patch(null, normalizeVNode(newChildren[i]), container, anchor);
      i++;
    }
  }

  // 4. 多余的旧节点
  else if (i > newChildrenEnd && i <= oldChildrenEnd) {
    while (i <= oldChildrenEnd) {
      unmount(oldChildren[i]);
      i++;
    }
  }

  // 5. 乱序的 diff 比对
  else {
    // 旧子节点的开始索引：oldChildrenStart
    const oldStartIndex = i;
    // 新子节点的开始索引：newChildrenStart
    const newStartIndex = i;
    // 5.1 创建一个 <key（新节点的 key）:index（新节点的位置）> 的 Map 对象 keyToNewIndexMap。
    // 通过该对象可知：新的 child（根据 key 判断指定 child） 更新后的位置（根据对应的 index 判断）在哪里
    const keyToNewIndexMap = new Map();
    // 通过循环为 keyToNewIndexMap 填充值（s2 = newChildrenStart; e2 = newChildrenEnd）
    for (i = newStartIndex; i <= newChildrenEnd; i++) {
      // 从 newChildren 中根据开始索引获取每一个 child（c2 = newChildren）
      const nextChild = normalizeVNode(newChildren[i]);
      // child 必须存在 key（这也是为什么 v-for 必须要有 key 的原因）
      if (nextChild.key != null) {
        // 把 key 和 对应的索引，放到 keyToNewIndexMap 对象中
        keyToNewIndexMap.set(nextChild.key, i);
      }
    }

    // 5.2 循环 oldChildren ，并尝试进行 patch（打补丁）或 unmount（删除）旧节点
    let j;
    // 记录已经修复的新节点数量
    let patched = 0;
    // 新节点待修补的数量 = newChildrenEnd - newChildrenStart + 1
    const toBePatched = newChildrenEnd - newStartIndex + 1;
    // 标记位：节点是否需要移动
    let moved = false;
    // 配合 moved 进行使用，它始终保存当前最大的 index 值
    let maxNewIndexSoFar = 0;
    // 创建一个 Array 的对象，用来确定最长递增子序列。
    // 它的下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》
    // 元素表示：《对应旧节点的下标（oldIndex），永远 +1》
    // 但是，需要特别注意的是：oldIndex 的值应该永远 +1 （ 因为 0 代表了特殊含义，他表示《新节点没有找到对应的旧节点，此时需要新增新节点》）。
    // 即：旧节点下标为 0， 但是记录时会被记录为 1
    // 初始化时，所有的元素为 0
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
    // 遍历 oldChildren（s1 = oldChildrenStart; e1 = oldChildrenEnd），获取旧节点
    for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
      // 获取旧节点
      const prevChild = oldChildren[i];
      // 如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
      if (patched >= toBePatched) {
        // 所有的节点都已经更新完成，剩余的旧节点全部删除即可
        unmount(prevChild);
        continue;
      }
      // 新节点需要存在的位置，需要根据旧节点来进行寻找（包含已处理的节点。即：n-c 被认为是 1）
      let newIndex;
      // 旧节点的 key 存在时
      if (prevChild.key != null) {
        // 根据旧节点的 key，从 keyToNewIndexMap 中可以获取到新节点对应的位置
        newIndex = keyToNewIndexMap.get(prevChild.key);
      } else {
        // 旧节点的 key 不存在（无 key 节点）
        // 那么我们就遍历所有的新节点，找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》，
        // 如果能找到，那么 newIndex = 该新节点索引
        for (j = newStartIndex; j <= newChildrenEnd; j++) {
          // 找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》
          if (newIndexToOldIndexMap[j - newStartIndex] === 0 && isSameVNodeType(prevChild, newChildren[j])) {
            // 如果能找到，那么 newIndex = 该新节点索引
            newIndex = j;
            break;
          }
        }
      }
      // 最终没有找到新节点的索引，则证明：当前旧节点没有对应的新节点
      if (newIndex === undefined) {
        // 此时，直接删除即可
        unmount(prevChild);
      }
      // 当前旧节点找到了对应的新节点，那么接下来就是要判断对于该新节点而言，是要 patch（打补丁）还是 move（移动）
      else {
        // 为 newIndexToOldIndexMap 填充值：下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，
        // 元素表示：《对应旧节点的下标（oldIndex），永远 +1》
        // 因为 newIndex 包含已处理的节点，所以需要减去 s2（s2 = newChildrenStart）表示：不计算已处理的节点
        newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1;
        // maxNewIndexSoFar 会存储当前最大的 newIndex，它应该是一个递增的，如果没有递增，则证明有节点需要移动
        if (newIndex >= maxNewIndexSoFar) {
          // 持续递增
          maxNewIndexSoFar = newIndex;
        } else {
          // 没有递增，则需要移动，moved = true
          moved = true;
        }
        // 打补丁
        patch(prevChild, newChildren[newIndex], container, null);
        // 自增已处理的节点数量
        patched++;
      }
    }

    // 5.3 针对移动和挂载的处理
    // 仅当节点需要移动的时候，我们才需要生成最长递增子序列，否则只需要有一个空数组即可
    const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
    // j >= 0 表示：初始值为 最长递增子序列的最后下标
    // j < 0 表示：《不存在》最长递增子序列。
    j = increasingNewIndexSequence.length - 1;
    // 倒序循环，以便我们可以使用最后修补的节点作为锚点
    for (i = toBePatched - 1; i >= 0; i--) {
      // nextIndex（需要更新的新节点下标） = newChildrenStart + i
      const nextIndex = newStartIndex + i;
      // 根据 nextIndex 拿到要处理的 新节点
      const nextChild = newChildren[nextIndex];
      // 获取锚点（是否超过了最长长度）
      const anchor = nextIndex + 1 < newChildrenLength ? newChildren[nextIndex + 1].el : parentAnchor;
      // 如果 newIndexToOldIndexMap 中保存的 value = 0，则表示：新节点没有用对应的旧节点，此时需要挂载新节点
      if (newIndexToOldIndexMap[i] === 0) {
        // 挂载新节点
        patch(null, nextChild, container, anchor);
      }
      // moved 为 true，表示需要移动
      else if (moved) {
        // j < 0 表示：不存在 最长递增子序列
        // i !== increasingNewIndexSequence[j] 表示：当前节点不在最后位置
        // 那么此时就需要 move （移动）
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          move(nextChild, container, anchor);
        } else {
          // j 随着循环递减
          j--;
        }
      }
    }
  }
};
