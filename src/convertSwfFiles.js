const fs = require("fs");
const path = require("path");
const swf2png = require("./convert_swf.js"); // Modulo per la conversione

// Funzione per assicurarsi che la directory esista
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`📂 La directory ${dir} non esiste. La creo...`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Recupera gli argomenti: input directory e output directory
const inputDir = process.argv[2];
const outputDir = process.argv[3];

if (!inputDir || !outputDir) {
  console.error("❌ Usage: node convertSwfFiles.js <input_directory> <output_directory>");
  process.exit(1);
}

// Assicurati che la cartella di output esista
ensureDirExists(outputDir);

async function convertAllSwfFiles() {
  console.log(`📥 Leggo i file dalla directory: ${inputDir}`);
  const files = fs.readdirSync(inputDir);

  // Filtra solo i file con estensione .swf (case-insensitive)
  const swfFiles = files.filter(file => path.extname(file).toLowerCase() === '.swf');

  if (swfFiles.length === 0) {
    console.log(`✅ Nessun file SWF da convertire in ${inputDir}.`);
    return;
  }

  console.log(`🔍 Trovati ${swfFiles.length} file SWF. Controllo quali devono essere convertiti...`);

  for (const file of swfFiles) {
    const swfFilePath = path.join(inputDir, file);
    const outputFileName = path.join(outputDir, path.basename(file, '.swf') + '.png');

    // Se il PNG esiste già, saltiamo la conversione
    if (fs.existsSync(outputFileName)) {
      console.log(`⏩ Il file ${outputFileName} esiste già. Skipping...`);
      continue;
    }

    console.log(`🔄 Inizio conversione: ${swfFilePath} -> ${outputFileName}`);

    try {
      // Legge il contenuto del file SWF
      console.log(`📖 Leggo il file ${swfFilePath}...`);
      const rawData = fs.readFileSync(swfFilePath);

      // Converte il SWF in spritesheet PNG
      console.log(`🎨 Converto ${file} in PNG...`);
      const spritesheet = await swf2png(rawData);

      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(outputFileName);
        const stream = spritesheet.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
          console.log(`✅ Conversione completata: ${outputFileName}`);
          resolve();
        });
        out.on('error', (err) => {
          console.error(`❌ Errore nello scrivere ${outputFileName}:`, err);
          reject(err);
        });
      });
    } catch (error) {
      console.error(`❌ Errore durante la conversione di ${file}:`, error);
    }
  }

  console.log("🏁 Conversione completata per tutti i file SWF necessari.");
}

convertAllSwfFiles();
