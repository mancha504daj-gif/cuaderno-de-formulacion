import * as M from "./motor.mjs";
import { probeta, curva } from "./dibujos.mjs";
import { h, campo, deslizador, tabla, aviso } from "./elementos.mjs";
import { escena, botonPausa } from "./escenas.mjs";
export { h, campo, deslizador, tabla, aviso };

const base = new URL("../datos/", import.meta.url);
const cargar = async (n) => {
  const r = await fetch(new URL(n, base));
  if (!r.ok) throw new Error(`No se pudo leer ${n}.`);
  return r.json();
};

const f = (x, d = 2) => Number(x).toFixed(d);
const rango = (a, b, d = 1) => (f(a, d) === f(b, d) ? f(a, d) : `${f(a, d)} a ${f(b, d)}`);
const fuentes = (lista) => h("details", { class: "fuentes" }, h("summary", {}, "Fuentes de estos valores"),
  h("ul", {}, ...[...new Set(lista)].map((x) => h("li", {}, x))));
const protege = (sal, fn) => () => { try { fn(); } catch (e) { sal.replaceChildren(aviso(e.message)); } };

async function hlb(el) {
  const [ac, em] = await Promise.all([cargar("aceites.json"), cargar("emulsionantes.json")]);
  let esc = null;
  const lista = h("div", { class: "renglones" }), sal = h("div", { class: "salida", "aria-live": "polite" });
  const sel = (op, ini) => h("select", { onchange: () => calc() }, ...op.map((o, i) => h("option", { value: i, selected: i === ini }, o)));
  const filas = [];
  const nuevo = (idx = 0, pct = 10) => {
    const s = sel(ac.map((a) => `${a.nombre} (${rango(a.min, a.max)})`), idx);
    const p = h("input", { type: "number", min: 0, step: 0.1, value: pct, "aria-label": "Porcentaje en la fórmula", oninput: () => calc() });
    const fila = { s, p };
    s.setAttribute("aria-label", "Aceite");
    const quitar = () => { filas.splice(filas.indexOf(fila), 1); r.remove(); calc(); };
    const r = h("div", { class: "renglon" }, s, p, h("span", {}, "%"), h("button", { type: "button", onclick: quitar }, "Quitar"));
    filas.push(fila);
    lista.append(r);
  };
  const ix = (arr, t) => Math.max(0, arr.findIndex((x) => x.nombre.includes(t)));
  const A = sel(em.map((e) => `${e.nombre}: ${e.texto}`), ix(em, "Span 80"));
  const B = sel(em.map((e) => `${e.nombre}: ${e.texto}`), ix(em, "Tween 80"));
  const calc = protege(sal, () => {
    const u = filas.map((x) => ({ a: ac[x.s.value], pct: x.p.value }));
    const r = M.hlbRequerido(u.map(({ a, pct }) => ({ pct, min: a.min, max: a.max })));
    const ea = em[A.value], eb = em[B.value];
    const pts = [...new Set([r.min, (r.min + r.max) / 2, r.max].map((x) => +x.toFixed(4)))];
    const fs = pts.map((o) => {
      try {
        const x = M.mezclaEmulsionantes(o, ea.hlb, eb.hlb);
        return [f(o, 1), `${f(100 * x, 1)} %`, `${f(100 - 100 * x, 1)} %`];
      } catch { return [f(o, 1), "fuera del par", "fuera del par"]; }
    });
    try { const pide = (r.min + r.max) / 2, hA = Number(ea.hlb), hB = Number(eb.hlb); if (Number.isFinite(hA) && Number.isFinite(hB)) esc?.poner({ HA: hA, HB: hB, nA: ea.nombre, nB: eb.nombre, pide, a: 100 * M.mezclaEmulsionantes(pide, hA, hB) }); } catch { }
    const out = [h("p", { class: "cifra" }, rango(r.min, r.max), h("small", {}, "HLB requerido de la fase oleosa")),
      tabla(["HLB", ea.nombre, eb.nombre], fs)];
    if (r.max - r.min > 1) out.push(aviso("Las fuentes no coinciden para estos aceites. Prepara ensayos a lo largo del intervalo y elige la emulsión más estable."));
    if (u.some(({ a }) => a.valores.every((v) => v.informal))) out.push(aviso("Uno de los aceites solo tiene valores de fuentes informales."));
    out.push(fuentes([...u.flatMap(({ a }) => a.valores.map((v) => `${a.nombre}: ${rango(v.min, v.max)}. ${v.fuente}`)),
      ...[ea, eb].map((e) => `${e.nombre}: ${e.texto}. ${e.fuente}`)]));
    sal.replaceChildren(...out);
  });
  nuevo(ix(ac, "almendra"), 12);
  nuevo(ix(ac, "karit"), 4);
  el.replaceChildren(h("div", { class: "panel" }, h("h3", {}, "Fase oleosa"), lista,
    h("button", { type: "button", onclick: () => { nuevo(); calc(); } }, "Agregar aceite"),
    h("h3", {}, "Par de emulsionantes"), campo("Emulsionante A", A), campo("Emulsionante B", B)), sal);
  esc = lamina(el, "hlb", "El apoyo está en el HLB medio que pide tu fase oleosa y cada gota pesa lo que su fracción.");
  calc();
}

async function conservante(el) {
  let esc = null;
  const cs = await cargar("conservantes.json"), sal = h("div", { class: "salida", "aria-live": "polite" });
  const s = h("select", { onchange: () => calc() }, ...cs.map((c, i) => h("option", { value: i }, c.nombre)));
  const pH = deslizador("pH", { min: 3, max: 8, paso: 0.1, valor: 5.5 }, () => calc());
  const pct = deslizador("Sal en la fórmula", { min: 0, max: 1, paso: 0.01, valor: 0.4, unidad: "%" }, () => calc());
  const calc = protege(sal, () => {
    const c = cs[s.value], fr = M.fraccionNoDisociada(pH.valor, c.pka), ac = M.comoAcido(pct.valor, c.mAcido, c.mSal);
    esc?.poner({ pH: pH.valor, pKa: c.pka });
    const g = curva({ x0: 3, x1: 8, actual: pH.valor, rotuloX: "pH", rotuloY: "% sin disociar", fn: (x) => 100 * M.fraccionNoDisociada(x, c.pka) });
    const out = [h("p", { class: "cifra" }, `${f(100 * fr, 1)} %`, h("small", {}, "del ácido queda sin disociar")), g,
      tabla(["Magnitud", "Valor"], [[`${c.sal} en la fórmula`, `${f(pct.valor)} %`], ["Expresado como ácido", `${f(ac, 3)} %`], ["Ácido sin disociar", `${f(ac * fr, 3)} %`], ["pKa", f(c.pka)]])];
    if (ac > c.limite) out.push(aviso(`Supera ${c.limite} % como ácido, el límite europeo del Anexo ${c.anexo} para productos sin enjuague.`));
    if (fr < 0.1) out.push(aviso("Queda menos de 10 % sin disociar. Baja el pH o cambia de conservante."));
    out.push(aviso("Este cálculo no reemplaza el ensayo de eficacia del conservante."), fuentes([c.fuente]));
    sal.replaceChildren(...out);
  });
  el.replaceChildren(h("div", { class: "panel" }, campo("Conservante", s), pH.el, pct.el), sal);
  esc = lamina(el, "acido", "Ámbar: molécula entera. Celeste: sin protón. Blanco: protón, fuera de escala.");
  calc();
}

async function stokes(el) {
  let esc = null;
  const dens = await cargar("densidades.json"), sal = h("div", { class: "salida", "aria-live": "polite" });
  const VIS = [["Agua, 0.001", 0.001], ["Loción en reposo, 2547", 2547], ["Crema en reposo, 10 000", 10000], ["Otro valor", null]];
  const s = h("select", { onchange: () => calc() }, ...dens.map((d, i) => h("option", { value: i, selected: d.nombre === "girasol" }, `${d.nombre} (${rango(d.min, d.max)})`)));
  const v = h("select", { onchange: () => { if (VIS[v.value][1] != null) otra.value = VIS[v.value][1]; calc(); } }, ...VIS.map((x, i) => h("option", { value: i }, x[0])));
  const otra = h("input", { type: "number", min: 0.0001, step: "any", value: 0.001, oninput: () => { v.value = VIS.length - 1; calc(); } });
  const r = deslizador("Radio de gota", { min: 0.1, max: 25, paso: 0.1, valor: 5, unidad: "µm" }, () => calc());
  const ro = deslizador("Densidad de la fase acuosa", { min: 980, max: 1100, paso: 1, valor: 1000, unidad: "kg/m³" }, () => calc());
  const t = deslizador("Tiempo", { min: 0, max: 365, paso: 1, valor: 1, unidad: "días" }, () => calc());
  const P = probeta();
  let recorrido = 0;
  const n = (x) => {
    if (x === 0 || (Math.abs(x) >= 0.01 && Math.abs(x) < 1e5)) return f(x);
    const [a, b] = x.toExponential(2).split("e");
    return `${a} × 10^${Number(b)}`;
  };
  const calc = protege(sal, () => {
    const d = dens[s.value];
    const mm = [d.min, d.max].map((x) => M.stokes({ radio_um: r.valor, rho_gota: x, rho_medio: ro.valor, viscosidad: otra.value }) * 86400e3).sort((a, b) => a - b);
    if (!Number.isFinite(t.valor)) throw new Error("Falta un número en «tiempo».");
    recorrido = ((mm[0] + mm[1]) / 2) * t.valor;
    P.mover(recorrido);
    esc?.poner({ radio: Math.max(0.02, r.valor), visc: Math.max(1e-6, Number(otra.value)), delta: ro.valor - (d.min + d.max) / 2 });
    sal.replaceChildren(h("p", { class: "cifra" }, `${n(mm[0])} a ${n(mm[1])}`, h("small", {}, "mm por día; positivo sube, negativo baja")),
      h("div", { class: "con-vaso" }, P.el, h("p", {}, `En ${f(t.valor, 0)} ${t.valor === 1 ? "día" : "días"} una gota recorrería ${n(Math.abs(recorrido))} mm. La probeta mide 100 mm; el dibujo es esquemático.`)),
      aviso("Stokes supone gotas aisladas, rígidas e iguales en un medio newtoniano. Una crema con esfuerzo de fluencia puede no cremar. La coalescencia y la maduración de Ostwald quedan fuera."),
      fuentes([`${d.nombre}: ${d.fuente}`, "Viscosidades en reposo de loción y crema: Dabbaghi 2021, en Referencias."]));
  });
  el.replaceChildren(h("div", { class: "panel" }, campo("Aceite de la gota, a 20 °C (kg/m³)", s), r.el, ro.el, campo("Viscosidad del medio", v), campo("Valor de viscosidad (Pa s)", otra), t.el), sal);
  esc = lamina(el, "stokes", "La tinta sigue las líneas de corriente de Stokes. La velocidad en pantalla está comprimida.");
  calc();
}

async function jabon(el) {
  const ac = await cargar("sap.json"), sal = h("div", { class: "salida", "aria-live": "polite" }), lista = h("div", { class: "renglones" }), filas = [];
  const nuevo = (i, g) => {
    const s = h("select", { "aria-label": "Aceite", onchange: () => calc() }, ...ac.map((a, k) => h("option", { value: k, selected: k === i }, `${a.nombre} (SAP ${rango(a.min, a.max, 0)})`)));
    const p = h("input", { type: "number", min: 0, step: 1, value: g, "aria-label": "Gramos", oninput: () => calc() }), fila = { s, p };
    const quitar = () => { filas.splice(filas.indexOf(fila), 1); r.remove(); calc(); };
    const r = h("div", { class: "renglon" }, s, p, h("span", {}, "g"), h("button", { type: "button", onclick: quitar }, "Quitar"));
    filas.push(fila);
    lista.append(r);
  };
  const base = h("select", { onchange: () => calc() }, h("option", {}, "NaOH"), h("option", {}, "KOH"));
  const se = deslizador("Sobreengrase", { min: 0, max: 20, paso: 0.5, valor: 5, unidad: "%" }, () => calc());
  const pu = deslizador("Pureza del álcali", { min: 80, max: 100, paso: 0.5, valor: 100, unidad: "%" }, () => calc());
  const le = deslizador("Concentración de la lejía", { min: 20, max: 50, paso: 1, valor: 30, unidad: "%" }, () => calc());
  const calc = protege(sal, () => {
    const u = filas.map((x) => ({ a: ac[x.s.value], g: x.p.value }));
    const r = M.alcali(u.map(({ a, g }) => ({ g, min: a.min, max: a.max })), { sobreengrase: se.valor, base: base.value, pureza: pu.valor });
    const extra = (r.max / r.min - 1) * 100;
    sal.replaceChildren(h("p", { class: "cifra" }, `${f(r.min, 1)} g`, h("small", {}, `de ${base.value}, con el SAP más bajo de la norma`)),
      tabla(["Magnitud", "Valor"], [["Aceites", `${f(r.masa, 0)} g`], ["Agua para la lejía", `${f(M.aguaLejia(r.min, le.valor), 1)} g`], [`${base.value} con el SAP más alto`, `${f(r.max, 1)} g`]]),
      aviso(`El SAP de estos aceites varía ${f(extra, 1)} %. El valor bajo evita dejar álcali libre; usa el certificado de tu lote.`),
      aviso("El álcali quema. Usa guantes y lentes, y agrégalo al agua, nunca al revés."),
      fuentes(u.map(({ a }) => `${a.nombre}: ${rango(a.min, a.max, 0)}. ${a.fuente}`)));
  });
  const ix = (x) => Math.max(0, ac.findIndex((y) => y.nombre.includes(x)));
  nuevo(ix("oliva"), 350);
  nuevo(ix("coco"), 150);
  el.replaceChildren(h("div", { class: "panel" }, lista, h("button", { type: "button", onclick: () => { nuevo(0, 100); calc(); } }, "Agregar aceite"), campo("Álcali", base), se.el, pu.el, le.el), sal);
  lamina(el, "jabon", "Esquema de la reacción; no está a escala.").poner({ auto: true });
  calc();
}

async function activa(el) {
  let esc = null;
  const ts = await cargar("tensioactivos.json"), sal = h("div", { class: "salida", "aria-live": "polite" });
  const sel = (i) => h("select", { onchange: () => calc() }, ...ts.map((x, k) => h("option", { value: k, selected: k === i }, `${x.inci}, ${x.nombre}: ${rango(x.min, x.max)} %`)));
  const ix = (x) => Math.max(0, ts.findIndex((y) => y.inci.includes(x)));
  const A = sel(ix("Laureth Sulfate")), B = sel(ix("Cocamidopropyl Betaine"));
  const L = deslizador("Lote", { min: 50, max: 5000, paso: 50, valor: 500, unidad: "g" }, () => calc());
  const ma = deslizador("Materia activa total", { min: 1, max: 25, paso: 0.5, valor: 12, unidad: "%" }, () => calc());
  const pa = deslizador("Parte del primero", { min: 0, max: 100, paso: 5, valor: 75, unidad: "%" }, () => calc());
  const calc = protege(sal, () => {
    const g = (x, parte) => [x.max, x.min].map((c) => M.materiaPrima(L.valor, (ma.valor * parte) / 100, c));
    const a = ts[A.value], b = ts[B.value], ga = g(a, pa.valor), gb = g(b, 100 - pa.valor);
    const usa = (ga[0] + ga[1] + gb[0] + gb[1]) / 2; if (usa > 0) esc?.poner({ paso: 2, final: ma.valor, pct: Math.max(ma.valor, (100 * (L.valor * ma.valor) / 100) / usa) });
    const out = [h("p", { class: "cifra" }, `${rango(ga[0], ga[1])} g`, h("small", {}, a.nombre)), h("p", { class: "cifra" }, `${rango(gb[0], gb[1])} g`, h("small", {}, b.nombre))];
    if (ga[1] + gb[1] > L.valor) out.push(aviso("Estas materias primas no caben en el lote. Baja la materia activa o usa un grado más concentrado."));
    out.push(aviso("Comprueba el activo en el certificado de tu lote."), fuentes([a, b].map((x) => `${x.inci}: ${rango(x.min, x.max)} %. ${x.fuente}`)));
    sal.replaceChildren(...out);
  });
  el.replaceChildren(h("div", { class: "panel" }, campo("Primer tensioactivo", A), campo("Segundo tensioactivo", B), L.el, ma.el, pa.el), sal);
  esc = lamina(el, "activa", "Por cada 100 g de lote, con el activo medio de tus dos materias primas. Cada perla vale medio gramo de activo.");
  calc();
}

function lamina(el, tipo, pie) {
  const E = escena(tipo), c = h("div", { class: "lamina lamina-calc" }, E.el);
  c.style.setProperty("--c", E.color); el.append(c, h("p", { class: "pie-escena pie-calc" }, pie)); botonPausa();
  return E;
}

async function conteo(el) {
  const sal = h("div", { class: "salida", "aria-live": "polite" }), lista = h("div"), filas = [];
  const medio = h("select", { onchange: () => calc() }, h("option", { value: "a" }, "Aerobios, de 15 a 300 colonias"), h("option", { value: "h" }, "Hongos y levaduras, de 10 a 150"));
  const zona = h("select", { onchange: () => calc() }, h("option", { value: 1000 }, "Uso general"), h("option", { value: 100 }, "Ojos, mucosas o menores de 3 años"));
  let esc = null;
  const nueva = (dil, vol, col) => { const D = h("input", { type: "number", min: 0, max: 8, step: 1, value: dil, "aria-label": "Dilución 10 a la menos", oninput: () => calc() }), V = h("input", { type: "number", min: 0.01, step: "any", value: vol, "aria-label": "Mililitros sembrados", oninput: () => calc() }), C = h("input", { type: "number", min: 0, step: 1, value: col, "aria-label": "Colonias", oninput: () => calc() }), fila = { D, V, C }; const r = h("div", { class: "renglon placa" }, h("label", {}, "10⁻ⁿ", D), h("label", {}, "mL", V), h("label", {}, "colonias", C), h("button", { type: "button", onclick: () => { filas.splice(filas.indexOf(fila), 1); r.remove(); calc(); } }, "Quitar")); filas.push(fila); lista.append(r); };
  const calc = protege(sal, () => {
    const u = M.ufc(filas.map((x) => ({ colonias: x.C.value, dilucion: x.D.value, volumen: x.V.value })), medio.value === "h" ? { min: 10, max: 150 } : {});
    esc?.poner({ lg: Math.max(0, Math.log10(Math.max(1, u.valor))), dil: Number(filas[0].D.value), vol: Number(filas[0].V.value) });
    sal.replaceChildren(h("p", { class: "cifra" }, u.texto, h("small", {}, `UFC por gramo (${u.nota})`)), h("p", {}, `El límite de ISO 17516 suma aerobios, hongos y levaduras: ${zona.value} UFC/g. ${u.valor > Number(zona.value) ? "Este conteo solo ya lo pasa." : "Este conteo no lo pasa; falta sumar el otro y descartar patógenos."}`), fuentes(["Conteo: FDA, BAM, capítulo 23 (julio de 2024) y capítulo 3 (enero de 2026).", "Límites: ISO 17516:2014, según SCCS/1647/22, tabla A.9. Por la variabilidad del recuento, la tabla considera fuera de límite un resultado mayor que 200 o 2000 UFC/g."]));
  });
  nueva(1, 0.1, 132); nueva(1, 0.1, 148); nueva(2, 0.1, 14); nueva(2, 0.1, 11);
  el.replaceChildren(h("div", { class: "panel" }, campo("Qué contaste", medio), campo("Producto", zona), lista, h("button", { type: "button", onclick: () => { nueva(1, 0.1, 0); calc(); } }, "Agregar placa")), sal);
  esc = lamina(el, "petri", "La placa dibuja las colonias que esperarías en la primera fila.");
  calc();
}

export const CALCULADORAS = { conteo, hlb, stokes, conservante, jabon, activa };

export async function montar(el) {
  try {
    if (!Object.hasOwn(CALCULADORAS, el.dataset.calc)) throw new Error("No existe esa calculadora.");
    await CALCULADORAS[el.dataset.calc](el);
  } catch (e) { el.replaceChildren(aviso(e.message)); }
}
for (const el of document.querySelectorAll("[data-calc]")) montar(el);
