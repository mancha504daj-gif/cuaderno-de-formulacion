// Escenas animadas de los modelos. Cada una se mueve con la ecuación que explica.
import { h, deslizador, colorear, llenar } from "./elementos.mjs";
import { fraccionNoDisociada } from "./motor.mjs";
import { rgb } from "./gel.mjs";
import { lienzo, texto, pincelada, va, lim, mezcla, suave, TAU } from "./base.mjs";
import { NUEVAS } from "./escenas2.mjs";

/* ---------- Stokes: la tinta rodea la gota por las líneas de corriente ---------- */
function stokes() {
  const s = { paso: 2, radio: 1, visc: 0.001, delta: 79 };
  let a = 50, vel = 0, q = 0, ae = 0, ad = 0, ac = 0, carrera = 0, fase = 0;
  const CX = 240, CY = 262;
  const nueva = (todo) => ({ x: (Math.random() - 0.5) * 620, y: todo ? (Math.random() - 0.5) * 620 : 330, r: 2.2 + Math.random() ** 2 * 9, f: Math.random() * TAU });
  const tr = Array.from({ length: 34 }, () => nueva(true));
  const flujo = (x, y, U) => {
    const p = Math.max(a * 1.001, Math.hypot(x, y)), co = y / p, si = x / p, k = a / p, k3 = k ** 3;
    const ur = -U * co * (1 - 1.5 * k + 0.5 * k3), ut = U * si * (1 - 0.75 * k - 0.25 * k3);
    return [ur * si + ut * co, ur * co - ut * si];
  };
  const L = lienzo("Gota de aceite que sube; el líquido la rodea y dos trazos muestran el empuje y el arrastre", (g, dt, t, fs, G) => {
    const sg = s.delta < 0 ? -1 : 1, real = (s.radio * s.radio * Math.abs(s.delta)) / 79 / (s.visc / 0.001);
    a = va(a, lim(26 + 30 * Math.log2(1 + s.radio), 22, 104), dt);
    q = va(q, s.paso === 0 ? 0.3 : s.paso === 1 ? 0.12 : 1, dt, 1.6);
    vel = va(vel, real === 0 ? 0 : lim(70 * real ** 0.4, 1.5, 240), dt, 3);
    ae = va(ae, s.paso >= 1 ? 1 : 0, dt); ad = va(ad, s.paso >= 2 ? 1 : 0, dt); ac = va(ac, s.paso >= 3 ? 1 : 0, dt, 4);
    const U = vel * q; fase += (U / a) * dt;
    G.modo = 1; G.P = [CX, CY, a, fase]; G.Q = [ac, sg, 0, 0];
    if (ac < 0.98) {
      const ve = 1 - ac;
      for (const p of tr) {
        const [ux, uy] = flujo(p.x, p.y, U);
        p.x += (ux + Math.sin(t * 0.7 + p.f) * 3) * dt; p.y += uy * dt;
        if (p.y < -330 || Math.abs(p.x) > 330) Object.assign(p, nueva(false));
        const di = Math.hypot(p.x, p.y), lejos = a + p.r + 10; if (di < lejos) { p.x *= lejos / di; p.y *= lejos / di; }
        G.gota(CX + p.x, CY - sg * p.y, p.r * ve, "#ffdc9a", { clara: 0.75 });
      }
      const tiembla = 0.018 + Math.abs(real ? vel - lim(70 * real ** 0.4, 1.5, 240) : 0) * 0.0012;
      G.gota(CX, CY, a * mezcla(0.3, 1, ve), "#ffb638", { clara: 0.46, peso: ve, est: 1 + Math.sin(t * 2.3) * tiembla, giro: Math.sin(t * 0.6) * 0.4 });
      const F = lim(a * 1.15, 50, 120);
      g.globalAlpha = ve * ae; pincelada(g, CX, CY - sg * (a + 8), -sg * F, "#9ff5d6", t);
      texto(g, "empuje", CX + 22, CY - sg * (a + F * 0.6), fs(19), { junto: "left", color: "#b9ffe6", peso: 600 });
      g.globalAlpha = ve * ad; pincelada(g, CX, CY + sg * (a + 8), sg * F * lim(q, 0, 1), "#ffb9c8", t + 2);
      texto(g, "arrastre", CX + 22, CY + sg * (a + F * 0.6), fs(19), { junto: "left", color: "#ffd0da", peso: 600 });
      g.globalAlpha = ve; texto(g, "r", CX + a * 0.42, CY + a * 0.3, fs(Math.min(30, a * 0.6)), { color: "#4a1f00", serif: true, sombra: false });
    }
    if (ac > 0.02) { // carrera: r contra 2r, en la proporción exacta 1 a 4
      carrera = (carrera + dt / 6) % 1;
      const k = suave(carrera / 0.8), alto = 340, y0 = 436, sale = carrera > 0.93 ? 1 - (carrera - 0.93) / 0.07 : suave(carrera / 0.06);
      g.globalAlpha = ac * 0.85;
      for (let i = 0; i <= 4; i++) texto(g, String(i), 40, y0 - (alto * i) / 4, fs(17), { serif: true });
      for (const [x, r, z, n] of [[160, 23, 0.25, "r"], [325, 46, 1, "2r"]]) {
        const sube = alto * k * z, y = y0 - sube;
        for (let j = 1; j < 15; j++) { // estela de gotitas que se queda atrás
          const d = (j / 15) ** 1.2 * sube; if (d < r * 0.9) continue;
          G.gota(x + Math.sin(j * 2.4 + t * 1.6) * r * 0.36, y + d, r * 0.17 * (1 - j / 16) * ac * sale, "#ffdc9a", { clara: 0.8 });
        }
        G.gota(x + Math.sin(t * 1.4 + r) * 2, y, r * ac * sale, "#ffb638", { clara: 0.46, est: 1 - 0.05 * z * Math.sin(Math.PI * k) + Math.sin(t * 3 + x) * 0.014 });
        g.globalAlpha = ac; texto(g, n, x, y0 + 58, fs(28), { serif: true });
      }
      g.globalAlpha = 1;
    }
  }, 480, 520, () => s.color || "#3f2463");
  L.el.addEventListener("pointerdown", (ev) => {
    const [x, y] = L.punto(ev);
    if (!L.alCambiar || ev.pointerType !== "mouse" || s.paso >= 3 || Math.hypot(x - CX, y - CY) > a + 12) return;
    ev.preventDefault(); L.el.setPointerCapture(ev.pointerId);
    const mueve = (o) => { const [u, v] = L.punto(o); L.alCambiar("radio", lim(2 ** ((Math.hypot(u - CX, v - CY) - 26) / 30) - 1, 0.5, 3)); };
    const fin = () => L.el.removeEventListener("pointermove", mueve);
    L.el.addEventListener("pointermove", mueve); L.el.addEventListener("pointerup", fin, { once: true }); L.el.addEventListener("pointercancel", fin, { once: true });
  });
  return { L, s };
}

/* ---------- Ácido débil: perlas que sueltan y recuperan su protón ---------- */
function acido() {
  const s = { paso: 0, pH: 3, pKa: 4.76 }, N = 36;
  const az = (a, b) => a + Math.random() * (b - a);
  const mol = Array.from({ length: N }, (_, i) => ({ x: az(30, 450), y: az(80, 410), f: az(0, TAU), ha: true, u: 1, px: 0, py: 0, vx: 0, vy: 0, g: az(0, TAU), i }));
  for (const m of mol) { m.px = m.x; m.py = m.y; }
  let reloj = 0, ff = 1;
  const AM = rgb("#ffb03a"), AG = rgb("#8fe9ee");
  const L = lienzo("Perlas de un ácido que sueltan y recuperan su protón según el pH", (g, dt, t, fs, G) => {
    const f = fraccionNoDisociada(s.pH, s.pKa), meta = Math.round(N * f);
    ff = va(ff, f, dt, 4); reloj += dt;
    const cambia = (m) => { if (!m) return; m.ha = !m.ha; if (!m.ha) { const an = m.g; m.vx = Math.cos(an) * 80; m.vy = Math.sin(an) * 80; } };
    const si = mol.filter((m) => m.ha), no = mol.filter((m) => !m.ha), uno = (l) => l[Math.floor(Math.random() * l.length)];
    if (reloj > 0.07 && si.length !== meta) { reloj = 0; cambia(uno(si.length > meta ? si : no)); }
    else if (reloj > 0.7 && si.length && no.length) { reloj = 0; cambia(uno(si)); cambia(uno(no)); }
    for (const m of mol) {
      // corriente lenta, sin rebotes
      let fx = Math.sin(m.y * 0.016 + t * 0.42 + m.f) * 17 + Math.cos(m.y * 0.007 - t * 0.3) * 9, fy = Math.cos(m.x * 0.015 - t * 0.37 + m.f * 1.7) * 17;
      for (const o of mol) if (o !== m) { const dx = m.x - o.x, dy = m.y - o.y, d2 = dx * dx + dy * dy; if (d2 < 2300 && d2 > 1) { const k = (1 - d2 / 2300) * 46 / Math.sqrt(d2); fx += dx * k; fy += dy * k; } }
      if (L.raton) { const dx = m.x - L.raton[0], dy = m.y - L.raton[1], d2 = dx * dx + dy * dy; if (d2 < 9000) { const k = (1 - d2 / 9000) * 1.5; fx += dx * k - dy * k; fy += dy * k + dx * k; } }
      fx += (lim(m.x, 34, 446) - m.x) * 4; fy += (lim(m.y, 84, 412) - m.y) * 4;
      m.x += fx * dt; m.y += fy * dt; m.u = va(m.u, m.ha ? 1 : 0, dt, 4); m.g += dt * (0.5 + Math.sin(m.f) * 0.5);
      const tx = m.x + Math.cos(m.g) * 17, ty = m.y + Math.sin(m.g) * 17;
      if (m.ha) { m.px = va(m.px, tx, dt, 5); m.py = va(m.py, ty, dt, 5); }
      else { const wx = Math.sin(m.py * 0.02 + t * 0.9 + m.f * 3) * 34, wy = Math.cos(m.px * 0.021 - t * 0.8 + m.f * 5) * 34; m.vx = va(m.vx, wx, dt, 1.2); m.vy = va(m.vy, wy, dt, 1.2); m.px += m.vx * dt + (lim(m.px, 24, 456) - m.px) * 4 * dt; m.py += m.vy * dt + (lim(m.py, 76, 420) - m.py) * 4 * dt; }
      G.gota(m.x, m.y, mezcla(14.5, 18, m.u), AM.map((z, i) => mezcla(AG[i], z, m.u)), { clara: mezcla(0.78, 0.25, m.u), est: 1 + Math.sin(t * 1.8 + m.f) * 0.04, giro: m.f + t * 0.2 });
      G.gota(m.px, m.py, 8, "#fff6ea", { clara: 0.08 });
    }
    for (let i = 0; i <= 44; i++) { const u = i / 44, x = 70 + u * 340, en = suave((ff - u) * 22 + 0.5); G.gota(x, 452 + Math.sin(i * 0.5 + t * 1.6) * 2.2, mezcla(6, 9.5, en), AM.map((z, j) => mezcla(AG[j], z, en)), { clara: mezcla(0.7, 0.3, en) }); }
    texto(g, `HA ${(ff * 100).toFixed(1)} %`, 64, 490, fs(20), { junto: "left", color: "#ffd892", peso: 600 });
    texto(g, `A⁻ ${(100 - ff * 100).toFixed(1)} %`, 416, 490, fs(20), { junto: "right", color: "#c6f7fa", peso: 600 });
    texto(g, `pH ${s.pH.toFixed(2)}`, 240, 36, fs(32), { serif: true });
  }, 480, 520, () => s.color || "#00616f");
  return { L, s };
}

/* ---------- Saponificación y micela ---------- */
function jabon() {
  const s = { paso: 0, avance: 0 };
  let p = 0;
  const NS = 14, R = 146, MX = 240, MY = 268;
  const ruta = (k, q) => { const i = Math.min(k.length - 2, Math.floor(q)), f = suave(q - i); return k[i].map((v, j) => mezcla(v, k[i + 1][j], f)); };
  const L = lienzo("Una grasa reacciona con la lejía, suelta glicerina y deja tres jabones, que rodean una gota de grasa", (g, dt, t, fs, G) => {
    p = va(p, s.auto ? [0, 1, 2, 3, 3][Math.floor(t / 3.4) % 5] : s.avance, dt, 1.9);
    const q = lim(p, 0, 2.9999), fin = suave((p - 2.2) / 0.75), gira = t * 0.09, n = Math.min(fs(13), 15);
    const cola = (x, y, an, i) => { // cola que nada: ola que crece hacia la punta
      const c = Math.cos(an), e = Math.sin(an), vivo = mezcla(1, 0.5, fin);
      for (let i2 = 1; i2 <= 30; i2++) { const j = i2 / 2, d = j * 7.6, z = Math.sin(t * 2.1 - j * 0.42 + i * 1.7) * j * 1.15 * vivo + Math.sin(t * 0.8 + i) * j * 0.5; G.gota(x + c * d - e * z, y + e * d + c * z, mezcla(8.6, 4.6, j / 15), "#f6dc86", { clara: 0.3, peso: 0.62 }); }
    };
    const perla = (x, y, r, col, rot, tinta = "#2b3312", alfa = 1) => { G.gota(x, y, r, col, { clara: 0.08, peso: alfa }); if (rot) { g.globalAlpha = alfa; texto(g, rot, x, y + 0.5, n, { color: tinta, peso: 700, sombra: false }); g.globalAlpha = 1; } };
    if (fin > 0.02) { // grasa: masa que respira
      G.gota(MX, MY, 48 * fin, "#f0b92e", { clara: 0.4 });
      for (let j = 0; j < 7; j++) { const an = (j / 7) * TAU + Math.sin(t * 0.5 + j) * 0.3; G.gota(MX + Math.cos(an) * (27 + 5 * Math.sin(t * 1.1 + j * 2)) * fin, MY + Math.sin(an) * (27 + 5 * Math.cos(t * 0.9 + j)) * fin, 27 * fin, "#f0b92e", { clara: 0.4, peso: 0.6 }); }
    }
    const [gx, gy] = ruta([[118, 260], [118, 260], [86, 262], [62, 446]], q), abre = mezcla(94, 30, suave(p - 1));
    for (let j = 0; j <= 30; j++) { const u = j / 30 - 0.5; G.gota(gx + Math.sin(u * 5 + t * 1.3) * 5 - Math.abs(u) * 6, gy + u * 2 * abre, 10, "#a9d06a", { clara: 0.3, peso: 0.5 }); }
    for (let i = 0; i < NS; i++) {
      const th = (i / NS) * TAU + gira - Math.PI / 2, prop = i % 5 === 0 && i < 15 ? i / 5 : -1; // 0, 5 y 10 son los tres de la grasa
      const bam = Math.sin(t * 1.2 + i * 2.1) * 6;
      if (prop >= 0) {
        const y0 = 166 + prop * 94; let an1 = th + Math.PI; an1 = Math.atan2(Math.sin(an1), Math.cos(an1));
        const [x, y, an] = ruta([[146, y0, 0], [146, y0, 0], [226, 150 + prop * 114, (prop - 1) * 0.16], [MX + Math.cos(th) * (R + bam), MY + Math.sin(th) * (R + bam), an1]], q);
        if (p < 1.75) { const l = suave((p - 1) / 0.75); for (let j = 1; j < 9; j++) G.gota(mezcla(gx, x, j / 9), mezcla(gy + (prop - 1) * abre, y, j / 9), 9 * (1 - l), "#a9d06a", { clara: 0.3, peso: 0.8 }); }
        cola(x, y, an, i); perla(x, y, 16, "#ff9d66", p < 1.4 ? "" : "−", "#4a1a00");
        const na = ruta([[560 + prop * 60, y0 - 60], [182, y0 - 34], [x - 24 * Math.cos(an), y - 24 * Math.sin(an)], [x - 25 * Math.cos(an), y - 25 * Math.sin(an)]], q);
        perla(na[0] + Math.sin(t + i) * 2, na[1] + Math.cos(t * 1.2 + i) * 2, 13.5, "#ffffff", "Na");
        const oh = ruta([[610 + prop * 60, y0 + 60], [178, y0 + 34], [gx + 25, gy + (prop - 1) * 32], [gx + 25, gy + (prop - 1) * 32]], q);
        perla(oh[0] + Math.sin(t * 1.1 + i) * 2, oh[1] + Math.cos(t + i) * 2, 13.5, "#a9dcff", "OH");
      } else if (p > 2.02) { // los demás llegan nadando
        const l = suave((p - 2.05 - (i % 4) * 0.06) / 0.72), ra = mezcla(470, R + bam, l), tw = th + (1 - l) * 1.1, x = MX + Math.cos(tw) * ra, y = MY + Math.sin(tw) * ra;
        cola(x, y, tw + Math.PI, i); perla(x, y, 16, "#ff9d66", "−", "#4a1a00"); perla(x + Math.cos(tw) * 25, y + Math.sin(tw) * 25, 13.5, "#ffffff", "Na");
      }
    }
    texto(g, p < 0.6 ? "grasa" : p < 1.4 ? "llega la lejía" : p < 2.4 ? "tres jabones y glicerina" : "el jabón rodea la grasa", 240, 38, fs(29), { serif: true });
  }, 480, 520, () => s.color || "#4d5a2c");
  return { L, s };
}

/* ---------- HLB: el promedio es el punto de equilibrio ---------- */
function hlb() {
  const s = { paso: 0, a: 80, pide: 10, HA: 4.3, HB: 15, nA: "Span 80", nB: "Tween 80" };
  let ang = 0, w = 0, xa = 0.8, pide = 10, antes = 0.8, flu = 0, fase = 0;
  const X = (v) => 50 + v * 19, CA = rgb("#ffb45c"), CB = rgb("#a8e0ff"), CM = rgb("#ffe9cf");
  const L = lienzo("Balanza de gel con dos emulsionantes; el punto de apoyo marca el HLB que pide el aceite", (g, dt, t, fs, G) => {
    const { HA, HB } = s, izq = HA <= HB;
    xa = va(xa, lim(s.a, 0, 100) / 100, dt, 3); pide = va(pide, s.pide, dt, 4);
    flu = va(flu, dt > 0 ? lim((xa - antes) / Math.max(dt, 0.004), -0.5, 0.5) : 0, dt, 6); antes = xa; fase += dt * flu * 60;
    const cm = xa * HA + (1 - xa) * HB, meta = lim((cm - pide) * 0.05, -0.2, 0.2);
    w += ((meta - ang) * 30 - w * 2.6) * dt; ang += w * dt;
    const px = X(pide), py = 300, c = Math.cos(ang), e = Math.sin(ang), gi = (x, y) => [px + x * c - y * e, py + x * e + y * c];
    for (let i = 0; i <= 10; i++) { const u = i / 10; G.gota(px + Math.sin(t * 0.8 + i) * 0.8, 318 + u * 74, mezcla(12, 34, u ** 1.7), "#fff3e4", { clara: 0.3, peso: 0.85 }); }
    for (let i = 0; i <= 54; i++) { // varilla: se comba y deja pasar el material
      const u = i / 54, x = X(0) - px + u * 380, d = (u * 380) / 19, pand = -6 * Math.sin(u * Math.PI) + Math.sin(t * 2 - u * 7) * 1.4 + w * 14 * (u - 0.5) ** 2;
      const bulto = Math.max(0, Math.sin(d * 1.5 + fase)) * Math.abs(flu) * 26 * (d > Math.min(HA, HB) && d < Math.max(HA, HB) ? 1 : 0), [gx, gy] = gi(x, pand);
      const k = HA === HB ? 0.5 : lim((d - HA) / (HB - HA), 0, 1); G.gota(gx, gy, 7.4 + bulto, CM.map((z, j) => mezcla(z, mezcla(CA[j], CB[j], k), 0.45)), { clara: 0.5, peso: 0.75 });
    }
    for (const [hv, fr, col, nom] of [[HA, xa, izq ? CA : CB, s.nA], [HB, 1 - xa, izq ? CB : CA, s.nB]]) {
      const r = 12 + 62 * Math.sqrt(Math.max(0, fr)), [x, y] = gi(X(hv) - px, -r * 0.9 - 4);
      G.gota(x, y, r, col, { clara: 0.4, est: 1 + w * 0.22 + Math.sin(t * 1.9 + hv) * 0.018 + 0.03, giro: ang });
      for (let j = 0; j < 3; j++) { const [qx, qy] = gi(X(hv) - px + (j - 1) * r * 0.4, -r * 0.2); G.gota(qx, qy, r * 0.3, col, { clara: 0.4, peso: 0.6 }); }
      if (r > 30) texto(g, `${Math.round(fr * 100)} %`, x, y + 2, fs(23), { color: "#3d1503", peso: 700, sombra: false });
      if (fr > 0.02) texto(g, nom, x, y - r - 18, fs(18), { peso: 600 });
    }
    for (let v = 0; v <= 20; v += 5) texto(g, String(v), X(v), 446, fs(19), { serif: true });
    texto(g, "le gusta el aceite", X(0) - 14, 482, fs(16), { junto: "left", color: "#ffe1b8" }); texto(g, "le gusta el agua", X(20) + 14, 482, fs(16), { junto: "right", color: "#d3f0ff" });
    texto(g, Math.abs(cm - pide) < 0.12 ? `Equilibrio en HLB ${cm.toFixed(1)}` : `La mezcla da ${cm.toFixed(1)} y el aceite pide ${pide.toFixed(1)}`, 240, 38, fs(24), { serif: true });
  }, 480, 520, () => s.color || "#9a4320");
  return { L, s };
}

/* ---------- Materia activa: el tinte se difunde, el número de perlas no cambia ---------- */
function activa() {
  const s = { paso: 0, pct: 28, final: 12 };
  let hm = 0, ha = 0, mz = 0, ag = 0;
  const YB = 440, ESC = 3.1;
  const pts = Array.from({ length: 54 }, (_, i) => ({ u: (0.5 + i * 0.7549) % 1, w: (0.5 + i * 0.5698) % 1, f: i * 2.4, a: 0 }));
  const L = lienzo("Frasco con materia prima y agua; las perlas son la materia activa y su número no cambia al diluir", (g, dt, t, fs, G) => {
    const m = lim((s.final / s.pct) * 100, 0, 100), metaA = s.paso >= 1 ? (100 - m) * ESC : 0;
    hm = va(hm, m * ESC, dt, 4); ha = va(ha, metaA, dt, 1.2);
    const cae = suave((metaA - ha - 4) / 30); ag = va(ag, cae, dt, 4); mz = va(mz, s.paso >= 2 ? 1 : 0, dt, 0.75);
    const alto = hm + ha, techo = YB - alto;
    G.modo = 2; G.P = [hm, alto, mz, ag];
    if (cae > 0.02) for (let i = 0; i < 46; i++) { const u = (i / 46 + t * 0.85) % 1, y = -30 + u * (techo + 34); G.gota(240 + Math.sin(u * 8 - t * 6) * 5 * u, y, (9 - u * 3.4) * cae * (0.8 + 0.3 * Math.sin(i * 1.7)), "#cfe6ff", { clara: 0.85, est: 0.72 }); }
    if (cae > 0.1) for (let i = 0; i < 9; i++) { const u = (t * 1.3 + i * 0.37) % 1; G.gota(240 + Math.sin(i * 5.1) * 46 * u, techo + 8 + Math.sin(i * 2.2) * 40 * u + 30 * u, (3 + (i % 3)) * (1 - u), "#e6f3ff", { clara: 0.9 }); }
    const num = Math.round(s.final * 2);
    pts.forEach((p, i) => {
      p.a = va(p.a, i < num ? 1 : 0, dt, 4); if (p.a < 0.03) return;
      const z = suave(mz * 1.4 - (i % 5) * 0.09), x = 136 + p.u * 208 + Math.sin(t * 0.7 + p.f) * 10 * (1 + ag), y = YB - 20 - p.w * Math.max(0, mezcla(hm, alto, z) - 40) + Math.cos(t * 0.9 + p.f) * 6 * (1 + ag);
      G.gota(x, Math.min(YB - 14, y), 8.2 * p.a, "#fffdf6", { clara: 0.12 });
    });
    texto(g, `${m.toFixed(1)} g de materia prima`, 240, 470, fs(20), { color: "#ffd3e2", peso: 600 });
    if (s.paso >= 1) texto(g, `${(100 - m).toFixed(1)} g de agua y lo demás`, 240, 500, fs(19), { color: "#e2efff" });
    texto(g, `${s.final.toFixed(1)} g de activo`, 240, 30, fs(29), { serif: true });
  }, 480, 520, () => s.color || "#5c1f3a");
  return { L, s };
}

/* ---------- Catálogo: controles y lo que pone cada paso del relato ---------- */
export const CAT = {
  stokes: { nombre: "gota que sube", bloque: ["radio", "visc", "delta"], crear: stokes, color: "#3f2463", pie: "La tinta sigue las líneas de corriente de Stokes de una esfera. La velocidad en pantalla está comprimida; la carrera de r contra 2r guarda la proporción.", controles: [["radio", "Radio de la gota", { min: 0.5, max: 3, paso: 0.1, valor: 1, unidad: "µm" }]], pasos: [{ radio: 1 }, {}, {}, {}] },
  acido: { nombre: "ácido y protón", bloque: ["pH", "pKa"], crear: acido, color: "#00616f", pie: "Ámbar: molécula entera. Celeste: sin protón. Blanco: protón. Los protones sueltos no están a escala; en el agua hay muchos menos.", controles: [["pH", "pH", { min: 2, max: 8, paso: 0.01, valor: 3 }]], pasos: [{ pH: 3 }, { pH: 4.76 }, { pH: 5.76 }, {}] },
  jabon: { nombre: "saponificación", crear: jabon, color: "#4d5a2c", pie: "Esquema: las cadenas y la micela no están a escala.", controles: [["avance", "Avance de la reacción", { min: 0, max: 3, paso: 0.01, valor: 0 }]], pasos: [{ avance: 0 }, { avance: 1 }, { avance: 2 }, { avance: 3 }] },
  hlb: { nombre: "balanza de emulsionantes", crear: hlb, color: "#9a4320", pie: "El peso de cada gota es su fracción en la mezcla: Span 80 en HLB 4.3 y Tween 80 en HLB 15.", controles: [["a", "Span 80 en la mezcla", { min: 0, max: 100, paso: 0.1, valor: 80, unidad: "%" }], ["pide", "HLB que pide el aceite", { min: 5, max: 15, paso: 0.1, valor: 10 }]], pasos: [{ a: 80, pide: 10 }, { a: 46.7, pide: 10 }] },
  activa: { nombre: "frasco y dilución", libre: { paso: 2 }, crear: activa, color: "#5c1f3a", pie: "Cada perla vale medio gramo de materia activa, para un lote de 100 g.", controles: [["pct", "Materia activa del ingrediente", { min: 25, max: 70, paso: 1, valor: 28, unidad: "%" }], ["final", "Activo que quieres", { min: 4, max: 20, paso: 0.5, valor: 12, unidad: "%" }]], pasos: [{}, {}, {}] },
  ...NUEVAS,
};
export const ROTULOS = { radio: "radio en µm", visc: "viscosidad en Pa s", delta: "densidad del medio menos la de la gota", pH: "pH", pKa: "pKa", avance: "avance, de 0 a 3", a: "% del emulsionante A", pide: "HLB que pide el aceite", pct: "% activo de la materia prima", final: "% activo final", oclusion: "% de agua que frena", fps: "FPS", q: "cantidad en mg/cm²", fi: "fracción de gotas", fm: "empaque máximo", c: "tensioactivo en mM", cmc: "CMC en mM", molienda: "molienda en %", t: "tiempo en vidas medias", n0: "log inicial", D: "días por log", dias: "días", queda: "% que queda", T: "temperatura en °C", paso: "falla, de 0 a 5" };
export const huecos = (c) => c.bloque ?? c.controles.map((x) => x[0]);
/** Escena suelta, sin controles: la usan la ficha y la lista de laboratorios. */
export function escena(tipo, valores = {}) {
  const { L, s } = CAT[tipo].crear();
  Object.assign(s, CAT[tipo].libre ?? {}, valores);
  return { el: L.el, color: CAT[tipo].color, poner(v) { Object.assign(s, v); L.asienta(); } };
}

/** Página de modelos: la escena queda fija y el relato la va cambiando. */
export function relatos(doc = document) {
  const vistos = [];
  for (const caja of doc.querySelectorAll(".modelo[data-escena]")) {
    const c = CAT[caja.dataset.escena]; if (!c) continue;
    const { L, s } = c.crear(), ctl = {};
    caja.style.setProperty("--c", c.color);
    const alto = h("div", { class: "lamina" }, L.el), mandos = h("div", { class: "mandos" });
    for (const [k, rot, o] of c.controles) { s[k] = o.valor; ctl[k] = deslizador(rot, o, () => { const v = ctl[k].valor; if (Number.isFinite(v)) { s[k] = lim(v, o.min, o.max); L.asienta(); } }); mandos.append(ctl[k].el); }
    const pon = (k, v) => { s[k] = v; for (const i of ctl[k].el.querySelectorAll("input")) { i.value = String(Math.round(v * 100) / 100); if (i.type === "range") llenar(i); } L.asienta(); };
    L.alCambiar = pon;
    const actos = [...caja.querySelectorAll(".acto")];
    const relato = h("div", { class: "relato" });
    relato.append(...caja.childNodes);
    caja.append(h("div", { class: "escena" }, alto, mandos, h("p", { class: "pie-escena" }, c.pie)), relato);
    caja.classList.add("armado");
    const activar = (n) => {
      if (caja.dataset.paso === String(n)) return;
      caja.dataset.paso = n; s.paso = n;
      actos.forEach((a, i) => { a.classList.toggle("activo", i === n); if (i <= n) a.classList.add("visto"); });
      for (const [k, v] of Object.entries(c.pasos[n] ?? {})) pon(k, v);
      L.asienta();
    };
    vistos.push({ caja, actos, activar, color: c.color });
    activar(0);
  }
  if (!vistos.length) return;
  // El acto más cercano al centro de lectura manda en su escena; la sección manda en el color del índice.
  let pedido = false, puesto = null;
  const original = document.body.style.getPropertyValue("--color") || null;
  const mide = () => {
    pedido = false;
    let aqui = null;
    const movil = innerWidth < 992, linea = innerHeight * (movil ? 0.74 : 0.55);
    for (const x of vistos) {
      const r = x.caja.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      let n = 0;
      x.actos.forEach((a, i) => { if (a.getBoundingClientRect().top < linea) n = i; });
      x.activar(n);
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) aqui = x.color;
    }
    if (aqui !== puesto) { puesto = aqui; colorear(aqui ?? original); }
  };
  addEventListener("scroll", () => { if (!pedido) { pedido = true; requestAnimationFrame(mide); } }, { passive: true });
  addEventListener("resize", mide);
  mide();
}


export { botonPausa, quieto } from "./base.mjs";
