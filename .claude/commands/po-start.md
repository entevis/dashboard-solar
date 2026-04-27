---
description: Abre una sesión de mantenimiento de PROJECT_OVERVIEW.md (lee el doc, revisa qué cambió en el código desde el último changelog y propone qué secciones tocar).
---

# /po-start — Apertura de sesión de Project Overview

Estás entrando en **modo de mantenimiento de `PROJECT_OVERVIEW.md`** (la documentación viva de S-Invest definida por el prompt "Documentación viva de S-Invest"). El objetivo de esta sesión es producir o actualizar ese documento de forma quirúrgica, siguiendo las reglas duras del prompt original (no inventar, código = fuente de verdad, conservar Changelog y Preguntas abiertas).

## Pasos a ejecutar AHORA, en este orden

1. **Leer el documento actual** completo: `PROJECT_OVERVIEW.md`. Si no existe, avisar al usuario y proceder en modo "primera corrida" según el prompt original.
2. **Identificar la última entrada del Changelog** de la sección §20. Anotar la fecha de cierre de la sesión anterior (formato `YYYY-MM-DD`).
3. **Revisar deltas en el código** desde esa fecha:
   - `git log --since='<fecha-última-sesión>' --oneline` para ver commits.
   - `git diff <último-sha-de-esa-fecha>..HEAD --stat` para ver archivos tocados (resumen, no diff completo).
   - Si la última sesión fue hoy mismo, comparar contra el HEAD anterior al primer commit de hoy.
4. **Cruzar contra la doc**: para cada archivo tocado en código, identificar qué sección(es) del overview podrían quedar desactualizadas (modelo de datos, APIs, integraciones, deuda técnica, etc.).
5. **Reportar al usuario** un breve plan de actualización con:
   - **Última sesión**: fecha y nº de la sesión anterior del Changelog.
   - **Commits desde entonces**: lista corta (1 línea por commit).
   - **Secciones candidatas a tocar**: por cada sección del doc, una línea con qué podría haber cambiado y por qué.
   - **Preguntas que necesito responder antes de escribir**: solo aquellas que no se puedan resolver leyendo el código.
6. **No editar `PROJECT_OVERVIEW.md` todavía**. Esperar luz verde del usuario sobre el plan antes de tocar el archivo.

## Reglas de la sesión

- **Sin inventar**: cada afirmación nueva debe respaldarse en código real (referencias `[archivo](path#Lnn)`).
- **Update quirúrgico**: preservar contenido válido; cambiar solo lo que cambió.
- **Marcar dudas**: lo no verificable va con `🔍` (pendiente verificar) o `❓` (asunción) y se suma a *Preguntas abiertas*.
- **No tocar Changelog ni Preguntas abiertas como bloque** — solo agregar entradas/items, nunca borrar histórico.
- **Cierre obligatorio**: la sesión termina cuando el usuario invoca `/po-end`, no antes. No escribir entrada de Changelog hasta entonces.
