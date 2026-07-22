// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION DU SYSTÈME D'AUTOMATION
// Plateformes réelles : MzoneX + CamtrackPro
// URLs et sélecteurs basés sur les captures d'écran du 21/07/2026
// ═══════════════════════════════════════════════════════════════════════

module.exports = {
  // ── Plateformes GPS ─────────────────────────────────────────────────
  platforms: {
    mzonex: {
      name: 'MzoneX',
      url: 'https://live.mzoneweb.net/mzonex/workspace/(map//grid:vehicles)',
      loginUrl: 'https://live.mzoneweb.net',
      login: {
        // ⚠️ À REMPLIR – utilisez des variables d'environnement en production
        // export MZONEX_USER="votre_email" && export MZONEX_PASS="votre_mdp"
        username: process.env.MZONEX_USER || 'Lss_tracking',
        password: process.env.MZONEX_USER || 'Lss@2023!',
        // Sélecteurs basés sur l'interface MzoneX v7.0.30
        selectors: {
          usernameInput: 'input[type="email"], input[name="email"], input[placeholder*="mail"], input[placeholder*="login"], #email',
          passwordInput: 'input[type="password"], input[name="password"], #password',
          submitButton: 'button[type="submit"], button:has-text("Connexion"), button:has-text("Login"), .login-button',
          loginSuccess: '.workspace, [class*="vehicle"], [class*="grid"]', // Élément visible après connexion
        },
      },
      // Sélecteurs pour la grille véhicules (basé sur capture)
      selectors: {
        // La grille des véhicules – tableau principal
        vehicleRow: 'tr[class*="row"], [role="row"], .vehicle-row, table tbody tr',
        // Colonnes par position (basé sur l'ordre visible)
        // Col 0: icônes statut | Col 1: Description | Col 2: Enregistrement | Col 3: Type événement | Col 4: Horodatage | Col 5: Vitesse | Col 6: Dernière position | Col 7: Odomètre
        columns: {
          description: 1,   // ex: "0576 TCD (LSS)"
          registration: 2,  // ex: "0576 TCD"
          eventType: 3,     // ex: "position régulière"
          timestamp: 4,     // ex: "0m 32s"
          speed: 5,         // ex: "10.0 km/h"
          lastPosition: 6,  // ex: "7, Haute Matsiatra, MADAG..."
          odometer: 7,      // ex: "14,198.0 km"
        },
        // Sélecteurs de navigation
        vehicleTab: 'button:has-text("Véhicules"), [data-tab="vehicles"]',
        vehicleGroup: 'LSS (LPSA) (42)',
      },
    },

    camtrackpro: {
      name: 'CamtrackPro',
      url: 'https://hosting.camtrack.net/?lang=fr',
      loginUrl: 'https://hosting.camtrack.net/?lang=fr',
      login: {
        username: process.env.CAMTRACK_USER || 'LSS_LPSA',
        password: process.env.CAMTRACK_PASS || 'LSSlPsA26Ok!',
        selectors: {
          usernameInput: 'input[type="text"], input[name="username"], input[placeholder*="utilisateur"], #username',
          passwordInput: 'input[type="password"], input[name="password"], #password',
          submitButton: 'button[type="submit"], button:has-text("Connexion"), button:has-text("Login"), .btn-login',
          loginSuccess: '[class*="status"], [class*="vehicle"], .sidebar, nav',
        },
      },
      // Sélecteurs basés sur l'interface CamtrackPro (capture)
      selectors: {
        // Onglet "Statuts"
        statusTab: 'a:has-text("Statuts"), button:has-text("Statuts"), [href*="status"]',
        // Liste des véhicules à gauche
        vehicleItem: '[class*="vehicle-item"], [class*="unit-item"], .vehicle-list li, .sidebar li, [class*="device-row"]',
        // Nom du véhicule dans la liste (ex: "0826 TBS-MERCEDES-LPSA(LSS)")
        vehicleName: '[class*="name"], [class*="label"], .unit-name, span',
        // Onglet Rapports (pour extraire l'historique)
        reportsTab: 'a:has-text("Rapports"), button:has-text("Rapports")',
        // Onglet Activités (pour les événements)
        activitiesTab: 'a:has-text("Activités"), button:has-text("Activités")',
      },
      // Mapping des véhicules sur CamtrackPro (ceux visibles sur la capture)
      knownVehicles: [
        '0826 TBS-MERCEDES-LPSA(LSS)',
        '0906 TBV-MERCEDES-LPSA(LSS)',
        '3076 TBS-MERCEDES-LPSA(LSS)',
        '4296 TCC-HOWO-LPSA(LSS)',
        '5346 TBU-MERCEDES-LPSA(LSS)',
        '5506 TBS-MERCEDES-LPSA(LSS)',
        '5616 TCE-CNHTC-LPSA(LSS)',
        '5626 TCE-SINOTRUK HOWO-LPSA(LSS)',
        '5716 TBS-MERCEDES-LPSA(LSS)',
        '6546 TCE-MERCEDES-LPSA(LSS)',
        '9176 TCC-HOWO-LPSA(LSS)',
      ],
    },
  },

  // ── Règles métier (seuils QHSE) ────────────────────────────────────
  rules: {
    continuousMaxMinutes: 270,  // 4h30
    tcjMaxMinutes: 600,         // 10h00
    ttjMaxMinutes: 720,         // 12h00
    speedLimit: 80,             // km/h transport matières dangereuses
    minPauseMinutes: 15,        // Pause minimale obligatoire
  },

  // ── Horaires de vérification ────────────────────────────────────────
  checkSchedule: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],

  // ── Correspondance plaques ↔ plateformes ────────────────────────────
  // D'après les captures : MzoneX a les 42 véhicules LSS
  // CamtrackPro a 11 véhicules (sous-ensemble)
  vehiclePlatformMap: {
    // MzoneX = flotte principale (42 véhicules)
    'mzonex_vehicles': 'all', // Tous les véhicules LSS
    // CamtrackPro = véhicules spécifiques (MERCEDES, HOWO, CNHTC, SINOTRUK)
    'camtrackpro_vehicles': [
      '0826 TBS', '0906 TBV', '3076 TBS', '4296 TCC',
      '5346 TBU', '5506 TBS', '5616 TCE', '5626 TCE',
      '5716 TBS', '6546 TCE', '9176 TCC',
    ],
  },

  // ── Alertes automatiques ────────────────────────────────────────────
  alerts: {
    email: {
      enabled: false, // ⚠️ Mettre à true après configuration SMTP
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASS || '',
      },
      recipients: [
        process.env.ALERT_EMAIL || 'jean.frederic@votre-societe.mg',
      ],
    },
    webhook: {
      enabled: false,
      url: process.env.WEBHOOK_URL || '',
    },
    // Alerte console (toujours active)
    console: true,
  },

  // ── Sorties ─────────────────────────────────────────────────────────
  output: {
    reportsDir: './reports',
    dataDir: './data/imported',
    dailyReportName: 'SUIVI_JOURNALIER_{DATE}.xlsx',
    screenshotsDir: './debug/screenshots',
  },

  // ── Planification ───────────────────────────────────────────────────
  scheduler: {
    intervalMinutes: 120,
    dailyReportTime: '18:30',
    j1CheckTime: '06:00',
  },

  // ── Playwright options ──────────────────────────────────────────────
  browser: {
    headless: true,          // false pour voir le navigateur (débogage)
    slowMo: 100,             // Ralentir pour éviter les détections anti-bot
    timeout: 30000,          // Timeout par page (ms)
    screenshotOnError: true, // Capture d'écran en cas d'erreur
  },
};
