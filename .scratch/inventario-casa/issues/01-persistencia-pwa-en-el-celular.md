# Persistencia PWA en el celular

Type: research
Status: resolved
Blocked by: None — can start immediately

## Question

En iOS (Safari, “Añadir a inicio”) y Android (Chrome), ¿qué hace falta para que **IndexedDB de una PWA** sobreviva en la práctica para un inventario personal **sin backup**? ¿Qué acciones del usuario o del sistema borran esos datos, y qué patrón de instalación (navegador vs ícono en inicio) cambia el riesgo?

## Answer

IndexedDB es `best-effort` salvo `navigator.storage.persist()` (HTTPS); eso solo frena el desalojo automático, no un “borrar datos del sitio”. En iOS, una pestaña/atajo de Safari puede perder el inventario por ITP a los 7 días de *uso de Safari* sin tap; una Home Screen web app (`display: standalone`, “Abrir como app web”) tiene store **aislado** y está **exenta** de ese tope. En Android Chrome, pestaña e ícono **comparten** el perfil: instalar (WebAPK) ayuda a que concedan persistencia, pero limpiar Chrome borra el inventario igual. Sin backup, el dato sigue siendo volátil.

Investigación (fuentes primarias) en `.scratch/inventario-casa/research/persistencia-pwa-en-el-celular.md`, rama `research/persistencia-pwa-en-el-celular`.
