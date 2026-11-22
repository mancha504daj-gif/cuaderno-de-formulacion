import test from "node:test";
import assert from "node:assert/strict";
import * as m from "../js/motor.mjs";
const cerca = (a, b, t) => assert.ok(Math.abs(a - b) <= t, `${a} no está a ${t} de ${b}`);

test("Span 80 y polisorbato 80: mezcla para HLB 10", () => {
  cerca(m.mezclaEmulsionantes(10, 4.3, 15.0), 5 / 10.7, 1e-12);
});
test("el par no alcanza un HLB fuera de su intervalo", () => {
  assert.throws(() => m.mezclaEmulsionantes(16, 4.3, 15));
  assert.throws(() => m.mezclaEmulsionantes(10, 8, 8));
});
test("HLB requerido pondera por masa y conserva el intervalo", () => {
  const r = m.hlbRequerido([{ pct: 10, min: 10, max: 12 }, { pct: 30, min: 6, max: 6 }]);
  cerca(r.min, 7, 1e-12); cerca(r.max, 7.5, 1e-12);
});
test("Stokes: valor calculado a mano y dependencia con r al cuadrado", () => {
  const b = { radio_um: 1, rho_gota: 900, rho_medio: 1000, viscosidad: 0.001 };
  cerca(m.stokes(b), 2e-12 * 9.80665 * 100 / 0.009, 1e-18);
  cerca(m.stokes({ ...b, radio_um: 0.5 }) / m.stokes(b), 0.25, 1e-12);
  assert.ok(m.stokes({ ...b, rho_gota: 1100 }) < 0);
});
test("ácido sórbico: la mitad activa a pH igual a pKa", () => {
  cerca(m.fraccionNoDisociada(4.76, 4.76), 0.5, 1e-12);
  cerca(m.fraccionNoDisociada(5.76, 4.76), 1 / 11, 1e-12);
});
test("benzoato de sodio expresado como ácido", () => cerca(m.comoAcido(0.5, 122.12, 144.10), 0.42373, 1e-5));
test("los bloques calculan igual que el motor", () => {
  const N = (v) => ({ t: "num", v }), V = (v) => ({ t: "var", v }), B = (op, a, b) => ({ t: "bin", op, a, b });
  const e = B("/", N(100), B("+", N(1), B("^", N(10), B("-", V("pH"), V("pKa")))));
  cerca(m.evaluar(e, { pH: 5.5, pKa: 4.76 }), 100 * m.fraccionNoDisociada(5.5, 4.76), 1e-9);
});
test("una expresión rota avisa y no ejecuta nada", () => {
  assert.throws(() => m.evaluar({ t: "var", v: "constructor" }, {}));
  assert.throws(() => m.evaluar({ t: "fun", f: "toString", a: { t: "num", v: 1 } }, {}));
  assert.throws(() => m.evaluar({ t: "bin", op: "/", a: { t: "num", v: 1 }, b: { t: "num", v: 0 } }, {}));
  assert.throws(() => m.evaluar(null, {}));
});
test("la fórmula completa con c.s.p. y escala al lote", () => {
  const r = m.escalarFormula([{ nombre: "A", ingredientes: [{ inci: "Aqua", csp: true }, { inci: "Glycerin", pct: 4 }] }], 250);
  cerca(r.filas[0].ingredientes[0].gramos, 240, 1e-9);
  assert.throws(() => m.escalarFormula([{ nombre: "A", ingredientes: [{ inci: "X", pct: 101 }] }], 100));
});
test("jabón de oliva: 500 g, SAP 190, 5 % de sobreengrase", () => {
  const r = m.alcali([{ g: 500, min: 190, max: 190 }], { sobreengrase: 5, base: "NaOH", pureza: 100 });
  cerca(r.min, (500 * 0.19 * 40) / 56.11 * 0.95, 1e-9);
  cerca(r.min, 64.3, 0.1);
  cerca(m.alcali([{ g: 500, min: 190, max: 190 }], { sobreengrase: 0, base: "KOH", pureza: 90 }).max, 95 / 0.9, 1e-9);
  assert.throws(() => m.alcali([], { sobreengrase: 5, base: "NaOH", pureza: 100 }));
});
test("agua de lejía al 30 %", () => cerca(m.aguaLejia(60, 30), 140, 1e-9));
test("SLES: 8 % en 1000 g", () => {
  cerca(m.materiaPrima(1000, 8, 70.5), 113.475, 0.001);
  cerca(m.materiaPrima(1000, 8, 27), 296.296, 0.001);
});

test("mayor y menor entre dos", () => {
  const n = (v) => ({ t: "num", v }), op = (o, a, b) => ({ t: "bin", op: o, a: n(a), b: n(b) });
  assert.equal(m.evaluar(op("max", 0, -3), {}), 0);
  assert.equal(m.evaluar(op("min", 6, 4), {}), 4);
});
