# Persistencia de IndexedDB en PWA de celular

Pregunta: en iOS (Safari, “Añadir a inicio”) y Android (Chrome), ¿qué hace falta para que IndexedDB de una PWA sobreviva en la práctica para un inventario personal **sin backup**? ¿Qué acciones del usuario o del sistema borran esos datos, y qué patrón de instalación (navegador vs ícono en inicio) cambia el riesgo?

Fecha: 2026-08-25.
Alcance: Safari en iOS/iPadOS y Chrome en Android. No se implementa la app.
Método: solo fuentes primarias (WHATWG, W3C, MDN, WebKit, Apple, Chromium/Google Chrome). Cada afirmación apunta al dueño del comportamiento.

## Respuesta corta

IndexedDB **no es un disco de usuario**. Por defecto vive en un cubo `best-effort`: el motor puede borrarlo entero (todo el origen) bajo presión de almacenamiento o, en Safari, por política de ITP. `navigator.storage.persist()` pide el modo `persistent`, que **solo** protege contra el desalojo automático del user agent; **no** protege contra borrar datos del sitio, historial, perfil del navegador, pestaña privada o reinstalar el teléfono.

Para un inventario **sin backup**, lo que más cambia el riesgo no es el tamaño de la base (un inventario doméstico cabe de sobra en la cuota) sino **cómo se abre la app**:

| Superficie | Qué documentan los dueños | Riesgo práctico para este MVP |
|---|---|---|
| **iOS · pestaña Safari** | ITP borra IndexedDB tras 7 días de *uso de Safari* sin interacción en el sitio. El almacenamiento es `best-effort` salvo `persist()`. | Alto si no se abre el sitio con tap/clic en Safari. Inviable como único hogar de datos sin backup. |
| **iOS · ícono de inicio *como web app*** (`display: standalone`/`fullscreen`, o “Abrir como app web”) | Almacenamiento **aislado** de Safari; el dominio de primera parte está **exento** del tope de 7 días de ITP; WebKit tiende a conceder `persist()` si corre como Home Screen Web App. | El menor riesgo documentado en iOS. Sigue siendo volátil ante acciones explícitas del usuario y presión de disco si no es persistente. |
| **iOS · ícono de inicio *como atajo de Safari*** (sin modo standalone) | El ícono abre en el navegador. No es Home Screen web app. | Mismo riesgo que la pestaña Safari (ITP de 7 días). |
| **Android · pestaña Chrome** | Mismo perfil/origen que una PWA instalada. `best-effort` salvo `persist()`. Chrome rara vez desaloja solo; el usuario borra más a menudo. | Medio: sobrevive al uso regular, muere si se “limpia Chrome”. |
| **Android · ícono (WebAPK / Instalar)** | Sigue usando el **perfil actual de Chrome** (no hay contenedor aislado). Instalar es la señal más clara para que Chrome conceda persistencia. | Menor riesgo de desalojo automático. **Mayor** acoplamiento a “borrar datos de Chrome”: el ícono no aísla el inventario. |
| **Android · atajo** (sin WebAPK) | Fallback si el sitio no es instalable o falla el minting. Mismo almacenamiento de origen. | Persistencia menos predecible que una instalación WebAPK. |

Nada de esto convierte IndexedDB en backup. Sin exportar, el inventario **puede desaparecer** y el MVP ya aceptó esa pérdida.

---

## 1. Modelo de plataforma (dueño: WHATWG Storage + MDN)

IndexedDB es un *storage endpoint* local del origen, en el cubo por defecto:

> Identifier `indexedDB`, type `local`.
>
> — [Storage Standard](https://storage.spec.whatwg.org/)

El cubo local nace en modo **`best-effort`** y solo pasa a **`persistent`** si se concede el permiso `persistent-storage` (el usuario, o el user agent en su nombre):

> “A local storage bucket has a mode, which is `best-effort` or `persistent`. It is initially `best-effort`.”
>
> “When granted to an origin, the persistence permission can be used to protect storage from the user agent’s clearing policies. The user agent cannot clear storage marked as persistent without involvement from the origin or user.”
>
> — [Storage Standard, Persistence permission](https://storage.spec.whatwg.org/)

Bajo presión de disco, el user agent debe vaciar primero los cubos `best-effort`. Si aún falta espacio, **avisa al usuario** y ofrece borrar también los `persistent`:

> “A user agent that comes under storage pressure should clear … local storage buckets whose mode is `best-effort` … If a user agent continues to be under storage pressure, then the user agent should inform the user and offer a way to clear the remaining local storage buckets, i.e., those whose mode is `persistent`.”
>
> — [Storage Standard, Storage pressure](https://storage.spec.whatwg.org/)

Cuando se borra un cubo, se borra **entero** (IndexedDB + Cache API + service worker, no “unas filas”):

> “Whenever a storage bucket is cleared by the user agent, it must be cleared in its entirety.”
>
> — [Storage Standard](https://storage.spec.whatwg.org/)
>
> “When an origin's data is evicted by the browser, all of its data, not parts of it, is deleted at the same time.”
>
> — [MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

`navigator.storage.persist()` es contexto seguro (HTTPS). El navegador **puede ignorar** el pedido:

> “The browser may or may not honor the request, depending on browser-specific rules.”
>
> — [MDN, StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)

MDN resume los dos modos así: `best-effort` dura mientras haya cuota, espacio y el usuario no borre; `persistent` “is only evicted, or deleted, if the user chooses to, by using their browser's settings.” Safari y Chromium **no muestran prompt**: aprueban o niegan según historial de uso.

> — [MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

Cuotas (orden de magnitud; un inventario de envases no las toca):

- Chrome/Chromium: un origen hasta ~60 % del disco; el navegador hasta ~80 %.
- Safari/WebKit iOS 17+: en una *browser app*, origen ~60 % y global ~80 % del disco. Una Home Screen Web App usa **la misma cuota de origen/global que el navegador**, no la de un WKWebView embebido (~15 % / ~20 %).

> — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria); [WebKit, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

---

## 2. iOS (Safari y “Añadir a inicio”)

### 2.1 Dos cosas distintas con el mismo ícono

El manifiesto W3C define `display`: `browser` (default), `minimal-ui`, `standalone`, `fullscreen`. `standalone` abre “like a standalone native application” sin chrome típico de navegador.

> — [W3C Web Application Manifest, display modes](https://www.w3.org/TR/appmanifest/#display-modes)

Apple separa el comportamiento en iOS:

> “A website that has been added to the Home Screen opens in the default browser.”
>
> “Websites that have been added to the Home Screen on iOS and iPadOS, **with the standalone display mode**, will become a Home Screen web app. Home Screen web apps have a standalone, app-like experience on iOS, **with separate cookies and storage from the browser**.”
>
> — [WWDC 2023, What’s new in web apps](https://developer.apple.com/videos/play/wwdc2023/10120/)

Safari 17 confirma el mismo corte para `standalone` o `fullscreen`:

> “if the website has a manifest file with a display mode of `standalone` or `fullscreen`, it will open as a Home Screen web app.”
>
> — [WebKit Features in Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)

La guía de iPhone pide, al añadir, **activar “Open as Web App”**:

> “Turn on Open as Web App. … When you tap the icon, the website opens just like an app.”
>
> — [Apple, Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)

Sin `standalone`/`fullscreen` (o sin “Abrir como app web”), el ícono es un **atajo a Safari**: mismo almacenamiento, mismas reglas de ITP.

### 2.2 Tope de 7 días de ITP (pestaña Safari)

Desde iOS/iPadOS 13.4 / Safari 13.1, ITP borra **todo** el almacenamiento escribible por script —incluido IndexedDB— tras 7 días de **uso de Safari** sin interacción en el sitio:

> “ITP deletes all cookies created in JavaScript and all other script-writeable storage after 7 days of no user interaction with the website. The latter storage forms are: IndexedDB, LocalStorage, Media keys, SessionStorage, Service Worker registrations and cache.”
>
> — [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/)
>
> “deleting all of a website’s script-writable storage after seven days of Safari use without user interaction on the site”
>
> — [WebKit, Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)

“Interacción” **no** es scrollear:

> “User interaction is a user click, tap, or keyboard entry on a website. … Scrolling is not considered user interaction.”
>
> — [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/)

MDN lo clasifica como **desalojo proactivo**, solo Safari:

> “Safari proactively evicts data when cross-site tracking prevention is turned on. If an origin has no user interaction, such as click or tap, in the last seven days of browser use, its data created from script will be deleted.”
>
> — [MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

Implicación para el inventario: si se usa **solo** en una pestaña de Safari y durante una semana de uso de Safari no hay tap/clic en el origen, IndexedDB puede desaparecer **aunque el teléfono no esté lleno**.

### 2.3 Home Screen web app: exenta de ese tope y con store propio

WebKit documenta primero que el ícono **no es Safari** (contador de días propio):

> “Web applications added to the home screen are not part of Safari and thus have their own counter of days of use. Their days of use will match actual use of the web application which resets the timer. We do not expect the first-party in such a web application to have its website data deleted.”
>
> — [WebKit, Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)

La política vigente es más fuerte: **exención explícita** y **aislamiento**:

> “The first-party domain of home screen web applications is exempt from ITP’s 7-day cap on all script-writeable storage, i.e. ITP always skips that domain in its website data removal algorithm. In addition, the website data of home screen web applications is kept isolated from Safari and thus will not be affected by ITP’s classification of tracking behavior in Safari.”
>
> — [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/)

Google (web.dev) describe el mismo aislamiento de contenedor:

> “If a PWA is added to the home screen on mobile Safari, it creates a new storage container, and nothing is shared between the PWA and mobile Safari.”
>
> — [web.dev, Storage for the web](https://web.dev/articles/storage-for-the-web)

En macOS, Apple copia cookies al crear la web app del Dock, **no** `localStorage`. No documentan un copiado equivalente de IndexedDB al crear una Home Screen web app en iOS. Tratar Safari y el ícono como **dos inventarios** hasta prueba en dispositivo.

> “Safari copies website cookies when it is added to the Dock. … From that point on, cookies are separate between Safari and the web app. … local storage is not copied when a web app is created.”
>
> — [WWDC 2023](https://developer.apple.com/videos/play/wwdc2023/10120/)

### 2.4 Presión de disco y `persist()` en WebKit (iOS 17+)

Evicción automática (además de ITP): cuota global superada, presión del sistema, o ITP.

> “Eviction means automatic website data deletion that is not initiated by the user or website. It can happen … when exceeding the overall quota, when the system is under storage pressure, or when the site has not been interacted with by the user for some time (see Intelligent Tracking Prevention).”
>
> “WebKit normally evicts data on an origin basis … least-recently-used … Origin might be excluded from eviction if it has active page at the time of eviction, or its storage is in persistent mode. By default, all origins use a best-effort mode.”
>
> — [WebKit, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

La Storage API (incluido `persist()` / `persisted()` / `estimate()`) está **completa desde Safari 17 / iOS 17**. Antes, `persist()` no era fiable entre sesiones:

> “Starting in Safari 17.0, and in WebKit apps for iOS 17 … the Storage API is fully supported.”
>
> “WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App.”
>
> — [WebKit, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
>
> “Critical bugs have been fixed to ensure the storage mode value is remembered across sessions.”
>
> — [WebKit Features in Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)

Para este MVP: servir HTTPS, llamar `persist()` **desde la Home Screen web app** (no solo en la pestaña), y comprobar `persisted()`. En iOS &lt; 17 el modo persistente no debe darse por sentado.

### 2.5 Acciones de usuario en Safari/iOS que sí borran datos del navegador

Apple documenta, en Ajustes → Apps → Safari:

- **Clear History and Website Data**
- **Advanced → Website Data → Remove All Website Data** (“This clears data that's used for tracking, and by websites to save login information…”)
- **Block All Cookies** → Block All: “This removes all existing cookies and website data.”

> — [Apple Support, Delete your Safari history, cache, and cookies on iPhone](https://support.apple.com/en-us/105082)

Esas pantallas hablan de **Safari**. WebKit dice que la Home Screen web app tiene website data **aislada**. No hay frase de Apple del tipo “esto también vacía las web apps del inicio” ni “borrar el ícono borra IndexedDB”. Ver §6.

Navegación privada: sesión efímera; cookies y estado no persisten al cerrar pestaña / salir / reiniciar.

> — [WebKit, Tracking Prevention, Private Browsing Mode](https://webkit.org/tracking-prevention/)
>
> — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria): en modo privado los datos “are usually deleted when the private browsing mode ends.”

---

## 3. Android (Chrome)

### 3.1 Mismo perfil, no hay segundo disco

A diferencia de iOS, una PWA instalada **no** tiene IndexedDB propio:

> “Even though the progressive web app is installed via an APK, Chrome uses the current profile to store any data, and it will not be segregated away. … Cookies are shared and active, any client side storage is accessible and the service worker is installed and ready to go.”
>
> FAQ: “Will my installed site's storage be cleared if the user clears Chrome's cache?” **“Yes.”**
>
> — [web.dev, WebAPKs on Android](https://web.dev/articles/webapks)

Usar Chrome o el ícono es **el mismo inventario**. Conveniente. También significa que “limpiar Chrome” mata el ícono.

### 3.2 Instalar vs atajo

Chrome en Android, si el sitio es instalable y hay minting, genera un **WebAPK** (lanzador, Ajustes → Apps, intent filters). Si no, cae a un **atajo** en el inicio (icono con badge del navegador, sin entrada en Apps).

> — [web.dev, Installation](https://web.dev/learn/pwa/installation)

Criterio de instalabilidad de Chrome: manifiesto con (entre otras) `name` y experiencia instalada; `display` `standalone` o `minimal-ui` en escritorio. En Android, “Install” / “Add to Home Screen” varía; el WebAPK es el camino que Chromium trata como instalación.

> “The only definite capability granted by installation is persistence. By installing, the user has explicitly indicated that they want the web app to have a persistent presence on their system.”
>
> — [Chromium Docs, Controlling Access to Powerful Web Platform Features](https://chromium.googlesource.com/chromium/src/+/master/docs/security/permissions-for-powerful-web-platform-features.md)

### 3.3 `persist()` en Chrome: sin diálogo, por heurística

Chrome no pregunta. Concede si el sitio es “importante”; si no, niega en silencio.

Heurística **actual** (Google):

> “How high is the level of site engagement? Has the site been installed or bookmarked? Has the site been granted permission to show notifications?”
>
> — [web.dev, Persistent storage](https://web.dev/articles/persistent-storage)

> “One criteria for Google Chrome is, for example, PWA installation. If the user has installed an icon for the PWA in the operating system, the browser may grant persistent storage.”
>
> — [web.dev, Offline data](https://web.dev/learn/pwa/offline-data)

Heurística **histórica** (Intent to Ship de Chromium, 2016; OR): sitio en marcadores (con regla de “top 5”), engagement alto, **añadido al inicio**, notificaciones push. “Clear browsing data and storage management will still clear the storage.” El permiso no se revoca solo por bajar en el ranking de marcadores; se pierde al borrar datos del sitio.

> — [blink-dev, Intent to Ship: Durable (persistent) storage](https://groups.google.com/a/chromium.org/g/blink-dev/c/nAM3o4NSMsI/m/3gRKsOuYBgAJ)

Hay que **llamar** `persist()`: hasta entonces el origen sigue en `best-effort` aunque ya esté instalado. Chrome no muestra UI; un `false` es denegación silenciosa y se puede reintentar cuando suba el engagement o tras instalar.

Si se concede, IndexedDB (y Cache, SW, etc.) deja de desalojarse por presión. El usuario sigue pudiendo borrar.

> — [web.dev, Persistent storage](https://web.dev/articles/persistent-storage); [Chrome, Storage Buckets](https://developer.chrome.com/docs/web-platform/storage-buckets)

Google afirma que el desalojo **automático** en Chrome es raro frente al borrado manual:

> “research by the Chrome team shows that data is very rarely cleared automatically by Chrome. It is far more common for users to manually clear storage.”
>
> — [web.dev, Persistent storage](https://web.dev/articles/persistent-storage)

Política LRU si no es persistente: el origen menos usado reciente, entero, hasta salir de la presión.

> — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria); [web.dev, Storage for the web](https://web.dev/articles/storage-for-the-web)

Chrome en incógnito recorta cuota (~5 % del disco) y borra al cerrar el modo privado. Si el usuario activa “Clear cookies and site data when you close all windows”, la cuota cae a ~300 MB (sigue sobrando para este inventario, pero el cierre de ventanas borra).

> — [web.dev, Storage for the web](https://web.dev/articles/storage-for-the-web)

### 3.4 Acciones de usuario en Chrome Android que borran IndexedDB

Ayuda oficial de Chrome (Android), tipo **Cookies and site data**:

> “Site data: HTML5-enabled storage types including application caches, Web Storage data, Web SQL Database data, and Indexed Database data are deleted.”
>
> — [Google Chrome Help, Delete browsing data in Chrome (Android)](https://support.google.com/chrome/answer/2392709?hl=en)

También: borrar datos de **un** origen en Ajustes del sitio; borrar caché de Chrome (FAQ WebAPK: sí afecta el sitio instalado); borrar almacenamiento de la app **Chrome** a nivel Android (mismo perfil → mismo IndexedDB). Desinstalar el WebAPK **no** está documentado por Google como “borra IndexedDB del origen”; el store vive en Chrome. Sí está documentado que **limpiar Chrome** sí lo borra.

No hay reinstalo mágico en un teléfono nuevo:

> “Will my app be re-installed when I get a new device? Not at this time…”
>
> — [web.dev, WebAPKs on Android](https://web.dev/articles/webapks)

---

## 4. Qué hace falta en la práctica (inventario personal, sin backup)

Conclusión operativa, atada a las fuentes de arriba:

1. **HTTPS** y origen estable. `persist()` es secure context. Cambiar de `http` a `https`, de IP a dominio, o de `www` a apex es **otro origen** → otra IndexedDB vacía.
2. **Manifest `display: "standalone"`** (o `fullscreen`). En iOS es el interruptor entre atajo-Safari (ITP 7 días) y Home Screen web app (store aislado + skip de ITP).
3. **Usar el ícono como único hogar del inventario en iOS.** No cargar envases en Safari “para probar” y esperar verlos en el ícono. En Android sí es el mismo store.
4. **Llamar `navigator.storage.persist()`** al guardar datos de verdad (gesto de usuario), y leer `persisted()`. En iOS 17+, hacerlo **dentro** de la web app del inicio. En Chrome, instalar primero mejora la heurística; igual hay que pedir.
5. **Abrir la app con un tap de vez en cuando.** En Safari-pestaña, eso resetea ITP. En Home Screen iOS, ITP ya no aplica al first-party. En Chrome, el uso reciente baja el riesgo LRU.
6. **No usar pestaña privada / incógnito** como superficie diaria.
7. **Asumir pérdida** si el usuario: borra datos del sitio o del navegador; en iOS, limpia Website Data de Safari (efecto sobre la web app del inicio: **no documentado**); en Android, limpia Chrome o el origen; cambia de teléfono; o el disco está tan lleno que el sistema pide borrar incluso persistente.
8. **iOS 17+** si se quiere `persist()` que sobreviva sesiones. El tope de 7 días de ITP existe desde 13.4; la exención de Home Screen también. Cuota grande y Storage API completa: 17.

Nada de eso sustituye un backup. El mapa del proyecto ya dejó exportar/importar **fuera de alcance**; este hallazgo no lo reabre: solo dice **dónde duele más** y **qué patrón de instalación reduce el desalojo silencioso**.

---

## 5. Acciones que borran, agrupadas

### El user agent (sin tocar Ajustes)

| Evento | iOS Safari (pestaña / atajo) | iOS Home Screen web app | Android Chrome (pestaña o WebAPK) |
|---|---|---|---|
| 7 días de uso del navegador sin tap/clic en el origen | Sí: ITP borra IndexedDB | No: dominio first-party exento | No hay tope de 7 días análogo |
| Disco lleno / cuota global | LRU de orígenes `best-effort`; `persistent` y página activa se salvan | Igual, en su contenedor | LRU `best-effort`; `persistent` se salta |
| Presión extrema tras persistente | Spec: informar y ofrecer borrar persistente | Spec (WebKit implementa persistente iOS 17+) | Spec + Chrome: el usuario interviene |
| Cerrar pestaña privada / incógnito | Sí | N/A (no es esa sesión) | Sí, datos de esa sesión |
| Poco uso reciente (LRU) | Sí si `best-effort` | Sí si `best-effort` | Raro según Chrome; posible si `best-effort` |

### El usuario

| Acción | iOS | Android Chrome |
|---|---|---|
| Borrar historial y website data / Remove All Website Data / Block All Cookies | Safari: sí, website data. Home Screen: aislamiento documentado; cruce **no** afirmado por Apple | — |
| Delete browsing data → Cookies and site data | — | Sí, “Indexed Database data” |
| Borrar datos de un origen en Ajustes del sitio | Website Data por sitio (Safari) | Sí |
| Limpiar almacenamiento de la app del sistema (Safari vs Chrome) | Safari: website data del navegador | Chrome: **sí**, y con ello la PWA (mismo perfil) |
| Desinstalar / quitar ícono | No hay fuente Apple de que borre IndexedDB | No hay fuente Google de que desinstalar el WebAPK borre el origen; limpiar Chrome sí |
| Teléfono nuevo / reset | Datos locales no viajan (Chrome: “Not at this time” para reinstalar PWA) | Igual |

---

## 6. Huecos (no inventar)

- **Borrar el ícono de inicio en iOS** y el destino del contenedor aislado: sin frase de Apple/WebKit.
- **Clear History and Website Data** vs store de la Home Screen web app: aislamiento sí; unión de las dos acciones, no.
- Si iOS **copia** IndexedDB de Safari al crear la web app: Apple solo documenta copia de **cookies en Mac**, y que `localStorage` **no** se copia ahí.
- Heurística exacta **hoy** de `persist()` en Chromium (engagement umbral, código `durable_storage_permission_context`): el Intent to Ship de 2016 y web.dev coinciden en instalación / engagement / notificaciones; el umbral numérico de engagement no está en docs de producto actuales.
- **Chrome en iOS** usa WebKit, no Blink: fuera del alcance de la pregunta (Safari iOS + Chrome Android).
- Fallos intermitentes de IndexedDB en WebKit (bugs de conexión): existen hilos en Apple Developer Forums; no son política de persistencia y no se usan aquí como autoridad.

---

## Fuentes

- [WHATWG Storage Standard](https://storage.spec.whatwg.org/)
- [W3C Web Application Manifest — display modes](https://www.w3.org/TR/appmanifest/#display-modes)
- [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [WebKit Tracking Prevention](https://webkit.org/tracking-prevention/)
- [WebKit: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [WebKit Features in Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)
- [WWDC 2023: What’s new in web apps](https://developer.apple.com/videos/play/wwdc2023/10120/)
- [Apple: Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)
- [Apple Support 105082](https://support.apple.com/en-us/105082)
- [web.dev Persistent storage](https://web.dev/articles/persistent-storage)
- [web.dev Storage for the web](https://web.dev/articles/storage-for-the-web)
- [web.dev WebAPKs on Android](https://web.dev/articles/webapks)
- [web.dev Installation](https://web.dev/learn/pwa/installation)
- [web.dev Offline data](https://web.dev/learn/pwa/offline-data)
- [Chrome: Storage Buckets](https://developer.chrome.com/docs/web-platform/storage-buckets)
- [Chromium: permissions for powerful web platform features](https://chromium.googlesource.com/chromium/src/+/master/docs/security/permissions-for-powerful-web-platform-features.md)
- [blink-dev Intent to Ship: Durable storage](https://groups.google.com/a/chromium.org/g/blink-dev/c/nAM3o4NSMsI/m/3gRKsOuYBgAJ)
- [Chrome Help: Delete browsing data (Android)](https://support.google.com/chrome/answer/2392709?hl=en)
