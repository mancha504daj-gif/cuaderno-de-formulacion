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
const ix: string[] = [];
for await (const e of Deno.readDir("aspecto")) if (e.isFile && ok(e.name) && e.name !== "indice.json") ix.push(e.name.slice(0, -5));
await escribe("aspecto/indice.json", JSON.stringify(ix.sort()));
