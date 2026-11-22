const CATIONICOS = ["btms", "ctac", "sapdma", "dsdac"], ANIONICOS = ["xantana", "sles", "sci"];
const ACIDOS = { sorbato: { f: 112.13 / 150.22, max: 0.6, nombre: "ácido sórbico", pH: 5.5 }, benzoato: { f: 122.12 / 144.1, max: 0.5, nombre: "ácido benzoico", pH: 5 } };
const TOPES = { fenoxi: [1, "fenoxietanol"], zno: [25, "óxido de zinc"], tio2: [25, "dióxido de titanio"] };

export function suma(fases) {
  return fases.flatMap((f) => f.ingredientes).reduce((a, i) => a + (Number(i.pct) || 0), 0);
}
export function total(fases) {
  const t = new Map();
  for (const i of fases.flatMap((f) => f.ingredientes)) t.set(i.id, (t.get(i.id) ?? 0) + (Number(i.pct) || 0));
  return t;
}
export function revisar({ fases, pH, tipo, producto }) {
  const t = total(fases), avisos = [], s = suma(fases), tiene = (l) => l.filter((x) => (t.get(x) ?? 0) > 0);
  if (Math.abs(s - 100) > 0.011) avisos.push(`La fórmula suma ${s.toFixed(2)} %. Tiene que sumar 100.`);
  for (const [k, [max, n]] of Object.entries(TOPES)) if ((t.get(k) ?? 0) > max) avisos.push(`El ${n} pasa de ${max} %, el límite europeo.`);
  for (const [k, a] of Object.entries(ACIDOS)) if ((t.get(k) ?? 0) * a.f > a.max) avisos.push(`El ${a.nombre} pasa de ${a.max} % como ácido, el límite europeo sin enjuague.`);
  if ((t.get("ctac") ?? 0) * 0.25 > 1 && producto !== "acondicionador") avisos.push("El cetrimonio pasa de 1.0 % activo, el límite en cabello sin enjuague.");
  const agua = t.get("agua") ?? 0, cons = tiene(["fenoxi", "sorbato", "benzoato"]), alcohol = t.get("etanol") ?? 0;
  if (agua > 0 && !cons.length && alcohol < 20 && tipo !== "jabon") avisos.push("Lleva agua y no veo un conservante.");
  const p = Number.parseFloat(pH);
  if (cons.length && !cons.includes("fenoxi") && Number.isFinite(p) && p > 5.5) avisos.push("Benzoato y sorbato pierden fuerza por encima de pH 5.5.");
  const c = tiene(CATIONICOS), n = tiene(ANIONICOS);
  if (c.length && n.length) avisos.push("Mezclas un catiónico con un aniónico: suelen precipitar.");
  return avisos;
}
