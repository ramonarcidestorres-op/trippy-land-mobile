/**
 * Trippy Land Store — Utilidad de optimización y resolución instantánea de imágenes
 * 
 * Prioriza los assets estáticos locales empaquetados en `/categorias/` y `/Productos/`
 * para evitar latencia de red contra Supabase Storage y brindar carga inmediata (0ms)
 * tanto en las cartas tipo Tinder como en la barra de categorías y catálogo.
 */

// Mapeo exhaustivo de nombres de categorías a assets locales ultrarrápidos
export function getCategoryImageUrl(category: { name?: string | null; slug?: string | null; icon_url?: string | null }): string {
  const name = (category.name || "").toLowerCase().trim();
  const slug = (category.slug || "").toLowerCase().trim();

  // Sintéticos / Synthetics
  if (name.includes("sint") || name.includes("synth") || slug.includes("sint") || slug.includes("synth")) {
    return "/categorias/sint%C3%A9ticos.png";
  }

  // Farmacia / Pharmacy
  if (name.includes("farm") || name.includes("pharm") || slug.includes("farm") || slug.includes("pharm")) {
    return "/categorias/farmacia.png";
  }

  // Weed / Cannabis F.
  if (name.includes("weed") || name.includes("cannabis") || name.includes("mota") || slug.includes("weed") || slug.includes("cannabis")) {
    return "/categorias/Weed.png";
  }

  // Pre-Rolls / Weed joints / Armados
  if (name.includes("pre-roll") || name.includes("pre roll") || name.includes("joint") || name.includes("armado") || slug.includes("pre-roll") || slug.includes("joint")) {
    return "/categorias/Pre-Rolls.png";
  }

  // Coca / Pureza
  if (name.includes("coca") || name.includes("perico") || slug.includes("coca")) {
    return "/categorias/Coca.png";
  }

  // Sex products / Potencializadores
  if (name.includes("sex") || slug.includes("sex")) {
    return encodeURI("/Productos/Potencializador sexual Caja x 3.png");
  }

  // Extracts / Extractos
  if (name.includes("extract") || slug.includes("extract")) {
    return encodeURI("/Productos/live resin.png");
  }

  // Edibles / Comestibles / Gomitas
  if (name.includes("edible") || name.includes("comestib") || name.includes("gom") || slug.includes("edible")) {
    return encodeURI("/Productos/Gomitas thc.PNG");
  }

  // Psychedelics / Hongos / Psicodélicos
  if (name.includes("psych") || name.includes("psic") || name.includes("hongo") || slug.includes("psych") || slug.includes("psic")) {
    return encodeURI("/Productos/Hongos unidad.png");
  }

  // Si tiene un icon_url personalizado de BD
  if (category.icon_url) {
    return category.icon_url;
  }

  return "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";
}

// Mapeo exacto y difuso de nombres de productos a archivos locales en /Productos/
const LOCAL_PRODUCT_MAP: Array<{ match: (n: string) => boolean; file: string }> = [
  // Farmacia / Medicina
  { match: (n) => n.includes("clonazepam"), file: "/Productos/Caja Clonazepam x30.png" },
  { match: (n) => n.includes("xanax"), file: "/Productos/Caja Xanax.png" },
  { match: (n) => n.includes("rivotril"), file: "/Productos/Caja Rivotril.png" },
  { match: (n) => n.includes("ritalina"), file: "/Productos/Caja Ritalina.png" },
  { match: (n) => n.includes("oxycodona"), file: "/Productos/Caja Oxycodona.png" },
  { match: (n) => n.includes("metadona"), file: "/Productos/Caja Metadona.png" },
  { match: (n) => n.includes("ice cristal") || n.includes("cristal"), file: "/Productos/Unidad Ice cristal.png" },

  // Sintéticos & Pills
  { match: (n) => n.includes("extasis") || n.includes("éxtasis") || n.includes("holand"), file: "/Productos/Píldora extasis holandés.png" },
  { match: (n) => n.includes("candy flip"), file: "/Productos/Píldora Candy fliping.png" },
  { match: (n) => n.includes("píldora nexus") || n.includes("pildora nexus"), file: "/Productos/Píldora Nexus.png" },
  { match: (n) => n.includes("nexus 1gr") || n.includes("nexus"), file: "/Productos/Nexus 1gr.png" },
  { match: (n) => n.includes("papel lsd") || n.includes("papel"), file: "/Productos/Papel LSD.png" },
  { match: (n) => n.includes("micropunto"), file: "/Productos/Micropunto LSD.png" },
  { match: (n) => n.includes("filimento") || n.includes("filamento"), file: "/Productos/Filimento keta.png" },
  { match: (n) => n.includes("ketamina") || n.includes("keta"), file: "/Productos/Ketamina 1gr.png" },
  { match: (n) => n.includes("ghb"), file: "/Productos/GHB unidad.png" },
  { match: (n) => n.includes("molly"), file: "/Productos/Molly.png" },
  { match: (n) => n.includes("mdma"), file: "/Productos/Mdma 1gr.png" },
  { match: (n) => n.includes("tussi premium azul"), file: "/Productos/Tussi premium Azul 1 gr.png" },
  { match: (n) => n.includes("tussi premium manilla") || n.includes("manilla"), file: "/Productos/Tussi premium manilla.png" },
  { match: (n) => n.includes("tussi") || n.includes("2cb"), file: "/Productos/Tussi premium Tussi 1 gr.png" },
  { match: (n) => n.includes("popper ferm") || n.includes("popper nac"), file: "/Productos/Popper Fermín nacional.png" },
  { match: (n) => n.includes("popper rush") || n.includes("popper imp") || n.includes("popper"), file: "/Productos/Popper rush.png" },

  // Psicodélicos
  { match: (n) => n.includes("hongos súper pack") || n.includes("hongos super pack") || n.includes("pack x5"), file: "/Productos/Hongos súper pack x5.png" },
  { match: (n) => n.includes("hongos"), file: "/Productos/Hongos unidad.png" },
  { match: (n) => n.includes("chocolatina"), file: "/Productos/Chocolatina hongos 1gr.png" },
  { match: (n) => n.includes("dmt vaporizador"), file: "/Productos/Dmt vaporizador.png" },
  { match: (n) => n.includes("dmt"), file: "/Productos/DMT puro 1 gr.png" },

  // Extractos & Gotas
  { match: (n) => n.includes("rosin"), file: "/Productos/Rosin 1gr $100.png" },
  { match: (n) => n.includes("live resin") || n.includes("resin"), file: "/Productos/live resin.png" },
  { match: (n) => n.includes("vaporizador") || n.includes("vape"), file: "/Productos/Vaporizador thc 2gr.png" },
  { match: (n) => n.includes("hachis") || n.includes("hachís"), file: "/Productos/Hachis 1gr .png" },
  { match: (n) => n.includes("polen") || n.includes("kieff"), file: "/Productos/Polen - kieff 1gr.png" },
  { match: (n) => n.includes("gotas cbd"), file: "/Productos/Gotas Cbd.png" },
  { match: (n) => n.includes("gotas thc") || n.includes("gotas"), file: "/Productos/Gotas thc .png" },

  // Comestibles
  { match: (n) => n.includes("gomita"), file: "/Productos/Gomitas thc.PNG" },

  // Coca
  { match: (n) => n.includes("coca lavada"), file: "/Productos/Coca lavada 1gr.png" },
  { match: (n) => n.includes("coca pura") || n.includes("coca"), file: "/Productos/Coca pura 1gr.png" },

  // Sex Products
  { match: (n) => n.includes("potencializador") || n.includes("pontencializador"), file: "/Productos/Potencializador sexual Caja x 3.png" },
];

/**
 * Retorna la URL de imagen más óptima para un producto.
 * Si existe un archivo estático local correspondiente, lo usa codificando la URI.
 * Si no, usa el `image_url` de base de datos o un fallback estético.
 */
export function getProductImageUrl(product: { name?: string | null; image_url?: string | null }): string {
  const name = (product.name || "").toLowerCase().trim();

  // 1. Buscar correspondencia en los assets locales
  const localMatch = LOCAL_PRODUCT_MAP.find((m) => m.match(name));
  if (localMatch) {
    return encodeURI(localMatch.file);
  }

  // 2. Si el producto ya tiene image_url en la BD
  if (product.image_url) {
    return product.image_url;
  }

  // 3. Fallbacks estéticos de alta calidad
  if (name.includes("gom")) {
    return "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&q=80";
  }
  if (name.includes("choco")) {
    return "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80";
  }
  return "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80";
}
