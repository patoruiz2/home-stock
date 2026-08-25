# Cómo llega la app al teléfono

Type: research
Status: resolved
Blocked by: None — can start immediately

## Question

Sin backend y sin base en la nube, ¿qué formas prácticas hay (2026) de **abrir una PWA estática en el celular** para uso diario — Pages/hosting solo de archivos, red local con la PC, sideload, u otras — y cuáles son los tradeoffs para un MVP de una persona?

## Answer

Para uso diario, el camino práctico es publicar **solo los archivos** de la app en un host con HTTPS (GitHub Pages, Cloudflare Pages o Netlify), abrir esa URL en el celular e instalarla. IndexedDB queda en el teléfono, atado al origen (`https` + hostname + puerto); el host no es una base. HTTP en la IP de la LAN y sideload `file://` no son PWA instalable ni origen estable. El port forwarding USB a `localhost` sirve para desarrollar en Android, no para el día a día.

Investigación: [como-llega-la-app-al-telefono.md](../research/como-llega-la-app-al-telefono.md) en la rama `research/como-llega-la-app-al-telefono`.
