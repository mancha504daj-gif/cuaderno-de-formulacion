// El fondo del sitio: una crema que se mueve despacio y el índice como un vertido de bordes vivos.
// Un solo lienzo fijo, a media resolución y 30 cuadros por segundo.
import { quieto, registrar } from "./base.mjs";
import { rgb } from "./gel.mjs";

const V = `#version 300 es
in vec2 q; void main(){ gl_Position=vec4(q,0,1); }`;
const F = `#version 300 es
precision highp float; uniform vec2 uR; uniform float uT,uX,uS,uK; uniform vec3 uB,uC; uniform vec2 uM; uniform vec3 uG[4]; out vec4 o;
float H(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float N(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.); return mix(mix(H(i),H(i+vec2(1,0)),f.x),mix(H(i+vec2(0,1)),H(i+vec2(1,1)),f.x),f.y); }
float B(vec2 p){ float s=0.,a=.5; for(int i=0;i<3;i++){ s+=a*N(p); p=mat2(1.6,1.2,-1.2,1.6)*p+7.3; a*=.5; } return s; }
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float forma(vec2 p){ // distancia al vertido del índice: ondas, abombado junto al puntero y gotas que se desprenden
 float y=p.y, e=uX+7.+7.*sin(y*.0085+uT*.55)+5.*sin(y*.019-uT*.8)+uS*15.*sin(y*.012+uT*2.6);
 e+=30.*exp(-pow((y-uM.y)/84.,2.))*smoothstep(190.,0.,abs(uM.x-uX));
 float d=p.x-e; for(int i=0;i<4;i++) d=smin(d,length((p-uG[i].xy)*vec2(1.,.9))-uG[i].z,26.); return d; }
void main(){
 vec2 p=vec2(gl_FragCoord.x,uR.y-gl_FragCoord.y)*uK; vec2 q=p/430.; vec2 m=(p-uM)/210.; q+=m*.22*exp(-dot(m,m)*2.2);
 float f=B(q*.8+vec2(uT*.02,-uT*.03)), g=B(q*.75+f*1.5+vec2(-uT*.025,uT*.02)); float e=q.x*.7+q.y*.9+g*2.2+f;
 float s=.5+.5*sin(e*4.2+uT*.1), z=pow(.5+.5*sin(e*4.2+uT*.1+1.1),6.);
 vec3 pag=mix(vec3(1.),mix(vec3(1.),uC,.085),s*.8+g*.2); pag+=.03*z; pag=min(pag,1.); pag=mix(pag,vec3(1.,.985,.99),.35);
 vec3 c=pag;
 if(uX>1.){
  float d=forma(p); float luz=dot(uB,vec3(.3,.6,.1));
  c*=1.-.17*exp(-max(d,0.)/17.)*step(0.,d)*smoothstep(-2.,10.,p.x);
  if(d<1.5){
   vec3 cr=luz>.6?mix(uB*vec3(.955,.93,.945),mix(uB,vec3(1.),.42),s):mix(uB*.74,uB*1.12+.025,s); cr+=z*(luz>.6?.05:.07);
   vec2 n=vec2(forma(p+vec2(1.5,0.))-d,forma(p+vec2(0.,1.5))-d)/1.5; float r=smoothstep(-34.,0.,d);
   cr*=1.-.2*r*r*max(0.,dot(n,vec2(.75,.65))); cr+=exp(-pow((d+10.)/5.,2.))*(.28+.3*max(0.,dot(n,vec2(.6,-.8))))*(luz>.6?1.:.62);
   cr+=exp(-pow((d+2.)/2.2,2.))*.16; c=mix(cr,c,smoothstep(-1.,1.2,d)); }
 }
 c+=(H(gl_FragCoord.xy)-.5)*.008; o=vec4(c,1); }`;

export function crema() {
  const cv = document.createElement("canvas"); cv.id = "crema"; cv.setAttribute("aria-hidden", "true");
  const gl = cv.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "low-power" }); if (!gl) return;
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, V], [gl.FRAGMENT_SHADER, F]]) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(x)); return; } gl.attachShader(p, x); }
  gl.linkProgram(p); gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.bindAttribLocation(p, 0, "q"); gl.vertexAttribPointer(gl.getAttribLocation(p, "q"), 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(p, n), U = { R: u("uR"), T: u("uT"), X: u("uX"), S: u("uS"), K: u("uK"), B: u("uB"), C: u("uC"), M: u("uM"), G: u("uG") };
  document.body.prepend(cv); document.documentElement.classList.add("con-crema");
  const barra = document.getElementById("quarto-sidebar"), K = 2, col = { b: [1, 0.8, 0.85], c: [0.7, 0.14, 0.36] };
  let W = 0, H = 0, t = Math.random() * 60, antes = 0, id = 0, mx = -999, my = -999, sx = -999, sy = -999, sv = 0, ultimo = scrollY, barraColor = "";
  const got = [0, 1, 2, 3].map((i) => ({ y: 0, v: 14 + i * 7, r: 0, x: 0, f: i * 1.9, vida: i * 0.25 }));
  const talla = () => { W = innerWidth; H = innerHeight; cv.width = Math.ceil(W / K); cv.height = Math.ceil(H / K); gl.viewport(0, 0, cv.width, cv.height); };
  const aRgb = (v, d) => (/^#[0-9a-f]{6}$/i.test(v) ? rgb(v) : d);
  const cuadro = (dt) => {
    t += dt;
    const es = getComputedStyle(document.body), mb = aRgb(es.getPropertyValue("--barra").trim(), col.b), mc = aRgb(es.getPropertyValue("--color").trim(), col.c), k = barraColor ? 1 - Math.exp(-dt * 4) : 1; barraColor = "si";
    for (let i = 0; i < 3; i++) { col.b[i] += (mb[i] - col.b[i]) * k; col.c[i] += (mc[i] - col.c[i]) * k; }
    const ver = barra && innerWidth >= 992 && getComputedStyle(barra).display !== "none", X = ver ? barra.getBoundingClientRect().right : 0;
    sx += (mx - sx) * (1 - Math.exp(-dt * 7)); sy += (my - sy) * (1 - Math.exp(-dt * 7));
    const dv = Math.min(1, Math.abs(scrollY - ultimo) / 70); ultimo = scrollY; sv += (dv - sv) * (1 - Math.exp(-dt * (dv > sv ? 9 : 2)));
    const G = new Float32Array(12);
    got.forEach((g, i) => { // asoma, se estira y vuelve a la crema
      g.vida += dt / (9 + i * 2.3); const l = g.vida % 1, a = Math.sin(Math.PI * l); G[i * 3] = X + 2 + a * (17 + i * 5); G[i * 3 + 1] = ((i * 0.618 + Math.floor(g.vida) * 0.37) % 1) * H + l * 90; G[i * 3 + 2] = X > 1 ? 5 + a * (7 + i * 2) : 0;
    });
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.K, K); gl.uniform1f(U.T, t); gl.uniform1f(U.X, X); gl.uniform1f(U.S, sv); gl.uniform3fv(U.B, col.b); gl.uniform3fv(U.C, col.c); gl.uniform2f(U.M, sx, sy); gl.uniform3fv(U.G, G);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const bucle = (ms) => { id = 0; if (quieto() || document.hidden) return; id = requestAnimationFrame(bucle); if (ms - antes < 31) return; cuadro(Math.min(0.1, (ms - antes) / 1000)); antes = ms; };
  const yo = { arranca() { if (quieto()) { cuadro(1); } else if (!id) id = requestAnimationFrame(bucle); } };
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; if (sx < -900) { sx = mx; sy = my; } }, { passive: true });
  addEventListener("resize", () => { talla(); cuadro(0.001); });
  document.addEventListener("visibilitychange", () => yo.arranca());
  cv.addEventListener("webglcontextlost", () => { cv.remove(); document.documentElement.classList.remove("con-crema"); });
  registrar(yo); talla(); cuadro(0.001); yo.arranca();
}

/* ---------- Portada: las fotos se funden como líquidos ---------- */
const FP = `#version 300 es
precision highp float; uniform sampler2D a,b; uniform vec2 uR,uA,uBt,uM; uniform float uT,uP; out vec4 o;
float H(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float N(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.); return mix(mix(H(i),H(i+vec2(1,0)),f.x),mix(H(i+vec2(0,1)),H(i+vec2(1,1)),f.x),f.y); }
float B(vec2 p){ float s=0.,k=.5; for(int i=0;i<4;i++){ s+=k*N(p); p=mat2(1.6,1.2,-1.2,1.6)*p+3.1; k*=.5; } return s; }
vec2 cubre(vec2 u,vec2 t){ float r=uR.x/uR.y,q=t.x/t.y; return r>q?vec2(u.x,(u.y-.5)*q/r+.5):vec2((u.x-.5)*r/q+.5,u.y); }
void main(){ vec2 u=gl_FragCoord.xy/uR; vec2 s=u*vec2(uR.x/uR.y,1.); float n=B(s*1.9+vec2(uT*.03,0.)), n2=B(s*2.6+n*1.6-vec2(0.,uT*.04));
 vec2 w=(vec2(n,n2)-.5)*.02; vec2 m=u-uM; w+=m*.1*exp(-dot(m,m)*26.);
 float campo=n2*.75+n*.35+length((u-uM)*vec2(uR.x/uR.y,1.))*.34; float k=uP*1.75-.25; float d=campo-k; float frente=exp(-pow(d/.07,2.))*step(.001,uP)*step(uP,.999);
 vec2 g=vec2(dFdx(campo),dFdy(campo))*uR.y*.05; float paso=smoothstep(.035,-.035,d);
 vec3 A=texture(a,cubre(u+w+g*frente*.6,uA)).rgb, C=texture(b,cubre(u+w-g*frente*.6+ (1.-uP)*.03*(vec2(n,n2)-.5),uBt)).rgb;
 vec3 c=mix(A,C,paso); c+=frente*(.22+.5*pow(max(0.,dot(normalize(g+1e-4),normalize(vec2(-.5,.8)))),3.)); o=vec4(c,1); }`;
export function portadaLiquida(portada) {
  const fondo = portada.querySelector(".fondo"), imgs = [...fondo.querySelectorAll("img")], cv = document.createElement("canvas"), gl = cv.getContext("webgl2", { alpha: false, antialias: false });
  if (!gl) return;
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, V], [gl.FRAGMENT_SHADER, FP]]) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(x)); return; } gl.attachShader(p, x); }
  gl.linkProgram(p); gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); const loc = gl.getAttribLocation(p, "q"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(p, n), U = { R: u("uR"), A: u("uA"), B: u("uBt"), M: u("uM"), T: u("uT"), P: u("uP"), a: u("a"), b: u("b") }, tex = new Map();
  const textura = async (im) => {
    if (tex.has(im)) return tex.get(im);
    im.loading = "eager"; await im.decode(); const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const r = { t, w: im.naturalWidth, h: im.naturalHeight }; tex.set(im, r); return r;
  };
  let A = null, B = null, P = 1, t = 0, antes = 0, id = 0, ve = true, m = [0.5, 0.5], sm = [0.5, 0.5], solo = 0;
  const pinta = (dt) => {
    t += dt; P = Math.min(1, P + dt / 1.5); sm = sm.map((v, i) => v + (m[i] - v) * (1 - Math.exp(-dt * 4)));
    const k = Math.min(1, 1500 / Math.max(1, fondo.clientWidth)), w = Math.round(fondo.clientWidth * k), h = Math.round(fondo.clientHeight * k); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    if (!A || !B) return;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, B.t);
    gl.uniform1i(U.a, 0); gl.uniform1i(U.b, 1); gl.uniform2f(U.R, w, h); gl.uniform2f(U.A, A.w, A.h); gl.uniform2f(U.B, B.w, B.h); gl.uniform2f(U.M, sm[0], sm[1]); gl.uniform1f(U.T, t); gl.uniform1f(U.P, P * P * (3 - 2 * P)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const bucle = (ms) => { id = 0; if (quieto() || !ve) return; id = requestAnimationFrame(bucle); pinta(Math.min(0.05, Math.max(0.001, (ms - antes) / 1000))); antes = ms; solo += 0.016; };
  const yo = { arranca() { if (quieto()) pinta(3); else if (!id && ve) { antes = performance.now(); id = requestAnimationFrame(bucle); } } };
  let turno = 0;
  const va = async (de) => { const im = imgs.find((i) => i.dataset.de === de); if (!im) return; const n = ++turno, x = await textura(im); if (n !== turno || x === B) return; A = B ?? x; B = x; P = A === B ? 1 : 0; yo.arranca(); };
  portada.addEventListener("pointermove", (e) => { const r = fondo.getBoundingClientRect(); m = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; }, { passive: true });
  const enlaces = [...portada.querySelectorAll("ol a")]; let i = 3, libre = true;
  for (const a of enlaces) for (const ev of ["pointerenter", "focus"]) a.addEventListener(ev, () => { libre = false; va(a.dataset.de); });
  portada.querySelector("ol").addEventListener("pointerleave", () => { libre = true; });
  setInterval(() => { if (libre && !quieto() && ve && !document.hidden) { i = (i + 1) % enlaces.length; va(enlaces[i].dataset.de); } }, 5200);
  new IntersectionObserver((es) => { ve = es.at(-1).isIntersecting; yo.arranca(); }).observe(portada);
  registrar(yo);
  va((imgs.find((x) => x.classList.contains("ve")) ?? imgs[0]).dataset.de).then(() => { fondo.prepend(cv); fondo.classList.add("liquido"); });
}

/** La gota que marca la página en el índice y sigue al puntero. */
export function gotaIndice() {
  const b = document.getElementById("quarto-sidebar"); if (!b) return;
  const g = document.createElement("i"); g.className = "gota-indice"; g.setAttribute("aria-hidden", "true");
  const menu = b.querySelector(".sidebar-menu-container") ?? b, lista = [...menu.querySelectorAll(".sidebar-link")], act = menu.querySelector(".sidebar-link.active");
  menu.style.position = "relative"; menu.prepend(g);
  const va = (a) => { g.style.opacity = a ? 1 : 0; if (!a) return; const r = a.getBoundingClientRect(), m = menu.getBoundingClientRect(); g.style.setProperty("--y", `${r.top - m.top + menu.scrollTop}px`); g.style.height = `${r.height}px`; };
  for (const a of lista) { a.addEventListener("pointerenter", () => va(a)); a.addEventListener("focus", () => va(a)); }
  menu.addEventListener("pointerleave", () => va(act)); requestAnimationFrame(() => va(act));
}
