import { h, aviso } from "./elementos.mjs";
import { lee, nota, raiz } from "./receta.mjs";
import { escena, CAT, botonPausa } from "./escenas.mjs";
import * as A from "./almacen.mjs";

export async function productos(el) {
  try {
    const P = (await lee("datos/productos.json")).filter((p) => p.seccion === el.dataset.productos), color = getComputedStyle(document.body).getPropertyValue("--color").trim();
    const monta = new IntersectionObserver((es) => { for (const x of es) {
      const p = x.target.datos, dentro = x.target.querySelector(".lienzo");
      if (!x.isIntersecting) { dentro?.remove(); continue; }
      if (dentro || !Object.hasOwn(CAT, p.escena)) continue;
      const e = escena(p.escena, { ...p.valores, ...(/^#[0-9a-f]{6}$/i.test(color) && color !== "#15171f" ? { color } : {}) });
      x.target.style.setProperty("--c", e.color); x.target.prepend(e.el);
    } }, { rootMargin: "120px" });
    el.replaceChildren(...P.map((p) => { const a = h("a", { class: "tarja", href: new URL(`producto/${p.slug}.html`, raiz).href }, h("span", {}, p.nombre, h("small", {}, p.forma))); a.datos = p; monta.observe(a); return a; }));
    botonPausa();
  } catch (e) { el.replaceChildren(aviso(e.message)); }
}

export async function preguntas(el) {
  try {
    const L = (await lee("datos/preguntas.json"))[el.dataset.preguntas] ?? [];
    let bien = 0; const hechas = new Set(), marca = h("p", { class: "cifra", "aria-live": "polite" });
    const pinta = () => marca.replaceChildren(`${bien} de ${L.length}`, h("small", {}, "respuestas correctas al primer intento"));
    pinta();
    el.replaceChildren(...L.map((x, n) => { const r = h("p", { role: "status", class: "respuesta" }); return h("fieldset", { class: "pregunta" }, h("legend", {}, x.p), ...x.o.map((o, i) => h("button", { type: "button", onclick: (ev) => { for (const b of ev.currentTarget.parentElement.querySelectorAll("button")) b.removeAttribute("aria-pressed"); ev.currentTarget.setAttribute("aria-pressed", "true"); const ok = i === x.c; if (!hechas.has(n)) { hechas.add(n); if (ok) bien++; pinta(); } r.textContent = ok ? `Correcto. ${x.e}` : "Vuelve a leer la lección y prueba otra."; } }, o)), r); }), marca);
  } catch (e) { el.replaceChildren(aviso(e.message)); }
}

export async function palabras(zona) {
  const T = (await lee("datos/terminos.json")).sort((a, b) => b.palabra.length - a.palabra.length), vistos = new Set();
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), rx = new RegExp(`(?<![\\p{L}\\p{N}])(${T.map((t) => esc(t.palabra)).join("|")})(?:s|es)?(?![\\p{L}\\p{N}])`, "giu"), de = new Map(T.map((t) => [t.palabra.toLowerCase(), t]));
  const sigue = document.createTreeWalker(zona, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest("a,button,h1,h2,h3,summary,script,style,math,mjx-container,.math,.termino,.glosa,table,.lienzo,legend,label,.fuente,.pie-escena,.sin-glosa") || !n.parentElement.closest("p,li") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) }), nodos = [];
  while (sigue.nextNode()) nodos.push(sigue.currentNode);
  for (const n of nodos) {
    const t = n.textContent; let fin = 0; const out = [];
    for (const m of t.matchAll(rx)) {
      const d = de.get(m[1].toLowerCase());
      if (!d || vistos.has(d.id) || (d.palabra === "Salida" || d.palabra === "Carga" && m[1] === "carga")) continue;
      vistos.add(d.id);
      const b = h("button", { type: "button", class: "termino" }, m[0]);
      b.addEventListener("click", () => nota(b, d.palabra, [d.def, d.ej].filter(Boolean).join(" Ejemplo: ")));
      out.push(t.slice(fin, m.index), b); fin = m.index + m[0].length;
    }
    if (out.length) { out.push(/^[.,;:)]/.test(t.slice(fin)) ? "\u2060" + t.slice(fin) : t.slice(fin)); n.replaceWith(...out); }
  }
}

export function buscador(el) {
  const c = document.querySelector(el.dataset.busca); if (!c) return;
  const i = h("input", { type: "text", placeholder: "Buscar", "aria-label": "Buscar", oninput: () => { const t = i.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); for (const x of c.querySelectorAll("[data-ficha]")) x.hidden = !!t && !x.textContent.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(t); for (const s of document.querySelectorAll("section.level2")) { const f = s.querySelectorAll("[data-ficha]"); if (f.length) s.hidden = ![...f].some((x) => !x.hidden); } } });
  el.replaceChildren(i);
}

export function avance(el) {
  const cajas = [...el.querySelectorAll("li")], marca = h("p", { class: "cifra" }), leeV = () => new Set(A.uno("avance", "camino") ?? []);
  let v = leeV();
  const pares = cajas.map((li, n) => { const k = li.dataset.paso ?? String(n), b = h("input", { type: "checkbox", "aria-label": "Hecho", onchange: (x) => { x.target.checked ? v.add(k) : v.delete(k); A.guarda("avance", "camino", [...v]); pinta(); } }); li.replaceChildren(b, h("span", {}, ...li.childNodes)); return [k, b]; });
  const pinta = () => { for (const [k, b] of pares) b.checked = v.has(k); marca.replaceChildren(`${pares.filter(([k]) => v.has(k)).length} de ${cajas.length}`, h("small", {}, A.quien() ? "pasos hechos, guardados en tu cuenta" : "pasos hechos, guardados en este navegador")); };
  pinta(); el.prepend(marca);
  addEventListener("cuaderno-actualizado", () => { v = leeV(); pinta(); }); A.alCambiar(() => { v = leeV(); pinta(); });
}
