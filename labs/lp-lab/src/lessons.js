/* ---- Lessons (phase 1: 2, 3, 5, 6, 7) ------------------------------------- */
const ALL = [0, 1, 2];
const MODEL_HTML = `<div class="model">
  <div class="model-row"><span class="m-type">Max</span><span class="m-expr">50<i>T</i> + 65<i>S</i></span><span class="m-tag obj">Gross profit for the week</span></div>
  <div class="model-row sub"><span class="m-type">s.t.</span><span class="m-expr">3.5<i>T</i> + 4<i>S</i> ≤ 84</span><span class="m-tag"><span class="dot fab"></span>Fabrication, 84 h</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>T</i> + 1.5<i>S</i> ≤ 21</span><span class="m-tag"><span class="dot fin"></span>Finishing, 21 h</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr">−2<i>T</i> + <i>S</i> ≥ 0</span><span class="m-tag"><span class="dot mix"></span>Dealer mix</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>T</i>, <i>S</i> ≥ 0</span><span class="m-tag">No negative production</span></div>
</div>`;
const regionView = (o = {}) => view(Object.assign({lines: ALL, region: true, corners: true}, o));
const bestLabel = c => Math.abs(c[0] - 5.25) < 1e-6 && Math.abs(c[1] - 10.5) < 1e-6 ? "(5.25, 10.5)  $945" : `(${fmt(c[0])}, ${fmt(c[1])})`;
/* animate a number, calling fn on every frame (used when an answer moves the graph) */
function animateValue(from, to, ms, fn) {
  return new Promise(res => {
    const t0 = performance.now();
    const tick = t => {
      const k = reduced ? 1 : Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      fn(from + (to - from) * e); k < 1 ? requestAnimationFrame(tick) : res();
    };
    requestAnimationFrame(tick);
  });
}
const pointMsg = (k, x, y, ok) => `<p class="feedback ${ok ? "ok" : "bad"}">Plan (${fmt(x, 1)}, ${fmt(y, 1)}): LHS evaluates to ${fmt(lhs(k, x, y), 2)} ${k.op === "<=" ? "≤" : "≥"} ${k.c}.
  ${ok ? "✓ Satisfies constraint." : "✕ Violates capacity limit. Choose a point on the feasible side."}</p>`;

/* ═════════ 1 · DRAW WHAT IS POSSIBLE ═════════ */
function sideBlock(i, title, task, rightMsg, demoPt) {
  return {
    title, task, goal: "Find the side of the line that satisfies the constraint.",
    body: () => `<p>A constraint draws a line on the graph. Every plan that satisfies it lies on one side of that line, including the line itself.</p>`,
    why: i === 2 ? "The mix requirement S ≥ 2T rearranges to −2T + S ≥ 0. Points above the green line build at least two Summit boards for every Trail board." :
      "To find which side satisfies a constraint, substitute any point into it. The origin (0, 0) is the quickest: building nothing uses no hours, which is under the limit.",
    show(b) {
      const done = App.prog[b.key];
      view({lines: ALL.slice(0, i + 1), halves: ALL.slice(0, done ? i + 1 : i).map(j => ({i: j, cls: baseCons()[j].cls}))});
      if (done) return;
      b.click((x, y) => {
        if (x < 0 || y < 0) return;
        const k = V.cons[i], ok = satisfies(k, x, y);
        V.points = [{x, y, ok}];
        b.host.innerHTML = pointMsg(k, x, y, ok);
        if (ok) { V.halves = V.halves.concat({i, cls: k.cls}); b.complete(rightMsg); b.click(null); }
        draw();
      }, "Click a point on the graph");
    },
    async demo(b) { b.sec.graph.onClick && b.sec.graph.onClick(...demoPt); }
  };
}
LESSONS.push({n: 1, title: "Draw what is possible",
  lead: `Each constraint cuts the graph in two. The plans that satisfy all of them form the <span class="ph">feasible region</span>.`,
  blocks: [
  {title: "Every point is a production decision",
   goal: "Read a point on the graph as one week of production.",
   body: () => `<p>Every point on this plane is one week of production: <span class="v">T</span> Trail boards and <span class="v">S</span> Summit boards.
     The model below says which points the shop can build, and what each one earns.</p>${MODEL_HTML}`,
   mount(b) { b.complete(); },
   show() { view(); }},
  sideBlock(0, "Fabrication capacity", "Click any point on the feasible side of the blue line (3.5T + 4S ≤ 84).",
    "Points below the blue line use no more than 84 fabrication hours. That side is now shaded.", [3, 4]),
  sideBlock(1, "Finishing capacity", "Click any point on the feasible side of the coral line (T + 1.5S ≤ 21).",
    "Points below the coral line use no more than 21 finishing hours.", [2, 3]),
  sideBlock(2, "Product mix requirement", "Click any point on the feasible side of the green line (S ≥ 2T).",
    "Points above the green line satisfy the dealer agreement: at least two Summit boards per Trail board.", [2, 10]),
  {title: "The feasible region",
   goal: "See which plans satisfy all three constraints at once.",
   body: () => `<p>The area where <b>every</b> constraint holds is the <b>feasible region</b>, shaded in maroon.
     Any point inside it is a <b>feasible solution</b>: the shop has the hours to build it.</p>
     <p>The region has three <b>corners</b>, also called extreme points: (0, 0), (0, 14) and (5.25, 10.5).</p>`,
   why: "The non-negativity conditions T ≥ 0 and S ≥ 0 keep the region in the first quadrant. The shop cannot build a negative number of boards.",
   mount(b) { b.complete(); },
   show() { regionView(); }},
  {title: "Test a plan",
   goal: "Check one plan against all three constraints.", task: "Drag the violet probe around the graph. Find an infeasible plan, then move it back inside the region.",
   body: () => `<p>A plan is feasible only if it satisfies all three constraints. The table below updates as you move the probe.</p>`,
   mount(b) {
     b.host.innerHTML = `<div class="ptbtns"><button class="btn pick small" data-p="4,8">(4, 8)</button><button class="btn pick small" data-p="6,10">(6, 10)</button>
       <button class="btn pick small" data-p="10,10">(10, 10)</button></div><div class="res"></div>`;
     b.mem.p = [3, 9]; b.mem.seen = new Set();
     b.mem.test = (x, y) => {
       activate(b);
       const cons = baseCons(), ok = isFeasible(cons, x, y), profit = 50 * x + 65 * y;
       b.mem.p = [x, y]; b.mem.seen.add(ok);
       V.probe = {x, y, ok, onMove: b.mem.test};
       $(".res", b.host).innerHTML = `<p style="margin:.6rem 0 0"><b class="num">(${fmt(x, 1)}, ${fmt(y, 1)})</b> <span class="badge ${ok ? "ok" : "bad"}">${ok ? "Feasible" : "Infeasible"}</span>
         <span class="note num">weekly profit ${money(profit, 0)}</span></p>${checkTable(cons, x, y)}`;
       draw();
       if (b.mem.seen.size === 2) b.complete("Inside the shaded region every limit holds. Cross any boundary and at least one constraint fails.");
     };
     $$(".pick", b.host).forEach(x => x.addEventListener("click", () => b.mem.test(...x.dataset.p.split(",").map(Number))));
   },
   show(b) { regionView(); b.mem.test(...b.mem.p); b.click(b.mem.test, "Drag the violet dot, or click anywhere on the grid"); },
   async demo(b) { await animateValue(0, 1, 1400, t => b.mem.test(3 + 4 * t, 9 + 2 * t)); }},
  {title: "Unused capacity (slack)",
   goal: "Tell a binding constraint from one with capacity to spare.",
   body: () => `<p>The blue fabrication line sits outside the feasible region.</p>
     <p>At the corner (5.25, 10.5) the shop uses <b>60.375</b> of its 84 fabrication hours, leaving <b>23.625 hours unused</b>. That unused amount is the constraint's <b>slack</b>.
     Finishing and the mix rule are what actually limit production.</p>`,
   why: "This slack matters in Lesson 4: because fabrication hours are already going unused, buying more of them adds nothing to profit.",
   mount(b) { b.complete(); },
   show() {
     regionView();
     const s = V.cons[0], t = (s.c - (s.a * 5.25 + s.b * 10.5)) / (s.a * s.a + s.b * s.b), px = 5.25 + s.a * t, py = 10.5 + s.b * t;
     V.extra = [`<line class="g-gap" x1="${X(5.25)}" y1="${Y(10.5)}" x2="${X(px)}" y2="${Y(py)}"/>
       <text class="g-gaplab" x="${X((5.25 + px) / 2) + 10}" y="${Y((10.5 + py) / 2) + 18}">23.625 h unused</text>`];
   }}
]});

/* ═════════ 2 · FIND THE BEST PLAN ═════════ */
function isoBlock(b, start, onMove) {
  const id = b.uid("iso");
  b.host.innerHTML = `${slider({id, label: "Profit target", min: 0, max: 1400, step: 5, value: start, fmt: v => money(v, 0)})}
    <div class="stat" id="${id}-stat"><span>Feasible plans at this profit level</span><b class="num" id="${id}-msg"></b></div>`;
  b.mem.iso = start;
  b.mem.setIso = v => {
    const off = v > 945 + 1e-9;
    b.mem.iso = v;
    if (CUR === b.sec && b.sec.active === b) { V.iso = {cx: 50, cy: 65, value: v, off, label: off ? `${money(v, 0)}: no feasible plan` : `Profit ${money(v, 0)}`}; draw(); }
    $(`#${id}-msg`).textContent = off ? "None feasible (exceeds capacity)" : v === 945 ? "Unique optimum: (5.25, 10.5)" : "Multiple feasible schedules";
    $(`#${id}-stat`).className = "stat " + (off ? "bad" : "ok");
    onMove && onMove(v);
  };
  bindSlider(id, v => money(v, 0), v => { activate(b); b.mem.setIso(v); });
  b.mem.setIso(start);
}
LESSONS.push({n: 2, title: "Find the best plan",
  lead: `Slide a profit line across the feasible region. The last point it touches is the <span class="ph">optimal plan</span>.`,
  blocks: [
  {title: "Isoprofit lines",
   goal: "See which plans earn the same profit.", task: "Drag the profit target and watch the line move.",
   body: () => `<p>Every point on the dashed line earns the same gross profit. A $300 target is the line 50<span class="v">T</span> + 65<span class="v">S</span> = 300.</p>`,
   why: "Changing the profit target changes only the constant on the right, so the line moves without turning. Every isoprofit line has the same slope, −50/65.",
   mount(b) { isoBlock(b, 300, v => { if (Math.abs(v - 300) >= 200) b.complete("The line moves parallel to itself. A higher profit target puts it further from the origin."); }); },
   show(b) { regionView(); b.mem.setIso(b.mem.iso); },
   async demo(b) { await tween($("#" + b.uid("iso")), 650); }},
  {title: "Maximizing the objective",
   goal: "Find the highest profit the region allows.", task: "Raise the profit target until the line is about to leave the feasible region.",
   body: () => `<p>The shop wants the highest profit its capacity allows.</p>`,
   mount(b) { isoBlock(b, 500, v => { if (v >= 940) b.complete("The last point the line touches is (5.25, 10.5), a profit of $945 for the week."); }); },
   show(b) { regionView(); b.mem.setIso(b.mem.iso); },
   async demo(b) { await tween($("#" + b.uid("iso")), 945, 1400); }},
  {title: "The optimal production schedule",
   goal: "Read the optimal plan and its profit.",
   body: () => `<p>The <b>optimal solution</b> is the feasible schedule that maximizes the objective function.</p>
     <div class="readout"><div class="stat"><span>Trail boards (T)</span><b class="num">5.25</b></div>
     <div class="stat"><span>Summit boards (S)</span><b class="num">10.5</b></div>
     <div class="stat ok"><span>Optimal weekly profit</span><b class="num best-p">$945</b></div></div>`,
   why: "A plan of 5.25 boards a week is an average rate: 21 boards over four weeks. When the answer has to be a whole number, the problem becomes an integer program.",
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel, iso: {cx: 50, cy: 65, value: 945}}); const e = $(".best-p", b.el); e.dataset.v = 0; countTo(e, 945); }},
  {title: "The Corner Point Theorem",
   goal: "Check the answer by computing the profit at every corner.", task: "Click each of the three corners to compute its profit.",
   body: () => `<p>If a linear program has an optimal solution, that solution is at one of the <b>corners</b> of the feasible region. With three corners here, computing the profit at each one settles the question.</p>`,
   mount(b) {
     b.host.innerHTML = `<table class="checks num"><tr><td>(0, 0)</td><td>50(0) + 65(0)</td><td data-c="0">?</td></tr>
       <tr><td>(0, 14)</td><td>50(0) + 65(14)</td><td data-c="1">?</td></tr><tr><td>(5.25, 10.5)</td><td>50(5.25) + 65(10.5)</td><td data-c="2">?</td></tr></table>`;
     const C = [[0, 0], [0, 14], [5.25, 10.5]], seen = new Set();
     b.mem.C = C;
     b.mem.show = i => {
       seen.add(i);
       const td = $(`td[data-c="${i}"]`, b.host); td.dataset.v = 0; countTo(td, 50 * C[i][0] + 65 * C[i][1]);
       if (seen.size === 3) {
         $(`td[data-c="2"]`, b.host).parentElement.style.background = "#FFF2C2";
         if (b.sec.active === b) { V.best = true; V.cornerLabel = bestLabel; draw(); }
         b.complete("(5.25, 10.5) earns $945, more than the other corners. It matches what the profit line found.");
       }
     };
   },
   show(b) {
     regionView({best: !!App.prog[b.key], cornerLabel: App.prog[b.key] ? bestLabel : null});
     b.click((x, y) => { const i = b.mem.C.findIndex(c => Math.hypot(X(c[0]) - X(x), Y(c[1]) - Y(y)) < 30); if (i >= 0) b.mem.show(i); }, "Click a corner");
   },
   async demo(b) { for (const i of [0, 1, 2]) { b.mem.show(i); await sleep(650); } }},
  {title: "Core principles",
   goal: "Three definitions to carry into the next lessons.",
   body: () => `<div class="rules"><div class="rule">A <b>feasible solution</b> satisfies every constraint. The <b>feasible region</b> holds all of them.</div>
     <div class="rule">The <b>optimal solution</b> is the feasible plan achieving the best objective value (highest profit or lowest cost).</div>
     <div class="rule"><b>Corner Point Theorem:</b> if a linear program has an optimal solution, that solution is at a corner of the feasible region.</div></div>`,
   custom: `<button class="btn sheet-btn small">Inspect in spreadsheet</button>`,
   mount(b) { b.complete(); $(".sheet-btn", b.el).addEventListener("click", () => $("#sheet-dlg").showModal()); },
   show() { regionView({best: true, cornerLabel: bestLabel}); }}
]});

/* ═════════ shared parts for Lessons 3–5: Sensitivity Analysis ═════════ */
const defBox = t => `<div class="defn"><span class="dl">Definition</span><p>${t}</p></div>`;
const exBox = h => `<div class="exbox"><span class="dl">At Ridgeline</span><div>${h}</div></div>`;
const scenario = (ico, who, ask) => `<div class="scen"><div class="scen-h"><span class="req-ico">${icon(ico)}</span>
  <div><span class="dl">Scenario</span><b>${who}</b></div></div><p class="scen-q">${ask}</p><div class="scen-a"></div></div>`;
/* the side panel: one table of the report, with the page's column lit, plus an optional extra */
function sidePanel(b, o = {}) {
  const p = b.panel(reportTables(Object.assign({only: o.table}, o.focus || {}, {rows: o.rows})) + (o.extra || ""));
  if (o.wait) $$(".report", p).forEach(t => t.classList.add("waiting"));
  $$("td.hot", p).forEach(td => td.addEventListener("click", () => {
    $$("td.sel", p).forEach(x => x.classList.remove("sel"));
    td.classList.add("sel");
    o.onCell && o.onCell(td.dataset.t, +td.dataset.r, +td.dataset.c);
  }));
  return p;
}
function explainCell(t, r, c) {
  const row = REPORT[t][r], name = row[1].toLowerCase();
  if (t === "vars") return [null, null,
    `The optimal plan builds ${row[2]} ${name} a week.`,
    `Reduced cost is ${row[3]}: the plan builds this board.`,
    `Profit per board in the objective: $${row[4]}.`,
    `Profit per board can rise by ${row[5] === "1E+30" ? "any amount: there is no limit" : "$" + row[5]} before the optimal plan changes.`,
    `Profit per board can fall by up to $${row[6]} before the optimal plan changes.`][c];
  const res = ["fabrication hours", "finishing hours", "the mix rule right-hand side"][r];
  return [null, null,
    ["Uses 60.375 of the 84 fabrication hours, leaving 23.625 hours of slack.", "Uses all 21 finishing hours, so the constraint is binding.",
     "At the optimal corner −2T + S = 0, so the mix rule is binding."][r],
    `Shadow price is ${row[3]}: one more unit of ${res} changes weekly profit by ${row[3]}.`,
    `Capacity available: ${row[4]} ${r < 2 ? "hours" : "units"}.`,
    `Shadow price holds for capacity increases of up to ${row[5] === "1E+30" ? "any amount" : `${row[5]}${r < 2 ? " hours" : ""}`}.`,
    `Shadow price holds for capacity reductions of up to ${row[6]}${r < 2 ? " hours" : ""}.`][c];
}
const sayIn = (b, html) => { const r = $(".res", b.host); if (r) r.innerHTML = `<p class="feedback">${html}</p>`; };

/* profit pages (Lesson 3): sliders change a profit per board; the panel shows the
   Variable Cells table and compares the report's prediction with a fresh solve */
const SUMMIT = {min: 30, max: 100, band: [-25, 75], mark: 65, legend: "<span>$30</span><span>green: allowable range</span><span>$100</span>"};
const TRAIL = {min: 20, max: 100, band: [43.333, 1000], mark: 50, legend: "<span>$20</span><span>green: allowable range</span><span>$100</span>"};
function profitReadout(m) {
  const sol = solveLP(baseCons(), {cx: m.cx, cy: m.cy, sense: "max"});
  const inside = m.cy <= 75 + 1e-9 && m.cx >= 43.333 - 1e-9, dc = (m.cx - 50) * 5.25 + (m.cy - 65) * 10.5;
  return {sol, inside, html: `<div class="readout tight">
    <div class="stat ${inside ? "ok" : "bad"}"><span>Optimal plan at ${money(m.cx)} / ${money(m.cy)}</span><b class="num">T ${fmt(sol.x)}, S ${fmt(sol.y)}</b></div>
    <div class="panel-row"><div class="stat ${inside ? "" : "muted"}"><span>Report: 945 ${dc < 0 ? "−" : "+"} ${fmt(Math.abs(dc))}</span><b class="num">${money(945 + dc)}</b></div>
    <div class="stat"><span>Solved again</span><b class="num">${money(sol.value)}</b></div></div>
    <p class="verdict">${inside ? `<span class="badge ok">✓ Plan unchanged</span> the report's number is exact` : `<span class="badge bad">✕ Plan changed</span> solve again; the report's number is wrong`}</p></div>`};
}
function profitShow(b) {
  const m = b.mem, r = profitReadout(m);
  view({lines: ALL, region: true, corners: true, best: true, obj: {cx: m.cx, cy: m.cy, sense: "max"},
        iso: {cx: m.cx, cy: m.cy, value: r.sol.value, label: `Profit ${money(r.sol.value)}`}, animate: false});
  if (CUR === b.sec && b.sec.active === b) { draw(); sidePanel(b, {table: "vars", focus: b.def.focus, extra: r.html}); }
  return r;
}
function profitSliders(b, which, onChange) {
  b.mem.cx = 50; b.mem.cy = 65;
  b.host.insertAdjacentHTML("afterbegin", which.map(w => slider(Object.assign({id: b.uid(w), label: w === "cy" ? "Profit per Summit board" : "Profit per Trail board",
    step: .5, value: b.mem[w], fmt: v => money(v)}, w === "cy" ? SUMMIT : TRAIL))).join(""));
  which.forEach(w => bindSlider(b.uid(w), v => money(v), v => { b.mem[w] = v; activate(b); const r = profitShow(b); onChange && onChange(b.mem, r.inside); }));
}
function setProfit(b, w, to) {
  const el = $("#" + b.uid(w));
  if (el) return tween(el, to, 800);
  return animateValue(b.mem[w], to, 800, v => { b.mem[w] = v; profitShow(b); });
}

/* hours pages (Lesson 4): a slider or a dragged line changes a right-hand side */
const RHS = {
  fin: {i: 1, label: "Finishing hours available", min: 0, max: 36, step: .25, base: 21, band: [0, 29.217], xt: [0, 10, 21, 30], sp: 45, lab: "slope 45 = shadow price"},
  fab: {i: 0, label: "Fabrication hours available", min: 30, max: 110, step: .5, base: 84, band: [60.375, 1e9], xt: [30, 60, 84, 110], sp: 0, lab: "slope 0 = shadow price"},
  mix: {i: 2, label: "Mix rule right-hand side", min: -45, max: 14, step: .5, base: 0, band: [-42, 14], xt: [-40, -20, 0, 14], sp: -2.5, lab: "slope −2.5 = shadow price"}
};
const SAMPLES = {};
function samples(w) {
  if (SAMPLES[w]) return SAMPLES[w];
  const R = RHS[w], out = [];
  for (let k = 0; k <= 160; k++) { const c = R.min + (R.max - R.min) * k / 160, cons = baseCons(); cons[R.i].c = c; out.push([c, solveLP(cons, PROFIT).value ?? null]); }
  return (SAMPLES[w] = out);
}
function rhsShow(b) {
  const m = b.mem, R = RHS[m.w], cons = baseCons(); cons[R.i].c = m.c;
  m.seen = m.seen || [R.base, R.base];
  m.seen[0] = Math.min(m.seen[0], m.c); m.seen[1] = Math.max(m.seen[1], m.c);
  const sl = $("#" + b.uid("rhs"));
  view({cons, lines: ALL, region: true, corners: true, best: true, animate: false,
        drag: sl ? {i: R.i, at: m.w === "mix" ? .55 : .8, onDrag: c => { sl.value = Math.max(R.min, Math.min(R.max, Math.round(c / R.step) * R.step)); sl.dispatchEvent(new Event("input")); }} : null});
  if (!(CUR === b.sec && b.sec.active === b)) return solveLP(cons, PROFIT);
  const sol = draw(), all = samples(m.w), span = [Math.max(R.min, R.band[0]), Math.min(R.max, R.band[1])];
  const head = `<h4>${R.label.replace(" available", "")}: <b>${fmt(m.c, 2)}</b>${sol.status === "infeasible" ? "" : `, optimal profit <b>${money(sol.value)}</b>`}</h4>`;
  const usage = sol.status === "infeasible" ? `<p class="feedback bad">No feasible plan.</p>` : usageBars(cons, sol);
  const curve = curveChart({x0: R.min, x1: R.max, y0: 0, y1: 1400, xt: R.xt, yt: [0, 700, 1400], all,
    seen: all.filter(p => p[0] >= m.seen[0] - 1e-9 && p[0] <= m.seen[1] + 1e-9), band: span, bandLabel: R.lab, now: [m.c, sol.value ?? null],
    xlabel: R.label.replace(" available", ""), tan: [[span[0], 945 + R.sp * (span[0] - R.base)], [span[1], 945 + R.sp * (span[1] - R.base)]],
    aria: "Optimal profit against the right-hand side"});
  const extra = b.def.extra === "usage" ? `<div class="pextra">${head}${usage}</div>` :
                b.def.extra === "curve" ? `<div class="pextra">${head}${curve}</div>` : `<div class="pextra panel-row"><div>${head}${usage}</div><div>${curve}</div></div>`;
  sidePanel(b, {table: "cons", focus: b.def.focus, extra});
  return sol;
}
function rhsSlider(b, w, onChange, opts = {}) {
  const R = RHS[w];
  b.mem.w = w; b.mem.c = R.base; if (opts.seen) b.mem.seen = opts.seen.slice();
  b.host.insertAdjacentHTML("afterbegin", slider({id: b.uid("rhs"), label: R.label, min: R.min, max: R.max, step: R.step, value: R.base, fmt: v => fmt(v, 2), band: R.band, mark: R.base}));
  bindSlider(b.uid("rhs"), v => fmt(v, 2), v => { b.mem.c = v; activate(b); const sol = rhsShow(b); onChange && onChange(v, sol); });
}
function setRHS(b, to, ms = 800) {
  const el = $("#" + b.uid("rhs"));
  if (el) return tween(el, to, ms);
  return animateValue(b.mem.c, to, ms, v => { b.mem.c = v; rhsShow(b); });
}
/* manager's question: the card sits in the block, the question goes inside it */
function ask(b, ico, who, q, kind, spec, onRight) {
  b.host.insertAdjacentHTML("beforeend", scenario(ico, who, q));
  const a = $(".scen-a", b.host);
  (kind === "num" ? numQ : choiceQ)(a, spec, onRight);
  a.firstElementChild.classList.add("live");
}

/* ═════════ 5 · THE REPORT: PRODUCTS (Variable Cells) ═════════ */
const TRAIL40 = {vars: [["$B$12", "Trail boards", "0", "−3.333333", "40", "3.333333", "1E+30"],
                        ["$C$12", "Summit boards", "14", "0", "65", "1E+30", "5"]]};
LESSONS.push({n: 3, title: "The report: products", aside: "report-first",
  lead: `Read the <span class="ph">Variable Cells</span> table in Excel's Sensitivity Report: what it says about a change in the profit per board.`,
  blocks: [
  {title: "The Sensitivity Report at a glance",
   body: () => `<p>Solver reports the optimal plan: <b>5.25 Trail</b> and <b>10.5 Summit</b> boards a week, for a gross profit of <b>$945</b>. Prices and capacities change from week to week, and the <b>Sensitivity Report</b> says how far each one can move before this plan is no longer the best one.</p>
     <div class="pair"><div>${icon("tag")}<b>Variable Cells</b><span>One row per board: how many to build, and the profit each one carries.</span></div>
     <div>${icon("gauge")}<b>Constraints</b><span>One row per resource: how much the plan uses, how much is available, and what one more unit is worth (Lesson 4).</span></div></div>
     <p class="note">Click any column header for its definition. In Solver, 1E+30 means there is no limit.</p>`,
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
  {title: "Final Value",
   body: () => defBox("How many of each product the optimal plan builds.") +
     exBox(`Build <b>5.25</b> Trail boards and <b>10.5</b> Summit boards a week. This is the gold corner on the graph.`),
   task: "Click both Final Value numbers in the table.",
   mount(b) {
     b.host.innerHTML = `<div class="res"></div>`; b.mem.seen = new Set();
     b.mem.cell = (t, r, c) => { sayIn(b, explainCell(t, r, c)); if (t === "vars" && c === 2) b.mem.seen.add(r);
       if (b.mem.seen.size === 2) { V.cornerLabel = bestLabel; draw(); b.host.querySelector(".scen") || ask(b, "board", "Shop manager",
         "According to this report, how many boards of each model should the shop build this week?", "choice", {options: [
           {t: "5.25 Trail and 10.5 Summit", ok: true, why: "Correct. Final Value is the quantity to build."}, {t: "50 Trail and 65 Summit", why: "Those are the profits per board, in the Objective Coefficient column."}]},
         () => b.complete("Final Value gives the week's plan: 5.25 Trail and 10.5 Summit boards, or 21 and 42 over four weeks. The other columns say how far the profit per board can move before that plan changes.")); } };
   },
   show(b) { regionView({best: true}); sidePanel(b, {table: "vars", focus: {cols: [2]}, wait: true, onCell: b.mem.cell}); },
   async demo(b) { for (const r of [0, 1]) { $(`.panel td[data-t="vars"][data-r="${r}"][data-c="2"]`, b.sec.el).click(); await sleep(600); } }},
  {title: "Reduced Cost",
   body: () => defBox("For a product the plan leaves out, the reduced cost is how much its profit per board must rise before building it is worthwhile. For a product the plan builds, it is zero.") +
     exBox(`The plan builds both boards, so both reduced costs are <b>$0</b>. A non-zero reduced cost appears only if the Trail profit falls to $40.`),
   task: "Switch the Trail profit to $40 and read the table again.",
   mount(b) {
     b.mem.cut = false;
     b.host.innerHTML = `<div class="seg live"><button class="on" data-v="0">Trail profit $50</button><button data-v="1">Trail profit $40</button></div><div class="res"></div>`;
     $$(".seg button", b.host).forEach(x => x.addEventListener("click", () => {
       activate(b); b.mem.cut = x.dataset.v === "1";
       $$(".seg button", b.host).forEach(y => y.classList.toggle("on", y === x));
       b.def.show(b);
       if (b.mem.cut && !b.host.querySelector(".scen")) ask(b, "store", "Sales",
         "A wholesale customer asks for a discount that cuts the Trail profit to $40, and Solver then builds no Trail boards at all. By how much must the Trail profit rise before building them is worthwhile again?",
         "num", {prefix: "$", answer: 3.33, tol: .02, hint: "Check Trail's Reduced Cost in the table: −3.333333.", right: "Correct. The Trail profit must rise by $3.33, to $43.33, before the plan builds Trail boards again."},
         () => b.complete("Trail's reduced cost is −$3.33: its profit per board must rise by $3.33, to $43.33, before the plan builds Trail boards again."));
     }));
   },
   show(b) {
     const cut = b.mem.cut;
     regionView({best: true, cornerLabel: bestLabel, obj: {cx: cut ? 40 : 50, cy: 65, sense: "max"}});
     sidePanel(b, {table: "vars", focus: {cols: [2, 3]}, rows: cut ? TRAIL40 : null,
       extra: `<p class="verdict">${cut ? `At $40 the optimal plan moves to <b>(0, 14)</b>, a profit of <b>$910</b>, with no Trail boards.` : `At $50 the optimal plan builds both boards.`}</p>`});
   },
   async demo(b) { $$(".seg button", b.host)[1].click(); }},
  {title: "Objective Coefficient",
   body: () => defBox("The profit per board that each product carries in the objective function.") +
     exBox(`In Max <b>50</b>T + <b>65</b>S the profits are $50 a Trail board and $65 a Summit board. The two coefficients set the slope of the isoprofit line.`),
   mount(b) {
     ask(b, "tag", "Marketing", "If retail prices change, which column of this table changes?", "choice", {options: [
       {t: "Objective Coefficient", ok: true, why: "Correct. A price change moves the profit per board."}, {t: "Final Value", why: "Final Value is the quantity built. It changes only if the price change moves the optimal corner."},
       {t: "Reduced Cost", why: "Reduced Cost applies to a product the plan does not build."}]},
       () => b.complete("A price change moves an <b>Objective Coefficient</b>. Allowable Increase and Allowable Decrease say how far it can move before the plan changes."));
   },
   show(b) { regionView({best: true, cornerLabel: bestLabel, iso: {cx: 50, cy: 65, value: 945, label: "50T + 65S = 945"}}); sidePanel(b, {table: "vars", focus: {cols: [4]}}); }},
  {title: "Allowable Increase",
   focus: {cols: [4, 5]},
   body: () => defBox("How far an objective coefficient can <b>rise</b> before the optimal plan changes.") +
     exBox(`Summit: $65 + <b>$10</b> = <b>$75</b>. The plan is unchanged as long as the Summit profit stays at or below $75. Trail shows 1E+30, so there is no upper limit.`),
   task: "Drag the Summit profit up to $75, then past it, and watch the optimal corner.",
   mount(b) {
     profitSliders(b, ["cy"]);
     ask(b, "megaphone", "Sales", "Stronger demand lets the shop raise the Summit profit from $65 to $70, a gain of $5 a board. Do the quantities change, and what happens to weekly profit?",
       "num", {prefix: "$", answer: 52.5, hint: "A rise of $5 is within the allowable increase of $10, so the quantities do not change. Multiply the change by Summit's Final Value, 10.5 boards.",
               right: "Correct. 5 × 10.5 = $52.50 more profit a week."},
       async () => { activate(b); await setProfit(b, "cy", 70); b.complete("The $5 rise is within the allowable increase of $10, so the quantities stay at 5.25 Trail and 10.5 Summit. Weekly profit rises by 5 × 10.5 = <b>$52.50</b>, to $997.50. Above $75 the optimal corner moves to (0, 14) and multiplying no longer works."); });
   },
   show: profitShow,
   async demo(b) { await setProfit(b, "cy", 80); await sleep(600); await setProfit(b, "cy", 65); }},
  {title: "Allowable Decrease",
   focus: {cols: [4, 6]},
   body: () => defBox("How far an objective coefficient can <b>fall</b> before the optimal plan changes.") +
     exBox(`Trail: $50 − <b>$6.67</b> = <b>$43.33</b>. The plan is unchanged as long as the Trail profit stays at or above $43.33. For Summit the allowable decrease is $90.`),
   task: "Drag the Trail profit below $43.33 and watch the optimal corner move.",
   mount(b) {
     profitSliders(b, ["cx"]);
     ask(b, "store", "A large customer", "They want a volume discount that cuts the Trail profit from $50 to $40, a drop of $10 a board. Can the change in profit be read off the report by multiplying?",
       "choice", {options: [{t: "Yes. Profit falls by 10 × 5.25 = $52.50, to $892.50.", why: "The allowable decrease is only $6.67, so a $10 drop is outside the range."},
                            {t: "No. A $10 drop is more than the allowable decrease of $6.67, so the plan changes and the model has to be solved again.", ok: true, why: "Correct. Solving again gives 0 Trail and 14 Summit boards, a profit of $910."}]},
       async () => { activate(b); await setProfit(b, "cx", 40); b.complete("A $10 drop is more than the allowable decrease of $6.67. The optimal plan moves to <b>0 Trail and 14 Summit</b> boards, a profit of <b>$910</b>. Outside the allowable range, multiplying does not work."); });
   },
   show: profitShow,
   async demo(b) { await setProfit(b, "cx", 40); }}
]});

/* ═════════ 4 · THE REPORT: RESOURCES (Constraints) ═════════ */
LESSONS.push({n: 4, title: "The report: resources",
  lead: `Read the <span class="ph">Constraints</span> table in Excel's Sensitivity Report: which resource is the bottleneck, and what one more hour of it is worth.`,
  blocks: [
  {title: "Final Value: capacity used",
   body: () => defBox("The left-hand side of the constraint at the optimal solution: how much of the resource the plan uses.") +
     exBox(`Fabrication uses <b>60.375</b> of its 84 hours. Finishing uses all <b>21</b>. The mix constraint's left-hand side is <b>0</b>.`) +
     `<div class="pair"><div><b>Binding</b><span>All of the capacity is used. Finishing and the mix rule.</span></div><div><b>Slack</b><span>Capacity left over. Fabrication has 23.625 hours unused.</span></div></div>`,
   task: "Click the Final Value of each constraint in the table.",
   extra: "usage", focus: {cols: [2, 4]},
   mount(b) {
     b.mem.w = "fin"; b.mem.c = 21; b.host.innerHTML = `<div class="res"></div>`; b.mem.seen = new Set();
     b.mem.cell = (t, r, c) => { sayIn(b, explainCell(t, r, c)); if (c === 2) b.mem.seen.add(r);
       if (b.mem.seen.size === 3 && !b.host.querySelector(".scen")) ask(b, "gauge", "Shop manager", "Which department is the bottleneck?", "choice", {options: [
         {t: "Finishing, which uses all 21 of its hours", ok: true, why: "Correct. Finishing is fully used, so its constraint is binding."}, {t: "Fabrication, which uses the most hours", why: "Fabrication still has 23.625 hours unused."}]},
         () => b.complete("Finishing limits output because it is <b>binding</b>. Fabrication has <b>23.625 hours of slack</b>. The next steps ask what one more hour of each is worth.")); };
   },
   show(b) { rhsShow(b); $$(".panel td.hot", b.sec.el).forEach(td => td.addEventListener("click", () => b.mem.cell(td.dataset.t, +td.dataset.r, +td.dataset.c))); $$('.panel .report', b.sec.el).forEach(t => t.classList.add("waiting")); },
   async demo(b) { for (const r of [0, 1, 2]) { $(`.panel td[data-t="cons"][data-r="${r}"][data-c="2"]`, b.sec.el).click(); await sleep(500); } }},
  {title: "Constraint R.H. Side",
   body: () => defBox("The constant on the right of a constraint: the capacity available, or the level a contract requires.") +
     exBox(`<b>84</b> fabrication hours, <b>21</b> finishing hours, and <b>0</b> for the mix rule.`),
   extra: "usage", focus: {cols: [4]},
   mount(b) {
     b.mem.w = "fin"; b.mem.c = 21;
     ask(b, "clock", "Purchasing", "Weekend overtime, temporary staff or a leased machine all change how many hours a department has. Which part of the model does that change?", "choice", {options: [
       {t: "The R.H. Side of the constraint", ok: true, why: "Correct. More capacity means a larger right-hand side."}, {t: "The profit per board", why: "Profit per board is an objective coefficient, covered in Lesson 3."},
       {t: "The Final Value", why: "Final Value is how much the plan uses, not how much is available."}]},
       () => b.complete("A change in capacity is a change in the <b>R.H. Side</b>. The Shadow Price column says what one more hour is worth."));
   },
   show: rhsShow},
  {title: "Shadow Price (Dual Value)",
   body: () => defBox("The change in optimal profit from one more unit of capacity, as long as the change stays inside the allowable range.") +
     exBox(`Finishing: <b>$45</b> an hour. Fabrication: <b>$0</b>. Mix rule: <b>−$2.50</b> a unit.`),
   task: "Drag the coral finishing line outward a few hours, or use the slider. Profit rises by $45 an hour.",
   extra: "curve", focus: {cells: [["cons", 1, 3]], cols: [3]},
   why: "<p>Regular wages are already in the budget and do not change with this decision. The <b>$45 shadow price</b> is the gross profit one more finishing hour brings in. Saturday overtime costs $30 an hour, so the net gain is $45 − $30 = <b>$15 an hour</b>.</p>",
   whyTitle: "Why compare a $45 shadow price with a $30 wage?",
   mount(b) {
     rhsSlider(b, "fin");
     ask(b, "clock", "Finishing supervisor", "The crew offers four overtime hours this Saturday at $30 an hour. What happens to weekly profit if the shop takes them?",
       "num", {prefix: "$", answer: 60, hint: "Four more hours is within the allowable increase of 8.22, so the shadow price holds. Each hour brings in $45 and costs $30.", right: "Correct. 4 × ($45 − $30) = $60."},
       async () => { activate(b); await setRHS(b, 25); b.complete("Take the shift. Each overtime hour brings in <b>$45</b> and costs $30, so four hours add 4 × $15 = <b>$60</b> to the week."); });
   },
   show: rhsShow,
   async demo(b) { await setRHS(b, 25, 1000); }},
  {title: "A shadow price of zero",
   body: () => defBox("A constraint with slack has a shadow price of zero. More of a resource that is already going unused adds nothing to profit.") +
     exBox(`Fabrication has 84 − 60.375 = <b>23.625</b> hours of slack, so its shadow price is <b>$0</b>.`),
   task: "Drag the blue fabrication line. Profit stays at $945 until the line cuts into the feasible region.",
   extra: "both", focus: {cells: [["cons", 0, 2], ["cons", 0, 3], ["cons", 0, 4]]},
   mount(b) {
     rhsSlider(b, "fab");
     ask(b, "truck", "Purchasing", "A nearby machine shop offers 10 extra fabrication hours. What is the most the shop should pay an hour?", "choice", {options: [
       {t: "$45", why: "$45 is the shadow price for finishing, not fabrication."}, {t: "$30", why: "That is the wage for finishing overtime."},
       {t: "$0", ok: true, why: "Correct. Fabrication hours are already going unused, so more of them cannot raise profit."}]},
       async () => { activate(b); await setRHS(b, 94); b.complete("Turn it down. Fabrication already has 23.625 unused hours, so 10 more leave weekly profit at $945. They are worth <b>$0</b>."); });
   },
   show: rhsShow,
   async demo(b) { await setRHS(b, 55, 1200); await sleep(500); await setRHS(b, 84, 800); }},
  {title: "A negative shadow price",
   body: () => defBox("When raising a right-hand side tightens the constraint and shrinks the feasible region, the shadow price is negative: profit falls.") +
     exBox(`The mix rule −2T + S ≥ 0 has a shadow price of <b>−2.5</b>. Raising its right-hand side forces an even higher ratio of Summit to Trail boards, which moves the plan away from the best mix.`),
   task: "Try both buttons.",
   extra: "curve", focus: {cells: [["cons", 2, 3]], cols: [3]},
   mount(b) {
     rhsSlider(b, "mix");
     b.host.insertAdjacentHTML("beforeend", `<div class="ptbtns live"><button class="btn pick small" data-v="2">Raise to +2</button><button class="btn pick small" data-v="-4">Lower to −4</button></div><div class="res"></div>`);
     $$(".pick", b.host).forEach(x => x.addEventListener("click", async () => {
       await setRHS(b, +x.dataset.v, 600);
       sayIn(b, x.dataset.v === "2" ? "2 × (−2.5) = −$5. Profit drops to $940." : "−4 × (−2.5) = +$10. Profit rises to $955.");
     }));
     ask(b, "megaphone", "A resort dealer", "They want a stricter ratio: two Summit boards beyond twice the Trail count (S ≥ 2T + 2). What does that term cost the shop a week?",
       "num", {prefix: "$", answer: -5, placeholder: "e.g. −10", hint: "The right-hand side constant increases from 0 to 2. Multiply the change by the shadow price (−2.5).", right: "Correct. 2 × (−2.5) = −$5."},
       () => b.complete("The stricter ratio costs <b>$5</b> a week: the right-hand side rises by 2, times a shadow price of −2.5."));
   },
   show: rhsShow,
   async demo(b) { $$(".pick", b.host)[0].click(); await sleep(1100); $$(".pick", b.host)[1].click(); }},
  {title: "Allowable range for a constraint",
   body: () => defBox("The range of right-hand side values over which the shadow price stays the same.") +
     exBox(`Finishing: allowable increase <b>8.22</b>, allowable decrease <b>21</b>. The $45 shadow price holds from <b>0 to 29.22 hours</b>. Fabrication has no upper limit.`),
   task: "Drag the finishing capacity past 29.22 hours and watch where the profit curve bends.",
   extra: "curve", focus: {cells: [["cons", 1, 3], ["cons", 1, 5], ["cons", 1, 6]], cols: [5, 6]},
   whyTitle: "Why the shadow price drops at 29.22 hours", why: "<p>Up to 29.22 hours the optimal corner slides along the mix line and each hour adds $45. At 29.22 hours fabrication is used up as well. Past that point a different pair of constraints sets the corner, and the shadow price falls to $22 an hour until 31.5 hours, beyond which more finishing time adds nothing.</p>",
   mount(b) {
     rhsSlider(b, "fin");
     ask(b, "clock", "Finishing supervisor", "If the finishing crew offers 10 overtime hours instead of 4, will weekly profit rise by 10 × $45 = $450?", "choice", {options: [
       {t: "Yes, profit rises by $450.", why: "Ten hours is more than the allowable increase of 8.22."},
       {t: "No. Ten hours is more than the allowable increase of 8.22, so the bottleneck changes and the model has to be solved again.", ok: true, why: "Correct. With 31 hours the optimal profit is $1,354, not $1,395."}]},
       async () => { activate(b); await setRHS(b, 31); b.complete("Outside the allowable range the shadow price no longer applies. With 31 finishing hours the optimal profit is <b>$1,354</b>, not the $1,395 that multiplying predicts."); });
   },
   show: rhsShow,
   async demo(b) { await setRHS(b, 33, 1600); }}
]});

/* ═════════ 5 · USE THE REPORT ═════════ */
const QUIZ = [
  {q: "Finishing hours go from 21 to 23.", kind: "m", ans: 90, why: "An increase of 2 is within the allowable increase of 8.22, so 2 × $45 = $90."},
  {q: "Finishing hours go from 21 to 32.", kind: "r", why: "An increase of 11 is more than the allowable increase of 8.22."},
  {q: "Summit profit goes from $65 to $72.", kind: "m", ans: 73.5, why: "An increase of 7 is within the allowable increase of 10, so 7 × 10.5 = $73.50."},
  {q: "Summit profit goes from $65 to $60.", kind: "m", ans: -52.5, why: "A decrease of 5 is within the allowable decrease of 90, so −5 × 10.5 = −$52.50."},
  {q: "Trail profit goes from $50 to $56.", kind: "m", ans: 31.5, why: "The allowable increase is 1E+30, so there is no limit: 6 × 5.25 = $31.50."},
  {q: "Trail profit goes from $50 to $42.", kind: "r", why: "A decrease of 8 is more than the allowable decrease of 6.67."},
  {q: "Fabrication hours go from 84 to 70.", kind: "m", ans: 0, why: "A decrease of 14 is within the allowable decrease of 23.625, and the shadow price is 0, so profit does not change."},
  {q: "Finishing hours go from 21 to 15.", kind: "m", ans: -270, why: "A decrease of 6 is within the allowable decrease of 21, so −6 × $45 = −$270."}
];
function runQuiz(b) {
  let i = 0, right = 0;
  const marks = QUIZ.map(() => ""), host = b.host;
  const next = () => {
    if (i >= QUIZ.length) {
      host.innerHTML = `<div class="q live"><div class="score">${marks.map(m => `<i class="${m}"></i>`).join("")}</div><p><b>${right} of ${QUIZ.length}</b> correct on the first attempt.</p>
        <button class="btn small again">Try again</button></div>`;
      $(".again", host).addEventListener("click", () => runQuiz(b));
      return b.complete(right === QUIZ.length ? "All eight correct on the first attempt." : "Check any missed case against the Sensitivity Report.");
    }
    const q = QUIZ[i];
    let first = true;
    host.innerHTML = `<div class="q live"><div class="score">${marks.map((m, j) => `<i class="${m || (j === i ? "c" : "")}"></i>`).join("")}</div>
      <p class="quiz-q">${i + 1}. ${q.q}</p></div>`;
    const box = host.firstElementChild;
    const done = () => { marks[i] = first ? "r" : "w"; if (first) right++; i++; setTimeout(next, 1300); };
    choiceQ(box, {options: [{t: "Multiply", ok: q.kind === "m", why: q.kind === "m" ? "Correct. The change is inside the allowable range." : q.why + " It is outside the allowable range, so the model has to be solved again."},
                            {t: "Solve again", ok: q.kind === "r", why: q.kind === "r" ? q.why + " The model has to be solved again." : "The change is inside the allowable range, so multiplying works."}]},
      () => {
        if (q.kind === "r") return done();
        numQ(box, {q: "Net change in weekly profit?", prefix: "$", answer: q.ans, placeholder: "e.g. −45", hint: "Multiply the change by the matching shadow price or Final Value.", right: q.why}, done);
      });
    box.addEventListener("click", () => { if ($(".choice.wrong", box) || $(".numin input.wrong", box)) first = false; });
  };
  next();
}
const DECODER = [
  ["vars", "Final Value", "How many of each product the optimal plan builds"], ["vars", "Reduced Cost", "For a product the plan leaves out: how much its profit must rise before building it is worthwhile"],
  ["vars", "Objective Coefficient", "The profit per board in the objective function"], ["vars", "Allowable Increase / Decrease", "How far the profit per board can move before the quantities change"],
  ["cons", "Final Value", "How much of the resource the optimal plan uses"], ["cons", "Shadow Price", "What one more unit of capacity is worth"],
  ["cons", "Constraint R.H. Side", "The capacity available, or the level a contract requires"], ["cons", "Allowable Increase / Decrease", "How far capacity can move before the shadow price changes"]];
LESSONS.push({n: 5, title: "Use the report", aside: "report-first",
  lead: `Decide, from the report alone, when a change in profit can be computed by hand and when the model has to be solved again.`,
  blocks: [
  {title: "When to multiply and when to solve again",
   body: () => `<div class="table-scroll"><table class="rtable"><tr><th>What changed</th><th>Range to check</th><th>Inside the allowable range</th><th>Outside it</th></tr>
     <tr><td>${icon("tag")} Profit per board</td><td>Allowable Increase / Decrease in <b>Variable Cells</b></td><td>The quantities do not change: Δ profit = Δ profit per board × <b>Final Value</b></td><td rowspan="2" class="stop">Solve again with Solver</td></tr>
     <tr><td>${icon("gauge")} Capacity (hours)</td><td>Allowable Increase / Decrease in <b>Constraints</b></td><td>Δ profit = Δ capacity × <b>Shadow Price</b></td></tr></table></div>
     <p class="note">The cases from Lessons 3 and 4:</p>
     <div class="table-scroll"><table class="rtable small"><tr><td>Summit profit $65 → $70</td><td>+5 ≤ 10</td><td>+5 × 10.5 = <b>+$52.50</b></td></tr>
     <tr><td>Trail profit $50 → $40</td><td>10 > 6.67</td><td class="stop">Solve again with Solver ($910)</td></tr>
     <tr><td>4 overtime finishing hours at $30</td><td>4 ≤ 8.22</td><td>4 × ($45 − $30) = <b>+$60</b></td></tr>
     <tr><td>10 bought fabrication hours</td><td>constraint has slack</td><td>worth <b>$0</b></td></tr>
     <tr><td>10 overtime finishing hours</td><td>10 > 8.22</td><td class="stop">Solve again with Solver ($1,354)</td></tr></table></div>`,
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
  {title: "Column reference",
   body: () => `<p class="note">What each column of the Sensitivity Report means:</p>
     <div class="table-scroll"><table class="rtable small">${DECODER.map(([t, n, m]) => `<tr><td>${icon(t === "vars" ? "tag" : "gauge")} <b>${n}</b></td><td>${m}</td></tr>`).join("")}</table></div>`,
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
  {title: "Eight cases",
   body: () => `<p class="note">For each case, decide whether the change in profit can be computed from the report or the model has to be solved again. The report is on the right.</p>`,
   mount(b) { runQuiz(b); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }}
]});
