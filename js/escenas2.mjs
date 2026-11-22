import { lienzo, texto, TAU, va, lim, mezcla, suave } from "./base.mjs";
import { rgb } from "./gel.mjs";

const az = (a, b) => a + Math.random() * (b - a);
const tinte = (a, b, t) => a.map((z, i) => mezcla(z, b[i], t));
function cola(G, x, y, an, t, i, { largo = 9, r0 = 5.4, r1 = 3, color = "#f6dc86", vivo = 1, paso = 5.4, peso = 0.62 } = {}) {
  const c = Math.cos(an), e = Math.sin(an);
  for (let j = 1; j <= largo; j++) { const d = j * paso + 4, z = Math.sin(t * 2.2 - j * 0.5 + i * 1.7) * j * 0.8 * vivo; G.gota(x + c * d - e * z, y + e * d + c * z, mezcla(r0, r1, j / largo), color, { clara: 0.3, peso }); }
}
const deriva = (m, t, k = 16) => [Math.sin(m.y * 0.016 + t * 0.42 + m.f) * k, Math.cos(m.x * 0.015 - t * 0.37 + m.f * 1.7) * k];
const separa = (l, i, d, fuerza) => { let fx = 0, fy = 0; const m = l[i]; for (const o of l) if (o !== m && !o.fuera) { const dx = m.x - o.x, dy = m.y - o.y, D = d + (m.r ?? 0) + (o.r ?? 0), q = dx * dx + dy * dy; if (q < D * D && q > 0.5) { const h = Math.sqrt(q), k = ((D - h) / h) * fuerza; fx += dx * k; fy += dy * k; } } return [fx, fy]; };

function piel() {
  const s = { paso: 0, oclusion: 0 };
  const cel = [];
  for (let f = 0; f < 6; f++) for (let c = 0; c < 9; c++) cel.push({ x: -160 + c * 100 + (f % 2) * 50, y: 190 + f * 42, f: f * 3.1 + c, fila: f });
  const gotas = Array.from({ length: 80 }, () => ({ x: az(-140, 620), y: az(70, 480), f: az(0, TAU), v: az(20, 36), dentro: true, baja: 0 }));
  const hum = Array.from({ length: 18 }, (_, i) => ({ x: 20 + ((i * 97) % 440), y: 176 + ((i * 53) % 100), f: i * 1.9 }));
  let hu = 0, em = 0, oc = 0, sale = 0;
  const L = lienzo("Corte de la capa externa de la piel: el agua sube entre las células y se evapora", (g, dt, t, fs, G) => {
    hu = va(hu, s.paso === 1 || s.paso === 3 || s.paso >= 4 ? 1 : 0, dt, 2); em = va(em, s.paso === 2 || s.paso >= 4 ? 1 : 0, dt, 2); oc = va(oc, s.oclusion / 100, dt, 3);
    const plena = Math.max(hu * 0.6, oc, em * 0.35);
    for (const c of cel) {
      const seco = (1 - plena) * (c.fila < 3 ? 1 - c.fila * 0.25 : 0.1), gi = Math.sin(c.f * 2.3) * 0.24 * seco + Math.sin(t * 0.7 + c.f) * 0.02;
      for (let k = -1; k <= 1; k += 0.5) G.gota(c.x + k * 33 * Math.cos(gi), c.y + k * 33 * Math.sin(gi) + Math.sin(t * 0.8 + c.f) * 1.4, mezcla(14.5, 17.5, plena) - Math.abs(k) * 4, tinte(rgb("#e7a596"), rgb("#ffc9b5"), plena), { clara: 0.18, peso: 0.6, brillo: 0.55 });
    }
    if (em > 0.02) for (let f = 0; f < 3; f++) for (let k = -8; k < 32; k++) G.gota(k * 21, 169 + f * 42 + Math.sin(k * 0.9 + t + f) * 2, 5 * em, "#f5c451", { clara: 0.5, peso: 0.7 });
    if (hu > 0.02) for (const p of hum) G.gota(p.x + Math.sin(t * 0.6 + p.f) * 5, p.y + Math.cos(t * 0.5 + p.f) * 3, 8.5 * hu, "#b9ec6e", { clara: 0.5 });
    const yf = 140;
    if (oc > 0.02) for (let k = -18; k <= 78; k++) G.gota(-10 + k * 8.4, yf + Math.sin(k * 0.32 + t * 0.7) * 4, 4 + 11 * Math.sqrt(oc), "#ffb638", { clara: 0.62, peso: 0.75 });
    let ahora = 0;
    for (const p of gotas) {
      const antes = p.y, retiene = hu > 0.4 && p.dentro && hum.some((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 420);
      if (p.baja > 0) { p.baja -= dt; p.y += 16 * dt; } else p.y -= p.v * (retiene ? 0.12 : 1) * (p.dentro ? 1 : 1.5) * dt;
      p.x += (Math.sin(p.y * 0.075 + p.f) * 30 + Math.sin(t + p.f) * 5) * dt;
      if (p.dentro && antes >= yf + 14 && p.y < yf + 14) { if (Math.random() < oc) { p.baja = az(1.2, 3); p.y = yf + 16; } else { p.dentro = false; ahora++; } }
      if (p.y < 52) Object.assign(p, { y: az(455, 500), x: az(-140, 620), dentro: true, baja: 0 });
      G.gota(p.x, p.y, p.dentro ? 5.6 : 5.6 * lim((p.y - 52) / 80, 0.15, 1), "#a9e2ff", { clara: 0.72, brillo: 1.2 });
    }
    if (dt > 0) sale = va(sale, ahora / Math.max(dt, 0.004), dt, 0.8);
    texto(g, s.paso >= 4 || s.paso === 0 ? `película: frena ${Math.round(oc * 100)} %` : ["", "humectante", "emoliente", "humectante y oclusivo"][s.paso], 240, 34, fs(28), { serif: true });
  }, 480, 520, () => s.color || "#8d2a52");
  return { L, s };
}

function solar() {
  const s = { paso: 0, fps: 30, q: 2 };
  let gr = 2, pasan = 0, total = 0, reloj = 0;
  const ray = [], marcas = [];
  const piso = (x) => 372 + Math.sin(x * 0.041) * 13 + Math.sin(x * 0.093 + 1) * 6;
  const L = lienzo("Rayos que llegan a la piel; la película de protector deja pasar una parte", (g, dt, t, fs, G) => {
    const efec = Math.max(1, s.fps) ** (s.q / 2), T = 1 / efec;
    gr = va(gr, s.q, dt, 4); reloj += dt;
    while (reloj > 0.03) { reloj -= 0.03; total++; const pasa = Math.random() < T; ray.push({ x: az(-130, 610), y: -30, v: az(330, 420), pasa, f: az(0, TAU) }); if (ray.length > 90) ray.shift(); }
    for (let k = -10; k <= 44; k++) { const x = -14 + k * 15.2; for (let j = 0; j < 4; j++) G.gota(x, piso(x) + 24 + j * 40, 27, j ? "#b9745a" : "#d8977a", { clara: 0.05, brillo: 0.4, peso: 0.6 }); }
    const arriba = (x) => piso(x) - 5 - gr * 9 - Math.sin(x * 0.041) * gr * 2;
    if (gr > 0.05) for (let k = -19; k <= 84; k++) { const x = -10 + k * 7.6, y0 = piso(x) - 2, y1 = arriba(x); for (let j = 0; j <= 2; j++) G.gota(x, mezcla(y0, y1, j / 2) + Math.sin(k * 0.5 + t) * 1.2, 3 + gr * 3.4, "#fff0cf", { clara: 0.42, peso: 0.55 }); }
    for (const r of ray) {
      if (r.fin) continue;
      r.y += r.v * dt;
      const tope = r.pasa ? 520 : arriba(r.x) - 4;
      if (r.y > tope) { r.fin = true; marcas.push({ x: r.x, y: lim(tope, 0, 500), t: 0, pasa: r.pasa }); if (marcas.length > 40) marcas.shift(); continue; }
      const enPiel = r.y > piso(r.x); if (r.pasa && enPiel && !r.conto) { r.conto = true; pasan++; }
      G.gota(r.x, r.y, enPiel ? 5.5 : 4.6, enPiel ? "#ff5a7a" : "#c9a4ff", { clara: 0.25, brillo: 1.6, est: 0.42 });
    }
    for (const m of marcas) { m.t += dt; if (m.t < 0.6 && !m.pasa) for (let j = 0; j < 4; j++) { const an = -Math.PI * (0.2 + j * 0.2); G.gota(m.x + Math.cos(an) * m.t * 34, m.y + Math.sin(an) * m.t * 26, 3 * (1 - m.t / 0.6), "#ffe9a8", { clara: 0.4 }); } }
    texto(g, `FPS que queda: ${efec < 10 ? efec.toFixed(1) : efec.toFixed(0)}`, 240, 34, fs(28), { serif: true });
    texto(g, `cruza ${(T * 100).toFixed(1)} % de la radiación que quema`, 240, 496, fs(18), { peso: 600 });
  }, 480, 520, () => s.color || "#8a5200");
  return { L, s };
}

function cizalla() {
  const s = { paso: 0, fi: 0.2, fm: 0.64 };
  const R = 17, AREA = 680 * 400, N = 190;
  const d = Array.from({ length: N }, () => ({ x: az(-100, 580), y: az(80, 440), f: az(0, TAU), a: 0, r: 0 }));
  const L = lienzo("Gotas de una emulsión que se mueven al aplicarle un esfuerzo; con más gotas se frena", (g, dt, t, fs, G) => {
    const fi = lim(s.fi, 0, s.fm - 0.005), rel = (1 - fi / s.fm) ** (-2.5 * s.fm), n = Math.min(N, Math.round((fi * AREA) / (Math.PI * R * R))), corre = 210 / rel ** 0.6;
    for (let i = 0; i < N; i++) {
      const p = d[i]; p.a = va(p.a, i < n ? 1 : 0, dt, 3); p.fuera = p.a < 0.05; if (p.fuera) continue;
      const u = (p.y - 260) / 180; let fx = u * corre, fy = Math.sin(t * 0.6 + p.f) * 4;
      for (let j = 0; j < N; j++) { const o = d[j]; if (o === p || o.a < 0.05) continue; let dx = p.x - o.x; if (dx > 350) dx -= 700; else if (dx < -350) dx += 700; const dy = p.y - o.y, q = dx * dx + dy * dy, D = 41; if (q < D * D && q > 0.5) { const h = Math.sqrt(q), k = ((D - h) / h) * 5.5; fx += dx * k; fy += dy * k; } }
      p.x += lim(fx, -340, 340) * dt; p.y += lim(fy, -200, 200) * dt + (lim(p.y, 84, 438) - p.y) * 6 * dt;
      if (p.x > 590) p.x -= 700; else if (p.x < -110) p.x += 700;
      G.gota(p.x, p.y, R * p.a * 0.97, "#ffb638", { clara: 0.45, est: 1 + lim(corre / 900, 0, 0.16) + Math.sin(t * 2 + p.f) * 0.02, giro: -0.6 });
    }
    texto(g, `${rel < 100 ? rel.toFixed(1) : rel.toFixed(0)} veces la viscosidad del medio`, 240, 34, fs(27), { serif: true });
    texto(g, `gotas: ${(s.fi * 100).toFixed(0)} % del volumen`, 240, 490, fs(19), { peso: 600 });
  }, 480, 520, () => s.color || "#3f2463");
  return { L, s };
}

function micelas() {
  const s = { paso: 0, c: 4, cmc: 8.2 };
  const N = 60, POR = 10;
  const m = Array.from({ length: N }, (_, i) => ({ x: az(30, 450), y: az(80, 440), an: az(0, TAU), f: az(0, TAU), a: 0, i }));
  const cen = Array.from({ length: 6 }, (_, i) => ({ x: 120 + (i % 3) * 120, y: 170 + Math.floor(i / 3) * 170, f: i * 2, r: 30 }));
  const L = lienzo("Tensioactivos sueltos que forman micelas cuando pasan la concentración micelar crítica", (g, dt, t, fs, G) => {
    const c = Math.max(0.01, s.c), n = Math.round(lim(c * 2, 4, N)), fm = lim(1 - s.cmc / c, 0, 1), nm = Math.min(6, Math.round((n * fm) / POR));
    cen.forEach((k, i) => { k.fuera = i >= nm; const [fx, fy] = deriva(k, t, 11), [gx, gy] = separa(cen, i, 70, 2); k.x += (fx + gx + (lim(k.x, 80, 400) - k.x) * 3) * dt; k.y += (fy + gy + (lim(k.y, 130, 400) - k.y) * 3) * dt; });
    for (const p of m) {
      p.a = va(p.a, p.i < n ? 1 : 0, dt, 3); if (p.a < 0.04) continue;
      const j = Math.floor(p.i / POR), en = j < nm;
      if (en) { const k = cen[j], an = ((p.i % POR) / POR) * TAU + t * 0.16 * (j % 2 ? 1 : -1); p.x = va(p.x, k.x + Math.cos(an) * 47, dt, 2.2); p.y = va(p.y, k.y + Math.sin(an) * 47, dt, 2.2); const me = an + Math.PI, da = Math.atan2(Math.sin(me - p.an), Math.cos(me - p.an)); p.an += da * (1 - Math.exp(-3 * dt)); }
      else { const [fx, fy] = deriva(p, t, 26), [gx, gy] = separa(m.filter((o) => o.a > 0.1 && Math.floor(o.i / POR) >= nm || o === p), m.filter((o) => o.a > 0.1 && Math.floor(o.i / POR) >= nm || o === p).indexOf(p), 46, 1.4); let ax = 0, ay = 0; for (let q = 0; q < nm; q++) { const ux = p.x - cen[q].x, uy = p.y - cen[q].y, w = Math.hypot(ux, uy) || 1; if (w < 104) { ax += (ux / w) * (104 - w) * 2; ay += (uy / w) * (104 - w) * 2; } }
        p.x += (fx + gx + ax + (lim(p.x, 26, 454) - p.x) * 3) * dt; p.y += (fy + gy + ay + (lim(p.y, 76, 440) - p.y) * 3) * dt; p.an += Math.sin(t * 0.4 + p.f) * 0.5 * dt; }
      cola(G, p.x, p.y, p.an, t, p.i, { largo: 8, paso: 4.6, r0: 4.8 * p.a, r1: 2.8 * p.a, vivo: en ? 0.4 : 1 });
      G.gota(p.x, p.y, 9.5 * p.a, "#ff9d66", { clara: 0.1 });
    }
    texto(g, c <= s.cmc ? "sueltos: aún no hay micelas" : `${(fm * 100).toFixed(0)} % en micelas`, 240, 34, fs(28), { serif: true });
    texto(g, `hay ${c.toFixed(1)} mM; la CMC es ${s.cmc.toFixed(2)} mM`, 240, 490, fs(18), { peso: 600 });
  }, 480, 520, () => s.color || "#4d5a2c");
  return { L, s };
}

function pigmento() {
  const s = { paso: 0, molienda: 0 };
  const N = 150, K = 6, cen = Array.from({ length: K }, (_, i) => ({ x: 100 + (i % 3) * 140, y: 170 + Math.floor(i / 3) * 180 }));
  const g0 = Array.from({ length: N }, (_, i) => { const c = cen[i % K], r = Math.sqrt(az(0, 1)) * 34, a = az(0, TAU); return { hx: c.x + Math.cos(a) * r, hy: c.y + Math.sin(a) * r, dx: 14 + ((i * 0.7549) % 1) * 452, dy: 74 + ((i * 0.5698) % 1) * 380, f: az(0, TAU), r: az(3.4, 6.4), col: ["#e2304f", "#c21a3b", "#f0566f", "#8e0f2a"][i % 4] }; });
  const nac = Array.from({ length: 22 }, (_, i) => ({ x: 24 + ((0.5 + i * 0.7549) % 1) * 430, y: 84 + ((0.5 + i * 0.5698) % 1) * 360, f: i * 2.4 }));
  let mo = 0, na = 0;
  const A = rgb("#5c1f3a"), B = rgb("#b0183f");
  const L = lienzo("Grumos de pigmento que se abren al moler y reparten el color", (g, dt, t, fs, G) => {
    mo = va(mo, s.molienda / 100, dt, 1.6); na = va(na, s.paso >= 3 ? 1 : 0, dt, 2);
    const k = suave(mo), sacude = 4 * k * (1 - k);
    G.base = tinte(A, B, k * 0.85);
    for (const p of g0) { const l = suave(mo * 1.5 - (Math.abs(p.f) / TAU) * 0.5); G.gota(mezcla(p.hx, p.dx, l) + Math.sin(t * (0.6 + sacude * 4) + p.f) * (3 + 9 * sacude), mezcla(p.hy, p.dy, l) + Math.cos(t * (0.5 + sacude * 4) + p.f * 2) * (3 + 9 * sacude), p.r * mezcla(1.25, 0.85, l), p.col, { clara: 0.02, brillo: 0.5, peso: 0.9 }); }
    if (na > 0.02) for (const p of nac) { const gi = p.f + t * 0.5, vira = 0.5 + 0.5 * Math.sin(t * 1.3 + p.f); G.gota(p.x + Math.sin(t * 0.4 + p.f) * 12, p.y + Math.cos(t * 0.35 + p.f) * 9, 11 * na, tinte(rgb("#ffe6f3"), rgb("#bfe4ff"), vira), { clara: 0.1, brillo: 0.6 + vira * 1.6, est: 1.9, giro: gi }); }
    texto(g, na > 0.5 ? "nacarados enteros, al final" : mo < 0.15 ? "pigmento en grumos" : mo < 0.85 ? "moliendo en aceite" : "pigmento repartido", 240, 34, fs(28), { serif: true });
  }, 480, 520);
  return { L, s };
}

function cabello() {
  const s = { paso: 0, pH: 5 };
  const PI = 3.67, SI = 22;
  const fibra = (x, k) => [x, 190 + k * 150 + (x - 240) * 0.1 + Math.sin(x * 0.012 + k) * 7];
  const sit = Array.from({ length: SI }, (_, i) => ({ k: i % 2, x: 20 + ((i * 0.618) % 1) * 440, lado: i % 4 < 2 ? -1 : 1, a: 0, i }));
  const cat = Array.from({ length: SI }, (_, i) => ({ x: sit[i].x + az(-30, 30), y: fibra(sit[i].x, sit[i].k)[1] + sit[i].lado * az(62, 78), an: az(0, TAU), f: az(0, TAU), i }));
  const L = lienzo("Dos fibras de cabello con cargas en su superficie; el acondicionador catiónico se pega a las negativas", (g, dt, t, fs, G) => {
    const neg = lim((s.pH - PI) / 3, 0, 1), pos = lim((PI - s.pH) / 1.5, 0, 1), n = Math.round(SI * neg);
    for (let k = 0; k < 2; k++) for (let j = 0; j <= 98; j++) { const x = -150 + j * 8, [, y] = fibra(x, k), esc = ((j % 9) / 9); G.gota(x, y, 31 + (1 - esc) * 4.5, j % 9 < 2 ? "#4c2c18" : "#7a4a2a", { clara: 0.06, brillo: 0.75, peso: 0.5 }); }
    const puestos = [];
    for (const q of sit) {
      q.a = va(q.a, q.i < n ? 1 : 0, dt, 3); const [x, y] = fibra(q.x, q.k), px = x, py = y + q.lado * 42; puestos.push([px, py, q.lado]);
      if (q.a > 0.05) { G.gota(px, py - q.lado * 7, 9 * q.a, "#8fe0ff", { clara: 0.1 }); g.globalAlpha = q.a; texto(g, "−", px, py - q.lado * 7, fs(17), { color: "#06324a", peso: 700, sombra: false }); g.globalAlpha = 1; }
    }
    if (pos > 0.05) for (let i = 0; i < 8; i++) { const [x, y] = fibra(40 + i * 56, i % 2); G.gota(x, y - 36, 8 * pos, "#ffd24d", { clara: 0.1 }); texto(g, "+", x, y - 36, fs(15), { color: "#3a2500", peso: 700, sombra: false }); }
    for (const p of cat) {
      const pega = sit[p.i].a > 0.5, [hx, hy, la] = puestos[p.i];
      if (pega) { p.x = va(p.x, hx, dt, 1.7); p.y = va(p.y, hy + la * 12, dt, 1.7); const me = (la * Math.PI) / 2 + Math.sin(t * 0.8 + p.f) * 0.16; p.an += Math.atan2(Math.sin(me - p.an), Math.cos(me - p.an)) * (1 - Math.exp(-3 * dt)); }
      else { const [fx, fy] = deriva(p, t, 24); let em = 0; for (let k = 0; k < 2; k++) { const dy = p.y - fibra(p.x, k)[1]; if (Math.abs(dy) < 74) em += Math.sign(dy || 1) * (74 - Math.abs(dy)) * 6; } p.x += (fx + (lim(p.x, 20, 460) - p.x) * 3) * dt; p.y += (fy + em + (lim(p.y, 70, 456) - p.y) * 3) * dt; p.an += Math.sin(t * 0.4 + p.f) * 0.5 * dt; }
      cola(G, p.x, p.y, p.an, t, p.i, { largo: 9, paso: 4.4, r0: 4.8, r1: 2.8, color: "#ffe7a0", vivo: pega ? 0.7 : 1 });
      G.gota(p.x, p.y, 9.5, "#ffc23d", { clara: 0.08 }); texto(g, "+", p.x, p.y, fs(14), { color: "#3a2500", peso: 700, sombra: false });
    }
    texto(g, Math.abs(s.pH - PI) < 0.12 ? "punto isoeléctrico" : s.pH > PI ? "fibra negativa" : "fibra positiva", 240, 34, fs(28), { serif: true });
    texto(g, `pH ${s.pH.toFixed(1)}`, 240, 490, fs(20), { peso: 600 });
  }, 480, 520, () => s.color || "#00616f");
  return { L, s };
}

function notas() {
  const s = { paso: 0, t: 0 };
  const P = [["limoneno", 1.55, "#f3e24a", 110], ["linalool", 0.16, "#b79bff", 240], ["vainillina", 1.18e-4, "#e8a45c", 370]];
  const va2 = P.map(() => 1), vap = [];
  const L = lienzo("Tres gotas de perfume que se evaporan a distinta velocidad", (g, dt, t, fs, G) => {
    P.forEach(([nom, pv, col, x], i) => {
      va2[i] = va(va2[i], 2 ** (-s.t * (pv / P[0][1])), dt, 3);
      const q = va2[i], r = 54 * Math.cbrt(Math.max(q, 0.0004));
      G.gota(x, 372 - r * 0.8, r, col, { clara: 0.5, est: 1.06 + Math.sin(t * 1.6 + i * 2) * 0.02 });
      for (let k = -2; k <= 2; k++) G.gota(x + k * r * 0.38, 376 - r * 0.2, r * 0.36, col, { clara: 0.5, peso: 0.7 });
      const ritmo = (pv / P[0][1]) * q * 11;
      if (Math.random() < ritmo * dt + (i === 2 ? 0.02 * dt : 0.12 * dt * q) && vap.length < 130) vap.push({ x: x + az(-0.5, 0.5) * r, y: 372 - r * 1.6, t: 0, f: az(0, TAU), col, v: az(34, 60), r: az(3.5, 7.5) });
      texto(g, nom, x, 416, fs(20), { peso: 600 }); texto(g, `queda ${(q * 100).toFixed(q > 0.995 ? 0 : 1)} %`, x, 444, fs(17));
      texto(g, ["salida", "corazón", "fondo"][i], x, 474, fs(19), { serif: true });
    });
    for (let i = vap.length - 1; i >= 0; i--) { const v = vap[i]; v.t += dt; v.y -= v.v * dt; v.x += Math.sin(v.y * 0.022 + v.f + t * 0.5) * 26 * dt; const l = v.t / 5.5; if (l > 1) { vap.splice(i, 1); continue; } G.gota(v.x, v.y, v.r * (1 - l) * (0.7 + l), v.col, { clara: 0.85, brillo: 0.7, est: 0.85 }); }
    texto(g, s.t < 0.05 ? "recién aplicado" : `${s.t.toFixed(1)} vidas medias del limoneno`, 240, 34, fs(28), { serif: true });
  }, 480, 520, () => s.color || "#232838");
  return { L, s };
}

function placa() {
  const s = { paso: 0, n0: 6, D: 2, dias: 0 };
  const N = 60, b = Array.from({ length: N }, (_, i) => ({ x: az(30, 450), y: az(80, 440), an: az(0, TAU), f: az(0, TAU), a: 1, i, r: 8 }));
  const L = lienzo("Bacterias que desaparecen con los días; cada una vale una décima de logaritmo", (g, dt, t, fs, G) => {
    const lg = Math.max(0, s.n0 - s.dias / Math.max(0.05, s.D)), n = Math.round(lg * 10);
    b.forEach((p, i) => {
      p.a = va(p.a, i < n ? 1 : 0, dt, 2.2); p.fuera = p.a < 0.03; if (p.fuera) return;
      p.an += Math.sin(t * 0.9 + p.f * 3) * 1.1 * dt; const nada = 15 * p.a, [gx, gy] = separa(b, i, 18, 1.6);
      p.x += (Math.cos(p.an) * nada + gx) * dt; p.y += (Math.sin(p.an) * nada + gy) * dt;
      if (p.x < 24 || p.x > 456 || p.y < 78 || p.y > 446) { p.an = Math.atan2(260 - p.y, 240 - p.x) + az(-0.5, 0.5); p.x = lim(p.x, 24, 456); p.y = lim(p.y, 78, 446); }
      const c = Math.cos(p.an), e = Math.sin(p.an), col = tinte(rgb("#6d5a4a"), rgb("#8fdc6a"), p.a);
      for (let k = -2; k <= 2; k++) { const o = Math.sin(t * 5 + k * 0.9 + p.f) * 1.4; G.gota(p.x + c * k * 5 - e * o, p.y + e * k * 5 + c * o, 7.6 * (0.35 + 0.65 * p.a), col, { clara: 0.3, peso: p.a > 0.5 ? 0.8 : 0.8 * p.a * 2 }); }
      for (let k = 1; k < 7; k++) { const o = Math.sin(t * 9 - k * 0.9 + p.f) * k * 0.9; G.gota(p.x - c * (12 + k * 4) - e * o, p.y - e * (12 + k * 4) + c * o, 2.3 * p.a, col, { clara: 0.5, peso: 0.8 }); }
    });
    texto(g, `quedan ${lg >= 3.95 ? Math.round(10 ** lg).toLocaleString("en-US").replaceAll(",", " ") : lg <= 0 ? "menos de 1" : Math.round(10 ** lg)} UFC/g`, 240, 34, fs(28), { serif: true });
    texto(g, `baja ${Math.min(s.n0, s.dias / Math.max(0.05, s.D)).toFixed(2)} log en ${s.dias.toFixed(1)} días`, 240, 490, fs(19), { peso: 600 });
  }, 480, 520, () => s.color || "#00616f");
  return { L, s };
}

function vida() {
  const s = { paso: 0, queda: 100, T: 25 };
  const N = 50, b = Array.from({ length: N }, (_, i) => ({ x: 30 + ((i * 0.7549) % 1) * 420, y: 84 + ((i * 0.5698) % 1) * 350, f: i * 2.4, a: 1, r: 9, i }));
  const OR = rgb("#ffc23d"), GA = rgb("#6b5647");
  const L = lienzo("Perlas de un activo que se gastan con el tiempo y la temperatura", (g, dt, t, fs, G) => {
    const n = Math.round((lim(s.queda, 0, 100) / 100) * N), cal = lim((s.T - 5) / 40, 0, 1);
    b.forEach((p, i) => {
      p.a = va(p.a, i < n ? 1 : 0, dt, 2); const [fx, fy] = deriva(p, t, 8 + cal * 24), [gx, gy] = separa(b, i, 22, 1.5);
      p.x += (fx + gx + (lim(p.x, 26, 454) - p.x) * 3) * dt; p.y += (fy + gy + (lim(p.y, 80, 438) - p.y) * 3) * dt;
      const j = cal * 1.6; G.gota(p.x + Math.sin(t * 31 + p.f) * j, p.y + Math.cos(t * 27 + p.f) * j, mezcla(8, 14, p.a), tinte(GA, OR, p.a), { clara: mezcla(0.05, 0.35, p.a), brillo: mezcla(0.25, 1.1, p.a) });
    });
    texto(g, `queda ${lim(s.queda, 0, 100).toFixed(1)} % del activo`, 240, 34, fs(28), { serif: true });
    texto(g, `${s.T.toFixed(0)} °C`, 240, 490, fs(20), { peso: 600 });
  }, 480, 520, () => s.color || "#9a4320");
  return { L, s };
}

function fallas() {
  const s = { paso: 0 };
  const N = 42, RU = [17, 12, 21, 14, 18, 10];
  const d = Array.from({ length: N }, (_, i) => ({ x: 30 + ((i * 0.7549) % 1) * 420, y: 84 + ((i * 0.5698) % 1) * 350, f: i * 2.4, r0: RU[i % 6], r: RU[i % 6], i }));
  const gr = Array.from({ length: 7 }, (_, i) => ({ x: 90 + (i % 3) * 150 + (i > 5 ? 150 : 0), y: 140 + Math.floor(i / 3) * 130, f: i * 1.9, r: 40 }));
  let inv = 0;
  const VI = rgb("#3f2463"), AM = rgb("#a8660f"), OR = rgb("#ffb638"), AG = rgb("#a9e2ff");
  const L = lienzo("Gotas de una emulsión estable y sus cinco fallas", (g, dt, t, fs, G) => {
    inv = va(inv, s.paso === 5 ? 1 : 0, dt, 1.4); G.base = tinte(VI, AM, inv);
    gr.forEach((k, i) => { const [fx, fy] = deriva(k, t, 10), [gx, gy] = separa(gr, i, 60, 1); k.x += (fx + gx + (lim(k.x, 80, 400) - k.x) * 2) * dt; k.y += (fy + gy + (lim(k.y, 130, 400) - k.y) * 2) * dt; });
    d.forEach((p, i) => {
      const [dx, dy] = deriva(p, t, s.paso === 1 ? 6 : 14); let fx = dx, fy = dy, meta = p.r0, [gx, gy] = separa(d, i, s.paso === 2 ? 15 : 12, s.paso === 2 ? 9 : 3.4);
      const jefe = d[i % 7], lider = i < 7;
      if (s.paso === 1) fy -= 16 + p.r0 * p.r0 * 0.16;
      if (s.paso === 2) { const k = gr[i % 7]; fx += (k.x - p.x) * 1.3; fy += (k.y - p.y) * 1.3; }
      if (s.paso === 3) { if (lider) { let v = 0; for (const o of d) if (o.i % 7 === i) v += o.dentro || o === p ? o.r0 ** 3 : 0; meta = Math.cbrt(v); } else { fx += (jefe.x - p.x) * 1.1; fy += (jefe.y - p.y) * 1.1; gx = gy = 0; p.dentro = p.dentro || Math.hypot(jefe.x - p.x, jefe.y - p.y) < jefe.r * 0.75; if (p.dentro) { meta = 0; p.x = jefe.x; p.y = jefe.y; } } }
      else p.dentro = false;
      if (s.paso === 4) { let v = 0; if (lider) { for (const o of d) if (o.i % 7 === i) v += o.r0 ** 3; meta = Math.cbrt(v); } else meta = 0; }
      p.r = va(p.r, meta, dt, s.paso === 4 ? 0.55 : 2.4); p.fuera = p.r < 0.8;
      p.x += (lim(fx + gx, -240, 240) + (lim(p.x, 26 + p.r, 454 - p.r) - p.x) * 4) * dt; p.y += (lim(fy + gy, -240, 240) + (lim(p.y, 70 + p.r, 452 - p.r) - p.y) * 4) * dt;
      G.gota(p.x, p.y, p.r, tinte(OR, AG, inv), { clara: mezcla(0.45, 0.7, inv), est: 1 + Math.sin(t * 2 + p.f) * 0.025 });
    });
    texto(g, ["estable", "cremado", "floculación", "coalescencia", "maduración de Ostwald", "inversión de fases"][s.paso] ?? "", 240, 34, fs(30), { serif: true });
  }, 480, 520);
  return { L, s };
}

export const NUEVAS = {
  piel: { nombre: "piel y agua", crear: piel, color: "#8d2a52", pie: "Esquema: las células, el agua y la película no están a escala. La película frena la fracción de gotas que pongas.", controles: [["oclusion", "Agua que frena la película", { min: 0, max: 100, paso: 1, valor: 0, unidad: "%" }]], pasos: [{ oclusion: 0 }, { oclusion: 0 }, { oclusion: 15 }, { oclusion: 80 }, {}], libre: { paso: 4 } },
  solar: { nombre: "protector y sol", crear: solar, color: "#8a5200", pie: "Cada rayo cruza con la probabilidad 1/FPS. La piel y la película son esquema.", controles: [["fps", "FPS de la etiqueta", { min: 2, max: 50, paso: 1, valor: 30 }], ["q", "Cantidad aplicada", { min: 0, max: 4, paso: 0.1, valor: 2, unidad: "mg/cm²" }]], pasos: [{ fps: 30, q: 2 }, { fps: 30, q: 1 }, { fps: 30, q: 0.5 }] },
  cizalla: { nombre: "emulsión en flujo", crear: cizalla, color: "#3f2463", pie: "El número de gotas sigue la fracción de volumen; la velocidad baja con la viscosidad calculada, en escala comprimida.", controles: [["fi", "Fracción de gotas", { min: 0, max: 0.6, paso: 0.01, valor: 0.2 }], ["fm", "Empaque máximo", { min: 0.62, max: 0.74, paso: 0.01, valor: 0.64 }]], pasos: [{ fi: 0.2 }, { fi: 0.45 }, { fi: 0.58 }] },
  micelas: { nombre: "micelas", crear: micelas, color: "#4d5a2c", pie: "Cada renacuajo vale medio mM, hasta 30 mM. Una micela real reúne decenas de moléculas; aquí se dibujan diez.", controles: [["c", "Tensioactivo", { min: 2, max: 30, paso: 0.5, valor: 4, unidad: "mM" }], ["cmc", "CMC", { min: 1, max: 10, paso: 0.01, valor: 8.2, unidad: "mM" }]], pasos: [{ c: 4, cmc: 8.2 }, { c: 20, cmc: 8.2 }, { c: 20, cmc: 1.49 }, {}] },
  pigmento: { nombre: "molienda de pigmento", crear: pigmento, color: "#5c1f3a", pie: "Esquema: los granos no están a escala.", controles: [["molienda", "Molienda", { min: 0, max: 100, paso: 1, valor: 0, unidad: "%" }]], pasos: [{ molienda: 0 }, { molienda: 50 }, { molienda: 100 }, { molienda: 100 }] },
  cabello: { nombre: "cabello y acondicionador", crear: cabello, color: "#00616f", pie: "El signo cambia en el punto isoeléctrico, pH 3.67. El número de cargas es ilustrativo.", controles: [["pH", "pH del producto", { min: 2, max: 8, paso: 0.1, valor: 5 }]], pasos: [{ pH: 5 }, { pH: 3.7 }, { pH: 7 }] },
  notas: { nombre: "notas de perfume", crear: notas, color: "#232838", pie: "El volumen de cada gota sigue su fracción restante, con rapidez proporcional a la presión de vapor a 25 °C.", controles: [["t", "Tiempo, en vidas medias del limoneno", { min: 0, max: 40, paso: 0.1, valor: 0 }]], pasos: [{ t: 0 }, { t: 3 }, { t: 25 }] },
  placa: { nombre: "recuento microbiano", crear: placa, color: "#00616f", pie: "Cada bacteria dibujada vale una décima de logaritmo.", controles: [["D", "Días por cada log", { min: 0.5, max: 10, paso: 0.1, valor: 2, unidad: "días" }], ["dias", "Tiempo", { min: 0, max: 28, paso: 0.5, valor: 0, unidad: "días" }]], pasos: [{ dias: 0 }, { dias: 7, D: 2 }], bloque: ["n0", "D", "dias"] },
  vida: { nombre: "vida útil", crear: vida, color: "#9a4320", pie: "El número de perlas doradas sigue el activo que queda; la agitación sigue la temperatura.", controles: [["queda", "Activo que queda", { min: 0, max: 100, paso: 1, valor: 100, unidad: "%" }], ["T", "Temperatura", { min: 5, max: 45, paso: 1, valor: 25, unidad: "°C" }]], pasos: [{}] },
  fallas: { nombre: "fallas de una emulsión", crear: fallas, color: "#3f2463", pie: "Esquema. En coalescencia y en Ostwald el volumen total de aceite se conserva.", controles: [], pasos: [{}, {}, {}, {}, {}, {}], bloque: ["paso"] },
};
