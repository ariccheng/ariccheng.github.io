/* ---- Two-variable LP solver ------------------------------------------------
   Every constraint is {a, b, op, c} meaning a*x + b*y (op) c, with op one of
   "<=", ">=", "=". Non-negativity is added unless opts.free is set.
   solveLP enumerates corner points, which is exact for two variables and fast
   enough to run on every slider tick. verify.py checks the same numbers.    */
const EPS = 1e-9;

function asLE(k) {                       // every row as a*x + b*y <= c
  if (k.op === "<=") return [{a: k.a, b: k.b, c: k.c}];
  if (k.op === ">=") return [{a: -k.a, b: -k.b, c: -k.c}];
  return [{a: k.a, b: k.b, c: k.c}, {a: -k.a, b: -k.b, c: -k.c}];
}

function lhs(k, x, y) { return k.a * x + k.b * y; }

function satisfies(k, x, y, tol = 1e-7) {
  const v = lhs(k, x, y);
  if (k.op === "<=") return v <= k.c + tol;
  if (k.op === ">=") return v >= k.c - tol;
  return Math.abs(v - k.c) <= tol;
}

function isFeasible(cons, x, y, opts = {}) {
  if (!opts.free && (x < -1e-7 || y < -1e-7)) return false;
  return cons.every(k => satisfies(k, x, y));
}

/* corner points of the feasible region, in counter-clockwise order */
function corners(cons, opts = {}) {
  const rows = cons.flatMap(asLE);
  if (!opts.free) rows.push({a: -1, b: 0, c: 0}, {a: 0, b: -1, c: 0});
  const pts = [];
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const p = rows[i], q = rows[j], det = p.a * q.b - p.b * q.a;
    if (Math.abs(det) < EPS) continue;
    const x = (p.c * q.b - p.b * q.c) / det, y = (p.a * q.c - p.c * q.a) / det;
    if (rows.every(r => r.a * x + r.b * y <= r.c + 1e-7) &&
        !pts.some(t => Math.abs(t[0] - x) < 1e-7 && Math.abs(t[1] - y) < 1e-7))
      pts.push([x + 0, y + 0]);
  }
  if (pts.length > 2) {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
  }
  return pts;
}

/* Is the objective unbounded? For two variables it is enough to test a
   direction far out along each recession ray; we probe a fan of directions. */
function unboundedDirection(cons, obj, opts = {}) {
  const sign = obj.sense === "min" ? -1 : 1;
  const rows = cons.flatMap(asLE);
  if (!opts.free) rows.push({a: -1, b: 0, c: 0}, {a: 0, b: -1, c: 0});
  for (let k = 0; k < 720; k++) {
    const t = k / 720 * 2 * Math.PI, dx = Math.cos(t), dy = Math.sin(t);
    if (sign * (obj.cx * dx + obj.cy * dy) <= 1e-9) continue;
    if (rows.every(r => r.a * dx + r.b * dy <= 1e-12)) return [dx, dy];
  }
  return null;
}

/* status: "optimal" | "infeasible" | "unbounded" | "alternate" */
function solveLP(cons, obj, opts = {}) {
  const pts = corners(cons, opts);
  if (!pts.length) return {status: "infeasible", corners: []};
  if (unboundedDirection(cons, obj, opts)) return {status: "unbounded", corners: pts};
  const sign = obj.sense === "min" ? -1 : 1, val = p => obj.cx * p[0] + obj.cy * p[1];
  let best = pts[0];
  for (const p of pts) if (sign * val(p) > sign * val(best) + 1e-7) best = p;
  const ties = pts.filter(p => Math.abs(val(p) - val(best)) < 1e-7);
  return {status: ties.length > 1 ? "alternate" : "optimal",
          x: best[0], y: best[1], value: val(best), corners: pts, ties};
}

/* best lattice point (integer model); box bounds come from the LP corners */
function solveInteger(cons, obj, opts = {}) {
  const lp = solveLP(cons, obj, opts);
  if (lp.status === "infeasible" || lp.status === "unbounded") return {status: lp.status};
  const xs = lp.corners.map(p => p[0]), ys = lp.corners.map(p => p[1]);
  const sign = obj.sense === "min" ? -1 : 1;
  let best = null;
  for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++)
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      if (!isFeasible(cons, x, y, opts)) continue;
      const v = obj.cx * x + obj.cy * y;
      if (!best || sign * v > sign * best.value + 1e-9) best = {x, y, value: v};
    }
  return best ? Object.assign({status: "optimal"}, best) : {status: "infeasible"};
}

/* ---- sensitivity ----------------------------------------------------------
   Ranges are found by bisection on the event that the optimal corner moves
   (objective coefficients) or the shadow price stops holding (right-hand
   sides). Each search runs once per model change, not per frame.          */
const samePoint = (p, q) => p && q && Math.abs(p.x - q.x) < 1e-6 && Math.abs(p.y - q.y) < 1e-6;

function edge(test, from, step, limit) {          // last value from `from` where test holds
  let ok = from, d = step;
  while (Math.abs(ok + d - from) < limit && test(ok + d)) { ok += d; d *= 2; }
  if (Math.abs(ok + d - from) >= limit && test(from + Math.sign(step) * limit)) return Infinity;
  let bad = ok + d;
  for (let i = 0; i < 60; i++) { const m = (ok + bad) / 2; test(m) ? ok = m : bad = m; }
  return Math.abs(ok - from);
}

function objectiveRange(cons, obj, which) {        // which: "cx" | "cy"
  const base = solveLP(cons, obj);
  const test = v => samePoint(solveLP(cons, Object.assign({}, obj, {[which]: v})), base);
  return {inc: edge(test, obj[which], 1, 1e6), dec: edge(test, obj[which], -1, 1e6)};
}

function shadowPrice(cons, obj, i, h = 1e-5) {
  const at = d => solveLP(cons.map((k, j) => j === i ? Object.assign({}, k, {c: k.c + d}) : k), obj);
  const up = at(h), dn = at(-h);
  if (up.value === undefined || dn.value === undefined) return NaN;
  return (up.value - dn.value) / (2 * h);
}

function rhsRange(cons, obj, i) {
  const base = solveLP(cons, obj), sp = shadowPrice(cons, obj, i);
  const test = c => {
    const r = solveLP(cons.map((k, j) => j === i ? Object.assign({}, k, {c}) : k), obj);
    return r.value !== undefined && Math.abs(r.value - base.value - sp * (c - cons[i].c)) < 1e-6;
  };
  return {inc: edge(test, cons[i].c, 1, 1e6), dec: edge(test, cons[i].c, -1, 1e6)};
}

function sensitivity(cons, obj) {
  const sol = solveLP(cons, obj);
  return {
    sol,
    variables: ["cx", "cy"].map((w, n) => {
      const r = objectiveRange(cons, obj, w), val = n ? sol.y : sol.x;
      // reduced cost: 0 for a variable in the plan; otherwise how far its coefficient must improve
      return {final: val, coef: obj[w], inc: r.inc, dec: r.dec,
              reduced: Math.abs(val) > 1e-7 ? 0 : (obj.sense === "min" ? r.dec : -r.inc)};
    }),
    constraints: cons.map((k, i) => {
      const r = rhsRange(cons, obj, i), used = lhs(k, sol.x, sol.y);
      return {final: used, rhs: k.c, shadow: shadowPrice(cons, obj, i), inc: r.inc, dec: r.dec,
              slack: Math.abs(k.c - used), binding: Math.abs(k.c - used) < 1e-7};
    })
  };
}
