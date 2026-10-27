/* ---- Lessons (phase 1: 2, 3, 5, 6, 7) ------------------------------------- */
const ALL = [0, 1, 2];
const MODEL_HTML = `<div class="model">Max&nbsp; 50<i>T</i> + 65<i>S</i><span class="c">weekly profit</span><br>
  s.t.&nbsp; 3.5<i>T</i> + 4<i>S</i> ≤ 84<span class="c">fabrication hours</span><br>
  &emsp;&ensp; <i>T</i> + 1.5<i>S</i> ≤ 21<span class="c">finishing hours</span><br>
  &emsp;&ensp; −2<i>T</i> + <i>S</i> ≥ 0<span class="c">mix rule, S ≥ 2T</span><br>
  &emsp;&ensp; <i>T</i>, <i>S</i> ≥ 0</div>`;
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
const pointMsg = (k, x, y, ok) => `<p class="feedback ${ok ? "ok" : "bad"}">At (${fmt(x, 1)}, ${fmt(y, 1)}): left-hand side = ${fmt(lhs(k, x, y), 2)},
  ${ok ? "which satisfies" : "which breaks"} ${k.op === "<=" ? "≤" : "≥"} ${k.c}.${ok ? "" : " Try a point on the other side."}</p>`;

/* ═════════ 2 · DRAW WHAT IS POSSIBLE ═════════ */
function sideBlock(i, title, task, rightMsg, demoPt) {
  return {
    title, task, goal: "Find which side of the line the constraint allows.",
    body: () => `<p>${["Fabrication", "Finishing", "The mix rule"][i]} is a line plus one side of it. Every point on the allowed side satisfies the constraint.</p>`,
    why: i === 2 ? "S ≥ 2T is the same as −2T + S ≥ 0. Points above the green line have more than twice as many Summit boards as Trail boards." :
      "Test any point by putting its T and S into the left-hand side. The origin (0, 0) is an easy test point: it uses 0 hours.",
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
  lead: `Each constraint cuts the graph in two. The plans that survive every cut form the <span class="ph">feasible region</span>.`,
  blocks: [
  {title: "Every point is a plan",
   goal: "Connect the model to the picture: every point is one weekly plan.",
   body: () => `<p>Each point on the graph is a weekly plan: <span class="v">T</span> Trail boards and <span class="v">S</span> Summit boards.
     The model says which plans are allowed and how much each one earns.</p>${MODEL_HTML}`,
   mount(b) { b.complete(); },
   show() { view(); }},
  sideBlock(0, "Fabrication hours", "Click a point on the side of the blue line where 3.5T + 4S ≤ 84.",
    "Points below the blue line use at most 84 fabrication hours. That side is shaded.", [3, 4]),
  sideBlock(1, "Finishing hours", "Click a point on the side of the coral line where T + 1.5S ≤ 21.",
    "Points below the coral line use at most 21 finishing hours.", [2, 3]),
  sideBlock(2, "The mix rule", "Click a point on the side of the green line where S ≥ 2T.",
    "Points above the green line have at least twice as many Summit boards as Trail boards.", [2, 10]),
  {title: "The feasible region",
   goal: "See all the plans Ridgeline is allowed to make at once.",
   body: () => `<p>The plans that satisfy <b>every</b> constraint at once form the <b>feasible region</b>, shaded in maroon.
     Any point inside it is a <b>feasible solution</b>.</p>
     <p>The region's corners are its <b>extreme points</b>: (0, 0), (0, 14) and (5.25, 10.5).</p>`,
   why: "Non-negativity (T ≥ 0 and S ≥ 0) keeps the region in the first quarter of the graph. A plan cannot make a negative number of boards.",
   mount(b) { b.complete(); },
   show() { regionView(); }},
  {title: "Test a plan",
   goal: "Check a plan the way Solver does: against every constraint.", task: "Drag the violet point around the graph. Find a plan that breaks a constraint, then one that keeps all three.",
   body: () => `<p>A plan is feasible only if it passes every check. The table updates as you drag.</p>`,
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
         <span class="note num">profit ${money(profit, 0)}</span></p>${checkTable(cons, x, y)}`;
       draw();
       if (b.mem.seen.size === 2) b.complete("Inside the shaded region every check passes. Step outside and at least one constraint breaks.");
     };
     $$(".pick", b.host).forEach(x => x.addEventListener("click", () => b.mem.test(...x.dataset.p.split(",").map(Number))));
   },
   show(b) { regionView(); b.mem.test(...b.mem.p); b.click(b.mem.test, "Drag the violet dot, or click anywhere"); },
   async demo(b) { await animateValue(0, 1, 1400, t => b.mem.test(3 + 4 * t, 9 + 2 * t)); }},
  {title: "One line stays clear of the region",
   goal: "Notice which resource does not limit the plan. It matters again in Lesson 4.",
   body: () => `<p>Look at the blue fabrication line. It lies outside the feasible region everywhere.</p>
     <p>The most fabrication time any feasible plan needs is 60.375 hours, at the corner (5.25, 10.5). Ridgeline has 84.
     Finishing hours and the mix rule are what limit the plan.</p>`,
   why: "This shows up again in Lesson 4: extra fabrication hours are worth nothing to Ridgeline, because the hours it already has are not all used.",
   mount(b) { b.complete(); },
   show() {
     regionView();
     const s = V.cons[0], t = (s.c - (s.a * 5.25 + s.b * 10.5)) / (s.a * s.a + s.b * s.b), px = 5.25 + s.a * t, py = 10.5 + s.b * t;
     V.extra = [`<line class="g-gap" x1="${X(5.25)}" y1="${Y(10.5)}" x2="${X(px)}" y2="${Y(py)}"/>
       <text class="g-gaplab" x="${X((5.25 + px) / 2) + 10}" y="${Y((10.5 + py) / 2) + 18}">23.625 h unused</text>`];
   }}
]});

/* ═════════ 3 · FIND THE BEST PLAN ═════════ */
function isoBlock(b, start, onMove) {
  const id = b.uid("iso");
  b.host.innerHTML = `${slider({id, label: "Profit target", min: 0, max: 1400, step: 5, value: start, fmt: v => money(v, 0)})}
    <div class="stat" id="${id}-stat"><span>Plans on this line</span><b class="num" id="${id}-msg"></b></div>`;
  b.mem.iso = start;
  b.mem.setIso = v => {
    const off = v > 945 + 1e-9;
    b.mem.iso = v;
    if (CUR === b.sec && b.sec.active === b) { V.iso = {cx: 50, cy: 65, value: v, off, label: off ? `${money(v, 0)}: no feasible plan` : `Profit ${money(v, 0)}`}; draw(); }
    $(`#${id}-msg`).textContent = off ? "none are feasible" : v === 945 ? "one plan: (5.25, 10.5)" : "many feasible plans";
    $(`#${id}-stat`).className = "stat " + (off ? "bad" : "ok");
    onMove && onMove(v);
  };
  bindSlider(id, v => money(v, 0), v => { activate(b); b.mem.setIso(v); });
  b.mem.setIso(start);
}
LESSONS.push({n: 2, title: "Find the best plan",
  lead: `Slide a line of equal profit across the region. The last point it touches is the <span class="ph">best plan</span>.`,
  blocks: [
  {title: "Lines of equal profit",
   goal: "Draw every plan with the same profit as one line.", task: "Drag the profit slider and watch the dashed line move.",
   body: () => `<p>Every plan on the dashed line earns the same profit. For a $300 target the line is 50<span class="v">T</span> + 65<span class="v">S</span> = 300.</p>`,
   why: "Changing the target only changes the right-hand side of 50T + 65S = target, so the line slides without turning. All lines of equal profit are parallel.",
   mount(b) { isoBlock(b, 300, v => { if (Math.abs(v - 300) >= 200) b.complete("The line slides but keeps its slope. Higher profit puts the line farther from the origin."); }); },
   show(b) { regionView(); b.mem.setIso(b.mem.iso); },
   async demo(b) { await tween($("#" + b.uid("iso")), 650); }},
  {title: "Push the line as far as it goes",
   goal: "Find the highest profit a feasible plan can reach.", task: "Raise the profit until the line is about to leave the shaded region.",
   body: () => `<p>Ridgeline wants the highest profit it can reach with a feasible plan.</p>`,
   mount(b) { isoBlock(b, 500, v => { if (v >= 940) b.complete("The last point the line touches is (5.25, 10.5). Its profit, $945, is the most Ridgeline can earn."); }); },
   show(b) { regionView(); b.mem.setIso(b.mem.iso); },
   async demo(b) { await tween($("#" + b.uid("iso")), 945, 1400); }},
  {title: "The optimal plan",
   goal: "Name the answer: the optimal solution and its profit.",
   body: () => `<p>The <b>optimal solution</b> is the feasible plan with the best objective value.</p>
     <div class="readout"><div class="stat"><span>Trail boards, T</span><b class="num">5.25</b></div>
     <div class="stat"><span>Summit boards, S</span><b class="num">10.5</b></div>
     <div class="stat ok"><span>Weekly profit</span><b class="num best-p">$945</b></div></div>`,
   why: "5.25 boards a week is a fractional answer. Read it as an average rate, for example 21 boards over four weeks. A later lesson asks for whole boards.",
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel, iso: {cx: 50, cy: 65, value: 945}}); const e = $(".best-p", b.el); e.dataset.v = 0; countTo(e, 945); }},
  {title: "Check every corner",
   goal: "Confirm the answer a second way, by checking each corner.", task: "Click each of the three corners on the graph to compute its profit.",
   body: () => `<p>When a linear program has an optimal solution, one of the corners is optimal. So another way to find it is to compute the profit at every corner and keep the best.</p>`,
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
  {title: "What to remember",
   goal: "Keep the three terms this lesson used.",
   body: () => `<div class="rules"><div class="rule">A <b>feasible solution</b> satisfies every constraint. The <b>feasible region</b> is the set of all of them.</div>
     <div class="rule">The <b>optimal solution</b> is the feasible solution with the best objective value.</div>
     <div class="rule">If a linear program has an optimal solution, one is found at a corner (extreme point) of the feasible region.</div></div>`,
   custom: `<button class="btn sheet-btn small">See it in a spreadsheet</button>`,
   mount(b) { b.complete(); $(".sheet-btn", b.el).addEventListener("click", () => $("#sheet-dlg").showModal()); },
   show() { regionView({best: true, cornerLabel: bestLabel}); }}
]});

/* ═════════ shared parts for Lessons 3–5: one report column per page ═════════
   Each page reads: Definition → At Ridgeline → Try it → Manager's question → What it means. */
const defBox = t => `<div class="defn"><span class="dl">Definition</span><p>${t}</p></div>`;
const exBox = h => `<div class="exbox"><span class="dl">At Ridgeline</span><div>${h}</div></div>`;
const scenario = (ico, who, ask) => `<div class="scen"><div class="scen-h"><span class="req-ico">${icon(ico)}</span>
  <div><span class="dl">Manager's question</span><b>${who}</b></div></div><p class="scen-q">${ask}</p><div class="scen-a"></div></div>`;
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
    `The optimal plan makes ${row[2]} ${name} per week.`,
    `The reduced cost for ${name} is ${row[3]}, because the plan makes this product.`,
    `The profit per board for ${name} is $${row[4]}.`,
    `Profit per board for ${name} can increase by ${row[5] === "1E+30" ? "any amount" : row[5]} before the plan changes.`,
    `Profit per board for ${name} can decrease by ${row[6]} before the plan changes.`][c];
  const res = ["fabrication hours", "finishing hours", "the mix rule's right-hand side"][r];
  return [null, null,
    ["The plan uses 60.375 of 84 fabrication hours, leaving 23.625 hours of slack.", "The plan uses all 21 finishing hours, so this constraint is binding.",
     "At the optimal plan −2T + S = 0, so the mix rule is binding."][r],
    `One more unit of ${res} changes profit by ${row[3]}.`,
    `The amount available is ${row[4]}.`,
    `The shadow price applies for an increase ${row[5] === "1E+30" ? "of any size" : `of up to ${row[5]}`}.`,
    `The shadow price applies for a decrease of up to ${row[6]}.`][c];
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
  lead: `This lesson reads the <span class="ph">Variable Cells</span> table of the Sensitivity Report, one column per page.`,
  blocks: [
  {title: "The report at a glance",
   body: () => `<p>Solver found the best plan: <b>5.25 Trail</b> and <b>10.5 Summit</b> boards a week, profit <b>$945</b>. It can also write a <b>Sensitivity Report</b>,
     which answers one kind of question: <i>if one number in the model changes, what happens to the plan and the profit?</i></p>
     <div class="pair"><div>${icon("tag")}<b>Variable Cells</b><span>One row for each product. This lesson.</span></div>
     <div>${icon("gauge")}<b>Constraints</b><span>One row for each resource. Lesson 4.</span></div></div>
     <p class="note">Tap a column name in the report to see its definition. In the report, 1E+30 means there is no limit.</p>`,
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
  {title: "Final Value",
   body: () => defBox("The value of each decision variable in the optimal plan.") +
     exBox(`Trail boards <b>5.25</b> and Summit boards <b>10.5</b> per week. This is the gold corner on the graph.`),
   task: "Click both Final Values in the table.",
   mount(b) {
     b.host.innerHTML = `<div class="res"></div>`; b.mem.seen = new Set();
     b.mem.cell = (t, r, c) => { sayIn(b, explainCell(t, r, c)); if (t === "vars" && c === 2) b.mem.seen.add(r);
       if (b.mem.seen.size === 2) { V.cornerLabel = bestLabel; draw(); b.host.querySelector(".scen") || ask(b, "board", "Production manager",
         "How many boards of each kind do we build this week?", "choice", {options: [
           {t: "5.25 Trail and 10.5 Summit", ok: true, why: "Correct. The Final Values give the plan."}, {t: "50 Trail and 65 Summit", why: "Those numbers are the profits per board, in the Objective Coefficient column."}]},
         () => b.complete("The Final Values give the weekly plan: 5.25 Trail and 10.5 Summit boards, or 21 and 42 boards over four weeks. The remaining columns show how much the inputs can change before this plan changes.")); } };
   },
   show(b) { regionView({best: true}); sidePanel(b, {table: "vars", focus: {cols: [2]}, wait: true, onCell: b.mem.cell}); },
   async demo(b) { for (const r of [0, 1]) { $(`.panel td[data-t="vars"][data-r="${r}"][data-c="2"]`, b.sec.el).click(); await sleep(600); } }},
  {title: "Reduced Cost",
   body: () => defBox("For a product the optimal plan does <b>not</b> make, the reduced cost is the amount by which its profit per unit must improve before the plan includes it. For a product the plan makes, the reduced cost is 0.") +
     exBox(`Ridgeline makes both boards, so both reduced costs are <b>0</b>. A non-zero reduced cost appears if Trail profit drops to $40.`),
   task: "Switch Trail profit to $40 and read Trail's row again.",
   mount(b) {
     b.mem.cut = false;
     b.host.innerHTML = `<div class="seg live"><button class="on" data-v="0">Trail profit $50</button><button data-v="1">Trail profit $40</button></div><div class="res"></div>`;
     $$(".seg button", b.host).forEach(x => x.addEventListener("click", () => {
       activate(b); b.mem.cut = x.dataset.v === "1";
       $$(".seg button", b.host).forEach(y => y.classList.toggle("on", y === x));
       b.def.show(b);
       if (b.mem.cut && !b.host.querySelector(".scen")) ask(b, "store", "Sales manager",
         "After a discount, Trail profit is $40 and the plan makes no Trail boards. By how much would Trail profit have to increase before we make Trail boards again?",
         "num", {prefix: "$", answer: 3.33, tol: .02, hint: "Look at Trail's Reduced Cost in the table, −3.333333.", right: "Correct. Trail profit would have to increase by $3.33, to $43.33."},
         () => b.complete("Trail's reduced cost is −3.33. Its profit per board must increase by $3.33, to $43.33, before the plan makes Trail boards again."));
     }));
   },
   show(b) {
     const cut = b.mem.cut;
     regionView({best: true, cornerLabel: bestLabel, obj: {cx: cut ? 40 : 50, cy: 65, sense: "max"}});
     sidePanel(b, {table: "vars", focus: {cols: [2, 3]}, rows: cut ? TRAIL40 : null,
       extra: `<p class="verdict">${cut ? `At $40 the optimal plan is <b>(0, 14)</b>, with a profit of <b>$910</b>. The plan makes no Trail boards.` : `At $50 the plan makes both boards.`}</p>`});
   },
   async demo(b) { $$(".seg button", b.host)[1].click(); }},
  {title: "Objective Coefficient",
   body: () => defBox("The number in front of each decision variable in the objective function. Here, the profit per board.") +
     exBox(`In Max <b>50</b>T + <b>65</b>S, the coefficients are $50 per Trail board and $65 per Summit board. They determine the slope of the dashed profit line.`),
   mount(b) {
     ask(b, "tag", "Pricing manager", "If we change a selling price, which column of this table changes?", "choice", {options: [
       {t: "Objective Coefficient", ok: true, why: "Correct. A new price changes the profit per board."}, {t: "Final Value", why: "The Final Value is the quantity in the plan. It changes only if the plan changes."},
       {t: "Reduced Cost", why: "Reduced Cost applies to products the plan does not make."}]},
       () => b.complete("A price change changes an objective coefficient. The Allowable Increase and Allowable Decrease columns show how far it can change before the plan changes."));
   },
   show(b) { regionView({best: true, cornerLabel: bestLabel, iso: {cx: 50, cy: 65, value: 945, label: "50T + 65S = 945"}}); sidePanel(b, {table: "vars", focus: {cols: [4]}}); }},
  {title: "Allowable Increase",
   focus: {cols: [4, 5]},
   body: () => defBox("How far an objective coefficient can <b>rise</b> before the optimal values of the decision variables change.") +
     exBox(`Summit: 65 + <b>10</b> = <b>75</b>. The plan stays the same while Summit profit is at most $75. Trail: 1E+30, so the plan stays the same for any increase.`),
   task: "Drag Summit profit up to $75 and then above it. Note where the gold corner is.",
   mount(b) {
     profitSliders(b, ["cy"]);
     ask(b, "megaphone", "Marketing manager", "Demand for Summit boards is strong. If a price increase raises profit per Summit board from $65 to $70, does the plan change? How much does weekly profit increase?",
       "num", {prefix: "$", answer: 52.5, hint: "An increase of 5 is less than the allowable increase of 10, so the plan does not change. Multiply the change by Summit's Final Value, 10.5.",
               right: "Correct. 5 × 10.5 = $52.50."},
       async () => { activate(b); await setProfit(b, "cy", 70); b.complete("The increase of $5 is within the allowable increase of $10, so the plan stays at 5.25 Trail and 10.5 Summit boards. Profit increases by 5 × 10.5 = <b>$52.50</b>, to $997.50. Above $75 the plan changes to (0, 14), and this calculation no longer applies."); });
   },
   show: profitShow,
   async demo(b) { await setProfit(b, "cy", 80); await sleep(600); await setProfit(b, "cy", 65); }},
  {title: "Allowable Decrease",
   focus: {cols: [4, 6]},
   body: () => defBox("How far an objective coefficient can <b>fall</b> before the optimal values of the decision variables change.") +
     exBox(`Trail: 50 − <b>6.67</b> = <b>43.33</b>. The plan stays the same while Trail profit is at least $43.33. Summit: 65 − 90 = −25.`),
   task: "Drag Trail profit below $43.33. Note where the gold corner moves.",
   mount(b) {
     profitSliders(b, ["cx"]);
     ask(b, "store", "Key-account manager", "A large customer asks for a discount that would reduce Trail profit from $50 to $40. Can the report tell us the new weekly profit?",
       "choice", {options: [{t: "Yes. Profit decreases by 10 × 5.25 = $52.50, to $892.50.", why: "The allowable decrease is 6.67, and a decrease of 10 is larger than that."},
                            {t: "No. A decrease of 10 is more than 6.67, so the plan changes and the model must be solved again.", ok: true, why: "Correct. Solving again gives 0 Trail and 14 Summit boards, with a profit of $910."}]},
       async () => { activate(b); await setProfit(b, "cx", 40); b.complete("A decrease of $10 is larger than the allowable decrease of $6.67. The optimal plan changes to <b>0 Trail and 14 Summit</b> boards, with a profit of <b>$910</b>. The estimate of $892.50 does not apply."); });
   },
   show: profitShow,
   async demo(b) { await setProfit(b, "cx", 40); }}
]});

/* ═════════ 6 · THE REPORT: RESOURCES (Constraints) ═════════ */
LESSONS.push({n: 4, title: "The report: resources",
  lead: `This lesson reads the <span class="ph">Constraints</span> table of the report, one column per page.`,
  blocks: [
  {title: "Final Value",
   body: () => defBox("The value of the constraint's left-hand side at the optimal plan, that is, the amount of the resource the plan uses.") +
     exBox(`Fabrication <b>60.375</b> of 84 h. Finishing <b>21</b> of 21 h. Mix rule −2T + S = <b>0</b>.`) +
     `<div class="pair"><div><b>Binding</b><span>The plan uses all of it. Finishing and the mix rule.</span></div><div><b>Slack</b><span>Amount available minus amount used. Fabrication has 23.625 h.</span></div></div>`,
   task: "Click the Final Value of each constraint.",
   extra: "usage", focus: {cols: [2, 4]},
   mount(b) {
     b.mem.w = "fin"; b.mem.c = 21; b.host.innerHTML = `<div class="res"></div>`; b.mem.seen = new Set();
     b.mem.cell = (t, r, c) => { sayIn(b, explainCell(t, r, c)); if (c === 2) b.mem.seen.add(r);
       if (b.mem.seen.size === 3 && !b.host.querySelector(".scen")) ask(b, "gauge", "Shop supervisor", "Which department limits profit this week?", "choice", {options: [
         {t: "Finishing, which uses all 21 hours", ok: true, why: "Correct. Finishing is a binding constraint."}, {t: "Fabrication, which uses the most hours", why: "Fabrication still has 23.625 hours unused."}]},
         () => b.complete("Finishing limits the plan because it is <b>binding</b>. Fabrication has <b>23.625 hours of slack</b>. The next pages show what an extra hour of each is worth.")); };
   },
   show(b) { rhsShow(b); $$(".panel td.hot", b.sec.el).forEach(td => td.addEventListener("click", () => b.mem.cell(td.dataset.t, +td.dataset.r, +td.dataset.c))); $$('.panel .report', b.sec.el).forEach(t => t.classList.add("waiting")); },
   async demo(b) { for (const r of [0, 1, 2]) { $(`.panel td[data-t="cons"][data-r="${r}"][data-c="2"]`, b.sec.el).click(); await sleep(500); } }},
  {title: "Constraint R.H. Side",
   body: () => defBox("The number on the right side of the constraint. Here it is the amount of a resource that is available.") +
     exBox(`<b>84</b> fabrication hours, <b>21</b> finishing hours, <b>0</b> for the mix rule.`),
   extra: "usage", focus: {cols: [4]},
   mount(b) {
     b.mem.w = "fin"; b.mem.c = 21;
     ask(b, "clock", "Operations manager", "Overtime, a new hire and hours bought from a supplier all add capacity. Which number in the model do they change?", "choice", {options: [
       {t: "The R.H. Side of a constraint", ok: true, why: "Correct. They change the hours available."}, {t: "The profit per board", why: "Profit per board is an objective coefficient, covered in Lesson 3."},
       {t: "The Final Value", why: "The Final Value is what the plan uses, not what is available."}]},
       () => b.complete("Adding hours changes a <b>right-hand side</b>. The Shadow Price column shows what each additional hour is worth."));
   },
   show: rhsShow},
  {title: "Shadow Price",
   body: () => defBox("How much the optimal profit changes when the right-hand side increases by 1 unit, as long as the change stays within the allowable range.") +
     exBox(`Finishing: <b>$45</b> per extra hour. Fabrication: <b>$0</b>. Mix rule: <b>−2.5</b>.`),
   task: "Drag the coral finishing line outward by a few hours, or use the slider. Profit increases by $45 for each hour.",
   extra: "curve", focus: {cells: [["cons", 1, 3]], cols: [3]},
   why: "<p>In this model, profit per board does not include the finishing crew's regular pay, because those hours are already paid for. The $45 shadow price is therefore the full gain from one more hour, and the $30 overtime rate is the full cost of that hour.</p>",
   whyTitle: "Why compare $45 with $30?",
   mount(b) {
     rhsSlider(b, "fin");
     ask(b, "clock", "Finishing supervisor", "The crew can work 4 extra hours on Saturday. Overtime costs $30 an hour. What is the net change in weekly profit if we approve it?",
       "num", {prefix: "$", answer: 60, hint: "Four hours is less than the allowable increase of 8.22, so the shadow price applies. Each hour adds $45 and costs $30.", right: "Correct. 4 × ($45 − $30) = $60."},
       async () => { activate(b); await setRHS(b, 25); b.complete("Approve the overtime. Each hour adds <b>$45</b> and costs $30, so the net gain is 4 × $15 = <b>$60</b> per week."); });
   },
   show: rhsShow,
   async demo(b) { await setRHS(b, 25, 1000); }},
  {title: "A shadow price of 0",
   body: () => defBox("A constraint with slack has a shadow price of 0. An additional unit does not increase profit, because the plan does not use all of the units it already has.") +
     exBox(`Fabrication: 84 − 60.375 = <b>23.625</b> hours unused, shadow price <b>$0</b>.`),
   task: "Drag the blue fabrication line in and out. Profit stays at $945 until the line reaches the feasible region.",
   extra: "both", focus: {cells: [["cons", 0, 2], ["cons", 0, 3], ["cons", 0, 4]]},
   mount(b) {
     rhsSlider(b, "fab");
     ask(b, "truck", "Purchasing manager", "A supplier offers us 10 more fabrication hours. What is the most we should pay per hour?", "choice", {options: [
       {t: "$45", why: "$45 is the shadow price for finishing. Look at the fabrication row."}, {t: "$30", why: "That is the overtime rate for finishing."},
       {t: "$0", ok: true, why: "Correct. The additional hours would not be used."}]},
       async () => { activate(b); await setRHS(b, 94); b.complete("Decline the offer. Fabrication already has 23.625 unused hours, so 10 more hours leave profit at $945. Their value to Ridgeline is <b>$0</b>."); });
   },
   show: rhsShow,
   async demo(b) { await setRHS(b, 55, 1200); await sleep(500); await setRHS(b, 84, 800); }},
  {title: "A negative shadow price",
   body: () => defBox("If increasing the right-hand side makes a constraint harder to satisfy, its shadow price is negative, and profit decreases.") +
     exBox(`The mix rule −2T + S ≥ 0 has a shadow price of <b>−2.5</b>. Increasing its right-hand side from 0 requires more Summit boards for each Trail board.`),
   task: "Try both buttons.",
   extra: "curve", focus: {cells: [["cons", 2, 3]], cols: [3]},
   mount(b) {
     rhsSlider(b, "mix");
     b.host.insertAdjacentHTML("beforeend", `<div class="ptbtns live"><button class="btn pick small" data-v="2">Raise to 2</button><button class="btn pick small" data-v="-4">Lower to −4</button></div><div class="res"></div>`);
     $$(".pick", b.host).forEach(x => x.addEventListener("click", async () => {
       await setRHS(b, +x.dataset.v, 600);
       sayIn(b, x.dataset.v === "2" ? "2 × (−2.5) = −$5. Profit is $940." : "−4 × (−2.5) = +$10. Profit is $955.");
     }));
     ask(b, "megaphone", "Sales manager", "A dealer requires at least 2 more Summit boards than twice the number of Trail boards (S ≥ 2T + 2). How does this change weekly profit?",
       "num", {prefix: "$", answer: -5, placeholder: "e.g. −10", hint: "The right-hand side increases from 0 to 2. Multiply the change by the shadow price, −2.5.", right: "Correct. 2 × (−2.5) = −$5."},
       () => b.complete("The new requirement lowers weekly profit by <b>$5</b>: an increase of 2 in the right-hand side times a shadow price of −2.5."));
   },
   show: rhsShow,
   async demo(b) { $$(".pick", b.host)[0].click(); await sleep(1100); $$(".pick", b.host)[1].click(); }},
  {title: "Allowable Increase and Decrease",
   body: () => defBox("How far a right-hand side can rise or fall while its shadow price stays the same.") +
     exBox(`Finishing: allowable increase <b>8.22</b>, allowable decrease <b>21</b>. The shadow price of $45 applies from <b>0 to 29.22</b> hours. Fabrication: no upper limit, allowable decrease 23.625.`),
   task: "Drag the finishing line past 29.22 hours. Note how the slope of the profit curve changes.",
   extra: "curve", focus: {cells: [["cons", 1, 3], ["cons", 1, 5], ["cons", 1, 6]], cols: [5, 6]},
   whyTitle: "Why the slope changes at 29.22", why: "<p>Up to 29.22 hours, the optimal corner moves along the mix rule line and each hour adds $45. At 29.22 hours fabrication is also fully used, so a different pair of constraints determines the optimal corner. From there each hour adds $22, and beyond 31.5 hours additional hours add nothing.</p>",
   mount(b) {
     rhsSlider(b, "fin");
     ask(b, "clock", "Finishing supervisor", "If the crew offers 10 extra hours instead of 4, does profit increase by 10 × $45 = $450?", "choice", {options: [
       {t: "Yes, profit increases by $450.", why: "Ten hours is more than the allowable increase of 8.22."},
       {t: "No. Ten hours is more than 8.22, so the model must be solved again.", ok: true, why: "Correct. Solving again gives a profit of $1,354, not $1,395."}]},
       async () => { activate(b); await setRHS(b, 31); b.complete("Outside the allowable range the shadow price no longer applies. With 31 finishing hours the optimal profit is <b>$1,354</b>, while the shadow price would give $1,395."); });
   },
   show: rhsShow,
   async demo(b) { await setRHS(b, 33, 1600); }}
]});

/* ═════════ 7 · USE THE REPORT ═════════ */
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
      host.innerHTML = `<div class="q live"><div class="score">${marks.map(m => `<i class="${m}"></i>`).join("")}</div><p><b>${right} of ${QUIZ.length}</b> right on the first try.</p>
        <button class="btn small again">Try again</button></div>`;
      $(".again", host).addEventListener("click", () => runQuiz(b));
      return b.complete(right === QUIZ.length ? "All eight right on the first try." : "Review any question you missed using the report on the right.");
    }
    const q = QUIZ[i];
    let first = true;
    host.innerHTML = `<div class="q live"><div class="score">${marks.map((m, j) => `<i class="${m || (j === i ? "c" : "")}"></i>`).join("")}</div>
      <p class="quiz-q">${i + 1}. ${q.q}</p></div>`;
    const box = host.firstElementChild;
    const done = () => { marks[i] = first ? "r" : "w"; if (first) right++; i++; setTimeout(next, 1300); };
    choiceQ(box, {options: [{t: "Multiply", ok: q.kind === "m", why: q.kind === "m" ? "Correct. Now calculate the change." : q.why + " The model must be solved again."},
                            {t: "Solve again", ok: q.kind === "r", why: q.kind === "r" ? q.why + " The model must be solved again." : "Compare the change with the allowable range again."}]},
      () => {
        if (q.kind === "r") return done();
        numQ(box, {q: "Change in profit?", prefix: "$", answer: q.ans, placeholder: "e.g. −45", hint: "Multiply the change by the shadow price or by the final value.", right: q.why}, done);
      });
    box.addEventListener("click", () => { if ($(".choice.wrong", box) || $(".numin input.wrong", box)) first = false; });
  };
  next();
}
const DECODER = [
  ["vars", "Final Value", "the optimal amount of each product"], ["vars", "Reduced Cost", "for a product left out: how much its profit must improve to be made"],
  ["vars", "Objective Coefficient", "profit per unit in the objective"], ["vars", "Allowable Increase / Decrease", "how far that profit can move before the plan changes"],
  ["cons", "Final Value", "how much of the resource the plan uses"], ["cons", "Shadow Price", "profit change per extra unit available"],
  ["cons", "Constraint R.H. Side", "the amount available"], ["cons", "Allowable Increase / Decrease", "how far the amount can move while the shadow price holds"]];
LESSONS.push({n: 5, title: "Use the report", aside: "report-first",
  lead: `This lesson puts the columns together to answer <span class="ph">what-if</span> questions.`,
  blocks: [
  {title: "When to multiply and when to solve again",
   body: () => `<table class="rtable"><tr><th>What changes</th><th>Check</th><th>Inside the range</th><th>Outside</th></tr>
     <tr><td>${icon("tag")} a profit per board</td><td>Allowable Increase / Decrease in <b>Variable Cells</b></td><td>The plan does not change. Change in profit = change × <b>Final Value</b></td><td rowspan="2" class="stop">solve again</td></tr>
     <tr><td>${icon("gauge")} the hours available</td><td>Allowable Increase / Decrease in <b>Constraints</b></td><td>Change in profit = change × <b>Shadow Price</b></td></tr></table>
     <p class="note">Examples from Lessons 3 and 4:</p>
     <table class="rtable small"><tr><td>Summit profit $65 → $70</td><td>+5 ≤ 10</td><td>+5 × 10.5 = <b>+$52.50</b></td></tr>
     <tr><td>Trail profit $50 → $40</td><td>10 > 6.67</td><td class="stop">solve again ($910)</td></tr>
     <tr><td>4 overtime finishing hours at $30</td><td>4 ≤ 8.22</td><td>4 × ($45 − $30) = <b>+$60</b></td></tr>
     <tr><td>10 purchased fabrication hours</td><td>slack</td><td>value <b>$0</b></td></tr>
     <tr><td>10 overtime finishing hours</td><td>10 > 8.22</td><td class="stop">solve again ($1,354)</td></tr></table>`,
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
  {title: "Report decoder",
   body: () => `<p class="note">Each column of the report in one line. Tap a column name in the report for the full definition.</p>
     <table class="rtable small">${DECODER.map(([t, n, m]) => `<tr><td>${icon(t === "vars" ? "tag" : "gauge")} ${n}</td><td>${m}</td></tr>`).join("")}</table>`,
   mount(b) { b.complete(); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
  {title: "Eight quick questions",
   body: () => `<p class="note">For each change, decide whether to multiply or to solve again. Use the report on the right.</p>`,
   mount(b) { runQuiz(b); },
   show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }}
]});
