const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { execSync } = require('child_process');

// Recupera l'URL del webhook dalla variabile d'ambiente IMG_DISCORD
const webhookUrl = process.env.IMG_DISCORD;
if (!webhookUrl) {
  console.error("Errore: la variabile d'ambiente IMG_DISCORD non è impostata.");
  process.exit(1);
}

// Definisci le cartelle target e le categorie corrispondenti
const targetFolders = {
  'resource/c_images/album1584': 'Distintivi',
  'resource/c_images/catalogue': 'Icone catalogo',
  'resource/c_images/reception': 'Hotel view',
  'resource/c_images/web_promo_small': 'Promo Small'
};

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

// Funzione delay: ritorna una Promise che risolve dopo ms millisecondi
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(ext);
}

function getCategory(filePath) {
  for (const folder in targetFolders) {
    if (filePath.startsWith(folder)) {
      return targetFolders[folder];
    }
  }
  return 'Sconosciuto';
}

async function sendImage(imagePath, category) {
  try {
    const form = new FormData();
    // Aggiungi il file allo stream
    form.append('file', fs.createReadStream(imagePath));
    // Aggiungi un messaggio con il nome del file e la categoria
    form.append('content', `Nuova immagine in categoria **${category}**: ${path.basename(imagePath)}`);

    await axios.post(webhookUrl, form, {
      headers: form.getHeaders()
    });
    console.log(`Immagine ${path.basename(imagePath)} inviata correttamente.`);
  } catch (error) {
    console.error(`Errore nell'invio dell'immagine ${path.basename(imagePath)}:`, error.message);
  }
}

async function processNewImages() {
  let changedFiles = [];
  try {
    // Ottieni i file modificati nel commit appena creato
    changedFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD')
      .toString()
      .split('\n')
      .map(f => f.trim())
      .filter(f => f !== '');
  } catch (err) {
    console.error("Errore nell'ottenere i file modificati:", err.message);
    return;
  }

  // Filtra solo i file immagine presenti nelle cartelle target
  const newImageFiles = changedFiles.filter(file => {
    return Object.keys(targetFolders).some(folder => file.startsWith(folder)) && isImageFile(file);
  });

  if (newImageFiles.length === 0) {
    console.log("Nessuna nuova immagine trovata.");
    return;
  }

  // Invia ogni immagine trovata con un delay tra un invio e l'altro
  for (const file of newImageFiles) {
    const category = getCategory(file);
    await sendImage(file, category);
    // Aggiungi un delay di 2 secondi (2000 ms) tra un invio e l'altro
    await delay(2000);
  }
}

processNewImages();
