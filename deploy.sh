#!/bin/bash

# Script per il deployment del gioco di avventura interattiva

# Ferma lo script in caso di errore
set -e

echo "Inizio del processo di deployment..."

# 1. Pulisci la directory di build precedente (se esiste)
echo "Pulizia della directory di build precedente..."
rm -rf dist/

# 2. Installa/aggiorna le dipendenze (se necessario)
# echo "Verifica delle dipendenze..."
# npm install # Descommenta se hai dipendenze di runtime da installare

# 3. Esegui il build del progetto
echo "Creazione della build di produzione..."
npm run build

# 4. (Opzionale) Esegui test
# echo "Esecuzione dei test..."
# npm test # Descommenta se hai test da eseguire

# 5. Copia i file statici necessari nella directory di build
# Questo potrebbe includere index.html, assets, ecc., se non gestiti da webpack
echo "Copia dei file statici..."
# Esempio: Copia index.html se non è generato da webpack o se vuoi una versione specifica
cp index.html dist/
# Esempio: Copia la cartella assets
cp -r assets dist/
# Esempio: Copia la cartella locales
cp -r locales dist/
# Esempio: Copia la cartella css (se non inclusa nel bundle JS da webpack)
# cp -r css dist/
# Esempio: Copia la cartella pages (se sono HTML statici e non gestiti da routing JS)
# cp -r pages dist/

# 6. (Opzionale) Compressione dei file per ottimizzare il caricamento
# Potresti usare gzip o brotli qui sui file JS, CSS, HTML
# echo "Compressione dei file..."
# find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k {} \;
# find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec brotli -Z -k {} \;


# 7. Deployment sul server/servizio di hosting
# Questa parte dipende fortemente da dove stai facendo il deployment (es. AWS S3, GitHub Pages, Netlify, server privato)
echo "Inizio del deployment effettivo..."

# Esempio per GitHub Pages (assumendo che 'dist' sia la cartella di pubblicazione)
# git add dist && git commit -m "Deploy: new build"
# git subtree push --prefix dist origin gh-pages

# Esempio per un server remoto usando scp/rsync
# SERVER_USER="utente"
# SERVER_HOST="tuo_dominio.com"
# TARGET_PATH="/var/www/html/gioco-avventura"
# rsync -avz --delete dist/ "${SERVER_USER}@${SERVER_HOST}:${TARGET_PATH}"

echo "----------------------------------------------------"
echo "SCRIPT DI DEPLOYMENT (ESEMPIO)"
echo "Questo è uno script di esempio. Devi personalizzare"
echo "la sezione 'Deployment sul server/servizio di hosting'"
echo "in base al tuo ambiente di deployment specifico."
echo "Ad esempio, per Netlify o Vercel, spesso il build"
echo "e il deploy sono gestiti automaticamente collegando"
echo "il repository Git."
echo "----------------------------------------------------"

echo "Processo di deployment completato con successo!"
echo "La build si trova in 'dist/'."

exit 0
