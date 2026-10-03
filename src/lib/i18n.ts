import { useState, useEffect } from "react";

export type Language = "es" | "en";

export const translations = {
  es: {
    // Navigation & App Shell
    nav_home: "Inicio",
    nav_catalog: "Catálogo",
    nav_orders: "Pedidos",
    nav_cart: "Carrito",
    where_deliver: "¿Dónde te entregamos?",
    select_address: "Selecciona una dirección",
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

    // Address Manager Drawer
    address_details_title: "Detalles de tu dirección",
    use_gps_location: "Usar mi ubicación GPS actual",
    enter_address_manual: "Escribir dirección manualmente",
    saved_addresses: "Direcciones Guardadas",
    gps_detected_success: "Ubicación GPS detectada correctamente",
    main_address_required: "Dirección Principal",
    main_address_placeholder_mgr: "Ej: Calle 45 # 12-34 o Edificio / Hotel",
    neighborhood_mgr: "Barrio o Sector",
    neighborhood_placeholder_mgr: "Ej: El Poblado, Laureles",
    apartment_mgr: "Apto / Casa (Opcional)",
    apartment_placeholder_mgr: "Ej: Apto 301, Hab 402",
    instructions_mgr: "Indicaciones Adicionales",
    instructions_placeholder_mgr: "Ej: Dejar en recepción, casa con reja negra...",
    save_and_use: "Guardar y Usar",
    back_btn: "Volver",
    toast_valid_address: "Escribe una dirección válida.",
    toast_address_saved: "Dirección guardada correctamente.",
    toast_gps_success: "Ubicación obtenida. Por favor completa los detalles.",
    toast_gps_error: "No se pudo obtener tu ubicación. Por favor escríbela.",
    browser_no_gps: "Tu navegador no soporta geolocalización.",
    error_save_address: "Error al guardar la dirección en la nube.",

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
    desired_effects: "Efectos deseados",
    thc: "THC",
    cbd: "CBD",
    buy_now: "Comprar ahora",
    add_to_cart_btn: "Agregar al carrito",
    update_cart_btn: "Actualizar Carrito",
    add_btn: "Agregar",
    saved_favorite: "❤️ Guardado en tus favoritos",
    removed_favorite: "Eliminado de tus favoritos",
    product_sold_out: "Producto agotado",
    loading: "Cargando...",

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
    where_deliver: "Where to deliver?",
    select_address: "Select a delivery address",
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

    // Address Manager Drawer
    address_details_title: "Address details",
    use_gps_location: "Use my current GPS location",
    enter_address_manual: "Enter address manually",
    saved_addresses: "Saved Addresses",
    gps_detected_success: "GPS location detected successfully",
    main_address_required: "Main Address",
    main_address_placeholder_mgr: "E.g. Calle 45 # 12-34 or Hotel / Building name",
    neighborhood_mgr: "Neighborhood / Area",
    neighborhood_placeholder_mgr: "E.g. El Poblado, Laureles",
    apartment_mgr: "Apt / House (Optional)",
    apartment_placeholder_mgr: "E.g. Apt 301, Room 402",
    instructions_mgr: "Additional Instructions",
    instructions_placeholder_mgr: "E.g. Leave with reception, black gate house...",
    save_and_use: "Save & Use",
    back_btn: "Back",
    toast_valid_address: "Please enter a valid address.",
    toast_address_saved: "Address saved successfully.",
    toast_gps_success: "Location acquired. Please complete the details.",
    toast_gps_error: "Could not get your location. Please type it.",
    browser_no_gps: "Your browser does not support geolocation.",
    error_save_address: "Error saving address to cloud.",

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
    desired_effects: "Desired Effects",
    thc: "THC",
    cbd: "CBD",
    buy_now: "Buy Now",
    add_to_cart_btn: "Add to Cart",
    update_cart_btn: "Update Cart",
    add_btn: "Add",
    saved_favorite: "❤️ Saved to your favorites",
    removed_favorite: "Removed from your favorites",
    product_sold_out: "Sold out",
    loading: "Loading...",

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
 * Diccionario de efectos deseados y descripciones de catálogo en inglés.
 */
const PRODUCT_TEXT_MAP_EN: Record<string, string> = {
  // Headers & Strains
  "efectos deseados": "Desired Effects",
  "efecto deseado": "Desired Effects",
  "flor híbrida": "Hybrid Flower",
  "flor hibrida": "Hybrid Flower",
  "flor sativa": "Sativa Flower",
  "flor indica": "Indica Flower",
  "unidad de pre-roll": "Single Pre-Roll",
  "paquete de 10 minis": "Pack of 10 Minis",
  "híbrida": "Hybrid",
  "hibrida": "Hybrid",
  "sativa": "Sativa",
  "indica": "Indica",
  "premium": "Premium",

  // Bullet point effects
  "experiencias visuales extremadamente intensas y colores vívidos": "Extremely intense visual experiences and vivid colors",
  "alteración profunda de la percepción del tiempo y el espacio": "Deep alteration of time and space perception",
  "sensación de separación o trascendencia del cuerpo": "Sensation of separation or transcendence from the body",
  "cambios intensos en los pensamientos y las emociones": "Intense changes in thoughts and emotions",
  "sensación de conexión espiritual o experiencia mística": "Feeling of spiritual connection or mystical experience",
  "percepción de formas, escenarios o presencias que parecen reales": "Perception of patterns, landscapes, or presence that feel real",
  "relajación profunda y sensación de bienestar": "Deep relaxation and feeling of well-being",
  "euforia y elevación del estado de ánimo": "Euphoria and elevated mood",
  "intensificación de sabores, sonidos y sensaciones": "Intensification of flavors, sounds, and sensations",
  "disminución temporal del estrés y la tensión corporal": "Temporary relief from stress and bodily tension",
  "aumento del apetito": "Increased appetite",
  "posible alivio del dolor, según su perfil de cannabinoides": "Potential pain relief, depending on cannabinoid profile",
  "calma y relajación profunda": "Deep calm and relaxation",
  "disminución de la ansiedad intensa": "Reduction of severe anxiety",
  "control de las crisis de pánico": "Control of panic attacks",
  "reducción de la tensión muscular": "Reduction of muscle tension",
  "apoyo en el control de convulsiones": "Support for seizure control",
  "sensación de tranquilidad y descanso": "Feeling of tranquility and deep rest",
  "control de convulsiones y determinados tipos de epilepsia": "Seizure management and epilepsy support",
  "disminución de las crisis de pánico y la ansiedad intensa": "Reduction of panic attacks and intense anxiety",
  "sensación de calma, equilibrio y relajación": "Sensation of calm, balance, and relaxation",
  "conciliación del sueño y descanso profundo": "Sleep induction and restorative rest",
  "alivio de la ansiedad y las crisis de pánico": "Relief from anxiety and panic attacks",
  "sensación de calma, bienestar y relajación": "Sensation of calm, well-being, and relaxation",
  "colores, formas, sonidos y texturas más intensos": "Enhanced colors, shapes, sounds, and textures",
  "euforia, asombro y cambios profundos en el estado de ánimo": "Euphoria, wonder, and deep mood shifts",
  "mayor introspección y sensibilidad emocional": "Greater introspection and emotional sensitivity",
  "sensación de conexión con el entorno o experiencias espirituales": "Feeling of connection with surroundings or spiritual experiences",
  "imágenes, patrones o alucinaciones visuales": "Visual patterns, imagery, and hallucinations",
  "relajación mental y corporal": "Mental and physical relaxation",
  "disminución temporal del dolor, las náuseas o la tensión": "Temporary relief from pain, nausea, or tension",
  "disminución temporal del dolor y las náuseas": "Temporary relief from pain and nausea",
  "posible facilidad para conciliar el sueño": "Helps facilitate falling asleep",
  "aumento del deseo y la excitación sexual": "Increased sexual desire and arousal",
  "mayor sensibilidad y placer": "Heightened sensitivity and pleasure",
  "favorecimiento de la erección o lubricación": "Promotes performance and lubrication",
  "mayor confianza, energía y resistencia": "Increased confidence, energy, and stamina",
  "intensificación de la experiencia íntima": "Intensification of the intimate experience",
  "alivio del dolor intenso y persistente": "Effective relief for severe and persistent pain",
  "disminución de los síntomas de abstinencia a otros opioides": "Reduction of opioid withdrawal symptoms",
  "reducción del deseo compulsivo de consumirlos": "Reduction of cravings",
  "mayor estabilidad durante el tratamiento de la dependencia a opioides": "Greater stability during dependency treatment",
  "inicio muy rápido de una experiencia psicodélica intensa": "Very fast onset of an intense psychedelic experience",
  "imágenes, colores y patrones visuales extremadamente vívidos": "Extremely vivid images, colors, and visual patterns",
  "experiencias místicas, introspectivas o espirituales": "Mystical, introspective, or spiritual experiences",
  "aromas y sabores intensos por su alto contenido de terpenos": "Rich aromas and intense flavors from high terpene content",
  "intensificación de la música, el tacto y otras sensaciones": "Intensification of music, touch, and other sensations",
  "posible alivio temporal del dolor y la tensión": "Possible temporary relief from pain and tension",
  "mayor atención y concentración": "Enhanced focus and concentration",
  "mejor control de la impulsividad": "Better impulse control",
  "disminución de la hiperactividad": "Decreased hyperactivity",
  "mayor organización y enfoque en las actividades": "Better organization and task focus",
  "reducción de la somnolencia asociada con la narcolepsia": "Reduced daytime sleepiness",
  "mayor introspección, creatividad y sensibilidad emocional": "Greater introspection, creativity, and emotional sensitivity",
  "sensación de conexión con el entorno": "Sense of connection with surroundings",
  "patrones, imágenes o experiencias visuales": "Patterns, imagery, or visual experiences",
  "sensación rápida de relajación y bienestar": "Fast sensation of relaxation and well-being",
  "posible alivio del dolor o las náuseas": "Possible relief from pain or nausea",
  "alivio eficaz del dolor intenso": "Highly effective relief for severe pain",
  "disminución de la percepción y respuesta al dolor": "Reduced pain perception and response",
  "mayor comodidad y descanso durante el tratamiento": "Greater comfort and rest during recovery",
  "mejor tolerancia al dolor cuando otros analgésicos no son suficientes": "Better pain management when standard analgesics are insufficient",
  "euforia intensa y sensación de bienestar": "Intense euphoria and feeling of well-being",
  "mayor energía, alerta y actividad": "Increased energy, alertness, and activity",
  "incremento temporal de la confianza y la sociabilidad": "Temporary boost in confidence and sociability",
  "aumento temporal de la confianza y la sociabilidad": "Temporary boost in confidence and sociability",
  "sensación de agilidad mental y concentración": "Feeling of mental clarity and focus",
  "disminución momentánea del cansancio y el apetito": "Momentary reduction of fatigue and appetite",
  "mayor energía, sociabilidad y desinhibición": "Increased energy, sociability, and disinhibition",
  "intensificación de la música, el tacto y los colores": "Intensification of music, touch, and colors",
  "sensación de conexión emocional y estimulación": "Feeling of emotional connection and stimulation",
  "posible relajación, desconexión corporal o efecto disociativo": "Possible relaxation, bodily disconnection, or dissociative effect",
  "sensación de desconexión del cuerpo y del entorno": "Sensation of disconnection from body and surroundings",
  "relajación y disminución de la percepción del dolor": "Relaxation and reduced pain perception",
  "alteración del tiempo, el espacio, la imagen y el sonido": "Alteration of time, space, visual imagery, and sound",
  "sensación de flotar o vivir una experiencia similar a un sueño": "Feeling of floating or living a dream-like experience",
  "introspección y experiencias disociativas intensas": "Introspection and intense dissociative experiences",
  "relajación y sensación de bienestar": "Relaxation and sense of well-being",
  "euforia y mayor sociabilidad": "Euphoria and increased sociability",
  "desinhibición y aumento de la sensibilidad al tacto": "Disinhibition and increased touch sensitivity",
  "somnolencia y sensación de calma": "Drowsiness and peaceful calm",
  "posible aumento del deseo sexual": "Possible boost in sexual desire",
  "sensación de calma y relajación, sin producir el “high” del thc": "Calming relaxation without the THC high",
  "sensación de calma y relajación, sin producir el \"high\" del thc": "Calming relaxation without the THC high",
  "disminución de la tensión y la ansiedad": "Reduction of stress and anxiety",
  "apoyo para conciliar el sueño y descansar mejor": "Sleep support for deeper, better rest",
  "posible alivio del dolor y la inflamación": "Potential relief from pain and inflammation",
  "relajación muscular y bienestar general": "Muscle relaxation and overall well-being",
  "intensificación de la música, los sabores y el tacto": "Intensification of music, flavors, and touch",
  "alteración de la percepción del tiempo": "Alteration of time perception",
  "sensación de relajación y desconexión": "Sensation of relaxation and detachment",
  "disminución temporal de la percepción del dolor": "Temporary reduction in pain perception",
  "alteración de la percepción del cuerpo, el tiempo y el espacio": "Alteration of body, time, and space perception",
  "intensificación de imágenes, sonidos y pensamientos": "Intensification of imagery, sounds, and thoughts",
  "experiencia introspectiva o disociativa": "Introspective or dissociative experience",
  "sensación de euforia y bienestar": "Sensation of euphoria and well-being",
  "mayor energía y estado de alerta": "Increased energy and alertness",
  "aumento de la empatía y la conexión emocional": "Heightened empathy and emotional bond",
  "mayor sociabilidad, confianza y apertura": "Greater sociability, confidence, and openness",
  "sensación de calidez y cercanía con otras personas": "Feeling of warmth and closeness with others",
  "euforia, energía y sensación de bienestar": "Euphoria, energy, and feeling of well-being",
  "mayor empatía, confianza y cercanía emocional": "Greater empathy, trust, and emotional intimacy",
  "aumento de la sociabilidad y la desinhibición": "Increased sociability and disinhibition",
  "sensación de conexión, calidez y apertura hacia los demás": "Feeling of connection, warmth, and openness to others",
  "euforia y aumento de la energía": "Euphoria and energy boost",
  "colores, música y sensaciones más intensas": "More intense colors, music, and sensations",
  "alteraciones visuales y de la percepción del tiempo": "Visual alterations and time distortion",
  "mayor sensibilidad emocional y corporal": "Greater emotional and bodily sensitivity",
  "sensación de conexión, sociabilidad y bienestar": "Sense of connection, sociability, and well-being",
  "alteraciones visuales y colores más intensos": "Visual alterations and more intense colors",
  "distorsión de la percepción del tiempo y el espacio": "Distortion of time and space perception",
  "intensificación de la música, el tacto y las emociones": "Intensification of music, touch, and emotions",
  "sensación de introspección, creatividad y conexión": "Sense of introspection, creativity, and connection",
  "posible sinestesia: percibir sonidos como colores o sensaciones": "Possible synesthesia: perceiving sounds as colors or tactile sensations",
  "alteraciones visuales, colores más intensos y patrones en movimiento": "Visual alterations, vivid colors, and moving geometric patterns",
  "percepción diferente del tiempo, el espacio y el entorno": "Shifted perception of time, space, and environment",
  "euforia, asombro o percepción de nuevas ideas": "Euphoria, wonder, and influx of novel ideas",
  "sensación intensa de energía y euforia": "Intense rush of energy and euphoria",
  "mayor estado de alerta y actividad": "Heightened alertness and physical activity",
  "disminución temporal del sueño y el apetito": "Temporary decrease in sleep need and appetite",
  "incremento de la sociabilidad y la confianza": "Boost in sociability and confidence",
  "sensación inmediata de euforia": "Immediate rush of euphoria",
  "calor corporal y aumento de la sensibilidad al tacto": "Body warmth and increased touch sensitivity",
  "mayor desinhibición durante la experiencia sexual": "Greater disinhibition during sexual experiences",
  "relajación temporal de la musculatura lisa, incluida la zona anal": "Temporary smooth muscle relaxation",
  "sensación breve de intensidad y excitación": "Brief sensation of peak intensity and arousal",
  "sensación inmediata de euforia y “rush” de corta duración": "Immediate feeling of euphoria and short-lived rush",
  "sensación inmediata de euforia y \"rush\" de corta duración": "Immediate feeling of euphoria and short-lived rush",
  "calor corporal, ligero mareo y mayor sensibilidad al tacto": "Body warmth, slight lightheadedness, and enhanced touch",
  "relajación de la musculatura lisa, incluida la zona anal": "Smooth muscle relaxation",
  "mayor desinhibición e intensificación de la experiencia sexual": "Increased disinhibition and heightened intimacy",
  "euforia y bienestar intensificados": "Intensified euphoria and well-being",
  "mayor conexión emocional, empatía y apertura": "Deep emotional bonding, empathy, and openness",
  "sensación de energía, conexión y experiencia sensorial profunda": "High energy, deep connection, and profound sensory experience",
  "intensificación de la música, el tacto y las sensaciones": "Intensification of music, touch, and sensations",
  "mayor empatía, conexión y cercanía emocional": "Increased empathy, bonding, and emotional closeness",
  "sensación de confianza, apertura y sociabilidad": "Sense of confidence, openness, and sociability",
  "intensificación de los colores, la música y el tacto": "Intensification of colors, music, and touch",
  "mayor sensibilidad emocional y sensorial": "Greater emotional and sensory sensitivity",
};

/**
 * Traduce dinámicamente descripciones, cepas y efectos del catálogo cuando el idioma es inglés.
 */
export function translateProductText(text: string | null | undefined, lang: Language): string {
  if (!text) return "";
  if (lang !== "en") return text;

  const lines = text.split("\n");
  const translatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Detectar símbolo de viñeta (✦, •, -, *)
    const bulletMatch = trimmed.match(/^([✦•\-*]\s*)(.*)$/);
    const prefix = bulletMatch ? bulletMatch[1] : "";
    const rawContent = bulletMatch ? bulletMatch[2] : trimmed;

    // Normalizar para coincidencia
    const normalized = rawContent
      .toLowerCase()
      .replace(/[\.\,\;]$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (PRODUCT_TEXT_MAP_EN[normalized]) {
      const match = PRODUCT_TEXT_MAP_EN[normalized];
      return prefix ? `${prefix}${match}.` : match;
    }

    // Comprobación directa de encabezados
    if (/^efectos?\s+deseados?/i.test(rawContent)) {
      return prefix ? `${prefix}Desired Effects` : "Desired Effects";
    }

    // Reemplazos de palabras y conceptos comunes como fallback
    let fallback = rawContent
      .replace(/Efectos deseados/gi, "Desired Effects")
      .replace(/Efectos/gi, "Effects")
      .replace(/Flor Híbrida/gi, "Hybrid Flower")
      .replace(/Flor Sativa/gi, "Sativa Flower")
      .replace(/Flor Indica/gi, "Indica Flower")
      .replace(/Híbrida/gi, "Hybrid")
      .replace(/Hibrida/gi, "Hybrid")
      .replace(/Unidad de pre-roll/gi, "Single Pre-Roll")
      .replace(/Paquete de (\d+) Minis/gi, "Pack of $1 Minis")
      .replace(/Relajación/gi, "Relaxation")
      .replace(/Euforia/gi, "Euphoria")
      .replace(/Bienestar/gi, "Well-being")
      .replace(/Ansiedad/gi, "Anxiety")
      .replace(/Conciliación del sueño/gi, "Sleep induction");

    return prefix ? `${prefix}${fallback}` : fallback;
  });

  return translatedLines.join("\n");
}

/**
 * Las categorías se mantienen siempre en inglés tal como están definidas en la base de datos.
 */
export function translateCategoryName(name: string | null | undefined, _lang?: Language): string {
  return name || "";
}

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
