import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import https from 'https';

// Forzar resolución IPv4 en Windows para evitar ENOTFOUND
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const productsDir = path.resolve(rootDir, 'public', 'productos');

const SUPABASE_HOST = 'cdmoyqxorxecbmqbsafz.supabase.co';
const SUPABASE_URL = `https://${SUPABASE_HOST}`;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbW95cXhvcnhlY2JtcWJzYWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzIyNzQsImV4cCI6MjEwMjk0ODI3NH0.e9pcbzDbHvCiq6rDWmW0jgwMw_B1wUVVQffACgmSxPo';

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Función HTTPS nativa con soporte robusto de red
function httpRequest(options, dataBuffer = null) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      ...options,
      family: 4, // Forzar IPv4
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          text: async () => body,
          json: async () => JSON.parse(body || '{}'),
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (dataBuffer) {
      req.write(dataBuffer);
    }
    req.end();
  });
}

async function run() {
  console.log('=== SUBIENDO FOTOS A SUPABASE STORAGE ===\n');

  if (!fs.existsSync(productsDir)) {
    console.error(`[ERROR] No existe el directorio: ${productsDir}`);
    return;
  }

  // 1. Obtener todos los productos de Supabase
  console.log('Obteniendo lista de productos desde Supabase...');
  let dbProducts = [];
  try {
    const prodRes = await httpRequest({
      hostname: SUPABASE_HOST,
      path: '/rest/v1/products?select=id,name,image_url',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!prodRes.ok) {
      console.error('[ERROR] al obtener productos de Supabase:', await prodRes.text());
      return;
    }

    dbProducts = await prodRes.json();
    console.log(`✓ Total productos en BD: ${dbProducts.length}\n`);
  } catch (err) {
    console.error('[ERROR de conexión con Supabase]:', err.message);
    return;
  }

  // 2. Leer archivos en public/productos
  const files = fs.readdirSync(productsDir).filter(f => !f.startsWith('.'));
  console.log(`Archivos encontrados en public/productos: ${files.length}\n`);

  let updatedCount = 0;

  for (const fileName of files) {
    const filePath = path.join(productsDir, fileName);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    const fileBuffer = fs.readFileSync(filePath);
    const baseName = path.parse(fileName).name.trim();
    const normFileName = normalize(baseName);

    // Encontrar productos que coincidan
    const matched = dbProducts.filter(p => {
      const normProdName = normalize(p.name);
      if (normFileName === normProdName) return true;

      if (normFileName.includes('xanax') && normProdName.includes('xanax')) return true;
      if (normFileName.includes('rivotril') && normProdName.includes('rivotril')) return true;
      if (normFileName.includes('clonazepam') && normProdName.includes('clonazepam')) return true;
      if (normFileName.includes('ritalina') && normProdName.includes('ritalina')) return true;
      if (normFileName.includes('oxycodona') && normProdName.includes('oxycodona')) return true;
      if (normFileName.includes('metadona') && normProdName.includes('metadona')) return true;
      if (normFileName.includes('ice') && normProdName.includes('ice')) return true;

      if (normFileName.includes('cocalavada') && normProdName.includes('cocalavada')) return true;
      if (normFileName.includes('cocapura') && normProdName.includes('cocapura')) return true;

      if (normFileName.includes('chocolatina') && normProdName.includes('chocolatina')) return true;
      if (normFileName.includes('hongospack') && normProdName.includes('hongospack')) return true;
      if (normFileName.includes('hongosunidad') && normProdName.includes('hongosunidad')) return true;
      if (normFileName.includes('dmtpuro') && normProdName.includes('dmtpuro')) return true;
      if (normFileName.includes('dmtvapo') && normProdName.includes('dmtvapo')) return true;

      if (normFileName.includes('molly') && normProdName.includes('molly')) return true;
      if (normFileName.includes('nexus1gr') && normProdName.includes('nexus') && !normProdName.includes('pildora')) return true;
      if (normFileName.includes('pildoranexus') && normProdName.includes('pildoranexus')) return true;
      if (normFileName.includes('mdma') && normProdName.includes('mdma')) return true;
      if (normFileName.includes('popperrush') && normProdName.includes('popperrush')) return true;
      if (normFileName.includes('popperfermin') && normProdName.includes('popperfermin')) return true;
      if (normFileName.includes('tussi3gramos') && normProdName.includes('tussi3gramos')) return true;
      if (normFileName.includes('tussiazul') && normProdName.includes('tussiazul')) return true;
      if (normFileName.includes('tussimanilla') && normProdName.includes('tussimanilla')) return true;
      if (normFileName.includes('tussitussi') && normProdName.includes('tussitussi')) return true;
      if (normFileName.includes('potencializador') && normProdName.includes('potencializador')) return true;

      if (normFileName.includes('rosin') && normProdName.includes('rosin')) return true;
      if (normFileName.includes('liveresin') && normProdName.includes('liveresin')) return true;
      if (normFileName.includes('hachis') && normProdName.includes('hachis')) return true;
      if (normFileName.includes('polen') && normProdName.includes('polen')) return true;
      if (normFileName.includes('gotascbd') && normProdName.includes('gotascbd')) return true;
      if (normFileName.includes('gotasthc') && normProdName.includes('gotasthc')) return true;
      if (normFileName.includes('vaporizador') && normProdName.includes('vaporizador')) return true;
      if (normFileName.includes('gomitas') && normProdName.includes('gomitas')) return true;
      if (normFileName.includes('extasis') && normProdName.includes('extasis')) return true;
      if (normFileName.includes('candy') && normProdName.includes('candy')) return true;
      if (normFileName.includes('papel') && normProdName.includes('papel')) return true;
      if (normFileName.includes('micropunto') && normProdName.includes('micropunto')) return true;
      if (normFileName.includes('filimento') && normProdName.includes('filimento')) return true;
      if (normFileName.includes('ketamina') && normProdName.includes('ketamina') && !normProdName.includes('filimento')) return true;
      if (normFileName.includes('ghb') && normProdName.includes('ghb')) return true;

      return false;
    });

    if (matched.length === 0) {
      console.log(`[OMITIDO] "${fileName}" (no coincide con productos pendientes)`);
      continue;
    }

    const cleanName = Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `products/${cleanName}`;
    const contentType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    console.log(`Subiendo "${fileName}" -> Storage (${storagePath})...`);

    try {
      // Subir a Storage via HTTPS con IPv4
      const uploadRes = await httpRequest({
        hostname: SUPABASE_HOST,
        path: `/storage/v1/object/product-images/${storagePath}`,
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
      }, fileBuffer);

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error(`  [ERROR Storage] ${fileName}: ${errText}`);
        continue;
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`;

      // Actualizar cada producto en la BD
      for (const prod of matched) {
        const updateBody = JSON.stringify({ image_url: publicUrl });
        const updateRes = await httpRequest({
          hostname: SUPABASE_HOST,
          path: `/rest/v1/products?id=eq.${prod.id}`,
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
            'Content-Length': Buffer.byteLength(updateBody),
          },
        }, Buffer.from(updateBody));

        if (!updateRes.ok) {
          console.error(`  [ERROR DB] ${prod.name}: ${await updateRes.text()}`);
        } else {
          console.log(`  ✓ Vinculado: ${prod.name}`);
          updatedCount++;
        }
      }
    } catch (uploadErr) {
      console.error(`  [EXCEPCION] en ${fileName}:`, uploadErr.message);
    }
  }

  console.log('\n==============================================');
  console.log(`TOTAL COMPLETADO: ${updatedCount} productos vinculados con éxito.`);
  console.log('==============================================\n');
}

run();
