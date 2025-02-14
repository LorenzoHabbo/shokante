import os

def elimina_immagini_icon(directory="."):
    # Cammina ricorsivamente attraverso la directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            if "_icon.png" in file:
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"Eliminato: {file_path}")
                except Exception as e:
                    print(f"Errore nell'eliminare {file_path}: {e}")

if __name__ == "__main__":
    # Chiede all'utente la directory di ricerca (se non viene inserita, usa la directory corrente)
    directory = input("Inserisci la directory di ricerca (premi invio per usare la directory corrente): ") or "."
    elimina_immagini_icon(directory)
