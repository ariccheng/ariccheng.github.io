/* ---- start-up self-check and boot ----------------------------------------
   The report table is typed in as Solver prints it; recompute it here and
   complain in the console if the two ever disagree.                      */
(function selfCheck() {
  const s = sensitivity(baseCons(), PROFIT), bad = [];
  const near = (a, b) => (b === "1E+30" ? a === Infinity : Math.abs(a - parseFloat(b.replace("−", "-"))) < 1e-4);
  s.variables.forEach((v, i) => { const r = REPORT.vars[i];
    if (!near(v.final, r[2]) || !near(v.inc, r[5]) || !near(v.dec, r[6])) bad.push(r[1]); });
  s.constraints.forEach((c, i) => { const r = REPORT.cons[i];
    if (!near(c.final, r[2]) || !near(c.shadow, r[3]) || !near(c.inc, r[5]) || !near(c.dec, r[6])) bad.push(r[1]); });
  const int = solveInteger(baseCons(), PROFIT);
  if (int.x !== 3 || int.y !== 12) bad.push("integer optimum");
  if (bad.length) console.error("Linear Programming Lab self-check failed:", bad);
})();

$$("#sheet-dlg [data-k]").forEach(el => el.addEventListener("mouseenter", () => {
  const keys = el.dataset.k.split(" ");
  $$("#sheet-dlg td[data-k]").forEach(td => td.classList.toggle("hl", td.dataset.k.split(" ").some(k => keys.includes(k))));
}));
$("#sheet-dlg .model").addEventListener("mouseleave", () => $$("#sheet-dlg td.hl").forEach(td => td.classList.remove("hl")));
init();
