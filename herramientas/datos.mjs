// Convierte las tablas de ../investigacion/datos en los JSON del sitio.
// Uso: node herramientas/datos.mjs
import { readFileSync, writeFileSync } from "node:fs";
const ORIGEN = new URL("../../investigacion/datos/", import.meta.url);
function csv(nombre) {
  const s = readFileSync(new URL(nombre, ORIGEN), "utf8").replace(/^﻿/, "");
  const filas = []; let f = [], c = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const x = s[i];
    if (q) { if (x === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += x; }
    else if (x === '"') q = true;
    else if (x === ",") { f.push(c); c = ""; }
    else if (x === "\n" || x === "\r") { if (c !== "" || f.length) { f.push(c); filas.push(f); } f = []; c = ""; }
    else c += x;
  }
  if (c !== "" || f.length) { f.push(c); filas.push(f); }
  const cab = filas.shift();
  return filas.map((r) => Object.fromEntries(cab.map((k, i) => [k, (r[i] ?? "").trim()])));
}
const rango = (t) => { const m = t.match(/^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?$/); return m ? [Number(m[1]), Number(m[2] ?? m[1])] : null; };
const guardar = (n, d) => { writeFileSync(new URL(`../datos/${n}`, import.meta.url), JSON.stringify(d, null, 1)); console.log(n, d.length); };
const TILDES = { algodon: "algodón", canamo: "cáñamo", vison: "visón", acido: "ácido", estearico: "esteárico", isoestearico: "isoesteárico", cetilico: "cetílico", cetoestearilico: "cetoestearílico", estearilico: "estearílico", karite: "karité", trigliceridos: "triglicéridos", caprilico: "caprílico", caprico: "cáprico", argan: "argán", domestica: "doméstica", maiz: "maíz", sesamo: "sésamo", cartamo: "cártamo", glucosido: "glucósido", cetearilico: "cetearílico" };
const es = (s) => s.replace(/[a-z]+/g, (w) => TILDES[w] ?? w);
const ap = (f) => f.slice(0, 260);

// Las filas tomadas de tablas completas de Benson no se publican.
const ac = new Map();
for (const r of csv("hlb_requerido_aceites.csv")) {
  const v = rango(r.rhlb_ow);
  if (!v || /Benson/i.test(r.fuente)) continue;
  if (!ac.has(r.INCI)) ac.set(r.INCI, { inci: r.INCI, nombre: es(r.nombre_comun), valores: [] });
  ac.get(r.INCI).valores.push({ min: v[0], max: v[1], fuente: ap(r.fuente), informal: /hlbcalc|agregador|informal/i.test(r.fuente + r.notas) });
}
guardar("aceites.json", [...ac.values()].map((a) => ({ ...a, min: Math.min(...a.valores.map((x) => x.min)), max: Math.max(...a.valores.map((x) => x.max)) })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
guardar("emulsionantes.json", csv("hlb_emulsionantes.csv").filter((r) => rango(r.hlb) && !/Benson/i.test(r.fuente) && /^no ionico/.test(r.tipo_ionico))
  .map((r) => { const v = rango(r.hlb); return { inci: r.INCI, nombre: es(r.nombre_comercial_o_comun), hlb: (v[0] + v[1]) / 2, texto: r.hlb, fuente: ap(r.fuente) }; }).sort((a, b) => a.hlb - b.hlb));
const molar = { "Benzoic Acid; Sodium Benzoate": ["benzoato de sodio", 122.12, 144.10], "Sorbic Acid; Potassium Sorbate": ["sorbato de potasio", 112.13, 150.22] };
guardar("conservantes.json", csv("conservantes.csv").filter((r) => molar[r.INCI])
  .map((r) => ({ inci: r.INCI, nombre: r.nombre_comun, pka: Number(r.pka), limite: Number(r.conc_max_ue_pct), anexo: r.anexo_ue, sal: molar[r.INCI][0], mAcido: molar[r.INCI][1], mSal: molar[r.INCI][2], fuente: "pKa: PubChem. Límite: Reg. (CE) 1223/2009, texto consolidado al 18-05-2026" })));
guardar("densidades.json", csv("densidad_aceites.csv").filter((r) => r.temperatura_C === "20")
  .map((r) => ({ nombre: es(r.aceite), inci: r.INCI, min: Math.round(Number(r.densidad_relativa_min) * 9982) / 10, max: Math.round(Number(r.densidad_relativa_max) * 9982) / 10, fuente: r.fuente })));
guardar("sap.json", csv("sap_aceites.csv").filter((r) => Number(r.sap_koh_mg_g_min) > 0).map((r) => ({ nombre: es(r.aceite), inci: r.INCI, min: Number(r.sap_koh_mg_g_min), max: Number(r.sap_koh_mg_g_max), fuente: ap(r.fuente) })));
guardar("tensioactivos.json", csv("tensioactivos.csv").filter((r) => rango(r.materia_activa_comercial_pct)).map((r) => { const v = rango(r.materia_activa_comercial_pct); return { inci: r.INCI, nombre: r.nombre_comercial_tipico, min: v[0], max: v[1], fuente: ap(r.fuente) }; }));
