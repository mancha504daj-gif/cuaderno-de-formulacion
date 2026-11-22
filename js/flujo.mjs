import { evaluar } from "./motor.mjs";
import { lienzo, texto as rotular, va as acercar } from "./base.mjs";
import { rgb } from "./gel.mjs";

const SIGNO = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "xʸ", max: "máx", min: "mín" }, FUN = { raiz: "√", exp: "eˣ", ln: "ln", log: "log", log10: "log" };

export function flujo(expr, cifra, unidad = "") {
  const nodos = [];
  let hojas = 0, hondo = 0;
  const arma = (n, prof, padre) => {
    hondo = Math.max(hondo, prof);
    const o = { n, prof, padre, golpe: 0, valor: NaN, previo: NaN, pulsos: [], foco: 0 };
    nodos.push(o);
    if (n?.t === "bin") { const a = arma(n.a, prof + 1, o), b = arma(n.b, prof + 1, o); o.fila = (a.fila + b.fila) / 2; }
    else if (n?.t === "fun") o.fila = arma(n.a, prof + 1, o).fila;
    else o.fila = hojas++;
    return o;
  };
  const raiz = arma(expr, 1, null);
  const W = Math.max(560, 130 * hondo + 130), H = Math.max(300, hojas * 92 + 60);
  const sal = { x: W - 64, y: 30 + (raiz.fila + 0.5) * ((H - 60) / hojas), golpe: 0 };
  for (const o of nodos) { o.x = 56 + (1 - (o.prof - 1) / Math.max(1, hondo)) * (W - 250); o.y = 30 + (o.fila + 0.5) * ((H - 60) / hojas); }
  for (const o of nodos) if (!o.n || o.n.t === "num" || o.n.t === "var") o.hoja = true;
  let reloj = 0, foco = null;
  const pulso = (o, fuerte) => { if (o.pulsos.length < 3) o.pulsos.push({ t: 0, fuerte }); };
  const curva = (o, d, t) => { const mx = (o.x + d.x) / 2, u = 1 - t; return [u ** 3 * o.x + 3 * u * u * t * mx + 3 * u * t * t * mx + t ** 3 * d.x, u ** 3 * o.y + 3 * u * u * t * o.y + 3 * u * t * t * d.y + t ** 3 * d.y]; };
  const pasa = (o, v) => { const b = (n) => !!n && (n.t === "var" ? n.v === v : b(n.a) || b(n.b)); return b(o.n); };
  const ORO = rgb("#ffc23d"), HILO = rgb("#dfe8ff"), CREMA = "#fff4df";
  let fondo = "#b3245c";
  const L = lienzo("Circuito del cálculo: los valores recorren las operaciones hasta el resultado", (g, dt, t, fs, G) => {
    reloj += dt;
    if (reloj > 2.4) { reloj = 0; for (const o of nodos) if (o.hoja) pulso(o, false); }
    for (const o of nodos) {
      const d = o.padre ?? sal, mira = foco && pasa(o, foco), n = Math.max(12, Math.round(Math.hypot(d.x - o.x, d.y - o.y) / 5.5));
      for (let i = 0; i <= n; i++) {
        const u = i / n, [x, y] = curva(o, d, u); let b = 0, oro = 0;
        if (Math.hypot(x - o.x, y - o.y) < 17 || Math.hypot(x - d.x, y - d.y) < (d === sal ? 48 : 17)) continue;
        for (const p of o.pulsos) { const k = Math.exp(-(((u - p.t) / 0.11) ** 2)); b += k * (p.fuerte ? 9 : 4.5); oro += k * (p.fuerte ? 1 : 0.6); }
        const k = Math.min(1, oro + (mira ? 0.8 : 0)); G.gota(x, y + Math.sin(u * 6 + t * 1.5 + o.fila) * 2.6 * Math.sin(u * Math.PI), 3.6 + b + (mira ? 1.6 : 0), HILO.map((z, j) => z + (ORO[j] - z) * k), { clara: 0.55, peso: 0.75 });
      }
      for (const p of o.pulsos) { p.t += dt * (p.fuerte ? 1.5 : 0.85); if (p.t >= 1 && !p.listo) { p.listo = true; d.golpe = p.fuerte ? 1 : 0.4; if (o.padre && !o.padre.pulsos.some((z) => z.t < 0.3)) pulso(o.padre, p.fuerte); } }
      o.pulsos = o.pulsos.filter((p) => p.t < 1.25);
    }
    for (const o of nodos) {
      o.golpe = acercar(o.golpe, 0, dt, 3); o.foco = acercar(o.foco, foco && o.n?.t === "var" && o.n.v === foco ? 1 : 0, dt, 9);
      const n = o.n ?? { t: "?" }, r = (n.t === "var" ? 34 : n.t === "num" ? 22 : 25) * (1 + o.golpe * 0.16 + o.foco * 0.16);
      G.gota(o.x, o.y, r, n.t === "var" ? "#ffc23d" : CREMA, { clara: 0.05, brillo: 0.75, est: 1 + Math.sin(t * 1.7 + o.fila * 2 + o.prof) * 0.03 + o.golpe * 0.09 * Math.sin(t * 22), giro: o.fila });
      const tinta = { color: "#231600", sombra: false };
      if (n.t === "var") { rotular(g, n.v, o.x, o.y - 8, Math.min(fs(16), 50 / Math.max(2, n.v.length) + 6), { ...tinta, peso: 700 }); rotular(g, cifra(o.valor), o.x, o.y + 11, Math.min(fs(15), 17), tinta); }
      else rotular(g, n.t === "num" ? String(n.v).replace("-", "−") : n.t === "bin" ? SIGNO[n.op] ?? "?" : n.t === "fun" ? FUN[n.f] ?? n.f : "?", o.x, o.y, n.t === "num" ? Math.min(fs(15), 17, 58 / Math.max(3, String(n.v).length) + 3) : n.t === "bin" && n.op.length > 1 ? Math.min(fs(14), 17) : fs(21), { ...tinta, peso: 600 });
      if ((n.t === "bin" || n.t === "fun") && Number.isFinite(o.valor)) rotular(g, cifra(o.valor), o.x, o.y + r + 16, fs(15), {});
    }
    sal.golpe = acercar(sal.golpe, 0, dt, 2.6);
    G.gota(sal.x, sal.y, 56 * (1 + sal.golpe * 0.1), "#ffffff", { clara: 0.04, brillo: 0.7, est: 1 + Math.sin(t * 1.5) * 0.025 + sal.golpe * 0.06 * Math.sin(t * 18) });
    const tv = cifra(raiz.valor); rotular(g, tv, sal.x, sal.y - (unidad ? 8 : 0), Math.min(29, 140 / Math.max(3, tv.length)), { color: fondo, peso: 700, sombra: false }); if (unidad) rotular(g, unidad, sal.x, sal.y + 20, fs(15), { color: fondo, peso: 600, sombra: false });
  }, W, H, () => fondo);
  const tono = () => { const c = getComputedStyle(L.el).getPropertyValue("--color").trim(); if (/^#[0-9a-f]{6}$/i.test(c)) fondo = c; };
  L.el.style.aspectRatio = `${W} / ${H}`;
  L.el.addEventListener("pointermove", (e) => { const [x, y] = L.punto(e), o = nodos.find((z) => z.n?.t === "var" && Math.hypot(z.x - x, z.y - y) < 36); L.alMirar?.(o ? o.n.v : null); });
  L.el.addEventListener("pointerleave", () => L.alMirar?.(null));
  return { el: L.el, mirar: (v) => { foco = v; L.asienta(); }, al: (fn) => { L.alMirar = fn; }, poner(v) {
    tono();
    for (const o of nodos) { o.previo = o.valor; try { o.valor = evaluar(o.n, v); } catch { o.valor = NaN; } if (o.n?.t === "var" && Number.isFinite(o.previo) && o.previo !== o.valor) pulso(o, true); }
    L.asienta();
  } };
}
