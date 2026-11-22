const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";

export function probeta() {
  const cv = document.createElement("canvas");
  cv.width = 440; cv.height = 760; cv.className = "vaso";
  cv.setAttribute("role", "img");
  cv.setAttribute("aria-label", "Probeta de 100 mm con la emulsión");
  const c = cv.getContext("2d"), alto = 650, y0 = 60;
  const azar = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const gotas = Array.from({ length: 340 }, (_, i) => ({ x: 60 + azar(i, 1) * 320, y: azar(i, 2), r: 3 + azar(i, 3) * 4 }));
  let ahora = 0, fin = 0, id = 0;
  function pinta() {
    const color = getComputedStyle(cv).getPropertyValue("--color").trim() || "#b3245c", s = Math.sign(ahora), m = Math.min(1, Math.abs(ahora) / 100), capa = 0.26 * m;
    c.clearRect(0, 0, 440, 760);
    c.globalAlpha = 0.1; c.fillStyle = color; c.fillRect(40, y0, 360, alto);
    c.globalAlpha = 0.28; c.fillRect(40, s < 0 ? y0 + alto * (1 - capa) : y0, 360, alto * capa);
    c.globalAlpha = 0.85;
    for (const g of gotas) {
      const y = s < 0 ? Math.min(1 - (1 - g.y) * capa, g.y + m) : Math.max(g.y * capa, g.y - m);
      c.beginPath(); c.arc(g.x, y0 + 8 + y * (alto - 16), g.r, 0, 7); c.fill();
    }
    c.globalAlpha = 1; c.strokeStyle = "#15171f"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(40, 25); c.lineTo(40, y0 + alto); c.lineTo(400, y0 + alto); c.lineTo(400, 25); c.stroke();
    c.lineWidth = 2;
    for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(400, y0 + i * 65); c.lineTo(i % 5 ? 382 : 364, y0 + i * 65); c.stroke(); }
  }
  function paso() {
    ahora += (fin - ahora) * 0.14;
    if (Math.abs(fin - ahora) < 0.05) ahora = fin;
    pinta();
    id = ahora === fin ? 0 : requestAnimationFrame(paso);
  }
  return { el: cv, mover(mm) {
    fin = Math.max(-100, Math.min(100, Number.isFinite(mm) ? mm : 0));
    if (quieto()) { ahora = fin; pinta(); } else if (!id) id = requestAnimationFrame(paso);
  } };
}

export function curva({ x0, x1, actual, rotuloX, rotuloY, fn }) {
  const g = document.createElementNS(NS, "svg"), P = [];
  for (let i = 0; i <= 100; i++) { const x = x0 + (i / 100) * (x1 - x0); let y; try { y = fn(x); } catch { continue; } if (Number.isFinite(y)) P.push([x, y]); }
  if (P.length < 2 || x1 <= x0) throw new Error("La curva no tiene valores que dibujar.");
  let a = Math.min(...P.map((p) => p[1])), b = Math.max(...P.map((p) => p[1]));
  if (a === b) { a -= 1; b += 1; }
  const X = (x) => 62 + ((x - x0) / (x1 - x0)) * 400, Y = (y) => 214 - ((y - a) / (b - a)) * 176, cifra = (v) => (Math.abs(v) >= 1e4 || (v !== 0 && Math.abs(v) < 0.01) ? v.toExponential(1) : String(Math.round(v * 100) / 100));
  g.setAttribute("viewBox", "0 0 480 262"); g.setAttribute("role", "img"); g.setAttribute("class", "grafica");
  const add = (t, at, txt) => { const e = document.createElementNS(NS, t); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; g.append(e); };
  add("path", { d: "M62 34V214H466", class: "eje" });
  for (let i = 0; i <= 4; i++) add("text", { x: X(x0 + (i / 4) * (x1 - x0)), y: 234, "text-anchor": "middle" }, cifra(x0 + (i / 4) * (x1 - x0)));
  add("text", { x: 56, y: 218, "text-anchor": "end" }, cifra(a)); add("text", { x: 56, y: 42, "text-anchor": "end" }, cifra(b));
  add("text", { x: 264, y: 256, "text-anchor": "middle" }, rotuloX); add("text", { x: 62, y: 20 }, rotuloY);
  add("path", { d: P.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(""), class: "curva" });
  try { const y = fn(actual); if (Number.isFinite(y) && actual >= x0 && actual <= x1) { add("circle", { cx: X(actual), cy: Y(y), r: 7, class: "punto" }); g.setAttribute("aria-label", `${rotuloY}: ${cifra(y)} cuando ${rotuloX} es ${cifra(actual)}`); } } catch { }
  return g;
}
