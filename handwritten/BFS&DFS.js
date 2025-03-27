/* 
广度优先遍历（BFS）：
使用队列来实现BFS。
初始化一个队列，并将根节点入队。
循环直到队列为空：
出队一个节点并处理。
将该节点的所有子节点入队。
深度优先遍历（DFS）：
使用递归来实现DFS。
定义一个递归函数，传入当前节点。
处理当前节点。
递归调用该函数处理当前节点的所有子节点。 
*/

// 广度优先遍历（BFS）
function bfs(root) {
  if (!root) return;
  let queue = [root];
  while (queue.length > 0) {
    let node = queue.shift();
    console.log(node.value); // 处理节点
    if (node.children) {
      queue.push(...node.children);
    }
  }
}

// 深度优先遍历（DFS）
function dfs(node) {
  if (!node) return;
  console.log(node.value); // 处理节点
  if (node.children) {
    node.children.forEach((child) => dfs(child));
  }
}

// 示例树结构
const tree = {
  value: 1,
  children: [
    {
      value: 2,
      children: [
        { value: 4, children: [] },
        { value: 5, children: [] },
      ],
    },
    {
      value: 3,
      children: [
        { value: 6, children: [] },
        { value: 7, children: [] },
      ],
    },
  ],
};

// 测试
console.log("BFS:");
bfs(tree);

console.log("DFS:");
dfs(tree);
