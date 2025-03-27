/**
 * @description: 前序遍历：根左右
 */
function preorderTraversal(node) {
  if (!node) return;
  console.log(node.value); // 处理节点
  preorderTraversal(node.left);
  preorderTraversal(node.right);
}

/**
 * @description: 中序遍历：左根右
 */
function inorderTraversal(node) {
  if (!node) return;
  inorderTraversal(node.left);
  console.log(node.value); // 处理节点
  inorderTraversal(node.right);
}

/**
 * @description: 后序遍历：左右根
 */
function postorderTraversal(node) {
  if (!node) return;
  postorderTraversal(node.left);
  postorderTraversal(node.right);
  console.log(node.value); // 处理节点
}
