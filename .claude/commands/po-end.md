---
description: Cierra la sesión de mantenimiento de PROJECT_OVERVIEW.md (escribe entrada nueva en el Changelog §20, actualiza Preguntas abiertas §19 y propone próximos pasos).
---

# /po-end — Cierre de sesión de Project Overview

Estás cerrando una sesión de mantenimiento de `PROJECT_OVERVIEW.md`. Antes de declarar "hecho", **debes** registrar el cambio en el documento.

## Pasos a ejecutar AHORA, en este orden

1. **Releer la sección §20 — Changelog de documentación** del archivo `PROJECT_OVERVIEW.md` para identificar el número de la última sesión registrada.
2. **Calcular el número de sesión nueva**: `N = última + 1`.
3. **Determinar la fecha**: usar la fecha de hoy en formato `YYYY-MM-DD` (la del entorno actual, no inventar). Si hay duda, preguntar al usuario.
4. **Recorrer mentalmente** todos los cambios hechos al `PROJECT_OVERVIEW.md` durante esta conversación. Si **no se hizo ningún cambio al documento** en esta sesión, **no agregar entrada al Changelog** — informar al usuario y terminar limpio.
5. **Agregar al final de §20** una entrada nueva con esta plantilla, inmediatamente antes de la sección "Sugerencias para la próxima sesión":

   ```markdown
   ### [YYYY-MM-DD] — Sesión N

   #### Agregado
   - <bullets de lo nuevo: secciones, entidades documentadas, integraciones, etc.>

   #### Cambiado
   - <bullets de lo modificado: con referencia a la sección>

   #### Removido
   - <bullets de lo eliminado o N/A>

   #### Motivación (qué cambió en el código que gatilló esto)
   - <commits / archivos / decisiones que motivaron el update>
   ```

6. **Actualizar §19 — Preguntas abiertas**:
   - Tachar (no borrar) o marcar como ✅ resueltas las preguntas contestadas en esta sesión, indicando dónde quedó la respuesta en el doc.
   - Agregar al final del listado las nuevas preguntas surgidas.
7. **Actualizar la sección final "Sugerencias para la próxima sesión"** con un set fresco de 3–5 puntos accionables basados en lo que quedó pendiente.
8. **Update del header**: cambiar la línea `> Última actualización: **YYYY-MM-DD**.` al inicio del archivo a la fecha de cierre de esta sesión.
9. **Resumir al usuario** en 4–6 líneas máx:
   - Qué se cambió en el doc (secciones tocadas).
   - Cuántas preguntas abiertas se resolvieron / se sumaron.
   - Recordatorio de lo más urgente para la próxima sesión.

## Reglas duras de cierre

- **Nunca borrar** entradas previas del Changelog ni del histórico de Preguntas abiertas.
- **Nunca cerrar sin entrada de Changelog** si hubo cambios reales al doc.
- **Si no hubo cambios al doc**, decirlo explícitamente y no inventar entrada.
- **Fechas absolutas siempre** (`YYYY-MM-DD`), nunca relativas ("ayer", "hoy") en el doc.
- **No tocar `git`** — el commit/push lo decide el usuario por separado.
