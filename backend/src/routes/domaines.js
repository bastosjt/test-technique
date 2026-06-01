const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware: auth } = require('../middleware/auth');
const router = express.Router();

// récupération de tous les domaines avec GET (méthode pour admin)
router.get('/', auth, async (req, res) => {
  const domaines = await prisma.domaine.findMany({ orderBy: { nom: 'asc' } });
  res.json(domaines);
});

module.exports = router;