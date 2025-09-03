# IngePro PWA (Aplicación Web Progresiva)

## Descripción General

IngePro se ha transformado en una Aplicación Web Progresiva (PWA)
totalmente instalable que ofrece una experiencia similar a una
aplicación nativa en todos los dispositivos y plataformas.

## 🚀 Funcionalidades de la PWA

### Capacidades Principales de la PWA

-   ✅ **Instalable** - Puede instalarse en la pantalla de inicio o
    escritorio\
-   ✅ **Soporte sin Conexión** - Funciona sin conexión a internet\
-   ✅ **Experiencia tipo App** - Modo de pantalla completa e
    independiente\
-   ✅ **Notificaciones Push** - Actualizaciones y alertas en tiempo
    real\
-   ✅ **Sincronización en Segundo Plano** - Sincroniza datos cuando
    vuelve la conexión\
-   ✅ **Diseño Responsivo** - Optimizado para todos los tamaños de
    pantalla

### Métodos de Instalación

-   **Chrome/Edge**: Clic en el ícono de instalación en la barra de
    direcciones\
-   **Firefox**: Clic en el ícono de instalación en la barra de
    direcciones\
-   **iOS Safari**: Botón de compartir → "Añadir a pantalla de inicio"\
-   **Android Chrome**: Menú → "Instalar aplicación"

## 📱 Instrucciones de Instalación

### Escritorio (Chrome/Edge/Firefox)

1.  Visita IngePro en tu navegador\
2.  Busca el ícono de instalación (⬇️) en la barra de direcciones\
3.  Haz clic en "Instalar" para añadir al escritorio\
4.  La app aparecerá en tu carpeta de aplicaciones

### Móvil iOS (Safari)

1.  Abre IngePro en Safari\
2.  Toca el botón de compartir (📤)\
3.  Desplázate y selecciona "Añadir a pantalla de inicio"\
4.  Toca "Añadir" para confirmar\
5.  El ícono de la app aparece en la pantalla de inicio

### Móvil Android (Chrome)

1.  Abre IngePro en Chrome\
2.  Toca el menú (⋮)\
3.  Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"\
4.  Toca "Instalar" para confirmar\
5.  La app se instala en el dispositivo

## 🔧 Implementación Técnica

### Service Worker (`/public/sw.js`)

-   Maneja el caché sin conexión\
-   Administra actualizaciones de la app\
-   Procesa notificaciones push\
-   Funcionalidad de sincronización en segundo plano

### Web App Manifest (`/public/manifest.json`)

-   Metadatos y configuración de la app\
-   Definición de íconos en todos los tamaños\
-   Modos de visualización y orientación\
-   Atajos de app para acceso rápido

### Componentes de la PWA

-   `PWAInstallPrompt` - Muestra botón de instalación cuando está
    disponible\
-   `PWAStatus` - Muestra el estado actual de la PWA\
-   `PWAInstallGuide` - Instrucciones de instalación específicas por
    plataforma\
-   `PWAServiceWorker` - Registro y gestión del service worker

## 🎨 Elementos de UI en la PWA

### Integración en el Panel

-   Indicador de estado PWA en todas las páginas del panel\
-   Prompts de instalación para usuarios elegibles\
-   Guías de instalación específicas según la plataforma\
-   Retroalimentación visual de las funcionalidades de la PWA

### Atajos de la App

-   **Dashboard** - Acceso rápido al panel principal\
-   **Tareas** - Acceso directo a gestión de tareas\
-   **Materiales** - Acceso rápido a gestión de materiales

## 📊 Beneficios de la PWA

### Para los Usuarios

-   **Acceso Rápido** - Inicio con un toque desde la pantalla principal\
-   **Mejor Rendimiento** - Recursos en caché y soporte offline\
-   **Sensación Nativa** - Interfaz y comportamiento tipo app\
-   **Trabajo sin Conexión** - Continuar trabajando sin internet\
-   **Notificaciones Push** - Mantente informado de eventos importantes

### Para el Negocio

-   **Mayor Engagement** - Mayor tasa de uso de la aplicación\
-   **Mejor Experiencia de Usuario** - Sensación de app nativa\
-   **Capacidad Offline** - Trabajo continuo en condiciones de baja
    conectividad\
-   **Multiplataforma** - Una sola base de código para todos los
    dispositivos\
-   **Actualizaciones Fáciles** - Actualizaciones automáticas vía
    service worker

## 🛠️ Desarrollo y Pruebas

### Pruebas de Funcionalidades PWA

1.  **Prueba de Instalación**
    -   Usa Chrome DevTools → Application → Manifest\
    -   Verifica evento "beforeinstallprompt"
2.  **Prueba de Service Worker**
    -   DevTools → Application → Service Workers\
    -   Verifica registro y caché
3.  **Prueba sin Conexión**
    -   DevTools → Network → Offline\
    -   Prueba funcionalidad de la app sin internet

### Auditoría PWA

-   Usa auditoría PWA de Lighthouse\
-   Chrome DevTools → Lighthouse → Progressive Web App\
-   Meta: puntuación 90+ en todos los criterios PWA

## 🔄 Actualizaciones y Mantenimiento

### Actualizaciones del Service Worker

-   Detección automática de nuevas versiones\
-   Aviso al usuario sobre actualizaciones\
-   Refresco fluido de la app tras actualización

### Gestión de Caché

-   Nombres de caché versionados\
-   Limpieza automática de cachés antiguos\
-   Gestión eficiente de recursos

## 📋 Soporte de Navegadores

### Soporte Completo de PWA

-   ✅ Chrome 67+\
-   ✅ Edge 79+\
-   ✅ Firefox 67+\
-   ✅ Safari 11.1+ (iOS 11.3+)

### Soporte Parcial

-   ⚠️ Safari (soporte limitado sin conexión)\
-   ⚠️ Internet Explorer (sin soporte PWA)

## 🚀 Despliegue

### Requisitos en Producción

-   HTTPS habilitado (requerido para PWA)\
-   Service worker accesible en `/sw.js`\
-   Manifest accesible en `/manifest.json`\
-   Archivos de íconos correctos en el directorio público

### Configuración en Vercel

-   HTTPS automático\
-   Caché para el service worker\
-   Optimización de activos estáticos\
-   Despliegue listo para PWA

## 📚 Recursos Adicionales

### Estándares PWA

-   [Web App
    Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)\
-   [Service Worker
    API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)\
-   [PWA Best Practices](https://web.dev/progressive-web-apps/)

### Herramientas de Prueba

-   [Auditoría PWA con
    Lighthouse](https://developers.google.com/web/tools/lighthouse)\
-   [PWA Builder](https://www.pwabuilder.com/)\
-   [Chrome DevTools
    PWA](https://developers.google.com/web/tools/chrome-devtools/progressive-web-apps)

------------------------------------------------------------------------

## 🎯 Próximos Pasos

La implementación de la PWA está completa y lista para uso en
producción. Los usuarios ahora pueden:

1.  **Instalar IngePro** como aplicación nativa en cualquier
    dispositivo\
2.  **Trabajar sin conexión** con recursos en caché\
3.  **Recibir notificaciones** de actualizaciones importantes\
4.  **Disfrutar de una experiencia nativa** en todas las plataformas

Para soporte o preguntas sobre funcionalidades PWA, consulta la
documentación del navegador o contacta al equipo de desarrollo.
