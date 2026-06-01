const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware: auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// récupération de tous les jours fériés avec GET (méthode pour admin)
router.get('/', auth, async (req, res) => {
  const jours = await prisma.jourFerie.findMany({
    include: { regions: true },
    orderBy: { date: 'asc' }
  });
  res.json(jours);
});

// création d'un jour férié avec POST (méthode pour admin)
router.post('/', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const { date, libelle, estPont, regionIds } = req.body;
  const jour = await prisma.jourFerie.create({
    data: {
      date: new Date(date),
      libelle,
      estPont: estPont || false,
      // liaison du jour férié aux régions sélectionnées
      regions: regionIds?.length ? { connect: regionIds.map(id => ({ id })) } : undefined
    },
    include: { regions: true }
  });
  res.status(201).json(jour);
});

// suppression d'un jour férié avec DELETE (méthode pour admin)
router.delete('/:id', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  await prisma.jourFerie.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Jour férié supprimé' });
});

module.exports = router;