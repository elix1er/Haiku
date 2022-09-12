// This source comes from https://levelup.gitconnected.com/finding-the-shortest-path-in-javascript-dijkstras-algorithm-8d16451eea34
// Thanks to noam sauer-utley

// let graphSample = {
//   start: { A: 5, B: 2 },
//   A: { C: 4, D: 2 },
//   B: { A: 8, D: 7 },
//   C: { D: 6, finish: 3 },
//   D: { finish: 1 },
//   finish: {}
// };

class AlgoDIJKSTRA {
  static solve(graph) {
    let costs = Object.assign({ finish: Infinity }, graph.start);
    let parents = { finish: null };
    for (let child in graph.start) {
      parents[child] = 'start';
    }

    let processed = [];
    let node = LOWEST_COST_NODE(costs, processed);

    while (node) {
      let cost = costs[node];
      let children = graph[node];
      for (let n in children) {
        let newCost = cost + children[n];
        if (!costs[n]) {
          costs[n] = newCost;
          parents[n] = node;
        }
        if (costs[n] > newCost) {
          costs[n] = newCost;
          parents[n] = node;
        }
      }
      processed.push(node);
      node = LOWEST_COST_NODE(costs, processed);
    }

    let optimalPath = ['finish'];
    let parent = parents.finish;
    while (parent) {
      optimalPath.push(parent);
      parent = parents[parent];
    }

    optimalPath.reverse();

    let results = {
      distance: costs.finish,
      path: optimalPath
    };

    return results;
  }
}

module.exports.AlgoDIJKSTRA = AlgoDIJKSTRA;

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function LOWEST_COST_NODE(costs, processed) {
  return Object.keys(costs).reduce((lowest, node) => {
    if (lowest === null || costs[node] < costs[lowest]) {
      if (!processed.includes(node)) {
        lowest = node;
      }
    }
    return lowest;
  }, null);
}