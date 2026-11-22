import { fusiona, adopta, valida, llave, LIMITE } from "./fusion.mjs";
import { CONFIG } from "./configuracion.mjs";

const SDK = "https://www.gstatic.com/firebasejs/12.6.0/";
const ACT = "cuaderno:activo", oyentes = new Set();
let uid = null, memoria = null, nube = null, usuario = null, estado = "local", espera = null, corriendo = null;
const leeLS = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const ponLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const caja = (u = uid) => `cuaderno:${u ?? "invitado"}`;
const avisa = () => { for (const f of oyentes) f({ usuario, estado }); };
export const alCambiar = (f) => { oyentes.add(f); f({ usuario, estado }); return () => oyentes.delete(f); };
export const hayNube = () => !!CONFIG;
export const quien = () => usuario;

function migra() {
  if (leeLS("cuaderno:migrado")) return;
  const l = leeLS("cuaderno:invitado") ?? [], t = Date.now(), pon = (tipo, id, datos) => { if (datos != null) l.push({ tipo, id, datos, cambio: t, borrado: false }); };
  for (const e of leeLS("cuaderno-ensayos") ?? []) pon("ensayo", e.id, e);
  for (const r of leeLS("cuaderno-recetas") ?? []) pon("receta", r.id, r);
  const av = leeLS("cuaderno-avance"); if (Array.isArray(av)) pon("avance", "camino", av);
  const lab = leeLS("cuaderno-lab"); if (lab) pon("laboratorio", "borrador", lab);
  try { for (const k of Object.keys(localStorage)) { const m = k.match(/^cuaderno-asp-(.+)$/); if (m) { const d = leeLS(k); if (d?.pagina) pon("aspecto", d.pagina, d); } } } catch { }
  ponLS("cuaderno:invitado", l.filter(valida)); ponLS("cuaderno:migrado", true);
}
const todo = () => (memoria ??= (leeLS(caja()) ?? []).filter(valida));
const salva = () => ponLS(caja(), memoria);

export function lista(tipo) { return todo().filter((c) => c.tipo === tipo && !c.borrado).sort((a, b) => b.cambio - a.cambio).map((c) => c.datos); }
export function uno(tipo, id) { return todo().find((c) => c.tipo === tipo && c.id === id && !c.borrado)?.datos ?? null; }
export function guarda(tipo, id, datos) {
  const c = { tipo, id, datos, cambio: Math.max(Date.now(), (todo().find((x) => x.tipo === tipo && x.id === id)?.cambio ?? 0) + 1), borrado: false };
  if (!valida(c) || JSON.stringify(datos).length > LIMITE) return false;
  memoria = [c, ...todo().filter((x) => llave(x) !== llave(c))];
  const ok = salva(); programa();
  return ok;
}
export function borra(tipo, id) {
  const x = todo().find((y) => y.tipo === tipo && y.id === id); if (!x) return;
  memoria = [{ tipo, id, datos: null, cambio: Math.max(Date.now(), x.cambio + 1), borrado: true }, ...todo().filter((y) => y !== x)];
  salva(); programa();
}
function programa() { if (!usuario) return; estado = "por subir"; avisa(); clearTimeout(espera); espera = setTimeout(sincroniza, 1500); }

async function conecta() {
  if (!CONFIG) return null;
  return (nube ??= (async () => {
    const [A, U, F] = await Promise.all([import(`${SDK}firebase-app.js`), import(`${SDK}firebase-auth.js`), import(`${SDK}firebase-firestore-lite.js`)]);
    const app = A.initializeApp(CONFIG), auth = U.initializeAuth(app, { persistence: [U.indexedDBLocalPersistence, U.browserLocalPersistence], popupRedirectResolver: U.browserPopupRedirectResolver });
    auth.languageCode = "es";
    return { U, F, auth, db: F.getFirestore(app) };
  })().catch((e) => { nube = null; throw e; }));
}

export async function sincroniza() {
  if (!usuario) return;
  if (corriendo) { await corriendo; return sincroniza2(); }
  return sincroniza2();
}
function sincroniza2() {
  const yo = usuario?.uid;
  return (corriendo ??= (async () => {
    estado = "sincronizando"; avisa();
    try {
      const { F, db } = await conecta(), col = F.collection(db, "usuarios", yo, "cosas"), antes = new Map(todo().map((c) => [llave(c), c.cambio]));
      const r = (await F.getDocs(col)).docs.map((d) => { const x = d.data(); try { return { tipo: x.tipo, id: x.id, datos: JSON.parse(x.datos), cambio: x.cambio, borrado: x.borrado }; } catch { return null; } });
      if (usuario?.uid !== yo) return;
      const { todo: T, subir } = fusiona(todo(), r.filter(Boolean));
      memoria = T; salva();
      let b = null, n = 0, peso = 0;
      const manda = async () => { if (b) { await b.commit(); b = null; n = 0; peso = 0; } };
      for (const c of subir) {
        const datos = JSON.stringify(c.datos ?? null);
        if (n >= 200 || peso + datos.length > 2000000) await manda();
        b ??= F.writeBatch(db); n++; peso += datos.length;
        b.set(F.doc(col, llave(c)), { tipo: c.tipo, id: c.id, datos, cambio: c.cambio, borrado: c.borrado });
      }
      await manda();
      const otro = T.some((c) => antes.get(llave(c)) !== c.cambio);
      ponLS(`cuaderno:sinc:${yo}`, Date.now());
      estado = "al día"; avisa();
      if (otro) dispatchEvent(new CustomEvent("cuaderno-actualizado"));
    } catch (e) { estado = navigator.onLine ? "error" : "sin conexión"; avisa(); }
    finally { corriendo = null; }
  })());
}

function entra(u, traer) {
  const invitado = (leeLS("cuaderno:invitado") ?? []).filter(valida);
  uid = u.uid; memoria = null; usuario = { uid: u.uid, nombre: u.displayName || u.email || "Mi cuenta", correo: u.email, verificado: u.emailVerified };
  ponLS(ACT, u.uid);
  if (traer) {
    const n = adopta(invitado, todo());
    if (n.length) { const k = new Set(n.map(llave)); memoria = [...n, ...todo().filter((c) => !k.has(llave(c)))]; salva(); }
    ponLS("cuaderno:invitado", []);
  }
  return sincroniza();
}
export const pendientesDeInvitado = () => (leeLS("cuaderno:invitado") ?? []).filter((c) => valida(c) && !c.borrado).length;
const MENSAJES = { "auth/invalid-credential": "El correo o la contraseña no coinciden.", "auth/invalid-email": "Ese correo no es válido.", "auth/email-already-in-use": "Ese correo ya tiene cuenta. Entra o recupera la contraseña.", "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.", "auth/password-does-not-meet-requirements": "La contraseña debe tener al menos 8 caracteres.", "auth/popup-closed-by-user": "Cerraste la ventana de Google.", "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permítela y vuelve a intentar.", "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.", "auth/network-request-failed": "No hay conexión.", "auth/unauthorized-domain": "Este sitio todavía no está autorizado para entrar.", "cuaderno/sin-guardar": "No se borró nada: quedan cambios sin guardar en tu cuenta. Revisa la conexión y repite.", "auth/requires-recent-login": "Vuelve a entrar y repite." };
export const mensaje = (e) => MENSAJES[e?.code] ?? "No se pudo completar. Intenta otra vez.";

export async function conGoogle(traer) { const { U, auth } = await conecta(), p = new U.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); const r = await U.signInWithPopup(auth, p); await entra(r.user, traer); }
export async function conCorreo(correo, clave, traer) { const { U, auth } = await conecta(), r = await U.signInWithEmailAndPassword(auth, correo, clave); await entra(r.user, traer); }
export async function crea(correo, clave, traer) { const { U, auth } = await conecta(), r = await U.createUserWithEmailAndPassword(auth, correo, clave); U.sendEmailVerification(r.user).catch(() => {}); await entra(r.user, traer); }
export async function recupera(correo) { const { U, auth } = await conecta(); await U.sendPasswordResetEmail(auth, correo); }
export async function sale(olvidar) {
  const u = uid; if (u && estado !== "al día") await sincroniza();
  if (olvidar && u && estado !== "al día") { const e = new Error(); e.code = "cuaderno/sin-guardar"; throw e; }
  const { U, auth } = await conecta(); await U.signOut(auth);
  if (olvidar) { try { localStorage.removeItem(caja(u)); localStorage.removeItem(`cuaderno:sinc:${u}`); } catch { } }
  try { localStorage.removeItem(ACT); } catch { }
  uid = null; usuario = null; memoria = null; estado = "local"; avisa();
}
export async function eliminaCuenta() {
  const { U, F, auth, db } = await conecta(), u = auth.currentUser; if (!u) return;
  const ultimo = Date.parse(u.metadata.lastSignInTime); if (Date.now() - ultimo > 240000) { const e = new Error(); e.code = "auth/requires-recent-login"; throw e; }
  const col = F.collection(db, "usuarios", u.uid, "cosas"), d = (await F.getDocs(col)).docs;
  for (let i = 0; i < d.length; i += 200) { const b = F.writeBatch(db); for (const x of d.slice(i, i + 200)) b.delete(x.ref); await b.commit(); }
  await U.deleteUser(u);
  usuario = null; estado = "al día";
  await sale(true).catch(() => {});
}
export function respaldo() { return { clase: "cuaderno", version: 2, fecha: new Date().toISOString(), cosas: todo().filter((c) => !c.borrado) }; }
export function restaura(j) {
  let l = [];
  if (j?.clase === "cuaderno" && Array.isArray(j.cosas)) l = j.cosas;
  else if (j?.clase === "cuaderno" && Array.isArray(j.ensayos)) l = [...j.ensayos.map((e) => ({ tipo: "ensayo", id: e.id, datos: e, cambio: Date.now(), borrado: false })), ...(j.recetas ?? []).map((r) => ({ tipo: "receta", id: r.id, datos: r, cambio: Date.now(), borrado: false }))];
  else throw new Error("Ese archivo no es una copia del cuaderno.");
  l = l.filter((c) => valida(c) && c.datos && JSON.stringify(c.datos).length <= LIMITE);
  memoria = fusiona(todo(), l).todo; salva(); programa();
  return l.length;
}

migra();
uid = leeLS(ACT); if (typeof uid !== "string") uid = null;
if (CONFIG && uid) {
  estado = "conectando";
  conecta().then(({ U, auth }) => U.onAuthStateChanged(auth, (u) => {
    if (u && usuario?.uid !== u.uid) entra(u, false);
    else if (!u && uid) { uid = null; usuario = null; memoria = null; estado = "local"; try { localStorage.removeItem(ACT); } catch { } avisa(); dispatchEvent(new CustomEvent("cuaderno-actualizado")); }
  })).catch(() => { estado = "sin conexión"; avisa(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && usuario && Date.now() - (leeLS(`cuaderno:sinc:${usuario.uid}`) ?? 0) > 30000) sincroniza(); });
  addEventListener("online", () => sincroniza());
}
addEventListener("pagehide", () => { if (espera && usuario && estado === "por subir") sincroniza(); });
