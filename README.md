# Trippy Land Mobile

Construye las pantallas de cliente de Trippy Land Store, una web app de domicilios de productos dulces que los clientes usan desde un enlace en el celular.

Este proyecto debe usar el Supabase existente conectado a la otra aplicación. Las tablas, columnas, relaciones, autenticación y políticas RLS ya están creadas. Antes de implementar, inspecciona el esquema real y el código disponible; identifica cómo están representados los productos, categorías, clientes, direcciones, carritos, pedidos, ítems y estados. Muéstrame el mapeo que encontraste. No inventes nombres de tablas o columnas ni crees una base nueva. No actives Lovable Cloud como backend.

Diseño

La identidad es Trippy Land Store. Utiliza el logo existente, blanco sobre negro, sin modificarlo. Diseña una interfaz móvil de negro mate, moderna y premium, con fotografías de productos como protagonistas. Añade acentos de color inspirados en dulces y un toque psicodélico sutil en detalles y promociones, manteniendo fondos oscuros, texto legible y controles fáciles de usar. Evita una apariencia recargada.

Incluye una versión adaptable a escritorio, estados de carga tipo skeleton, mensajes de error claros y estados vacíos cuidados.

Pantallas y flujo

Bienvenida, inicio de sesión y registro: logo, acceso, registro y recuperación de acceso según el método de autenticación que ya exista en Supabase. Usa los roles actuales; el cliente no puede obtener permisos administrativos desde el frontend.

Home: encabezado con logo, dirección seleccionada y carrito; buscador; categorías; productos destacados; banners o promociones únicamente si tienen soporte en los datos existentes. Muestra imagen, nombre, precio y disponibilidad de cada producto.

Catálogo y detalle: búsqueda y filtro por categorías reales. Cada producto debe mostrar los datos disponibles en Supabase, selector de cantidad y botón para agregar al carrito. Impide agregar productos no disponibles.

Carrito: productos, cantidades editables, eliminación, precios unitarios, subtotal y acceso al checkout. Usa el mecanismo de carrito existente y muestra un estado vacío cuando corresponda.

Dirección y checkout del cliente: selección o registro de dirección, referencias e indicaciones. Si ya existe una integración de mapas, úsala solo para elegir el punto de entrega. Presenta productos, subtotal, domicilio y total usando las tarifas y reglas reales del backend; no inventes importes. El único método de pago es efectivo: no agregues tarjetas ni pasarelas. Valida los datos antes de confirmar y evita crear pedidos duplicados por doble toque.

Confirmación, mis pedidos y seguimiento: muestra la confirmación y el resumen del pedido, historial del cliente y detalle de cada pedido. Presenta el avance mediante una línea de estados basada en los valores reales de Supabase. No muestres un mapa para seguir al domiciliario. Utiliza actualizaciones en tiempo real si ya están disponibles.

Reglas de implementación

Conecta todas las pantallas al mismo proyecto de Supabase de la aplicación existente. Confirma el nombre o ID del proyecto conectado antes de escribir datos.

Respeta las tablas, relaciones, funciones, estados y políticas RLS existentes.

No uses claves privadas como service_role en el navegador.

No crees ni modifiques tablas, migraciones, Edge Functions, secretos o políticas RLS sin mostrarme primero el cambio exacto para revisión.

No insertes productos de ejemplo en la base.

Si alguna pantalla requiere una tabla, columna o función que no existe, explica qué falta y continúa con las pantallas que sí puedes implementar.

Al finalizar, comprueba el recorrido: inicio de sesión → home → producto → carrito → dirección → checkout en efectivo → confirmación → historial y seguimiento. Verifica que funcione en móvil y que los pedidos se guarden en el Supabase correcto.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75970ebb-555c-4201-ab3b-c92e40ddb8f6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
