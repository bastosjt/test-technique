# Outil Pilote — Suivi d'activité des équipes de souscription

Application web fullstack permettant le pilotage de l'activité des collaborateurs dans plusieurs équipes de souscription, via la saisie et la consultation d'un planning par demi-journée.



## Choix techniques

### Frontend
- **React 19 (Vite 8)** — pour un démarrage rapide et build optimisé
- **React Router DOM 7** — pour le routing côté client avec la protection des routes par rôle
- **Axios 1.16** — pour l'appels HTTP vers l'API REST avec des injections automatique du token JWT
- CSS modulaire par page

### Backend
- **Node.js (Express 5)** — pour des API REST légère et structurée
- **Prisma ORM 7** — pour l'accès à la base de données typé avec des migrations versionnées
- **bcryptjs 3** — pour l'hashage sécurisé des mots de passe
- **jsonwebtoken 9** — pour l'authentification stateless par token JWT (durée : 8h)
- **CORS** - configuration pour autoriser uniquement le frontend (`localhost:5173`)

### Base de données
- **PostgreSQL 17** — base relationnelle, persistance complète
- Aucune suppression physique : les collaborateurs sont désactivés (`actif: false`, `dateSortie` renseignée), l'historique est conservé intégralement



## Architecture globale

```
outil-pilote/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # modèle de données
│   │   ├── seed.js                 # données initiales (régions, motifs, comptes de test)
│   │   └── migrations/             # historique des migrations SQL
│   ├── src/
│   │   ├── index.js                # point d'entrée Express
│   │   ├── lib/prisma.js           # instance Prisma partagée (avec adapter pg)
│   │   ├── middleware/
│   │   │   └── auth.js             # middleware JWT + vérification des rôles
│   │   └── routes/
│   │       ├── auth.js             # POST /api/auth/login
│   │       ├── collaborateurs.js   # CRUD collaborateurs
│   │       ├── equipes.js          # CRUD équipes
│   │       ├── planning.js         # lecture / saisie du planning
│   │       ├── joursFeries.js      # gestion jours fériés et ponts
│   │       ├── regions.js          # lecture des régions
│   │       └── domaines.js         # lecture des domaines
│   ├── prisma.config.ts            # configuration Prisma v7 (datasource + adapter)
│   └── .env                        # variables d'environnement (non versionné)
│
└── frontend/
    └── src/
        ├── App.jsx                 # routing + protection des routes par rôle
        ├── context/
        │   └── AuthContext.jsx     # état global : user, token, helpers de rôle
        ├── pages/
        │   ├── Login.jsx           # authentification
        │   ├── Accueil.jsx         # dashboard + navigation conditionnelle
        │   ├── Planning.jsx        # grille planning 40 semaines scrollable
        │   ├── Administration.jsx  # gestion équipes & collaborateurs
        │   └── JoursFeries.jsx     # gestion jours fériés & ponts
        └── style/                  # CSS par page
```


## Instructions d'installation et de lancement

### Prérequis
- Node.js ≥ 18
- PostgreSQL ≥ 14

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd outil-pilote
```

### 2. Configurer le backend

```bash
cd backend
npm install
```

Créer le fichier `.env` à la racine de `/backend` :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/outil_pilote?host=/chemin/vers/socket"
JWT_SECRET="votre_secret_jwt"
PORT=3001
```

### 3. Initialiser la base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Lancer le backend

```bash
node src/index.js
# API disponible sur http://localhost:3001
```

### 5. Lancer le frontend

```bash
cd ../frontend
npm install
npm run dev
# Application disponible sur http://localhost:5173
```

### Comptes de test créés par le seed

| Email             | Mot de passe | Rôle           |
|-------------------|--------------|----------------|
| admin@test.com    | password123  | Administrateur |
| bastien@test.com  | password123  | Collaborateur  |

---

## Hypothèses fonctionnelles

**Période de 40 semaines scrollable**
Le planning affiche 40 semaines à partir du lundi de la semaine en cours, dans un tableau scrollable horizontalement. La colonne des collaborateurs et le header des dates restent fixes lors du scroll. Des boutons permettent de naviguer vers les 40 semaines précédentes ou suivantes.

**Restriction des motifs par rôle**
Le cahier des charges mentionne que les collaborateurs n'accèdent qu'à "certains motifs" sans en préciser la liste. En l'absence de spécification, tous les motifs sont accessibles à tous les rôles. Cette restriction pourrait être ajoutée facilement via un champ `accessibleCollaborateur: Boolean` sur le modèle `Motif`.

**Modification d'un jour férié**
L'ajout et la suppression de jours fériés sont implémentés. La modification d'un jour existant n'est pas disponible dans l'interface — elle peut être réalisée en supprimant et recréant l'entrée. Un formulaire d'édition inline pourrait être ajouté.

**Filtre région sur le planning**
Le filtre par équipe est disponible sur la page Planning. Un filtre direct par région n'est pas exposé en tant que contrôle distinct, chaque équipe étant rattachée à une région, ce qui couvre le besoin opérationnel.

**Sécurité backend prioritaire**
Toutes les règles métier (droits par rôle, interdiction de modifier les jours passés pour les collaborateurs, accès aux pages d'administration) sont vérifiées côté backend. Le frontend applique les mêmes règles pour l'expérience utilisateur, mais la source de vérité reste le serveur.

**Archivage logique**
Aucune donnée n'est supprimée physiquement. La désactivation d'un collaborateur positionne `actif: false` et renseigne automatiquement `dateSortie`. L'historique de planning est intégralement conservé.

---

## Pistes d'améliorations

- **Export PDF / Excel** du planning sur une période sélectionnée
- **Notifications email** lors d'une modification de planning par un manager
- **Filtre collaborateur individuel** sur la grille planning
- **Vue mensuelle / annuelle** en complément de la vue 40 semaines