(() => {
  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function findPath(start, goal, isBlocked, maxNodes = 600) {
    const open = new Map();
    const closed = new Set();

    function key(p) {
      return `${p.x},${p.y}`;
    }

    const startKey = key(start);
    open.set(startKey, {
      pos: start,
      g: 0,
      f: heuristic(start, goal),
      parent: null,
    });

    let processed = 0;

    while (open.size > 0 && processed < maxNodes) {
      // get node with lowest f
      let currentKey = null;
      let current = null;
      for (const [k, node] of open) {
        if (!current || node.f < current.f) {
          current = node;
          currentKey = k;
        }
      }

      if (!current) break;

      if (current.pos.x === goal.x && current.pos.y === goal.y) {
        return reconstruct(current);
      }

      open.delete(currentKey);
      closed.add(currentKey);
      processed++;

      const neighbors = [
        { x: current.pos.x + 1, y: current.pos.y },
        { x: current.pos.x - 1, y: current.pos.y },
        { x: current.pos.x, y: current.pos.y + 1 },
        { x: current.pos.x, y: current.pos.y - 1 },
      ];

      for (const n of neighbors) {
        const nk = key(n);
        if (closed.has(nk) || isBlocked(n.x, n.y)) continue;
        const tentativeG = current.g + 1;
        const existing = open.get(nk);
        if (!existing || tentativeG < existing.g) {
          open.set(nk, {
            pos: n,
            g: tentativeG,
            f: tentativeG + heuristic(n, goal),
            parent: current,
          });
        }
      }
    }
    return null;
  }

  function reconstruct(node) {
    const path = [];
    let current = node;
    while (current) {
      path.push(current.pos);
      current = current.parent;
    }
    return path.reverse();
  }

  window.findPath = findPath;
})();
