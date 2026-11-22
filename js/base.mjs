import { h } from "./elementos.mjs";
import { Gel, rgb } from "./gel.mjs";

const calma = matchMedia("(prefers-reduced-motion: reduce)");
let pausado = false;
const lienzos = new Set();
export const registrar = (x) => lienzos.add(x);
export const quieto = () => calma.matches || pausado;
export const TAU = Math.PI * 2; export const lim = (x, a, b) => Math.min(b, Math.max(a, x));
export const va = (x, meta, dt, k = 5) => x + (meta - x) * (1 - Math.exp(-k * dt));
export const mezcla = (a, b, t) => a + (b - a) * t, suave = (t) => { const x = lim(t, 0, 1); return x * x * (3 - 2 * x); };

export function lienzo(rotulo, pinta, W = 480, H = 520, color = null) {
  const abajo = h("canvas", { "aria-hidden": "true" }), arriba = h("canvas", { "aria-hidden": "true" }), caja = h("div", { class: "lienzo", role: "img", "aria-label": rotulo }, abajo, arriba), g = arriba.getContext("2d"), G = new Gel(abajo);
  let ve = false, antes = 0, id = 0, t = Math.random() * 40, w = 0, al = 0, k = 1, pedido = false, lento = 0, calidad = 1;
  const cuadro = (dt, dibuja = true) => {
    t += dt;
    if (!w || !al) return;
    const d = Math.min(2, devicePixelRatio || 1), dg = abajo.width / w;
    k = Math.min(w / W, al / H);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, arriba.width, arriba.height);
    g.setTransform(d * k, 0, 0, d * k, ((w - W * k) / 2) * d, ((al - H * k) / 2) * d);
    g.globalAlpha = 1; G.n = 0;
    if (color) G.base = rgb(typeof color === "function" ? color() : color);
    pinta(g, dt, t, (n) => Math.max(n, 12.5 / k), G);
    if (dibuja && !G.dibuja(t, ((w - W * k) / 2) * dg, ((al - H * k) / 2) * dg, k * dg)) { abajo.hidden = true; }
  };
  const bucle = (ms) => { id = 0; if (!ve || quieto()) return; const pasa = ms - antes; lento = pasa > 42 ? lento + 1 : Math.max(0, lento - 1); if (lento > 25 && calidad > 0.5) { calidad *= 0.8; lento = 0; mide(); } cuadro(Math.min(0.05, Math.max(0.001, pasa / 1000))); antes = ms; id = requestAnimationFrame(bucle); };
  const yo = {
    el: caja,
    arranca() { if (quieto()) yo.asienta(); else if (ve && !id) { antes = performance.now(); id = requestAnimationFrame(bucle); } },
    asienta() { if (!quieto() || pedido) return; pedido = true; requestAnimationFrame(() => { pedido = false; for (let i = 0; i < 60; i++) cuadro(0.05, i === 59); }); },
    punto(ev) { const r = caja.getBoundingClientRect(); return [(ev.clientX - r.left - (w - W * k) / 2) / k, (ev.clientY - r.top - (al - H * k) / 2) / k]; },
    raton: null,
  };
  caja.addEventListener("pointermove", (ev) => { yo.raton = yo.punto(ev); G.raton = yo.raton; });
  caja.addEventListener("pointerleave", () => { yo.raton = null; G.raton = [-999, -999]; });
  const mide = () => {
    const d = Math.min(2, devicePixelRatio || 1); w = caja.clientWidth; al = caja.clientHeight;
    arriba.width = Math.round(w * d); arriba.height = Math.round(al * d);
    const dg = w && al ? Math.min(d, 1.5, Math.sqrt(720000 / (w * al))) * calidad : 1; abajo.width = Math.round(w * dg); abajo.height = Math.round(al * dg);
    if (w && al) { if (quieto()) yo.asienta(); else cuadro(0.001); }
  };
  const ro = new ResizeObserver(mide), io = new IntersectionObserver((es) => {
    ve = es.at(-1).isIntersecting;
    if (!ve && !caja.isConnected) { ro.disconnect(); io.disconnect(); lienzos.delete(yo); G.suelta(); return; }
    yo.arranca();
  });
  ro.observe(caja); io.observe(caja);
  lienzos.add(yo);
  return yo;
}
calma.addEventListener("change", () => { for (const l of lienzos) l.arranca(); });

export function texto(g, t, x, y, n, { color = "#fff", junto = "center", peso = 500, serif = false, sombra = true } = {}) {
  g.font = `${serif ? 400 : peso} ${n}px ${serif ? '"Bodoni Moda", serif' : '"Archivo", sans-serif'}`;
  g.textAlign = junto; g.textBaseline = "middle"; g.fillStyle = color;
  if (sombra) { g.shadowColor = "rgba(0,0,0,.55)"; g.shadowBlur = 8; }
  g.fillText(t, x, y); g.shadowBlur = 0;
}
export function pincelada(g, x, y, dy, color, t) {
  const L = Math.abs(dy), s = Math.sign(dy); if (L < 8) return;
  const c = Math.sin(t * 1.3) * 5 + 5, ex = x + Math.sin(t * 0.9) * 2, ey = y + dy;
  g.save(); g.lineCap = "round"; g.shadowColor = color; g.shadowBlur = 14; g.fillStyle = color;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 4 + c, y + dy * 0.5, ex - 2.6, ey); g.lineTo(ex + 2.6, ey); g.quadraticCurveTo(x + 5 + c, y + dy * 0.5, x, y); g.fill();
  g.strokeStyle = color; g.lineWidth = 4.6; const p = Math.min(20, L * 0.35);
  g.beginPath(); g.moveTo(ex - p * 0.72, ey - s * p * 0.86); g.quadraticCurveTo(ex - p * 0.16, ey - s * p * 0.36, ex, ey); g.quadraticCurveTo(ex + p * 0.12, ey - s * p * 0.44, ex + p * 0.62, ey - s * p); g.stroke();
  g.restore();
}

export function botonPausa() {
  if (calma.matches || document.querySelector(".pausa")) return;
  const b = h("button", { type: "button", class: "pausa", onclick: () => {
    pausado = !pausado; b.textContent = pausado ? "Reanudar movimiento" : "Pausar movimiento";
    document.documentElement.classList.toggle("pausado", pausado);
    for (const l of lienzos) l.arranca();
  } }, "Pausar movimiento");
  (document.querySelector("main") ?? document.body).append(b);
}
