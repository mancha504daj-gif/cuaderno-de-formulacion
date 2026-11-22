import { dibujarLaboratorio } from "./laboratorio.mjs";
import { CAT, ROTULOS, huecos } from "./escenas.mjs";
import * as A from "./almacen.mjs";
const B = window.Blockly, $ = (id) => document.getElementById(id);
const fotos = await (await fetch("fotos/creditos.json")).json();
const COLORES = [["rosa", "rosa"], ["azul", "azul"], ["oliva", "oliva"], ["ocre", "ocre"], ["uva", "uva"], ["petróleo", "petroleo"], ["violeta", "violeta"], ["carbón", "carbon"], ["terracota", "terracota"]];
const FOTOS = fotos.map((f) => [f.descripcion, f.archivo]);
const texto = (name, text) => ({ type: "field_input", name, text }), nume = (name, value, x = {}) => ({ type: "field_number", name, value, ...x }), menu = (name, options) => ({ type: "field_dropdown", name, options });
const val = (name) => ({ type: "input_value", name, check: "Number" }), pila = (c) => ({ previousStatement: c, nextStatement: c });

B.defineBlocksWithJsonArray([
  { type: "pagina", message0: "cabecera: título %1", args0: [texto("TITULO", "")], message1: "foto %1", args1: [menu("FOTO", [["la original", ""], ...FOTOS])], message2: "color %1 altura %2", args2: [menu("COLOR", [["el original", ""], ...COLORES]), menu("ALTO", [["media", "media"], ["baja", "baja"], ["alta", "alta"]])], message3: "partes, de arriba abajo %1", args3: [{ type: "input_statement", name: "PARTES", check: "parte" }], style: "cabeza" },
  { type: "seccion", message0: "parte: %1", args0: [{ type: "field_label_serializable", name: "NOMBRE", text: "" }], ...pila("parte"), style: "parte" },
  { type: "foto", message0: "foto %1 %2", args0: [menu("ARCHIVO", FOTOS), menu("ANCHO", [["mediana", "mediana"], ["grande", "completa"]])], message1: "pie %1", args1: [texto("PIE", "")], ...pila("parte"), style: "parte" },
  { type: "titulo", message0: "título %1", args0: [texto("TEXTO", "Nuevo título")], ...pila("lab"), style: "cabeza" },
  { type: "paso", message0: "indicación %1", args0: [texto("TEXTO", "Mueve el control y observa.")], ...pila("lab"), style: "cabeza" },
  { type: "fuente", message0: "fuente %1", args0: [texto("TEXTO", "Autor, año, DOI")], ...pila("lab"), style: "cabeza" },
  { type: "supuesto", message0: "supuesto del modelo %1", args0: [texto("TEXTO", "La temperatura no cambia.")], ...pila("lab"), style: "cabeza" },
  { type: "entrada", message0: "control %1 rótulo %2 unidad %3", args0: [texto("VAR", "x"), texto("ETIQUETA", "Valor"), texto("UNIDAD", "")], message1: "de %1 a %2 paso %3 empieza en %4", args1: [nume("MIN", 0), nume("MAX", 100), nume("PASO", 1, { min: 0.0001 }), nume("VALOR", 10)], ...pila("lab"), style: "parte" },
  { type: "calculo", message0: "calcular %1 que es %2 unidad %3 %4", args0: [texto("VAR", "k"), texto("ETIQUETA", "valor intermedio"), texto("UNIDAD", ""), val("EXPR")], inputsInline: false, ...pila("lab"), style: "parte" },
  { type: "probeta", message0: "probeta con gotas" , message1: "radio en µm %1", args1: [val("RADIO")], message2: "densidad de la gota %1", args2: [val("GOTA")], message3: "densidad del medio %1", args3: [val("MEDIO")], message4: "viscosidad en Pa s %1", args4: [val("VISC")], message5: "días %1", args5: [val("DIAS")], ...pila("lab"), style: "aparato" },
  { type: "curva", message0: "curva de %1 según el control %2 %3", args0: [texto("ETIQUETA", "Resultado"), texto("VAR", "x"), val("EXPR")], inputsInline: false, ...pila("lab"), style: "aparato" },
  { type: "salida", message0: "mostrar %1 unidad %2 decimales %3 %4", args0: [texto("ETIQUETA", "Resultado"), texto("UNIDAD", ""), nume("DEC", 2, { min: 0, max: 8, precision: 1 }), val("EXPR")], ...pila("lab"), style: "aparato" },
  { type: "si", message0: "si %1 %2 %3 avisar %4", args0: [val("A"), menu("OP", [["<", "<"], ["≤", "<="], [">", ">"], ["≥", ">="]]), val("B"), texto("TEXTO", "Revisa este valor")], inputsInline: true, ...pila("lab"), style: "aparato" },
  { type: "pregunta", message0: "pregunta %1", args0: [texto("TEXTO", "¿Qué pasa si…?")], message1: "opciones con ; %1 correcta n.º %2", args1: [texto("OPCIONES", "sube; baja"), nume("CORRECTA", 1, { min: 1, precision: 1 })], message2: "explicación %1", args2: [texto("EXPLICA", "")], ...pila("lab"), style: "cabeza" },
  { type: "numero", message0: "%1", args0: [nume("V", 1)], output: "Number", style: "mate" },
  { type: "variable", message0: "control %1", args0: [texto("V", "x")], output: "Number", style: "mate" },
  { type: "operacion", message0: "%1 %2 %3", args0: [val("A"), menu("OP", [["+", "+"], ["−", "-"], ["×", "*"], ["÷", "/"], ["elevado a", "^"], ["el mayor entre los dos", "max"], ["el menor entre los dos", "min"]]), val("B")], inputsInline: true, output: "Number", style: "mate" },
  { type: "funcion", message0: "%1 %2", args0: [menu("F", [["log base 10 de", "log10"], ["ln de", "ln"], ["e elevado a", "exp"], ["raíz de", "raiz"]]), val("A")], inputsInline: true, output: "Number", style: "mate" },
  ...Object.entries(CAT).filter(([, c]) => !c.oculta).map(([k, c]) => { const hs = huecos(c), m = { type: `escena_${k}`, message0: `escena: ${c.nombre}`, ...pila("lab"), style: "aparato" }; hs.forEach((x, i) => { m[`message${i + 1}`] = `${(ROTULOS[x] ?? x).replaceAll("%", "%%").replaceAll("%%", "porcentaje")} %1`; m[`args${i + 1}`] = [val(x)]; }); return m; }),
]);
const bl = (type) => ({ kind: "block", type }), cat = (name, categorystyle, l) => ({ kind: "category", name, categorystyle, contents: l.map(bl) });
const CAJAS = { lab: { kind: "categoryToolbox", contents: [cat("Textos", "cabeza", ["titulo", "paso", "pregunta", "supuesto", "fuente"]), cat("Controles", "parte", ["entrada", "calculo"]), cat("Aparatos", "aparato", ["probeta", "curva", "salida", "si"]), cat("Escenas", "aparato", Object.keys(CAT).filter((k) => !CAT[k].oculta).map((k) => `escena_${k}`)), cat("Números", "mate", ["numero", "variable", "operacion", "funcion"])] }, asp: { kind: "categoryToolbox", contents: [cat("Fotos", "parte", ["foto"])] } };
const est = (c, s, t) => ({ colourPrimary: c, colourSecondary: s, colourTertiary: t });
const tema = B.Theme.defineTheme("catalogo", { base: B.Themes.Classic,
  blockStyles: { cabeza: est("#B3123F", "#C9466A", "#7E0B2C"), parte: est("#3A4BC4", "#6472D4", "#2A388F"), aparato: est("#A36600", "#BC8A3B", "#784B00"), mate: est("#00856A", "#3FA38D", "#00604D") },
  categoryStyles: { cabeza: { colour: "#B3123F" }, parte: { colour: "#3A4BC4" }, aparato: { colour: "#A36600" }, mate: { colour: "#00856A" } },
  componentStyles: { workspaceBackgroundColour: "#FFFFFF", toolboxBackgroundColour: "#F1F2F4", toolboxForegroundColour: "#15171F", flyoutBackgroundColour: "#F7F8F9", flyoutForegroundColour: "#15171F", scrollbarColour: "#9a9ea9" }, fontStyle: { family: "Archivo, sans-serif", size: 12 } });
const ws = B.inject("mesa", { toolbox: CAJAS.asp, theme: tema, renderer: "zelos", sounds: false, trashcan: true, media: "https://cdn.jsdelivr.net/npm/blockly@11.2.2/media/", zoom: { controls: true, wheel: false, startScale: 0.75 }, move: { scrollbars: true, drag: true, wheel: true } });

const F = (b, n) => b.getFieldValue(n), N = (b, n) => Number(F(b, n));
const ESC = (b) => { const tipo = b.type.slice(7), valores = {}; for (const k of huecos(CAT[tipo])) { const x = expr(b.getInputTargetBlock(k)); if (x) valores[k] = x; } return { t: "escena", tipo, valores }; };
const cadena = (b, n) => { const r = []; for (let x = b.getInputTargetBlock(n); x; x = x.getNextBlock()) r.push(x); return r; };
const expr = (b) => !b ? null : ({ numero: () => ({ t: "num", v: N(b, "V") }), variable: () => ({ t: "var", v: F(b, "V").trim() }), operacion: () => ({ t: "bin", op: F(b, "OP"), a: expr(b.getInputTargetBlock("A")), b: expr(b.getInputTargetBlock("B")) }), funcion: () => ({ t: "fun", f: F(b, "F"), a: expr(b.getInputTargetBlock("A")) }) })[b.type]();
const ex = (b, n) => expr(b.getInputTargetBlock(n)), solo = (t) => (b) => ({ t, texto: F(b, "TEXTO") });
const LAB = { titulo: solo("titulo"), paso: solo("paso"), fuente: solo("fuente"), supuesto: solo("supuesto"),
  entrada: (b) => ({ t: "entrada", nombre: F(b, "VAR").trim(), etiqueta: F(b, "ETIQUETA"), unidad: F(b, "UNIDAD"), min: N(b, "MIN"), max: N(b, "MAX"), paso: N(b, "PASO"), valor: N(b, "VALOR") }),
  calculo: (b) => ({ t: "calculo", nombre: F(b, "VAR").trim(), etiqueta: F(b, "ETIQUETA"), unidad: F(b, "UNIDAD"), expr: ex(b, "EXPR") }),
  probeta: (b) => ({ t: "probeta", radio: ex(b, "RADIO"), gota: ex(b, "GOTA"), medio: ex(b, "MEDIO"), visc: ex(b, "VISC"), dias: ex(b, "DIAS") }),
  curva: (b) => ({ t: "curva", etiqueta: F(b, "ETIQUETA"), variable: F(b, "VAR").trim(), expr: ex(b, "EXPR") }),
  salida: (b) => ({ t: "salida", etiqueta: F(b, "ETIQUETA"), unidad: F(b, "UNIDAD"), dec: N(b, "DEC"), expr: ex(b, "EXPR") }),
  si: (b) => ({ t: "si", op: F(b, "OP"), a: ex(b, "A"), b: ex(b, "B"), texto: F(b, "TEXTO") }),
  pregunta: (b) => ({ t: "pregunta", texto: F(b, "TEXTO"), opciones: F(b, "OPCIONES"), correcta: N(b, "CORRECTA"), explica: F(b, "EXPLICA") }) };
function laboratorio() {
  const partes = [];
  for (const top of ws.getTopBlocks(true)) for (let b = top; b; b = b.getNextBlock()) if (Object.hasOwn(LAB, b.type)) partes.push(LAB[b.type](b)); else if (b.type.startsWith("escena_")) partes.push(ESC(b));
  return { partes };
}
let cuaderno = null;
function aspecto() {
  const p = ws.getTopBlocks(true).find((b) => b.type === "pagina");
  if (!p) return null;
  return { titulo: F(p, "TITULO").trim(), foto: F(p, "FOTO"), color: F(p, "COLOR"), alto: F(p, "ALTO"), conocidas: cuaderno.piezas().map((x) => x.id), partes: cadena(p, "PARTES").map((b) => b.type === "seccion" ? { t: "seccion", id: b.data } : { t: "foto", archivo: F(b, "ARCHIVO"), ancho: F(b, "ANCHO"), pie: F(b, "PIE") }) };
}

let modo = "asp", espera, cargando = false;
let labId = "borrador";
const nuevoId = () => `lab-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const estado = (t) => { $("estado").textContent = t; };
const guarda = (j) => (modo === "lab" ? A.guarda("laboratorio", labId, j) : A.guarda("aspecto", cuaderno.clave, j));
const lee = () => (modo === "lab" ? A.uno("laboratorio", labId) : A.uno("aspecto", cuaderno.clave));
function misLabs() { const l = A.lista("laboratorio"), s = $("mislabs"), ids = A.respaldo().cosas.filter((c) => c.tipo === "laboratorio"); s.replaceChildren(...[["", "Laboratorio nuevo"], ...ids.map((c) => [c.id, c.datos?.titulo || "Sin título"])].map(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; o.selected = v === labId; return o; })); return l.length; }
const limpio = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "laboratorio";
const archivo = () => modo === "lab"
  ? { version: 2, clase: "laboratorio", titulo: $("titulo").value.trim() || "Laboratorio sin título", bloques: B.serialization.workspaces.save(ws), documento: laboratorio() }
  : { version: 2, clase: "aspecto", pagina: cuaderno.clave, bloques: B.serialization.workspaces.save(ws), aspecto: aspecto() };
function pon(bloques) { clearTimeout(espera); cargando = true; B.Events.disable(); try { B.serialization.workspaces.load(bloques, ws); } finally { B.Events.enable(); cargando = false; } }
function vacio() { clearTimeout(espera); cargando = true; B.Events.disable(); try { ws.clear(); } finally { B.Events.enable(); cargando = false; } }
async function muestra() {
  if (modo === "lab") dibujarLaboratorio(laboratorio(), $("vista"));
  else if (cuaderno) { const a = aspecto(); await cuaderno.aplicar(a ?? {}); }
}
function cambio() {
  clearTimeout(espera);
  espera = setTimeout(async () => {
    if (modo === "asp" && !cuaderno) return;
    await muestra();
    const ok = guarda(archivo());
    if (modo === "lab") misLabs();
    estado(ok ? (A.quien() ? "Guardado en tu cuenta: lo verás en tus dispositivos." : "Guardado en este navegador. Entra en tu cuenta para verlo en otros dispositivos.") : "No se pudo guardar. Descarga tu trabajo.");
  }, 160);
}
ws.addChangeListener((e) => { if (!e.isUiEvent && !cargando && !ws.isDragging()) cambio(); });
$("titulo").addEventListener("input", cambio);

function bloquesDePagina() {
  const p = cuaderno.piezas();
  const serie = p.reduceRight((sig, x) => ({ type: "seccion", data: x.id, fields: { NOMBRE: x.nombre }, ...(sig ? { next: { block: sig } } : {}) }), null);
  return { blocks: { languageVersion: 0, blocks: [{ type: "pagina", x: 30, y: 30, fields: { TITULO: cuaderno.original.titulo ?? "" }, ...(serie ? { inputs: { PARTES: { block: serie } } } : {}) }] } };
}
async function abrePagina() {
  cuaderno = null; vacio(); estado("Abriendo la página.");
  const m = $("marco"); m.src = $("pagina").value;
  await new Promise((r) => m.addEventListener("load", r, { once: true }));
  for (let i = 0; i < 60 && m.contentDocument.documentElement.dataset.listo !== "si"; i++) await new Promise((r) => setTimeout(r, 100));
  cuaderno = m.contentWindow.cuaderno;
  if (!cuaderno) return estado("No se pudo abrir la página.");
  const g = lee();
  let guardado = null;
  if (!g) { try { const ix = await (await fetch("aspecto/indice.json")).json(); if (ix.includes(cuaderno.clave)) guardado = await (await fetch(`aspecto/${cuaderno.clave}.json`)).json(); } catch { } }
  try { pon((g ?? guardado)?.bloques ?? bloquesDePagina()); } catch { pon(bloquesDePagina()); }
  ws.clearUndo(); await muestra(); estado("Mueve las partes o suéltalas fuera para ocultarlas.");
}
async function abreLab(nombre) {
  vacio();
  if (nombre) labId = nuevoId();
  let g = nombre ? null : lee();
  if (nombre) { if (!/^[a-z0-9-]+$/.test(nombre)) return estado("Nombre no válido."); try { const r = await fetch(`laboratorios/${nombre}.json`); if (!r.ok) throw 0; g = await r.json(); } catch { return estado("No existe ese laboratorio."); } }
  if (g) { try { pon(g.bloques); $("titulo").value = g.titulo ?? ""; } catch { estado("Ese laboratorio tiene bloques que el editor no conoce."); } }
  ws.clearUndo(); await muestra(); $("anterior").hidden = true; misLabs();
}
async function cambiaModo(m, lab) {
  clearTimeout(espera); modo = m;
  for (const [id, x] of [["m-asp", "asp"], ["m-lab", "lab"]]) $(id).setAttribute("aria-selected", String(m === x));
  $("c-pagina").hidden = $("marco").hidden = m !== "asp"; $("c-titulo").hidden = $("vista").hidden = $("ejemplo").hidden = $("c-mislabs").hidden = $("borrarlab").hidden = m !== "lab"; $("restaurar").hidden = m !== "asp"; $("anterior").hidden = true;
  ws.updateToolbox(CAJAS[m]);
  if (m === "asp") await abrePagina(); else { cuaderno = null; await abreLab(lab); }
}
$("m-asp").onclick = () => cambiaModo("asp"); $("m-lab").onclick = () => cambiaModo("lab");
$("pagina").onchange = abrePagina;
$("deshacer").onclick = () => ws.undo(false); $("rehacer").onclick = () => ws.undo(true);
$("ejemplo").onclick = () => abreLab("cremado");
$("mislabs").onchange = async () => { labId = $("mislabs").value || nuevoId(); vacio(); $("titulo").value = ""; await abreLab(); };
$("borrarlab").onclick = async () => { if (!A.uno("laboratorio", labId) || !confirm("¿Borrar este laboratorio? No se puede deshacer.")) return; A.borra("laboratorio", labId); labId = nuevoId(); $("titulo").value = ""; await abreLab(); };
$("restaurar").onclick = async () => { if (!cuaderno) return; pon(bloquesDePagina()); A.borra("aspecto", cuaderno.clave); await muestra(); estado("La página volvió a su versión original."); };
$("descargar").onclick = () => {
  if (modo === "asp" && !cuaderno) return;
  const j = archivo(), n = modo === "lab" ? limpio(j.titulo) : j.pagina, a = document.createElement("a"), u = URL.createObjectURL(new Blob([JSON.stringify(j, null, 1)], { type: "application/json" }));
  a.href = u; a.download = `${n}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  estado(`Guarda ${n}.json en la carpeta ${modo === "lab" ? "laboratorios" : "aspecto"} y genera el sitio.`);
};
$("abrir").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.version !== 2 || !["laboratorio", "aspecto"].includes(j.clase)) throw new Error("Ese archivo no es del editor.");
    const m = j.clase === "laboratorio" ? "lab" : "asp";
    if (m !== modo) await cambiaModo(m);
    if (m === "asp" && j.pagina !== cuaderno?.clave) throw new Error(`Ese archivo es de la página ${j.pagina}. Elígela primero.`);
    if (m === "lab") labId = nuevoId();
    pon(j.bloques); if (m === "lab") { $("titulo").value = j.titulo ?? ""; }
    cambio(); estado(`Abriste ${f.name}.`);
  } catch (x) { estado(x instanceof SyntaxError ? "Ese archivo no es JSON." : x.message); }
  e.target.value = "";
};
window.editorDeBloques = { ws, laboratorio, aspecto, archivo };
const qs = new URLSearchParams(location.search), lab = qs.get("lab");
if (qs.get("mio") && /^[A-Za-z0-9_-]{1,80}$/.test(qs.get("mio"))) labId = qs.get("mio");
await cambiaModo(lab || qs.get("mio") ? "lab" : "asp", lab);
