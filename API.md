# Documentazione API del Gioco di Avventura Interattiva

Questo documento descrive l'architettura e le API principali dei moduli JavaScript del gioco.

## Indice

1.  [Struttura Generale JavaScript](#struttura-generale-javascript)
2.  [Core Modules (`js/core/`)](#core-modules-jscore)
    *   [`main.js`](#mainjs)
    *   [`GameEngine.js`](#gameenginejs)
    *   [`SceneManager.js`](#scenemanagerjs)
    *   [`StateManager.js`](#statemanagerjs)
    *   [`Config.js`](#configjs)
3.  [System Modules (`js/systems/`)](#system-modules-jssystems)
    *   [`SaveSystem.js`](#savesystemjs)
    *   [`Localization.js`](#localizationjs)
    *   [`AudioManager.js`](#audiomanagerjs)
    *   [`UIManager.js`](#uimanagerjs)
    *   [`InventorySystem.js`](#inventorysystemjs)
    *   [`StatsSystem.js`](#statssystemjs)
    *   [`AchievementSystem.js`](#achievementsystemjs)
    *   [`ChoiceEngine.js`](#choiceenginejs)
4.  [Controller Modules (`js/controllers/`)](#controller-modules-jscontrollers)
    *   [`MenuController.js`](#menucontrollerjs)
    *   [`GameController.js`](#gamecontrollerjs)
    *   [`OptionsController.js`](#optionscontrollerjs)
    *   [`HallOfFameController.js`](#halloffamecontrollerjs)
5.  [Narrative Modules (`js/narrative/`)](#narrative-modules-jsnarrative)
    *   [`CutscenePlayer.js`](#cutsceneplayerjs)
    *   [`StoryParser.js`](#storyparserjs)
    *   [`AnimationController.js`](#animationcontrollerjs)
6.  [Utility Modules (`js/utils/`)](#utility-modules-jsutils)
    *   [`DataLoader.js`](#dataloaderjs)
    *   [`Validation.js`](#validationjs)
    *   [`Performance.js`](#performancejs)
    *   [`Analytics.js`](#analyticsjs)
    *   [`ErrorHandler.js`](#errorhandlerjs)
7.  [Build Modules (`js/build/`)](#build-modules-jsbuild)
    *   [`build-utils.js`](#build-utilsjs)
8.  [Formato Dati (`data/`)](#formato-dati-data)

---

## 1. Struttura Generale JavaScript

Il codice JavaScript è organizzato in moduli per separazione delle responsabilità e manutenibilità. `main.js` funge da punto di ingresso principale, inizializzando i vari sistemi e controller.

---

## 2. Core Modules (`js/core/`)

Questi moduli costituiscono il nucleo fondamentale del gioco.

### `main.js`

*   **Scopo:** Punto di ingresso dell'applicazione. Inizializza tutti i sistemi principali, i gestori e avvia il gioco.
*   **Funzioni Chiave:**
    *   `init()`: Inizializza tutti i moduli necessari.
    *   `startGame()`: Avvia la logica principale del gioco, probabilmente caricando il menu principale o una scena iniziale.

### `GameEngine.js`

*   **Scopo:** Gestisce il loop principale del gioco (se applicabile per animazioni o aggiornamenti continui), coordina gli input e gli output generali del gioco.
*   **Proprietà Chiave:**
    *   `currentState`: Lo stato attuale del gioco (es. 'MENU', 'PLAYING', 'PAUSED').
*   **Metodi Chiave:**
    *   `update(deltaTime)`: Aggiorna lo stato del gioco.
    *   `render()`: Renderizza la schermata corrente (se applicabile, più probabile gestito da UIManager).
    *   `processInput(input)`: Gestisce l'input dell'utente.

### `SceneManager.js`

*   **Scopo:** Responsabile del caricamento, della gestione e della transizione tra le scene del gioco.
*   **Proprietà Chiave:**
    *   `currentScene`: L'oggetto scena attualmente attivo.
    *   `scenesData`: Dati di tutte le scene caricati da `scenes.json`.
*   **Metodi Chiave:**
    *   `loadScene(sceneId)`: Carica una scena specifica in base al suo ID.
    *   `getCurrentSceneData()`: Restituisce i dati della scena corrente.
    *   `displayCurrentScene()`: Invia i dati della scena corrente a `UIManager` per la visualizzazione.
    *   `transitionTo(nextSceneId)`: Gestisce la transizione alla scena successiva.

### `StateManager.js`

*   **Scopo:** Gestisce lo stato globale del gioco, incluse le variabili di gioco, i progressi del giocatore, le bandiere degli eventi, ecc. È anche responsabile della persistenza dello stato (salvataggio/caricamento).
*   **Proprietà Chiave:**
    *   `gameState`: Un oggetto che contiene tutte le variabili di stato del gioco.
*   **Metodi Chiave:**
    *   `get(key)`: Ottiene un valore dallo stato del gioco.
    *   `set(key, value)`: Imposta un valore nello stato del gioco.
    *   `saveGame(slotId)`: Salva lo stato corrente del gioco (utilizzando `SaveSystem`).
    *   `loadGame(slotId)`: Carica uno stato di gioco salvato (utilizzando `SaveSystem`).
    *   `resetState()`: Resetta lo stato del gioco a quello iniziale.

### `Config.js`

*   **Scopo:** Carica e fornisce accesso alle configurazioni globali del gioco da `data/config/config.json` e alle preferenze utente da `data/config/settings.json`.
*   **Proprietà Chiave:**
    *   `gameConfig`: Oggetto con le configurazioni del gioco.
    *   `userSettings`: Oggetto con le preferenze dell'utente (volume, lingua, ecc.).
*   **Metodi Chiave:**
    *   `loadConfigs()`: Carica i file JSON di configurazione.
    *   `getGameSetting(key)`: Ottiene una specifica impostazione di gioco.
    *   `getUserSetting(key)`: Ottiene una specifica preferenza utente.
    *   `setUserSetting(key, value)`: Imposta una preferenza utente e la salva (potrebbe interagire con `StateManager` o `SaveSystem` per la persistenza delle impostazioni utente).

---

## 3. System Modules (`js/systems/`)

Moduli che implementano meccaniche di gioco o funzionalità di supporto specifiche.

### `SaveSystem.js`

*   **Scopo:** Gestisce la logica di salvataggio e caricamento dei dati di gioco su `localStorage` o altre forme di persistenza.
*   **Metodi Chiave:**
    *   `save(slotId, gameState)`: Salva l'oggetto `gameState` nello slot specificato.
    *   `load(slotId)`: Carica e restituisce l'oggetto `gameState` dallo slot specificato.
    *   `listSaves()`: Restituisce un elenco dei salvataggi esistenti.
    *   `deleteSave(slotId)`: Elimina un salvataggio.

### `Localization.js`

*   **Scopo:** Gestisce la traduzione del testo del gioco in diverse lingue.
*   **Proprietà Chiave:**
    *   `currentLanguage`: La lingua attualmente selezionata.
    *   `translations`: Un oggetto contenente tutte le stringhe tradotte caricate dal file di lingua appropriato (es. `locales/it.json`).
*   **Metodi Chiave:**
    *   `loadLanguage(langCode)`: Carica il file di lingua specificato (es. 'en', 'it').
    *   `setLanguage(langCode)`: Imposta la lingua corrente.
    *   `getString(key, replacements)`: Ottiene la stringa tradotta per una data chiave, con opzionali sostituzioni di placeholder.

### `AudioManager.js`

*   **Scopo:** Controlla la riproduzione di musica di sottofondo ed effetti sonori.
*   **Metodi Chiave:**
    *   `playMusic(trackId, loop)`: Riproduce una traccia musicale.
    *   `stopMusic()`: Ferma la musica corrente.
    *   `playSound(soundId, volume)`: Riproduce un effetto sonoro.
    *   `setMusicVolume(level)`: Imposta il volume della musica.
    *   `setSfxVolume(level)`: Imposta il volume degli effetti sonori.

### `UIManager.js`

*   **Scopo:** Responsabile della manipolazione del DOM per aggiornare l'interfaccia utente, visualizzare testo, immagini, opzioni, ecc.
*   **Metodi Chiave:**
    *   `renderScene(sceneData)`: Visualizza il contenuto di una scena (testo, immagine di sfondo, personaggio).
    *   `displayChoices(choices)`: Mostra le opzioni disponibili al giocatore.
    *   `updateInventory(inventoryData)`: Aggiorna la visualizzazione dell'inventario.
    *   `updateStats(statsData)`: Aggiorna la visualizzazione delle statistiche.
    *   `showNotification(message, type)`: Mostra un messaggio di notifica.
    *   `navigateTo(pageId)`: Carica e visualizza una specifica pagina HTML (es. menu, opzioni).

### `InventorySystem.js`

*   **Scopo:** Gestisce l'inventario del giocatore (oggetti raccolti, quantità).
*   **Proprietà Chiave:**
    *   `items`: Un array o oggetto che rappresenta gli oggetti nell'inventario.
*   **Metodi Chiave:**
    *   `addItem(itemId, quantity)`: Aggiunge un oggetto all'inventario.
    *   `removeItem(itemId, quantity)`: Rimuove un oggetto dall'inventario.
    *   `hasItem(itemId)`: Verifica se il giocatore possiede un certo oggetto.
    *   `getItemCount(itemId)`: Restituisce la quantità di un oggetto posseduto.
    *   `loadItemsData()`: Carica i dati degli oggetti da `data/game/items.json`.

### `StatsSystem.js`

*   **Scopo:** Traccia e gestisce le statistiche del giocatore (es. salute, carisma, punteggio).
*   **Proprietà Chiave:**
    *   `stats`: Un oggetto che memorizza le statistiche del giocatore.
*   **Metodi Chiave:**
    *   `getStat(statName)`: Ottiene il valore di una statistica.
    *   `setStat(statName, value)`: Imposta il valore di una statistica.
    *   `increaseStat(statName, amount)`: Aumenta una statistica.
    *   `decreaseStat(statName, amount)`: Diminuisce una statistica.

### `AchievementSystem.js`

*   **Scopo:** Gestisce lo sblocco e il tracciamento degli achievements.
*   **Proprietà Chiave:**
    *   `achievementsStatus`: Oggetto che traccia quali achievements sono stati sbloccati.
    *   `achievementsData`: Dati di tutti gli achievements caricati da `data/game/achievements.json`.
*   **Metodi Chiave:**
    *   `unlock(achievementId)`: Sblocca un achievement.
    *   `isUnlocked(achievementId)`: Verifica se un achievement è stato sbloccato.
    *   `getUnlockedAchievements()`: Restituisce un elenco degli achievements sbloccati.
    *   `loadAchievementsData()`: Carica i dati degli achievements.

### `ChoiceEngine.js`

*   **Scopo:** Elabora le scelte del giocatore, valuta le condizioni (se presenti) e determina l'esito o la scena successiva.
*   **Metodi Chiave:**
    *   `processChoice(choiceObject)`: Valuta una scelta selezionata dal giocatore.
    *   `evaluateConditions(conditions)`: Verifica se le condizioni per una scelta o un evento sono soddisfatte (interagisce con `StateManager`).
    *   `determineNextScene(outcome)`: Basandosi sull'esito di una scelta, determina l'ID della scena successiva.

---

## 4. Controller Modules (`js/controllers/`)

Questi moduli gestiscono la logica specifica per le diverse schermate o sezioni dell'interfaccia utente.

### `MenuController.js`

*   **Scopo:** Gestisce la logica e le interazioni per il menu principale (Nuova Partita, Carica Partita, Opzioni, Crediti).
*   **Metodi Chiave:**
    *   `init()`: Imposta gli event listener per i pulsanti del menu.
    *   `handleNewGame()`: Avvia una nuova partita.
    *   `handleLoadGame()`: Apre la schermata di caricamento partita.
    *   `handleOptions()`: Apre la schermata delle opzioni.

### `GameController.js`

*   **Scopo:** Gestisce la logica dell'interfaccia utente durante il gameplay principale (visualizzazione scene, gestione input scelte).
*   **Metodi Chiave:**
    *   `init()`: Inizializza la schermata di gioco.
    *   `displayScene(sceneData)`: Utilizza `UIManager` per visualizzare la scena.
    *   `handleChoiceSelection(choiceId)`: Invia la scelta selezionata a `ChoiceEngine` e/o `SceneManager`.

### `OptionsController.js`

*   **Scopo:** Gestisce la logica per la schermata delle opzioni (audio, lingua, grafica, ecc.).
*   **Metodi Chiave:**
    *   `init()`: Carica le impostazioni correnti e imposta gli event listener.
    *   `saveSettings()`: Salva le modifiche alle impostazioni (utilizzando `Config.js` o `StateManager.js`).
    *   `applyAudioSettings(volumeMusic, volumeSfx)`: Applica le impostazioni audio.
    *   `applyLanguageSetting(langCode)`: Applica l'impostazione della lingua.

### `HallOfFameController.js`

*   **Scopo:** Gestisce la visualizzazione della Hall of Fame e della griglia degli achievements.
*   **Metodi Chiave:**
    *   `init()`: Carica i dati necessari e imposta la visualizzazione.
    *   `displayAchievements()`: Mostra gli achievements sbloccati e non.
    *   `displayHighScores()`: (Se applicabile) Mostra i punteggi più alti.

---

## 5. Narrative Modules (`js/narrative/`)

Moduli dedicati alla gestione degli aspetti narrativi e cinematici del gioco.

### `CutscenePlayer.js`

*   **Scopo:** Gestisce la riproduzione di cutscene (intro, finali, intermezzi).
*   **Metodi Chiave:**
    *   `play(cutsceneId)`: Avvia la riproduzione di una cutscene specifica.
    *   `nextFrame()`: Avanza al frame/segmento successivo della cutscene.
    *   `skip()`: Permette di saltare la cutscene.

### `StoryParser.js`

*   **Scopo:** (Potenziale) Se la storia è definita in un formato complesso (es. simile a Twine), questo modulo la analizza e la converte in una struttura dati utilizzabile da `SceneManager`.
*   **Metodi Chiave:**
    *   `parse(storyData)`: Analizza i dati grezzi della storia.

### `AnimationController.js`

*   **Scopo:** Gestisce animazioni semplici per elementi UI o personaggi durante le scene/cutscene.
*   **Metodi Chiave:**
    *   `playAnimation(element, animationName, duration)`: Esegue un'animazione su un elemento.
    *   `fadeIn(element, duration)`: Animazione di dissolvenza in entrata.
    *   `fadeOut(element, duration)`: Animazione di dissolvenza in uscita.

---

## 6. Utility Modules (`js/utils/`)

Funzioni di supporto trasversali utilizzate da altri moduli.

### `DataLoader.js`

*   **Scopo:** Funzioni generiche per caricare file JSON o altre risorse.
*   **Metodi Chiave:**
    *   `loadJSON(filePath)`: Carica e analizza un file JSON. Restituisce una Promise.
    *   `loadImage(imagePath)`: Carica un'immagine. Restituisce una Promise.
    *   `loadAudio(audioPath)`: Carica un file audio. Restituisce una Promise.

### `Validation.js`

*   **Scopo:** Funzioni per validare dati, input utente, ecc.
*   **Metodi Chiave:**
    *   `isValidEmail(email)`: Controlla se una stringa è un'email valida.
    *   `isNumber(value)`: Controlla se un valore è un numero.

### `Performance.js`

*   **Scopo:** Strumenti per misurare le prestazioni del gioco (FPS, tempi di caricamento).
*   **Metodi Chiave:**
    *   `startBenchmark(name)`: Avvia un benchmark.
    *   `endBenchmark(name)`: Termina un benchmark e registra il risultato.

### `Analytics.js`

*   **Scopo:** (Opzionale) Invia dati di gioco anonimi a un servizio di analytics (se implementato).
*   **Metodi Chiave:**
    *   `trackEvent(eventName, eventData)`: Traccia un evento di gioco.

### `ErrorHandler.js`

*   **Scopo:** Gestione centralizzata degli errori e logging.
*   **Metodi Chiave:**
    *   `handle(error, context)`: Registra un errore e opzionalmente lo mostra all'utente.
    *   `showFatalError(message)`: Mostra un errore fatale e ferma il gioco.

---

## 7. Build Modules (`js/build/`)

Utilità utilizzate durante il processo di build (es. da Webpack).

### `build-utils.js`

*   **Scopo:** Funzioni di supporto per lo script di build, come la generazione di manifesti di file, la pulizia delle directory, ecc.
*   **Contenuto:** Dipende dalle necessità specifiche del processo di build.

---

## 8. Formato Dati (`data/`)

I file JSON in `data/` definiscono la struttura del gioco.

*   **`data/game/scenes.json`**:
    *   Array di oggetti scena. Ogni scena può avere: `id`, `title`, `text`, `backgroundImage`, `characterImage`, `musicTrack`, `choices` (array di oggetti scelta).
    *   Ogni scelta: `text`, `targetSceneId` (ID della scena a cui porta), opzionalmente `conditions` (cosa deve essere vero per mostrarla/attivarla), `effects` (cambiamenti di stato che avvengono).
*   **`data/game/items.json`**:
    *   Array di oggetti oggetto. Ogni oggetto: `id`, `name`, `description`, `type` (arma, strumento, consumabile, ecc.), `image`, `effects` (quando usato/equipaggiato).
*   **`data/game/characters.json`**:
    *   Array di oggetti personaggio. Ogni personaggio: `id`, `name`, `description`, `image`, `dialogueLines` (opzionale).
*   **`data/game/achievements.json`**:
    *   Array di oggetti achievement. Ogni achievement: `id`, `name`, `description`, `icon`, `unlockConditions`.
*   **`data/config/config.json`**:
    *   Impostazioni globali del gioco: versione, lingua predefinita, ecc.
*   **`data/config/settings.json`**:
    *   Struttura per le preferenze dell'utente: volume audio, lingua selezionata, ecc. Viene sovrascritto dalle impostazioni salvate dell'utente.

---

Questa documentazione API fornisce una panoramica di alto livello. Ogni modulo e funzione potrebbe avere dettagli implementativi più specifici che possono essere compresi esaminando il codice sorgente.
