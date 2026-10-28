# Cotiza

Extensión de navegador (Chrome y Firefox) con la cotización del dólar y tus stocks. Modo oscuro, liviana, sin tracking.

## Privacidad
- Sin analytics, sin cuentas, sin servidor propio, sin código remoto.
- Tu configuración vive en `storage.local` y nunca sale del navegador.
- Las únicas requests van directo a estas APIs públicas (que ven tu IP, como cualquier sitio web):
  - `dolarapi.com` – dólar en Argentina
  - `cdn.jsdelivr.net` (fawazahmed0/currency-api) – otros pares de monedas
  - `query1.finance.yahoo.com` – stocks (endpoint no oficial, puede cambiar)
- Permisos: `storage`, `alarms` y los 3 hosts de arriba. Nada más.

## Recursos
Sin build, sin frameworks. El número en el ícono viene desactivado; si lo activás, un alarm cada 5 min lo actualiza; el popup solo consulta al abrirse si el caché tiene más de 60 s.

## Instalar (modo desarrollo)
- Chrome: `chrome://extensions` → Modo desarrollador → Cargar descomprimida → esta carpeta.
- Firefox: `about:debugging` → Este Firefox → Cargar complemento temporal → `manifest.json`.

Los datos tienen demora y no son asesoramiento financiero. Licencia MIT.
