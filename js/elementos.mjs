// Piezas de interfaz que comparten calculadoras, laboratorios y escenas.
export const ROSA = "#b3245c";
/** Color de la página. Con el rosa, el índice va en rosa suave y letra vino; con los demás, lleno y letra blanca. */
export function colorear(c) {
  const s = document.body.style;
  for (const [k, v] of [["--color", c], ["--barra", !c || c === ROSA ? null : c], ["--barra-tinta", !c || c === ROSA ? null : "#ffffff"]]) if (v) s.setProperty(k, v); else s.removeProperty(k);
}
/** Crea un elemento. Los hijos de texto entran como texto, nunca como HTML. */
export function h(tag, at = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(at)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  e.append(...hijos.filter((x) => x != null));
  return e;
}
let serie = 0;

export function campo(rotulo, entrada) {
  entrada.id = `c${++serie}`;
  return h("div", { class: "campo" }, h("label", { for: entrada.id }, rotulo), entrada);
}

/** Pinta la parte llena del deslizador. */
export const llenar = (r) => r.style.setProperty("--p", `${((r.value - r.min) / (r.max - r.min || 1)) * 100}%`);
export function deslizador(rotulo, { min, max, paso, valor, unidad = "" }, cambia) {
  const r = h("input", { type: "range", min, max, step: paso, value: valor });
  const n = h("input", { type: "number", min, max, step: paso, value: valor, "aria-label": `${rotulo}, valor exacto` });
  llenar(r);
  r.addEventListener("input", () => { n.value = r.value; llenar(r); cambia(); });
  n.addEventListener("input", () => { if (n.value !== "") r.value = n.value; llenar(r); cambia(); });
  const c = campo(unidad ? `${rotulo} (${unidad})` : rotulo, r);
  c.append(n);
  c.classList.add("desliza");
  return { el: c, get valor() { return n.value === "" ? NaN : Number(n.value); } };
}

export function tabla(cab, filas) {
  return h("div", { class: "tabla" }, h("table", {},
    h("thead", {}, h("tr", {}, ...cab.map((c) => h("th", { scope: "col" }, c)))),
    h("tbody", {}, ...filas.map((r) => h("tr", {}, ...r.map((c) => h("td", {}, c)))))));
}
export const aviso = (t) => h("p", { class: "aviso", role: "status" }, t);
