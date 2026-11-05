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
  if (int.x !== 3 || int.y !== 12 || int.value !== 930) bad.push("integer optimum");
  // Lesson 6: of the four roundings of (5.25, 10.5) only (5, 10) is feasible
  const ok4 = [[5, 10], [5, 11], [6, 10], [6, 11]].map(p => isFeasible(baseCons(), ...p));
  if (ok4.join() !== "true,false,false,false") bad.push("roundings");
  if (latticePts(baseCons()).length !== 48) bad.push("integer point count");
  // Lesson 7: the rented bench adds 8 finishing hours
  const rented = solveInteger(finCons(21 + RENT.hours), PROFIT);
  if (rented.x !== 5 || rented.y !== 16 || rented.value !== 1290) bad.push("rented optimum");
  if (rented.value - int.value !== RENT.even) bad.push("break-even rent");
  if (bad.length) console.error("Linear Programming Lab self-check failed:", bad);
})();

$$("#sheet-dlg [data-k]").forEach(el => el.addEventListener("mouseenter", () => {
  const keys = el.dataset.k.split(" ");
  $$("#sheet-dlg td[data-k]").forEach(td => td.classList.toggle("hl", td.dataset.k.split(" ").some(k => keys.includes(k))));
}));
$("#sheet-dlg .model").addEventListener("mouseleave", () => $$("#sheet-dlg td.hl").forEach(td => td.classList.remove("hl")));
init();
