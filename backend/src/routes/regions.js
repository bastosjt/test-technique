const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware: auth } = require('../middleware/auth');
const router = express.Router();

// récupération de toutes les régions avec GET (méthode pour admin)
router.get('/', auth, async (req, res) => {
  const regions = await prisma.region.findMany({ orderBy: { nom: 'asc' } });
  res.json(regions);
});

module.exports = router;