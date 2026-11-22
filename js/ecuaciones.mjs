import { evaluar } from "./motor.mjs";
import { h, tabla } from "./elementos.mjs";
import { escena, botonPausa, quieto } from "./escenas.mjs";
import { flujo } from "./flujo.mjs";

const NS = "http://www.w3.org/1998/Math/MathML";
const m = (t, ...hijos) => { const e = document.createElementNS(NS, t); e.append(...hijos); return e; };
const mi = (t) => { const e = m("mi", t); if (t.length > 1) e.setAttribute("mathvariant", "normal"); return e; };
const mo = (t) => m("mo", t), fila = (...x) => m("mrow", ...x);
const SUPER = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function cifra(v) {
  if (!Number.isFinite(v)) return "?";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e-3 && a < 1e5) return String(Number(v.toPrecision(4)));
  const [x, y] = v.toExponential(3).split("e");
  return `${Number(x)}×10${String(Number(y)).replace(/./g, (c) => SUPER[c])}`;
}
const mn = (v) => {
  const t = cifra(v);
  if (!t.includes("×")) return m("mn", t.replace("-", "−"));
  const [x, y] = v.toExponential(3).split("e"), k = Number(y);
  return fila(m("mn", String(Number(x)).replace("-", "−")), mo("×"), m("msup", m("mn", "10"), k < 0 ? fila(mo("−"), m("mn", String(-k))) : m("mn", String(k))));
};
const marca = (e, s, num) => { e.setAttribute("data-s", s); if (num) e.setAttribute("data-num", ""); return e; };
const nivel = (n) => (n.op === "max" || n.op === "min" ? 9 : n.t !== "bin" ? (n.t === "num" && n.v < 0 ? 0 : 9) : n.op === "+" || n.op === "-" ? 1 : n.op === "*" ? 2 : 3);
const entre = (x) => fila(mo("("), x, mo(")"));

export function escribir(n, vars) {
  if (!n) return mi("falta un bloque");
  if (n.t === "num") { const a = Math.abs(n.v); return a === 0 || (a >= 1e-4 && a < 1e6) ? m("mn", String(n.v).replace("-", "−")) : mn(n.v); }
  if (n.t === "var") return vars && Object.hasOwn(vars, n.v) ? marca(vars[n.v] < 0 ? entre(mn(vars[n.v])) : mn(vars[n.v]), n.v, true) : marca(mi(n.v), n.v);
  if (n.t === "fun") {
    const a = escribir(n.a, vars);
    if (n.f === "raiz") return m("msqrt", a);
    if (n.f === "exp") return m("msup", mi("e"), a);
    return n.f === "ln" ? fila(mi("ln"), entre(a)) : fila(m("msub", mi("log"), m("mn", "10")), entre(a));
  }
  if (n.t !== "bin") return mi("?");
  if (n.op === "/") return m("mfrac", escribir(n.a, vars), escribir(n.b, vars));
  if (n.op === "^") return m("msup", nivel(n.a ?? { t: "x" }) < 9 ? entre(escribir(n.a, vars)) : escribir(n.a, vars), escribir(n.b, vars));
  if (n.op === "max" || n.op === "min") return fila(mi(n.op === "max" ? "máx" : "mín"), mo("("), escribir(n.a, vars), mo(","), escribir(n.b, vars), mo(")"));
  const p = nivel(n), A = escribir(n.a, vars), C = escribir(n.b, vars);
  const a = n.a && nivel(n.a) < p ? entre(A) : A;
  const c = n.b && (nivel(n.b) < p || (n.op === "-" && nivel(n.b) === p)) ? entre(C) : C;
  return fila(a, mo(n.op === "*" ? "×" : n.op === "-" ? "−" : "+"), c);
}
const math = (...x) => { const e = m("math", ...x); e.setAttribute("display", "block"); return e; };
const nombres = (n, s = new Set()) => { if (!n) return s; if (n.t === "var") s.add(n.v); nombres(n.a, s); nombres(n.b, s); return s; };
const uni = (t) => m("mtext", t ? `\u00a0${t}` : "");
const alta = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const seguro = (n, v) => { try { return evaluar(n, v); } catch { return NaN; } };
const sub = (a, b) => m("msub", mi(a), m("mtext", b));

const SUP_STOKES = ["Las gotas son esferas rígidas, iguales y están lejos unas de otras.", "El flujo es lento y el medio es newtoniano: su viscosidad no cambia con el esfuerzo.", "No hay coalescencia, floculación ni maduración de Ostwald."];

function sustituir(bloque) {
  const metas = [...bloque.querySelectorAll("[data-num][data-s]")], fin = bloque.querySelector("[data-fin]");
  if (quieto() || bloque.dataset.vuela) return;
  bloque.dataset.vuela = "si";
  metas.forEach((m, i) => {
    const de = bloque.querySelector(`tr[data-s="${CSS.escape(m.dataset.s)}"] td:last-child`);
    if (!de) return;
    const a = de.getBoundingClientRect(), b = m.getBoundingClientRect();
    const c = h("span", { class: "vuelo", "aria-hidden": "true" }, m.textContent);
    c.style.left = `${b.left}px`; c.style.top = `${b.top}px`;
    document.body.append(c);
    m.style.opacity = 0;
    const dx = a.left - b.left, dy = a.top - b.top;
    c.animate([{ transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 0 }, { transform: `translate(${dx}px, ${dy - 14}px) scale(1.35)`, opacity: 1, offset: 0.2 }, { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 46}px) scale(1.3)`, opacity: 1, offset: 0.65 }, { transform: "none", opacity: 1 }], { duration: 950, delay: i * 170, easing: "cubic-bezier(.3,.6,.2,1)", fill: "backwards" }).finished.catch(() => {}).then(() => { c.remove(); m.style.opacity = ""; });
  });
  fin?.animate?.([{ opacity: 0.1 }, { opacity: 0.1, offset: 0.8 }, { opacity: 1 }], { duration: 950 + metas.length * 170 });
  setTimeout(() => delete bloque.dataset.vuela, 1000 + metas.length * 170);
}
const tono = (x) => { const c = getComputedStyle(x).getPropertyValue("--color").trim(); return /^#[0-9a-f]{6}$/i.test(c) ? c : null; };
const conVuelo = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { conVuelo.unobserve(e.target); sustituir(e.target.closest(".calculo")); } }, { threshold: 1, rootMargin: "0px 0px -12% 0px" });

export function ficha(partes) {
  const usa = partes.filter((p) => ["calculo", "probeta", "salida", "curva"].includes(p.t)), reglas = partes.filter((p) => p.t === "si");
  const sup = partes.filter((p) => p.t === "supuesto").map((p) => p.texto);
  if (!usa.length && !reglas.length && !sup.length) return null;
  const el = h("section", { class: "ficha" }, h("h2", {}, "Con qué se calcula"));
  const controles = Object.fromEntries(partes.filter((p) => p.t === "entrada" || p.t === "calculo").map((p) => [p.nombre, p]));
  const vivos = [], vistas = new Set(), previos = {};
  let cuenta = 0;
  const mirar = (s, raiz = el.parentElement ?? el) => { for (const x of raiz.querySelectorAll("[data-s]")) x.classList.toggle("toca", !!s && x.getAttribute("data-s") === s); for (const v of vivos) v.mirar?.(s); };
  el.addEventListener("pointerover", (e) => mirar(e.target.closest?.("[data-s]")?.getAttribute("data-s") ?? null));
  el.addEventListener("pointerleave", () => mirar(null));
  el.addEventListener("focusin", (e) => mirar(e.target.closest?.("[data-s]")?.getAttribute("data-s") ?? null));
  el.addEventListener("focusout", () => mirar(null));
  const filas = (lista) => {
    const tb = tabla(["Símbolo", "Qué es", "Valor"], lista.map((f) => f.slice(0, 3)));
    tb.querySelectorAll("tbody tr").forEach((tr, i) => {
      const k = lista[i][3]; if (!k) return;
      tr.setAttribute("data-s", k); tr.tabIndex = 0;
      if (previos[k] !== undefined && previos[k] !== lista[i][2]) tr.classList.add("cambia");
      previos[k] = lista[i][2];
    });
    return tb;
  };
  const bloque = (titulo, dibujo, pie) => {
    const ec = h("div", { class: "formula" }), tb = h("div"), su = h("div", { class: "sustitucion" }), tras = h("div");
    const b = h("button", { type: "button", onclick: () => sustituir(caja) }, "Sustituir los valores");
    const caja = h("div", { class: "calculo" }, h("div", { class: "lamina" }, h("h3", {}, titulo), dibujo, pie ? h("p", { class: "pie-escena" }, pie) : null), h("div", { class: "cuentas" }, ec, tb, b, su, tras));
    el.append(caja); conVuelo.observe(su);
    return { ec, tb, su, tras };
  };
  for (const p of usa) {
    if (p.t === "probeta") {
      const E = escena("stokes", { paso: 2 }), B = bloque("Ley de Stokes", E.el, "La tinta sigue las líneas de corriente de Stokes. La velocidad en pantalla está comprimida.");
      B.ec.append(math(mi("v"), mo("="), m("mfrac", fila(m("mn", "2"), m("msup", marca(mi("r"), "r"), m("mn", "2")), entre(fila(marca(sub("ρ", "medio"), "rm"), mo("−"), marca(sub("ρ", "gota"), "rg"))), marca(mi("g"), "g")), fila(m("mn", "9"), marca(mi("η"), "eta")))));
      B.tras.append(h("p", {}, "Un resultado positivo sube y uno negativo baja. El dibujo se detiene en 100 mm."), h("p", {}, h("strong", {}, "Supone: "), SUP_STOKES.join(" ")));
      vivos.push({ alDia(v) {
        const R = seguro(p.radio, v), G = seguro(p.gota, v), M = seguro(p.medio, v), Vi = seguro(p.visc, v), D = seguro(p.dias, v), r = R * 1e-6, vel = (2 * r * r * 9.80665 * (M - G)) / (9 * Vi);
        if ([R, G, M, Vi].every(Number.isFinite)) E.poner({ color: tono(E.el), radio: Math.max(0.02, R), visc: Math.max(1e-6, Vi), delta: M - G });
        B.tb.replaceChildren(filas([["r", "radio de la gota", `${cifra(R)} µm = ${cifra(r)} m`, "r"], ["ρ medio", "densidad del medio", `${cifra(M)} kg/m³`, "rm"], ["ρ gota", "densidad de la gota", `${cifra(G)} kg/m³`, "rg"], ["η", "viscosidad del medio", `${cifra(Vi)} Pa s`, "eta"], ["g", "gravedad", "9.80665 m/s²", "g"], ["t", "tiempo", `${cifra(D)} días = ${cifra(D * 86400)} s`, "t"]]));
        const fin = math(mi("x"), mo("="), mn(vel * D * 86400 * 1000), uni("mm")); fin.setAttribute("data-fin", ""); fin.classList.add("resultado");
        B.su.replaceChildren(
          math(mi("v"), mo("="), m("mfrac", fila(m("mn", "2"), m("msup", entre(marca(mn(r), "r", true)), m("mn", "2")), entre(fila(marca(mn(M), "rm", true), mo("−"), marca(mn(G), "rg", true))), entre(marca(m("mn", "9.80665"), "g", true))), fila(m("mn", "9"), entre(marca(mn(Vi), "eta", true))))),
          math(mi("v"), mo("="), mn(vel), uni("m/s")), math(mi("x"), mo("="), mi("v"), mo("×"), mi("t")),
          math(mi("x"), mo("="), mn(vel), mo("×"), marca(mn(D * 86400), "t", true), mo("="), mn(vel * D * 86400), uni("m")), fin);
      } });
    } else {
      const k = JSON.stringify(p.expr);
      if (vistas.has(k) || !p.expr || p.expr.t === "var" || p.expr.t === "num") continue;
      vistas.add(k);
      const nom = p.t === "calculo" ? p.nombre : null, n = nom ? 0 : ++cuenta, y = () => nom ? marca(mi(nom), nom) : (n === 1 ? mi("y") : m("msub", mi("y"), m("mn", String(n)))), F = flujo(p.expr, cifra, p.unidad ?? "");
      const B = bloque(p.t === "curva" ? `Curva: ${p.etiqueta}` : alta(p.etiqueta), F.el);
      B.ec.append(math(y(), mo("="), escribir(p.expr)));
      F.al((s) => mirar(s));
      vivos.push({ mirar: F.mirar, alDia(v) {
        const val = seguro(p.expr, v), fin = mn(val); fin.setAttribute("data-fin", "");
        F.poner(v);
        B.tb.replaceChildren(filas([...[...nombres(p.expr)].map((x) => [x, controles[x] ? controles[x].etiqueta : "falta el control", `${cifra(v[x] ?? NaN)} ${controles[x]?.unidad ?? ""}`.trim(), x]), [nom ?? (n === 1 ? "y" : `y${n}`), p.etiqueta, `${cifra(val)} ${p.unidad ?? ""}`.trim(), nom ?? undefined]]));
        const ma = math(y(), mo("="), escribir(p.expr, v), mo("="), fin, uni(p.unidad)); ma.classList.add("resultado");
        B.su.replaceChildren(ma);
      } });
    }
  }
  if (reglas.length) {
    const c = h("div"); el.append(h("h3", {}, "Avisos"), c);
    vivos.push({ alDia(v) {
      c.replaceChildren(...reglas.map((p) => {
        const a = seguro(p.a, v), b = seguro(p.b, v), si = { "<": a < b, "<=": a <= b, ">": a > b, ">=": a >= b }[p.op];
        const lo = Math.min(0, a, b), hi = Math.max(a, b, lo + 1), x = (z) => `${(((z - lo) / (hi - lo)) * 92 + 4).toFixed(2)}%`;
        return h("div", { class: `regla${si ? " salta" : ""}` }, math(escribir(p.a), mo({ "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[p.op]), escribir(p.b)),
          Number.isFinite(a) && Number.isFinite(b) ? h("div", { class: "aguja", style: `--a:${x(a)};--b:${x(b)}`, role: "img", "aria-label": `Vale ${cifra(a)}; el límite es ${cifra(b)}` }, h("i", {}), h("b", {}, cifra(a)), h("span", {}, `límite ${cifra(b)}`)) : null,
          h("p", {}, si ? p.texto : "Con estos valores no salta."));
      }));
    } });
  }
  if (sup.length) el.append(h("h3", {}, "Supuestos"), h("ul", {}, ...sup.map((x) => h("li", {}, x))));
  botonPausa();
  return { el, mirar, alDia(v) { for (const x of vivos) x.alDia(v); } };
}
