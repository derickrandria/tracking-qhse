# 🚛 Tracking QHSE – Tableau de bord

Tableau de bord de suivi et télématique pour société de transport pétrolier – Antananarivo, Madagascar.

**Développé pour :** Jean Frédéric Herinjanahary – Responsable Tracking & Opération QHSE

---

## 🚀 Lancement

```bash
cd tracking-dashboard
npm install
npm run dev
```

Puis ouvrez **http://localhost:3000**

## 📦 Build de production

```bash
npm run build
npm start
```

---

## 📁 Structure du projet

```
tracking-dashboard/
├── app/
│   ├── page.js                  → Tableau de bord (KPIs, graphiques, alertes)
│   ├── historique/page.js       → Historique des trajets
│   ├── temps-conduite/page.js   → ⭐ Suivi TCJ / TTJ / Conduite continue
│   ├── infractions/page.js      → ⭐ Infractions & sanctions
│   ├── vehicules/page.js        → Flotte (52 véhicules réels)
│   ├── alertes/page.js          → Centre d'alertes temps réel
│   ├── layout.js                → Layout + sidebar
│   └── globals.css              → Thème sombre premium
├── components/
│   ├── Sidebar.js               → Navigation (6 sections)
│   ├── Header.js                → En-tête
│   └── StatsCards.js            → Cartes KPI
├── data/
│   ├── drivers.js               → ✅ 57 conducteurs RÉELS
│   ├── vehicles.js              → ✅ 52 véhicules RÉELS (plaques)
│   ├── driving-times.js         → Temps de conduite (règles TCJ/TTJ)
│   ├── infractions.js           → Infractions & sanctions
│   ├── trips.js                 → Historique trajets
│   ├── alerts.js                → Alertes télématique
│   └── imported/                → 📂 Vos données importées (JSON)
├── templates/                   → 📂 Templates Excel à remplir
│   ├── TEMPLATE_infractions.xlsx
│   ├── TEMPLATE_temps_conduite.xlsx
│   ├── TEMPLATE_releves_gps.xlsx
│   └── REFERENCE_regles_conduite.xlsx
└── tools/
    ├── generate_templates.js    → Régénère les templates
    └── import_excel.js          → ⭐ Convertit Excel → JSON
```

---

## 📥 IMPORTER VOS DONNÉES EXCEL

### Étape 1 : Remplir les templates

Ouvrez les fichiers dans `templates/` et remplacez les exemples par vos données :

| Template | Contenu | Colonnes clés |
|----------|---------|---------------|
| `TEMPLATE_infractions.xlsx` | Vos infractions | Date, Plaque, Chauffeur, Type, Gravité (1-4), Sanction, Statut, Source (MzoneX/CamtrackPro) |
| `TEMPLATE_temps_conduite.xlsx` | Temps de conduite | Date, Plaque, Chauffeur, Début/Fin, Continue, Pauses, TCJ, TTJ, Dérogation |
| `TEMPLATE_releves_gps.xlsx` | Positions 2h | Date, Plaque, Chauffeur, Positions 8h/10h/12h/14h/16h/18h, J-1 |

### Étape 2 : Importer

```bash
# Importer les infractions
node tools/import_excel.js ./mon_fichier_infractions.xlsx infractions

# Importer les temps de conduite
node tools/import_excel.js ./mon_fichier_temps.xlsx temps

# Importer les relevés GPS
node tools/import_excel.js ./mon_fichier_gps.xlsx gps
```

Les fichiers JSON sont générés dans `data/imported/`.

### Étape 3 : Connecter au dashboard

Modifiez les fichiers de données pour charger vos imports :

```js
// data/infractions.js – Remplacez la génération par :
import importedData from './imported/infractions.json';
export const infractions = importedData;
```

---

## 📐 RÈGLES DE TEMPS DE CONDUITE

| Règle | Limite | Définition |
|-------|--------|------------|
| **Conduite continue** | **4h30 max** | Sans pause. Pause 15 min obligatoire après. |
| **TCJ** (Temps Conduite Journalière) | **10h00 max** | Total conduite – pauses. Sans dérogation. |
| **TTJ** (Temps Travail Journalier) | **12h00 max** | TCJ + total pauses. Sans dérogation. |

### Plateformes GPS
- **MzoneX** – Suivi position, temps de conduite, alertes
- **CamtrackPro** – Suivi position, temps de conduite, alertes

### Horaires de vérification
`08:00` → `10:00` → `12:00` → `14:00` → `16:00` → `18:00` + **J-1 (dernier emplacement)**

---

## 📊 6 PAGES DU DASHBOARD

| Page | Fonctionnalités |
|------|----------------|
| **📊 Tableau de bord** | KPIs flotte, vitesse 24h, statuts, alertes, derniers trajets |
| **🗺️ Historique trajets** | Recherche, filtres, tri, détail complet, graphiques par route/mois |
| **⏱️ Temps de conduite** | Règles TCJ/TTJ/Continue, conformité, dérogations, violations/jour |
| **⚠️ Infractions** | Par type/gravité/statut, sanctions, sources MzoneX/CamtrackPro |
| **🚛 Véhicules** | 52 plaques réelles, statuts, carburant, détail |
| **🚨 Alertes** | Sévérité, filtres, traitement, localisation |

---

## 🛠️ Stack technique

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3 (thème sombre)
- Recharts (graphiques)
- SheetJS / xlsx (import Excel)

---

## 👤 Données réelles intégrées

- **57 conducteurs** : noms, prénoms, téléphones
- **52 véhicules** : plaques d'immatriculation réelles
- Scores/performance : simulés (à remplacer par vos données télématique)
