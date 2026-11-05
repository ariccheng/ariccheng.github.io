"""Independent check of every number LP Lab shows for Ridgeline Boards.

Pure Python (no scipy): vertex enumeration for the LP, brute force for the
integer model, and fine scans for the sensitivity ranges. Prints a JSON
object; index.html carries the same numbers in its RIDGELINE constant.

    python3 verify.py
"""
import itertools
import json

PROFIT = (50, 65)  # Trail, Summit
# every constraint as a*T + b*S <= c
BASE = {
    "fabrication": ((3.5, 4), 84),
    "finishing": ((1, 1.5), 21),
    "mix": ((2, -1), 0),  # -2T + S >= 0, stored as 2T - S <= 0
}
NONNEG = [((-1, 0), 0), ((0, -1), 0)]
EPS = 1e-9


def solve(c=PROFIT, rhs=None):
    rhs = rhs or {}
    cons = [(a, rhs.get(k, b)) for k, (a, b) in BASE.items()] + NONNEG
    best, corners = None, set()
    for (a, ba), (d, bd) in itertools.combinations(cons, 2):
        det = a[0] * d[1] - a[1] * d[0]
        if abs(det) < EPS:
            continue
        t = (ba * d[1] - a[1] * bd) / det
        s = (a[0] * bd - ba * d[0]) / det
        if all(p[0] * t + p[1] * s <= q + 1e-7 for p, q in cons):
            v = c[0] * t + c[1] * s
            corners.add((round(t + 0.0, 6), round(s + 0.0, 6)))
            if best is None or v > best[2] + 1e-7:
                best = (t, s, v)
    return best, sorted(corners)


def coef_range(i, lo, hi, step=0.001):
    """Range of objective coefficient i over which the optimal corner stays put."""
    base = [round(z, 6) for z in solve()[0][:2]]
    same = lambda v: [round(z, 6) for z in solve(tuple(v if j == i else PROFIT[j] for j in (0, 1)))[0][:2]] == base
    down = PROFIT[i]
    while down - step > lo and same(down - step):
        down -= step
    up = PROFIT[i]
    while up + step < hi and same(up + step):
        up += step
    return round(down, 2), (round(up, 2) if up + step < hi else None)


def shadow_price(k, h=1e-4):
    b = BASE[k][1]
    return (solve(rhs={k: b + h})[0][2] - solve(rhs={k: b - h})[0][2]) / (2 * h)


def rhs_range(k, lo, hi, step=0.001):
    """Range of RHS k over which the shadow price stays the same."""
    b, sp = BASE[k][1], shadow_price(k)

    def keep(r):
        best = solve(rhs={k: r})[0]
        return best is not None and abs(best[2] - solve()[0][2] - sp * (r - b)) < 1e-4

    down = b
    while down - step >= lo - EPS and keep(down - step):
        down -= step
    up = b
    while up + step < hi and keep(up + step):
        up += step
    return round(down, 3), (round(up, 3) if up + step < hi else None)


def feasible(t, s, fin=None):
    cons = [(a, fin if k == "finishing" and fin is not None else b) for k, (a, b) in BASE.items()]
    return all(a[0] * t + a[1] * s <= b + EPS for a, b in cons)


def lattice(fin=None):
    """Every whole-number plan inside the feasible region."""
    return [(x, y) for x in range(31) for y in range(41) if feasible(x, y, fin)]


def int_best_at(fin=None):
    return max((50 * x + 65 * y, x, y) for x, y in lattice(fin))


(t, s, v), corners = solve()
lhs = {k: round(a[0] * t + a[1] * s, 4) for k, (a, b) in BASE.items()}
integer_best = max((50 * x + 65 * y, x, y) for x in range(30) for y in range(30) if feasible(x, y))

out = {
    "optimum": {"T": t, "S": s, "profit": v},
    "corners": [{"T": a, "S": b, "profit": 50 * a + 65 * b} for a, b in corners],
    "lhs": lhs,
    "slack": {k: round(BASE[k][1] - lhs[k], 4) for k in BASE},
    # the report writes mix as -2T + S >= 0, so its shadow price flips sign
    "shadow_price": {k: round(shadow_price(k) * (-1 if k == "mix" else 1), 4) for k in BASE},
    "coef_range": {"Trail": coef_range(0, -200, 400), "Summit": coef_range(1, -200, 400)},
    "rhs_range": {
        "fabrication": rhs_range("fabrication", 0, 200),
        "finishing": rhs_range("finishing", 0, 60),
        # in the <= form; the report's >= form swaps increase and decrease
        "mix": rhs_range("mix", -60, 60),
    },
    # finishing profit curve breakpoints (Lesson 7)
    "finishing_curve": {r: round(solve(rhs={"finishing": r})[0][2], 2)
                        for r in (0, 10, 21, 25, 29.2174, 30, 31.5, 35, 40)},
    "summit_76": solve((50, 76))[0],
    # Monday meeting (Lessons 5-7)
    "meeting": {
        "summit_plus5": solve((50, 70))[0],
        "trail_minus10": solve((40, 65))[0],
        "finishing_plus4": solve(rhs={"finishing": 25})[0],
        "fabrication_plus10": solve(rhs={"fabrication": 94})[0],
        # Lessons 5-6 page examples (v6)
        "summit_80": solve((50, 80))[0],
        "finishing_31": solve(rhs={"finishing": 31})[0],
        "mix_plus2": solve(rhs={"mix": -2})[0],  # -2T + S >= 2, stored as 2T - S <= -2
        "trail_40_enters_at": coef_range(0, 0, 400),
    },
    # Lesson 6: whole boards only
    "integer": {
        "best": {"T": integer_best[1], "S": integer_best[2], "profit": integer_best[0]},
        "point_count": len(lattice()),
        "max_T": max(p[0] for p in lattice()),
        "max_S": max(p[1] for p in lattice()),
        "roundings": {
            f"{x},{y}": {"feasible": feasible(x, y), "profit": 50 * x + 65 * y,
                         "fabrication": round(3.5 * x + 4 * y, 3), "finishing": round(x + 1.5 * y, 3),
                         "mix_ok": y >= 2 * x}
            for x, y in ((5, 10), (5, 11), (6, 10), (6, 11))
        },
        "rounding_cost": integer_best[0] - (50 * 5 + 65 * 10),
        "bound_gap": round(v - integer_best[0], 4),
        "binding_at_best": {k: round(a[0] * integer_best[1] + a[1] * integer_best[2], 4)
                            for k, (a, b) in BASE.items()},
    },
    # Lesson 7: rent a second finishing bench (+8 h for a fixed weekly rent)
    "binary": {
        "hours": 8,
        "rent": 300,
        "no_rent": {"T": integer_best[1], "S": integer_best[2], "profit": integer_best[0]},
        "rented": {"T": int_best_at(29)[1], "S": int_best_at(29)[2], "profit": int_best_at(29)[0]},
        "lp_rented": solve(rhs={"finishing": 29})[0],
        "integer_gain": int_best_at(29)[0] - integer_best[0],
        "lp_gain": round(solve(rhs={"finishing": 29})[0][2] - v, 4),
        "net_at_300": int_best_at(29)[0] - 300 - integer_best[0],
        "break_even_rent": int_best_at(29)[0] - integer_best[0],
    },
}
print(json.dumps(out, indent=2))
