import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { revisar, suma, total } from "../js/reglas.mjs";
import * as m from "../js/motor.mjs";
const lee = (p) => JSON.parse(readFileSync(new URL("../" + p, import.meta.url)));
const R = readdirSync(new URL("../recetas/", import.meta.url)).map((f) => lee("recetas/" + f));
const ids = new Set(lee("datos/ingredientes.json").map((x) => x.id)), prod = new Set(lee("datos/productos.json").map((x) => x.slug));

test("cada receta suma 100", () => { for (const r of R) assert.ok(Math.abs(suma(r.fases) - 100) < 0.011, `${r.slug}: ${suma(r.fases)}`); });
test("ningún aviso de límites o incompatibilidad", () => { for (const r of R) assert.deepEqual(revisar(r), [], r.slug); });
test("cada ingrediente tiene ficha y cada receta su producto", () => {
  for (const r of R) { assert.ok(prod.has(r.producto), r.slug); for (const i of r.fases.flatMap((f) => f.ingredientes)) assert.ok(ids.has(i.id), `${r.slug}: ${i.id}`); }
  for (const p of prod) assert.ok(R.some((r) => r.producto === p), p);
});
test("cada receta trae pasos, controles, fallas, avisos y fuentes", () => {
  for (const r of R) for (const k of ["pasos", "controles", "fallas", "avisos", "fuentes", "cambia"]) assert.ok(r[k]?.length, `${r.slug}: ${k}`);
  for (const r of R) assert.ok(["sin ensayar", "en ensayo", "ensayada"].includes(r.estado), r.slug);
});
test("loción de almendras: par de emulsionantes y ácido", () => {
  const r = R.find((x) => x.slug === "locion-de-almendras"), t = total(r.fases), q = m.hlbRequerido([{ pct: 12, min: 6, max: 7 }, { pct: 4, min: 8, max: 8 }]);
  const x = m.mezclaEmulsionantes((q.min + q.max) / 2, 4.3, 15);
  assert.ok(Math.abs(t.get("span80") - 4 * x) < 0.01);
  const a = m.comoAcido(0.4, 112.13, 150.22);
  assert.ok(Math.abs(a - 0.2986) < 1e-3);
  assert.ok(Math.abs(a * m.fraccionNoDisociada(4.8, 4.76) - 0.1424) < 1e-3);
});
test("los jabones pesan el álcali que pide el motor", () => {
  for (const r of R.filter((x) => x.jabon)) {
    const j = r.jabon, a = m.alcali(j.aceites.map(([, g, s]) => ({ g, min: s, max: s })), j), t = total(r.fases), k = j.base === "NaOH" ? "naoh" : "koh";
    assert.ok(Math.abs((t.get(k) * r.lote) / 100 - a.min) < 0.3, r.slug);
  }
});
test("el catiónico sin enjuague queda bajo el límite", () => { assert.ok(total(R.find((x) => x.slug === "crema-para-peinar").fases).get("ctac") * 0.25 <= 1); });
