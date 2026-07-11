# VicuñaYa — Checklist de Lanzamiento

## 1. Variables de entorno y configuración

- [ ] `.env` tiene valores reales (no placeholders) para todas las claves
- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` apuntan al proyecto de producción
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sólo existe en variables de entorno del servidor (Netlify), **nunca** en el bundle del frontend
- [ ] `VITE_MP_PUBLIC_KEY` es la clave pública de producción de MercadoPago (no sandbox)
- [ ] `VITE_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` generados y configurados correctamente
- [ ] `VAPID_MAILTO` apunta a un email real del administrador

---

## 2. Supabase — Base de datos

- [ ] Todas las migraciones aplicadas en el proyecto de producción (`supabase db push` o `apply_migration`)
- [ ] RLS (Row Level Security) habilitado en **todas** las tablas
- [ ] Políticas RLS revisadas: usuarios sólo acceden a sus propios datos
- [ ] Políticas de restaurantes, drivers y admin verificadas en entorno de producción
- [ ] No existen tablas con `RLS disabled` que contengan datos sensibles
- [ ] Índices creados en columnas de filtros frecuentes (user_id, restaurant_id, status, created_at)

---

## 3. Supabase — Auth

- [ ] Proveedor Google OAuth configurado con Client ID y Secret de producción
- [ ] URL de callback permitida: `https://tu-dominio.com/auth/callback`
- [ ] Redirect URLs configuradas en Supabase Auth settings
- [ ] Email templates personalizados con branding VicuñaYa (si aplica)
- [ ] Flujo completo probado: login → `CompleteProfile` → Home

---

## 4. Supabase — Edge Functions

- [ ] Edge Functions deployadas en el proyecto de producción
- [ ] Secrets configurados en Supabase (no en código): `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`
- [ ] Edge Functions de notificaciones push probadas en producción
- [ ] Geocode / Places API proxy funcionando correctamente

---

## 5. Pagos — MercadoPago

- [ ] Integración usando credenciales de **producción** (no sandbox)
- [ ] Flujo de checkout probado de punta a punta
- [ ] Webhook de MercadoPago configurado (si aplica) apuntando al endpoint correcto
- [ ] Manejo de errores de pago visible para el usuario

---

## 6. Mapas

- [ ] Google Maps API Key de producción con dominios autorizados (solo tu dominio)
- [ ] Restricciones de la API Key configuradas: HTTP referrers → `https://tu-dominio.com/*`
- [ ] Mapbox token de producción configurado (si se usa en producción)
- [ ] Leaflet / mapa de tracking funciona en dispositivos móviles
- [ ] Autocompletado de direcciones (`PlacesInput`) probado en producción

---

## 7. Notificaciones Push (Web Push / VAPID)

- [ ] Service Worker registrado correctamente (`sw.js` o equivalente)
- [ ] Flujo de suscripción de notificaciones probado en Chrome mobile y desktop
- [ ] Notificaciones de nuevo pedido llegan al restaurante
- [ ] Notificaciones de cambio de estado llegan al cliente
- [ ] Notificaciones de encomiendas funcionando

---

## 8. PWA

- [ ] `manifest.json` con nombre, colores y íconos correctos (`icon-192.png`, `icon-512.png`)
- [ ] `favicon-32.png` presente
- [ ] La app es instalable en Android (Chrome) y iOS (Safari — Add to Home Screen)
- [ ] Íconos se ven correctamente en pantalla de inicio
- [ ] `_redirects` de Netlify configurado para SPA (todas las rutas → `index.html 200`)

---

## 9. Módulos — Pruebas funcionales

### Food Delivery
- [ ] Home muestra restaurantes activos
- [ ] Filtro por categoría funciona
- [ ] Página de restaurante y menú cargan correctamente
- [ ] Carrito: agregar, modificar cantidad y eliminar ítems
- [ ] Checkout completo (dirección, método de pago, confirmación)
- [ ] Seguimiento de pedido (`OrderTracking`) en tiempo real
- [ ] Calificar driver (`RateDriver`) al finalizar

### Restaurante Panel
- [ ] Login de restaurante funciona
- [ ] Pedidos entrantes se muestran y actualizan en tiempo real
- [ ] Cambio de estado de pedido notifica al cliente
- [ ] Gestión de menú (agregar, editar, desactivar ítems)
- [ ] Vista de ganancias (`Earnings`)

### Remises
- [ ] Flujo de solicitud de viaje (`RequestTrip`) completo
- [ ] Seguimiento de viaje (`TripTracking`) en tiempo real
- [ ] Driver Dashboard recibe solicitudes

### Encomiendas
- [ ] Crear encomienda desde panel cliente (`Encomiendas`)
- [ ] Panel de operador (`EncomiendaPanel`) recibe y gestiona encomiendas
- [ ] Cambios de estado se reflejan correctamente
- [ ] Configuración del panel (`EncomiendaConfig`) funciona

### Turnos
- [ ] Búsqueda de servicios/profesionales
- [ ] Reservar turno (`TurnoNegocio`)
- [ ] Mis turnos (`MisTurnos`) muestra reservas activas
- [ ] Panel de negocio: agenda, horarios, profesionales

### Admin
- [ ] Login de admin protegido por `AdminGuard`
- [ ] Dashboard de métricas (`AdminDashboard`) carga datos
- [ ] Gestión de restaurantes (`AdminRestaurants`)
- [ ] Gestión de menús (`MenuManagement`)
- [ ] Gestión de banners (`Banners`, `BannerDetail`)
- [ ] Panel de turnos negocios (`AdminTurnosNegocios`)
- [ ] Vista de ganancias admin (`Earnings`)

---

## 10. Seguridad

- [ ] No hay claves secretas expuestas en el bundle del frontend (`dist/`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no tiene prefijo `VITE_`
- [ ] Headers de seguridad configurados en Netlify (`netlify.toml`): `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] HTTPS forzado en producción
- [ ] Rutas protegidas por Guards (`AdminGuard`, `DriverGuard`, `RestaurantGuard`) probadas con usuarios sin permisos

---

## 11. Performance y SEO básico

- [ ] Build de producción sin errores: `npm run build`
- [ ] Bundle final revisado — no hay dependencias de desarrollo en producción
- [ ] `index.html` tiene `<title>` y meta description correctos
- [ ] Imágenes optimizadas (sharp configurado)
- [ ] Lighthouse score de PWA ≥ 90 en la página principal

---

## 12. Deployment — Netlify

- [ ] Variables de entorno configuradas en Netlify (Dashboard → Site settings → Environment variables)
- [ ] Branch de producción configurado correctamente (`master`)
- [ ] Deploy preview probado antes del go-live
- [ ] Dominio personalizado configurado y DNS propagado
- [ ] SSL activo (Let's Encrypt)
- [ ] `_redirects` funciona: navegar directo a una ruta interna no da 404
- [ ] Funciones serverless (`api/geocode.js`, `api/places.js`) deployadas y funcionando

---

## 13. Go-live

- [ ] Anuncio en redes sociales / comunidad preparado
- [ ] Usuarios de prueba eliminados o marcados (no aparecen como reales)
- [ ] Admin probó todas las vistas con cuenta real de producción
- [ ] Backup / snapshot de la base de datos antes del lanzamiento
- [ ] Monitoreo activo: revisar logs de Supabase las primeras 24 hs
