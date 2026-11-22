import { h, tabla, aviso } from "./elementos.mjs";
import { escena, botonPausa } from "./escenas.mjs";
import { suma } from "./reglas.mjs";
import * as M from "./motor.mjs";

export const raiz = new URL("../", import.meta.url);
const memo = new Map();
export const lee = (p) => memo.get(p) ?? memo.set(p, fetch(new URL(p, raiz)).then((r) => { if (!r.ok) throw new Error(`No se pudo abrir ${p}.`); return r.json(); })).get(p);
export const COLOR = { "vehículo": "#a9e2ff", humectante: "#b9ec6e", activo: "#7ee0c8", espesante: "#d7c7ff", emoliente: "#ffb638", oclusivo: "#f0d28a", cera: "#ffe7a0", emulsionante: "#ff9d66", coemulsionante: "#ffd0b0", solubilizante: "#ffb27a", tensioactivo: "#ff8f70", acondicionador: "#ffc23d", conservante: "#ff5a7a", antioxidante: "#8fdc6a", "regulador de pH": "#fff6ea", "álcali": "#ffffff", pigmento: "#e2304f", filtro: "#ffffff", carga: "#e8dfd8", aglutinante: "#cfc2ba", estabilizante: "#c9d7e8", fragancia: "#b79bff", exfoliante: "#ffffff", efervescente: "#f4f4ff", "formador de película": "#c8e6ff" };
const NIVEL = ["", "básico", "medio", "avanzado"];
export const gramos = (p, L) => (p * L) / 100;
export const cifras = (g) => (g >= 100 ? g.toFixed(1) : g >= 1 ? g.toFixed(2) : g.toFixed(3));

let globo = null;
export function nota(boton, titulo, texto) {
  if (!globo) { globo = h("div", { class: "globo", popover: "auto", role: "note" }); document.body.append(globo); }
  globo.replaceChildren(h("strong", {}, titulo), h("p", {}, texto));
  globo.showPopover?.();
  const r = boton.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
  globo.style.width = `${w}px`;
  globo.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left))}px`;
  globo.style.top = `${r.bottom + globo.offsetHeight + 12 > innerHeight ? Math.max(8, r.top - globo.offsetHeight - 8) : r.bottom + 8}px`;
}
const ficha = (i) => [i.hace, i.nota, i.limite ? `Límite UE: ${i.limite[0]} (${i.limite[1]}).` : "", i.rango ? `Rango: ${i.rango[0]} (${i.rango[1]}).` : "", i.hlb ? `HLB que pide: ${i.hlb}.` : ""].filter(Boolean).join(" ");
export const botonFicha = (i) => { const b = h("button", { type: "button", class: "termino" }, i.nombre); b.addEventListener("click", () => nota(b, `${i.nombre}. INCI: ${i.inci}`, ficha(i))); return b; };

function cuentas(r, ing, L) {
  const c = r.cuenta, out = [];
  if (!c) return out;
  if (c.hlb) {
    const q = M.hlbRequerido(c.hlb.aceites.map(([, pct, min, max]) => ({ pct, min, max }))), m = (q.min + q.max) / 2, x = M.mezclaEmulsionantes(m, c.hlb.hA, c.hlb.hB);
    out.push(h("p", {}, `La fase oleosa pide un HLB de ${q.min.toFixed(2)} a ${q.max.toFixed(2)}. Para el centro, ${m.toFixed(3)}, la mezcla lleva ${(100 * x).toFixed(1)} % de ${ing[c.hlb.A].nombre} y ${(100 - 100 * x).toFixed(1)} % de ${ing[c.hlb.B].nombre}. Con ${c.hlb.total} % en total son ${(c.hlb.total * x).toFixed(2)} y ${(c.hlb.total * (1 - x)).toFixed(2)} %.`));
  }
  for (const a of c.acidos ?? (c.acido ? [c.acido] : [])) {
    const ac = M.comoAcido(a.pct, a.mA, a.mS), f = M.fraccionNoDisociada(a.pH, a.pKa);
    out.push(h("p", {}, `${a.pct} % de ${ing[a.sal].nombre} equivale a ${ac.toFixed(3)} % de ácido. A pH ${a.pH} queda sin disociar ${(100 * f).toFixed(1)} %, o sea ${(ac * f).toFixed(3)} %. Parte pasa al aceite.`));
  }
  if (c.jabon) {
    const k = L / r.lote, j = c.jabon;
    out.push(h("p", {}, `Para ${(j.masa * k).toFixed(0)} g de aceites, con ${j.sobreengrase} % de sobreengrase y ${j.base} de ${j.pureza} % de pureza, hacen falta ${(j.gramos * k).toFixed(1)} g de ${j.base} y ${(j.agua * k).toFixed(1)} g de agua${j.dilucion ? `, más ${(j.dilucion * k).toFixed(0)} g de agua para diluir` : ""}.`));
  }
  return out;
}

export async function verReceta(el) {
  try {
    const [r, L0] = await Promise.all([lee(`recetas/${el.dataset.receta}.json`), lee("datos/ingredientes.json")]);
    const ing = Object.fromEntries(L0.map((x) => [x.id, x]));
    const items = r.fases.flatMap((f, n) => f.ingredientes.map((i) => ({ id: i.id, pct: i.pct, fase: n, nombre: ing[i.id].nombre, color: COLOR[ing[i.id].clase] ?? "#ffffff" })));
    const E = escena("mezcla", { items, unir: 0 }), lam = h("div", { class: "lamina lamina-lab" }, E.el);
    lam.style.setProperty("--c", E.color);
    let junto = false;
    const bm = h("button", { type: "button", onclick: () => { junto = !junto; E.poner({ unir: junto ? 1 : 0 }); bm.textContent = junto ? "Separar" : "Mezclar"; } }, "Mezclar");
    const lote = h("input", { type: "number", min: 10, step: 10, value: r.lote, id: `lote-${r.slug}`, oninput: () => pinta() }), caja = h("div"), cta = h("div");
    const pinta = () => {
      const L = Number(lote.value);
      if (!(L > 0)) { caja.replaceChildren(aviso("El lote debe ser mayor que cero.")); return; }
      const tb = tabla(["Fase", "Ingrediente", "Función", "%", "g"], r.fases.flatMap((f) => f.ingredientes.map((i, n) => [n ? "" : f.nombre, botonFicha(ing[i.id]), ing[i.id].clase, i.pct.toFixed(2), cifras(gramos(i.pct, L))])));
      tb.querySelectorAll("tbody tr").forEach((tr, n) => { tr.addEventListener("pointerenter", () => E.poner({ foco: n })); tr.addEventListener("pointerleave", () => E.poner({ foco: -1 })); });
      caja.replaceChildren(tb, h("p", { class: "fuente" }, `Suma ${suma(r.fases).toFixed(2)} %. Toca un ingrediente para ver qué hace.`));
      cta.replaceChildren(...cuentas(r, ing, L));
    };
    pinta();
    el.replaceChildren(
      h("p", { class: "datos-receta" }, ...[`Nivel ${NIVEL[r.nivel]}`, r.tiempo ? `${r.tiempo} min` : null, r.pH ? `pH ${r.pH}` : null, r.estado].filter(Boolean).map((x) => h("span", {}, x))),
      h("div", { class: "mesa-lab mesa-receta" },
        h("div", {}, h("p", { class: "lote" }, h("label", { for: lote.id }, "Lote en gramos "), lote), caja, cta),
        h("div", {}, lam, bm, h("p", { class: "pie-escena" }, "Cada gota ocupa un área proporcional a su porcentaje. Las de menos de 0.5 % se dibujan más grandes para que se vean."))),
      h("p", { class: "ordenes" }, h("a", { class: "boton", href: new URL(`hoja.html?receta=${r.slug}`, raiz).href }, "Hoja de laboratorio"), h("a", { class: "boton", href: new URL(`mis-recetas.html?de=${r.slug}`, raiz).href }, "Modificar esta receta")));
    botonPausa();
  } catch (e) { el.replaceChildren(aviso(e.message)); }
}
