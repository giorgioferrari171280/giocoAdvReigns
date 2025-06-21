// config/locales.js

/**
 * @fileoverview
 * Contiene tutti i testi localizzati per l'interfaccia utente e i dialoghi narrativi.
 * Strutturato come un oggetto JSON dove le chiavi sono i codici lingua (es. en, it, fr)
 * e i valori sono oggetti contenenti coppie chiave-valore per ogni stringa di testo.
 */

const locales = {
    // Inglese (Default)
    en: {
        // UI Elements
        ui_play_button: "Play",
        ui_load_game_button: "Load Game",
        ui_new_game_button: "New Game",
        ui_hall_of_fame_button: "Hall of Fame",
        ui_options_button: "Options",
        ui_credits_button: "Credits",
        ui_exit_game_button: "Exit Game",
        ui_back_button: "Back",
        ui_continue_button: "Continue",
        ui_next_button: "Next",
        ui_start_button: "Start",
        ui_save_button: "Save",
        ui_load_button: "Load",
        ui_delete_button: "Delete",
        ui_confirm_button: "Confirm",
        ui_cancel_button: "Cancel",
        ui_language_select_label: "Language:",
        ui_audio_on_off_button: "Audio ON/OFF",
        ui_volume_label: "Volume:",
        ui_audio_status_on: "Audio: ON",
        ui_audio_status_off: "Audio: OFF",
        ui_inventory_button: "Inventory",
        ui_hero_stats_button: "Hero",
        ui_empty_slot: "Empty Slot",
        ui_overwrite_save_confirm: "The save slot '{name}' is not empty. Overwrite?",
        ui_confirm_delete_save: "Are you sure you want to delete the save '{name}'?",
        ui_enter_save_name_placeholder: "Enter save name...",
        ui_enter_save_name_label: "Save Name:",
        ui_choose_slot_button: "Choose Slot",
        ui_loading_text: "Loading...",
        ui_loading_percentage: "Loading... {percent}%",
        ui_auto_proceeding: "Continuing automatically...",
        ui_pause_menu_title: "Game Paused",
        ui_resume_game_button: "Resume Game",
        ui_back_to_main_menu_button: "Back to Main Menu",
        ui_confirm_back_to_main_menu: "Are you sure you want to quit to the main menu? Unsaved progress will be lost.",
        ui_game_saved_successfully: "Game saved to slot '{slot}' as '{name}'.",
        player_default_name: "Hero",


        // Main Menu Titles
        main_menu_title: "Game Title - Narrative Adventure", // Placeholder, da cambiare con il titolo del gioco

        // Pre-Options Screen
        pre_options_title: "Initial Setup",

        // Options Screen
        options_screen_title: "Game Options",

        // Credits Screen
        credits_screen_title: "Credits",
        credits_developed_by: "Developed by: Your Name/Studio",
        credits_story_by: "Story by: Your Name/Writer",
        credits_art_by: "Art by: Artist Name",
        credits_music_by: "Music by: Composer Name",
        // ... altri crediti

        // Hall of Fame Screen
        hall_of_fame_title: "Hall of Fame",
        hall_of_fame_player_rank: "Rank",
        hall_of_fame_player_name: "Player Name",
        hall_of_fame_player_score: "Score", // o Punteggio
        hall_of_fame_no_entries: "No heroes have completed the adventure yet.",

        // Save/Load Screen
        save_load_screen_title_save: "Save Game", // Usato se si salva da menu pausa
        save_load_screen_title_save_new: "Choose a Slot for Your New Adventure", // Per nuova partita
        save_load_screen_title_load: "Load Game",
        save_load_select_slot: "Select a slot:", // Generico, potrebbe non servire se i pulsanti sono chiari

        // Inventory & Hero Stats
        inventory_empty: "Your inventory is empty.",
        hero_player_stats_title: "Player Attributes",
        hero_world_stats_title: "World Status",

        // Cutscenes
        cutscene_intro_title: "Introduction", // Esempio
        // dialog_intro_line1: "Welcome to the world of...", // Esempio, spostato in data/scenes o data/cutscenes

        // Game Interface
        game_money_label: "Coins:", // Esempio, da adattare al gioco (Dollars, Doubloons, etc.)
        game_current_location: "Current Location:", // Debug o UI interna

        // Player Stats (Esempi, da adattare al gioco)
        player_stat_karma: "Karma",
        player_stat_strength: "Strength",
        player_stat_reputation_pirate: "Pirate Reputation",
        player_stat_reputation_crown: "Crown Loyalty",

        // World Stats (Esempi, da adattare al gioco)
        world_stat_alarm_level: "Alarm Level",
        world_stat_pollution_level: "Pollution",
        world_stat_harmony_level: "Harmony",
        world_stat_suspicion_level: "Suspicion Level",

        // Placeholders per scene, capitoli, etc. (Questi saranno più specifici)
        scene_01_start_text: "You wake up in a strange place...",
        scene_01_choice_01: "Look around.",
        scene_01_choice_02: "Scream for help.",
        chapter_01_title: "Chapter 1: The Awakening",
        ending_generic_title: "The End",
        ending_generic_description: "Your journey concludes.",
        ach_first_step_name: "First Step",
        ach_first_step_desc: "You started your adventure.",
        sq_lost_cat_title: "Side Quest: The Lost Cat",

        // Messaggi Generici
        error_generic: "An unexpected error occurred.",
        error_loading_data: "Error loading game data.",
        error_saving_game: "Error saving game.",
        error_loading_game_slot_failed: "Failed to load game from slot {slot}.",
        error_saving_no_slot_selected: "No save slot selected.",
        error_saving_game_failed: "Failed to save game to slot {slot}.",
        error_scene_data_not_found: "Scene data not found for ID: {id}.",
        error_no_ending_found: "Could not determine a valid ending.",
        ui_achievement_unlocked: "Achievement Unlocked: {name}!",
        error_choice_conditions_not_met: "Conditions for this choice are not met.", // Raramente mostrato all'utente
    },
    // Italiano
    it: {
        // UI Elements
        ui_play_button: "Gioca",
        ui_load_game_button: "Carica Partita",
        ui_new_game_button: "Nuova Partita",
        ui_hall_of_fame_button: "Albo d'Onore",
        ui_options_button: "Opzioni",
        ui_credits_button: "Crediti",
        ui_exit_game_button: "Esci",
        ui_back_button: "Indietro",
        ui_continue_button: "Continua",
        ui_next_button: "Avanti",
        ui_start_button: "Inizia",
        ui_save_button: "Salva",
        ui_load_button: "Carica",
        ui_delete_button: "Elimina",
        ui_confirm_button: "Conferma",
        ui_cancel_button: "Annulla",
        ui_language_select_label: "Lingua:",
        ui_audio_on_off_button: "Audio ON/OFF", // Potrebbe essere un'icona
        ui_volume_label: "Volume:",
        ui_audio_status_on: "Audio: ON",
        ui_audio_status_off: "Audio: OFF",
        ui_inventory_button: "Inventario",
        ui_hero_stats_button: "Eroe",
        ui_empty_slot: "Slot Vuoto",
        ui_overwrite_save_confirm: "Lo slot di salvataggio '{name}' non è vuoto. Sovrascrivere?",
        ui_confirm_delete_save: "Sei sicuro di voler eliminare il salvataggio '{name}'?",
        ui_enter_save_name_placeholder: "Inserisci nome salvataggio...",
        ui_enter_save_name_label: "Nome Salvataggio:",
        ui_choose_slot_button: "Scegli Slot",
        ui_loading_text: "Caricamento...",
        ui_loading_percentage: "Caricamento... {percent}%",
        ui_auto_proceeding: "Avanzamento automatico...",
        ui_pause_menu_title: "Gioco in Pausa",
        ui_resume_game_button: "Riprendi Gioco",
        ui_back_to_main_menu_button: "Torna al Menu Principale",
        ui_confirm_back_to_main_menu: "Sei sicuro di voler tornare al menu principale? I progressi non salvati verranno persi.",
        ui_game_saved_successfully: "Partita salvata nello slot '{slot}' come '{name}'.",
        player_default_name: "Eroe",

        // Main Menu Titles
        main_menu_title: "Nome del Gioco - Avventura Narrativa",

        // Pre-Options Screen
        pre_options_title: "Impostazioni Iniziali",

        // Options Screen
        options_screen_title: "Opzioni di Gioco",

        // Credits Screen
        credits_screen_title: "Crediti",
        credits_developed_by: "Sviluppato da: {name}",
        credits_story_by: "Storia di: {name}",
        credits_art_by: "Grafica di: {name}",
        credits_music_by: "Musica di: {name}",

        // Hall of Fame Screen
        hall_of_fame_title: "Albo d'Onore",
        hall_of_fame_player_rank: "Pos.",
        hall_of_fame_player_name: "Nome Giocatore",
        hall_of_fame_player_score: "Punteggio",
        hall_of_fame_no_entries: "Nessun eroe ha ancora completato l'avventura.",

        // Save/Load Screen
        save_load_screen_title_save: "Salva Partita",
        save_load_screen_title_save_new: "Scegli uno Slot per la Tua Nuova Avventura",
        save_load_screen_title_load: "Carica Partita",
        save_load_select_slot: "Seleziona uno slot:",

        // Inventory & Hero Stats
        inventory_empty: "Il tuo inventario è vuoto.",
        hero_player_stats_title: "Attributi Giocatore",
        hero_world_stats_title: "Stato del Mondo",

        // Cutscenes
        cutscene_intro_title: "Introduzione",
        cutscene_intro_game_screen_01_text: "In un mondo avvolto dall'ombra...", // Esempio per data/cutscenes.js
        cutscene_intro_game_screen_02_text: "...un eroe improbabile si desta.",  // Esempio
        cutscene_intro_game_screen_03_text: "Il suo destino è ancora da scrivere.", // Esempio

        // Game Interface
        game_money_label: "Monete:",
        game_current_location: "Luogo Attuale:",

        // Player Stats
        player_stat_karma: "Karma",
        player_stat_strength: "Forza",
        player_stat_reputation_pirate: "Reputazione Pirata",
        player_stat_reputation_crown: "Lealtà alla Corona",
        player_stat_sanity: "Sanità Mentale",


        // World Stats
        world_stat_alarm_level: "Livello di Allarme",
        world_stat_pollution_level: "Inquinamento",
        world_stat_harmony_level: "Armonia",
        world_stat_suspicion_level: "Livello di Sospetto",

        // Placeholders per scene, capitoli, etc.
        scene_01_start_text: "Ti svegli in un luogo strano...",
        scene_01_choice_01: "Guardati intorno.",
        scene_01_choice_02: "Urla per chiedere aiuto.",
        scene_01_screamed_text: "Il tuo urlo riecheggia, ma nessuno risponde. Ti senti un po' più teso.",
        scene_01_choice_01_after_scream: "Guardati intorno (con cautela ora).",
        scene_02_explore_text: "Trovi una leva arrugginita e una porta chiusa.",
        scene_02_choice_pull_lever: "Tira la leva arrugginita.",
        scene_02_choice_inspect_door: "Ispeziona la porta chiusa.",


        chapter_01_title: "Capitolo 1: Il Risveglio",
        ending_generic_title: "Fine",
        ending_generic_description: "Il tuo viaggio si conclude.",
        ach_first_step_name: "Primo Passo",
        ach_first_step_desc: "Hai iniziato la tua avventura.",
        sq_lost_cat_title: "Missione Secondaria: Il Gatto Smarrito",

        // Messaggi Generici
        error_generic: "Si è verificato un errore imprevisto.",
        error_loading_data: "Errore durante il caricamento dei dati di gioco.",
        error_saving_game: "Errore durante il salvataggio della partita.",
    },
    // Francese
    fr: {
        ui_play_button: "Jouer",
        ui_load_game_button: "Charger Partie",
        ui_new_game_button: "Nouvelle Partie",
        ui_hall_of_fame_button: "Temple de la Renommée",
        ui_options_button: "Options",
        ui_credits_button: "Crédits",
        ui_exit_game_button: "Quitter le Jeu",
        ui_back_button: "Retour",
        ui_continue_button: "Continuer",
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "Titre du Jeu - Aventure Narrative",
        pre_options_title: "Configuration Initiale",
        options_screen_title: "Options du Jeu",
        credits_screen_title: "Crédits",
        hall_of_fame_title: "Temple de la Renommée",
        save_load_screen_title_save: "Sauvegarder la Partie",
        save_load_screen_title_load: "Charger la Partie",
        cutscene_intro_title: "Introduction",
        dialog_intro_line1: "Bienvenue dans le monde de...",
        ui_language_select_label: "Langue:",
        ui_loading_text: "Chargement...",
    },
    // Tedesco
    de: {
        ui_play_button: "Spielen",
        ui_load_game_button: "Spiel Laden",
        ui_new_game_button: "Neues Spiel",
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "Spieltitel - Erzählabenteuer",
        pre_options_title: "Ersteinrichtung",
        ui_language_select_label: "Sprache:",
        ui_loading_text: "Lädt...",
    },
    // Spagnolo
    es: {
        ui_play_button: "Jugar",
        ui_load_game_button: "Cargar Partida",
        ui_new_game_button: "Nueva Partida",
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "Título del Juego - Aventura Narrativa",
        pre_options_title: "Configuración Inicial",
        ui_language_select_label: "Idioma:",
        ui_loading_text: "Cargando...",
    },
    // Cinese (Semplificato)
    zh: {
        ui_play_button: "开始游戏", // Kāishǐ yóuxì
        ui_load_game_button: "加载游戏", // Jiāzài yóuxì
        ui_new_game_button: "新游戏", // Xīn yóuxì
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "游戏名称 - 叙事冒险", // Yóuxì míngchēng - Xùshì màoxiǎn
        pre_options_title: "初始设置", // Chūshǐ shèzhì
        ui_language_select_label: "语言:", // Yǔyán:
        ui_loading_text: "加载中...", // Jiāzài zhōng...
    },
    // Giapponese
    ja: {
        ui_play_button: "プレイ", // Purei
        ui_load_game_button: "ロードゲーム", // Rōdo gēmu
        ui_new_game_button: "ニューゲーム", // Nyū gēmu
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "ゲームタイトル - 物語アドベンチャー", // Gēmu taitoru - Monogatari adobenchā
        pre_options_title: "初期設定", // Shoki settei
        ui_language_select_label: "言語:", // Gengo:
        ui_loading_text: "読み込み中...", // Yomikomi-chū...
    },
    // Russo
    ru: {
        ui_play_button: "Играть", // Igrat'
        ui_load_game_button: "Загрузить Игру", // Zagruzit' Igru
        ui_new_game_button: "Новая Игра", // Novaya Igra
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "Название Игры - Повествовательное Приключение", // Nazvanie Igry - Povestvovatel'noye Priklyuchenie
        pre_options_title: "Начальная Настройка", // Nachal'naya Nastroyka
        ui_language_select_label: "Язык:", // Yazyk:
        ui_loading_text: "Загрузка...", // Zagruzka...
    },
    // Arabo
    ar: {
        ui_play_button: "لعب", // Laeb
        ui_load_game_button: "تحميل اللعبة", // Tahmil al-lueaba
        ui_new_game_button: "لعبة جديدة", // Lueaba jadida
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "عنوان اللعبة - مغامرة روائية", // Eunwan al luebat - Mughamarat riwayiya
        pre_options_title: "الإعداد الأولي", // Al'iiedadad al'awwalii
        ui_language_select_label: "لغة:", // Lugha:
        ui_loading_text: "جار التحميل...", // Jar altahmil...
    },
    // Ebraico
    he: {
        ui_play_button: "שחק", // Sakhek
        ui_load_game_button: "טען משחק", // Ta'en mishak
        ui_new_game_button: "משחק חדש", // Mishak khadash
        // ... (molte altre traduzioni necessarie)
        main_menu_title: "שם המשחק - הרפתקה סיפורית", // Shem hamishak - Harpatka sipurit
        pre_options_title: "הגדרות ראשוניות", // Hagdarot rishoniyot
        ui_language_select_label: "שפה:", // Safa:
        ui_loading_text: "טוען...", // Toen...
    }
};

// Per l'uso in vanilla JS, questo oggetto sarà globale se il file è incluso.
// Potrebbe essere incapsulato in un modulo o in un oggetto globale del gioco in seguito.
// window.gameLocales = locales;
// Per ora, `locales` sarà accessibile globalmente.
