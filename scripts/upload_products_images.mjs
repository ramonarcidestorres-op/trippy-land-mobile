import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdmoyqxorxecbmqbsafz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbW95cXhvcnhlY2JtcWJzYWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzIyNzQsImV4cCI6MjEwMjk0ODI3NH0.e9pcbzDbHvCiq6rDWmW0jgwMw_B1wUVVQffACgmSxPo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const productsDir = path.resolve('public/productos');

// Mapping file base names to product names in DB
const fileToProductsMap = [
  { file: '2cb (tussi) 3 gramos.png', products: ['2cb (tussi) 3 gramos'] },
  { file: 'Caja Clonazepam x30.png', products: ['Caja Clonazepam x30'] },
  { file: 'Caja Metadona.png', products: ['Caja Metadona', 'Metadona Unidad'] },
  { file: 'Caja Oxycodona.png', products: ['Caja Oxycodona', 'Oxycodona unidad'] },
  { file: 'Caja Ritalina.png', products: ['Caja Ritalina', 'Ritalina unidad'] },
  { file: 'Caja Rivotril.png', products: ['Caja Rivotril', 'Rivotril unidad'] },
  { file: 'Caja Xanax.png', products: ['Caja Xanax', 'Xanax unidad'] },
  { file: 'Chocolatina hongos 1gr.png', products: ['Chocolatina hongos 1gr', 'Chocolatina hongos 3 gr'] },
  { file: 'Coca lavada 1gr.png', products: ['Coca lavada 1gr', 'Coca lavada de coco 1gr'] },
  { file: 'Coca pura 1gr.png', products: ['Coca pura 1gr'] },
  { file: 'DMT puro 1 gr.png', products: ['DMT puro 1 gr', 'DMT puro 1/2'] },
  { file: 'Dmt vaporizador.png', products: ['Dmt vaporizador'] },
  { file: 'Filimento keta.png', products: ['Filimento keta'] },
  { file: 'GHB unidad.png', products: ['GHB unidad'] },
  { file: 'Gomitas thc.PNG', products: ['Gomitas thc'] },
  { file: 'Gotas Cbd.png', products: ['Gotas Cbd'] },
  { file: 'Gotas thc .png', products: ['Gotas thc'] },
  { file: 'Hachis 1gr .png', products: ['Hachis 1gr'] },
  { file: 'Hongos súper pack x5.png', products: ['Hongos súper pack x5'] },
  { file: 'Hongos unidad.png', products: ['Hongos unidad'] },
  { file: 'Ketamina 1gr.png', products: ['Ketamina 1gr'] },
  { file: 'Mdma 1gr.png', products: ['Mdma 1gr', 'Mdma 1/2'] },
  { file: 'Micropunto LSD.png', products: ['Micropunto LSD'] },
  { file: 'Molly.png', products: ['Molly 1gr', 'Molly 1/2'] },
  { file: 'Nexus 1gr.png', products: ['Nexus 1gr', 'Nexus 1/2'] },
  { file: 'Papel LSD.png', products: ['Papel LSD'] },
  { file: 'Polen - kieff 1gr.png', products: ['Polen - kieff 1gr'] },
  { file: 'Popper Fermín nacional.png', products: ['Popper Fermín nacional'] },
  { file: 'Popper rush.png', products: ['Popper rush importado'] },
  { file: 'Potencializador sexual Caja x 3.png', products: ['Potencializador sexual Caja x 3', 'Potencializador unidad'] },
  { file: 'Píldora Candy fliping.png', products: ['Píldora Candy fliping'] },
  { file: 'Píldora Nexus.png', products: ['Píldora Nexus'] },
  { file: 'Píldora extasis holandés.png', products: ['Píldora extasis holandés'] },
  { file: 'Rosin 1gr $100.png', products: ['Rosin 1gr'] },
  { file: 'Tussi premium Azul 1 gr.png', products: ['Tussi premium Azul 1 gr'] },
  { file: 'Tussi premium Tussi 1 gr.png', products: ['Tussi premium Tussi 1 gr'] },
  { file: 'Tussi premium manilla.png', products: ['Tussi premium manilla'] },
  { file: 'Unidad Ice cristal.png', products: ['Unidad Ice cristal'] },
  { file: 'Vaporizador thc 2gr.png', products: ['Vaporizador thc 2gr'] },
  { file: 'live resin.png', products: ['Live resin'] },
];

async function run() {
  console.log('Iniciando subida de imagenes a Supabase Storage...');

  for (const item of fileToProductsMap) {
    const filePath = path.join(productsDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] Archivo no encontrado: ${item.file}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    // Sanitize filename for storage
    const cleanFileName = Date.now() + '_' + item.file.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `products/${cleanFileName}`;

    console.log(`Subiendo ${item.file} -> ${storagePath}...`);
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error(`Error subiendo ${item.file}:`, error);
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Public URL: ${publicUrl}`);

    for (const prodName of item.products) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .ilike('name', prodName);

      if (updateError) {
        console.error(`Error actualizando ${prodName}:`, updateError);
      } else {
        console.log(`✓ Producto "${prodName}" actualizado con éxito`);
      }
    }
  }

  console.log('Subida completada.');
}

run();
