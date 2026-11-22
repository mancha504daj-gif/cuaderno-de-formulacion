import test from "node:test";
import assert from "node:assert/strict";
import { ufc, reduccionLog } from "../js/motor.mjs";
import { fusiona, gana, adopta, valida } from "../js/fusion.mjs";
const pl = (colonias, dilucion, volumen = 0.1) => ({ colonias, dilucion, volumen });

test("placas contables: promedio ponderado", () => { const r = ufc([pl(132, 1), pl(148, 1), pl(14, 2), pl(11, 2)]); assert.ok(Math.abs(r.valor - 14000) < 1e-6); assert.equal(r.nota, "contable"); });
test("dos diluciones contables", () => { const r = ufc([pl(232, 1), pl(244, 1), pl(33, 2), pl(28, 2)]); assert.ok(Math.abs(r.valor - 537 / 0.022) < 1e-6); });
test("sin colonias en 1 mL de la dilución 10⁻¹ es menos de 10", () => { assert.equal(ufc([pl(0, 1, 0.5), pl(0, 1, 0.5)]).texto, "menos de 10"); });
test("incontable en todas", () => { assert.match(ufc([pl(400, 1), pl(300, 3)]).texto, /^más de/); });
test("pocas colonias se marca como estimado", () => { const r = ufc([pl(6, 1), pl(8, 1)]); assert.ok(Math.abs(r.valor - 700) < 1e-6); assert.match(r.nota, /estimado/); });
test("reducción de un millón a mil son 3 log", () => { assert.ok(Math.abs(reduccionLog(1e6, 1e3) - 3) < 1e-12); });

const c = (id, cambio, datos, borrado = false) => ({ tipo: "receta", id, cambio, datos, borrado });
test("gana el cambio más reciente en cualquier orden", () => { const a = c("x", 5, 1), b = c("x", 9, 2); assert.equal(gana(a, b), b); assert.equal(gana(b, a), b); });
test("el borrado más reciente no resucita", () => { const r = fusiona([c("x", 5, { v: 1 })], [c("x", 8, null, true)]); assert.equal(r.todo[0].borrado, true); assert.equal(r.subir.length, 0); });
test("dos dispositivos convergen", () => {
  const A = [c("a", 1, 1), c("b", 5, 2)], B = [c("b", 7, 3), c("d", 2, 4)], una = fusiona(A, B), otra = fusiona(B, A), o = (l) => JSON.stringify(l.map((x) => [x.id, x.datos]).sort());
  assert.equal(o(una.todo), o(otra.todo)); assert.deepEqual(una.subir.map((x) => x.id), ["a"]);
});
test("empate de hora: mismo ganador en los dos lados", () => { const a = c("x", 5, { z: 1 }), b = c("x", 5, { z: 2 }); assert.deepEqual(gana(a, b), gana(b, a)); });
test("lo que no es válido se ignora", () => { assert.equal(fusiona([], [{ tipo: "otro", id: "x", cambio: 1, borrado: false }, { tipo: "receta", id: "../x", cambio: 1, borrado: false }]).todo.length, 0); assert.equal(valida(null), false); });
test("al entrar se lleva lo del invitado sin pisar lo más nuevo", () => { assert.deepEqual(adopta([c("x", 3, 1), c("y", 4, 2)], [c("x", 9, 5)]).map((x) => x.id), ["y"]); });
