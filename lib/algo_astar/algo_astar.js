class AlgoASTAR {
  static solve(grid, columns, startCoord, endCoord) {
    let visitedMap = {/* x;y: {x, y, originX, originY} */};
    let frontierCoordList = [];
    let find = false;

    frontierCoordList.push(startCoord);
    visitedMap[startCoord[0] + ';' + startCoord[1]] = { x: startCoord[0], y: startCoord[1], originX: startCoord[0], originY: startCoord[1] };

    while (!find) {
      if (frontierCoordList.length == 0) {
        return null;
      }

      let frontierCoord = frontierCoordList.shift();
      let dirs = GET_DIRECTIONS_FROM_HEURISTIC(frontierCoord, endCoord);

      for (let dir of dirs) {
        let x = frontierCoord[0] + dir[0];
        let y = frontierCoord[1] + dir[1];
        if (grid.length < columns * (y + 1) || grid[columns * y + x] == 1 || visitedMap[x + ';' + y]) {
          continue;
        }

        if (x == endCoord[0] && y == endCoord[1]) {
          find = true;
        }

        frontierCoordList.push([x, y]);
        visitedMap[x + ';' + y] = { x: x, y: y, originX: frontierCoord[0], originY: frontierCoord[1] };
      }
    }

    let path = [];
    let currentVisited = visitedMap[endCoord[0] + ';' + endCoord[1]];
    while (currentVisited.x != startCoord[0] || currentVisited.y != startCoord[1]) {
      path.unshift([currentVisited.x, currentVisited.y]);
      currentVisited = visitedMap[currentVisited.originX + ';' + currentVisited.originY];
    }

    path.unshift([currentVisited.x, currentVisited.y]);
    return path;
  }
}

module.exports.AlgoASTAR = AlgoASTAR;

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function GET_DIRECTIONS_FROM_HEURISTIC(srcCoord, dstCoord) {
  let directions = [
    [+0, -1],
    [+1, +0],
    [+0, +1],
    [-1, +0]
  ];

  let dx = dstCoord[0] - srcCoord[0];
  let dy = dstCoord[1] - srcCoord[1];

  return directions.sort((a, b) => {
    let lengthA = Math.sqrt((dx + a[0]) * (dx + a[0]) + (dy + a[1]) * (dy + a[1]));
    let lengthB = Math.sqrt((dx + b[0]) * (dx + b[0]) + (dy + b[1]) * (dy + b[1]));
    return lengthA - lengthB;
  });
}