import { useState, useEffect } from "react";

export type Language = "es" | "en";

export const translations = {
  es: {
    // Navigation & App Shell
    nav_home: "Inicio",
    nav_catalog: "Catálogo",
    nav_orders: "Pedidos",
    nav_cart: "Carrito",
    where_deliver: "¿Dónde entregamos?",
    change: "Cambiar",
    view_store: "Ver Tienda",
    admin_panel: "★ Panel de Administración",
    my_orders: "Mis pedidos",
    install_app: "📲 Instalar en pantalla de inicio",
    sign_in: "Entrar",
    sign_out: "Cerrar sesión",
    store_open: "TIENDA ABIERTA",
    store_closed: "TIENDA CERRADA",
    store_closed_banner: "Tienda cerrada temporalmente: No estamos recibiendo pedidos en este momento. Puedes explorar el menú.",
    go_to_cart: "Ir al Carrito",
    language: "Idioma",
    lang_es: "Español",
    lang_en: "English",

    // Home & Catalog
    search_placeholder: "¿Qué vas a pedir hoy?",
    search_button: "Buscar",
    categories: "Categorías",
    featured: "Destacados",
    view_full_catalog: "Ver catálogo completo →",
    all_categories: "Todos",
    all: "Todos",
    no_products: "No se encontraron productos",
    no_products_yet: "Todavía no hay productos",
    no_products_yet_desc: "Cuando el equipo publique productos en el panel, aparecerán aquí al instante.",
    search_catalog_placeholder: "Buscar por nombre, cepa o categoría...",
    search_sweets: "Buscar dulces...",
    catalog_title: "Catálogo",
    add: "Añadir",
    added: "Agregado",
    sold_out: "Agotado",
    available: "Disponible",
    filter_by: "Filtrar por",
    error_loading_products: "No se pudieron cargar los productos.",
    no_results: "Sin resultados",
    no_results_desc: "Prueba con otra búsqueda o cambia de categoría.",

    // Product Detail
    product_details: "Detalles del producto",
    strain_type: "Tipo de cepa",
    weight: "Gramos",
    effects: "Efectos",
    thc: "THC",
    cbd: "CBD",
    buy_now: "Comprar ahora",
    add_to_cart_btn: "Agregar al carrito",
    add_btn: "Agregar",
    saved_favorite: "❤️ Guardado en favoritos",
    removed_favorite: "Eliminado de favoritos",
    product_sold_out: "Producto agotado",

    // Cart & Checkout
    cart_title: "Carrito Trippy",
    shopping_cart: "Carrito de compras",
    cart_empty: "Tu carrito está vacío",
    cart_empty_desc: "Agrega tus antojos favoritos desde el catálogo.",
    explore_catalog: "Explorar catálogo",
    explore_catalog_btn: "Explorar catálogo",
    subtotal: "Subtotal",
    delivery_fee: "Domicilio",
    delivery_type_fast: "Rápida 🚀 (~20 min)",
    delivery_type_standard: "Normal (~40 min)",
    free: "Gratis",
    total: "Total",
    checkout_btn: "Proceder al pago",
    delivery_info: "Datos de Entrega",
    address: "Dirección",
    delivery_address_title: "Dirección de entrega",
    address_notes: "Apartamento, torre o indicaciones adicionales",
    contact_phone: "WhatsApp de Contacto",
    payment_method: "Método de Pago",
    payment_cash: "Pago en efectivo",
    payment_cash_desc: "Pagas al recibir tu pedido.",
    payment_transfer: "Transferencia (Bancolombia / Nequi)",
    referral_code: "¿Tienes un código de referido?",
    apply_code: "Aplicar",
    discount_applied: "Descuento aplicado",
    confirm_order: "Confirmar pedido",
    confirming_btn: "Confirmando...",
    confirm_whatsapp: "Confirmar pedido por WhatsApp",
    order_success: "¡Pedido confirmado con éxito!",
    each: "c/u",
    not_available: "No disponible",
    empty_cart_action: "Vaciar carrito",
    store_closed_cart_msg: "La tienda está cerrada temporalmente. Podrás pedir tan pronto abramos.",
    store_closed_btn: "Tienda Cerrada Temporalmente",
    remove_sold_out_msg: "Quita los productos agotados de tu carrito para continuar.",
    change_btn: "Cambiar",
    edit_btn: "Editar",
    cancel_edit_btn: "Cancelar edición",
    address_required_error: "No puedes proceder al pago si no tienes la dirección. Dinos dónde te vamos a llevar el producto.",
    detect_gps_btn: "Detectar mi ubicación actual con GPS",
    getting_gps: "Obteniendo ubicación GPS...",
    select_saved_address: "O selecciona una guardada:",
    main_address_label: "Dirección principal",
    main_address_placeholder: "Ej: Calle 45 # 12-34 o Edificio / Conjunto",
    neighborhood_label: "Barrio o Sector",
    neighborhood_placeholder: "Ej: El Poblado",
    apartment_label: "Apto / Casa (Opcional)",
    apartment_placeholder: "Ej: Apto 301, Torre 2",
    notes_label: "Indicaciones para el repartidor (Opcional)",
    notes_placeholder: "Ej: Dejar en portería, casa de reja negra...",
    delivery_type_title: "Tipo de entrega",
    delivery_normal: "Normal",
    delivery_fast: "Rápida 🚀",
    order_summary_title: "Resumen",

    // Order Tracking & Status
    order_status_title: "Estado de tu Pedido",
    order_number: "Pedido",
    status_pending: "Pendiente",
    status_accepted: "Aceptado",
    status_preparing: "En preparación",
    status_in_transit: "En camino",
    status_dispatched: "En camino",
    status_arrived: "Ha llegado",
    status_delivered: "Entregado",
    status_cancelled: "Cancelado",
    driver_arrived: "🛵 ¡El repartidor ha llegado afuera!",
    in_transit_desc: "Tu pedido va en camino a tu ubicación.",
    preparing_desc: "Estamos alistando tus productos.",
    live_tracking: "Seguimiento en vivo",
    open_whatsapp: "Abrir WhatsApp",
    back_to_store: "Volver a la tienda",
    back_to_home: "Volver al inicio",
    my_orders_btn: "Mis pedidos",
    order_confirmed_title: "¡Pedido confirmado!",
    order_confirmed_desc: "Pagas en efectivo al recibir tu entrega.",
    push_alerts_title: "Avisos de entrega en tu celular",
    push_alerts_desc: "Recibe alertas en directo cuando tu orden sea aceptada o despachada.",
    my_orders_title: "Mis Pedidos",
    my_orders_subtitle: "Historial y seguimiento en vivo",
    no_orders_yet: "Aún no tienes pedidos",
    no_orders_yet_desc: "Cuando hagas tu pedido aparecerá aquí para que puedas hacerle seguimiento en tiempo real.",
    live_tracking_title: "Seguimiento en Vivo",
    live_tracking_subtitle: "Estado de tu entrega",
    live_badge: "En directo",
    step_received: "Recibido",
    step_accepted: "Aceptado",
    step_in_transit: "En Camino",
    step_arrived: "Llegó",
    status_cancelled_title: "Pedido cancelado",
    status_cancelled_reason: "Motivo",
    status_received_title: "Pedido recibido",
    status_received_desc: "Tu pedido está en cola y la tienda lo confirmará en breve.",
    status_accepted_title: "¡La tienda aceptó tu pedido!",
    status_accepted_desc: "Tu pedido está siendo empacado y alistado para despacho.",
    status_in_transit_title: "El repartidor va en camino",
    status_arrived_title: "¡El repartidor ya llegó!",
    status_delivered_title: "¡Pedido entregado!",
    driver_vehicle: "Vehículo",
    driver_at_point: "Repartidor en punto",
    waiting_time: "Tiempo de espera",
    contact_number_prompt: "Ingresa tu número de contacto para que el repartidor pueda comunicarse:",
    send_btn: "Enviar",
    number_sent: "Número enviado",
    delivery_address_section: "Dirección de Entrega",
    order_summary_section: "Resumen de la Orden",
    keep_shopping_btn: "Seguir comprando (Ir al inicio)",
    view_all_orders_btn: "Ver todos mis pedidos",

    // Onboarding & Install
    welcome_title: "Bienvenido a Trippy Land",
    welcome_desc: "Dulces a domicilio en minutos en Medellín. Pago contra entrega en efectivo o transferencia.",
    get_started: "Empezar a pedir",
    skip: "Omitir",
    install_title: "Instala Trippy Land en tu Inicio",
    install_subtitle: "Acceso ultrarrápido y alertas de tu pedido en pantalla bloqueada.",
  },
  en: {
    // Navigation & App Shell
    nav_home: "Home",
    nav_catalog: "Catalog",
    nav_orders: "Orders",
    nav_cart: "Cart",
    where_deliver: "Delivery location",
    change: "Change",
    view_store: "Store",
    admin_panel: "★ Admin Panel",
    my_orders: "My Orders",
    install_app: "📲 Install on Home Screen",
    sign_in: "Sign In",
    sign_out: "Sign Out",
    store_open: "STORE OPEN",
    store_closed: "STORE CLOSED",
    store_closed_banner: "Store temporarily closed: We are not taking orders right now. Feel free to explore the menu.",
    go_to_cart: "Go to Cart",
    language: "Language",
    lang_es: "Español",
    lang_en: "English",

    // Home & Catalog
    search_placeholder: "What are you ordering today?",
    search_button: "Search",
    categories: "Categories",
    featured: "Featured",
    view_full_catalog: "View full catalog →",
    all_categories: "All",
    all: "All",
    no_products: "No products found",
    no_products_yet: "No products available yet",
    no_products_yet_desc: "As soon as items are published in the store, they will appear here instantly.",
    search_catalog_placeholder: "Search by name, strain or category...",
    search_sweets: "Search items...",
    catalog_title: "Catalog",
    add: "Add",
    added: "Added",
    sold_out: "Sold out",
    available: "Available",
    filter_by: "Filter by",
    error_loading_products: "Could not load products.",
    no_results: "No results",
    no_results_desc: "Try another search or change category.",

    // Product Detail
    product_details: "Product Details",
    strain_type: "Strain Type",
    weight: "Weight",
    effects: "Effects",
    thc: "THC",
    cbd: "CBD",
    buy_now: "Buy Now",
    add_to_cart_btn: "Add to Cart",
    add_btn: "Add",
    saved_favorite: "❤️ Saved to favorites",
    removed_favorite: "Removed from favorites",
    product_sold_out: "Sold out",

    // Cart & Checkout
    cart_title: "Trippy Cart",
    shopping_cart: "Shopping Cart",
    cart_empty: "Your cart is empty",
    cart_empty_desc: "Add your favorite products from the catalog.",
    explore_catalog: "Explore catalog",
    explore_catalog_btn: "Explore catalog",
    subtotal: "Subtotal",
    delivery_fee: "Delivery",
    delivery_type_fast: "Fast 🚀 (~20 min)",
    delivery_type_standard: "Standard (~40 min)",
    free: "Free",
    total: "Total",
    checkout_btn: "Proceed to Checkout",
    delivery_info: "Delivery Information",
    address: "Delivery Address",
    delivery_address_title: "Delivery Address",
    address_notes: "Apt, building number or extra notes",
    contact_phone: "WhatsApp Contact",
    payment_method: "Payment Method",
    payment_cash: "Cash on delivery",
    payment_cash_desc: "You pay upon receiving your order.",
    payment_transfer: "Bank Transfer (Bancolombia / Nequi)",
    referral_code: "Have a referral code?",
    apply_code: "Apply",
    discount_applied: "Discount applied",
    confirm_order: "Confirm Order",
    confirming_btn: "Confirming...",
    confirm_whatsapp: "Confirm Order via WhatsApp",
    order_success: "Order successfully placed!",
    each: "ea.",
    not_available: "Not available",
    empty_cart_action: "Clear cart",
    store_closed_cart_msg: "The store is temporarily closed. You will be able to order as soon as we open.",
    store_closed_btn: "Store Temporarily Closed",
    remove_sold_out_msg: "Remove out of stock items from your cart to continue.",
    change_btn: "Change",
    edit_btn: "Edit",
    cancel_edit_btn: "Cancel edit",
    address_required_error: "You cannot proceed to checkout without an address. Let us know where to deliver your order.",
    detect_gps_btn: "Detect current location with GPS",
    getting_gps: "Getting GPS location...",
    select_saved_address: "Or select a saved address:",
    main_address_label: "Main Address",
    main_address_placeholder: "E.g. Calle 45 # 12-34 or Hotel / Building name",
    neighborhood_label: "Neighborhood / Area",
    neighborhood_placeholder: "E.g. El Poblado, Laureles",
    apartment_label: "Apt / Unit (Optional)",
    apartment_placeholder: "E.g. Apt 301, Room 204",
    notes_label: "Driver instructions (Optional)",
    notes_placeholder: "E.g. Leave with reception, ring bell...",
    delivery_type_title: "Delivery Option",
    delivery_normal: "Standard",
    delivery_fast: "Fast 🚀",
    order_summary_title: "Summary",

    // Order Tracking & Status
    order_status_title: "Order Status",
    order_number: "Order",
    status_pending: "Pending",
    status_accepted: "Accepted",
    status_preparing: "Preparing",
    status_in_transit: "On the way",
    status_dispatched: "On the way",
    status_arrived: "Arrived",
    status_delivered: "Delivered",
    status_cancelled: "Cancelled",
    driver_arrived: "🛵 The driver has arrived outside!",
    in_transit_desc: "Your order is on the way to your location.",
    preparing_desc: "We are packing your items right now.",
    live_tracking: "Live Tracking",
    open_whatsapp: "Open WhatsApp",
    back_to_store: "Back to store",
    back_to_home: "Back to home",
    my_orders_btn: "My orders",
    order_confirmed_title: "Order confirmed!",
    order_confirmed_desc: "You will pay in cash upon delivery.",
    push_alerts_title: "Delivery alerts on your phone",
    push_alerts_desc: "Get live alerts when your order is accepted or dispatched.",
    my_orders_title: "My Orders",
    my_orders_subtitle: "Order history and live tracking",
    no_orders_yet: "No orders yet",
    no_orders_yet_desc: "When you place an order, it will appear here so you can track it in real time.",
    live_tracking_title: "Live Tracking",
    live_tracking_subtitle: "Delivery status",
    live_badge: "Live",
    step_received: "Received",
    step_accepted: "Accepted",
    step_in_transit: "On the Way",
    step_arrived: "Arrived",
    status_cancelled_title: "Order cancelled",
    status_cancelled_reason: "Reason",
    status_received_title: "Order received",
    status_received_desc: "Your order is queued and will be confirmed shortly.",
    status_accepted_title: "The store accepted your order!",
    status_accepted_desc: "Your order is being packed and prepared for dispatch.",
    status_in_transit_title: "Driver is on the way",
    status_arrived_title: "The driver has arrived!",
    status_delivered_title: "Order delivered!",
    driver_vehicle: "Vehicle",
    driver_at_point: "Driver at delivery point",
    waiting_time: "Wait time",
    contact_number_prompt: "Enter your contact number so the driver can reach you:",
    send_btn: "Send",
    number_sent: "Number sent",
    delivery_address_section: "Delivery Address",
    order_summary_section: "Order Summary",
    keep_shopping_btn: "Keep shopping (Go to home)",
    view_all_orders_btn: "View all my orders",

    // Onboarding & Install
    welcome_title: "Welcome to Trippy Land",
    welcome_desc: "Exotic delivery in minutes in Medellín. Cash on delivery or bank transfer.",
    get_started: "Start ordering",
    skip: "Skip",
    install_title: "Add Trippy Land to your Home Screen",
    install_subtitle: "Fast launch and real-time delivery alerts on your lock screen.",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

const LANG_KEY = "tls_lang";

/**
 * Detecta el idioma inicial según la preferencia guardada o el navegador del cliente.
 * Si detecta el navegador, lo guarda inmediatamente en localStorage para que al agregar
 * a pantalla de inicio (PWA) o reabrir se mantenga en el idioma correspondiente.
 */
export function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "es";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "es") return saved;

    const navLang = navigator.language || (navigator as any).userLanguage || "";
    if (navLang.toLowerCase().startsWith("en")) {
      try {
        localStorage.setItem(LANG_KEY, "en");
      } catch {}
      return "en";
    }
    
    try {
      localStorage.setItem(LANG_KEY, "es");
    } catch {}
    return "es";
  } catch {
    return "es";
  }
}

/**
 * Hook para obtener y cambiar el idioma reactivamente en cualquier componente.
 */
export function useLanguage() {
  const [lang, setLangState] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    const handleSync = () => {
      const current = getInitialLanguage();
      setLangState(current);
    };

    window.addEventListener("tls_lang_change", handleSync);
    return () => window.removeEventListener("tls_lang_change", handleSync);
  }, []);

  const setLanguage = (newLang: Language) => {
    try {
      localStorage.setItem(LANG_KEY, newLang);
      setLangState(newLang);
      window.dispatchEvent(new Event("tls_lang_change"));
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    return translations[lang][key] || fallback || translations.es[key] || String(key);
  };

  return {
    lang,
    setLanguage,
    t,
    isEn: lang === "en",
    isEs: lang === "es",
  };
}
