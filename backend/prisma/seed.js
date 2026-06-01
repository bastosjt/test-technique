const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Connexion à la BDD SQL avec l'URL du fichier .env
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Fonction principale qui ajoute les données de départ
async function main() {

  // Régions des équipes
  const paris = await prisma.region.create({ data: { nom: 'Paris' } })
  const lyon = await prisma.region.create({ data: { nom: 'Lyon' } })
  const nice = await prisma.region.create({ data: { nom: 'Nice' } })
  const marseille = await prisma.region.create({ data: { nom: 'Marseille' } })

  // Domaines des équipes
  const auto = await prisma.domaine.create({ data: { nom: 'Automobile' } })
  await prisma.domaine.create({ data: { nom: 'Construction' } })
  await prisma.domaine.create({ data: { nom: 'Responsabilité Civile' } })
  await prisma.domaine.create({ data: { nom: 'Dommages' } })

  // Équipes
  const equipe = await prisma.equipe.create({
    data: { nom: 'Équipe A', regionId: paris.id, domaineId: auto.id }
  })

  // Motifs de planning
  const motifs = [
    { code: 'CONGES', libelle: 'Congés', couleur: '#4CAF50' },
    { code: 'MALADIE', libelle: 'Maladie', couleur: '#F44336' },
    { code: 'MISSION', libelle: 'Mission', couleur: '#2196F3' },
    { code: 'FORMATION', libelle: 'Formation', couleur: '#FF9800' },
    { code: 'REUNION', libelle: 'Réunion', couleur: '#9C27B0' },
    { code: 'GESTION', libelle: 'Gestion', couleur: '#607D8B' },
    { code: 'PAS_AFFECTATION', libelle: "Pas d'affectation", couleur: '#9E9E9E' },
    { code: 'TEMPS_PARTIEL', libelle: 'Temps partiel / Alternance', couleur: '#00BCD4' },
    { code: 'VISITE', libelle: 'Visite', couleur: '#795548' },
    { code: 'OFIS', libelle: 'OFIS', couleur: '#E91E63' },
  ]

  // Création de chaque motif dans la base
  for (const m of motifs) await prisma.motif.create({ data: m })

  // Collaborateurs
  // Même mot de passe de test pour les comptes créés
  const hash = await bcrypt.hash('password123', 10)

  await prisma.collaborateur.create({
    data: {
      matricule: 'ADM001', nom: 'Admin', prenom: 'Super',
      email: 'admin@test.com', motDePasse: hash,
      role: 'ADMINISTRATEUR', regionId: paris.id, equipeId: equipe.id,
      dateEntree: new Date('2020-01-01'),
    }
  })

  await prisma.collaborateur.create({
    data: {
      matricule: 'COL001', nom: 'Jamet', prenom: 'Bastien',
      email: 'bastien@test.com', motDePasse: hash,
      role: 'COLLABORATEUR', regionId: paris.id, equipeId: equipe.id,
      dateEntree: new Date('2022-06-01'),
    }
  })

  console.log('Seed réalisé avec succès avec les comptes :')
}

// Lancement du seed puis fermeture de la connexion à la base
main().catch(console.error).finally(() => prisma.$disconnect())