import { h, tabla, aviso } from "./elementos.mjs";
import { lee, raiz, gramos, cifras, botonFicha } from "./receta.mjs";
import { revisar, suma } from "./reglas.mjs";
import * as A from "./almacen.mjs";
import { ufc, reduccionLog } from "./motor.mjs";

const donde = () => (A.quien() ? "Guardado en tu cuenta." : "Guardado en este navegador.");
const hoy = () => new Date().toLocaleDateString("sv-SE");
const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const baja = (nombre, o) => { const u = URL.createObjectURL(new Blob([JSON.stringify(o, null, 1)], { type: "application/json" })), a = document.createElement("a"); a.href = u; a.download = nombre; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
const limpio = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "receta";
const q = new URLSearchParams(location.search);

export async function hoja(el) {
  try {
    const L0 = await lee("datos/ingredientes.json"), ing = Object.fromEntries(L0.map((x) => [x.id, x]));
    let e = q.get("ensayo") ? structuredClone(A.uno("ensayo", q.get("ensayo"))) : null;
    const origen = e ? e.receta : q.get("local") ? A.uno("receta", q.get("local")) : q.get("receta") && /^[a-z0-9-]+$/.test(q.get("receta")) ? await lee(`recetas/${q.get("receta")}.json`) : null;
    if (!origen) { el.replaceChildren(h("p", {}, "Elige una receta en una sección y pulsa «Hoja de laboratorio»."), h("p", {}, h("a", { href: "cuaderno.html" }, "Ver mis ensayos"))); return; }
    e ??= { id: nuevoId(), receta: origen, fecha: hoy(), lote: "", persona: "", gramos: origen.lote ?? 100, pesado: {}, pasos: {}, controles: {}, dias: [], micro: [], notas: "", resultado: "pendiente" };
    e.micro ??= [];
    const estado = h("p", { class: "fuente", role: "status" }, "Se guarda solo.");
    let tocado = 0;
    const salva = () => { tocado = Date.now(); estado.textContent = A.guarda("ensayo", e.id, structuredClone(e)) ? donde() : "Este navegador no guarda. Descarga la hoja."; if (!q.get("ensayo")) { q.set("ensayo", e.id); history.replaceState(null, "", `hoja.html?ensayo=${encodeURIComponent(e.id)}`); } };
    addEventListener("cuaderno-actualizado", () => { const n = A.uno("ensayo", e.id); if (n && Date.now() - tocado > 4000 && JSON.stringify(n) !== JSON.stringify(e)) hoja(el); }, { once: true });
    const ent = (k, tipo, rot) => h("label", { class: "casilla" }, rot, h("input", { type: tipo, value: e[k] ?? "", oninput: (x) => { e[k] = tipo === "number" ? Number(x.target.value) : x.target.value; if (k === "gramos") pesos(); salva(); } }));
    const cp = h("div", { class: "pesar" }), r = e.receta;
    const pesos = () => { const L = Number(e.gramos); if (!(L > 0)) { cp.replaceChildren(aviso("El lote debe ser mayor que cero.")); return; }
      cp.replaceChildren(tabla(["Listo", "Fase", "Ingrediente", "%", "Pesar, g", "Pesado, g"], r.fases.flatMap((f, a) => f.ingredientes.map((i, b) => { const k = `${a}-${b}`, d = (e.pesado[k] ??= {}); return [h("input", { type: "checkbox", "aria-label": `Pesado: ${ing[i.id]?.nombre ?? i.id}`, checked: d.ok, onchange: (x) => { d.ok = x.target.checked; salva(); } }), b ? "" : f.nombre, ing[i.id]?.nombre ?? i.id, Number(i.pct).toFixed(2), cifras(gramos(i.pct, L)), h("input", { type: "number", step: "any", "aria-label": "Masa pesada", value: d.g ?? "", oninput: (x) => { d.g = x.target.value; salva(); } })]; })))); };
    pesos();
    const cd = h("div"), dias = () => cd.replaceChildren(tabla(["Día", "Condición", "pH", "Aspecto, olor, separación", ""], e.dias.map((d, n) => [...["dia", "cond", "pH", "obs"].map((k) => h("input", { type: "text", "aria-label": k, value: d[k] ?? "", oninput: (x) => { d[k] = x.target.value; salva(); } })), h("button", { type: "button", onclick: () => { e.dias.splice(n, 1); dias(); salva(); } }, "Quitar")])));
    dias();
    const cm = h("div", { class: "placas" }), rm = h("div", { "aria-live": "polite" });
    const tope = ["mascara", "sombra", "labial", "brillo-labial", "balsamo-labial"].includes(r.producto) ? 100 : 1000;
    const cuenta = () => {
      const g = new Map();
      for (const p of e.micro) { const c = Number(p.col); if (p.col === "" || !Number.isFinite(c)) continue; const k = `${p.dia}|${p.medio}`; (g.get(k) ?? g.set(k, []).get(k)).push({ colonias: c, dilucion: Number(p.dil), volumen: Number(p.vol) }); }
      const f = [...g].map(([k, pl]) => { const [dia, medio] = k.split("|"); try { const u = ufc(pl, medio === "hongos" ? { min: 10, max: 150 } : {}); return { dia, medio, u }; } catch { return null; } }).filter(Boolean);
      rm.replaceChildren(...(f.length ? [tabla(["Día", "Conteo", "UFC/g", "Lectura"], f.map((x) => [x.dia, x.medio, x.u.texto, x.u.nota]))] : []));
      for (const d of new Set(f.map((x) => x.dia))) {
        const t = f.filter((x) => x.dia === d), a = t.find((x) => x.medio === "aerobios"), o = t.find((x) => x.medio === "hongos");
        if (a && o) { const s = a.u.valor + o.u.valor; rm.append(h("p", {}, `Día ${d}: aerobios más hongos y levaduras, ${Math.round(Number(s.toPrecision(2))).toLocaleString("en-US").replaceAll(",", " ")} UFC/g. El límite de ISO 17516 para este producto es ${tope}. ${s > tope ? "Lo pasa: descarta el lote y busca la causa." : "Queda por debajo. Falta descartar patógenos."}`)); }
      }
    };
    const micros = () => { cm.replaceChildren(tabla(["Día", "Conteo", "Dilución 10⁻ⁿ", "Sembrado, mL", "Colonias", ""], e.micro.map((p, n) => [h("input", { type: "text", "aria-label": "Día", value: p.dia, oninput: (x) => { p.dia = x.target.value; cuenta(); salva(); } }), h("select", { "aria-label": "Conteo", onchange: (x) => { p.medio = x.target.value; cuenta(); salva(); } }, ...["aerobios", "hongos"].map((m) => h("option", { value: m, selected: m === p.medio }, m === "hongos" ? "hongos y levaduras" : m))), ...[["dil", 0, 8, 1], ["vol", 0.01, 2, 0.1], ["col", 0, 9999, 1]].map(([k, min, max, step]) => h("input", { type: "number", min, max, step: k === "vol" ? "any" : step, "aria-label": k === "dil" ? "Dilución" : k === "vol" ? "Mililitros sembrados" : "Colonias", value: p[k], oninput: (x) => { p[k] = x.target.value; cuenta(); salva(); } })), h("button", { type: "button", onclick: () => { e.micro.splice(n, 1); micros(); salva(); } }, "Quitar")]))); cuenta(); };
    micros();
    const sel = h("select", { onchange: (x) => { e.resultado = x.target.value; salva(); } }, ...["pendiente", "estable", "se separó", "cambió de pH u olor", "contaminado", "descartado"].map((x) => h("option", { value: x, selected: x === e.resultado }, x)));
    el.replaceChildren(
      h("h2", {}, r.titulo), ...(r.avisos ?? []).map((x) => h("p", { class: "aviso" }, x)),
      h("div", { class: "cabecera-hoja" }, ent("fecha", "date", "Fecha"), ent("lote", "text", "Número de lote"), ent("persona", "text", "Quién lo hizo"), ent("gramos", "number", "Lote, g")),
      h("h3", {}, "1. Pesar"), cp,
      h("h3", {}, "2. Hacer"), h("ol", { class: "pasos-hoja" }, ...(r.pasos ?? []).map((p, n) => h("li", {}, h("label", {}, h("input", { type: "checkbox", checked: e.pasos[n], onchange: (x) => { e.pasos[n] = x.target.checked; salva(); } }), h("span", {}, p))))),
      h("h3", {}, "3. Medir"), tabla(["Control", "Meta", "Cómo", "Resultado"], (r.controles ?? []).map(([a, b, c], n) => [a, b, c, h("input", { type: "text", "aria-label": `Resultado de ${a}`, value: e.controles[n] ?? "", oninput: (x) => { e.controles[n] = x.target.value; salva(); } })])),
      h("h3", {}, "4. Vigilar"), h("p", {}, "Anota a 24 h, 7, 15, 30, 60 y 90 días, a 4 °C, ambiente y 40 °C."), cd, h("button", { type: "button", onclick: () => { e.dias.push({ dia: "", cond: "ambiente" }); dias(); salva(); } }, "Agregar observación"),
      h("h3", {}, "5. Microbiología"), h("p", {}, h("a", { href: "fundamentos/microbiologia.html" }, "Cómo se hace"), ". Anota cada placa; el conteo se calcula solo."), cm, h("p", { class: "ordenes" }, h("button", { type: "button", onclick: () => { e.micro.push({ dia: "0", medio: "aerobios", dil: 1, vol: 0.1, col: "" }); micros(); salva(); } }, "Agregar placa")), rm,
      h("h3", {}, "6. Concluir"), h("label", { class: "casilla" }, "Resultado", sel), h("label", { class: "casilla" }, "Notas: qué cambiarías", h("textarea", { rows: 5, oninput: (x) => { e.notas = x.target.value; salva(); } }, e.notas)),
      h("p", { class: "ordenes" }, h("button", { type: "button", onclick: () => print() }, "Imprimir"), h("button", { type: "button", onclick: () => baja(`ensayo-${limpio(r.titulo)}-${e.fecha}.json`, e) }, "Descargar"), h("a", { class: "boton", href: "cuaderno.html" }, "Mis ensayos")), estado);
  } catch (x) { el.replaceChildren(aviso(x.message)); }
}

export function cuaderno(el) {
  const pinta = () => {
    const l = A.lista("ensayo");
    el.replaceChildren(
      l.length ? tabla(["Fecha", "Receta", "Lote", "Resultado", ""], l.map((x) => [x.fecha, h("a", { href: `hoja.html?ensayo=${encodeURIComponent(x.id)}` }, x.receta.titulo), x.lote || "sin número", x.resultado, h("button", { type: "button", onclick: () => { if (confirm(`¿Borrar el ensayo de ${x.receta.titulo}? No se puede deshacer.`)) { A.borra("ensayo", x.id); pinta(); } } }, "Borrar")])) : h("p", {}, "Todavía no hay ensayos. Abre una receta y pulsa «Hoja de laboratorio»."),
      h("p", { class: "fuente" }, A.quien() ? "Se ven en todos los dispositivos donde entres con tu cuenta." : "Están en este navegador. ", A.quien() ? null : h("a", { href: "cuenta.html" }, "Entra o crea una cuenta"), A.quien() ? null : " para verlos en otros dispositivos."));
  };
  addEventListener("cuaderno-actualizado", pinta); A.alCambiar(() => pinta());
  pinta();
}

export async function misRecetas(el) {
  const [L0, prod] = await Promise.all([lee("datos/ingredientes.json"), lee("datos/productos.json")]);
  const ing = Object.fromEntries(L0.map((x) => [x.id, x])), orden = [...L0].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  let r = null;
  if (q.get("de") && /^[a-z0-9-]+$/.test(q.get("de"))) { try { const b = await lee(`recetas/${q.get("de")}.json`); r = { ...structuredClone(b), id: nuevoId(), titulo: `${b.titulo}, mi versión`, base: b.slug, estado: "sin ensayar" }; delete r.jabon; delete r.cuenta; delete r.slug; } catch { r = null; } }
  if (q.get("local")) r = structuredClone(A.uno("receta", q.get("local")));
  const inicio = () => {
    const l = A.lista("receta");
    el.replaceChildren(l.length ? tabla(["Receta", "Suma", ""], l.map((x) => [h("a", { href: `mis-recetas.html?local=${encodeURIComponent(x.id)}` }, x.titulo), `${suma(x.fases).toFixed(2)} %`, h("span", { class: "ordenes" }, h("a", { class: "boton", href: `hoja.html?local=${encodeURIComponent(x.id)}` }, "Hoja"), h("button", { type: "button", onclick: () => { if (confirm(`¿Borrar ${x.titulo}? No se puede deshacer.`)) { A.borra("receta", x.id); inicio(); } } }, "Borrar"))])) : h("p", {}, "Todavía no tienes recetas propias. Abre una del sitio y pulsa «Modificar esta receta», o empieza de cero."),
      h("p", { class: "ordenes" }, h("button", { type: "button", onclick: () => { r = { id: nuevoId(), titulo: "Receta nueva", producto: prod[0].slug, tipo: "ow", nivel: 1, lote: 100, pH: "", estado: "sin ensayar", fases: [{ nombre: "A", ingredientes: [{ id: "agua", pct: 100 }] }], pasos: ["Escribe el primer paso."], controles: [["pH", "", "medidor o tiras"], ["Aspecto", "", "a la vista"]], fallas: [], cambia: [], avisos: ["Receta propia, sin ensayar."], fuentes: [], porque: "" }; edita(); } }, "Empezar de cero")));
  };
  const edita = () => {
    const caja = h("div"), sal = h("div", { "aria-live": "polite" }), est = h("p", { class: "fuente", role: "status" });
    const salva = () => { est.textContent = A.guarda("receta", r.id, structuredClone(r)) ? donde().replace("Guardado", "Guardada") : "Este navegador no guarda. Descárgala."; revisa(); };
    const revisa = () => { const s = suma(r.fases), a = revisar(r); sal.replaceChildren(h("p", { class: "cifra" }, `${s.toFixed(2)} %`, h("small", {}, "suma de la fórmula")), ...a.map((x) => aviso(x)), ...(a.length ? [] : [h("p", {}, "Las reglas de este sitio no ven nada que avisar. Eso no dice que sea segura: hay que ensayarla.")])); };
    const pinta = () => caja.replaceChildren(...r.fases.map((f, a) => h("fieldset", { class: "fase" }, h("legend", {}, h("label", {}, "Fase ", h("input", { type: "text", value: f.nombre, oninput: (x) => { f.nombre = x.target.value; salva(); } }))),
      ...f.ingredientes.map((i, b) => h("div", { class: "renglon" }, h("select", { "aria-label": "Ingrediente", onchange: (x) => { i.id = x.target.value; salva(); } }, ...orden.map((o) => h("option", { value: o.id, selected: o.id === i.id }, `${o.nombre} (${o.clase})`))), h("input", { type: "number", min: 0, step: 0.1, value: i.pct, "aria-label": "Porcentaje", oninput: (x) => { i.pct = Number(x.target.value); salva(); } }), h("span", {}, "%"), h("button", { type: "button", onclick: () => { f.ingredientes.splice(b, 1); pinta(); salva(); } }, "Quitar"))),
      h("p", { class: "ordenes" }, h("button", { type: "button", onclick: () => { f.ingredientes.push({ id: "glicerina", pct: 1 }); pinta(); salva(); } }, "Agregar ingrediente"), r.fases.length > 1 ? h("button", { type: "button", onclick: () => { r.fases.splice(a, 1); pinta(); salva(); } }, "Quitar fase") : null))),
      h("p", { class: "ordenes" }, h("button", { type: "button", onclick: () => { r.fases.push({ nombre: String.fromCharCode(65 + r.fases.length), ingredientes: [] }); pinta(); salva(); } }, "Agregar fase"), h("button", { type: "button", onclick: () => { const a = r.fases.flatMap((f) => f.ingredientes).find((i) => i.id === "agua"); if (!a) return; a.pct = Math.max(0, Math.round((a.pct + 100 - suma(r.fases)) * 100) / 100); pinta(); salva(); } }, "Completar con agua")));
    const txt = (k, rot, n) => h("label", { class: "casilla" }, rot, h("textarea", { rows: n, oninput: (x) => { r[k] = x.target.value.split("\n").map((y) => y.trim()).filter(Boolean); salva(); } }, (r[k] ?? []).join("\n")));
    pinta(); revisa();
    el.replaceChildren(h("div", { class: "cabecera-hoja" }, h("label", { class: "casilla" }, "Nombre", h("input", { type: "text", value: r.titulo, oninput: (x) => { r.titulo = x.target.value; salva(); } })), h("label", { class: "casilla" }, "Producto", h("select", { onchange: (x) => { r.producto = x.target.value; salva(); } }, ...prod.map((p) => h("option", { value: p.slug, selected: p.slug === r.producto }, p.nombre)))), h("label", { class: "casilla" }, "pH al que la ajustas", h("input", { type: "text", value: r.pH ?? "", oninput: (x) => { r.pH = x.target.value; salva(); } })), h("label", { class: "casilla" }, "Lote, g", h("input", { type: "number", value: r.lote, oninput: (x) => { r.lote = Number(x.target.value); salva(); } }))),
      h("div", { class: "mesa-lab" }, caja, sal), txt("pasos", "Pasos, uno por línea", 8), txt("avisos", "Avisos, uno por línea", 3), txt("fuentes", "Fuentes, una por línea", 3),
      h("p", { class: "ordenes" }, h("button", { type: "button", onclick: salva }, "Guardar"), h("button", { type: "button", onclick: () => { salva(); location.href = `hoja.html?local=${encodeURIComponent(r.id)}`; } }, "Hoja de laboratorio"), h("button", { type: "button", onclick: () => { const s = limpio(r.titulo), { id, base, ...o } = r; baja(`${s}.json`, { slug: s, ...o }); } }, "Descargar para publicar"), h("a", { class: "boton", href: "mis-recetas.html" }, "Mis recetas")), est,
      h("p", { class: "fuente" }, "Para que salga en el sitio, pon el archivo descargado en la carpeta recetas y vuelve a generar."));
  };
  if (r) edita(); else { inicio(); addEventListener("cuaderno-actualizado", () => { if (!r) inicio(); }); }
}
export { botonFicha };
