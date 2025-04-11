// 双端 diff 算法
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
