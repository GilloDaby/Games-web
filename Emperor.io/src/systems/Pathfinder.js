// Lightweight path planner on continuous space using a visibility graph around circular obstacles.
export default class Pathfinder {
  constructor() {
    this.sampleAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
  }

  /**
   * @param {{x:number,y:number}} start
   * @param {{x:number,y:number}} goal
   * @param {Array<{x:number,y:number,r:number,id?:string}>} obstacles
   * @param {{clearance?:number, allowGoalInside?:boolean}} options
   * @returns {Array<{x:number,y:number}>} waypoints (goal inclusive, start omitted)
   */
  findPath(start, goal, obstacles = [], options = {}) {
    if (!goal) return [];
    const clearance = options.clearance ?? 0.35;
    const allowGoalInside = options.allowGoalInside ?? true;
    const usableObstacles = allowGoalInside ? obstacles.filter((o) => !this.pointInside(goal, o, clearance)) : obstacles;

    if (this.lineClear(start, goal, usableObstacles, clearance)) {
      return [goal];
    }

    const nodes = [];
    const addNode = (p, kind = "p") => {
      nodes.push({ ...p, kind });
    };

    addNode(start, "start");
    addNode(goal, "goal");

    for (const obs of usableObstacles) {
      this.sampleAroundObstacle(obs, clearance).forEach((p) => addNode(p, "obs"));
    }

    const edges = this.buildEdges(nodes, usableObstacles, clearance);
    const path = this.runDijkstra(nodes, edges);
    if (!path || path.length === 0) {
      return this.lineClear(start, goal, usableObstacles, clearance) ? [goal] : [];
    }
    const waypoints = path.slice(1); // drop the start node
    return this.compress(waypoints, usableObstacles, clearance);
  }

  sampleAroundObstacle(obs, clearance) {
    const pts = [];
    const r = obs.r + clearance * 1.3;
    for (const ang of this.sampleAngles) {
      pts.push({
        x: obs.x + Math.cos(ang) * r,
        y: obs.y + Math.sin(ang) * r,
      });
    }
    return pts;
  }

  buildEdges(nodes, obstacles, clearance) {
    const edges = new Map(); // key -> array of {to, cost}
    const addEdge = (i, j, cost) => {
      if (!edges.has(i)) edges.set(i, []);
      edges.get(i).push({ to: j, cost });
    };

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (this.lineClear(a, b, obstacles, clearance)) {
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          addEdge(i, j, d);
          addEdge(j, i, d);
        }
      }
    }
    return edges;
  }

  runDijkstra(nodes, edges) {
    const dist = new Array(nodes.length).fill(Infinity);
    const prev = new Array(nodes.length).fill(-1);
    const visited = new Array(nodes.length).fill(false);
    dist[0] = 0; // start is index 0

    for (let _ = 0; _ < nodes.length; _++) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        if (!visited[i] && dist[i] < best) {
          best = dist[i];
          u = i;
        }
      }
      if (u === -1) break;
      visited[u] = true;
      if (nodes[u].kind === "goal") break;
      const adj = edges.get(u) || [];
      for (const { to, cost } of adj) {
        if (visited[to]) continue;
        const nd = dist[u] + cost;
        if (nd < dist[to]) {
          dist[to] = nd;
          prev[to] = u;
        }
      }
    }

    let goalIndex = nodes.findIndex((n) => n.kind === "goal");
    if (goalIndex === -1 || dist[goalIndex] === Infinity) return [];

    const path = [];
    let cur = goalIndex;
    while (cur !== -1) {
      path.push({ x: nodes[cur].x, y: nodes[cur].y });
      cur = prev[cur];
    }
    path.reverse();
    return path;
  }

  compress(path, obstacles, clearance) {
    if (path.length <= 2) return path;
    const out = [path[0]];
    let anchor = path[0];
    for (let i = 1; i < path.length - 1; i++) {
      const next = path[i + 1];
      if (!this.lineClear(anchor, next, obstacles, clearance)) {
        out.push(path[i]);
        anchor = path[i];
      }
    }
    out.push(path[path.length - 1]);
    return out;
  }

  lineClear(a, b, obstacles, clearance) {
    for (const obs of obstacles) {
      if (this.segmentIntersectsCircle(a, b, obs, obs.r + clearance)) return false;
    }
    return true;
  }

  segmentIntersectsCircle(a, b, circle, radius) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const acx = circle.x - a.x;
    const acy = circle.y - a.y;
    const abLenSq = abx * abx + aby * aby;
    const proj = abLenSq === 0 ? 0 : (acx * abx + acy * aby) / abLenSq;
    const t = Math.max(0, Math.min(1, proj));
    const closestX = a.x + abx * t;
    const closestY = a.y + aby * t;
    const dx = closestX - circle.x;
    const dy = closestY - circle.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  pointInside(p, obs, clearance) {
    return Math.hypot(p.x - obs.x, p.y - obs.y) <= obs.r + clearance * 0.5;
  }
}
