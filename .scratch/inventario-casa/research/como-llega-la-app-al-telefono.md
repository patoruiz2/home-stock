# Cómo llega una PWA estática al teléfono (2026)

**Pregunta.** Sin backend y sin base en la nube, ¿qué formas prácticas hay (2026) de abrir una PWA estática en el celular para uso diario — hosting solo de archivos, red local con la PC, sideload u otras — y cuáles son los tradeoffs para un MVP de una persona?

**Fecha.** 25 de agosto de 2026.

**Alcance.** El inventario vivo vive en IndexedDB en el teléfono. El hosting, si se usa, solo sirve los archivos de la app (HTML/CSS/JS/manifest/service worker). Este documento no recomienda una base de datos en la nube.

**Método.** Fuentes primarias: documentación oficial de GitHub Pages, Cloudflare Pages, Netlify, Chrome, WebKit/Safari y MDN. Cada afirmación enlaza a quien la posee.

---

## Hallazgo principal

Para **uso diario** de una PWA de una persona, el camino práctico es: **publicar los archivos estáticos en un host con HTTPS** (GitHub Pages, Cloudflare Pages, Netlify u equivalente), abrir esa URL en el celular e instalarla (Chrome: Instalar; iOS: Añadir a inicio). Los datos no viajan al host.

La red local por IP HTTP y el sideload de archivos (`file://`) **no** cumplen, a la vez, contexto seguro, instalabilidad y un origen estable para IndexedDB. El port forwarding USB de Chrome hacia `localhost` sí es contexto seguro, pero es un flujo de desarrollo, no de uso diario.

La decisión de *cuál de esos caminos usarás vos en el día a día* queda para el grilling posterior ([Instalación para el uso diario](../issues/05-instalacion-para-el-uso-diario.md)); acá van los hechos.

---

## 1. Archivos de la app vs datos vivos

IndexedDB sigue la política de mismo origen: el origen es **esquema + hostname + puerto**. Cada origen tiene su propio conjunto de bases. `https://ejemplo.com/app/` y `https://ejemplo.com/otra/` **comparten** IndexedDB; `http://` vs `https://`, o un hostname distinto, o un puerto distinto, **no**. ([MDN — IndexedDB terminology](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology); [MDN — Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin))

Consecuencia para este MVP: si cambiás de `http://192.168.0.12:8080` a `https://usuario.github.io/inventario-casa/`, o de un sitio de proyecto de Pages a un dominio custom, el inventario **no se mueve**. Elige un origen y quédate ahí.

Los archivos publicados en GitHub Pages son **públicos en internet**, incluso si el repositorio es privado (cuando el plan lo permite). GitHub lo advierte explícitamente y desaconseja Pages para transacciones sensibles. ([GitHub — Securing Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https); [GitHub — Creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)) Eso no pone el stock en la nube: el stock está en IndexedDB. Lo público es el código de la app.

---

## 2. Qué exige el navegador para que “sea una PWA”

### 2.1 Contexto seguro y service workers

Los service workers **solo** están disponibles en contextos seguros: el documento se sirve por HTTPS. Los navegadores también tratan `http://localhost` como contexto seguro para desarrollo. ([MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API); [Chrome Workbox — lifecycle](https://developer.chrome.com/docs/workbox/service-worker-lifecycle): “Service workers are only available over HTTPS or localhost.”)

MDN, para **probar** service workers, nombra hosts estáticos con HTTPS: GitHub, Netlify, Vercel, etc., y `localhost`. ([MDN — Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers))

Un contexto seguro, para recursos no locales, exige `https://`. Los orígenes **potencialmente confiables** locales son `http://127.0.0.1`, `http://localhost` y `http://*.localhost`. `file://` **en general** también se considera potencialmente confiable, pero eso **no** alcanza para instalar una PWA. ([MDN — Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts))

La instalabilidad de PWA es **más estricta** que el contexto seguro: hay que servirla con `https`, o desde `localhost` / `127.0.0.1` (con o sin puerto). MDN lo contrapone a `file://`, que sí puede ser contexto seguro y **aun así no** es instalable. ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable))

Un `http://192.168.x.x` en la LAN **no** entra en esa lista. Tampoco `http://10.0.2.2` (el alias del emulador Android hacia la PC): Android documenta que ese host **no** es contexto seguro, y por eso service workers y otras APIs no están disponibles; `adb reverse` y el port forwarding de Chrome DevTools sí, porque el teléfono habla con `localhost`. ([Android — Access a local development server from WebView](https://developer.android.com/develop/ui/views/layout/webapps/access-local-server))

### 2.2 Instalar en Android (Chrome)

Chrome considera instalable un manifiesto con, como mínimo: `short_name` o `name`; iconos de 192×192 y 512×512; `start_url`; `display` en `fullscreen`, `standalone` o `minimal-ui`; y `prefer_related_applications` distinto de `true`. Cuando se cumple, Chrome dispara `beforeinstallprompt`. ([Chrome Lighthouse — installable manifest](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest); [web.dev — Add a web app manifest](https://web.dev/articles/add-manifest))

Desde Chrome 108 en móvil (112 en escritorio), **instalar desde el menú** ya no exige un service worker con `fetch()`. El prompt automático de instalación **sí** sigue exigiendo un handler `fetch` por ahora. ([Chrome — Revisiting installability criteria](https://developer.chrome.com/blog/update-install-criteria))

Chrome en Android también permite instalar **cualquier sitio** como app, con o sin manifiesto; el manifiesto hace que el navegador **promueva** la instalación. En Android instalan PWA: Chrome, Edge, Opera, Samsung Internet y Firefox. ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable))

Para uso diario en el supermercado (sin red), un service worker que cachee los archivos de la app sigue siendo el mecanismo documentado de offline; IndexedDB no sustituye eso. WebKit, de hecho, aclara que las Home Screen web apps en iOS **nunca exigieron** service workers, pero incluirlos mejora la experiencia. ([WebKit — Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/))

### 2.3 Instalar en iOS (Safari / Añadir a inicio)

Hasta iOS 16.3, solo Safari podía añadir a inicio. Desde iOS 16.4, los navegadores de terceros con el entitlement de browser pueden ofrecer “Add to Home Screen” en el Share menu, y hace falta que el `WKWebView` esté mostrando un documento con URL **HTTP o HTTPS**. ([WebKit — Web Push for Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable))

Hasta iOS 18, un sitio con manifiesto `display: standalone` o `fullscreen` (o el meta `apple-mobile-web-app-capable`) se abría como web app al tocarlo en inicio; si no, era un bookmark que abría el navegador. ([WebKit — Web Push…](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [Apple archive — Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html))

En **iOS 26 / iPadOS 26 (Safari 26.0)** WebKit cambió la regla: **cualquier sitio** añadido a inicio se abre como web app por defecto. El usuario puede desactivar “Open as Web App”. “There are now zero requirements for installability in Safari.” Un manifiesto sigue aportando iconos y el resto de la experiencia. Los service workers siguen siendo opcionales en iOS, no un requisito de instalación. ([WebKit — Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/))

`beforeinstallprompt` **no** está soportado en iOS; no hay prompt programático equivalente al de Chrome. ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable))

---

## 3. Camino A — Hosting solo de archivos (HTTPS)

Este es el camino que MDN cita para “hostear experimentos” con service workers: un estático con HTTPS. ([MDN — Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)) No hay servidor de aplicación ni base remota: HTML, CSS, JS, manifiesto, iconos, service worker.

GitHub Pages **no** soporta lenguajes de servidor (PHP, Ruby, Python). ([GitHub — Creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)) Eso encaja con este MVP.

### 3.1 GitHub Pages

Sirve HTML/CSS/JS desde un repositorio, con build opcional. ([GitHub — About Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages))

| Tipo | URL por defecto |
| --- | --- |
| Sitio de usuario/org (`<owner>.github.io`) | `https://<owner>.github.io` |
| Sitio de proyecto | `https://<owner>.github.io/<repositoryname>` |

Un sitio de usuario/org por cuenta; un sitio de proyecto por repositorio. Se puede usar dominio custom. ([GitHub — About Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages))

**HTTPS.** Todos los sitios de Pages, también con dominio custom bien configurado, soportan HTTPS y “Enforce HTTPS”. Los sitios `github.io` creados después del 15 de junio de 2016 se sirven por HTTPS automáticamente. ([GitHub — Securing Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https))

**Plan.** GitHub Free para cuentas personales incluye Pages **en repositorios públicos**. GitHub Pro añade Pages en repositorios **privados** de una cuenta personal. Publicar el *sitio* de forma privada (solo gente con acceso al repo) exige organización con GitHub Enterprise Cloud. ([GitHub’s plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans); [GitHub — Creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site): “If the account … uses GitHub Free … the repository must be public.”) En Free, pasar el repo a privado **despublica** el sitio. ([GitHub — Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility))

**Límites (holgados para un MVP):** repo fuente recomendado 1 GB; sitio publicado ≤ 1 GB; ~100 GB/mes de ancho de banda (límite blando); 10 builds/hora si no usás Actions. No está pensado como hosting comercial/SaaS. ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits))

**Piedra en el camino para PWA:** un sitio de *proyecto* vive bajo `/<repo>/`. El `start_url`, el `scope` del manifiesto y el service worker tienen que coincidir con ese path (un `start_url: "/"` apunta al origen `usuario.github.io`, no a la app). Web.dev: un `start_url` que empieza con `/` es siempre la raíz del origen; el scope por defecto es el del manifiesto. ([web.dev — Add a web app manifest](https://web.dev/articles/add-manifest); [Chrome Workbox — scope](https://developer.chrome.com/docs/workbox/service-worker-lifecycle)) Mitigación documentada por GitHub: sitio de usuario (`<owner>.github.io`) o dominio custom, para servir en `/`.

GitHub sirve un `404.html` custom para URLs que no existen; **no** documenta un rewrite SPA `/* → /index.html` como Netlify/Cloudflare. ([GitHub — Custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)) Para este MVP, si no hay rutas profundas recargables, no hace falta.

**Tradeoff (una persona).** Ya estás en git. HTTPS gratis. En Free el repo de la app queda público y el sitio también. El path `/repo/` es el error más caro porque rompe SW/manifiesto. Cero auth en el sitio (el código es público).

### 3.2 Cloudflare Pages

Plataforma para desplegar frontend desde Git (GitHub o GitLab, repos públicos **y** privados), Direct Upload, o CLI. No hace falta framework: se puede dejar el build command vacío. El nombre de proyecto genera el hostname (`*.pages.dev`). ([Cloudflare — Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/))

**HTTPS.** La página de producto de Pages afirma SSL de fábrica: “Always secure: SSL works out of the box”. ([Cloudflare Pages](https://pages.cloudflare.com/)) En el plan Free: unlimited static requests y unlimited bandwidth; 500 builds/mes; 20 000 archivos; 25 MiB por archivo. ([Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/); [Cloudflare Pages](https://pages.cloudflare.com/))

**SPA.** Un archivo `_redirects` en el output permite rewrites/proxy, p. ej. status `200`. ([Cloudflare Pages — Redirects](https://developers.cloudflare.com/pages/configuration/redirects/))

**Visibilidad.** Los preview deployments son públicos por defecto; se pueden poner detrás de Cloudflare Access (cuenta Cloudflare). Eso **no** cubre el `*.pages.dev` de producción ni un dominio custom: hay que configurar Access a mano. ([Cloudflare Pages — Preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/); [Cloudflare Pages — Known issues](https://developers.cloudflare.com/pages/platform/known-issues/)) Access protege **quién baja los archivos**, no es una base de datos.

**Tradeoff (una persona).** HTTPS y path en `/` sin pelear con `/repo/`. Podés conectar un repo privado. Access es opcional y más trabajo; para un inventario personal cuyo secreto está en el teléfono, suele sobrar. Cuenta extra además de GitHub.

### 3.3 Netlify

Publicar un proyecto existente: Git remoto, **drag-and-drop** de una carpeta en [app.netlify.com/drop](https://app.netlify.com/drop), CLI o API. El drop publica en una URL `*.netlify.app`. ([Netlify — Choose your path](https://docs.netlify.com/start/overview/))

**HTTPS.** HTTPS gratis en todos los sitios, certificados gestionados y renovados. La URL `*.netlify.app` queda segura al crear el sitio; un dominio custom obtiene certificado Let’s Encrypt. ([Netlify — HTTPS (SSL)](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/))

**SPA.** Rewrite documentado: `/*  /index.html  200`. ([Netlify — Rewrites and proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/))

**Visibilidad (planes credit-based Free/Personal/Pro).** Un proyecto puede ser public, private (login de equipo Netlify) o password-protected. En Free/Personal, private solo lo ve el Team Owner. Password está en Pro. Los proyectos nuevos pueden nacer privados según el default del team. Un proyecto private no es alcanzable sin autenticarse. ([Netlify — Project visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility); [Netlify — Password Protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection))

**Tradeoff (una persona).** El Drop es el camino más corto “carpeta → URL HTTPS” sin cablear CI. Private-by-default oculta el JS de miradas casuales, a costa de un login Netlify cada vez que el celular no tenga sesión (malo para “abrir y tachar leche”). Para uso diario conviene producción **pública** (archivos) y datos solo en IndexedDB, o aceptar el rozamiento del login.

### 3.4 Comparación para este MVP

| | GitHub Pages | Cloudflare Pages | Netlify |
| --- | --- | --- | --- |
| Qué hostea | Archivos estáticos | Archivos estáticos | Archivos estáticos |
| HTTPS | Automático en `github.io`; Enforce HTTPS | SSL de fábrica | Certificado al crear el sitio |
| Repo | Free: público. Pro: también privado. El **sitio** sigue público salvo Enterprise Cloud | Público o privado | Independiente del repo |
| Path | Proyecto: `/repo/`. Usuario o custom: `/` | `/` en `*.pages.dev` | `/` en `*.netlify.app` |
| SPA rewrite | No de primera; solo `404.html` | `_redirects` | `/* → /index.html 200` |
| Ocultar archivos | No (sitio público) | Access extra | Private/password según plan |
| Esfuerzo 1 persona | Bajo si el repo ya es el de la app | Bajo + cuenta CF | Más bajo con Drop |

Ninguno de los tres es una base remota. El celular habla con ellos solo para bajar (o actualizar) la app.

---

## 4. Camino B — Red local con la PC

Idea: la PC sirve los archivos; el teléfono los abre por Wi‑Fi.

### 4.1 HTTP a la IP de la PC (`http://192.168.x.x:puerto`)

Ese origen **no** es `https`, ni `localhost`, ni `127.0.0.1`. No es contexto seguro → no hay service worker. ([MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API); [MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)) No es un camino de PWA instalable para el día a día.

Además el hostname es la IP: si el DHCP la cambia, el origen cambia y IndexedDB queda en el origen viejo. ([MDN — Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin)) La PC tiene que estar encendida y en la misma red; en el súper no hay app.

### 4.2 Port forwarding USB (Chrome en Android)

Chrome DevTools puede mapear un puerto del teléfono a `localhost:puerto` de la PC por USB. El tráfico va por el cable, no por Wi‑Fi. En el teléfono abrís `http://localhost:<puerto>`. ([Chrome — Port forwarding](https://developer.chrome.com/docs/devtools/remote-debugging/local-server); [Chrome — Remote debugging](https://developer.chrome.com/docs/devtools/remote-debugging))

`localhost` **sí** es contexto seguro e instalable. ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)) Android recomienda este patrón (o `adb reverse`) frente a `10.0.2.2` precisamente por el contexto seguro. ([Android — Access a local development server](https://developer.android.com/develop/ui/views/layout/webapps/access-local-server))

**No es uso diario:** hace falta USB debugging, cable (o adb por Wi‑Fi), `chrome://inspect` y la PC levantada. Sirve para desarrollar en el teléfono, no para tachar envases en la cocina.

### 4.3 iPhone por LAN

No hay equivalente de primera parte a “port forwarding a localhost” como el de Chrome DevTools. “Add to Home Screen” en browsers de terceros exige URL HTTP/HTTPS en el web view. ([WebKit — Web Push…](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)) Servir HTTPS en la LAN implicaría un certificado que iOS confíe: fuera de la documentación de producto de Safari/Pages. Operativamente es más caro que un `*.pages.dev`.

---

## 5. Camino C — Sideload

### 5.1 Abrir HTML desde Archivos (`file://`)

MDN: `file://` puede ser contexto seguro, **pero la instalabilidad de PWA exige** `https` / `localhost` / `127.0.0.1`. ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)) Los service workers se documentan para HTTPS y `localhost`, no para `file://`. ([MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API); [Chrome Workbox](https://developer.chrome.com/docs/workbox/service-worker-lifecycle))

Las URLs `file:` **suelen** tratarse como orígenes opacos (`null`), para que un archivo local no lea a otro. Un origen opaco no es igual a ningún otro origen, ni a otros opacos. ([MDN — Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin)) IndexedDB de un inventario no tiene un origen estable en ese modelo.

En iOS 16.4+, Add to Home Screen desde un browser de terceros exige documento HTTP o HTTPS. Un archivo local no califica. ([WebKit — Web Push…](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/))

### 5.2 Empaquetar como app nativa (sideload de APK / store)

MDN describe empaquetar una PWA para Play Store, Microsoft Store, etc. (p. ej. con PWABuilder). ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)) El mapa de este proyecto deja **fuera de alcance** la app nativa (Store / APK) como requisito del MVP. Es un camino más pesado (cuenta de developer, firma, actualización por store o sideload), no hace falta para abrir una PWA estática.

---

## 6. Otras

- **Instalar “cualquier sitio” como app** (Chrome Android/desktop, Safari desktop): baja la barra de manifiesto, pero sigue haciendo falta una URL `https` o localhost. No rehabilita LAN HTTP ni `file://`. ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable); [WebKit — Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/))
- **Cloudflare Access / Netlify private:** candado sobre **quién pide los archivos**, no sobre el inventario. Útil si no querés que el JS esté indexable; en el teléfono implica un login antes de usar la app. ([Cloudflare Pages — Known issues](https://developers.cloudflare.com/pages/platform/known-issues/); [Netlify — Project visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility))
- **Túnel HTTPS hacia la PC** (producto Cloudflare u otro): daría un origen `https` mientras la PC esté online. Sigue atado a la máquina local; no está documentado aquí como camino de uso diario. El host estático desacopla la app de que la PC esté encendida.

---

## 7. Tradeoffs para un MVP de una persona

| Camino | ¿PWA instalable / SW? | Origen estable para IndexedDB | PC encendida | Esfuerzo | Uso diario |
| --- | --- | --- | --- | --- | --- |
| Host estático HTTPS (Pages / CF / Netlify) | Sí, si manifiesto + HTTPS (y SW si querés offline de verdad) | Sí, mientras no cambies hostname/esquema/puerto | No | Bajo | **Sí** |
| HTTP en IP de LAN | No | Frágil (la IP cambia) | Sí, misma Wi‑Fi | Bajo | No |
| USB → `localhost` (Chrome Android) | Sí | Sí (`localhost`) | Sí + cable/adb | Medio | No (dev) |
| `file://` / HTML en Archivos | No instalable | Orígenes opacos | No | Bajo | No |
| APK / Store | Sí, como nativa | Según el wrapper | No | Alto | Fuera de alcance del MVP |
| Sitio private/Access | Igual que el host, **después** del login | Sí | No | Medio | Rozamiento en cada visita |

**Hechos que pesan más para este destino (una casa, solo vos, sin backup, datos en el teléfono):**

1. El host no guarda el stock. Puede ser público. Lo que no querés filtrar no va en el repo.
2. Un origen `https` estable es el requisito compartido de SW, instalación en Chrome, Add to Home Screen en iOS (URL HTTP/HTTPS) e IndexedDB.
3. El path `/repo/` de GitHub Pages de proyecto es el pie que más duele en una PWA. Sitio de usuario, dominio custom, o Cloudflare/Netlify en `/`.
4. LAN y sideload fallan el requisito de instalabilidad o el de origen, o ambos.
5. Offline de los *archivos* = service worker + Cache; offline de los *datos* = IndexedDB. Son capas distintas. iOS no exige SW para ser web app; Chrome/Android, para una experiencia offline real, sí lo documentan.

---

## 8. Qué no cierra este ticket

No elige el camino concreto que vas a usar vos (ícono vs Safari suelto vs otro). Eso es el grilling [Instalación para el uso diario](../issues/05-instalacion-para-el-uso-diario.md), que espera estos hechos y los de persistencia.

Tampoco implementa la app.

---

## Fuentes

- [GitHub — About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [GitHub — Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [GitHub — Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHub — GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub — Creating a custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
- [GitHub — GitHub’s plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)
- [GitHub — Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
- [Cloudflare Pages (producto)](https://pages.cloudflare.com/)
- [Cloudflare Pages — Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages — Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages — Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Cloudflare Pages — Preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Cloudflare Pages — Known issues](https://developers.cloudflare.com/pages/platform/known-issues/)
- [Netlify — Choose your path](https://docs.netlify.com/start/overview/)
- [Netlify — HTTPS (SSL)](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/)
- [Netlify — Rewrites and proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/)
- [Netlify — Project visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility)
- [Netlify — Password Protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection)
- [MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN — Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [MDN — Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)
- [MDN — IndexedDB terminology](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology)
- [MDN — Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin)
- [Chrome Lighthouse — Installable manifest](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest)
- [Chrome — Revisiting installability criteria](https://developer.chrome.com/blog/update-install-criteria)
- [Chrome Workbox — Service worker lifecycle](https://developer.chrome.com/docs/workbox/service-worker-lifecycle)
- [Chrome — Port forwarding](https://developer.chrome.com/docs/devtools/remote-debugging/local-server)
- [Chrome — Remote debugging Android](https://developer.chrome.com/docs/devtools/remote-debugging)
- [web.dev — Add a web app manifest](https://web.dev/articles/add-manifest)
- [Android — Access a local development server from WebView](https://developer.android.com/develop/ui/views/layout/webapps/access-local-server)
- [WebKit — Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [WebKit — Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Apple — Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
