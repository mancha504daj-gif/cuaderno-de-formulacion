export const TIPOS = ["ensayo", "receta", "laboratorio", "aspecto", "avance", "preferencia"];
export const LIMITE = 400000;

export function valida(c) {
  return !!c && TIPOS.includes(c.tipo) && typeof c.id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(c.id) && Number.isFinite(c.cambio) && c.cambio > 0 && typeof c.borrado === "boolean";
}
export const llave = (c) => `${c.tipo}.${c.id}`;

export function gana(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.cambio !== b.cambio) return a.cambio > b.cambio ? a : b;
  if (a.borrado !== b.borrado) return a.borrado ? a : b;
  return JSON.stringify(a.datos ?? null) >= JSON.stringify(b.datos ?? null) ? a : b;
}

export function fusiona(local, remoto) {
  const m = new Map(), r = new Map();
  for (const c of remoto) if (valida(c)) r.set(llave(c), c);
  for (const c of local) if (valida(c)) m.set(llave(c), c);
  const todo = new Map(), subir = [];
  for (const k of new Set([...m.keys(), ...r.keys()])) {
    const x = gana(m.get(k), r.get(k));
    todo.set(k, x);
    if (x !== r.get(k) && JSON.stringify(x) !== JSON.stringify(r.get(k))) subir.push(x);
  }
  return { todo: [...todo.values()], subir };
}

export function adopta(delInvitado, delUsuario) {
  const u = new Map(delUsuario.map((c) => [llave(c), c])), nuevos = [];
  for (const c of delInvitado) {
    if (!valida(c) || c.borrado) continue;
    const x = u.get(llave(c));
    if (!x || x.cambio < c.cambio) nuevos.push(c);
  }
  return nuevos;
}
