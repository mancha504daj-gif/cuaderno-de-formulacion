const sal = "laboratorio";
await Deno.mkdir(sal, { recursive: true });
await Deno.mkdir("aspecto", { recursive: true });
const ok = (n: string) => /^[a-z0-9-]+\.json$/.test(n);
const escribe = async (ruta: string, t: string) => { let a = ""; try { a = await Deno.readTextFile(ruta); } catch {  } if (a !== t) await Deno.writeTextFile(ruta, t); };
const nuevos = new Set<string>();
const lista: unknown[] = [];
for await (const e of Deno.readDir("laboratorios")) {
  if (!e.isFile || !ok(e.name)) { if (e.isFile) console.log("Se omite " + e.name); continue; }
  const base = e.name.slice(0, -5);
  let j; try { j = JSON.parse(await Deno.readTextFile("laboratorios/" + e.name)); } catch { console.log("Se omite " + e.name + ": no es JSON"); continue; }
  if (j.version !== 2 || j.clase !== "laboratorio") { console.log("Se omite " + e.name); continue; }
  nuevos.add(base + ".qmd");
  const partes = j.documento?.partes ?? [], es = partes.find((p: { t: string }) => p.t === "escena"), pr = partes.find((p: { t: string }) => p.t === "probeta");
  lista.push({ archivo: base, titulo: String(j.titulo), paso: partes.find((p: { t: string }) => p.t === "paso")?.texto ?? "", entradas: Object.fromEntries(partes.filter((p: { t: string }) => p.t === "entrada").map((p: { nombre: string; valor: number }) => [p.nombre, p.valor])), escena: es ? { tipo: es.tipo, valores: es.valores } : pr ? { tipo: "stokes", valores: { radio: pr.radio, visc: pr.visc, delta: { t: "bin", op: "-", a: pr.medio, b: pr.gota } } } : null });
  await escribe(sal + "/" + base + ".qmd", "---\ntitle: " + JSON.stringify(String(j.titulo)) + "\ntoc: false\n---\n\n```{=html}\n<div data-lab=\"" + base + "\"><p>Cargando.</p></div>\n<p><a href=\"../editor.html?lab=" + base + "\">Abrir en el editor</a></p>\n```\n");
}
for await (const e of Deno.readDir(sal)) if (e.name.endsWith(".qmd") && !nuevos.has(e.name)) await Deno.remove(sal + "/" + e.name);
await escribe("datos/laboratorios.json", JSON.stringify(lista.sort((a, b) => (a as { titulo: string }).titulo.localeCompare((b as { titulo: string }).titulo, "es"))));
type Reg = Record<string, any>;
const lee = async (p: string) => JSON.parse(await Deno.readTextFile(p));
const prods: Reg[] = await lee("datos/productos.json"), ing: Reg[] = await lee("datos/ingredientes.json"), ter: Reg[] = await lee("datos/terminos.json"), recs: Reg[] = [];
for await (const e of Deno.readDir("recetas")) if (e.isFile && ok(e.name)) recs.push(await lee("recetas/" + e.name));
recs.sort((a, b) => a.nivel - b.nivel || a.titulo.localeCompare(b.titulo, "es"));
const SEC: Record<string, [string, string, string, string]> = { piel: ["Cuidado de la piel", "#b3245c", "piel", "Frasco de crema abierto con su tapa azul"], limpieza: ["Limpieza", "#4d5a2c", "jabonera", "Pilas de jabón de Alepo curándose"], solar: ["Protección solar", "#8a5200", "solar", "Una persona aplica protector a un niño"], maquillaje: ["Maquillaje", "#5c1f3a", "maquillaje", "Labiales de varios tonos"], cabello: ["Cabello", "#00616f", "champu", "Champú sólido con espuma"], fragancias: ["Fragancias", "#15171f", "frasco", "Frasco de perfume de vidrio"] };
const li = (l: string[]) => l.map((x) => "- " + x).join("\n"), num = (l: string[]) => l.map((x, i) => (i + 1) + ". " + x).join("\n"), tab = (c: string[], f: string[][]) => "| " + c.join(" | ") + " |\n|" + c.map(() => "---").join("|") + "|\n" + f.map((r) => "| " + r.join(" | ") + " |").join("\n");
await Deno.mkdir("producto", { recursive: true }); await Deno.mkdir("_inc", { recursive: true });
const vivas = new Set<string>();
for (const p of prods) {
  const [sn, color, foto, alt] = SEC[p.seccion], mias = recs.filter((r) => r.producto === p.slug);
  vivas.add(p.slug + ".qmd");
  const cuerpo = mias.map((r) => `## ${r.titulo}

\`\`\`{=html}
<div data-receta="${r.slug}"><p>Cargando.</p></div>
\`\`\`

::: {.avisos}
${li(r.avisos)}
:::

### Por qué funciona

${r.porque}

### Paso a paso

${num(r.pasos)}

### Cómo saber si salió bien

${tab(["Control", "Meta", "Cómo se mide"], r.controles)}

### Si algo falla

${tab(["Qué ves", "Por qué", "Qué hacer"], r.fallas)}

### Qué puedes cambiar

${li(r.cambia)}

**Fuentes.** ${r.fuentes.join(" ")}
`).join("\n");
  const otros = prods.filter((o) => o.seccion === p.seccion && o.slug !== p.slug).map((o) => `[${o.nombre}](${o.slug}.qmd)`).join(", ");
  await escribe("producto/" + p.slug + ".qmd", `---
title: ${JSON.stringify(p.nombre)}
toc: false
page-layout: full
${p.slug === "locion-corporal" ? "aliases: [/ejemplos/locion-de-almendras.html]\n" : ""}---

\`\`\`{=html}
<figure class="cabeza" style="--color:${color}" data-alto="baja"><div class="marco"><img src="../fotos/${foto}.jpg" alt="${alt}"></div><h1>${p.nombre}</h1></figure>
\`\`\`

[${sn}](../${p.seccion}/index.qmd). ${p.que} Forma: ${p.forma}.

Estas recetas son propuestas de este proyecto y nadie las ha ensayado todavía. Sirven para llevarlas al laboratorio, probarlas y corregirlas.

${cuerpo}
## Otros productos de esta sección

${otros}.
`);
}
for await (const e of Deno.readDir("producto")) if (e.name.endsWith(".qmd") && !vivas.has(e.name)) await Deno.remove("producto/" + e.name);
const caja = (t: Reg, at: string) => ":::: {" + at + "}\n**" + t.palabra + "**\n\n" + t.def + (t.ej ? " *" + t.ej + "*" : "") + "\n\n::::\n";
for (const s of [...Object.keys(SEC), "emulsiones", "microbiologia", "base"]) await escribe("_inc/terminos-" + s + ".md", "::: {.fichas .sin-glosa}\n\n" + ter.filter((t) => t.secciones.includes(s)).map((t) => caja(t, ".termino-caja")).join("\n") + "\n:::\n");
await escribe("_inc/glosario.md", "::: {.fichas .sin-glosa #lista-terminos}\n\n" + ter.slice().sort((a, b) => a.palabra.localeCompare(b.palabra, "es")).map((t) => caja(t, '.termino-caja data-ficha="t"')).join("\n") + "\n:::\n");
const usos = (id: string) => recs.filter((r) => r.fases.some((f: Reg) => f.ingredientes.some((i: Reg) => i.id === id)));
const clases = [...new Set(ing.map((i) => i.clase as string))].sort((a, b) => a.localeCompare(b, "es"));
await escribe("_inc/ingredientes.md", clases.map((c) => `## ${c[0].toUpperCase() + c.slice(1)}\n\n::: {.fichas}\n\n` + ing.filter((i) => i.clase === c).map((i) => { const u = usos(i.id); return `:::: {.ficha-ing data-ficha="i"}\n### ${i.nombre[0].toUpperCase() + i.nombre.slice(1)}\n\n${i.inci}. ${i.hace} ${i.nota}${i.rango ? ` Rango: ${i.rango[0]} (${i.rango[1]}).` : ""}${i.limite ? ` Límite UE: ${i.limite[0]} (${i.limite[1]}).` : ""}${i.hlb ? ` HLB que pide: ${i.hlb}.` : ""}\n\n${u.length ? "Se usa en: " + [...new Set(u.map((r) => r.producto as string))].map((s) => `[${prods.find((p) => p.slug === s)?.nombre ?? s}](producto/${s}.qmd)`).join(", ") + "." : "Todavía sin receta."}\n\n::::\n`; }).join("\n") + "\n:::\n").join("\n"));
const cat: Reg[] = await lee("datos/catalogo.json");
await escribe("_inc/catalogo.md", cat.map((c) => `## ${c.nombre}\n\n${tab(c.cab, c.filas.map((f: string[]) => f.map((x) => x.replaceAll("|", "/").replaceAll("<", "menor que ").replaceAll("*", "") || " ")))}\n`).join("\n"));
const ix: string[] = [];
for await (const e of Deno.readDir("aspecto")) if (e.isFile && ok(e.name) && e.name !== "indice.json") ix.push(e.name.slice(0, -5));
await escribe("aspecto/indice.json", JSON.stringify(ix.sort()));
