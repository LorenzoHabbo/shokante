const fs = require("fs");
const path = require("path");
const swf2png = require("./convert_swf.js"); // il modulo per la conversione

// Funzione per assicurarsi che la directory esista
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Recupera gli argomenti: input directory e output directory
const inputDir = process.argv[2];
const outputDir = process.argv[3];

if (!inputDir || !outputDir) {
  console.error("Usage: node convertSwfFiles.js <input_directory> <output_directory>");
  process.exit(1);
}

// Assicurati che la cartella di output esista
ensureDirExists(outputDir);

// Legge tutti i file dalla cartella di input
const files = fs.readdirSync(inputDir);

// Filtra solo i file con estensione .swf (case-insensitive)
const swfFiles = files.filter(file => path.extname(file).toLowerCase() === '.swf');

if (swfFiles.length === 0) {
  console.log(`Nessun file SWF trovato nella directory: ${inputDir}`);
}

swfFiles.forEach(file => {
  const swfFilePath = path.join(inputDir, file);
  
  // Legge il contenuto del file SWF
  const rawData = fs.readFileSync(swfFilePath);
  
  // Converte il SWF in spritesheet PNG
  swf2png(rawData)
    .then((spritesheet) => {
      // Costruisce il nome di output sostituendo l'estensione .swf con .png
      const outputFileName = path.join(outputDir, path.basename(file, '.swf') + '.png');
      
      // Crea lo stream di scrittura per il file PNG
      const out = fs.createWriteStream(outputFileName);
      const stream = spritesheet.createPNGStream();
      
      stream.pipe(out);
      out.on('finish', () => {
        console.log(`Spritesheet salvato come ${outputFileName}.`);
      });
    })
    .catch((error) => {
      console.error(`Errore durante la conversione di ${file}:`, error);
    });
});
