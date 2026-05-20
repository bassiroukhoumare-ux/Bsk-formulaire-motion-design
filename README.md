# BSK DEZIGNER — Plateforme Formulaire Brief Créatif

Cette plateforme web mono-page (SPA) héberge le formulaire de brief créatif interactif en 13 étapes pour le studio de motion design et d'infographie **BSK Dezigner** basé à Dakar, Sénégal.

L'application fonctionne à 100% côté client. Elle permet de structurer les besoins des prospects et propose l'export du brief finalisé en PDF ainsi que sa transmission pré-remplie sur WhatsApp vers le numéro du studio (+221 70 936 48 91).

---

## 🚀 Installation & Développement Local

### Prérequis
- Node.js (v18 ou supérieur recommandé)
- npm (v9 ou supérieur)

### 1. Cloner ou ouvrir le projet dans le terminal
Naviguez dans le dossier racine contenant le fichier `package.json`.

### 2. Installer les dépendances
Exécutez la commande suivante pour installer React 19, Tailwind CSS, Framer Motion, Lucide React et html2pdf.js :
```bash
npm install
```

### 3. Lancer le serveur de développement local
Pour démarrer le projet en local avec rechargement automatique (HMR) :
```bash
npm run dev
```
Par défaut, le serveur démarre à l'adresse : **`http://localhost:5173/`**

### 4. Générer le build de production
Pour créer une version optimisée, minifiée et prête à être déployée en production :
```bash
npm run build
```
Les fichiers statiques compilés seront générés dans le dossier `/dist`.

---

## ⚙️ Architecture Technique & Fonctionnalités

- **Stack principale** : React 19 (Vite) + Tailwind CSS (v3.4.17) + Framer Motion (pour les transitions fluides entre étapes) + Lucide React (pour les icônes).
- **Design System** : Palette bleu nuit et jaune doré, coins arrondis à 32px (`rounded-[2rem]`), polices *Orbitron* (titres) et *Space Grotesk* (labels et corps) chargées via Google Fonts, et un overlay de bruit CSS global pour un rendu cinéma/instrument digital.
- **Conversion de Devises (Étape 11)** : Taux FCFA/EUR fixe (`1 EUR = 655,957 FCFA`) et taux dynamique USD/EUR mis à jour automatiquement via l'API gratuite de change (avec repli statique de `1 EUR = 1,08 USD` si l'API est inaccessible).
- **Sauvegarde draft (LocalStorage)** : Les réponses saisies et l'index de l'étape courante sont sauvegardés dans le `localStorage` à chaque modification sous les clés `bsk_brief_draft` et `bsk_brief_step` pour éviter toute perte en cas de rafraîchissement accidentel.
- **Génération PDF (Étape 13)** : Utilisation de la librairie `html2pdf.js` pour capturer la section de récapitulatif avec le design exact (fond bleu nuit profond et accents dorés) et lancer le téléchargement automatique au format A4 portrait nommé `Brief_BSK_Dezigner_[NomDuClient]_[Date].pdf`.
- **Partage WhatsApp (Étape 13)** : Redirection instantanée via un lien encodé `https://wa.me/221709364891?text=...` avec le récapitulatif complet formaté en markdown gras et listes à puces.

---

## 🌐 Déploiement

### Option A : Déploiement sur Vercel (Recommandé)
1. Installez le CLI Vercel (`npm install -g vercel`) ou connectez votre dépôt GitHub sur le site de Vercel.
2. Configurez le projet comme suit :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
3. Déployez en lançant la commande :
   ```bash
   vercel
   ```

### Option B : Déploiement sur Netlify
1. Connectez-vous sur Netlify et glissez-déposez le dossier `dist` généré après avoir lancé `npm run build`.
2. Ou liez votre dépôt Git et configurez :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`

Aucune variable d'environnement n'est nécessaire car l'application s'exécute intégralement côté client.
