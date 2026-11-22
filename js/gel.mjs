// Motor de gotas en WebGL 2. Cada gota suma a un campo; donde el campo pasa de un umbral hay material,
// y por eso dos gotas cercanas se funden o se separan con un cuello, como un gel.
// Se ilumina como una foto de producto: ventana de luz, borde, refracción del fondo y sombra.
export const UMBRAL = 0.3, VISIBLE = Math.sqrt(1 - Math.sqrt(UMBRAL)); // radio que se ve, por unidad de radio de gota
const MAX = 900, PASO = 12;

const VG = `#version 300 es
layout(location=0) in vec2 q; layout(location=1) in vec4 a; layout(location=2) in vec4 b; layout(location=3) in vec4 c;
uniform vec4 uV; uniform vec2 uR; out vec2 d; flat out vec4 col; flat out vec4 mat;
void main(){ d=q; col=vec4(b.rgb,a.w); mat=vec4(a.z,b.a,c.x,c.y);
 vec2 m=q*vec2(a.z*c.z,a.z/c.z); float s=sin(c.w),k=cos(c.w); m=vec2(m.x*k-m.y*s,m.x*s+m.y*k);
 vec2 p=(a.xy+m)*uV.z+uV.xy; gl_Position=vec4(p.x/uR.x*2.-1.,1.-p.y/uR.y*2.,0,1); }`;
const FG = `#version 300 es
precision highp float; in vec2 d; flat in vec4 col; flat in vec4 mat; layout(location=0) out vec4 A; layout(location=1) out vec4 B;
void main(){ float r=dot(d,d); if(r>1.) discard; float w=1.-r; w*=w*col.a; A=vec4(col.rgb*w,w); B=vec4(mat.x*w,mat.y*w,mat.z*w,mat.w*w); }`;
const VP = `#version 300 es
layout(location=0) in vec2 q; void main(){ gl_Position=vec4(q,0,1); }`;
const FP = `#version 300 es
precision highp float; uniform sampler2D uA,uB; uniform vec2 uR; uniform vec4 uV; uniform float uT; uniform vec3 uC,uL; uniform int uM; uniform vec4 uP,uQ; uniform vec2 uRaton; out vec4 o;
float H(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float N(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.); return mix(mix(H(i),H(i+vec2(1,0)),f.x),mix(H(i+vec2(0,1)),H(i+vec2(1,1)),f.x),f.y); }
float F(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*N(p); p=mat2(1.6,1.2,-1.2,1.6)*p+7.3; a*=.5; } return s; }
vec3 seda(vec2 p){ // líquido con pliegues suaves
 vec2 q=p/300.; vec2 m=(p-uRaton)/300.; q+=m*.25*exp(-dot(m,m)*9.);
 float f=F(q*.9+vec2(uT*.035,-uT*.05)), g=F(q*.8+f*1.5+vec2(-uT*.04,uT*.03));
 float e=q.x*.8+q.y*1.1+g*2.1+f, s=.5+.5*sin(e*5.2+uT*.16), z=pow(.5+.5*sin(e*5.2+uT*.16+1.1),7.);
 vec3 c=mix(uC*.42,uC*1.12,s*.75+g*.3); c+=uL*z*(.08+.24*g); return c; }
vec3 humo(vec2 p){ // tinta que sigue las líneas de corriente de Stokes alrededor de una esfera
 vec2 x=(p-uP.xy)/uP.z; x.y*=-uQ.y; float r=max(1.0005,length(x)); float s=x.x/r*sqrt(max(0.,r*r-1.5*r+.5/r)); float l=x.y+uP.w;
 l+=.75*log(r+abs(x.y)*.0+.2)*sign(1.)*.0; float k=uP.z/50.; vec2 q=vec2(s*k,l*k);
 float f=F(vec2(q.x*1.05,q.y*.24)), g=F(vec2(q.x*2.3+f*2.2,q.y*.34+f*1.1)), w=F(vec2(q.x*5.+g*3.,q.y*.55+g*2.));
 float b=pow(1.-abs(2.*g-1.),3.), h=pow(1.-abs(2.*w-1.),5.);
 vec3 c=mix(uC*.36,uC*1.1,f*1.15); c+=uL*(b*.36+h*.3)*smoothstep(.15,.75,f+.1); c*=1.-.35*smoothstep(1.25,1.,r); return c; }
float caja(vec2 p,vec2 b,float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
vec3 fondo(vec2 p){
 if(uM==1) return mix(humo(p),seda(p),uQ.x);
 vec3 c=seda(p); if(uM!=2) return c;
 // frasco: uP = nivel de materia prima, nivel total, mezcla, agitación
 vec2 j=p-vec2(240.,262.); float d=caja(j,vec2(130.,182.),46.); float cue=caja(p-vec2(240.,74.),vec2(96.,22.),14.); d=min(d,cue); d=-log(exp(-d*.12)+exp(-cue*.12))/.12;
 if(d>0.){ c*=1.-.3*exp(-d*.05); float lz=.25+.75*pow(F(p/90.+3.),2.)*2.; c+=(uL*.5+.5)*.34*lz*smoothstep(3.2,0.,abs(d-2.)); return c; }
 float n=F(p/70.+vec2(0.,uT*.2)), ola=sin(p.x*.034+uT*1.9)*3.+sin(p.x*.071-uT*2.6)*1.8;
 float yt=444.-uP.y+ola*(1.+uP.w*2.5), yr=444.-uP.x+ola*.8;
 float borde=mix(5.,150.,uP.z)+10.; vec2 rem=p+vec2(F(p/58.+uT*.25)-.5,F(p/66.-uT*.22)-.5)*mix(16.,230.,smoothstep(0.,.7,uP.z)*(1.-.6*uP.z)+uP.w*.15);
 float tin=smoothstep(yr-borde*.5,yr+borde*.5,rem.y); tin=mix(tin,uP.x/max(uP.y,1.)*.95,smoothstep(.45,1.,uP.z));
 if(p.y>yt){ vec3 agua=c*.5+vec3(.36,.5,.66)*.62+vec3(.5,.62,.72)*pow(n,3.); vec3 pr=mix(vec3(.83,.2,.42),vec3(1.,.63,.74),n*.8+.1);
  vec3 li=mix(agua,pr,clamp(tin,0.,1.)); li*=.74+.5*n; li+=vec3(1.)*.5*exp(-abs(p.y-yt-3.)*.45); li*=mix(1.,.66,smoothstep(60.,0.,-d)*.8); c=li; }
 else c=c*.82+uL*.05;
 float lv=.2+1.5*pow(F(p/80.-2.),2.); c*=1.-.28*smoothstep(-16.,-2.,d); c+=(uL*.4+.6)*.42*lv*smoothstep(2.6,0.,abs(d+5.)); c+=vec3(.42)*smoothstep(9.,0.,abs(j.x+102.-sin(j.y*.012)*3.))*smoothstep(160.,110.,abs(j.y))*.75+vec3(.22)*smoothstep(5.,0.,abs(j.x-108.))*smoothstep(150.,80.,abs(j.y));
 return c; }
float alt(float w){ float z=max(0.,w-${UMBRAL.toFixed(2)}); return sqrt(z/(z+.42)); }
void main(){
 vec2 u=gl_FragCoord.xy/uR, p=(vec2(gl_FragCoord.x,uR.y-gl_FragCoord.y)-uV.xy)/uV.z; vec2 px=1.4*uV.z/uR;
 vec4 A=texture(uA,u); vec3 c=fondo(p);
 // sombra y luz que atraviesa la gota
 vec2 so=vec2(-12.,17.)*uV.z/uR; float sh=0.; vec4 sc=vec4(0);
 for(int i=0;i<6;i++){ float an=float(i)*1.047; vec4 z=texture(uA,u+so+vec2(cos(an),sin(an))*9.*uV.z/uR); sh+=z.a; sc+=z; }
 sh=smoothstep(.1,.75,sh/6.); c*=1.-.42*sh; c+=(sc.rgb/max(sc.a,.001))*.13*smoothstep(.45,1.,sh);
 float m=smoothstep(${(UMBRAL - 0.035).toFixed(3)},${(UMBRAL + 0.035).toFixed(3)},A.a);
 if(m>.001){
  vec4 B=texture(uB,u)/max(A.a,.001); vec3 k=A.rgb/max(A.a,.001);
  float hx=alt(texture(uA,u+vec2(px.x,0)).a)-alt(texture(uA,u-vec2(px.x,0)).a), hy=alt(texture(uA,u+vec2(0,px.y)).a)-alt(texture(uA,u-vec2(0,px.y)).a);
  vec3 n=normalize(vec3(-vec2(hx,hy)/2.8*B.x*.62,.62)); float fr=pow(1.-n.z,2.6);
  vec3 tras=fondo(p+vec2(-n.x,n.y)*B.x*.62); vec3 R=reflect(vec3(0,0,-1),n);
  float dif=.5+.5*dot(n,normalize(vec3(-.5,.62,.6)));
  vec3 cu=mix(k*(.34+.8*dif),tras*(k*.85+.25)+k*.16,B.z); // B.z: transparencia
  cu+=k*.55*smoothstep(.15,.95,dot(n.xy,normalize(vec2(.55,-.75))))*(1.-fr*.6)*(.35+.65*B.z); // luz que sale por el lado contrario
  cu=mix(cu,uC*.35+k*.35,fr*.4); cu+=(uL*.6+.4)*fr*.55;
  cu+=.13*fr*cos(6.283*(fr*1.1+vec3(0.,.33,.67)+uT*.02));
  vec2 v=R.xy-vec2(-.5,.56); v.x+=v.y*.25; float ven=smoothstep(.17,.1,abs(v.x))*smoothstep(.2,.12,abs(v.y)); ven*=1.-.55*smoothstep(.022,.01,abs(v.x));
  float tira=smoothstep(.1,.02,abs(R.x-.72))*smoothstep(.55,.1,abs(R.y+.1)); cu+=B.y*(vec3(1.)*ven*.85+vec3(.5)*tira*.6);
  c=mix(c,cu,m); }
 float vi=length((u-.5)*vec2(1.05,.95)); c*=1.06-.5*vi*vi; c+=(H(gl_FragCoord.xy+fract(uT)*61.)-.5)*.018; o=vec4(c,1); }`;

const compila = (gl, v, f) => {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, v], [gl.FRAGMENT_SHADER, f]]) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); gl.attachShader(p, x); }
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
};
const rgb = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const cache = new Map(), color = (c) => { if (Array.isArray(c)) return c; let v = cache.get(c); if (!v) cache.set(c, (v = rgb(c))); return v; };

export class Gel {
  constructor(lienzo) {
    this.lienzo = lienzo; this.n = 0; this.datos = new Float32Array(MAX * PASO); this.modo = 0; this.P = [0, 0, 1, 0]; this.Q = [0, 1, 0, 0]; this.raton = [-999, -999]; this.base = [0.1, 0.15, 0.6];
    this.prepara();
    lienzo.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.gl = null; });
    lienzo.addEventListener("webglcontextrestored", () => { this.prepara(); this.tam = null; });
  }
  prepara() {
    const gl = this.lienzo.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;
    try {
      const fl = gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float");
      this.fmt = fl ? [gl.RGBA16F, gl.HALF_FLOAT] : null;
      if (!this.fmt) return;
      this.pg = compila(gl, VG, FG); this.pp = compila(gl, VP, FP);
      this.u = (p, ...k) => Object.fromEntries(k.map((x) => [x, gl.getUniformLocation(p, x)]));
      this.ug = this.u(this.pg, "uV", "uR"); this.up = this.u(this.pp, "uA", "uB", "uR", "uV", "uT", "uC", "uL", "uM", "uP", "uQ", "uRaton");
      const q = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.va = gl.createVertexArray(); gl.bindVertexArray(this.va); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.bi = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.bi); gl.bufferData(gl.ARRAY_BUFFER, this.datos.byteLength, gl.DYNAMIC_DRAW);
      for (let i = 0; i < 3; i++) { gl.enableVertexAttribArray(1 + i); gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, PASO * 4, i * 16); gl.vertexAttribDivisor(1 + i, 1); }
      this.gl = gl;
    } catch (e) { console.warn("Sin motor de gotas:", e.message); this.gl = null; }
  }
  /** Gota en coordenadas de la escena. `r` es el radio que se ve. */
  gota(x, y, r, c, { peso = 1, brillo = 1, clara = 0.35, est = 1, giro = 0 } = {}) {
    if (this.n >= MAX || peso <= 0.01 || r <= 0.2) return;
    const k = color(c), R = r / VISIBLE;
    this.datos.set([x, y, R, peso, k[0], k[1], k[2], brillo, clara, 0, est, giro], this.n++ * PASO);
  }
  suelta() { this.gl?.getExtension("WEBGL_lose_context")?.loseContext(); this.gl = null; }
  tam2(W, H) {
    const gl = this.gl; if (this.tam === `${W},${H}`) return; this.tam = `${W},${H}`;
    this.fw = Math.max(2, Math.round(W * 0.66)); this.fh = Math.max(2, Math.round(H * 0.66));
    if (this.tx) this.tx.forEach((t) => gl.deleteTexture(t)); if (this.fb) gl.deleteFramebuffer(this.fb);
    this.fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    this.tx = [0, 1].map((i) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, this.fmt[0], this.fw, this.fh, 0, gl.RGBA, this.fmt[1], null); for (const [a, b] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, a, b); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); return t; });
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  }
  dibuja(t, ox, oy, k) {
    const gl = this.gl, W = this.lienzo.width, H = this.lienzo.height; if (!gl || !W || !H) { this.n = 0; return false; }
    this.tam2(W, H); gl.bindVertexArray(this.va); gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.viewport(0, 0, this.fw, this.fh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.n) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bi); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.datos, 0, this.n * PASO);
      gl.useProgram(this.pg); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.uniform4f(this.ug.uV, ox, oy, k, 0); gl.uniform2f(this.ug.uR, W, H);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n); gl.disable(gl.BLEND);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(this.pp);
    this.tx.forEach((x, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, x); });
    const u = this.up, c = this.base, m = Math.max(...c), luz = c.map((x) => Math.min(1, 0.5 + 0.5 * (x / m)));
    gl.uniform1i(u.uA, 0); gl.uniform1i(u.uB, 1); gl.uniform2f(u.uR, W, H); gl.uniform4f(u.uV, ox, oy, k, 0); gl.uniform1f(u.uT, t % 900); gl.uniform3fv(u.uC, c); gl.uniform3fv(u.uL, luz); gl.uniform1i(u.uM, this.modo); gl.uniform4fv(u.uP, this.P); gl.uniform4fv(u.uQ, this.Q); gl.uniform2fv(u.uRaton, this.raton);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); this.n = 0;
    return true;
  }
}
export { rgb };
