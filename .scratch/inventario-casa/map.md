# Stock de la casa

Label: `wayfinder:map`

## Destination

Un **MVP funcionando en el celular**: PWA de **una casa**, usada **solo por vos**, que muestra el **stock actual** (un envase por línea), **marca lo que vence o está por vencer**, y deja **armar la compra del mes a mano**. Sin recetas, sin nube y sin backup.

## Notes

- Dominio: inventario doméstico de la **compra grande** (comida, bebida, higiene).
- Skills: `/grilling`, `/domain-modeling`, `/prototype`, `/research`. Este mapa **planifica**; no implementa. Al cerrarse, handoff a `/to-spec` y después construir el MVP.
- Tracker: markdown local en `.scratch/inventario-casa/`.
- Preferencias ya acordadas en el charting (no reabrirlas salvo que cambie el destino):
  - Web simple / PWA, práctica en el día a día.
  - Ritmo: cargar después de la compra; tachar cuando se acaba; mirar vencimientos en la app (marca visual, no push).
  - Catálogo de **ítems** que se construye usándolo (el segundo mes se elige “banana”); **envase** con lugar y fecha opcionales.
  - Lugar: lista parametrizable y **opcional** (recordatorio, no requisito).
  - Vencimiento: fecha **opcional**; marca “por vencer” en una ventana parametrizable (default 7 días); “vencido” si la fecha pasó.
  - Vida útil opcional **en el ítem** (frutas/verduras): al cargar un envase sin fecha, propone hoy + N días.
  - Compra del mes: no adivina; ves qué se acabó, qué sigue en casa, qué vence, y tildás qué comprar.
  - Datos vivos en **IndexedDB**. Settings en la app (lugares + ventana de vencimiento). Sin JSON en el repo como store. Sin backup en este MVP.
  - UI en español.

## Decisions so far

- [Persistencia PWA en el celular](.scratch/inventario-casa/issues/01-persistencia-pwa-en-el-celular.md) — IndexedDB sin backup solo es usable en iOS como Home Screen web app (`standalone` + `persist()`); en Chrome Android el ícono no aísla datos y “limpiar Chrome” los borra.

## Not yet specified

- Consumo parcial de un envase (abrir la leche y que “siga existiendo”).
- Categorías o filtros dentro de comida / bebida / higiene.
- Nombre visible del producto.
- Unidades distintas de “un envase” (kg sueltos, atados).
- Qué hacer el día que IndexedDB se borre (el MVP acepta la pérdida; el cómo se siente en la UI puede aparecer después de la investigación de persistencia).

## Out of scope

- “Qué puedo cocinar” / cruce receta ↔ stock.
- Varias casas.
- Multi-usuario (si el MVP conviene, es **otro** mapa).
- Notificaciones push.
- Código de barras, foto, o carga por cámara.
- Mínimos de stock y reposición automática.
- Nube (Supabase u otra): ni datos ni cuenta.
- Exportar / importar backup.
- Archivos JSON en el repo como fuente de verdad.
- Lugar obligatorio para poder guardar un envase.
- App nativa (Store / APK) como requisito de este MVP.
