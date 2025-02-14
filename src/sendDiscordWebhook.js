const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Recupera l'URL del webhook dalla variabile d'ambiente IMG_DISCORD
const webhookUrl = process.env.IMG_DISCORD;
if (!webhookUrl) {
  console.error("Errore: la variabile d'ambiente IMG_DISCORD non è impostata.");
  process.exit(1);
}

// Mappa delle cartelle e le categorie associate
const directories = [
  { folder: 'resource/c_images/album1584', category: 'Distintivi' },
  { folder: 'resource/c_images/catalogue', category: 'Icone catalogo' },
  { folder: 'resource/c_images/reception', category: 'Hotel view' },
  { folder: 'resource/c_images/web_promo_small', category: 'Promo Small' },
];

// Estensioni dei file da considerare come immagini
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

async function sendImage(imagePath, category) {
  try {
    const form = new FormData();
    // Aggiunge il file allo stream
    form.append('file', fs.createReadStream(imagePath));
    // Aggiunge un messaggio opzionale con il nome del file e la categoria
    form.append('content', `Nuova immagine in categoria **${category}**: ${path.basename(imagePath)}`);

    const response = await axios.post(webhookUrl, form, {
      headers: form.getHeaders()
    });
    console.log(`Immagine ${path.basename(imagePath)} inviata correttamente.`);
  } catch (error) {
    console.error(`Errore nell'invio dell'immagine ${path.basename(imagePath)}:`, error.message);
  }
}

async function processDirectories() {
  for (const { folder, category } of directories) {
    if (!fs.existsSync(folder)) {
      console.warn(`La cartella ${folder} non esiste.`);
      continue;
    }
    const files = fs.readdirSync(folder);
    // Filtra solo i file con estensioni compatibili
    const imageFiles = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));
    for (const file of imageFiles) {
      const fullPath = path.join(folder, file);
      await sendImage(fullPath, category);
    }
  }
}

processDirectories();
