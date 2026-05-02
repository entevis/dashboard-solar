# S-Invest — Manual Funcional del Producto

> **Audiencia.** Equipo MAESTRO de S-Invest. Este documento describe qué hace cada pantalla, qué puede ver y qué puede hacer cada tipo de usuario, y los flujos extremo a extremo del sistema. Sirve como base para capacitar a los usuarios CLIENTE en el lanzamiento.
>
> **Idioma.** UI en español (Chile). Los términos técnicos del modelo de datos van entre paréntesis cuando ayudan a la trazabilidad.
>
> **Última actualización.** 2026-04-27.

---

## Tabla de contenidos

1. [Qué es S-Invest](#1-qué-es-s-invest)
2. [Roles y matriz de permisos](#2-roles-y-matriz-de-permisos)
3. [Acceso y cuenta de usuario](#3-acceso-y-cuenta-de-usuario)
4. [Estructura general de la aplicación](#4-estructura-general-de-la-aplicación)
5. [Módulo: Resumen general (Dashboard)](#5-módulo-resumen-general-dashboard)
6. [Módulo: Resumen del portafolio](#6-módulo-resumen-del-portafolio)
7. [Módulo: Plantas solares](#7-módulo-plantas-solares)
8. [Módulo: Reportes de generación](#8-módulo-reportes-de-generación)
9. [Módulo: Visor de reporte Delta Plus](#9-módulo-visor-de-reporte-delta-plus)
10. [Módulo: Contingencias (mantenimiento)](#10-módulo-contingencias-mantenimiento)
11. [Módulo: Facturas y reportes (Billing)](#11-módulo-facturas-y-reportes-billing)
12. [Administración: Usuarios](#12-administración-usuarios)
13. [Administración: Clientes y contactos](#13-administración-clientes-y-contactos)
14. [Administración: Portafolios y cuentas bancarias](#14-administración-portafolios-y-cuentas-bancarias)
15. [Flujos extremo a extremo](#15-flujos-extremo-a-extremo)
16. [Procesos automáticos del sistema](#16-procesos-automáticos-del-sistema)
17. [Casos límite y mensajes de estado](#17-casos-límite-y-mensajes-de-estado)
18. [Glosario rápido](#18-glosario-rápido)

---

## 1. Qué es S-Invest

S-Invest es la plataforma web con la que el equipo de S-Invest **gestiona** los portafolios de inversión solar y con la que los **clientes finales visualizan** la operación de sus plantas fotovoltaicas.

**Modelo de negocio reflejado en el sistema.** S-Invest financia la construcción de plantas fotovoltaicas y es dueña temporal de cada planta por `N` años. Durante ese plazo el cliente paga financiamiento, generación y mantención. Operativamente, desde el día uno la planta se identifica como "del cliente" — un cliente (`Customer`) puede tener varias plantas (`PowerPlant`), y cada planta vive dentro de un portafolio (`Portfolio`).

**Para el equipo S-Invest la plataforma permite:**
- Administrar portafolios, clientes, plantas y contactos.
- Sincronizar y revisar la facturación electrónica emitida vía **Duemint**.
- Ingerir reportes técnicos de generación desde **Delta Plus** (automáticamente vía la glosa de cada factura, o manualmente subiendo un PDF).
- Gestionar contingencias de mantenimiento (preventivas y correctivas).
- Auditar accesos y operaciones.

**Para el cliente final la plataforma permite:**
- Ver kWh generados, CO₂ evitado y rendimiento por planta.
- Consultar y descargar facturas y reportes de generación.
- Ver el estado de mantención de sus plantas.

---

## 2. Roles y matriz de permisos

El sistema reconoce cinco roles. **En esta etapa de lanzamiento sólo se asignan tres desde la UI**: `MAESTRO`, `CLIENTE` y `CLIENTE_PERFILADO`. Los roles `OPERATIVO` y `TECNICO` existen en el modelo y se pueden asignar vía edición pero no aparecen en el formulario de creación de usuarios.

| Rol | A quién va dirigido | Alcance de plantas que puede ver |
|---|---|---|
| **MAESTRO** | Equipo interno S-Invest con acceso total | Todas las plantas, todos los portafolios |
| **CLIENTE** | Persona del cliente final con visión completa de su empresa | Todas las plantas asociadas al `Customer` del usuario |
| **CLIENTE_PERFILADO** | Persona del cliente con acceso restringido a un subset | Sólo las plantas explícitamente listadas en su perfil |
| **OPERATIVO** *(no asignable desde UI de creación)* | Operación interna por portafolio | Plantas del portafolio asignado |
| **TECNICO** *(no asignable desde UI de creación)* | Técnicos asociados a uno o más portafolios | Plantas de los portafolios listados en sus permisos |

### Matriz funcional resumida

| Funcionalidad | MAESTRO | CLIENTE | CLIENTE_PERFILADO | OPERATIVO | TECNICO |
|---|:---:|:---:|:---:|:---:|:---:|
| Login y cambio de contraseña | ✅ | ✅ | ✅ | ✅ | ✅ |
| Selector de portafolio activo | ✅ | — *(automático)* | — *(automático)* | — *(asignado)* | — *(asignados)* |
| Resumen general (multi-portafolio) | ✅ | ✅ *(sus plantas)* | ✅ *(sus plantas)* | quick-link | redirige a contingencias |
| Resumen del portafolio | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lista y detalle de plantas | ✅ | ✅ | ✅ *(subset)* | ✅ | ✅ |
| Editar planta | ✅ | ❌ | ❌ | ❌ | ❌ |
| Exportar plantas a Excel | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver gráficos de generación de planta | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver visor Delta Plus de un reporte | ✅ | ✅ | ✅ | ✅ | ✅ |
| Listar facturas y reportes | ✅ | ✅ *(de sus plantas)* | ✅ *(de sus plantas)* | ✅ | ❌ |
| Sincronizar / importar facturas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Subir reporte PDF manual | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver contingencias | ✅ | ❌ | ❌ | ✅ | ✅ *(las propias)* |
| Crear / actualizar contingencias | ✅ | ❌ | ❌ | ✅ | ✅ |
| Comentar y adjuntar archivos | ✅ | ❌ | ❌ | ✅ | ✅ |
| Administrar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Administrar clientes y contactos | ✅ *(crear/editar)* | ✅ *(sólo listar)* | ✅ *(sólo listar)* | ✅ *(sólo listar)* | ✅ *(sólo listar)* |
| Administrar portafolios y cuentas bancarias | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Regla operativa.** Toda funcionalidad de administración (alta de usuarios, alta de clientes, alta de portafolios, sincronización de facturas, importación manual, subida de PDF, edición de planta) es **exclusiva de MAESTRO**. El cliente final nunca ve estos botones.

---

## 3. Acceso y cuenta de usuario

### 3.1 Pantalla de inicio de sesión (`/login`)

**Quién la ve.** Cualquier usuario que aún no inició sesión. Si un usuario autenticado entra a `/login`, el sistema lo redirige automáticamente a `/dashboard`.

**Qué muestra.**
- A la izquierda: imagen rotativa decorativa (ocho variantes solares/naturaleza).
- A la derecha (panel de 480 px en escritorio, ancho completo en móvil): logo S-Invest, título "Plataforma S-Invest" y mensaje "Bienvenido, ingresa tus credenciales".
- Campo **Email** y campo **Contraseña** con botón ojo para ver/ocultar.
- Botón **Ingresar**.
- Link **¿Olvidaste tu contraseña?**.
- Pie: "Acceso proporcionado por el administrador del sistema".

**Qué pasa al hacer clic en Ingresar.**
1. Se autentica contra Supabase Auth con el email y contraseña.
2. Si la autenticación falla, aparece la alerta roja "Credenciales inválidas. Intenta nuevamente."
3. Si tiene éxito, el sistema registra `lastLoginAt` (fecha del último acceso) y redirige a `/dashboard`.

**Mensajes especiales.**
- Si el usuario llega con un link expirado, ve "Tu sesión ha expirado o el enlace ya no es válido. Solicita uno nuevo."
- Si llega desde un correo cuyo enlace caducó, ve "El enlace ha expirado o ya fue utilizado…".

### 3.2 Activación de cuenta y recuperación de contraseña

S-Invest **no permite auto-registro**: la cuenta del cliente la crea siempre un MAESTRO desde el módulo de administración. El cliente recibe un correo con un enlace de invitación.

**Pantalla `/activate`.** Al abrir el correo, el cliente cae en una pantalla intermedia con dos posibles textos:
- "Activar tu cuenta — Haz clic en el botón de abajo para activar tu cuenta y definir tu contraseña."
- "Restablecer contraseña — Haz clic en el botón de abajo para restablecer tu contraseña."
- Pie: "Este enlace es de un solo uso y expira en 1 hora."

Si el enlace ya se usó o caducó, la pantalla muestra "El enlace no es válido o ha expirado." con botón **Ir al inicio de sesión**.

**Pantalla `/set-password`.** Después de hacer clic en el botón de activación:
- Muestra el correo del usuario y dos campos: **Nueva contraseña** y **Confirmar contraseña**.
- Aparece un **checklist en tiempo real** que se va marcando en verde a medida que la contraseña cumple cada regla:
  - Mínimo 8 caracteres.
  - Al menos una letra minúscula.
  - Al menos una letra mayúscula.
  - Al menos un número.
- El botón **Guardar contraseña** se activa sólo cuando se cumplen las cuatro reglas y las dos contraseñas coinciden.

**Recuperación desde `/forgot-password`.** El usuario ingresa su correo y hace clic en **Enviar enlace de recuperación**. La pantalla siempre confirma con "Si existe una cuenta asociada a {email}, recibirás un correo con instrucciones…" — el sistema **no revela** si el correo está registrado o no (protección anti-enumeración).

### 3.3 Cambio de contraseña desde la sesión activa

Cualquier usuario puede cambiar su contraseña sin pasar por correo. En el menú de usuario (esquina superior derecha) → **Cambiar contraseña** abre un modal con:
- **Contraseña actual** (obligatoria; el sistema valida que sea correcta).
- **Nueva contraseña** (con el mismo checklist de cuatro reglas).
- **Confirmar nueva contraseña**.

El botón **Cambiar contraseña** queda deshabilitado hasta que se cumplen todas las reglas y la nueva difiere de la actual. Si la contraseña actual está mal, aparece "La contraseña actual es incorrecta".

### 3.4 Cierre de sesión

Menú de usuario → **Cerrar sesión**. El sistema borra la cookie del portafolio activo, cierra la sesión Supabase y redirige a `/login`.

---

## 4. Estructura general de la aplicación

Una vez autenticado, el usuario ve siempre tres elementos persistentes:

### 4.1 Sidebar (lateral izquierdo, sólo escritorio, 228 px de ancho)

Los ítems del sidebar **dependen del rol**:

**MAESTRO**
- Resumen general
- Resumen del portafolio
- Plantas
- *Sección Configuraciones:*
  - Usuarios
  - Clientes
  - Portafolios

**CLIENTE / CLIENTE_PERFILADO**
- Resumen general
- Plantas
- Facturas y reportes

**OPERATIVO**
- Resumen general
- Plantas

**TECNICO**
- Acceso reducido (entra directo al módulo de contingencias).

El ítem activo se resalta en azul primario `#004ac6` con texto en negrita.

### 4.2 Topbar (barra superior pegajosa)

De izquierda a derecha:
- **Botón hamburguesa** (sólo móvil) para abrir menú lateral.
- **Selector de portafolio** (sólo MAESTRO): dropdown con todos los portafolios activos. Al elegir uno:
  - Se guarda una cookie `portfolio_id` por 30 días.
  - Si el usuario está en una ruta con portafolio en la URL (`/42/power-plants`), la URL se reescribe al portafolio elegido (`/99/power-plants`).
  - Aparece un toast: "Has cambiado al portafolio {nombre}".
- **Chip con el rol** del usuario en mayúsculas (oculto en móvil pequeño).
- **Menú de usuario**: avatar circular con las iniciales + nombre + flecha. Al abrir muestra:
  - Nombre y correo.
  - **Cambiar contraseña** (abre el modal).
  - **Cerrar sesión**.

### 4.3 Selector inicial de portafolio (solo MAESTRO, `/select-portfolio`)

La primera vez que un MAESTRO entra (sin cookie de portafolio), aterriza en una pantalla centrada que dice "Bienvenido, {primer nombre}" y muestra una lista de radio-buttons con los portafolios activos. Cada item indica nombre + cantidad de plantas (ej. "Portfolio A — 12 plantas"). Al elegir uno y hacer clic en **Continuar**, se guarda la cookie `portfolio_id` (30 días) y se redirige a `/dashboard`.

Mensaje de pie: "Podrás cambiar el portafolio activo en cualquier momento desde el menú superior".

> **Nota.** Los clientes (CLIENTE / CLIENTE_PERFILADO) no pasan por esta pantalla. El sistema deduce automáticamente su portafolio a partir de su primera planta activa.

---

## 5. Módulo: Resumen general (Dashboard)

**Ruta.** `/dashboard`

### 5.1 Vista MAESTRO

Resumen consolidado **de todos los portafolios** en el año en curso.

**Sección 1 — KPIs (4 tarjetas).**
- **Plantas activas** (recuento total + cantidad de clientes).
- **Capacidad instalada** (kWp).
- **Generación anual** (kWh).
- **CO₂ evitado anual** (toneladas) + equivalencia en árboles plantados.

**Sección 2 — Tabla comparativa de portafolios.**
Columnas: Nombre del portafolio (con punto de color), N° plantas, Capacidad (kWp), Generación (kWh), CO₂ evitado (ton), Facturación anual (CLP), Facturas por vencer (resaltado en amarillo si > 0), Facturas vencidas (resaltado en rojo si > 0).

**Sección 3 — Generación mensual (gráfico de barras apilado).**
Eje X: meses (Ene–Dic). Eje Y: kWh. Cada portafolio tiene su propio color en la pila.

**Sección 4 — CO₂ acumulado (gráfico de área apilado).**
Misma lógica pero acumulando toneladas mes a mes por portafolio.

**Sección 5 — Resumen de facturación (4 tarjetas).**
- **Pagadas** (verde): total CLP + cantidad.
- **Por vencer** (naranjo): total + cantidad.
- **Vencidas** (rojo): total + cantidad.
- **Notas de crédito** (gris): total + cantidad.

**Sección 6 — Facturación mensual (barras apiladas).**
Eje X: meses. Eje Y: CLP. Pilas por estado (Pagada / Por vencer / Vencida).

**Sección 7 — Distribución de facturación por portafolio (gráfico de torta).**

**Sección 8 — Impacto ambiental (3 tarjetas).**
- CO₂ evitado en toneladas (con emoji 🌱).
- Equivalente en árboles (cálculo: 22 kg CO₂ / árbol / año).
- Equivalente en autos retirados (cálculo: 4,6 ton CO₂ / auto / año).

### 5.2 Vista CLIENTE y CLIENTE_PERFILADO ("Mis Plantas")

Resumen sólo de las plantas que el usuario tiene autorizadas.

**KPIs.**
- Plantas activas (cantidad total y activas).
- Generación anual (kWh).
- CO₂ evitado anual (ton + equivalencia árboles).
- Facturación anual (CLP + cantidad de facturas pendientes).

**Gráficos.**
- Generación mensual (barras agregadas de todas sus plantas).
- CO₂ acumulado (línea/área).
- **Top 5 plantas por generación** (barras horizontales).

**Tarjetas de impacto ambiental.** Idénticas a la vista MAESTRO.

**Resumen de facturación.** Mismas 4 tarjetas (Pagadas, Por vencer, Vencidas, Notas de crédito).

**Tabla de plantas.**
Columnas: Nombre, Ciudad, Estado (activa/inactiva), Capacidad (kWp), Generación anual (kWh), CO₂ anual (ton), Último mes/año reportado. Cada fila es clicleable y lleva al detalle de la planta.

### 5.3 Vista OPERATIVO

Una única tarjeta de acceso rápido titulada **Plantas → Ver plantas asignadas** que lleva a `/{portfolioId}/power-plants`.

### 5.4 Vista TECNICO

El TECNICO no tiene dashboard; al entrar el sistema lo redirige al módulo de contingencias.

---

## 6. Módulo: Resumen del portafolio

**Ruta.** `/{portfolioId}/overview` (también accesible desde el sidebar como "Resumen del portafolio").

**Sólo MAESTRO.** Si un usuario no-MAESTRO entra a esta ruta, es redirigido a `/dashboard`.

**Qué muestra.**

**Encabezado.** Nombre del portafolio en grande, subtítulo "Resumen del portafolio — {año}", logo del portafolio si está cargado.

**KPIs (5 tarjetas).**
- **Plantas:** activas + capacidad total en kWp.
- **Clientes:** cantidad de clientes únicos con plantas en el portafolio.
- **Generación {año}:** kWh.
- **CO₂ evitado {año}:** ton + equivalencia en árboles.
- **Facturación {año}:** CLP + cantidad de facturas por vencer.

**Gráficos.**
- Generación mensual del portafolio (barras).
- CO₂ acumulado del año (área).

**Alerta de facturas vencidas.** Si existen facturas vencidas, aparece una caja roja con ⚠️ y un listado de hasta 10 facturas (cliente, total, días de atraso).

**Tabla de top 10 clientes** ordenados por generación anual descendente. Columnas: Cliente, N° plantas, Capacidad, Generación, CO₂, Facturación anual, Facturas pendientes (con etiqueta "vencidas" o "por vencer").

**Tabla de top 10 plantas** del portafolio ordenadas por generación. Columnas: Planta, Cliente, Ciudad, Capacidad, Generación, CO₂, Último mes/año reportado.

---

## 7. Módulo: Plantas solares

### 7.1 Lista de plantas

**Ruta.** `/{portfolioId}/power-plants` (todos los roles, scoped por permisos del usuario).

**Encabezado.** "Plantas Solares" + "{N} plantas encontradas".

**Barra de filtros.**
- Búsqueda por nombre (texto libre, sin distinguir mayúsculas).
- Filtro por cliente (dropdown).
- Botón **Exportar** (sólo MAESTRO): descarga un Excel con las plantas filtradas.

**Tabla.**
Columnas: SOLCOR ID, Nombre, Alias (`PlantName`), Ciudad, Distribuidora, Tarifa, Fecha inicio, Duración (años), Capacidad (kWp), Rendimiento específico (kWh/kWp), Acciones.

- Las filas son cliqueables y llevan al detalle de la planta.
- Las columnas son ordenables (orden por defecto: Nombre ascendente).
- Paginación seleccionable: 15, 25, 50 o 100 por página.
- Si el contenido de una celda excede el ancho, aparece tooltip al pasar el mouse.

**Columna Acciones (sólo MAESTRO).** Iconos lápiz (editar) y basurero (eliminar — soft delete).

**Estados vacíos.**
- Sin filtros activos: "Las plantas solares que gestiones aparecerán aquí." con icono ⚡.
- Con filtros activos: "Ninguna planta coincide con los filtros aplicados." con icono 🔍.

### 7.2 Detalle de planta — pestaña General

**Ruta.** `/{portfolioId}/power-plants/{powerPlantId}`

**Encabezado.** Nombre de planta, badge del portafolio con su logo, nombre del cliente.

**Pestañas (tabs).** General · Facturas y reportes · Contingencias.

**Contenido de la pestaña General.** Formulario en modo lectura (o edición si MAESTRO) organizado en 5 secciones:

1. **Información de la Planta:** nombre, SOLCOR ID, estado (activa/inactiva), capacidad (kWp), rendimiento específico (kWh/kWp).
2. **Contrato y Distribuidor:** distribuidora, tarifa, fecha de inicio, duración (años).
3. **Especificaciones Técnicas:** cantidad de paneles, tipo de instalación, superficie (m²).
4. **Clasificación Económica:** sector económico principal, sector económico 2.
5. **Dirección:** calle, referencia, ciudad, comuna/provincia, país (Chile por defecto).

**Edición (solo MAESTRO).** El botón **Editar** (lápiz, esquina superior derecha) habilita todos los campos. Aparecen botones **Cancelar** y **Guardar cambios**.
- Si el usuario intenta navegar fuera con cambios sin guardar, el navegador muestra un aviso de confirmación.
- Al guardar, se muestra toast de éxito o error y se refresca la página.

### 7.3 Detalle de planta — pestaña Facturas y reportes

**Ruta.** `/{portfolioId}/power-plants/{powerPlantId}/generation`

**Subtítulo.** "{N} facturas y reportes de generación".

**Gráficos (dos columnas en escritorio).**
- **Generación mensual (kWh).** Barras azules redondeadas. Tooltip al pasar el mouse: "{Mes} {Año}: {X} kWh".
- **CO₂ acumulado (toneladas).** Línea con área rellena.

**Tabla de facturas y reportes.**
Columnas: Número de factura, Cliente, Fecha emisión, Fecha vencimiento, Total (CLP), Estado (chip de color), enlace **Ver reporte** si existe reporte vinculado.

- Orden por defecto: fecha de emisión descendente.
- Paginación: 15, 50 o 100 por página, controles abajo.
- Estados disponibles para Excel preservados en URL (sort, page, page size).
- Vacío: icono 📄 + "Sin facturas vinculadas — Las facturas aparecerán aquí cuando estén vinculadas a esta planta."

### 7.4 Detalle de planta — pestaña Contingencias

**Ruta.** `/{portfolioId}/power-plants/{powerPlantId}/contingencies`

Subconjunto del módulo de contingencias filtrado por la planta. Se documenta en detalle en §10.

---

## 8. Módulo: Reportes de generación

### 8.1 Reportes globales (MAESTRO)

**Ruta.** `/reports`

**Filtros.** Año (dropdown) + Planta (dropdown). Ambos opcionales.

**KPIs (3 tarjetas).**
- **Total generado** en kWh.
- **CO₂ evitado** en toneladas (texto verde).
- **Reportes** (cantidad).

**Tabla.** Columnas: Planta, Portafolio, Cliente, Periodo (Mes/Año), kWh generados, CO₂ evitado, enlace al reporte/PDF.
Cada fila es clicleable y abre el visor Delta Plus en `/report/{duemintId}`.

### 8.2 Reportes del portafolio

**Ruta.** `/{portfolioId}/reports`

Misma estructura que la versión global, pero limitada al portafolio activo. El filtro de planta sólo lista las plantas accesibles al usuario:
- CLIENTE: las plantas de su cliente.
- CLIENTE_PERFILADO: sólo las plantas autorizadas.
- MAESTRO / OPERATIVO: todas las del portafolio.

---

## 9. Módulo: Visor de reporte Delta Plus

**Ruta.** `/report/{duemintId}`

Cualquier usuario autenticado puede acceder. Muestra el reporte técnico de un mes específico de una planta.

### 9.1 Encabezado (hero)

- Título "Planta Solar Fotovoltaica" + nombre de la planta.
- Subtítulo: "{P_nom} kW nominales · {N} inversores · Portafolio {X}".
- **Caja de navegación entre periodos (lado derecho)**:
  - **Chevron izquierdo (◀)**: si existe reporte anterior para la misma planta, lleva a `/report/{duemintId-anterior}`.
  - Centro: etiqueta "Periodo" + mes y año (ej. "Enero 2025").
  - **Chevron derecho (▶)**: si existe reporte siguiente, lleva al duemintId siguiente.
  - Si no existe vecino, el chevron correspondiente queda deshabilitado.
  - Línea divisoria.
  - Etiqueta "Emitido" + fecha de generación del reporte.

### 9.2 KPIs principales

**Fila 1 (4 tarjetas).**
- **Producción total** (kWh).
- **Performance Ratio O&M** (%) con delta vs. simulado (verde si supera, rojo si está por debajo).
- **Irradiación total** (kWh/m²).
- **Rendimiento específico** (kWh/kWp).

**Fila 2 (3 tarjetas).**
- **Disponibilidad O&M** (%) con delta vs. garantía 97% (siempre verde, en p.p. sobre la garantía).
- **Disponibilidad real** (%) con etiqueta "Sin eventos" o "{N} eventos".
- **CO₂ evitado** (toneladas).

### 9.3 Producción diaria

Si hay datos diarios:
- Botones **Total** / **Por inversor** para cambiar entre suma diaria total o desglosada por inversor.
- Gráfico de barras: kWh por día del mes. Día máximo en verde, día mínimo en rojo, intermedios en azul.
- Tooltip al pasar el mouse: día, fecha y kWh.
- Debajo, 4 tarjetas: día de máxima producción, mediana, día de mínima producción, promedio diario.

### 9.4 Inversores

Grilla de tarjetas (muestra los primeros 2; **Ver {N} inversores más** expande el resto):
- Código del inversor + modelo + cantidad de paneles.
- Badge "Principal" o "Secundario".
- Producción (kWh), Rendimiento (kWh/kWp), Performance Ratio (% con barra), Disponibilidad real (% con barra).

### 9.5 Disponibilidad

- Donut grande con la disponibilidad real.
- Métricas: horas totales sobre MIT, duración promedio del día, eventos de indisponibilidad, mantenciones correctivas.
- Si hay eventos: tabla con N°, Tipo, Descripción, Fecha, Horas.

### 9.6 Comparación histórica (acumulado año)

4 métricas con valor real vs. simulado y delta porcentual:
- Generación acumulada.
- Irradiación acumulada.
- PR promedio.
- Disponibilidad promedio.

### 9.7 Tabla diaria detallada

- Buscador "Filtrar por día" (acepta "15" o "15 ene").
- Columnas: Día, Inversor A, Inversor B, …, Total, **vs promedio** (barra horizontal con color: verde ≥ promedio, amarillo 70-promedio, rojo < 70%).
- Día máximo y mínimo resaltados en negrita.

### 9.8 Pie de página

- Izquierda: "S-Invest · Dashboard del Inversor" + logo Delta Activos + "Datos operacionales provistos por".
- Derecha: código del reporte + fecha de emisión.

---

## 10. Módulo: Contingencias (mantenimiento)

Las contingencias son eventos de mantenimiento sobre una planta. Hay dos tipos: **Preventiva** (mantención programada) y **Correctiva** (falla o reparación). Cada una tiene un ciclo de vida estricto.

**Estados del ciclo (one-way).**
- **Abierta** (`OPEN`, chip rojo): recién creada, sin trabajo iniciado.
- **En progreso** (`IN_PROGRESS`, chip amarillo): trabajo en curso.
- **Cerrada** (`CLOSED`, chip verde): mantenimiento completo. **Una vez cerrada no se puede comentar, adjuntar archivos ni cambiar de estado.**

### 10.1 Listado global de contingencias

**Ruta.** `/contingencies`

**Acceso.**
- MAESTRO y OPERATIVO: ven todas las del scope que les corresponde.
- TECNICO: sólo las que él creó.
- CLIENTE / CLIENTE_PERFILADO: sin acceso (403).

**Encabezado.** "Contingencias — Gestión de mantenciones preventivas y correctivas".

**Tabs de estado.** Tres tabs con conteo en vivo: "Abiertas ({N})", "En progreso ({N})", "Cerradas ({N})". El tab por defecto muestra todas.

**Botón Nueva contingencia** (MAESTRO / OPERATIVO / TECNICO): abre modal de creación.

**Tabla.** Columnas: Código (ej. "OT-2024-001"), Planta (link al detalle de planta + portafolio en gris), Tipo (chip), Descripción (extracto), Estado (chip de color), Costo (CLP o "—"), Proveedor, Creada (fecha), Acciones (menú ⋮).

**Filtros.** Tipo (Preventiva / Correctiva / Todas) y Planta.

**Estado vacío.** Icono ✓ + "Sin contingencias registradas. Todas las plantas operan con normalidad…".

### 10.2 Crear contingencia

Modal con los siguientes campos:
- **Planta** (autocompletable, obligatorio).
- **Código** (libre, opcional, ej. "OT-2024-001").
- **Tipo** (Preventiva / Correctiva, obligatorio).
- **Descripción** (texto multilínea, obligatorio).
- **Costo (CLP)** (numérico, opcional).
- **Proveedor** (texto, opcional).
- **Trabajo realizado** (texto multilínea, opcional).
- **Adjunto** (drag-and-drop o clic; un único archivo de hasta 20 MB).

Al confirmar, la contingencia se crea con estado **Abierta**. Aparece toast de éxito.

### 10.3 Detalle de contingencia

**Ruta.** `/contingencies/{contingencyId}`

**Encabezado.** Migaja "Contingencias / Detalle" + título "Contingencia — {Planta}" + subtítulo con tipo, código y autor + chip de estado a la derecha + botón **Acciones** (si el usuario tiene permiso de escritura y la contingencia no está cerrada).

**Layout de dos columnas.**

**Columna izquierda.**
- Tarjeta **Descripción** con el texto completo.
- Tarjeta **Información**: Planta (link), Ubicación (si existe), Creada por, Fecha de creación, Fecha de cierre (si aplica).

**Columna derecha (si aplica).**
- Tarjeta **Costos y proveedor**.
- Tarjeta **Trabajo realizado**.

**Sección inferior.**
- **Adjunto único:** muestra el archivo subido con icono, nombre, tamaño y botones **Abrir / Descargar / Eliminar**. Si no hay adjunto, aparece la zona de drop. Subir un nuevo archivo reemplaza al anterior.
- **Hilo de comentarios** ordenado cronológicamente: avatar, nombre, chip de rol, fecha, texto. Caja de redacción + botón **Enviar** (atajo Ctrl/Cmd + Enter). Si la contingencia está cerrada, la caja se deshabilita con texto "Sin poder comentar en contingencia cerrada".

### 10.4 Transiciones de estado

Botón **Acciones** desplegable (sólo si la contingencia no está cerrada y el usuario tiene permiso):
- Si está **Abierta** → opción **Marcar en progreso**.
- Si está **En progreso** → opción **Cerrar contingencia**.
- Si está **Cerrada** → el botón no aparece.

Toast de confirmación al cambiar de estado.

### 10.5 Listado scoped por portafolio

**Ruta.** `/{portfolioId}/contingencies` — misma UI que la global, pero filtrada al portafolio actual.

**Listado scoped por planta.** `/{portfolioId}/power-plants/{plantId}/contingencies` — muestra sólo las contingencias de esa planta. Mismas reglas de creación y permisos.

---

## 11. Módulo: Facturas y reportes (Billing)

Concentra toda la facturación electrónica que S-Invest emite a sus clientes vía **Duemint**. Cada factura puede llevar embebida en su glosa un enlace al reporte técnico de **Delta Plus**, lo que permite que la factura quede vinculada a un reporte de generación.

### 11.1 Vista global de billing

**Ruta.** `/billing`

**Acceso.** MAESTRO (lectura + acciones), OPERATIVO (lectura), CLIENTE (sólo facturas de su cliente), CLIENTE_PERFILADO (sólo de sus plantas autorizadas).

**Encabezado.** "Facturas y reportes — {N} facturas · {Periodo}" o "Buscando '{N° factura}'".

**KPIs (4 tarjetas).**
- **Pagadas** (verde): total CLP + cantidad.
- **Por vencer** (naranjo): facturas no vencidas.
- **Vencidas** (rojo): pasaron la fecha de vencimiento.
- **Notas de crédito** (gris).

**Barra de filtros.**
- Botón **Filtros** con badge de cantidad de filtros activos.
- Chips con los filtros aplicados (ej. "Enero 2025", "Vencidas", "Planta A").
- Botón **Sincronizar** (sólo MAESTRO).
- Botón **Importar factura** (sólo MAESTRO).

**Tabla.**
Columnas: N° Factura, Cliente (con RUT en tooltip), Planta (del reporte vinculado), Emisión, Vencimiento, Total (CLP), Estado (chip), Periodo del reporte, Generación (kWh), CO₂ evitado (ton), Acciones.

- Filtro por defecto: mes y año actuales.
- Si se busca por número de factura, los demás filtros se ignoran.
- Paginación: 15, 50 o 100 por página.

**Acciones por fila (menú ⋮).**
- **Actualizar estado** (sólo si la factura no está pagada): re-consulta a Duemint y actualiza estado/montos/reporte vinculado.
- **Ver en Duemint**: link externo al portal Duemint.
- **Descargar PDF**: descarga directa.
- **Ver reporte**: abre el PDF original del reporte.
- **Ver nuevo reporte**: abre `/report/{duemintId}` en una pestaña nueva.

### 11.2 Modal Filtros

- **N° Factura** (texto): si se llena, ignora todos los demás filtros.
- **Periodo:** toggle entre **Mes** (un solo mes con dropdowns mes + año) y **Rango** ("Desde" + "Hasta", cada uno con mes + año).
- **Estado:** Todas / Pagadas / Por vencer / Vencidas / Notas de crédito.
- **Planta** (en vista de portafolio): autocompletable.
- **Cliente** (oculto para CLIENTE/CLIENTE_PERFILADO).
- Botones **Limpiar** y **Aplicar**.

### 11.3 Sincronizar facturas (MAESTRO)

Modal **Sincronizar desde**:
- Campo **Fecha** (YYYY-MM-DD), por defecto el 1° del mes actual.
- Al hacer clic en **Sincronizar**, el sistema:
  1. Consulta Duemint por todas las facturas emitidas desde esa fecha en cada portafolio (o sólo el activo si está en vista scoped).
  2. Para cada factura, actualiza el registro local; matchea el cliente por RUT normalizado.
  3. Si la glosa contiene un link a Delta Plus, busca el reporte y crea/actualiza el `GenerationReport` correspondiente.
- Al terminar muestra un resumen con conteos: facturas creadas / actualizadas / saltadas, reportes creados / actualizados / saltados, y un listado de errores si los hubo.

### 11.4 Importar factura puntual (MAESTRO)

Modal en 3 pasos:
1. **Buscar:** el usuario ingresa el ID Duemint de la factura y hace clic en **Buscar factura**.
2. **Vista previa:** el sistema consulta Duemint y muestra los datos sin guardar nada todavía: N°, Cliente, Estado, Emisión, Vencimiento, Total, Por cobrar.
   - Si el RUT del cliente coincide con uno existente: alerta verde "Cliente encontrado: {nombre}".
   - Si no: alerta roja "No hay cliente asociado al RUT" e instrucciones para crear el cliente primero.
3. **Confirmación:** el botón **Confirmar importación** queda habilitado sólo si hay match de cliente. Al confirmar, la factura queda guardada y el modal vuelve al paso 1 listo para otra importación.

### 11.5 Vista scoped por portafolio

**Ruta.** `/{portfolioId}/billing`

Igual que la global pero limitada al portafolio. La sincronización envía el `portfolioId` y sólo afecta a ese portafolio. El filtro **Planta** lista todas las plantas del portafolio.

---

## 12. Administración: Usuarios

**Ruta.** `/admin/users` (sólo MAESTRO).

### 12.1 Listado

**Encabezado.** "Usuarios — {N} usuarios encontrados".

**Filtros.**
- Búsqueda en tiempo real (debounce 350 ms) sobre nombre y correo.
- **Rol**: Todos / Maestro / Cliente / Cliente Perfilado. (No incluye OPERATIVO ni TECNICO.)

**Tabla.** Columnas: Nombre, Email, Teléfono, Cargo, Rol (chip de color), Cliente / Portafolio asociado, Último acceso, Creado, Acciones (menú ⋮).

- Orden por defecto: Nombre ascendente.
- Paginación: 15, 25, 50 (default 15).

**Estado vacío.** "Ningún usuario coincide con los filtros aplicados".

### 12.2 Crear usuario (botón Nuevo usuario)

Modal con los siguientes campos:

- **Alerta informativa azul:** "Se enviará un correo de invitación para que el usuario active su cuenta y defina su contraseña".
- **Nombre completo** (obligatorio, mínimo 2 caracteres).
- **Correo electrónico** (obligatorio, debe ser único).
- **Rol** (obligatorio): Maestro, Cliente, Cliente Perfilado.

**Campos condicionales según rol.**
- **CLIENTE / CLIENTE_PERFILADO** → exige seleccionar un **Cliente** (autocompletable, muestra nombre + RUT).
- **CLIENTE_PERFILADO** → además, exige seleccionar **Plantas visibles** (multi-select, sólo lista las plantas del cliente seleccionado). Si el cliente no tiene plantas activas, muestra el mensaje "Este cliente no tiene plantas".

**Al confirmar.**
1. El sistema valida los requisitos por rol.
2. Genera el link de invitación de Supabase (válido 1 hora).
3. Crea el usuario en la base de datos con su scope (sus permisos sobre clientes/plantas/portafolios).
4. Envía el correo de invitación vía Resend.
5. Toast: "Invitación enviada a {email}" si todo salió bien, o "Usuario creado. No se pudo enviar el correo de invitación" si falló el envío (la cuenta queda igual creada).
6. Registra la acción en `AuditLog` (acción `CREATE_USER`).

Errores comunes:
- Correo ya existente: "Ya existe un usuario con este correo".
- Para CLIENTE_PERFILADO, si las plantas seleccionadas no pertenecen al cliente elegido, el sistema rechaza el alta.

### 12.3 Editar usuario (acciones por fila → Editar)

Modal con los mismos campos que el alta + Teléfono y Cargo. El correo es **no editable** (lectura). Al cambiar el rol se limpian todos los scopes para evitar inconsistencias. Para usuarios TECNICO existentes el modal muestra un multi-select de portafolios; para OPERATIVO un único portafolio asignado.

Al guardar: toast "Usuario actualizado", registro en auditoría, refresco de la página.

### 12.4 Eliminar usuario (acciones por fila → Eliminar)

Modal de confirmación: "¿Eliminar a {nombre}? Perderá acceso al sistema."

- El sistema **no permite eliminar la propia cuenta**. Si el MAESTRO intenta hacerlo, recibe el error "No puedes eliminar tu propio usuario".
- El borrado es lógico (`active = 0`); el usuario pierde acceso pero su histórico se preserva.

---

## 13. Administración: Clientes y contactos

**Ruta.** `/admin/customers` (sólo MAESTRO crea/edita; los demás roles autenticados pueden listar).

### 13.1 Listado

**Filtros.** Búsqueda por nombre, RUT o nombre alternativo (debounce 350 ms).

**Tabla.** Razón Social, RUT (formateado "76.123.456-7"), N° de plantas, N° de usuarios, Acciones.

Paginación: 10, 25, 50 (default 25).

### 13.2 Crear cliente

Modal con campos: **Razón social** (obligatorio, máx. 200 caracteres), **RUT** (obligatorio, debe ser único), **Nombre alternativo** (opcional).

Al confirmar: toast "Cliente creado exitosamente" + refresco.
Si el RUT ya existe: error 409 con mensaje.

### 13.3 Editar cliente

Mismos campos. Toast "Cliente actualizado".

### 13.4 Contactos del cliente (Drawer lateral)

Acción por fila → **Contactos** abre un panel lateral derecho de 520 px con:
- Encabezado: "CONTACTOS — {Nombre del cliente}" + botón **Agregar contacto**.
- Tabla de contactos: Nombre, Cargo, Email, Teléfono, Acciones (Editar / Eliminar).
- Estado vacío: "Sin contactos registrados — Agregar primer contacto".

**Crear / editar contacto.** Modal con: Nombre completo (obligatorio), RUT (opcional), Cargo (opcional), Teléfono (opcional), Email (opcional).

**Eliminar contacto.** Confirmación: "¿Eliminar contacto? Se eliminará a {nombre}. Esta acción no se puede deshacer." Borrado lógico.

> Importante: los contactos no son usuarios del sistema. Son personas de referencia del cliente (gerente, contacto comercial, etc.). No tienen credenciales de acceso.

### 13.5 Eliminar cliente

Confirmación: "¿Eliminar a {nombre}? Esta acción no se puede deshacer". Borrado lógico.

---

## 14. Administración: Portafolios y cuentas bancarias

**Ruta.** `/admin/portfolios` (sólo MAESTRO).

### 14.1 Listado

**Tabla.** Nombre (link al overview del portafolio), Descripción, ID Tributario (RUT), País, N° de plantas.

Estado vacío: ícono de edificio + "Crea un portafolio para agrupar plantas solares por cliente o proyecto de inversión." + botón **Nuevo portafolio**.

### 14.2 Crear portafolio

Modal con dos secciones:

**Sección Portafolio.**
- **Nombre** (obligatorio, máx. 200).
- **Descripción** (multilínea, opcional).
- **ID Tributario (RUT)** y **País** en grilla (opcionales; país por defecto "Chile").
- **Contacto** (texto libre, opcional).

**Sección Cuenta Bancaria** (opcional como bloque, pero **todo o nada** internamente).
- Nombre titular y RUT (grilla).
- Banco y Tipo de cuenta (grilla).
- Número de cuenta y Email comprobantes (grilla; el email es opcional incluso si los demás están llenos).

**Validación.** Si el usuario completa cualquier campo bancario, los demás (excepto el email de comprobantes) se vuelven obligatorios. Si están incompletos, toast: "Completa todos los campos obligatorios de la cuenta bancaria".

Al confirmar: crea la cuenta bancaria si corresponde, crea el portafolio, registra auditoría, refresca lista.

### 14.3 Editar portafolio

Mismos campos + **Duemint Company ID** (opcional, sólo en edición). Si el portafolio ya tiene cuenta bancaria, la edición la actualiza; si no, la crea.

### 14.4 Eliminar portafolio

Confirmación: "¿Eliminar {nombre}? Esta acción no se puede deshacer". Borrado lógico.

> **Implicancia operativa.** Sin `Duemint Company ID` en el portafolio, la sincronización automática y la importación manual de facturas desde Duemint no funcionan para ese portafolio.

---

## 15. Flujos extremo a extremo

### 15.1 Onboarding de un cliente nuevo (S-Invest internal)

1. **Crear el cliente** en `/admin/customers` (Razón social + RUT).
2. **Verificar el portafolio** al que pertenecerán sus plantas. Si es nuevo, crearlo en `/admin/portfolios` con cuenta bancaria y Duemint Company ID.
3. **Cargar las plantas** del cliente (este flujo se hace hoy via scripts/seed; vía UI sólo se editan datos existentes — confirmar con el equipo de operaciones).
4. **Crear el usuario CLIENTE** en `/admin/users`:
   - Rol = Cliente (visión total) o Cliente Perfilado (subset).
   - Asociar al cliente recién creado.
   - Para CLIENTE_PERFILADO, marcar las plantas que verá.
5. **El cliente recibe el correo de invitación**, hace clic en **Activar mi cuenta**, define su contraseña y entra al dashboard.
6. **Onboarding del cliente:** ya autenticado, ve sus plantas en el resumen y el sidebar le muestra Resumen general · Plantas · Facturas y reportes.

### 15.2 Sincronización diaria de facturas (automática)

Todos los días a las **09:00 hora Chile (13:00 UTC)** Vercel Cron dispara una sincronización que:
1. Recorre todos los portafolios activos con `Duemint Company ID`.
2. Pide a Duemint las facturas emitidas desde "ayer".
3. Para cada factura: identifica al cliente por RUT, actualiza la factura local, y si la glosa lleva un link de Delta Plus, ingiere el reporte de generación.
4. Publica un resumen del run en una hoja de Google.

**El MAESTRO no necesita hacer nada para esto**; sólo debe revisar la pestaña de billing al día siguiente. Si algún día la sincronización fue parcial (por ejemplo Duemint estuvo caído), puede correr una sincronización manual desde `/billing` con el botón **Sincronizar**.

### 15.3 Importación puntual de una factura

Cuando una factura específica no apareció (ej. fue emitida fuera del rango de la última corrida o el RUT no matcheó):
1. Asegurarse de que el `Customer` exista con el RUT correcto.
2. Ir a `/billing` → **Importar factura**.
3. Pegar el `duemintId` de la factura → **Buscar factura**.
4. Verificar la previsualización; si el RUT está OK, confirmar.

### 15.4 Carga manual de un reporte de generación PDF

Cuando un cliente requiere un reporte que no llegó por Delta Plus (por ejemplo reportes históricos o de plantas sin integración):
1. El MAESTRO obtiene el PDF (≤ 10 MB).
2. Carga el PDF asociándolo a una planta + período (mes y año) + kWh declarados.
3. El sistema:
   - Calcula automáticamente el CO₂ evitado (kWh × factor de emisión SIC).
   - Sube el PDF a Supabase Storage en `generation-reports/generation/{plantId}/{yyyy-mm}.pdf`.
   - Crea el `GenerationReport` y lo registra en auditoría.

> No es posible cargar dos reportes activos para la misma planta y mismo periodo. Si ya existe, hay que eliminar el anterior antes de cargar uno nuevo.

### 15.5 Gestión de una contingencia correctiva

1. El equipo (MAESTRO u OPERATIVO) detecta una falla en una planta.
2. Va a `/contingencies` → **Nueva contingencia**.
3. Selecciona la planta, tipo **Correctiva**, descripción, costo estimado, proveedor; adjunta evidencia.
4. La contingencia se crea **Abierta**.
5. Cuando el técnico empieza el trabajo, abre el detalle y la marca **En progreso**.
6. Durante la intervención, deja comentarios y adjuntos del avance.
7. Al cerrar la intervención, completa el campo "Trabajo realizado" y la marca **Cerrada**.
8. Una vez cerrada, el hilo de comentarios queda bloqueado.

### 15.6 Cambio de portafolio activo (MAESTRO)

1. Topbar → dropdown del portafolio.
2. Selecciona otro portafolio.
3. Si está en una ruta scoped (ej. `/42/billing`), la URL se reescribe a `/{nuevo}/billing` y se muestra el toast de cambio.
4. Si está en una ruta general (ej. `/dashboard`), la página se refresca con el contexto del nuevo portafolio.

---

## 16. Procesos automáticos del sistema

| Proceso | Cuándo se ejecuta | Qué hace |
|---|---|---|
| **Cron de sincronización Duemint** | Todos los días, 09:00 SCL | Sincroniza facturas desde el día anterior y reportes Delta Plus enlazados |
| **Webhook de Duemint** | Cada vez que Duemint emite un evento | Hoy sólo deja un registro en `WebhookLog` (no procesa cambios) — el sync diario es la fuente de verdad |
| **Registro de último acceso** | Cada login exitoso | Actualiza `User.lastLoginAt` |
| **Auditoría** | En operaciones clave (alta/edición/baja de usuarios, subida de reportes) | Inserta una fila en `AuditLog` con acción + entidad + metadatos |
| **Cálculo de CO₂** | Al subir un reporte manual | `kWh / 1000 × factor SIC` (toneladas CO₂) |

---

## 17. Casos límite y mensajes de estado

### 17.1 Acceso

- **Cliente con cero plantas asignadas:** entra al dashboard pero las tarjetas y tablas aparecen vacías. El sidebar sigue mostrando "Plantas" pero la tabla dice "Las plantas solares que gestiones aparecerán aquí".
- **MAESTRO sin portafolios creados:** la pantalla `/select-portfolio` aparece sin opciones; no se puede continuar. Hay que crear al menos un portafolio activo desde `/admin/portfolios`.
- **Sesión expirada:** en la siguiente acción el sistema redirige silenciosamente a `/login`. La cookie del portafolio activo permanece, así que al volver a entrar el MAESTRO mantiene el contexto.

### 17.2 Notas de crédito

- En la tabla de billing aparecen con el chip "Documento" y se contabilizan en la tarjeta KPI "Notas de crédito".
- El sistema **no** intenta extraer reporte Delta Plus de una nota de crédito.

### 17.3 Facturas sin cliente matcheado

Si el RUT de la factura en Duemint no coincide con ningún `Customer` activo en S-Invest, la factura **no se importa** durante la sincronización. Aparece en el resumen del cron como "saltada". Para resolverlo:
1. Crear o corregir el cliente en `/admin/customers`.
2. Ir a `/billing` → **Sincronizar** desde la fecha de emisión, o **Importar factura** con el `duemintId`.

### 17.4 Reporte sin planta vinculada

Si el reporte Delta Plus existe pero no se puede asociar a una planta (porque el alias/`PlantName` no está cargado), la columna "Planta" en billing aparece como "—". El reporte sigue siendo navegable en el visor.

### 17.5 Contingencia cerrada

Una vez en estado **Cerrada**, no se puede:
- Comentar (el textarea aparece deshabilitado con explicación).
- Subir ni eliminar adjuntos.
- Cambiar el estado (el botón **Acciones** desaparece).

Si fue un cierre erróneo, el MAESTRO debe corregirlo a nivel de base de datos (no hay UI para reabrir).

### 17.6 Adjuntos

- Tamaño máximo: **20 MB** para contingencias, **10 MB** para reportes PDF de generación.
- Sólo se permite **un adjunto por contingencia**; subir uno nuevo reemplaza al anterior.

### 17.7 Validaciones de contraseña

Tanto en `set-password` como en cambio desde la sesión, las cuatro reglas son **innegociables**: 8 caracteres mínimo, mayúscula, minúscula y número. El checklist en pantalla se va marcando en verde mientras se cumplen.

---

## 18. Glosario rápido

| Término | Significado en S-Invest |
|---|---|
| **Portafolio** | Vehículo de inversión que agrupa plantas y maneja una cuenta bancaria. Tiene un `Duemint Company ID` único para emitir facturas. |
| **Cliente** (`Customer`) | Empresa o persona dueña/futura dueña de las plantas. Identificado por RUT. **No** es un usuario del sistema. |
| **Usuario** (`User`) | Cuenta de acceso (email + contraseña). Asociada a un cliente o a un portafolio según rol. |
| **Contacto** | Persona de referencia del cliente (gerente, encargado). No tiene login. |
| **Planta** (`PowerPlant`) | Instalación fotovoltaica física. Pertenece a un portafolio y a un cliente. |
| **EPC** | Empresa que construyó la planta (Engineering, Procurement & Construction). |
| **Contingencia** | Evento de mantenimiento (preventivo o correctivo). |
| **Factura** (`Invoice`) | Documento tributario emitido vía Duemint. Su glosa puede llevar el link al reporte Delta Plus. |
| **Reporte de generación** (`GenerationReport`) | Registro mensual por planta con kWh y CO₂. Origen: Delta Plus automático o PDF manual. |
| **Delta Plus** | Proveedor externo que entrega los reportes técnicos. Se accede vía la URL embebida en la factura. |
| **Duemint** | Plataforma de facturación electrónica chilena con la que S-Invest emite las facturas. |
| **SOLCOR ID** | Identificador externo (SEC/CEN) de la planta. |
| **PlantName (alias)** | Nombre alternativo con que aparece la planta en los reportes Delta Plus, usado para hacer el match. |
| **Soft delete** | Convención del sistema: nada se borra de verdad. Se marca `active = 0` para preservar trazabilidad. |
| **Portafolio activo** | El portafolio que el MAESTRO tiene seleccionado en el topbar. Se guarda en cookie por 30 días. |

---

> **¿Cómo capacitar a un cliente con este manual?** Las secciones recomendadas para una sesión de onboarding del CLIENTE final son: §3 (acceso), §4 (estructura general), §5.2 (su dashboard), §7 (sus plantas), §8 (sus reportes), §9 (cómo leer un reporte Delta Plus) y §11 (cómo consultar y descargar facturas). Las secciones §12–§14 son exclusivas del equipo MAESTRO y no se incluyen en la inducción del cliente.
