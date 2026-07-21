# 🚀 INSTALLATION SUR VOTRE PC – Guide étape par étape

## 📥 Méthode 1 : Télécharger le fichier ZIP (le plus simple)

1. Dans Arena.ai, cliquez sur le fichier **tracking-dashboard-qhse.zip** dans le panneau de fichiers
2. Téléchargez-le sur votre PC
3. Extrayez-le (clic droit → Extraire tout)
4. Ouvrez le dossier extrait

---

## 📥 Méthode 2 : Via GitHub (recommandé pour les mises à jour)

Si vous avez un compte GitHub :

```bash
# 1. Créez un nouveau repo sur github.com (ex: "tracking-qhse")
# 2. Dans votre terminal :
git init
git add .
git commit -m "Premier commit - Tracking QHSE"
git remote add origin https://github.com/VOTRE_NOM/tracking-qhse.git
git push -u origin main
```

Ensuite, sur n'importe quel PC :
```bash
git clone https://github.com/VOTRE_NOM/tracking-qhse.git
```

---

## 🖥️ PRÉ-REQUIS SUR VOTRE PC

### 1. Installer Node.js (obligatoire)
- Téléchargez sur : https://nodejs.org/
- Choisissez la version **LTS** (recommandée)
- Installez avec les options par défaut
- Vérifiez l'installation :
  ```bash
  node --version    # Doit afficher v18+ ou v20+
  npm --version     # Doit afficher 9+ ou 10+
  ```

### 2. Installer un éditeur de code (recommandé)
- **Visual Studio Code** (gratuit) : https://code.visualstudio.com/
- Extensions recommandées :
  - ESLint
  - Tailwind CSS IntelliSense
  - Next.js snippets

---

## ⚙️ INSTALLATION DU PROJET

Ouvrez un terminal (Invite de commandes / PowerShell / Terminal) dans le dossier du projet :

```bash
# 1. Naviguer vers le dossier
cd chemin/vers/tracking-dashboard-qhse

# 2. Installer les dépendances du dashboard (1-2 minutes)
npm install

# 3. Installer Playwright pour l'automation (navigateur Chromium)
npx playwright install chromium

# 4. Lancer le dashboard en mode développement
npm run dev
```

→ Ouvrez votre navigateur sur **http://localhost:3000**

---

## 🔐 CONFIGURER VOS IDENTIFIANTS

### Option A : Variables d'environnement (recommandé)

**Windows (PowerShell) :**
```powershell
$env:MZONEX_USER="votre_email_mzonex"
$env:MZONEX_PASS="votre_mdp_mzonex"
$env:CAMTRACK_USER="votre_compte_camtrack"
$env:CAMTRACK_PASS="votre_mdp_camtrack"
```

**Windows (CMD) :**
```cmd
set MZONEX_USER=votre_email_mzonex
set MZONEX_PASS=votre_mdp_mzonex
set CAMTRACK_USER=votre_compte_camtrack
set CAMTRACK_PASS=votre_mdp_camtrack
```

**Mac/Linux :**
```bash
export MZONEX_USER="votre_email_mzonex"
export MZONEX_PASS="votre_mdp_mzonex"
export CAMTRACK_USER="votre_compte_camtrack"
export CAMTRACK_PASS="votre_mdp_camtrack"
```

### Option B : Fichier .env (plus pratique)

Créez un fichier `.env` à la racine du projet :
```env
MZONEX_USER=votre_email_mzonex
MZONEX_PASS=votre_mdp_mzonex
CAMTRACK_USER=votre_compte_camtrack
CAMTRACK_PASS=votre_mdp_camtrack
```
⚠️ Ne commitez JAMAIS ce fichier sur Git !

---

## 🧪 TESTER L'AUTOMATION

```bash
# 1. Tester la connexion aux plateformes (ouvre un navigateur visible)
node automation/test_connection.js

# 2. Lancer le pipeline complet une fois
node automation/run.js full

# 3. Lancer le planificateur (toutes les 2h en continu)
node automation/run.js schedule
```

---

## 🌐 LANCER LE DASHBOARD

```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production (plus rapide)
npm run build
npm start
```

→ Dashboard accessible sur **http://localhost:3000**

---

## 📋 COMMANDES UTILES

| Commande | Action |
|----------|--------|
| `npm run dev` | Lancer le dashboard (mode dev) |
| `npm run build` | Compiler pour la production |
| `npm start` | Lancer en production |
| `node automation/run.js full` | Pipeline complet (scrape + analyse + rapport) |
| `node automation/run.js schedule` | Planificateur automatique (toutes les 2h) |
| `node automation/run.js test` | Tester le moteur d'analyse |
| `node automation/test_connection.js` | Tester la connexion MzoneX/CamtrackPro |
| `node tools/import_excel.js <fichier> <type>` | Importer un Excel (infractions/temps/gps) |

---

## ❓ PROBLÈMES FRÉQUENTS

### "npm n'est pas reconnu"
→ Node.js n'est pas installé ou pas dans le PATH. Réinstallez Node.js.

### "Port 3000 already in use"
→ Un autre programme utilise le port 3000. Changez-le :
```bash
PORT=3001 npm run dev
```

### Le scraping ne fonctionne pas
1. Vérifiez vos identifiants dans `.env` ou `config.js`
2. Lancez `node automation/test_connection.js` en mode visible
3. Consultez les captures d'écran dans `automation/debug/screenshots/`
4. Si les sélecteurs CSS ne correspondent pas, envoyez-moi les captures

### Playwright ne s'installe pas
```bash
npx playwright install --with-deps chromium
```

---

## 📂 STRUCTURE DES FICHIERS SUR VOTRE PC

```
tracking-dashboard-qhse/
├── app/                          → Pages du dashboard Next.js
├── components/                   → Composants React réutilisables
├── data/                         → Données (conducteurs, véhicules, etc.)
│   └── imported/                 → Vos données importées (JSON)
├── automation/                   → ️ Système d'automatisation
│   ├── config.js                 → Configuration (URLs, seuils)
│   ├── run.js                    → Point d'entrée
│   ├── test_connection.js        → Test de connexion
│   ├── scrapers/                 → Scrapers MzoneX + CamtrackPro
│   ├── processors/               → Moteur TCJ/TTJ
│   ├── outputs/                  → Rapports Excel + alertes
│   └── reports/                  → Rapports générés
├── templates/                    → Templates Excel à remplir
├── tools/                        → Scripts utilitaires
├── public/                       → Assets statiques
├── package.json                  → Dépendances
├── .env                          → ⚠️ Vos identifiants (à créer)
└── README.md                     → Documentation
```

---

## 🆘 BESOIN D'AIDE ?

Contactez Jean Frédéric Herinjanahary – Responsable Tracking & Opération QHSE

Ou revenez sur Arena.ai pour poser vos questions !
