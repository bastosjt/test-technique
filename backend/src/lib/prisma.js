const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

// connexion à la BDD SQL avec l'URL du fichier .env
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// export du client Prisma
module.exports = prisma