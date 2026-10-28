# Política de privacidad de Cotiza

**Cotiza no recopila, almacena en servidores ni transmite datos personales a su desarrollador ni a terceros con fines propios.** No hay analytics, cuentas, anuncios ni telemetría.

## Qué se guarda y dónde
Tu configuración (moneda, tickers y preferencias) y un caché de precios se guardan únicamente en `storage.local` de tu navegador. Nunca salen de tu dispositivo.

## Con quién se comunica la extensión
Para mostrar cotizaciones, el navegador hace pedidos directos a estas APIs públicas:
- `dolarapi.com` (dólar en Argentina)
- `cdn.jsdelivr.net` (pares de monedas, currency-api)
- `query1.finance.yahoo.com` (stocks, proveedor por defecto)

Estos servicios pueden ver tu dirección IP y los tickers o monedas consultados, como ocurre al visitar cualquier sitio web. Cotiza no controla sus políticas de privacidad.

## Código
No se carga código remoto. Todo el código es abierto (licencia MIT): https://github.com/teom275/cotiza-extension

## Contacto
Abrí un issue en https://github.com/teom275/cotiza-extension/issues
