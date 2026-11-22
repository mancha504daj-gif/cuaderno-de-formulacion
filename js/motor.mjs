const num = (x, nombre) => {
  const v = Number(x);
  if (!Number.isFinite(v)) throw new Error(`Falta un número en «${nombre}».`);
  return v;
};

export function hlbRequerido(aceites) {
  if (!aceites.length) throw new Error("Agrega al menos un aceite.");
  let masa = 0, min = 0, max = 0;
  for (const a of aceites) {
    const p = num(a.pct, "porcentaje");
    if (p <= 0) throw new Error("Cada porcentaje debe ser mayor que cero.");
    masa += p;
    min += p * num(a.min, "HLB");
    max += p * num(a.max, "HLB");
  }
  return { min: min / masa, max: max / masa, masa };
}

export function mezclaEmulsionantes(objetivo, hlbA, hlbB) {
  const o = num(objetivo, "HLB objetivo"), a = num(hlbA, "HLB de A"), b = num(hlbB, "HLB de B");
  if (a === b) throw new Error("Los dos emulsionantes tienen el mismo HLB.");
  const x = (o - b) / (a - b);
  if (x < 0 || x > 1) throw new Error(`Este par cubre de ${Math.min(a, b)} a ${Math.max(a, b)}; el objetivo es ${o.toFixed(1)}.`);
  return x;
}

export function stokes({ radio_um, rho_gota, rho_medio, viscosidad }) {
  const r = num(radio_um, "radio") * 1e-6, eta = num(viscosidad, "viscosidad");
  if (r <= 0 || eta <= 0) throw new Error("El radio y la viscosidad deben ser mayores que cero.");
  return (2 * r * r * 9.80665 * (num(rho_medio, "densidad del medio") - num(rho_gota, "densidad de la gota"))) / (9 * eta);
}

export function fraccionNoDisociada(pH, pKa) {
  return 1 / (1 + 10 ** (num(pH, "pH") - num(pKa, "pKa")));
}

export function comoAcido(pctSal, masaAcido, masaSal) {
  return (num(pctSal, "concentración") * num(masaAcido, "masa molar")) / num(masaSal, "masa molar");
}

export function alcali(aceites, { sobreengrase, base, pureza }) {
  if (!aceites.length) throw new Error("Agrega al menos un aceite.");
  const s = num(sobreengrase, "sobreengrase"), p = num(pureza, "pureza");
  if (s < 0 || s >= 100) throw new Error("El sobreengrase va de 0 a menos de 100 %.");
  if (p <= 0 || p > 100) throw new Error("La pureza va de más de 0 a 100 %.");
  const k = (base === "NaOH" ? 40.0 / 56.11 : 1) * (1 - s / 100) / (p / 100);
  let min = 0, max = 0, masa = 0;
  for (const a of aceites) {
    const g = num(a.g, "gramos");
    if (g <= 0) throw new Error("Cada aceite debe pesar más de cero.");
    masa += g;
    min += (g * num(a.min, "SAP")) / 1000;
    max += (g * num(a.max, "SAP")) / 1000;
  }
  return { min: min * k, max: max * k, masa };
}

export function aguaLejia(gAlcali, pct) {
  const c = num(pct, "concentración");
  if (c <= 0 || c >= 100) throw new Error("La concentración va de más de 0 a menos de 100 %.");
  return (num(gAlcali, "álcali") * (100 - c)) / c;
}

export function materiaPrima(lote, pctActivo, pctComercial) {
  const c = num(pctComercial, "activo comercial");
  if (c <= 0 || c > 100) throw new Error("El activo comercial va de más de 0 a 100 %.");
  return (num(lote, "lote") * num(pctActivo, "activo")) / c;
}

const BIN = {
  "+": (a, b) => a + b, "-": (a, b) => a - b, "*": (a, b) => a * b, "/": (a, b) => a / b, "^": (a, b) => a ** b, max: Math.max, min: Math.min,
};
const FUN = { log10: Math.log10, ln: Math.log, exp: Math.exp, raiz: Math.sqrt };
export const CMP = { "<": (a, b) => a < b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, ">=": (a, b) => a >= b };

export function evaluar(n, vars) {
  if (!n) throw new Error("Hay un espacio vacío en la ecuación.");
  switch (n.t) {
    case "num": return num(n.v, "número");
    case "var":
      if (!Object.hasOwn(vars, n.v)) throw new Error(`No hay ninguna entrada llamada «${n.v}».`);
      return num(vars[n.v], n.v);
    case "bin": {
      if (!Object.hasOwn(BIN, n.op)) throw new Error("Operación desconocida.");
      const r = BIN[n.op](evaluar(n.a, vars), evaluar(n.b, vars));
      if (!Number.isFinite(r)) throw new Error("El resultado no es un número (revisa divisiones entre cero).");
      return r;
    }
    case "fun": {
      if (!Object.hasOwn(FUN, n.f)) throw new Error("Función desconocida.");
      const r = FUN[n.f](evaluar(n.a, vars));
      if (!Number.isFinite(r)) throw new Error("El resultado no es un número.");
      return r;
    }
    default: throw new Error("Bloque desconocido en la ecuación.");
  }
}

export function ufc(placas, { min = 15, max = 300 } = {}) {
  if (!placas.length) throw new Error("Agrega al menos una placa.");
  const p = placas.map((x) => { const c = num(x.colonias, "colonias"), v = num(x.volumen, "volumen"), d = num(x.dilucion, "dilución"); if (c < 0 || v <= 0 || d < 0) throw new Error("Revisa los datos de la placa."); return { c, q: v * 10 ** -d }; });
  const red = (x) => { if (!(x > 0)) return 0; const e = 10 ** (Math.floor(Math.log10(x) + 1e-12) - 1), k = Number((x / e).toPrecision(12)), b = Math.floor(k), r = k - b; return Number(((Math.abs(r - 0.5) < 1e-9 ? b + (b % 2) : Math.round(k)) * e).toPrecision(6)); }, suma = (l, k) => l.reduce((a, x) => a + x[k], 0), fm = (x) => red(x).toLocaleString("en-US").replaceAll(",", " ");
  const buenas = p.filter((x) => x.c >= min && x.c <= max);
  if (buenas.length) { const n = suma(buenas, "c") / suma(buenas, "q"); return { valor: n, texto: fm(n), nota: "contable" }; }
  if (p.every((x) => x.c === 0)) { const n = 1 / suma(p.filter((x) => x.q === Math.max(...p.map((y) => y.q))), "q"); return { valor: n, texto: `menos de ${fm(n)}`, nota: "sin colonias" }; }
  if (p.every((x) => x.c > max)) { const q = Math.min(...p.map((x) => x.q)), n = max / q; return { valor: n, texto: `más de ${fm(n)}`, nota: "incontable: diluye más" }; }
  const bajas = p.filter((x) => x.c < min), mayor = Math.max(...bajas.map((x) => x.q)), u = bajas.filter((x) => x.q === mayor), n = suma(u, "c") / suma(u, "q");
  return { valor: n, texto: fm(n), nota: "estimado: conteo fuera de rango" };
}
export function reduccionLog(inicial, final) {
  const a = num(inicial, "inicial"), b = num(final, "final");
  if (a <= 0 || b <= 0) throw new Error("Los conteos deben ser mayores que cero.");
  return Math.log10(a / b);
}

export function escalarFormula(fases, lote) {
  const L = num(lote, "lote");
  if (L <= 0) throw new Error("El lote debe ser mayor que cero.");
  let suma = 0, csp = 0;
  for (const f of fases) for (const i of f.ingredientes) i.csp ? csp++ : (suma += num(i.pct, i.inci));
  if (csp > 1) throw new Error("Solo un ingrediente puede ir como c.s.p.");
  if (suma > 100 + 1e-9) throw new Error(`La fórmula suma ${suma.toFixed(2)} %.`);
  const resto = 100 - suma;
  const filas = fases.map((f) => ({
    nombre: f.nombre,
    ingredientes: f.ingredientes.map((i) => {
      const pct = i.csp ? resto : Number(i.pct);
      return { ...i, pct, gramos: (pct * L) / 100 };
    }),
  }));
  return { filas, total: csp ? 100 : suma };
}
