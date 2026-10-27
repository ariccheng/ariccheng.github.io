/* ---- Hero: the profit block, seen in 3D and then from above ---------------
   The feasible region is the floor; the block above it is as tall as the
   weekly profit of each plan, so its top face is the plane z = 50T + 65S.
   Scrolling moves an orthographic camera from a low oblique view to straight
   down, where the contour lines on the top face land on the floor as lines
   of equal profit. The page state is a pure function of scroll progress p. */
const Hero = (() => {
  const UX = 40, UY = 20, UZ = 0.24;                 // px per Trail board, Summit board, dollar
  const REGION = [[0, 0], [5.25, 10.5], [0, 14]];
  const LEVELS = [150, 300, 450, 600, 750, 900];
  let svg, scene, track, tilt, cue, caps, W = 0, H = 0, cur = 0, target = 0, raf = 0;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ramp = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const mix = (a, b, t) => a + (b - a) * t;

  /* line a*T + b*S = c cut down to the part inside the feasible region */
  const regionRows = baseCons().flatMap(asLE).concat({a: -1, b: 0, c: 0}, {a: 0, b: -1, c: 0});
  function insideSeg(a, b, c) {
    const seg = segment(a, b, c);
    if (!seg) return null;
    let [p, q] = seg, t0 = 0, t1 = 1;
    for (const r of regionRows) {
      const fp = r.a * p[0] + r.b * p[1] - r.c, fq = r.a * q[0] + r.b * q[1] - r.c;
      if (fp > 1e-9 && fq > 1e-9) return null;
      if (fp > 1e-9) t0 = Math.max(t0, fp / (fp - fq));
      else if (fq > 1e-9) t1 = Math.min(t1, fp / (fp - fq));
    }
    if (t1 - t0 < 1e-6) return null;
    const at = t => [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
    return [at(t0), at(t1)];
  }

  function frame(p) {
    if (!W || !H) measure();
    if (!W || !H) return;
    /* camera */
    const m = ease(ramp(p, .1, .84));
    const el = mix(24, 90, m) * Math.PI / 180, az = mix(-38, 0, m) * Math.PI / 180;
    const se = Math.sin(el), ce = Math.cos(el), sa = Math.sin(az), ca = Math.cos(az);
    const narrow = W < 980;
    const k = Math.min(W * (narrow ? .8 : .5) / 560, H * .66 / 480) * mix(1.12, 1, m);
    const cx = W * mix(.5, narrow ? .5 : .62, m), cy = H * mix(.86, .55, m);
    /* the camera turns around the block first, then around the whole graph */
    const ox = mix(3 * UX, 280, m), oy = mix(8 * UY, 240, m);
    const P = (T, S, Z = 0) => {
      const x = T * UX - ox, y = S * UY - oy, xr = x * ca - y * sa, yr = x * sa + y * ca;
      return [cx + xr * k, cy - (yr * se + Z * UZ * ce) * k, yr];
    };
    const pt = (q) => q[0].toFixed(1) + "," + q[1].toFixed(1);
    const line = (a, b, cls, extra = "") => `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${extra}/>`;
    const zOf = (T, S) => 50 * T + 65 * S;
    const late = ramp(p, .8, .95), oblique = 1 - ramp(m, .6, 1);
    let s = "";
    /* floor grid */
    s += `<g class="h-grid">`;
    for (let t = 0; t <= 14; t += 1) s += line(P(t, 0), P(t, 24), "");
    for (let v = 0; v <= 24; v += 2) s += line(P(0, v), P(14, v), "");
    s += `</g>`;
    s += line(P(0, 0), P(14, 0), "h-axis") + line(P(0, 0), P(0, 24), "h-axis");
    if (late > 0) {
      s += `<g opacity="${late}">`;
      for (let t = 2; t <= 14; t += 2) { const q = P(t, 0); s += `<text class="h-tick" x="${q[0]}" y="${q[1] + 18}" text-anchor="middle">${t}</text>`; }
      for (let v = 4; v <= 24; v += 4) { const q = P(0, v); s += `<text class="h-tick" x="${q[0] - 8}" y="${q[1] + 4}" text-anchor="end">${v}</text>`; }
      const xl = P(14, 0), yl = P(0, 24);
      s += `<text class="h-zlab" x="${xl[0]}" y="${xl[1] + 36}" text-anchor="end">Trail boards, T</text>
            <text class="h-zlab" x="${yl[0] + 10}" y="${yl[1] + 4}">Summit boards, S</text></g>`;
    }
    /* constraint lines on the floor */
    for (const k2 of baseCons()) {
      const seg = segment(k2.a, k2.b, k2.c);
      if (seg) s += line(P(...seg[0]), P(...seg[1]), "h-cl", `style="stroke:var(--${k2.cls})"`);
    }
    /* footprint and equal-profit lines on the floor */
    s += `<polygon class="h-foot" points="${REGION.map(v => pt(P(...v))).join(" ")}"/>`;
    if (late > 0) for (const L of [300, 600, 945]) {
      const seg = segment(50, 65, L);
      if (seg) s += line(P(...seg[0]), P(...seg[1]), "h-iso", `opacity="${late}"`);
    }
    /* the block: walls far-to-near, then the top face */
    const walls = REGION.map((v, i) => {
      const w = REGION[(i + 1) % REGION.length];
      const quad = [P(...v), P(...w), P(...w, zOf(...w)), P(...v, zOf(...v))];
      return {quad, depth: (quad[0][2] + quad[1][2]) / 2};
    }).sort((a, b) => b.depth - a.depth);
    for (const w of walls) s += `<polygon class="h-wall" points="${w.quad.map(pt).join(" ")}" fill="rgba(140,29,64,${(.1 + .12 * oblique).toFixed(3)})"/>`;
    s += `<polygon class="h-top" points="${REGION.map(v => pt(P(...v, zOf(...v)))).join(" ")}" fill="url(#heroTop)" fill-opacity="${(1 - .55 * late).toFixed(3)}"/>`;
    for (const L of LEVELS) {
      const seg = insideSeg(50, 65, L);
      if (seg) s += line(P(...seg[0], L), P(...seg[1], L), "h-contour");
    }
    /* height axis, fading out as the view flattens */
    if (oblique > .02) {
      const a = P(0, 0), b = P(0, 0, 1100);
      s += `<g opacity="${oblique}">${line(a, b, "h-axis")}<text class="h-zlab" x="${b[0] - 8}" y="${b[1] - 6}" text-anchor="end">Weekly profit</text></g>`;
    }
    /* the best plan */
    const top = P(5.25, 10.5, 945), foot = P(5.25, 10.5);
    if (oblique > .02) s += line(top, foot, "h-drop", `opacity="${oblique}"`);
    s += `<circle class="h-glow" cx="${top[0]}" cy="${top[1]}" r="${16 + 6 * Math.sin(p * 18)}" opacity=".28"/>
          <circle class="h-apex" cx="${top[0]}" cy="${top[1]}" r="8"/>
          <text class="h-lab gold" x="${top[0] + 14}" y="${top[1] - 10}">$945</text>`;
    if (late > 0) {
      const c = P(0, 14);
      s += `<text class="h-lab" opacity="${late}" x="${c[0] + 12}" y="${c[1] - 8}">(0, 14)</text>
            <text class="h-lab" opacity="${late}" x="${top[0] + 14}" y="${top[1] + 26}">(5.25, 10.5)</text>`;
    }
    svg.querySelector(".h-draw").innerHTML = s;

    /* headline lies back into the floor, captions take over */
    const h = ease(ramp(p, 0, .3));
    tilt.style.transform = `translateY(${-30 * h}vh) rotateX(${62 * h}deg) scale(${1 - .12 * h})`;
    tilt.style.opacity = 1 - ramp(p, .08, .2);
    cue.style.opacity = 1 - ramp(p, .02, .08);
    caps.forEach((c, i) => c.classList.toggle("on", p >= [.2, .47, .72][i] && p < [.47, .72, 1.01][i]));
  }

  function measure() {
    W = scene.clientWidth; H = scene.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }
  function progress() {
    const r = track.getBoundingClientRect(), span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }
  function loop() {
    cur += (target - cur) * (reduced ? 1 : .18);
    if (Math.abs(target - cur) < .0005) cur = target;
    frame(cur);
    raf = cur !== target ? requestAnimationFrame(loop) : 0;
  }
  function onScroll() {
    target = progress();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function init() {
    track = $(".hero"); scene = $(".hero-scene"); svg = $(".hero-svg");
    tilt = $(".hero-copy .tilt"); cue = $(".cue"); caps = $$(".cap");
    svg.innerHTML = `<defs><linearGradient id="heroTop" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#C4577A" stop-opacity=".55"/><stop offset=".75" stop-color="#8C1D40" stop-opacity=".78"/>
      <stop offset="1" stop-color="#E9A53B" stop-opacity=".9"/></linearGradient></defs><g class="h-draw"></g>`;
    measure();
    addEventListener("resize", () => { measure(); frame(cur); });
    addEventListener("scroll", onScroll, {passive: true});
    cur = target = progress();
    frame(cur);
  }
  return {init, frame};
})();
