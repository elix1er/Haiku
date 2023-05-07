interface Visited {
  x: number;
  y: number;
  originX: number;
  originY: number;
};

class Pathfinder {
  static solve(grid: Array<number>, columns: number, startCoord: [number, number], endCoord: [number, number]): Array<[number, number]> | null {
    const visitedMap = new Map<string, Visited>();
    const frontierCoordList: Array<[number, number]> = [];
    let find = false;

    frontierCoordList.push(startCoord);
    visitedMap.set(startCoord[0] + ';' + startCoord[1], { x: startCoord[0], y: startCoord[1], originX: -1, originY: -1 });

    while (!find) {
      const frontierCoord = frontierCoordList.shift();
      if (!frontierCoord) {
        return null;
      }

      const dirs = GET_DIRECTIONS_FROM_HEURISTIC(frontierCoord, endCoord);

      for (const dir of dirs) {
        const x = frontierCoord[0] + dir[0];
        const y = frontierCoord[1] + dir[1];
        if (grid.length < columns * (y + 1) || grid[columns * y + x] == 1 || visitedMap.get(x + ';' + y)) {
          continue;
        }

        if (x == endCoord[0] && y == endCoord[1]) {
          find = true;
        }

        frontierCoordList.push([x, y]);
        visitedMap.set(x + ';' + y, { x: x, y: y, originX: frontierCoord[0], originY: frontierCoord[1] });
      }
    }

    const path: Array<[number, number]> = [];
    let currentVisited = visitedMap.get(endCoord[0] + ';' + endCoord[1]);

    while (currentVisited) {
      path.unshift([currentVisited.x, currentVisited.y]);
      currentVisited = visitedMap.get(currentVisited.originX + ';' + currentVisited.originY);
    }

    return path;
  }
}

export { Pathfinder };

// -------------------------------------------------------------------------------------------
// HELPFUL
// -------------------------------------------------------------------------------------------

function GET_DIRECTIONS_FROM_HEURISTIC(srcCoord: [number, number], dstCoord: [number, number]): Array<[number, number]> {
  const directions: Array<[number, number]> = [
    [+0, -1],
    [+1, +0],
    [+0, +1],
    [-1, +0]
  ];

  const dx = dstCoord[0] - srcCoord[0];
  const dy = dstCoord[1] - srcCoord[1];

  return directions.sort((a, b) => {
    const lengthA = Math.sqrt((dx + a[0]) * (dx + a[0]) + (dy + a[1]) * (dy + a[1]));
    const lengthB = Math.sqrt((dx + b[0]) * (dx + b[0]) + (dy + b[1]) * (dy + b[1]));
    return lengthA - lengthB;
  });
}