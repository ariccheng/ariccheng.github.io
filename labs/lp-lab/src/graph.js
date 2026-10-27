/* ---- The graph -------------------------------------------------------------
   One SVG, redrawn from the view state on every change. Elements are keyed so
   that a line or corner that is already on screen is updated in place and
   only new elements play their entrance animation.                          */
const NS = "http://www.w3.org/2000/svg";
const PLOT = {W: 760, H: 560, L: 66, R: 26, T: 22, B: 58, XM: 14, YM: 24};
const X = v => PLOT.L + (PLOT.W - PLOT.L - PLOT.R) * v / PLOT.XM;
const Y = v => PLOT.H - PLOT.B - (PLOT.H - PLOT.B - PLOT.T) * v / PLOT.YM;
const fromPx = (px, py) => [(px - PLOT.L) / (PLOT.W - PLOT.L - PLOT.R) * PLOT.XM,
                            (PLOT.H - PLOT.B - py) / (PLOT.H - PLOT.B - PLOT.T) * PLOT.YM];

/* clip the plot box with half-planes a*x + b*y <= c (Sutherland–Hodgman) */
const BOX = [[0, 0], [PLOT.XM, 0], [PLOT.XM, PLOT.YM], [0, PLOT.YM]];
function clipPoly(poly, rows) {
  for (const r of rows) {
    const f = p => r.a * p[0] + r.b * p[1] - r.c, out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
      if (fp <= 1e-9) out.push(p);
      if ((fp < -1e-9 && fq > 1e-9) || (fp > 1e-9 && fq < -1e-9)) {
        const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
    poly = out;
    if (!poly.length) break;
  }
  return poly;
}
/* the part of a*x + b*y = c inside the plot box */
function segment(a, b, c) {
  const pts = [];
  const add = (x, y) => { if (x >= -1e-9 && x <= PLOT.XM + 1e-9 && y >= -1e-9 && y <= PLOT.YM + 1e-9 &&
                              !pts.some(p => Math.abs(p[0] - x) < 1e-7 && Math.abs(p[1] - y) < 1e-7)) pts.push([x, y]); };
  if (Math.abs(b) > 1e-12) { add(0, c / b); add(PLOT.XM, (c - a * PLOT.XM) / b); }
  if (Math.abs(a) > 1e-12) { add(c / a, 0); add((c - b * PLOT.YM) / a, PLOT.YM); }
  return pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : null;
}
const polyStr = poly => poly.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ");
const fmt = (v, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  return (Object.is(r, -0) ? 0 : r).toLocaleString("en-US", {maximumFractionDigits: d});
};
const money = (v, d = 2) => (v < -1e-9 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US",
  {minimumFractionDigits: Number.isInteger(Math.round(v * 100) / 100) ? 0 : d, maximumFractionDigits: d});

class Graph {
  constructor(svg) {
    this.svg = svg;
    svg.setAttribute("viewBox", `0 0 ${PLOT.W} ${PLOT.H}`);
    svg.innerHTML = `<defs><linearGradient id="regionFill" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#8C1D40" stop-opacity=".07"/><stop offset="1" stop-color="#8C1D40" stop-opacity=".2"/></linearGradient></defs><g class="g-grid"></g><g class="layer-half dimmable"></g><g class="layer-region dimmable"></g>
      <g class="layer-axes"></g><g class="layer-lines dimmable"></g><g class="layer-extra"></g><g class="layer-iso"></g>
      <g class="layer-corners dimmable"></g><g class="layer-pts"></g><rect class="g-hit" x="${PLOT.L}" y="${PLOT.T}"
      width="${PLOT.W - PLOT.L - PLOT.R}" height="${PLOT.H - PLOT.T - PLOT.B}"></rect><g class="layer-drag"></g>`;
    this.L = n => svg.querySelector(".layer-" + n);
    this.drawAxes();
    this.seen = new Set();
    this.onClick = null;
    const toPlot = e => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return fromPx(p.x, p.y);
    };
    svg.querySelector(".g-hit").addEventListener("click", e => { if (this.onClick) this.onClick(...toPlot(e)); });
    /* direct manipulation: drag a constraint line (changes its right-hand side) or the probe point */
    this.drag = null; this.probe = null;
    svg.addEventListener("pointerdown", e => {
      const h = e.target.closest(".g-grab, .g-probe");
      if (!h) return;
      e.preventDefault();
      const kind = h.classList.contains("g-probe") ? "probe" : "line";
      h.setPointerCapture(e.pointerId);
      svg.classList.add("dragging");
      const move = ev => {
        const [x, y] = toPlot(ev);
        if (kind === "line" && this.drag) this.drag.onDrag(this.drag.k.a * x + this.drag.k.b * y);
        if (kind === "probe" && this.probe) this.probe.onMove(Math.max(0, Math.min(PLOT.XM, x)), Math.max(0, Math.min(PLOT.YM, y)));
      };
      const up = () => { h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", up); h.removeEventListener("pointercancel", up); svg.classList.remove("dragging"); };
      h.addEventListener("pointermove", move); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up);
    });
  }
  drawAxes() {
    let g = "", a = "";
    for (let v = 0; v <= PLOT.XM; v += 1) g += `<line x1="${X(v)}" y1="${Y(0)}" x2="${X(v)}" y2="${Y(PLOT.YM)}"/>`;
    for (let v = 0; v <= PLOT.YM; v += 2) g += `<line x1="${X(0)}" y1="${Y(v)}" x2="${X(PLOT.XM)}" y2="${Y(v)}"/>`;
    this.svg.querySelector(".g-grid").innerHTML = g;
    a += `<line class="g-axis" x1="${X(0)}" y1="${Y(0)}" x2="${X(PLOT.XM)}" y2="${Y(0)}"/>
          <line class="g-axis" x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(PLOT.YM)}"/>`;
    for (let v = 0; v <= PLOT.XM; v += 2) a += `<text class="g-tick" x="${X(v)}" y="${Y(0) + 22}" text-anchor="middle">${v}</text>`;
    for (let v = 0; v <= PLOT.YM; v += 4) a += `<text class="g-tick" x="${X(0) - 10}" y="${Y(v) + 5}" text-anchor="end">${v}</text>`;
    a += `<text class="g-title" x="${X(PLOT.XM)}" y="${PLOT.H - 10}" text-anchor="end">Trail boards, T</text>
          <text class="g-title" transform="translate(18 ${Y(PLOT.YM)}) rotate(-90)" text-anchor="end">Summit boards, S</text>`;
    this.L("axes").innerHTML = a;
  }
  /* keyed element helper: returns [el, isNew] */
  keyed(layer, key, tag, cls) {
    let el = this.L(layer).querySelector(`[data-k="${key}"]`), fresh = false;
    if (!el) { el = document.createElementNS(NS, tag); el.dataset.k = key; this.L(layer).appendChild(el); fresh = true; }
    if (cls !== undefined) el.setAttribute("class", cls);
    return [el, fresh];
  }
  prune(layer, keep) {
    for (const el of [...this.L(layer).children]) if (!keep.has(el.dataset.k)) el.remove();
  }
  render(v) {
    this.svg.classList.toggle("dim", !!v.dim);
    /* half-planes (Lesson 1) */
    const keepHalf = new Set();
    for (const h of v.halves || []) {
      const k = v.cons[h.i];
      keepHalf.add(h.cls);
      const [el] = this.keyed("half", h.cls, "polygon", "g-half " + h.cls);
      el.setAttribute("points", polyStr(clipPoly(BOX, asLE(k))));
    }
    this.prune("half", keepHalf);
    /* feasible region */
    const keepReg = new Set();
    if (v.region) {
      const poly = clipPoly(BOX, (v.regionCons || v.cons).flatMap(asLE));
      if (poly.length > 2) {
        keepReg.add("r");
        const [el, fresh] = this.keyed("region", "r", "polygon");
        el.setAttribute("class", "g-region" + (fresh && v.animate !== false ? " enter" : ""));
        el.setAttribute("points", polyStr(poly));
      }
    }
    this.prune("region", keepReg);
    /* constraint lines */
    const keepLines = new Set();
    for (const [i, k] of v.cons.entries()) {
      if (!(v.lines || []).includes(i)) continue;
      const seg = segment(k.a, k.b, k.c), key = "l" + i;
      if (!seg) continue;
      keepLines.add(key); keepLines.add(key + "t");
      const [el, fresh] = this.keyed("lines", key, "line");
      el.setAttribute("class", "g-line " + k.cls + (fresh && v.animate !== false ? " draw" : ""));
      el.setAttribute("pathLength", "1");
      el.setAttribute("x1", X(seg[0][0])); el.setAttribute("y1", Y(seg[0][1]));
      el.setAttribute("x2", X(seg[1][0])); el.setAttribute("y2", Y(seg[1][1]));
      const [t] = this.keyed("lines", key + "t", "text", "g-lab " + k.cls);
      /* label runs along the line, just above it */
      const lp = k.labelAt ? k.labelAt(k) : seg[1];
      let ang = Math.atan2(Y(seg[1][1]) - Y(seg[0][1]), X(seg[1][0]) - X(seg[0][0])) * 180 / Math.PI;
      if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      t.setAttribute("x", X(lp[0])); t.setAttribute("y", Y(lp[1]) + (k.below ? 20 : -9));
      t.setAttribute("transform", `rotate(${ang.toFixed(2)} ${X(lp[0]).toFixed(1)} ${Y(lp[1]).toFixed(1)})`);
      t.setAttribute("text-anchor", "middle");
      t.textContent = k.label;
    }
    this.prune("lines", keepLines);
    /* iso-profit line */
    const keepIso = new Set();
    if (v.iso) {
      const seg = segment(v.iso.cx, v.iso.cy, v.iso.value);
      if (seg) {
        keepIso.add("i"); keepIso.add("it");
        const off = v.iso.off ? " off" : "";
        const [el] = this.keyed("iso", "i", "line", "g-iso" + off);
        el.setAttribute("x1", X(seg[0][0])); el.setAttribute("y1", Y(seg[0][1]));
        el.setAttribute("x2", X(seg[1][0])); el.setAttribute("y2", Y(seg[1][1]));
        /* label at the right-hand end of the line, clear of the corner labels */
        const end = seg[0][0] > seg[1][0] ? seg[0] : seg[1];
        const [t] = this.keyed("iso", "it", "text", "g-isolab" + off);
        t.setAttribute("x", Math.min(X(end[0]), PLOT.W - PLOT.R) - 6);
        t.setAttribute("y", Math.max(Y(end[1]) - 12, PLOT.T + 16));
        t.setAttribute("text-anchor", "end");
        t.textContent = v.iso.label || "Profit " + money(v.iso.value, 0);
      }
    }
    this.prune("iso", keepIso);
    /* extras: slack gap, ghost points */
    this.L("extra").innerHTML = (v.extra || []).join("");
    /* corners */
    const keepC = new Set();
    (v.corners || []).forEach((c, n) => {
      const key = "c" + c[0].toFixed(4) + "_" + c[1].toFixed(4);
      keepC.add(key);
      const best = v.best && Math.abs(v.best[0] - c[0]) < 1e-6 && Math.abs(v.best[1] - c[1]) < 1e-6;
      const [g, fresh] = this.keyed("corners", key, "g");
      g.setAttribute("class", "g-corner" + (best ? " best" : "") + (fresh && v.animate !== false ? " enter" : ""));
      g.style.setProperty("--i", n);
      const lab = v.cornerLabel ? v.cornerLabel(c) : `(${fmt(c[0])}, ${fmt(c[1])})`;
      const right = X(c[0]) < PLOT.W - 190;
      const wasBest = g.dataset.best === "1";
      g.innerHTML = `${best && !wasBest && v.animate !== false ? `<circle class="g-ring" cx="${X(c[0])}" cy="${Y(c[1])}" r="10"/>` : ""}
        <circle class="c" cx="${X(c[0])}" cy="${Y(c[1])}" r="${best ? 10 : 8}"/>
        <text x="${X(c[0]) + (right ? 15 : -15)}" y="${Y(c[1]) + (c[1] < 0.5 ? -12 : 5)}" text-anchor="${right ? "start" : "end"}">${lab}</text>`;
      g.dataset.best = best ? "1" : "0";
    });
    this.prune("corners", keepC);
    /* test points */
    const keepP = new Set();
    (v.points || []).forEach(p => {
      const key = "p" + p.x.toFixed(3) + "_" + p.y.toFixed(3);
      keepP.add(key);
      const [g, fresh] = this.keyed("pts", key, "g");
      g.setAttribute("class", "g-pt " + (p.ok ? "ok" : "bad") + (fresh ? " enter" : ""));
      g.innerHTML = `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="11"/><text x="${X(p.x)}" y="${Y(p.y)}">${p.ok ? "✓" : "✕"}</text>`;
    });
    this.prune("pts", keepP);
    /* drag handles stay the same elements while they are dragged */
    const keepD = new Set();
    this.drag = null; this.probe = null;
    if (v.drag) {
      const k = v.cons[v.drag.i], seg = segment(k.a, k.b, k.c);
      if (seg) {
        keepD.add("grab"); keepD.add("grip");
        const [el] = this.keyed("drag", "grab", "line", "g-grab");
        el.setAttribute("x1", X(seg[0][0])); el.setAttribute("y1", Y(seg[0][1])); el.setAttribute("x2", X(seg[1][0])); el.setAttribute("y2", Y(seg[1][1]));
        const t = v.drag.at ?? .78, gx = X(seg[0][0] + t * (seg[1][0] - seg[0][0])), gy = Y(seg[0][1] + t * (seg[1][1] - seg[0][1]));
        const [g, fresh] = this.keyed("drag", "grip", "g", "g-grip");
        if (fresh) g.innerHTML = `<circle r="13"/><path d="M-4 -3l4-4 4 4M-4 3l4 4 4-4"/>`;
        g.setAttribute("transform", `translate(${gx.toFixed(1)} ${gy.toFixed(1)})`);
        this.drag = {k, onDrag: v.drag.onDrag};
      }
    }
    if (v.probe) {
      keepD.add("probe");
      const [g, fresh] = this.keyed("drag", "probe", "g", "g-probe" + (v.probe.ok === false ? " bad" : ""));
      if (fresh) g.innerHTML = `<circle class="halo" r="24"/><circle class="dot" r="10"/>`;
      g.setAttribute("transform", `translate(${X(v.probe.x).toFixed(1)} ${Y(v.probe.y).toFixed(1)})`);
      this.probe = v.probe;
    }
    this.prune("drag", keepD);
    this.svg.querySelector(".g-hit").style.cursor = this.onClick ? "crosshair" : "default";
    this.svg.querySelector(".g-hit").style.pointerEvents = this.onClick ? "auto" : "none";
  }
  reset() { for (const n of ["half", "region", "lines", "iso", "corners", "pts", "extra", "drag"]) this.L(n).innerHTML = ""; }
}

/* small "profit vs right-hand side" chart for Lesson 4 */
function curveChart(o) {
  const W = 420, H = 200, L = 52, R = 14, T = 14, B = 34;
  const x = v => L + (W - L - R) * (v - o.x0) / (o.x1 - o.x0);
  const y = v => H - B - (H - B - T) * (v - o.y0) / (o.y1 - o.y0);
  const path = pts => pts.filter(p => p[1] !== null).map((p, i) => (i ? "L" : "M") + x(p[0]).toFixed(1) + "," + y(p[1]).toFixed(1)).join("");
  let s = `<rect class="band" x="${x(o.band[0])}" y="${T}" width="${Math.max(0, x(o.band[1]) - x(o.band[0]))}" height="${H - B - T}"/>
    <line class="ax" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/><line class="ax" x1="${L}" y1="${T}" x2="${L}" y2="${H - B}"/>`;
  for (const t of o.xt) s += `<text class="tk" x="${x(t)}" y="${H - B + 16}" text-anchor="middle">${t}</text>`;
  for (const t of o.yt) s += `<text class="tk" x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${money(t, 0)}</text>`;
  s += `<text class="tk" x="${W - R}" y="${H - 4}" text-anchor="end">${o.xlabel}</text>`;
  s += `<path class="all" d="${path(o.all)}"/><path class="seen" d="${path(o.seen)}"/>`;
  if (o.tan) s += `<line class="tan" x1="${x(o.tan[0][0])}" y1="${y(o.tan[0][1])}" x2="${x(o.tan[1][0])}" y2="${y(o.tan[1][1])}"/>`;
  if (o.now && o.now[1] !== null) s += `<circle class="now" cx="${x(o.now[0])}" cy="${y(o.now[1])}" r="6"/>`;
  if (o.bandLabel) s += `<text class="lab" x="${x(o.band[0]) + 6}" y="${T + 14}">${o.bandLabel}</text>`;
  return `<svg class="curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria}">${s}</svg>`;
}
