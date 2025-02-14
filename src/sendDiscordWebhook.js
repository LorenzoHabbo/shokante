const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { execSync } = require('child_process');

// Recupera i webhook dalle variabili d'ambiente
const webhooks = {
  'resource/effects': process.env.EFF_DISCORD,       // Effetti
  'resource/furniture': process.env.FUR_DISCORD,     // Furni
  'resource/clothes': process.env.CLT_DISCORD,       // Clothing
  'resource/c_images/album1584': process.env.DST_DISCORD,  // Distintivi
  'resource/c_images/catalogue': process.env.IMG_DISCORD,  // Icone catalogo
  'resource/c_images/reception': process.env.IMG_DISCORD,  // Hotel view
  'resource/c_images/web_promo_small': process.env.IMG_DISCORD // Promo Small
};

// Filtra solo le cartelle con webhook configurati
const targetFolders = Object.keys(webhooks).filter(folder => webhooks[folder]);

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

// Funzione delay per evitare troppe richieste in rapida successione
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isImageFile(filePath) {
  return imageExtensions.includes(path.extname(filePath).toLowerCase());
}

function getWebhookForCategory(filePath) {
  for (const folder of targetFolders) {
    if (filePath.startsWith(folder)) {
      return webhooks[folder];
    }
  }
  return null;
}

async function sendImage(imagePath, category, webhookUrl) {
  if (!webhookUrl) {
    console.error(`❌ Nessun webhook configurato per la categoria ${category}.`);
    return;
  }

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('content', `🆕 Nuova immagine in categoria **${category}**: ${path.basename(imagePath)}`);

    await axios.post(webhookUrl, form, {
      headers: form.getHeaders()
    });

    console.log(`✅ Immagine inviata: ${imagePath} -> ${webhookUrl}`);
  } catch (error) {
    console.error(`❌ Errore nell'invio di ${imagePath} a ${webhookUrl}:`, error.message);
  }
}

async function processNewImages() {
  let changedFiles = [];
  try {
    // Aumenta il maxBuffer per evitare errori ENOBUFS
    changedFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { maxBuffer: 1024 * 1024 })
      .toString()
      .split('\n')
      .map(f => f.trim())
      .filter(f => f !== '');
  } catch (err) {
    console.error("❌ Errore nell'ottenere i file modificati:", err.message);
    return;
  }

  // Filtra solo i file immagine nelle cartelle con webhook configurati
  const newImageFiles = changedFiles.filter(file => 
    targetFolders.some(folder => file.startsWith(folder)) && isImageFile(file)
  );

  if (newImageFiles.length === 0) {
    console.log("📂 Nessuna nuova immagine trovata.");
    return;
  }

  // Invia ogni immagine con il webhook corretto
  for (const file of newImageFiles) {
    const category = path.basename(path.dirname(file)); // es. effects, furniture, clothes
    const webhookUrl = getWebhookForCategory(file);

    await sendImage(file, category, webhookUrl);
    await delay(2000); // Delay di 2 secondi tra un invio e l'altro
  }
}

processNewImages();
