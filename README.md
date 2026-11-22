# Cuaderno de formulación

Sitio en español sobre formulación cosmética, con cálculos a la vista y fuentes citadas. El nombre es provisional.

## Qué trae

- **Seis secciones:** piel, limpieza, protección solar, maquillaje, cabello y fragancias, más una de emulsiones.
- **44 productos con 47 recetas**, cada una con su razón, pasos, controles, fallas y hoja de laboratorio. Son propuestas sin ensayar.
- **Lecciones, glosario y preguntas** por sección, y fundamentos de laboratorio, conservación y estabilidad.
- **Seis calculadoras:** HLB, Stokes, conservante y pH, jabón, materia activa y conteo en placa.
- **Microbiología** con once lecciones sobre el conteo en placa, la búsqueda de patógenos y el ensayo del conservante.
- **Trece laboratorios** armados con bloques. Cada uno muestra sus ecuaciones, sus supuestos y su fuente.
- **Escenas animadas** que se mueven con la ecuación que explican (WebGL 2, sin bibliotecas).
- **Editor de bloques** para cambiar la apariencia de una página o armar un laboratorio sin programar.
- **Cuentas opcionales** con Google o correo. Guardan ensayos, recetas, laboratorios, avance y cambios de apariencia en todos los dispositivos. Sin cuenta, el sitio guarda en el navegador.

## Verlo en tu computadora

Necesitas [Quarto](https://quarto.org). Desde esta carpeta:

```
quarto preview
```

En RStudio también sirve **Render Website**.

## Cambiarlo

| Quieres | Edita |
|---|---|
| Un texto | el archivo `.qmd` o `.md` de esa página |
| Un laboratorio o la apariencia de una página | el editor del sitio; guarda el archivo descargado en `laboratorios` o en `aspecto` |
| Una receta | «Modificar esta receta» en el sitio; guarda el archivo descargado en `recetas` |
| Un término, un producto o un ingrediente | `datos/terminos.json`, `datos/productos.json`, `datos/ingredientes.json` |
| Un dato | los `.json` de `datos` |
| Una ecuación de las calculadoras | `js/motor.mjs` |
| Una escena | `js/escenas.mjs` y `js/escenas2.mjs` |

## Cuentas

Usan Firebase (Authentication y Firestore). La configuración pública está en `js/configuracion.mjs`; con `CONFIG = null` el sitio funciona sin cuentas. Las reglas de `firestore.rules` dejan leer y escribir a cada quien lo suyo. Para cambiarlas: `firebase deploy --only firestore:rules --project TU_PROYECTO`.

## Comprobar los cálculos

```
node --test pruebas/*.test.mjs
```

## Alcance

Es material de estudio. Los cálculos no reemplazan el ensayo de estabilidad, el de eficacia del conservante ni la evaluación de seguridad. Lee la página Alcance antes de formular algo que alguien vaya a usar.

## Licencia

El código va con licencia MIT ([LICENSE](LICENSE)) y los textos, datos y laboratorios con CC BY 4.0 ([LICENSE-CONTENIDO.md](LICENSE-CONTENIDO.md)). Las fotos conservan la de su autor; están en `creditos.qmd`.
