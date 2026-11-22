// Se carga en cada página: apariencia guardada, laboratorios, fórmulas y animaciones.
import { h, tabla, aviso, colorear } from "./elementos.mjs";
import { escalarFormula } from "./motor.mjs";
import { dibujarLaboratorio } from "./laboratorio.mjs";
import { crema, portadaLiquida, gotaIndice } from "./crema.mjs";
import { botonPausa } from "./base.mjs";

export const raiz = new URL("../", import.meta.url);
export const COLORES = { rosa: "#b3245c", azul: "#10269b", oliva: "#4d5a2c", ocre: "#8a5200", uva: "#5c1f3a", petroleo: "#00616f", violeta: "#3f2463", carbon: "#15171f", terracota: "#9a4320" };
const main = document.querySelector("[data-pieza]")?.parentElement ?? document.querySelector("#quarto-document-content") ?? document.querySelector("main") ?? document.body;
const cabeza = document.querySelector(".cabeza");
export const clave = decodeURI(location.pathname.slice(raiz.pathname.length) || "index.html").replace(/\.html$/, "").replace(/\/$/, "/index").replaceAll("/", "-") || "index";
const piezas = () => [...main.querySelectorAll(":scope > section.level2[id], :scope > [data-pieza]")].map((e) => ({ e, id: e.id || e.dataset.pieza, nombre: e.dataset.nombre || e.querySelector("h2")?.textContent || e.dataset.pieza }));
const PIEZAS = piezas(), foto = cabeza?.querySelector("img"), tit = cabeza?.querySelector("h1");
const ORIG = { foto: foto?.getAttribute("src"), alt: foto?.alt, titulo: tit?.textContent, color: cabeza?.style.getPropertyValue("--color") };
let fotos = null;
const listaFotos = async () => (fotos ??= await (await fetch(new URL("fotos/creditos.json", raiz))).json());

/** Aplica una apariencia. Solo acepta colores y fotos de las listas. */
export async function aplicar(d) {
  const L = await listaFotos(), f = L.find((x) => x.archivo === d.foto);
  if (foto) { foto.src = f ? new URL(`fotos/${f.archivo}`, raiz).href : ORIG.foto; foto.alt = f ? f.descripcion : ORIG.alt; }
  if (tit) tit.textContent = d.titulo || ORIG.titulo;
  const color = Object.hasOwn(COLORES, d.color) ? COLORES[d.color] : ORIG.color;
  colorear(color || null);
  if (cabeza) { if (color) cabeza.style.setProperty("--color", color); cabeza.dataset.alto = ["baja", "media", "alta"].includes(d.alto) ? d.alto : "media"; }
  for (const x of main.querySelectorAll(".foto-agregada")) x.remove();
  const usadas = new Set(), conocidas = new Set(d.conocidas ?? []);
  for (const p of d.partes ?? []) {
    if (p.t === "seccion") { const z = PIEZAS.find((y) => y.id === p.id); if (z) { z.e.hidden = false; main.append(z.e); usadas.add(z.id); } }
    else if (p.t === "foto") {
      const g = L.find((x) => x.archivo === p.archivo);
      if (g) main.append(h("figure", { class: `foto-agregada ${p.ancho === "completa" ? "completa" : ""}` }, h("img", { src: new URL(`fotos/${g.archivo}`, raiz).href, alt: g.descripcion }), p.pie ? h("figcaption", {}, p.pie) : null));
    }
  }
  for (const z of PIEZAS) if (!usadas.has(z.id)) { z.e.hidden = d.partes ? conocidas.has(z.id) : false; main.append(z.e); }
}
window.cuaderno = { clave, piezas: () => PIEZAS.map(({ id, nombre }) => ({ id, nombre })), aplicar, original: ORIG, listaFotos };

if (cabeza) colorear(ORIG.color);
try {
  const ix = await (await fetch(new URL("aspecto/indice.json", raiz))).json();
  if (ix.includes(clave)) await aplicar((await (await fetch(new URL(`aspecto/${clave}.json`, raiz))).json()).aspecto);
} catch { /* sin apariencia guardada: queda la original */ }
document.documentElement.dataset.listo = "si";
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("mueve");

if (document.querySelector("[data-calc]")) import("./calculadoras.mjs");
const listaLabs = document.querySelector("[data-laboratorios]");
if (listaLabs) {
  const [E, M, L] = await Promise.all([import("./escenas.mjs"), import("./motor.mjs"), fetch(new URL("datos/laboratorios.json", raiz)).then((r) => r.json())]);
  const monta = new IntersectionObserver((es) => { for (const x of es) { // solo viven las láminas que se ven
    const l = x.target.datos, dentro = x.target.querySelector(".lienzo");
    if (!x.isIntersecting) { dentro?.remove(); continue; }
    if (dentro || !l.escena || !Object.hasOwn(E.CAT, l.escena.tipo)) continue;
    const v = {}; for (const [k, e] of Object.entries(l.escena.valores)) { try { v[k] = M.evaluar(e, l.entradas); } catch { /* queda el valor propio */ } }
    const esc = E.escena(l.escena.tipo, v); x.target.style.setProperty("--c", esc.color); x.target.prepend(esc.el);
  } }, { rootMargin: "120px" });
  listaLabs.replaceChildren(...L.map((l) => { const a = h("a", { class: "tarja", href: new URL(`laboratorio/${l.archivo}.html`, raiz).href }, h("span", {}, l.titulo)); a.datos = l; monta.observe(a); return a; }));
  E.botonPausa();
}
if (document.querySelector(".modelo[data-escena], [data-previa]")) {
  const E = await import("./escenas.mjs");
  E.relatos();
  for (const x of document.querySelectorAll("[data-previa]")) { const e = E.escena(x.dataset.previa, JSON.parse(x.dataset.valores || "{}")); x.style.setProperty("--c", e.color); x.prepend(e.el); }
  E.botonPausa();
}
for (const el of document.querySelectorAll("[data-lab]")) {
  try {
    const r = await fetch(new URL(`laboratorios/${el.dataset.lab}.json`, raiz));
    if (!r.ok) throw new Error("No se pudo abrir el laboratorio.");
    dibujarLaboratorio((await r.json()).documento, el);
  } catch (e) { el.replaceChildren(aviso(e.message)); }
}
for (const el of document.querySelectorAll("[data-formula]")) {
  try {
    const b = await (await fetch(new URL(`datos/${el.dataset.formula}.json`, raiz))).json();
    const sal = h("div"), L = h("input", { type: "number", min: 1, value: b.lote, id: `lote-${el.dataset.formula}`, oninput: () => calc() });
    const calc = () => { try { const r = escalarFormula(b.fases, L.value); sal.replaceChildren(tabla(["Fase", "Ingrediente", "Función", "%", "g"], r.filas.flatMap((x) => x.ingredientes.map((i) => [x.nombre, i.inci, i.funcion, i.pct.toFixed(2), i.gramos.toFixed(2)])))); } catch (e) { sal.replaceChildren(aviso(e.message)); } };
    calc();
    el.replaceChildren(h("p", { class: "lote" }, h("label", { for: L.id }, "Lote en gramos "), L), sal);
  } catch { el.replaceChildren(aviso("No se pudo abrir la fórmula.")); }
}

crema(); gotaIndice(); botonPausa();
addEventListener("pointerover", (e) => { const b = e.target.closest?.("main button, .archivo"); if (!b || b.contains(e.relatedTarget)) return; const r = b.getBoundingClientRect(); b.style.setProperty("--mx", `${e.clientX - r.left}px`); b.style.setProperty("--my", `${e.clientY - r.top}px`); });
// Portada: cada sección trae su foto
const portada = document.querySelector(".portada");
if (portada) {
  portadaLiquida(portada);
  const capas = [...portada.querySelectorAll(".fondo img")];
  for (const a of portada.querySelectorAll("ol a")) for (const ev of ["pointerenter", "focus"]) a.addEventListener(ev, () => { for (const i of capas) i.classList.toggle("ve", i.dataset.de === a.dataset.de); });
}
// Las fotos y tablas se descubren al llegar a ellas
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const o = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("visto"); o.unobserve(e.target); } }, { threshold: 0.12 });
  for (const e of document.querySelectorAll("figure.lado, .entrada figure, .entrada > div, main h2")) { if (e.tagName !== "H2") e.classList.add("descubre"); o.observe(e); }
}
