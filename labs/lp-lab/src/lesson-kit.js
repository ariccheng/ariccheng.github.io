/* ---- Lesson kit ------------------------------------------------------------
   Pieces both courses use. Anything that carries a case's own numbers lives
   in that case's file instead.                                            */

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
/* the three boxes a lesson body is built from */
const defBox = t => `<div class="defn"><span class="dl">Definition</span><p>${t}</p></div>`;
const exBox = h => `<div class="exbox"><span class="dl">At ${CASE.name.split(" ")[0]}</span><div>${h}</div></div>`;
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
const sayIn = (b, html) => { const r = $(".res", b.host); if (r) r.innerHTML = `<p class="feedback">${html}</p>`; };

/* a manager's question: the card sits in the block, the question goes inside it */
function ask(b, ico, who, q, kind, spec, onRight) {
  b.host.insertAdjacentHTML("beforeend", scenario(ico, who, q));
  const a = $(".scen-a", b.host);
  (kind === "num" ? numQ : choiceQ)(a, spec, onRight);
  a.firstElementChild.classList.add("live");
}

/* ---- whole-number models --------------------------------------------------- */
const intProfit = (x, y) => CASE.obj.cx * x + CASE.obj.cy * y;
/* every whole-number plan inside a feasible region */
function latticePts(cons) {
  const out = [];
  for (let x = 0; x <= PLOT.XM; x++) for (let y = 0; y <= PLOT.YM; y++) if (isFeasible(cons, x, y)) out.push([x, y]);
  return out;
}
/* the reason a whole-number plan fails, named the way the lessons name it */
const breaks = (cons, x, y) => { const k = cons.find(k => !satisfies(k, x, y)); return k ? k.short : null; };

/* ---- the eight-case quiz that closes each course --------------------------- */
function runQuiz(b, QUIZ) {
  let i = 0, right = 0;
  const marks = QUIZ.map(() => ""), host = b.host;
  const next = () => {
    if (i >= QUIZ.length) {
      host.innerHTML = `<div class="q live"><div class="score">${marks.map(m => `<i class="${m}"></i>`).join("")}</div><p><b>${right} of ${QUIZ.length}</b> correct on the first attempt.</p>
        <button class="btn small again">Try again</button></div>`;
      $(".again", host).addEventListener("click", () => runQuiz(b, QUIZ));
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
        numQ(box, {q: `Net change in weekly ${CASE.money}?`, prefix: "$", answer: q.ans, placeholder: "e.g. \u221245", hint: "Multiply the change by the matching shadow price or Final Value.", right: q.why}, done);
      });
    box.addEventListener("click", () => { if ($(".choice.wrong", box) || $(".numin input.wrong", box)) first = false; });
  };
  next();
}
