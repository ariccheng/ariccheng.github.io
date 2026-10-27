/* ---- The Ridgeline model ---------------------------------------------------
   verify.py checks every number shown in the lessons.                       */
const PROFIT = {cx: 50, cy: 65, sense: "max"};
const lineLabelAt = t => k => {
  const s = (k.c - k.a * t) / k.b;
  return s >= 0 && s <= PLOT.YM ? [t, s] : segment(k.a, k.b, k.c)[1];
};
function baseCons() {
  return [
    {id: "fab", a: 3.5, b: 4, op: "<=", c: 84, cls: "fab", name: "Fabrication hours",
     get label() { return `Fabrication  3.5T + 4S ≤ ${fmt(this.c)}`; }, labelAt: lineLabelAt(10.6)},
    {id: "fin", a: 1, b: 1.5, op: "<=", c: 21, cls: "fin", name: "Finishing hours",
     get label() { return `Finishing  T + 1.5S ≤ ${fmt(this.c)}`; }, labelAt: lineLabelAt(3.3), below: true},
    {id: "mix", a: -2, b: 1, op: ">=", c: 0, cls: "mix", name: "Mix rule",
     get label() { return this.c === 0 ? "Mix rule  S ≥ 2T" : `Mix rule  −2T + S ≥ ${fmt(this.c)}`; },
     labelAt: k => [(19 - k.c) / 2, 19]}
  ];
}
/* Sensitivity Report as Solver prints it (rounded the way Excel shows it) */
const REPORT = {
  vars: [["$B$12", "Trail boards", "5.25", "0", "50", "1E+30", "6.666667"],
         ["$C$12", "Summit boards", "10.5", "0", "65", "10", "90"]],
  cons: [["$B$17", "Fabrication hours", "60.375", "0", "84", "1E+30", "23.625"],
         ["$B$18", "Finishing hours", "21", "45", "21", "8.217391", "21"],
         ["$B$19", "Mix rule (−2T + S ≥ 0)", "0", "−2.5", "0", "14", "42"]]
};
/* small line icons (24×24, drawn for this page) */
const ICON = {
  megaphone: '<path d="M3 10v4h3l7 4.5V5.5L6 10H3z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  store: '<path d="M4 9.5 5.2 4h13.6L20 9.5"/><path d="M4 9.5c0 1.4 1.2 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.2 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M5 12v8h14v-8"/><path d="M10 20v-4.5h4V20"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  truck: '<path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3 3.2v2.8h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
  board: '<rect x="9" y="2.5" width="6" height="19" rx="3" transform="rotate(35 12 12)"/><path d="M9.6 9.4l3.6 2.5M10.8 13.7l3.6 2.5"/>',
  tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.5"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/><circle cx="12" cy="17" r="1.3"/>'
};
const icon = (k, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
const REQUESTS = [
  {n: 1, who: "Marketing", icon: "megaphone", kind: "profit", ask: "Raise Summit profit from $65 to $70?", detail: "Summit boards are selling well.",
   stamp: "keep", stampText: "Keep the plan", answer: "Inside the range: +5 ≤ 10. The plan stays. Profit +5 × 10.5 = +$52.50."},
  {n: 2, who: "A large customer", icon: "store", kind: "profit", ask: "Cut Trail profit from $50 to $40?", detail: "They want a lower price.",
   stamp: "resolve", stampText: "Solve again", answer: "Outside the range: 10 > 6.67. Solving again gives (0, 14) and $910."},
  {n: 3, who: "Finishing supervisor", icon: "clock", kind: "resource", ask: "Approve 4 overtime hours at $30 an hour?", detail: "The crew can work on Saturday.",
   stamp: "approve", stampText: "Approve", answer: "Inside the range: 4 ≤ 8.22. Net gain 4 × ($45 − $30) = $60."},
  {n: 4, who: "Outside supplier", icon: "truck", kind: "resource", ask: "Buy 10 more fabrication hours?", detail: "They have spare machine time.",
   stamp: "decline", stampText: "Decline", answer: "Shadow price 0: 23.625 hours already sit unused. Worth $0."}
];

/* ---- state ---------------------------------------------------------------- */
const STORE = "lplab-progress-v1";
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(App.prog)); } catch (e) { /* private mode */ } };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));

const App = {
  prog: load(), token: 0,
  get meeting() { return this.prog.meeting || (this.prog.meeting = {}); }
};

/* view state for the graph; lessons change it and call draw() */
function freshView() {
  return {cons: baseCons(), obj: Object.assign({}, PROFIT), lines: [], halves: [], region: false, corners: false,
          best: false, iso: null, points: [], extra: [], cornerLabel: null, animate: true, drag: null, probe: null};
}
let V = freshView();

/* ---- small components ----------------------------------------------------- */
function countTo(el, to, f = v => money(v)) {
  if (!el) return;
  const from = parseFloat(el.dataset.v || to), t0 = performance.now(), dur = reduced ? 0 : 450;
  el.dataset.v = to;
  cancelAnimationFrame(el._raf);
  const tick = t => {
    const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
    el.textContent = f(from + (to - from) * e);
    if (k < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}
function slider(o) {
  const pct = v => (v - o.min) / (o.max - o.min) * 100;
  const band = o.band ? `<span class="band ok" style="left:${pct(Math.max(o.min, o.band[0]))}%;width:${pct(Math.min(o.max, o.band[1])) - pct(Math.max(o.min, o.band[0]))}%"></span>` : "";
  const mark = o.mark !== undefined ? `<span class="mark" style="left:${pct(o.mark)}%"></span>` : "";
  return `<div class="ctrl"><div class="ctrl-top"><label for="${o.id}">${o.label}</label><output id="${o.id}-out" class="num">${o.fmt(o.value)}</output></div>
    <div class="range"><span class="track"></span>${band}${mark}<input type="range" id="${o.id}" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}"></div>
    ${o.legend ? `<div class="range-legend">${o.legend}</div>` : ""}</div>`;
}
function bindSlider(id, f, fn) {
  const el = $("#" + id), out = $("#" + id + "-out");
  el.addEventListener("input", () => { out.textContent = f(+el.value); fn(+el.value); });
  return el;
}
/* move a slider to a value over time, firing input events (for "Show me") */
async function tween(el, to, ms = 900) {
  const from = +el.value, t0 = performance.now(), tok = App.token;
  return new Promise(res => {
    const tick = t => {
      if (tok !== App.token) return res();
      const k = reduced ? 1 : Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      el.value = from + (to - from) * e; el.dispatchEvent(new Event("input"));
      k < 1 ? requestAnimationFrame(tick) : res();
    };
    requestAnimationFrame(tick);
  });
}
function choiceQ(host, q, onRight) {
  host.insertAdjacentHTML("beforeend", `<div class="q">${q.q ? `<p class="quiz-q">${q.q}</p>` : ""}<div class="choices">${q.options.map((o, i) =>
    `<button class="choice" data-i="${i}">${o.t}</button>`).join("")}</div><div class="feedback" aria-live="polite"></div></div>`);
  const box = host.lastElementChild, fb = $(".feedback", box);
  let solved = false;
  $$(".choice", box).forEach(b => b.addEventListener("click", () => {
    if (solved) return;
    const o = q.options[+b.dataset.i];
    if (o.ok) { solved = true; b.classList.add("right"); fb.className = "feedback ok"; fb.textContent = o.why || "Correct."; onRight && onRight(); }
    else { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); fb.className = "feedback bad"; fb.textContent = o.why || "Not quite. Try again."; }
  }));
  return box;
}
function numQ(host, q, onRight) {
  host.insertAdjacentHTML("beforeend", `<div class="q">${q.q ? `<p class="quiz-q">${q.q}</p>` : ""}
    <div class="numin">${q.prefix || ""}<input inputmode="decimal" aria-label="Your answer" placeholder="${q.placeholder || "number"}"><button class="btn small">Check</button></div>
    <div class="feedback" aria-live="polite"></div></div>`);
  const box = host.lastElementChild, inp = $("input", box), fb = $(".feedback", box);
  const check = () => {
    const v = parseFloat(inp.value.replace(/[$,\s]/g, "").replace("−", "-"));
    if (Math.abs(v - q.answer) <= (q.tol ?? 0.01)) {
      inp.className = "right"; fb.className = "feedback ok"; fb.textContent = q.right; inp.disabled = true; onRight && onRight();
    } else {
      inp.className = ""; void inp.offsetWidth; inp.className = "wrong"; fb.className = "feedback bad";
      fb.textContent = isNaN(v) ? "Type a number." : q.hint;
    }
  };
  $("button", box).addEventListener("click", check);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  return box;
}
function checkTable(cons, x, y) {
  return `<table class="checks">${cons.map(k => {
    const ok = satisfies(k, x, y);
    return `<tr><td><span class="swatch" style="background:var(--${k.cls})"></span>${k.name}</td>
      <td class="num">${fmt(lhs(k, x, y), 3)} ${k.op === "<=" ? "≤" : "≥"} ${fmt(k.c)}</td><td class="${ok ? "y" : "n"}">${ok ? "✓" : "✕"}</td></tr>`;
  }).join("")}</table>`;
}
function usageBars(cons, sol) {
  return `<div class="usage">${cons.map(k => {
    const used = lhs(k, sol.x, sol.y), bind = Math.abs(used - k.c) < 1e-6;
    let w, txt;
    if (k.op === "<=") { w = k.c > 0 ? Math.min(1, used / k.c) : 1; txt = bind ? "binding" : `${fmt(k.c - used, 3)} slack`; }
    else { w = bind ? 1 : .6; txt = bind ? "binding" : `${fmt(used - k.c, 3)} surplus`; }
    const what = k.op === "<=" ? `${fmt(used, 3)} of ${fmt(k.c)} h` : `−2T + S = ${fmt(used, 3)}`;
    return `<div class="use"><span>${k.name}<br><small class="num" style="color:var(--muted)">${what}</small></span>
      <span class="bar"><i class="${bind ? "bind" : "slack"}" style="transform:scaleX(${w})"></i></span><em class="${bind ? "bind" : "slack"} num">${txt}</em></div>`;
  }).join("")}</div>`;
}
/* ---- glossary: every term a student can tap for its meaning --------------
   d = definition, ex = the Ridgeline numbers, use = what to do with it.   */
const TERMS = {
  report: {t: "Sensitivity Report", d: "A report Solver writes after it finds the optimal plan. It says how far each number in the model can move before the answer changes, and what one more unit of each resource is worth.",
           ex: "Two tables: <b>Variable Cells</b> has one row per board, <b>Constraints</b> one row per resource.", use: "Answer what-if questions without solving the model again."},
  final:  {t: "Final Value", d: "In Variable Cells: the optimal amount of each product. In Constraints: the left-hand side at the optimal plan, which is how much of the resource the plan uses.",
           ex: "Trail <b>5.25</b>, Summit <b>10.5</b>. Fabrication uses <b>60.375</b> of 84 hours; finishing uses <b>21</b> of 21.", use: "Read the plan, and compare each Final Value with its right-hand side to find binding constraints."},
  reduced:{t: "Reduced Cost", d: "For a product left out of the plan: how much its profit per unit would have to improve before it enters the plan. It is 0 for any product the plan makes.",
           ex: "Ridgeline makes both boards, so both reduced costs are <b>0</b>.", use: "A product with a non-zero reduced cost is not made at the current prices."},
  coef:   {t: "Objective Coefficient", d: "The number that multiplies a decision variable in the objective function. Here, the profit per board.",
           ex: "<b>$50</b> per Trail board, <b>$65</b> per Summit board.", use: "Requests 1 and 2 change these numbers."},
  allow:  {t: "Allowable Increase and Decrease", d: "For an objective coefficient: how far it can rise or fall before the optimal plan changes. For a right-hand side: how far it can rise or fall while its shadow price still holds.",
           ex: "Summit profit: +<b>10</b> / −<b>90</b>. Finishing hours: +<b>8.22</b> / −<b>21</b>. 1E+30 means no limit.", use: "Check a change against these limits before you multiply."},
  range:  {t: "Allowable range", d: "The interval from (current value − allowable decrease) to (current value + allowable increase). Inside it, the report's answers hold.",
           ex: "Summit profit: up to <b>$75</b>. Finishing hours: <b>0 to 29.22</b>.", use: "Inside the range, multiply. Outside it, solve again."},
  shadow: {t: "Shadow Price", d: "How much the optimal objective value changes when a constraint's right-hand side increases by 1 unit, as long as the change stays inside the allowable range.",
           ex: "Finishing <b>$45</b> per hour. Fabrication <b>$0</b>. Mix rule <b>−2.5</b>.", use: "Compare it with the cost of one more unit: buy if the shadow price is higher."},
  rhs:    {t: "Right-hand side (R.H. Side)", d: "The number on the right of a constraint, usually the amount of a resource that is available.",
           ex: "<b>84</b> fabrication hours, <b>21</b> finishing hours, <b>0</b> for the mix rule.", use: "Requests 3 and 4 change these numbers."},
  binding:{t: "Binding constraint", d: "A constraint whose left-hand side equals its right-hand side at the optimal plan. The resource is used up, and the constraint is what stops the profit from going higher.",
           ex: "Finishing (21 of 21 hours) and the mix rule.", use: "Only a binding constraint can have a non-zero shadow price."},
  slack:  {t: "Slack", d: "The unused amount of a ≤ constraint at the optimal plan: right-hand side minus left-hand side. A constraint with slack is not binding.",
           ex: "Fabrication: 84 − 60.375 = <b>23.625</b> hours unused.", use: "A constraint with slack has a shadow price of 0: more of it is worth nothing."},
  resolve:{t: "Solve again", d: "When a change goes outside its allowable range, the optimal plan itself changes, so the report can no longer predict the result. Change the number in the model and run Solver again.",
           ex: "Trail profit falls to $40 (−10, more than 6.67): the new plan is <b>(0, 14)</b> with profit <b>$910</b>.", use: "Multiply only inside the allowable range."},
  iso:    {t: "Profit line", d: "All plans that earn the same profit lie on one straight line. Its tilt is set by the profit per board of each product.",
           ex: "50T + 65S = 945 passes through the optimal corner (5.25, 10.5).", use: "Changing a profit per board tilts this line; the best corner is the last one it touches."}
};
const term = (k, label) => `<button class="term" data-term="${k}">${label || TERMS[k].t}</button>`;
function openTerm(k) {
  const x = TERMS[k], dlg = $("#term-dlg");
  dlg.innerHTML = `<form method="dialog"><div class="tk">Key term</div><h2>${x.t}</h2><p class="td">${x.d}</p>
    <div class="tex"><span>At Ridgeline</span><p>${x.ex}</p></div><p class="tuse"><b>Use it:</b> ${x.use}</p>
    <div class="block-actions"><button class="btn primary">Got it</button></div></form>`;
  dlg.showModal();
}
function openNote(title, html) {
  const dlg = $("#term-dlg");
  dlg.innerHTML = `<form method="dialog"><div class="tk">Why it works</div><h2>${title}</h2><div class="td">${html}</div>
    <div class="block-actions"><button class="btn primary">Got it</button></div></form>`;
  dlg.showModal();
}
document.addEventListener("click", e => { const t = e.target.closest(".term[data-term]"); if (t) { e.preventDefault(); openTerm(t.dataset.term); } });

/* the Sensitivity Report; focus = {cols:[...], cells:[["cons",1,3]]} dims everything else */
const HEAD_TERM = {vars: [null, null, "final", "reduced", "coef", "allow", "allow"], cons: [null, null, "final", "shadow", "rhs", "allow", "allow"]};
function reportTables(focus) {
  const names = {vars: ["Cell", "Name", "Final Value", "Reduced Cost", "Objective Coefficient", "Allowable Increase", "Allowable Decrease"],
                 cons: ["Cell", "Name", "Final Value", "Shadow Price", "Constraint R.H. Side", "Allowable Increase", "Allowable Decrease"]};
  const hasFocus = focus && (focus.cols || focus.cells);
  if (!hasFocus) focus = focus && focus.rows ? {rows: focus.rows, only: focus.only} : focus && focus.only ? {only: focus.only} : null;
  const on = (kind, i, j) => !focus || !(focus.cols || focus.cells) || (focus.cols || []).includes(j) && (!focus.tables || focus.tables.includes(kind)) ||
    (focus.cells || []).some(c => c[0] === kind && c[1] === i && c[2] === j);
  const head = kind => `<tr>${names[kind].map((n, j) => `<th class="${focus && (focus.cols || []).includes(j) && (!focus.tables || focus.tables.includes(kind)) ? "fcol" : ""}">${HEAD_TERM[kind][j] ? term(HEAD_TERM[kind][j], n) : n}</th>`).join("")}</tr>`;
  const rows = kind => (focus && focus.rows && focus.rows[kind]) || REPORT[kind];
  const body = kind => rows(kind).map((r, i) => `<tr>${r.map((v, j) =>
    `<td class="${j >= 2 ? "hot" : ""}${hasFocus && j >= 2 && !on(kind, i, j) ? " dim" : ""}${hasFocus && on(kind, i, j) && j >= 2 ? " lit" : ""}" data-t="${kind}" data-r="${i}" data-c="${j}">${v}</td>`).join("")}</tr>`).join("");
  const only = focus && focus.only;
  return (only === "cons" ? "" : `<table class="report" data-kind="vars"><caption>${icon("tag")} Variable Cells <small>one row per product</small></caption>${head("vars")}${body("vars")}</table>`) +
         (only === "vars" ? "" : `<table class="report" data-kind="cons"><caption>${icon("gauge")} Constraints <small>one row per resource</small></caption>${head("cons")}${body("cons")}</table>`);
}
function stampHTML(r, fresh) { return `<span class="stamp ${r.stamp}${fresh ? " enter" : ""}">${r.stampText}</span>`; }
/* one request card; answered cards carry their stamp (and, if asked, the answer) */
function reqCard(r, withAnswer) {
  const done = App.meeting[r.n];
  return `<div class="req ${r.kind}" data-n="${r.n}" data-ans="${withAnswer ? 1 : 0}"><span class="req-ico">${icon(r.icon)}</span>
    <div><b>${r.n}. ${r.who}</b><p>${r.ask}</p><small>${r.detail}</small>
    ${withAnswer && done ? `<div class="ans">${r.answer}</div>` : ""}</div>${done ? stampHTML(r) : ""}</div>`;
}
function stampRequest(n) {
  App.meeting[n] = true; save();
  const r = REQUESTS.find(r => r.n === n);
  $$(`.req[data-n="${n}"]`).forEach(el => {
    const tmp = document.createElement("div"); tmp.innerHTML = reqCard(r, el.dataset.ans === "1");
    const fresh = tmp.firstElementChild; fresh.querySelector(".stamp")?.classList.add("enter");
    el.replaceWith(fresh);
  });
}
