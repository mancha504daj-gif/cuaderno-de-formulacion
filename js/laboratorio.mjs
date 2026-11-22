import { h, deslizador, aviso } from "./elementos.mjs";
import { evaluar, stokes, CMP } from "./motor.mjs";
import { probeta, curva } from "./dibujos.mjs";
import { ficha } from "./ecuaciones.mjs";
import { escena, CAT, huecos, botonPausa } from "./escenas.mjs";

export function dibujarLaboratorio(doc, el) {
  const ent = {}, vivos = [], izq = [], der = [], abajo = [];
  const DER = new Set(["escena", "probeta", "curva", "salida", "si"]), ABAJO = new Set(["pregunta", "fuente"]);
  const calculos = (doc.partes ?? []).filter((p) => p.t === "calculo");
  const vars = () => { const v = Object.fromEntries(Object.entries(ent).map(([k, x]) => [k, x.valor])); for (const c of calculos) { try { v[c.nombre] = evaluar(c.expr, v); } catch { } } return v; };
  const todo = () => { const v = vars(); for (const f of vivos) f(v); };
  const cuida = (caja, fn) => vivos.push((v) => { try { fn(v); } catch (e) { caja.replaceChildren(aviso(e.message)); } });
  for (const p of doc.partes ?? []) {
    if (p.t === "supuesto" || p.t === "calculo") continue;
    const hijos = DER.has(p.t) ? der : ABAJO.has(p.t) ? abajo : izq;
    if (p.t === "titulo") hijos.push(h("h2", {}, p.texto));
    else if (p.t === "paso") hijos.push(h("p", { class: "paso" }, p.texto));
    else if (p.t === "fuente") hijos.push(h("p", { class: "fuente" }, "Fuente: ", p.texto));
    else if (p.t === "entrada") {
      if (ent[p.nombre]) { hijos.push(aviso(`Hay dos controles llamados «${p.nombre}».`)); continue; }
      ent[p.nombre] = deslizador(p.etiqueta, { min: p.min, max: p.max, paso: p.paso, valor: p.valor, unidad: p.unidad }, todo);
      ent[p.nombre].el.setAttribute("data-s", p.nombre);
      hijos.push(ent[p.nombre].el);
    } else if (p.t === "salida") {
      const c = h("div", { "aria-live": "polite" }); hijos.push(c);
      cuida(c, (v) => c.replaceChildren(h("p", { class: "cifra" }, `${evaluar(p.expr, v).toFixed(p.dec)} ${p.unidad}`, h("small", {}, p.etiqueta))));
    } else if (p.t === "si") {
      const c = h("div", { "aria-live": "polite" }); hijos.push(c);
      cuida(c, (v) => c.replaceChildren(...(CMP[p.op](evaluar(p.a, v), evaluar(p.b, v)) ? [aviso(p.texto)] : [])));
    } else if (p.t === "curva") {
      const c = h("div"); hijos.push(c);
      cuida(c, (v) => {
        const d = (doc.partes ?? []).find((x) => x.t === "entrada" && x.nombre === p.variable);
        if (!d) throw new Error(`La curva pide un control llamado «${p.variable}».`);
        c.replaceChildren(curva({ x0: d.min, x1: d.max, actual: v[p.variable], rotuloX: d.etiqueta, rotuloY: p.etiqueta, fn: (x) => evaluar(p.expr, { ...v, [p.variable]: x }) }));
      });
    } else if (p.t === "probeta") {
      const P = probeta(), t = h("p"), c = h("div", { class: "con-vaso" }, P.el, t); hijos.push(c);
      vivos.push((v) => {
        try {
          const porDia = stokes({ radio_um: evaluar(p.radio, v), rho_gota: evaluar(p.gota, v), rho_medio: evaluar(p.medio, v), viscosidad: evaluar(p.visc, v) }) * 86400e3, mm = porDia * evaluar(p.dias, v);
          P.mover(mm);
          const horas = Math.abs(2400 / porDia);
          t.textContent = Math.abs(mm) >= 100 ? `La gota cruza los 100 mm en ${horas < 48 ? `${horas.toFixed(1)} horas` : `${(horas / 24).toFixed(1)} días`}. Dibujo esquemático.` : `Recorrido estimado: ${Math.abs(mm) >= 0.01 || mm === 0 ? Math.abs(mm).toFixed(2) : Math.abs(mm).toExponential(1)} mm hacia ${mm < 0 ? "abajo" : "arriba"}. Dibujo esquemático.`;
        } catch (e) { P.mover(0); t.textContent = e.message; }
      });
    } else if (p.t === "escena") {
      if (!Object.hasOwn(CAT, p.tipo)) { hijos.push(aviso("Esa escena no existe.")); continue; }
      const E = escena(p.tipo), c = h("div", { class: "lamina lamina-lab" }, E.el); c.style.setProperty("--c", E.color);
      hijos.push(c, h("p", { class: "pie-escena" }, CAT[p.tipo].pie)); botonPausa();
      vivos.push((v) => { const o = {}; for (const k of huecos(CAT[p.tipo])) { if (!p.valores?.[k]) continue; try { const x = evaluar(p.valores[k], v); if (Number.isFinite(x)) o[k] = k === "paso" ? Math.round(x) : x; } catch { } } E.poner(o); });
    } else if (p.t === "pregunta") {
      const r = h("p", { role: "status", class: "respuesta" });
      const op = p.opciones.split(";").map((x) => x.trim()).filter(Boolean);
      hijos.push(h("fieldset", { class: "pregunta" }, h("legend", {}, p.texto), ...op.map((o, i) => h("button", { type: "button", onclick: (e) => {
        for (const b of e.currentTarget.parentElement.querySelectorAll("button")) b.removeAttribute("aria-pressed");
        e.currentTarget.setAttribute("aria-pressed", "true");
        r.textContent = i + 1 === p.correcta ? `Correcto. ${p.explica}` : "Mueve los controles y mira otra vez.";
      } }, o)), r));
    } else hijos.push(aviso("Bloque desconocido."));
  }
  const fc = ficha(doc.partes ?? []);
  if (fc) vivos.push((v) => fc.alDia(v));
  const hay = izq.length + der.length + abajo.length;
  el.replaceChildren(...(hay ? [...(izq.length || der.length ? [h("div", { class: "mesa-lab" }, h("div", {}, ...izq), h("div", {}, ...der))] : []), ...abajo.filter((x) => !x.classList.contains("fuente")), ...(fc ? [fc.el] : []), ...abajo.filter((x) => x.classList.contains("fuente"))] : [h("p", { class: "vacio" }, "Arrastra un bloque a la mesa para empezar.")]));
  todo();
}
