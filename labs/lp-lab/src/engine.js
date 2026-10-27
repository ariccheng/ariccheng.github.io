/* ---- Page engine -----------------------------------------------------------
   Every lesson is one long section: a column of blocks on the left and a
   sticky graph (plus an optional panel) on the right. All blocks are open at
   once. The block nearest the middle of the screen, or the one the student
   touches, becomes active and sets the graph to its own state.

   A lesson is {n, title, lead, q, blocks: [...]}. A block is
   {title, body, task, why, mount(b), show(b), demo(b)}: mount() builds the
   block's controls once; show() sets the graph each time it becomes active. */
const QUESTIONS = [
  {k: 1, t: "What can we decide?", lessons: []},
  {k: 2, t: "What is the best we can do?", lessons: [1, 2]},
  {k: 3, t: "What if the numbers change?", lessons: [3, 4, 5]},
  {k: 4, t: "What if answers must be whole numbers or yes/no?", lessons: []}
];
const LESSONS = [];                       // filled by lessons.js
const SOON = ["Build a model from a description", "When there is no single best plan", "Whole boards only", "Yes-or-no decisions", "Review", "Playground"];
const SECTIONS = [];
let CUR = null;

function view(o = {}) { V = Object.assign(freshView(), o); if (CUR) CUR.V = V; return V; }
function draw() {
  if (!CUR) return {};
  const sol = solveLP(V.cons, V.obj);
  CUR.graph.render({
    cons: V.cons, lines: V.lines, halves: V.halves, region: V.region,
    corners: V.corners && sol.corners ? sol.corners : [],
    best: V.best && sol.status !== "infeasible" ? [sol.x, sol.y] : null,
    iso: V.iso, points: V.points, extra: V.extra, cornerLabel: V.cornerLabel, animate: V.animate, drag: V.drag, probe: V.probe
  });
  return sol;
}

/* every step reads with clear instructional design: Objective, Action, Takeaway */
function blockHTML(def, i) {
  const body = typeof def.body === "function" ? def.body() : (def.body || "");
  return `<div class="block-top"><span class="sn">${i + 1}</span><h3>${def.title}</h3></div>
    ${def.goal ? `<div class="row goal"><span class="rl goal-tag">Goal</span><p>${def.goal}</p></div>` : ""}
    ${body ? `<div class="bbody">${body}</div>` : ""}
    ${def.task ? `<div class="row task"><span class="rl action-tag">Action</span><p>${def.task}</p></div>` : ""}<div class="extra"></div>
    <div class="done-msg" role="status"><span class="rl takeaway-tag">Takeaway</span><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#14935C"/>
      <path d="M5.5 10.5l3 3 6-7" pathLength="1" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="dm"></span></div>
    ${def.terms || def.why ? `<div class="terms">${(def.terms || []).map(k => term(k)).join("")}${def.why ? `<button class="term more">${def.whyTitle || "Why does this work?"}</button>` : ""}</div>` : ""}
    ${def.demo || def.custom ? `<div class="block-actions">${def.demo ? `<button class="btn show small">Show me</button>` : ""}${def.custom || ""}</div>` : ""}`;
}

function buildLesson(l) {
  const q = QUESTIONS.find(q => q.lessons.includes(l.n));
  const el = document.createElement("section");
  el.className = "lesson"; el.id = "lesson-" + l.n;
  el.innerHTML = `<div class="wrap"><header class="lesson-head reveal"><span class="no">${l.n}</span><div>
      <div class="q">${q.t}</div><h2>${l.title}</h2><p>${l.lead}</p></div></header>
    <div class="lesson-grid"><div class="flow"></div>
      <div class="aside${l.aside ? " " + l.aside : ""}"><div class="mobile-tabs" role="tablist" aria-label="View toggle">
          <button class="m-tab ${l.aside === "report-first" ? "" : "active"}" data-tab="graph" role="tab" aria-selected="${l.aside === "report-first" ? "false" : "true"}">Graph</button>
          <button class="m-tab ${l.aside === "report-first" ? "active" : ""}" data-tab="panel" role="tab" aria-selected="${l.aside === "report-first" ? "true" : "false"}">Sensitivity table</button>
        </div><div class="gcard"><span class="hint"><i></i>Click on the graph</span>
        <svg class="plot" role="img" aria-label="Graph of production plans: Trail boards across, Summit boards up"></svg></div>
        <div class="panel"></div></div></div>
    <div class="lesson-foot"></div></div>`;
  el.hidden = true;
  $("#lessons").appendChild(el);
  const asideEl = $(".aside", el);
  asideEl.classList.add(l.aside === "report-first" ? "view-panel" : "view-graph");
  $$(".m-tab", asideEl).forEach(btn => {
    btn.addEventListener("click", () => {
      const isPanel = btn.dataset.tab === "panel";
      asideEl.classList.toggle("view-panel", isPanel);
      asideEl.classList.toggle("view-graph", !isPanel);
      $$(".m-tab", asideEl).forEach(b => {
        const sel = b === btn;
        b.classList.toggle("active", sel);
        b.setAttribute("aria-selected", sel ? "true" : "false");
      });
    });
  });
  const sec = {n: l.n, lesson: l, el, graph: new Graph($(".plot", el)), V: freshView(), panel: $(".panel", el),
               gcard: $(".gcard", el), onReport: null, mem: {}, blocks: [], active: null};
  SECTIONS.push(sec);
  l.blocks.forEach((def, i) => {
    const be = document.createElement("article");
    be.className = "block reveal"; be.innerHTML = blockHTML(def, i);
    $(".flow", el).appendChild(be);
    const key = `L${l.n}.${i}`;
    const b = {
      sec, def, el: be, i, key, mem: {},
      get host() { return $(".extra", be); },
      uid: s => `l${l.n}b${i}-${s}`,
      panel(html) { sec.panel.innerHTML = html || ""; sec.el.querySelector(".aside").classList.toggle("has-panel", !!html); return sec.panel; },
      click(fn, hint) {
        sec.graph.onClick = fn ? (x, y) => { activate(b); fn(x, y); } : null;
        sec.gcard.classList.toggle("ask", !!fn);
        if (hint) $(".hint", sec.gcard).lastChild.textContent = hint;
        if (fn && window.innerWidth <= 980) {
          asideEl.classList.remove("view-panel");
          asideEl.classList.add("view-graph");
          $$(".m-tab", asideEl).forEach(t => {
            const isG = t.dataset.tab === "graph";
            t.classList.toggle("active", isG);
            t.setAttribute("aria-selected", isG ? "true" : "false");
          });
        }
        sec.graph.render && draw();
      },
      complete(msg) {
        if (msg) { $(".done-msg .dm", be).innerHTML = msg; $(".done-msg", be).classList.add("show"); }
        be.classList.add("done");
        $(".btn.show", be)?.setAttribute("disabled", "");
        if (msg) announce(msg);
        if (msg && CLASSROOM.on) setTimeout(() => $(".done-msg", be).scrollIntoView({block: "nearest", behavior: "smooth"}), 80);
        if (!App.prog[key]) { App.prog[key] = 1; save(); updateNav(); }
      }
    };
    sec.blocks.push(b);
    if (App.prog[key]) be.classList.add("done");
    be.addEventListener("pointerdown", () => activate(b), true);
    be.addEventListener("focusin", () => activate(b));
    $(".term.more", be)?.addEventListener("click", e => { e.stopPropagation(); openNote(def.whyTitle || "Why does this work?", def.why); });
    $(".btn.show", be)?.addEventListener("click", async e => { e.target.disabled = true; activate(b); await def.demo(b); });
    def.mount && def.mount(b);
    $$(".extra .ctrl, .extra .q, .extra .ptbtns, .extra .seg", be).forEach(x => x.classList.add("live"));
  });
}

function activate(b) {
  const sec = b.sec;
  if (sec.active === b && CUR === sec) return;
  CUR = sec; V = sec.V;
  sec.active?.el.classList.remove("active");
  sec.active = b; b.el.classList.add("active");
  sec.graph.onClick = null; sec.gcard.classList.remove("ask"); sec.onReport = null;
  b.def.show && b.def.show(b);
  draw();
  ping(b.el);
  if (CLASSROOM.on) CLASSROOM.bar();
}
function ping(el) {
  if (el.dataset.pinged) return;
  el.dataset.pinged = 1;
  $$(".live", el).forEach(x => { x.classList.remove("ping"); void x.offsetWidth; x.classList.add("ping"); });
}
function announce(t) { const a = $("#live"); a.textContent = ""; setTimeout(() => a.textContent = String(t).replace(/<[^>]+>/g, ""), 50); }

function buildNav() {
  $(".nav-links").innerHTML = LESSONS.map(l => `<a href="#lesson-${l.n}" data-n="${l.n}">
      <svg class="ring" viewBox="0 0 20 20"><circle class="bg" cx="10" cy="10" r="8"/><circle class="fg" cx="10" cy="10" r="8" pathLength="1"
        stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 10 10)"/></svg><span>${l.n}</span><span class="t">${l.title}</span></a>`).join("");
  updateNav();
}
function updateNav() {
  for (const l of LESSONS) {
    const n = l.blocks.length, d = l.blocks.filter((_, i) => App.prog[`L${l.n}.${i}`]).length;
    const fg = $(`.nav-links a[data-n="${l.n}"] .fg`);
    if (fg) fg.setAttribute("stroke-dashoffset", (1 - d / n).toFixed(3));
  }
}

/* ---- views: the home page, or one lesson at a time --------------------- */
let VIEW = "home";
function showView(id, opts = {}) {
  const lesson = SECTIONS.find(sc => "lesson-" + sc.n === id);
  VIEW = lesson ? id : "home";
  $("#home").hidden = !!lesson;
  SECTIONS.forEach(sc => sc.el.hidden = sc !== lesson);
  $$(".nav-links a").forEach(a => a.classList.toggle("on", a.dataset.n && "lesson-" + a.dataset.n === VIEW));
  if (lesson) {
    CUR = lesson; V = lesson.V;
    activate(opts.last ? lesson.blocks[lesson.blocks.length - 1] : lesson.active || lesson.blocks[0]);
    $$(".ph", lesson.el).forEach(x => {
      x.classList.remove("go");
      setTimeout(() => { x.style.setProperty("--pw", x.offsetWidth + "px"); x.style.setProperty("--phh", x.offsetHeight + "px"); x.classList.add("go"); }, 450);
    });
  }
  if (!opts.keepScroll) scrollTo(0, 0);
  if (lesson) requestAnimationFrame(() => $$(".reveal", lesson.el).forEach(x => x.classList.add("in")));
}
function lessonFoot() {
  SECTIONS.forEach((sc, i) => {
    const prev = SECTIONS[i - 1], next = SECTIONS[i + 1];
    $(".lesson-foot", sc.el).innerHTML = `${prev ? `<a class="foot-link" href="#lesson-${prev.n}"><small>Previous</small><b>${prev.n}. ${prev.lesson.title}</b></a>` : `<a class="foot-link" href="#top"><small>Back to</small><b>The overview</b></a>`}
      ${next ? `<a class="foot-link next" href="#lesson-${next.n}"><small>Next lesson</small><b>${next.n}. ${next.lesson.title}</b></a>` : `<a class="foot-link next" href="#top"><small>Done for now</small><b>Back to the overview</b></a>`}`;
  });
}

/* ---- classroom mode: a 16:9 frame, large type, one block at a time ------- */
const CLASSROOM = {
  on: false,
  fit() {
    const fw = Math.min(innerWidth, innerHeight * 16 / 9), fh = fw * 9 / 16;
    document.documentElement.style.setProperty("--fw", fw + "px");
    document.documentElement.style.setProperty("--fh", fh + "px");
  },
  enter(full = true) {
    this.on = true;
    document.documentElement.classList.add("classroom");
    this.fit();
    if (VIEW === "home") showView("lesson-" + SECTIONS[0].n);
    this.bar();
    if (full && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  },
  exit() {
    this.on = false;
    document.documentElement.classList.remove("classroom");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    CUR?.active?.el.scrollIntoView({block: "center"});
  },
  step(d) {
    const sc = CUR, i = sc.blocks.indexOf(sc.active) + d, k = SECTIONS.indexOf(sc);
    if (i >= 0 && i < sc.blocks.length) return activate(sc.blocks[i]);
    const other = SECTIONS[k + Math.sign(d)];
    if (other) showView("lesson-" + other.n, {last: d < 0});
  },
  bar() {
    const sc = CUR; if (!sc) return;
    const i = sc.blocks.indexOf(sc.active);
    $(".cbar .ct").innerHTML = `<span class="cn">${sc.n}</span>${sc.lesson.title}`;
    $(".cbar .cdots").innerHTML = sc.blocks.map((b, j) => `<i class="${j === i ? "on" : App.prog[b.key] ? "done" : ""}"></i>`).join("");
  }
};

function init() {
  const params = new URLSearchParams(location.search);
  Hero.init();
  LESSONS.forEach(buildLesson);
  lessonFoot();
  $("#home").insertAdjacentHTML("beforeend", `<section class="soon"><div class="wrap"><h2>More lessons are on the way</h2>
    <p>Next: building a model from a description, special cases, and whole-number and yes-or-no decisions.</p>
    <ul>${SOON.map(t => `<li>${t}</li>`).join("")}</ul></div></section>`);
  buildNav();
  // the block crossing the active reading area becomes active
  const isNarrow = window.innerWidth <= 980;
  const rootMargin = isNarrow ? "-32% 0px -32% 0px" : "-40% 0px -48% 0px";
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || CLASSROOM.on) return;
    const b = SECTIONS.flatMap(s => s.blocks).find(b => b.el === e.target);
    if (b) activate(b);
  }), {rootMargin});
  SECTIONS.forEach(s => s.blocks.forEach(b => io.observe(b.el)));
  SECTIONS.forEach(s => activate(s.blocks[0]));
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } }),
    {rootMargin: "0px 0px -8% 0px"});
  $$(".reveal").forEach(x => rv.observe(x));
  addEventListener("scroll", () => $(".nav").classList.toggle("scrolled", scrollY > 10), {passive: true});
  $(".reset").addEventListener("click", () => { App.prog = {}; save(); location.reload(); });
  // routing
  const route = () => showView((location.hash || "#top").slice(1));
  addEventListener("hashchange", route);
  route();
  // classroom mode
  $(".present-btn").addEventListener("click", () => CLASSROOM.on ? CLASSROOM.exit() : CLASSROOM.enter());
  $(".cbar .cexit").addEventListener("click", () => CLASSROOM.exit());
  $(".cbar .cprev").addEventListener("click", () => CLASSROOM.step(-1));
  $(".cbar .cnext").addEventListener("click", () => CLASSROOM.step(1));
  addEventListener("resize", () => CLASSROOM.on && CLASSROOM.fit());
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && CLASSROOM.on) CLASSROOM.exit(); });
  document.addEventListener("keydown", e => {
    if (!CLASSROOM.on || e.target.closest("input,textarea,select") || e.metaKey || e.ctrlKey) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); CLASSROOM.step(1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); CLASSROOM.step(-1); }
    if (e.key === "Escape") CLASSROOM.exit();
  });
  if (params.has("present")) CLASSROOM.enter(false);
}
