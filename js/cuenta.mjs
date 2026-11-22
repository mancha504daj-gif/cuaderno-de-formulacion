import { h, aviso } from "./elementos.mjs";
import * as A from "./almacen.mjs";

const ESTADO = { local: "Solo en este navegador", conectando: "Conectando", sincronizando: "Guardando en tu cuenta", "por subir": "Cambios por guardar", "al día": "Guardado en tu cuenta", "sin conexión": "Sin conexión: se guarda aquí y sube después", error: "No se pudo guardar en tu cuenta" };

export function insignia(raiz) {
  if (!A.hayNube()) return;
  const menu = document.querySelector("#quarto-sidebar .sidebar-menu-container"), a = h("a", { class: "insignia", href: new URL("cuenta.html", raiz).href });
  A.alCambiar(({ usuario, estado }) => a.replaceChildren(h("i", { class: `punto ${estado === "al día" ? "bien" : estado === "error" ? "mal" : ""}`, "aria-hidden": "true" }), h("span", {}, usuario ? usuario.nombre : "Entrar"), h("small", {}, usuario ? ESTADO[estado] ?? "" : "para verlo en todos tus dispositivos")));
  if (menu) menu.before(a);
  const nav = document.querySelector(".portada header nav");
  if (nav) { const b = h("a", { href: new URL("cuenta.html", raiz).href }); A.alCambiar(({ usuario }) => { b.textContent = usuario ? "Mi cuenta" : "Entrar"; }); nav.append(b); }
}

export function pagina(el) {
  const error = h("p", { class: "aviso", role: "alert" }), dice = (t) => { error.textContent = t; };
  const copia = () => h("section", { class: "bloque-cuenta" }, h("h2", {}, "Copia de seguridad"), h("p", {}, "Un archivo con tus ensayos, recetas, laboratorios y cambios."), h("p", { class: "ordenes" },
    h("button", { type: "button", onclick: () => { const u = URL.createObjectURL(new Blob([JSON.stringify(A.respaldo(), null, 1)], { type: "application/json" })), a = document.createElement("a"); a.href = u; a.download = `cuaderno-${new Date().toLocaleDateString("sv-SE")}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); } }, "Descargar"),
    h("label", { class: "archivo" }, "Abrir copia", h("input", { type: "file", accept: ".json,application/json", onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { dice(`Se abrieron ${A.restaura(JSON.parse(await f.text()))} elementos.`); } catch (x) { dice(x instanceof SyntaxError ? "Ese archivo no es JSON." : x.message); } e.target.value = ""; } }))));
  const pon = (...x) => el.replaceChildren(...x.filter((y) => y != null));
  A.prepara();
  let modo = "entrar", antes = "inicio";
  const pinta = ({ usuario, estado }) => {
    const firma = `${usuario?.uid ?? ""}|${modo}`;
    const linea = h("p", { class: "datos-receta" }, h("span", {}, ESTADO[estado] ?? estado));
    if (firma === antes) { el.querySelector(".datos-receta")?.replaceWith(linea); return; }
    antes = firma; dice("");
    if (!A.hayNube()) { pon(h("p", {}, "Las cuentas todavía no están activas. Lo que haces se guarda en este navegador."), copia(), error); return; }
    if (usuario) {
      pon(h("h2", {}, usuario.nombre), linea, h("p", {}, usuario.correo ?? ""),
        usuario.verificado ? null : h("p", { class: "fuente" }, "Te enviamos un correo para confirmar la dirección. Puedes seguir usando el sitio."),
        h("p", {}, "Tus ensayos, recetas, laboratorios, avance y cambios de apariencia se ven en cualquier dispositivo donde entres."),
        h("p", { class: "ordenes" }, h("button", { type: "button", onclick: () => A.sincroniza() }, "Guardar ahora"),
          h("button", { type: "button", onclick: async () => { try { await A.sale(false); } catch (e) { dice(A.mensaje(e)); } } }, "Salir"),
          h("button", { type: "button", onclick: async () => { if (!confirm("¿Salir y borrar tus datos de este dispositivo? Lo que ya está en tu cuenta se conserva.")) return; try { await A.sincroniza(); await A.sale(true); } catch (e) { dice(A.mensaje(e)); } } }, "Salir y borrar de aquí")),
        copia(), h("section", { class: "bloque-cuenta" }, h("h2", {}, "Eliminar la cuenta"), h("p", {}, "Borra tu cuenta y todo lo guardado en ella. No se puede deshacer. Descarga antes una copia."), h("button", { type: "button", onclick: async () => { if (prompt("Escribe ELIMINAR para borrar tu cuenta y tus datos.") !== "ELIMINAR") return; try { await A.eliminaCuenta(); } catch (e) { dice(A.mensaje(e)); } } }, "Eliminar mi cuenta")), error);
      return;
    }
    const n = A.pendientesDeInvitado(), traer = h("input", { type: "checkbox", checked: true }), correo = h("input", { type: "text", inputmode: "email", autocomplete: "email", id: "correo", required: true }), clave = h("input", { type: "password", autocomplete: modo === "crear" ? "new-password" : "current-password", id: "clave", minlength: 8 });
    const corre = async (f, b) => { dice(""); b.disabled = true; try { await f(); } catch (e) { dice(A.mensaje(e)); } finally { b.disabled = false; } };
    const google = h("button", { type: "button", class: "principal", onclick: (e) => corre(() => A.conGoogle(traer.checked), e.currentTarget) }, "Entrar con Google");
    const form = h("form", { class: "entrada-cuenta", onsubmit: (e) => { e.preventDefault(); const b = e.currentTarget.querySelector("button[type=submit]"), c = correo.value.trim(); corre(async () => {
      if (modo === "recuperar") { await A.recupera(c).catch((x) => { if (x?.code !== "auth/user-not-found") throw x; }); dice("Si ese correo tiene cuenta, te llegará un enlace para cambiar la contraseña."); return; }
      if (modo === "crear" && clave.value.length < 8) { dice("La contraseña debe tener al menos 8 caracteres."); return; }
      await (modo === "crear" ? A.crea : A.conCorreo)(c, clave.value, traer.checked);
    }, b); } },
      h("label", { class: "casilla", for: "correo" }, "Correo", correo), modo === "recuperar" ? null : h("label", { class: "casilla", for: "clave" }, "Contraseña", clave),
      h("p", { class: "ordenes" }, h("button", { type: "submit" }, { entrar: "Entrar", crear: "Crear cuenta", recuperar: "Enviar enlace" }[modo])));
    const cambia = (m, t) => h("button", { type: "button", onclick: () => { modo = m; pinta({ usuario: null, estado: "local" }); } }, t);
    pon(h("p", {}, "Entra y verás lo mismo en tu teléfono y en tu computadora. Sin cuenta también puedes usar todo: se guarda en este navegador."),
      n ? h("label", { class: "casilla-linea" }, traer, h("span", {}, `Llevar a mi cuenta lo que ya hice aquí (${n}). Desmárcalo si este dispositivo es de otra persona.`)) : null,
      h("div", { class: "cuenta-dos" }, h("section", { class: "bloque-cuenta" }, h("h2", {}, "Con Google"), google), h("section", { class: "bloque-cuenta" }, h("h2", {}, { entrar: "Con correo", crear: "Crear cuenta", recuperar: "Recuperar contraseña" }[modo]), form, h("p", { class: "ordenes" }, modo !== "entrar" ? cambia("entrar", "Ya tengo cuenta") : cambia("crear", "Crear una cuenta"), modo !== "recuperar" ? cambia("recuperar", "Olvidé la contraseña") : null))), error,
      h("p", { class: "fuente" }, "Guardamos tu correo y lo que escribes en el cuaderno, en Firebase, un servicio de Google. Solo tú lo lees desde el sitio; quien administra el proyecto podría verlo en la consola. Puedes eliminar la cuenta cuando quieras. No pongas fórmulas que sean secreto."), copia());
  };
  A.alCambiar(pinta);
}
