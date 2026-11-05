/* the home page for this case */
CASES.clinic.intro = () => `
    <div class="intro-body reveal">
      <h2>Riverside Physical Therapy</h2>
      <p class="lead">🏥 Riverside Physical Therapy is a solo practice that bills two kinds of visit, an <b>initial evaluation</b> 📋 and a <b>treatment session</b> 🩺. Every Monday the owner sets the week's schedule: how many of each to book. One therapist delivers all of them, and the treatment rooms are shared with the practice next door. The payer contract adds two terms of its own. The question is which schedule brings in the most contribution.</p>

      <div class="table-scroll">
        <table class="case num">
          <thead>
            <tr>
              <th>Resource or term</th>
              <th>Evaluation (<i>V</i>)</th>
              <th>Treatment (<i>T</i>)</th>
              <th>Available per week</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Contribution per visit</td>
              <td><b>$200</b></td>
              <td><b>$90</b></td>
              <td class="dim">&mdash; maximize</td>
            </tr>
            <tr>
              <td><span class="dot fab"></span>Treatment room hours</td>
              <td>2.0</td>
              <td>1.5</td>
              <td><b>36</b></td>
            </tr>
            <tr>
              <td><span class="dot fin"></span>Therapist hours</td>
              <td>2.0</td>
              <td>1.0</td>
              <td><b>23</b></td>
            </tr>
            <tr>
              <td><span class="dot mix"></span>Care-plan rule</td>
              <td colspan="2" style="text-align:center">At least two treatment sessions per evaluation</td>
              <td><b><i>T</i> &ge; 2<i>V</i></b></td>
            </tr>
            <tr>
              <td><span class="dot cap"></span>Network minimum</td>
              <td colspan="2" style="text-align:center">At least six treatment sessions a week</td>
              <td><b><i>T</i> &ge; 6</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="note">An evaluation pays better per therapist hour than a treatment session does, so the payer writes the care-plan rule into the contract. The four colours mark the four constraints, and the lines on every graph below carry the same colours.</p>

      <p class="lead-sm">The same problem in standard linear programming form:</p>
      <div class="model">
        <div class="model-row">
          <span class="m-type">Max</span>
          <span class="m-expr">200<i>V</i> + 90<i>T</i></span>
          <span class="m-tag obj">Contribution for the week</span>
        </div>
        <div class="model-row sub">
          <span class="m-type">s.t.</span>
          <span class="m-expr">2<i>V</i> + 1.5<i>T</i> &le; 36</span>
          <span class="m-tag"><span class="dot fab"></span>Treatment rooms, 36 h</span>
        </div>
        <div class="model-row sub">
          <span class="m-type"></span>
          <span class="m-expr">2<i>V</i> + <i>T</i> &le; 23</span>
          <span class="m-tag"><span class="dot fin"></span>Therapist, 23 h</span>
        </div>
        <div class="model-row sub">
          <span class="m-type"></span>
          <span class="m-expr">&minus;2<i>V</i> + <i>T</i> &ge; 0</span>
          <span class="m-tag"><span class="dot mix"></span>Care-plan rule</span>
        </div>
        <div class="model-row sub">
          <span class="m-type"></span>
          <span class="m-expr"><i>T</i> &ge; 6</span>
          <span class="m-tag"><span class="dot cap"></span>Network minimum</span>
        </div>
        <div class="model-row sub">
          <span class="m-type"></span>
          <span class="m-expr"><i>V</i>, <i>T</i> &ge; 0</span>
          <span class="m-tag">No negative visits</span>
        </div>
      </div>
    </div>
`;

/* ---- The clinic course -----------------------------------------------------
   Riverside Physical Therapy: two visit types, two resources and two contract
   terms. Four constraints, so Lesson 1 has one more half-plane than the
   snowboard course; every other lesson matches it block for block.
   Shared pieces are in lesson-kit.js. Runs inside a function so both courses
   can use the same helper names.                                          */
CASES.clinic.lessons = function () {
  const LESSONS = [];
  const ALL = [0, 1, 2, 3];
  const MODEL_HTML = `<div class="model">
  <div class="model-row"><span class="m-type">Max</span><span class="m-expr">200<i>V</i> + 90<i>T</i></span><span class="m-tag obj">Contribution for the week</span></div>
  <div class="model-row sub"><span class="m-type">s.t.</span><span class="m-expr">2<i>V</i> + 1.5<i>T</i> ≤ 36</span><span class="m-tag"><span class="dot fab"></span>Treatment rooms, 36 h</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr">2<i>V</i> + <i>T</i> ≤ 23</span><span class="m-tag"><span class="dot fin"></span>Therapist, 23 h</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr">−2<i>V</i> + <i>T</i> ≥ 0</span><span class="m-tag"><span class="dot mix"></span>Care-plan rule</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>T</i> ≥ 6</span><span class="m-tag"><span class="dot cap"></span>Network minimum</span></div>
  <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>V</i>, <i>T</i> ≥ 0</span><span class="m-tag">No negative visits</span></div>
</div>`;
  const regionView = (o = {}) => view(Object.assign({lines: ALL, region: true, corners: true}, o));
  const bestLabel = c => Math.abs(c[0] - 5.75) < 1e-6 && Math.abs(c[1] - 11.5) < 1e-6
    ? "(5.75, 11.5)  $2,185" : `(${fmt(c[0])}, ${fmt(c[1])})`;
  const pointMsg = (k, x, y, ok) => `<p class="feedback ${ok ? "ok" : "bad"}">Schedule (${fmt(x, 1)}, ${fmt(y, 1)}): LHS evaluates to ${fmt(lhs(k, x, y), 2)} ${k.op === "<=" ? "≤" : "≥"} ${k.c}.
    ${ok ? "✓ Satisfies constraint." : "✕ Outside the limit. Choose a point on the feasible side."}</p>`;

  /* ═════════ 1 · DRAW WHAT IS POSSIBLE ═════════ */
  function sideBlock(i, title, task, rightMsg, demoPt, why) {
    return {
      title, task, goal: "Find the side of the line that satisfies the constraint.",
      body: () => `<p>A constraint draws a line on the graph. Every schedule that satisfies it lies on one side of that line, including the line itself.</p>`,
      why,
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
    lead: `Each constraint cuts the graph in two. The schedules that satisfy all four form the <span class="ph">feasible region</span>.`,
    blocks: [
    {title: "Every point is a week's schedule",
     goal: "Read a point on the graph as one week of care.",
     body: () => `<p>Every point on this plane is one week at the clinic: <span class="v">V</span> initial evaluations and <span class="v">T</span> treatment sessions.
       The model below says which points the clinic can staff, and what each one contributes.</p>${MODEL_HTML}`,
     mount(b) { b.complete(); },
     show() { view(); }},
    sideBlock(0, "Treatment room hours", "Click any point on the feasible side of the blue line (2V + 1.5T ≤ 36).",
      "Points below the blue line use no more than 36 room hours. That side is now shaded.", [2, 6],
      "To find which side satisfies a constraint, substitute any point into it. The origin (0, 0) is the quickest: seeing nobody uses no rooms, which is under the limit."),
    sideBlock(1, "Therapist hours", "Click any point on the feasible side of the coral line (2V + T ≤ 23).",
      "Points below the coral line use no more than 23 therapist hours.", [2, 8],
      "An evaluation takes 2 therapist-hours and a treatment session 1. The therapist is the only clinician, so this line is the one that will turn out to matter."),
    sideBlock(2, "Care-plan rule", "Click any point on the feasible side of the green line (T ≥ 2V).",
      "Points above the green line satisfy the care-plan rule: at least two treatment sessions for every evaluation.", [2, 12],
      "The payer will not reimburse an evaluation that leads nowhere, so the contract requires a course of treatment to follow it. T ≥ 2V rearranges to −2V + T ≥ 0, and the points above the green line satisfy it."),
    sideBlock(3, "Network minimum", "Click any point on the feasible side of the magenta line (T ≥ 6).",
      "Points above the magenta line meet the network minimum of six treatment sessions a week.", [3, 10],
      "Staying in network carries a floor as well as a ratio: at least six treatment sessions a week. It is a horizontal line, because it says nothing about evaluations."),
    {title: "The feasible region",
     goal: "See which schedules satisfy all four constraints at once.",
     body: () => `<p>The area where <b>every</b> constraint holds is the <b>feasible region</b>, shaded in maroon.
       Any point inside it is a <b>feasible solution</b>: the clinic has the therapist time and the rooms to deliver it, and the contract allows it.</p>
       <p>The region has four <b>corners</b>: (0, 6), (0, 23), (3, 6) and (5.75, 11.5).</p>`,
     why: "The non-negativity conditions V ≥ 0 and T ≥ 0 keep the region in the first quadrant. The clinic cannot deliver a negative number of visits.",
     mount(b) { b.complete(); },
     show() { regionView(); }},
    {title: "Test a schedule",
     goal: "Check one schedule against all four constraints.",
     task: "Drag the violet probe around the graph. Find an infeasible schedule, then move it back inside the region.",
     body: () => `<p>A schedule is feasible only if it satisfies all four constraints. The table below updates as you move the probe.</p>`,
     mount(b) {
       b.host.innerHTML = `<div class="ptbtns"><button class="btn pick small" data-p="3,10">(3, 10)</button><button class="btn pick small" data-p="5,14">(5, 14)</button>
         <button class="btn pick small" data-p="7,8">(7, 8)</button></div><div class="res"></div>`;
       b.mem.p = [3, 10]; b.mem.seen = new Set();
       b.mem.test = (x, y) => {
         activate(b);
         const cons = baseCons(), ok = isFeasible(cons, x, y), value = CASE.obj.cx * x + CASE.obj.cy * y;
         b.mem.p = [x, y]; b.mem.seen.add(ok);
         V.probe = {x, y, ok, onMove: b.mem.test};
         $(".res", b.host).innerHTML = `<p style="margin:.6rem 0 0"><b class="num">(${fmt(x, 1)}, ${fmt(y, 1)})</b> <span class="badge ${ok ? "ok" : "bad"}">${ok ? "Feasible" : "Infeasible"}</span>
           <span class="note num">weekly contribution ${money(value, 0)}</span></p>${checkTable(cons, x, y)}`;
         draw();
         if (b.mem.seen.size === 2) b.complete("Inside the shaded region every limit holds. Cross any boundary and at least one constraint fails.");
       };
       $$(".pick", b.host).forEach(x => x.addEventListener("click", () => b.mem.test(...x.dataset.p.split(",").map(Number))));
     },
     show(b) { regionView(); b.mem.test(...b.mem.p); b.click(b.mem.test, "Drag the violet dot, or click anywhere on the grid"); },
     async demo(b) { await animateValue(0, 1, 1400, t => b.mem.test(3 + 3 * t, 10 + 2 * t)); }},
    {title: "Unused capacity (slack and surplus)",
     goal: "Tell a binding constraint from one with room to spare.",
     body: () => `<p>Two of the four lines sit away from the best corner.</p>
       <p>At the corner (5.75, 11.5) the clinic uses <b>28.75</b> of its 36 room hours, leaving <b>7.25 hours unused</b>. That unused amount on a ≤ constraint is its <b>slack</b>.</p>
       <p>The network minimum is the other kind. It asks for 6 treatment sessions and the schedule delivers 11.5, so it clears the floor by <b>5.5 sessions</b>. On a ≥ constraint that margin is called <b>surplus</b>.</p>
       <p>Therapist hours and the care-plan rule are what actually limit the clinic.</p>`,
     why: "<p>Slack and surplus are the same idea from opposite sides: how far a constraint is from being tight. Both matter in Lesson 4, where a constraint with either one turns out to be worth nothing at the margin.</p>",
     whyTitle: "Slack, surplus, and why both are zero at a binding constraint",
     mount(b) { b.complete(); },
     show() {
       regionView();
       const s = V.cons[0], t = (s.c - (s.a * 5.75 + s.b * 11.5)) / (s.a * s.a + s.b * s.b);
       const px = 5.75 + s.a * t, py = 11.5 + s.b * t;
       V.extra = [`<line class="g-gap" x1="${X(5.75)}" y1="${Y(11.5)}" x2="${X(px)}" y2="${Y(py)}"/>
         <text class="g-gaplab" x="${X((5.75 + px) / 2) + 10}" y="${Y((11.5 + py) / 2) + 18}">7.25 h unused</text>`];
     }}
  ]});

  /* ═════════ 2 · FIND THE BEST PLAN ═════════ */
  const BEST_V = 2185, LOW_V = 540;   // the best and the worst corner of the region
  function isoBlock(b, start, onMove) {
    const id = b.uid("iso");
    /* the step has to divide 2,185, or the line can never stop on the optimum */
    b.host.innerHTML = `${slider({id, label: "Contribution target", min: 0, max: 3200, step: 5, value: start, fmt: v => money(v, 0)})}
      <div class="stat" id="${id}-stat"><span>Feasible schedules at this level</span><b class="num" id="${id}-msg"></b></div>`;
    b.mem.iso = start;
    b.mem.setIso = v => {
      /* the network minimum puts a floor under the region too: (0, 6) is worth $540 */
      const high = v > BEST_V + 1e-9, low = v < LOW_V - 1e-9, off = high || low;
      b.mem.iso = v;
      if (CUR === b.sec && b.sec.active === b) { V.iso = {cx: 200, cy: 90, value: v, off, label: off ? `${money(v, 0)}: no feasible schedule` : `Contribution ${money(v, 0)}`}; draw(); }
      $(`#${id}-msg`).textContent = high ? "None feasible (exceeds capacity)"
        : low ? "None feasible (below the network minimum)"
        : v === BEST_V ? "Unique optimum: (5.75, 11.5)"
        : v === LOW_V ? "One schedule only: (0, 6)"
        : "Multiple feasible schedules";
      $(`#${id}-stat`).className = "stat " + (off ? "bad" : "ok");
      onMove && onMove(v);
    };
    bindSlider(id, v => money(v, 0), v => { activate(b); b.mem.setIso(v); });
    b.mem.setIso(start);
  }
  LESSONS.push({n: 2, title: "Find the best plan",
    lead: `Slide a contribution line across the feasible region. The last point it touches is the <span class="ph">optimal schedule</span>.`,
    blocks: [
    {title: "Equal-contribution lines",
     goal: "See which schedules bring in the same money.", task: "Drag the contribution target and watch the line move.",
     body: () => `<p>Every point on the dashed line brings in the same contribution. A $900 target is the line 200<span class="v">V</span> + 90<span class="v">T</span> = 900.</p>`,
     why: "Changing the target changes only the constant on the right, so the line moves without turning. Every one of these lines has the same slope, −200/90.",
     mount(b) { isoBlock(b, 900, v => { if (Math.abs(v - 900) >= 500) b.complete("The line moves parallel to itself. A higher target puts it further from the origin."); }); },
     show(b) { regionView(); b.mem.setIso(b.mem.iso); },
     async demo(b) { await tween($("#" + b.uid("iso")), 1800); }},
    {title: "Maximizing the objective",
     goal: "Find the highest contribution the region allows.", task: "Raise the target until the line is about to leave the feasible region.",
     body: () => `<p>The clinic wants the highest weekly contribution its therapist time allows.</p>`,
     mount(b) { isoBlock(b, 1400, v => { if (v >= 2180) b.complete("The last point the line touches is (5.75, 11.5), a contribution of $2,185 for the week."); }); },
     show(b) { regionView(); b.mem.setIso(b.mem.iso); },
     async demo(b) { await tween($("#" + b.uid("iso")), 2185, 1400); }},
    {title: "The optimal schedule",
     goal: "Read the optimal schedule and what it brings in.",
     body: () => `<p>The <b>optimal solution</b> is the feasible schedule that maximizes the objective function.</p>
       <div class="readout"><div class="stat"><span>Initial evaluations (V)</span><b class="num">5.75</b></div>
       <div class="stat"><span>Treatment sessions (T)</span><b class="num">11.5</b></div>
       <div class="stat ok"><span>Optimal weekly contribution</span><b class="num best-p">$2,185</b></div></div>`,
     why: "A schedule of 5.75 evaluations a week is an average rate: 23 evaluations over four weeks. When the answer has to be a whole number, the problem becomes an integer program, which is Lesson 6.",
     mount(b) { b.complete(); },
     show(b) { regionView({best: true, cornerLabel: bestLabel, iso: {cx: 200, cy: 90, value: 2185}}); const e = $(".best-p", b.el); e.dataset.v = 0; countTo(e, 2185); }},
    {title: "The Corner Point Theorem",
     goal: "Check the answer by computing the contribution at every corner.", task: "Click each of the four corners to compute its contribution.",
     body: () => `<p>If a linear program has an optimal solution, that solution is at one of the <b>corners</b> of the feasible region. With four corners here, computing the contribution at each one settles the question.</p>`,
     mount(b) {
       b.host.innerHTML = `<table class="checks num"><tr><td>(0, 6)</td><td>200(0) + 90(6)</td><td data-c="0">?</td></tr>
         <tr><td>(3, 6)</td><td>200(3) + 90(6)</td><td data-c="1">?</td></tr>
         <tr><td>(0, 23)</td><td>200(0) + 90(23)</td><td data-c="2">?</td></tr>
         <tr><td>(5.75, 11.5)</td><td>200(5.75) + 90(11.5)</td><td data-c="3">?</td></tr></table>`;
       const C = [[0, 6], [3, 6], [0, 23], [5.75, 11.5]], seen = new Set();
       b.mem.C = C;
       b.mem.show = i => {
         seen.add(i);
         const td = $(`td[data-c="${i}"]`, b.host); td.dataset.v = 0; countTo(td, 200 * C[i][0] + 90 * C[i][1]);
         if (seen.size === 4) {
           $(`td[data-c="3"]`, b.host).parentElement.style.background = "#FFF2C2";
           if (b.sec.active === b) { V.best = true; V.cornerLabel = bestLabel; draw(); }
           b.complete("(5.75, 11.5) brings in $2,185, more than the other three corners. It matches what the contribution line found.");
         }
       };
     },
     show(b) {
       regionView({best: !!App.prog[b.key], cornerLabel: App.prog[b.key] ? bestLabel : null});
       b.click((x, y) => { const i = b.mem.C.findIndex(c => Math.hypot(X(c[0]) - X(x), Y(c[1]) - Y(y)) < 30); if (i >= 0) b.mem.show(i); }, "Click a corner");
     },
     async demo(b) { for (const i of [0, 1, 2, 3]) { b.mem.show(i); await sleep(650); } }},
    {title: "Core principles",
     goal: "Three definitions to carry into the next lessons.",
     body: () => `<div class="rules"><div class="rule">A <b>feasible solution</b> satisfies every constraint. The <b>feasible region</b> holds all of them.</div>
       <div class="rule">The <b>optimal solution</b> is the feasible schedule achieving the best objective value (highest contribution or lowest cost).</div>
       <div class="rule"><b>Corner Point Theorem:</b> if a linear program has an optimal solution, that solution is at a corner of the feasible region.</div></div>`,
     mount(b) { b.complete(); },
     show() { regionView({best: true, cornerLabel: bestLabel}); }}
  ]});

  /* ═════════ shared parts for Lessons 3–5: Sensitivity Analysis ═════════ */
  function explainCell(t, r, c) {
    const row = REPORT[t][r], name = row[1].toLowerCase();
    if (t === "vars") return [null, null,
      `The optimal schedule books ${row[2]} ${name} a week.`,
      `Reduced cost is ${row[3]}: the schedule books this visit type.`,
      `Contribution per visit in the objective: $${row[4]}.`,
      `Contribution per visit can rise by ${row[5] === "1E+30" ? "any amount: there is no limit" : "$" + row[5]} before the optimal schedule changes.`,
      `Contribution per visit can fall by up to $${row[6]} before the optimal schedule changes.`][c];
    const res = ["treatment room hours", "therapist hours", "the care-plan right-hand side", "the network minimum"][r];
    return [null, null,
      ["Uses 28.75 of the 36 room hours, leaving 7.25 hours of slack.",
       "Uses all 23 therapist hours, so the constraint is binding.",
       "At the optimal corner −2V + T = 0, so the care-plan rule is binding.",
       "The schedule books 11.5 treatment sessions against a floor of 6, a surplus of 5.5."][r],
      `Shadow price is ${row[3]}: one more unit of ${res} changes weekly contribution by ${row[3]}.`,
      `Right-hand side: ${row[4]}${r < 2 ? " hours" : ""}.`,
      `Shadow price holds for increases of up to ${row[5] === "1E+30" ? "any amount" : `${row[5]}${r < 2 ? " hours" : ""}`}.`,
      `Shadow price holds for reductions of up to ${row[6] === "1E+30" ? "any amount" : `${row[6]}${r < 2 ? " hours" : ""}`}.`][c];
  }

  /* contribution pages (Lesson 3): sliders change a contribution per visit */
  const TREAT = {min: 40, max: 160, band: [-100, 100], mark: 90, legend: "<span>$40</span><span>green: allowable range</span><span>$160</span>"};
  const EVAL = {min: 120, max: 320, band: [180, 2000], mark: 200, legend: "<span>$120</span><span>green: allowable range</span><span>$320</span>"};
  function profitReadout(m) {
    const sol = solveLP(baseCons(), {cx: m.cx, cy: m.cy, sense: "max"});
    const inside = m.cy <= 100 + 1e-9 && m.cx >= 180 - 1e-9, dc = (m.cx - 200) * 5.75 + (m.cy - 90) * 11.5;
    return {sol, inside, html: `<div class="readout tight">
      <div class="stat ${inside ? "ok" : "bad"}"><span>Optimal schedule at ${money(m.cx)} / ${money(m.cy)}</span><b class="num">V ${fmt(sol.x)}, T ${fmt(sol.y)}</b></div>
      <div class="panel-row"><div class="stat ${inside ? "" : "muted"}"><span>Report: 2,185 ${dc < 0 ? "−" : "+"} ${fmt(Math.abs(dc))}</span><b class="num">${money(2185 + dc)}</b></div>
      <div class="stat"><span>Solved again</span><b class="num">${money(sol.value)}</b></div></div>
      <p class="verdict">${inside ? `<span class="badge ok">✓ Schedule unchanged</span> the report's number is exact` : `<span class="badge bad">✕ Schedule changed</span> solve again; the report's number is wrong`}</p></div>`};
  }
  function profitShow(b) {
    const m = b.mem, r = profitReadout(m);
    view({lines: ALL, region: true, corners: true, best: true, obj: {cx: m.cx, cy: m.cy, sense: "max"},
          iso: {cx: m.cx, cy: m.cy, value: r.sol.value, label: `Contribution ${money(r.sol.value)}`}, animate: false});
    if (CUR === b.sec && b.sec.active === b) { draw(); sidePanel(b, {table: "vars", focus: b.def.focus, extra: r.html}); }
    return r;
  }
  function profitSliders(b, which, onChange) {
    b.mem.cx = 200; b.mem.cy = 90;
    b.host.insertAdjacentHTML("afterbegin", which.map(w => slider(Object.assign({id: b.uid(w),
      label: w === "cy" ? "Contribution per treatment session" : "Contribution per evaluation",
      step: 5, value: b.mem[w], fmt: v => money(v)}, w === "cy" ? TREAT : EVAL))).join(""));
    which.forEach(w => bindSlider(b.uid(w), v => money(v), v => { b.mem[w] = v; activate(b); const r = profitShow(b); onChange && onChange(b.mem, r.inside); }));
  }
  function setProfit(b, w, to) {
    const el = $("#" + b.uid(w));
    if (el) return tween(el, to, 800);
    return animateValue(b.mem[w], to, 800, v => { b.mem[w] = v; profitShow(b); });
  }

  /* hours pages (Lesson 4): a slider or a dragged line changes a right-hand side */
  const RHS = {
    ther: {i: 1, label: "Therapist hours available", min: 0, max: 40, step: .25, base: 23, band: [12, 28.8], xt: [0, 12, 23, 40], sp: 95, lab: "slope 95 = shadow price"},
    room: {i: 0, label: "Treatment room hours available", min: 20, max: 60, step: .5, base: 36, band: [28.75, 1e9], xt: [20, 30, 36, 60], sp: 0, lab: "slope 0 = shadow price"},
    plan: {i: 2, label: "Care-plan right-hand side", min: -16, max: 26, step: .5, base: 0, band: [-11, 23], xt: [-16, -8, 0, 23], sp: -5, lab: "slope −5 = shadow price"},
    floor: {i: 3, label: "Network minimum", min: 0, max: 20, step: .5, base: 6, band: [0, 11.5], xt: [0, 6, 12, 20], sp: 0, lab: "slope 0 = shadow price"}
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
          drag: sl ? {i: R.i, at: m.w === "plan" ? .55 : .8, onDrag: c => { sl.value = Math.max(R.min, Math.min(R.max, Math.round(c / R.step) * R.step)); sl.dispatchEvent(new Event("input")); }} : null});
    if (!(CUR === b.sec && b.sec.active === b)) return solveLP(cons, PROFIT);
    const sol = draw(), all = samples(m.w), span = [Math.max(R.min, R.band[0]), Math.min(R.max, R.band[1])];
    const head = `<h4>${R.label.replace(" available", "")}: <b>${fmt(m.c, 2)}</b>${sol.status === "infeasible" ? "" : `, optimal contribution <b>${money(sol.value)}</b>`}</h4>`;
    const usage = sol.status === "infeasible" ? `<p class="feedback bad">No feasible schedule.</p>` : usageBars(cons, sol);
    const curve = curveChart({x0: R.min, x1: R.max, y0: 0, y1: 3000, xt: R.xt, yt: [0, 1500, 3000], all,
      seen: all.filter(p => p[0] >= m.seen[0] - 1e-9 && p[0] <= m.seen[1] + 1e-9), band: span, bandLabel: R.lab, now: [m.c, sol.value ?? null],
      xlabel: R.label.replace(" available", ""), tan: [[span[0], 2185 + R.sp * (span[0] - R.base)], [span[1], 2185 + R.sp * (span[1] - R.base)]],
      aria: "Optimal contribution against the right-hand side"});
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

  /* ═════════ 3 · THE REPORT: VISITS (Variable Cells) ═════════ */
  const EVAL170 = {vars: [["$B$12", "Initial evaluations", "0", "−10", "170", "10", "1E+30"],
                          ["$C$12", "Treatment sessions", "23", "0", "90", "1E+30", "5"]]};
  LESSONS.push({n: 3, title: "The report: visits", aside: "report-first",
    lead: `Read the <span class="ph">Variable Cells</span> table in Excel's Sensitivity Report: what it says about a change in what a visit contributes.`,
    blocks: [
    {title: "The Sensitivity Report at a glance",
     body: () => `<p>Solver reports the optimal schedule: <b>5.75 evaluations</b> and <b>11.5 treatment sessions</b> a week, for a contribution of <b>$2,185</b>. Reimbursement rates and staffing change from week to week, and the <b>Sensitivity Report</b> says how far each one can move before a different schedule becomes the best one.</p>
       <div class="pair"><div>${icon("tag")}<b>Variable Cells</b><span>One row per visit type: how many to book, and what each one contributes.</span></div>
       <div>${icon("gauge")}<b>Constraints</b><span>One row per resource or contract term, four in all: how much the schedule uses, what is available, and what one more unit is worth (Lesson 4).</span></div></div>
       <p class="note">Click any column header for its definition. In Solver, 1E+30 means there is no limit.</p>`,
     mount(b) { b.complete(); },
     show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
    {title: "Final Value",
     body: () => defBox("How many of each visit type the optimal schedule books.") +
       exBox(`Book <b>5.75</b> evaluations and <b>11.5</b> treatment sessions a week. This is the gold corner on the graph.`),
     task: "Click both Final Value numbers in the table.",
     mount(b) {
       b.host.innerHTML = `<div class="res"></div>`; b.mem.seen = new Set();
       b.mem.cell = (t, r, c) => { sayIn(b, explainCell(t, r, c)); if (t === "vars" && c === 2) b.mem.seen.add(r);
         if (b.mem.seen.size === 2) { V.cornerLabel = bestLabel; draw(); b.host.querySelector(".scen") || ask(b, "board", "Practice owner",
           "According to this report, how many of each visit should we book this week?", "choice", {options: [
             {t: "5.75 evaluations and 11.5 treatment sessions", ok: true, why: "Correct. Final Value is the quantity to book."},
             {t: "200 evaluations and 90 treatment sessions", why: "Those are the contributions per visit, in the Objective Coefficient column."}]},
           () => b.complete("Final Value gives the week's schedule: 5.75 evaluations and 11.5 treatment sessions, or 23 and 46 over four weeks. The other columns say how far a contribution can move before that schedule changes.")); } };
     },
     show(b) { regionView({best: true}); sidePanel(b, {table: "vars", focus: {cols: [2]}, wait: true, onCell: b.mem.cell}); },
     async demo(b) { for (const r of [0, 1]) { $(`.panel td[data-t="vars"][data-r="${r}"][data-c="2"]`, b.sec.el).click(); await sleep(600); } }},
    {title: "Reduced Cost",
     body: () => defBox("For a visit type the schedule leaves out, the reduced cost is how much its contribution must rise before booking it is worthwhile. For a type the schedule books, it is zero.") +
       exBox(`The schedule books both types, so both reduced costs are <b>$0</b>. A non-zero reduced cost appears only if an evaluation's contribution falls to $170.`),
     task: "Switch the evaluation contribution to $170 and read the table again.",
     mount(b) {
       b.mem.cut = false;
       b.host.innerHTML = `<div class="seg live"><button class="on" data-v="0">Evaluation $200</button><button data-v="1">Evaluation $170</button></div><div class="res"></div>`;
       $$(".seg button", b.host).forEach(x => x.addEventListener("click", () => {
         activate(b); b.mem.cut = x.dataset.v === "1";
         $$(".seg button", b.host).forEach(y => y.classList.toggle("on", y === x));
         b.def.show(b); draw();
         if (b.mem.cut && !b.host.querySelector(".scen")) ask(b, "store", "Billing lead",
           "A payer renegotiation would cut the evaluation rate to $170, and Solver then books no evaluations at all. By how much must the rate recover before booking them is worthwhile again?",
           "num", {prefix: "$", answer: 10, tol: .02, hint: "Check the evaluation's Reduced Cost in the table: −10.",
                   right: "Correct. The evaluation contribution must rise by $10, to $180, before the schedule books them again."},
           () => b.complete("The evaluation's reduced cost is −$10: its contribution must rise by $10, to $180, before the schedule books evaluations again."));
       }));
     },
     show(b) {
       const cut = b.mem.cut;
       regionView({best: true, cornerLabel: bestLabel, obj: {cx: cut ? 170 : 200, cy: 90, sense: "max"}});
       sidePanel(b, {table: "vars", focus: {cols: [2, 3]}, rows: cut ? EVAL170 : null,
         extra: `<p class="verdict">${cut ? `At $170 the optimal schedule moves to <b>(0, 23)</b>, a contribution of <b>$2,070</b>, with no evaluations at all.` : `At $200 the optimal schedule books both visit types.`}</p>`});
     },
     async demo(b) { $$(".seg button", b.host)[1].click(); }},
    {title: "Objective Coefficient",
     body: () => defBox("The contribution per visit that each type carries in the objective function.") +
       exBox(`In Max <b>200</b>V + <b>90</b>T the contributions are $200 an evaluation and $90 a treatment session. The two coefficients set the slope of the contribution line.`),
     mount(b) {
       ask(b, "tag", "Billing lead", "If a payer updates its fee schedule, which column of this table changes?", "choice", {options: [
         {t: "Objective Coefficient", ok: true, why: "Correct. A rate change moves the contribution per visit."},
         {t: "Final Value", why: "Final Value is the quantity booked. It changes only if the rate change moves the optimal corner."},
         {t: "Reduced Cost", why: "Reduced Cost applies to a visit type the schedule does not book."}]},
         () => b.complete("A rate change moves an <b>Objective Coefficient</b>. Allowable Increase and Allowable Decrease say how far it can move before the schedule changes."));
     },
     show(b) { regionView({best: true, cornerLabel: bestLabel, iso: {cx: 200, cy: 90, value: 2185, label: "200V + 90T = 2,185"}}); sidePanel(b, {table: "vars", focus: {cols: [4]}}); }},
    {title: "Allowable Increase",
     focus: {cols: [4, 5]},
     body: () => defBox("How far an objective coefficient can <b>rise</b> before the optimal schedule changes.") +
       exBox(`Treatment: $90 + <b>$10</b> = <b>$100</b>. The schedule is unchanged as long as a treatment session stays at or below $100. The evaluation shows 1E+30, so there is no upper limit.`),
     task: "Drag the treatment contribution up to $100, then past it, and watch the optimal corner.",
     mount(b) {
       profitSliders(b, ["cy"]);
       ask(b, "megaphone", "Practice owner", "A payer raises the treatment rate from $90 to $95, a gain of $5 a session. Do the quantities change, and what happens to weekly contribution?",
         "num", {prefix: "$", answer: 57.5, hint: "A rise of $5 is within the allowable increase of $10, so the quantities do not change. Multiply the change by the treatment Final Value, 11.5 sessions.",
                 right: "Correct. 5 × 11.5 = $57.50 more a week."},
         async () => { activate(b); await setProfit(b, "cy", 95); b.complete("The $5 rise is within the allowable increase of $10, so the schedule stays at 5.75 evaluations and 11.5 treatment sessions. Weekly contribution rises by 5 × 11.5 = <b>$57.50</b>, to $2,242.50. Above $100 the optimal corner moves to (0, 23) and multiplying stops working."); });
     },
     show: profitShow,
     async demo(b) { await setProfit(b, "cy", 110); await sleep(600); await setProfit(b, "cy", 90); }},
    {title: "Allowable Decrease",
     focus: {cols: [4, 6]},
     body: () => defBox("How far an objective coefficient can <b>fall</b> before the optimal schedule changes.") +
       exBox(`Evaluation: $200 − <b>$20</b> = <b>$180</b>. The schedule is unchanged as long as an evaluation stays at or above $180. For a treatment session the allowable decrease is $190.`),
     task: "Drag the evaluation contribution below $180 and watch the optimal corner move.",
     mount(b) {
       profitSliders(b, ["cx"]);
       ask(b, "store", "Billing lead", "A renegotiation would cut the evaluation rate from $200 to $170, a drop of $30. Can the change in contribution be read off the report by multiplying?",
         "choice", {options: [{t: "Yes. Contribution falls by 30 × 5.75 = $172.50, to $2,012.50.", why: "The allowable decrease is only $20, so a $30 drop is outside the range."},
                              {t: "No. A $30 drop is more than the allowable decrease of $20, so the schedule changes and the model has to be solved again.", ok: true, why: "Correct. Solving again gives 0 evaluations and 23 treatment sessions, a contribution of $2,070."}]},
         async () => { activate(b); await setProfit(b, "cx", 170); b.complete("A $30 drop is more than the allowable decrease of $20. The optimal schedule moves to <b>0 evaluations and 23 treatment sessions</b>, a contribution of <b>$2,070</b>. Outside the allowable range, multiplying does not work."); });
     },
     show: profitShow,
     async demo(b) { await setProfit(b, "cx", 170); }}
  ]});

  /* ═════════ 4 · THE REPORT: RESOURCES AND TERMS (Constraints) ═════════ */
  LESSONS.push({n: 4, title: "The report: resources",
    lead: `Read the <span class="ph">Constraints</span> table in Excel's Sensitivity Report: which of the four is the bottleneck, and what one more hour of it is worth.`,
    blocks: [
    {title: "Final Value: what the schedule uses",
     body: () => defBox("The left-hand side of the constraint at the optimal solution: how much of the resource the schedule uses, or what level it reaches on a contract term.") +
       exBox(`Rooms use <b>28.75</b> of 36 hours. The therapist uses all <b>23</b>. The care-plan left-hand side is <b>0</b>, and the schedule books <b>11.5</b> treatment sessions against a floor of 6.`) +
       `<div class="pair"><div><b>Binding</b><span>Nothing left over. The therapist and the care-plan rule.</span></div><div><b>Slack or surplus</b><span>Room to spare. Rooms have 7.25 hours of slack; the network minimum has 5.5 sessions of surplus.</span></div></div>`,
     task: "Click the Final Value of each of the four constraints.",
     extra: "usage", focus: {cols: [2, 4]},
     mount(b) {
       b.mem.w = "ther"; b.mem.c = 23; b.host.innerHTML = `<div class="res"></div>`; b.mem.seen = new Set();
       b.mem.cell = (t, r, c) => { sayIn(b, explainCell(t, r, c)); if (c === 2) b.mem.seen.add(r);
         if (b.mem.seen.size === 4 && !b.host.querySelector(".scen")) ask(b, "gauge", "Practice owner", "Which of the four is the bottleneck?", "choice", {options: [
           {t: "Therapist hours, which are fully used", ok: true, why: "Correct. The therapist is fully used, so the constraint is binding."},
           {t: "Treatment rooms, which carry the most hours", why: "Rooms still have 7.25 hours unused."},
           {t: "The network minimum, because it is a contract term", why: "The schedule clears that floor by 5.5 sessions, so it has room to spare."}]},
           () => b.complete("The <b>therapist</b> limits the clinic, together with the care-plan rule. Rooms have <b>7.25 hours of slack</b> and the network minimum <b>5.5 sessions of surplus</b>. The next steps ask what one more unit of each is worth.")); };
     },
     show(b) { rhsShow(b); $$(".panel td.hot", b.sec.el).forEach(td => td.addEventListener("click", () => b.mem.cell(td.dataset.t, +td.dataset.r, +td.dataset.c))); $$('.panel .report', b.sec.el).forEach(t => t.classList.add("waiting")); },
     async demo(b) { for (const r of [0, 1, 2, 3]) { $(`.panel td[data-t="cons"][data-r="${r}"][data-c="2"]`, b.sec.el).click(); await sleep(500); } }},
    {title: "Constraint R.H. Side",
     body: () => defBox("The constant on the right of a constraint: the capacity available, or the level a contract requires.") +
       exBox(`<b>36</b> room hours, <b>23</b> therapist hours, <b>0</b> for the care-plan rule and <b>6</b> for the network minimum.`),
     extra: "usage", focus: {cols: [4]},
     mount(b) {
       b.mem.w = "ther"; b.mem.c = 23;
       ask(b, "clock", "Practice owner", "Per-diem cover, a longer clinic day or renting a third room all change what is available. Which part of the model does that change?", "choice", {options: [
         {t: "The R.H. Side of the constraint", ok: true, why: "Correct. More capacity means a larger right-hand side."},
         {t: "The contribution per visit", why: "That is an objective coefficient, covered in Lesson 3."},
         {t: "The Final Value", why: "Final Value is the amount the schedule uses. The capacity available is the R.H. Side."}]},
         () => b.complete("A change in capacity is a change in the <b>R.H. Side</b>. The Shadow Price column says what one more hour is worth."));
     },
     show: rhsShow},
    {title: "Shadow Price (Dual Value)",
     body: () => defBox("The change in optimal contribution from one more unit of capacity, as long as the change stays inside the allowable range.") +
       exBox(`Therapist: <b>$95</b> an hour. Rooms: <b>$0</b>. Care-plan rule: <b>−$5</b>. Network minimum: <b>$0</b>.`),
     task: "Drag the coral therapist line outward a few hours, or use the slider. Contribution rises by $95 an hour.",
     extra: "curve", focus: {cells: [["cons", 1, 3]], cols: [3]},
     why: "<p>The owner's salary is already in the budget and does not change with this decision. The <b>$95 shadow price</b> is the gross contribution one more therapist hour brings in. A per-diem therapist costs $60 an hour, so the net gain is $95 − $60 = <b>$35 an hour</b>.</p>",
     whyTitle: "Why compare a $95 shadow price with a $60 rate?",
     mount(b) {
       rhsSlider(b, "ther");
       ask(b, "clock", "Scheduler", "A per-diem therapist offers four hours this week at $60 an hour. What happens to weekly contribution if the clinic takes them?",
         "num", {prefix: "$", answer: 140, hint: "Four more hours is within the allowable increase of 5.8, so the shadow price holds. Each hour brings in $95 and costs $60.", right: "Correct. 4 × ($95 − $60) = $140."},
         async () => { activate(b); await setRHS(b, 27); b.complete("Take the hours. Each one brings in <b>$95</b> and costs $60, so four hours add 4 × $35 = <b>$140</b> to the week."); });
     },
     show: rhsShow,
     async demo(b) { await setRHS(b, 27, 1000); }},
    {title: "Two shadow prices of zero",
     body: () => defBox("A constraint that is not binding has a shadow price of zero. It does not matter whether the room to spare is slack on a ≤ constraint or surplus on a ≥ constraint.") +
       exBox(`Rooms have 36 − 28.75 = <b>7.25</b> hours of slack. The network minimum asks for 6 sessions and the schedule books 11.5, a <b>5.5</b> session surplus. Both shadow prices are <b>$0</b>.`),
     task: "Drag the blue room line, then switch to the magenta floor. Contribution stays at $2,185 until a line cuts into the region.",
     extra: "both", focus: {cells: [["cons", 0, 2], ["cons", 0, 3], ["cons", 3, 2], ["cons", 3, 3]]},
     mount(b) {
       rhsSlider(b, "room");
       b.host.insertAdjacentHTML("beforeend", `<div class="seg live"><button class="on" data-w="room">Treatment rooms</button><button data-w="floor">Network minimum</button></div><div class="res"></div>`);
       $$(".seg button", b.host).forEach(x => x.addEventListener("click", () => {
         activate(b);
         $$(".seg button", b.host).forEach(y => y.classList.toggle("on", y === x));
         const w = x.dataset.w, R = RHS[w];
         const el = $("#" + b.uid("rhs"));
         b.mem.w = w; b.mem.c = R.base; b.mem.seen = [R.base, R.base];
         el.min = R.min; el.max = R.max; el.step = R.step; el.value = R.base;
         $(`label[for="${b.uid("rhs")}"]`).textContent = R.label;
         el.dispatchEvent(new Event("input"));
       }));
       ask(b, "truck", "Practice owner", "The suite next door offers us eight more room hours a week. What is the most we should pay an hour?", "choice", {options: [
         {t: "$95", why: "$95 is the therapist shadow price. The rooms' is $0."}, {t: "$60", why: "That is the per-diem therapist rate."},
         {t: "$0", ok: true, why: "Correct. Room hours are already going unused, so more of them cannot raise contribution."}]},
         async () => { activate(b); await setRHS(b, 48); b.complete("Turn it down. Rooms already have 7.25 unused hours, so eight more leave weekly contribution at $2,185. They are worth <b>$0</b>. The network minimum is worth nothing at the margin for the same reason, from the other side."); });
     },
     show: rhsShow,
     async demo(b) { await setRHS(b, 30, 1200); await sleep(400); await setRHS(b, 36, 700); }},
    {title: "A negative shadow price",
     body: () => defBox("When raising a right-hand side tightens the constraint and shrinks the feasible region, the shadow price is negative: contribution falls.") +
       exBox(`The care-plan rule −2V + T ≥ 0 has a shadow price of <b>−5</b>. Raising its right-hand side demands even more treatment beyond twice the evaluations, which moves the schedule away from the best mix.`),
     task: "Try both buttons.",
     extra: "curve", focus: {cells: [["cons", 2, 3]], cols: [3]},
     mount(b) {
       rhsSlider(b, "plan");
       b.host.insertAdjacentHTML("beforeend", `<div class="ptbtns live"><button class="btn pick small" data-v="2">Raise to +2</button><button class="btn pick small" data-v="-4">Lower to −4</button></div><div class="res"></div>`);
       $$(".pick", b.host).forEach(x => x.addEventListener("click", async () => {
         await setRHS(b, +x.dataset.v, 600);
         sayIn(b, x.dataset.v === "2" ? "2 × (−5) = −$10. Contribution drops to $2,175." : "−4 × (−5) = +$20. Contribution rises to $2,205.");
       }));
       ask(b, "megaphone", "Payer contact", "A stricter contract would require two treatment sessions beyond twice the evaluation count (T ≥ 2V + 2). What does that term cost the clinic a week?",
         "num", {prefix: "$", answer: -10, placeholder: "e.g. −20", hint: "The right-hand side rises from 0 to 2. Multiply the change by the shadow price (−5).", right: "Correct. 2 × (−5) = −$10."},
         () => b.complete("The stricter term costs <b>$10</b> a week: the right-hand side rises by 2, times a shadow price of −5."));
     },
     show: rhsShow,
     async demo(b) { $$(".pick", b.host)[0].click(); await sleep(1100); $$(".pick", b.host)[1].click(); }},
    {title: "Allowable range for a constraint",
     body: () => defBox("The range of right-hand side values over which the shadow price stays the same.") +
       exBox(`Therapist: allowable increase <b>5.8</b>, allowable decrease <b>11</b>. The $95 shadow price holds from <b>12 to 28.8 hours</b>.`),
     task: "Drag the therapist capacity past 28.8 hours and watch where the contribution curve flattens.",
     extra: "curve", focus: {cells: [["cons", 1, 3], ["cons", 1, 5], ["cons", 1, 6]], cols: [5, 6]},
     whyTitle: "Why the shadow price drops to zero at 28.8 hours",
     why: "<p>Up to 28.8 hours the optimal corner slides along the care-plan line and each hour adds $95. At 28.8 hours the rooms are used up as well, and from there the rooms are the binding constraint.</p><p>Past that point another therapist hour buys nothing, so the shadow price falls all the way to <b>$0</b> and the curve goes flat.</p>",
     mount(b) {
       rhsSlider(b, "ther");
       ask(b, "clock", "Scheduler", "If the per-diem therapist offers 8 hours instead of 4, will weekly contribution rise by 8 × $95 = $760?", "choice", {options: [
         {t: "Yes, contribution rises by $760.", why: "Eight hours is more than the allowable increase of 5.8."},
         {t: "No. Eight hours is more than the allowable increase of 5.8, so the bottleneck changes and the model has to be solved again.", ok: true, why: "Correct. With 31 hours the optimal contribution is $2,736. Multiplying predicts $2,945."}]},
         async () => { activate(b); await setRHS(b, 31); b.complete("Outside the allowable range the shadow price stops applying. With 31 therapist hours the optimal contribution is <b>$2,736</b>, while multiplying predicts $2,945, because the rooms run out first."); });
     },
     show: rhsShow,
     async demo(b) { await setRHS(b, 34, 1600); }}
  ]});

  /* ═════════ 5 · USE THE REPORT ═════════ */
  const QUIZ = [
    {q: "Therapist hours go from 23 to 25.", kind: "m", ans: 190, why: "An increase of 2 is within the allowable increase of 5.8, so 2 × $95 = $190."},
    {q: "Therapist hours go from 23 to 31.", kind: "r", why: "An increase of 8 is more than the allowable increase of 5.8."},
    {q: "A treatment session goes from $90 to $95.", kind: "m", ans: 57.5, why: "An increase of 5 is within the allowable increase of 10, so 5 × 11.5 = $57.50."},
    {q: "A treatment session goes from $90 to $85.", kind: "m", ans: -57.5, why: "A decrease of 5 is within the allowable decrease of 190, so −5 × 11.5 = −$57.50."},
    {q: "An evaluation goes from $200 to $230.", kind: "m", ans: 172.5, why: "The allowable increase is 1E+30, so there is no limit: 30 × 5.75 = $172.50."},
    {q: "An evaluation goes from $200 to $170.", kind: "r", why: "A decrease of 30 is more than the allowable decrease of 20."},
    {q: "Room hours go from 36 to 30.", kind: "m", ans: 0, why: "A decrease of 6 is within the allowable decrease of 7.25, and the shadow price is 0, so contribution does not change."},
    {q: "Therapist hours go from 23 to 18.", kind: "m", ans: -475, why: "A decrease of 5 is within the allowable decrease of 11, so −5 × $95 = −$475."}
  ];
  const DECODER = [
    ["vars", "Final Value", "How many of each visit type the optimal schedule books"],
    ["vars", "Reduced Cost", "For a visit type the schedule leaves out: how much its contribution must rise before booking it is worthwhile"],
    ["vars", "Objective Coefficient", "The contribution per visit in the objective function"],
    ["vars", "Allowable Increase / Decrease", "How far a contribution can move before the quantities change"],
    ["cons", "Final Value", "How much of the resource the schedule uses, or the level it reaches on a contract term"],
    ["cons", "Shadow Price", "What one more unit of capacity is worth"],
    ["cons", "Constraint R.H. Side", "The capacity available, or the level a contract requires"],
    ["cons", "Allowable Increase / Decrease", "How far it can move before the shadow price changes"]];
  LESSONS.push({n: 5, title: "Use the report", aside: "report-first",
    lead: `Decide, from the report alone, when a change in contribution can be computed by hand and when the model has to be solved again.`,
    blocks: [
    {title: "When to multiply and when to solve again",
     body: () => `<div class="table-scroll"><table class="rtable"><tr><th>What changed</th><th>Range to check</th><th>Inside the allowable range</th><th>Outside it</th></tr>
       <tr><td>${icon("tag")} Contribution per visit</td><td>Allowable Increase / Decrease in <b>Variable Cells</b></td><td>The quantities do not change: Δ contribution = Δ rate × <b>Final Value</b></td><td rowspan="2" class="stop">Solve again with Solver</td></tr>
       <tr><td>${icon("gauge")} Capacity or contract level</td><td>Allowable Increase / Decrease in <b>Constraints</b></td><td>Δ contribution = Δ capacity × <b>Shadow Price</b></td></tr></table></div>
       <p class="note">The cases from Lessons 3 and 4:</p>
       <div class="table-scroll"><table class="rtable small"><tr><td>Treatment $90 → $95</td><td>+5 ≤ 10</td><td>+5 × 11.5 = <b>+$57.50</b></td></tr>
       <tr><td>Evaluation $200 → $170</td><td>30 > 20</td><td class="stop">Solve again with Solver ($2,070)</td></tr>
       <tr><td>4 per-diem hours at $60</td><td>4 ≤ 5.8</td><td>4 × ($95 − $60) = <b>+$140</b></td></tr>
       <tr><td>8 extra room hours</td><td>constraint has slack</td><td>worth <b>$0</b></td></tr>
       <tr><td>8 per-diem therapist hours</td><td>8 > 5.8</td><td class="stop">Solve again with Solver ($2,736)</td></tr></table></div>`,
     mount(b) { b.complete(); },
     show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
    {title: "Column reference",
     body: () => `<p class="note">What each column of the Sensitivity Report means:</p>
       <div class="table-scroll"><table class="rtable small">${DECODER.map(([t, n, m]) => `<tr><td>${icon(t === "vars" ? "tag" : "gauge")} <b>${n}</b></td><td>${m}</td></tr>`).join("")}</table></div>`,
     mount(b) { b.complete(); },
     show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }},
    {title: "Eight cases",
     body: () => `<p class="note">For each case, decide whether the change in contribution can be computed from the report or the model has to be solved again. The report is on the right.</p>`,
     mount(b) { runQuiz(b, QUIZ); },
     show(b) { regionView({best: true, cornerLabel: bestLabel}); sidePanel(b, {}); }}
  ]});

  /* ═════════ 6 · WHOLE VISITS ONLY ═════════ */
  const ROUNDINGS = [[5, 11], [5, 12], [6, 11], [6, 12]];
  /* Lessons 6 and 7 fill the wedge with points, so the therapist label moves
     out past the region where nothing else sits */
  const therCons = (c = 23) => { const k = baseCons(); k[1].c = c; k[1].labelAt = lineLabelAt(c / 23 * 7); return k; };
  LESSONS.push({n: 6, title: "Whole visits only",
    lead: `The schedule says 5.75 evaluations. Require whole visits and the best schedule moves off the corner the graph pointed at.`,
    blocks: [
    {title: "A schedule the clinic cannot book",
     goal: "See where the corner answer stops being usable.",
     body: () => `<p>Lessons 1 and 2 ended at the corner (5.75, 11.5), worth $2,185 a week. Lesson 2 read that as an average rate: 23 evaluations and 46 treatment sessions over four weeks.</p>
       <p>If the week has to stand on its own, that reading is not available. A visit is an appointment on a calendar, so <span class="v">V</span> and <span class="v">T</span> have to be whole numbers. The model is the same except for one line.</p>
       <div class="model">
         <div class="model-row"><span class="m-type">Max</span><span class="m-expr">200<i>V</i> + 90<i>T</i></span><span class="m-tag obj">Contribution for the week</span></div>
         <div class="model-row sub"><span class="m-type">s.t.</span><span class="m-expr">2<i>V</i> + 1.5<i>T</i> ≤ 36</span><span class="m-tag"><span class="dot fab"></span>Treatment rooms</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr">2<i>V</i> + <i>T</i> ≤ 23</span><span class="m-tag"><span class="dot fin"></span>Therapist</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr">−2<i>V</i> + <i>T</i> ≥ 0</span><span class="m-tag"><span class="dot mix"></span>Care-plan rule</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>T</i> ≥ 6</span><span class="m-tag"><span class="dot cap"></span>Network minimum</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>V</i>, <i>T</i> ≥ 0 and whole</span><span class="m-tag new">The new condition</span></div>
       </div>
       <p class="note">Dropping that last condition gives back the ordinary linear program. That version has a name, because the rest of this lesson keeps returning to it.</p>`,
     terms: ["integer", "relax"],
     mount(b) { b.complete(); },
     show() { regionView({cons: therCons(), best: true, cornerLabel: bestLabel}); }},
    {title: "Rounding the answer",
     goal: "Test the obvious fix.",
     task: "Try each of the four ways to round (5.75, 11.5) to whole visits.",
     body: () => `<p>The first instinct is to round. There are four ways to do it, and the graph says which of them the clinic could actually book.</p>`,
     mount(b) {
       b.mem.seen = new Set(); b.mem.cur = null;
       b.host.innerHTML = `<div class="ptbtns">${ROUNDINGS.map(([v, t]) =>
         `<button class="btn pick small" data-p="${v},${t}">(${v}, ${t})</button>`).join("")}</div><div class="res"></div>`;
       b.mem.test = (v, t) => {
         activate(b);
         const cons = therCons(), ok = isFeasible(cons, v, t);
         b.mem.cur = [v, t, ok]; b.mem.seen.add(v + "," + t);
         b.def.show(b); draw();
         $(".res", b.host).innerHTML = `<p style="margin:.6rem 0 0"><b class="num">(${v}, ${t})</b>
           <span class="badge ${ok ? "ok" : "bad"}">${ok ? "Feasible" : "Infeasible"}</span>
           <span class="note num">${ok ? "worth " + money(intProfit(v, t), 0) : "breaks " + breaks(cons, v, t)}</span></p>${checkTable(cons, v, t)}`;
         if (b.mem.seen.size === 4) b.complete("Two of the four can be booked. The better of them, (5, 12), is worth <b>$2,080</b>, which falls $105 short of the relaxation. The next steps find a whole-number schedule that beats it.");
       };
       $$(".pick", b.host).forEach(x => x.addEventListener("click", () => b.mem.test(...x.dataset.p.split(",").map(Number))));
     },
     show(b) {
       regionView({cons: therCons(), best: true, cornerLabel: bestLabel});
       if (b.mem.cur) {
         const [v, t, ok] = b.mem.cur;
         V.lattice = [{x: v, y: t, cls: ok ? "sel" : "bad", below: true,
                       label: `(${v}, ${t})  ${ok ? money(intProfit(v, t), 0) : "infeasible"}`}];
       }
     },
     async demo(b) { for (const [v, t] of ROUNDINGS) { b.mem.test(v, t); await sleep(900); } }},
    {title: "Every whole-number schedule",
     goal: "Look at the schedules the clinic can actually book.",
     task: "Click the whole-number schedule you think brings in the most.",
     body: () => `<p>The feasible region stays as it was. Now only the points with whole coordinates count, and inside this region there are <b>72</b> of them.</p>
       <p>The care-plan rule keeps the region a narrow wedge, so <span class="v">V</span> never goes above 5 while <span class="v">T</span> reaches 23.</p>`,
     mount(b) {
       b.host.innerHTML = `<div class="res"></div>`;
       b.mem.pick = null;
       b.mem.test = (v, t) => {
         activate(b);
         const cons = therCons();
         if (!isFeasible(cons, v, t)) { sayIn(b, `(${v}, ${t}) is outside the region: it breaks ${breaks(cons, v, t)}.`); return; }
         b.mem.pick = [v, t];
         const best = v === 5 && t === 13;
         if (best) b.complete("(5, 13) brings in <b>$2,170</b>, the most any whole-number schedule brings in here. Every rounding of the corner is a different point, and this one sits inside the region, away from every corner.");
         b.def.show(b); draw();
         sayIn(b, `(${v}, ${t}) brings in <b>${money(intProfit(v, t), 0)}</b>.` + (best ? "" : " Something on this grid does better."));
       };
     },
     show(b) {
       view({cons: therCons(), lines: ALL, region: true});
       const done = App.prog[b.key];
       V.lattice = latticePts(therCons()).map(([x, y]) => {
         const picked = b.mem.pick && b.mem.pick[0] === x && b.mem.pick[1] === y;
         const best = done && x === 5 && y === 13;
         return {x, y, cls: best ? "best" : picked ? "sel" : "", below: true,
                 label: best || picked ? `(${x}, ${y})  ${money(intProfit(x, y), 0)}` : ""};
       });
       b.click((x, y) => b.mem.test(Math.round(x), Math.round(y)), "Click a whole-number point");
     },
     async demo(b) { b.mem.test(5, 11); await sleep(900); b.mem.test(5, 12); await sleep(900); b.mem.test(5, 13); }},
    {title: "What rounding costs",
     goal: "Compare the three answers side by side.",
     body: () => `<div class="table-scroll"><table class="rtable"><tr><th>Schedule</th><th>Where it comes from</th><th>Evaluations</th><th>Treatment</th><th>Contribution</th></tr>
       <tr><td>Relaxation</td><td>The corner the graph points at</td><td>5.75</td><td>11.5</td><td><b>$2,185</b></td></tr>
       <tr><td>Best rounding</td><td>(5.75, 11.5) rounded to whole visits</td><td>5</td><td>12</td><td>$2,080</td></tr>
       <tr><td>Best whole-number schedule</td><td>Searching the 72 grid points</td><td>5</td><td><b>13</b></td><td><b>$2,170</b></td></tr></table></div>
       <p>Rounding gives up <b>$90</b> a week against the best whole-number schedule. Rounding down, to (5, 11), gives up <b>$180</b>.</p>
       <p>The answer sits away from every rounding of the corner: it books one more treatment session than any of them allows, and the therapist hours it frees come from the evaluation that was rounded away.</p>`,
     why: `<p>At the relaxation's corner, therapist hours and the care-plan rule are both binding, and that pins it to (5.75, 11.5).</p>
       <p>At (5, 13) the therapist is still fully booked, 23 hours of 23, but the care-plan rule now has 3 sessions of room. The whole-number condition slides the schedule along the therapist line, away from the crossing. Nothing on the graph marks where it lands, so it cannot be read off the corners.</p>`,
     whyTitle: "Why the best schedule leaves the corner",
     mount(b) { b.complete(); },
     show() {
       view({cons: therCons(), lines: ALL, region: true, corners: true, best: true, cornerLabel: bestLabel});
       V.lattice = [{x: 5, y: 13, cls: "best", below: true, label: "(5, 13)  $2,170"},
                    {x: 5, y: 12, cls: "bad", below: true, label: "(5, 12)  $2,080"}];
     }},
    {title: "The relaxation as a bound",
     goal: "Get something useful out of the easy model.",
     body: () => defBox("For a maximization, the relaxation's optimal value is an upper bound on the whole-number model: every whole-number schedule is also a schedule in the relaxation, so none of them can bring in more.") +
       exBox(`The relaxation brings in <b>$2,185</b> and the best whole-number schedule brings in <b>$2,170</b>. The gap is <b>$15</b>, and that is the whole cost of the whole-number condition.`),
     terms: ["bound"],
     mount(b) {
       ask(b, "gauge", "Practice owner", "Solver reports $2,185 for the relaxation, and we have a whole-number schedule worth $2,170. Before searching any further, how much could a better whole-number schedule add at most?",
         "num", {prefix: "$", answer: 15, hint: "No whole-number schedule can beat the relaxation. Subtract the schedule you have from the bound.",
                 right: "Correct. $2,185 − $2,170 = $15, so at most $15 is still on the table."},
         () => b.complete("The bound caps what is left: at most <b>$15</b>. A gap that small is usually the point to stop searching and book the week."));
     },
     show() {
       view({cons: therCons(), lines: ALL, region: true, corners: true, best: true, cornerLabel: bestLabel,
             iso: {cx: 200, cy: 90, value: 2185, label: "Relaxation  $2,185"}});
       V.lattice = [{x: 5, y: 13, cls: "best", below: true, label: "(5, 13)  $2,170"}];
     }},
    {title: "Core principles",
     goal: "Three statements to carry into the next lesson.",
     body: () => `<div class="rules"><div class="rule">The whole-number condition restricts the variables and leaves the constraints alone. The region and the four lines are the ones from Lesson 1.</div>
       <div class="rule">The best whole-number schedule can sit anywhere inside the region, including well away from every rounding of the corner, so rounding is only a guess and the grid has to be searched.</div>
       <div class="rule">For a maximization the relaxation's value is an <b>upper bound</b> on the whole-number optimum, so it measures what the condition costs.</div></div>`,
     mount(b) { b.complete(); },
     show() {
       view({cons: therCons(), lines: ALL, region: true, corners: true, best: true, cornerLabel: bestLabel});
       V.lattice = latticePts(therCons()).map(([x, y]) => ({x, y, cls: x === 5 && y === 13 ? "best" : "", below: true,
         label: x === 5 && y === 13 ? "(5, 13)  $2,170" : ""}));
     }}
  ]});

  /* ═════════ 7 · YES OR NO DECISIONS ═════════ */
  const COVER = {hours: 4, base: 300, even: 380};   // per-diem cover adds 4 h; worth taking below $380
  const coverCons = y => y ? therCons(23 + COVER.hours) : therCons();
  const coverBest = y => { const p = latticePts(coverCons(y))
    .map(([v, t]) => [intProfit(v, t), v, t]).sort((a, c) => c[0] - a[0])[0]; return {value: p[0], V: p[1], T: p[2]}; };
  LESSONS.push({n: 7, title: "Yes or no decisions",
    lead: `Booking a per-diem therapist for the week is a yes-or-no decision, and that is a variable too.`,
    blocks: [
    {title: "A variable that is 0 or 1",
     goal: "Write a take-it-or-leave-it decision as part of the model.",
     body: () => `<p>A per-diem therapist will cover <b>4 hours</b> this week for a flat <b>$300</b>, booked through an agency. The $300 is owed whether the cover runs one hour or all four, and the agency will not split a booking.</p>
       <p>So the decision takes one of two values. Write it as <span class="v">y</span> = 1 for booking the cover and <span class="v">y</span> = 0 for not, and both of its effects follow:</p>
       <div class="model">
         <div class="model-row"><span class="m-type">Max</span><span class="m-expr">200<i>V</i> + 90<i>T</i> − 300<i>y</i></span><span class="m-tag obj">Contribution, less the agency fee</span></div>
         <div class="model-row sub"><span class="m-type">s.t.</span><span class="m-expr">2<i>V</i> + 1.5<i>T</i> ≤ 36</span><span class="m-tag"><span class="dot fab"></span>Treatment rooms</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr">2<i>V</i> + <i>T</i> ≤ 23 + 4<i>y</i></span><span class="m-tag"><span class="dot fin"></span>Therapist, 4 h more if booked</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr">−2<i>V</i> + <i>T</i> ≥ 0</span><span class="m-tag"><span class="dot mix"></span>Care-plan rule</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>T</i> ≥ 6</span><span class="m-tag"><span class="dot cap"></span>Network minimum</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>V</i>, <i>T</i> ≥ 0 and whole</span><span class="m-tag">Whole visits</span></div>
         <div class="model-row sub"><span class="m-type"></span><span class="m-expr"><i>y</i> = 0 or 1</span><span class="m-tag new">Book the cover, or do not</span></div>
       </div>
       <p>The same <span class="v">y</span> appears twice: once where it buys hours, once where it charges for them. The repetition ties the fee to the capacity.</p>`,
     terms: ["binary", "fixed"],
     mount(b) { b.complete(); },
     show() { view({cons: therCons(), lines: ALL, region: true}); V.lattice = latticePts(therCons()).map(([x, y]) => ({x, y})); }},
    {title: "Two models, one for each answer",
     goal: "See what the binary variable stands for on the graph.",
     task: "Switch between the two answers and watch the therapist line move.",
     body: () => `<p>A variable with two values is two models. Fix <span class="v">y</span> and nothing binary is left: each answer is an ordinary whole-number problem of the kind Lesson 6 solved.</p>`,
     mount(b) {
       b.mem.y = 0;
       b.host.innerHTML = `<div class="seg live"><button class="on" data-v="0">No cover (y = 0)</button><button data-v="1">Book the cover (y = 1)</button></div><div class="res"></div>`;
       $$(".seg button", b.host).forEach(x => x.addEventListener("click", () => {
         activate(b); b.mem.y = +x.dataset.v;
         $$(".seg button", b.host).forEach(z => z.classList.toggle("on", z === x));
         b.def.show(b); draw();
         const r = coverBest(b.mem.y);
         sayIn(b, `Therapist hours are capped at <b>${23 + (b.mem.y ? COVER.hours : 0)}</b>. The best whole-number schedule is <b>(${r.V}, ${r.T})</b>, bringing in <b>${money(r.value, 0)}</b> before the fee.`);
         if (b.mem.y === 1) b.complete("With the cover, the therapist has 27 hours and the best whole-number schedule becomes <b>(6, 15)</b> at <b>$2,550</b>, which is $380 more than the $2,170 without it. The fee still has to come off that.");
       }));
     },
     show(b) {
       const cons = coverCons(b.mem.y), r = coverBest(b.mem.y);
       view({cons, lines: ALL, region: true, animate: false});
       V.lattice = latticePts(cons).map(([x, y]) => ({x, y, cls: x === r.V && y === r.T ? "best" : "", below: true,
         label: x === r.V && y === r.T ? `(${r.V}, ${r.T})  ${money(r.value, 0)}` : ""}));
     },
     async demo(b) { $$(".seg button", b.host)[1].click(); }},
    {title: "Net of the fee",
     goal: "Compare the two answers on the same footing.",
     body: () => `<p>The $2,550 is not comparable to the $2,170 until the fee comes off it. Once it does, the two answers can be read next to each other.</p>
       <div class="readout"><div class="stat"><span>y = 0: (5, 13), no cover</span><b class="num">$2,170</b></div>
       <div class="stat"><span>y = 1: (6, 15), less $300 of fee</span><b class="num">$2,250</b></div>
       <div class="stat ok"><span>Booking the cover is worth</span><b class="num">+$80 a week</b></div></div>
       <p class="note">Whole-number schedules, so no fraction of a visit and no fraction of a booking. The $80 is the whole of the gain.</p>`,
     mount(b) {
       ask(b, "truck", "Scheduler", "The cover adds 4 therapist hours for a flat $300. Taking the whole-number schedules as given, what does booking it add to weekly contribution?",
         "num", {prefix: "$", answer: 80, hint: "Subtract the fee from the schedule it allows, then compare with the schedule without it: ($2,550 − $300) − $2,170.",
                 right: "Correct. $2,250 − $2,170 = $80 a week."},
         () => b.complete("Book the cover. It unlocks <b>$380</b> of extra contribution for <b>$300</b>, so the week is <b>$80</b> better off."));
     },
     show() {
       const cons = coverCons(1);
       view({cons, lines: ALL, region: true});
       V.lattice = [{x: 6, y: 15, cls: "best", below: true, label: "(6, 15)  $2,550"},
                    {x: 5, y: 13, cls: "sel", below: true, label: "(5, 13)  $2,170"}];
     }},
    {title: "Where the decision flips",
     goal: "Find the fee at which the answer changes.",
     task: "Drag the fee until the two answers are worth the same.",
     body: () => `<p>$300 is this week's quote. For the next one, the number to know is the fee at which booking cover stops paying.</p>`,
     mount(b) {
       const id = b.uid("fee");
       b.host.insertAdjacentHTML("afterbegin", slider({id, label: "Agency fee for the cover", min: 0, max: 700, step: 10,
         value: COVER.base, fmt: v => money(v, 0), band: [0, COVER.even], mark: COVER.base,
         legend: "<span>$0</span><span>green: worth booking</span><span>$700</span>"}));
       b.mem.fee = COVER.base;
       b.mem.set = v => {
         b.mem.fee = v;
         const no = coverBest(0).value, yes = coverBest(1).value - v, d = yes - no;
         $(".res", b.host).innerHTML = `<div class="readout tight"><div class="panel-row">
           <div class="stat ${d > 0 ? "muted" : ""}"><span>No cover</span><b class="num">${money(no, 0)}</b></div>
           <div class="stat ${d > 0 ? "" : "muted"}"><span>Cover, net of ${money(v, 0)}</span><b class="num">${money(yes, 0)}</b></div></div>
           <p class="verdict">${Math.abs(d) < 1e-9 ? `<span class="badge">Break-even</span> at ${money(v, 0)} the two answers are worth the same`
             : d > 0 ? `<span class="badge ok">Book it</span> ${money(d, 0)} better a week` : `<span class="badge bad">Do not book it</span> ${money(-d, 0)} worse a week`}</p></div>`;
         if (Math.abs(v - COVER.even) < 1e-9) b.complete("The answer flips at <b>$380</b>: that is the extra contribution the 4 hours unlock, so a fee below it is worth paying and a fee above it is too dear.");
       };
       b.host.insertAdjacentHTML("beforeend", `<div class="res"></div>`);
       bindSlider(id, v => money(v, 0), v => { activate(b); b.mem.set(v); });
       b.mem.set(COVER.base);
     },
     why: `<p>The 4 hours are worth $380 here, and the therapist shadow price from Lesson 4 was $95 an hour: 4 × $95 = $380. The two agree exactly.</p>
       <p>That agreement holds for this instance alone. The shadow price describes the relaxation, where an hour can be used in any fraction. A whole-number model usually cannot take up all of it, so the gain is usually smaller than the shadow price predicts. Check it by solving again.</p>`,
     whyTitle: "Why $380 matches 4 × $95, and why that is luck",
     show(b) {
       const cons = coverCons(1), r = coverBest(1);
       view({cons, lines: ALL, region: true, animate: false});
       V.lattice = [{x: r.V, y: r.T, cls: "best", below: true, label: `(${r.V}, ${r.T})  ${money(r.value, 0)}`},
                    {x: 5, y: 13, cls: "sel", below: true, label: "(5, 13)  $2,170"}];
       b.mem.set(b.mem.fee);
     },
     async demo(b) { await tween($("#" + b.uid("fee")), COVER.even, 1200); }},
    {title: "What Solver gives you, and what it does not",
     goal: "Know which of the earlier lessons still applies.",
     body: () => `<p>In Solver both conditions are ordinary constraints. Select the visit cells and choose <b>int</b>; select the cover cell and choose <b>bin</b>. The solving method stays Simplex LP.</p>
       <div class="table-scroll"><table class="rtable"><tr><th>In the model</th><th>In the Solver dialog</th></tr>
         <tr><td><i>V</i>, <i>T</i> whole</td><td><code>$B$6:$C$6 = int</code></td></tr>
         <tr><td><i>y</i> = 0 or 1</td><td><code>$D$6 = bin</code></td></tr></table></div>
       <p>One thing does change. Solver does not produce a <b>Sensitivity Report</b> for a model with int or bin constraints: Excel reports that the report is not meaningful for it, and the shadow prices and allowable ranges from Lessons 3 to 5 describe the relaxation only.</p>
       <div class="rules"><div class="rule">A quantity that must be whole gets an <b>int</b> constraint. A decision that is taken or not gets a <b>bin</b> variable, appearing once where it unlocks capacity and once where it is charged for.</div>
         <div class="rule">Fix a binary variable and what is left is an ordinary whole-number model. Two values, two models, and the better of the two is the answer.</div>
         <div class="rule">For an integer model there is no Sensitivity Report. Change the number and solve again: that is the only reliable answer to a what-if.</div></div>`,
     mount(b) {
       ask(b, "tag", "Practice owner", "Next week the payer asks what one more therapist hour is worth, and our model now has whole visits and the per-diem cover in it. What do we tell them?", "choice", {options: [
         {t: "Solve the model again with 24 hours and compare", ok: true, why: "Correct. For an integer model that is the only dependable way to answer it."},
         {t: "$95, the shadow price from the Sensitivity Report", why: "Solver writes no Sensitivity Report for a model with int or bin constraints, and $95 describes the relaxation."},
         {t: "Nothing: sensitivity analysis does not apply to integer models", why: "The report is unavailable. The answer is still obtainable, by solving the model again."}]},
         () => b.complete("With whole numbers in the model, a what-if is answered by solving again. The Sensitivity Report belongs to the relaxation, and the relaxation is now only a bound."));
     },
     show() {
       const cons = coverCons(1);
       view({cons, lines: ALL, region: true});
       V.lattice = latticePts(cons).map(([x, y]) => ({x, y, cls: x === 6 && y === 15 ? "best" : "", below: true,
         label: x === 6 && y === 15 ? "(6, 15)  $2,550" : ""}));
     }}
  ]});

  /* every number Lessons 6 and 7 lean on, checked at start-up */
  CASES.clinic.selfCheck = bad => {
    const int = solveInteger(baseCons(), PROFIT);
    if (int.x !== 5 || int.y !== 13 || int.value !== 2170) bad.push("integer optimum");
    const ok4 = ROUNDINGS.map(p => isFeasible(baseCons(), ...p));
    if (ok4.join() !== "true,true,false,false") bad.push("roundings");
    if (latticePts(baseCons()).length !== 72) bad.push("integer point count");
    const covered = solveInteger(therCons(23 + COVER.hours), PROFIT);
    if (covered.x !== 6 || covered.y !== 15 || covered.value !== 2550) bad.push("covered optimum");
    if (covered.value - int.value !== COVER.even) bad.push("break-even fee");
  };

  return LESSONS;
};
