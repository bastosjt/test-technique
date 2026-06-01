const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware: auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// récupération de toutes les équipes avec GET (méthode pour admin)
router.get('/', auth, async (req, res) => {
  // récupération des équipes avec leur région, domaine et collaborateurs actifs
  const equipes = await prisma.equipe.findMany({
    where: { actif: true },
    include: { region: true, domaine: true, collaborateurs: { where: { actif: true } } },
    orderBy: { nom: 'asc' }
  });
  res.json(equipes);
});

// création d'une équipe avec POST (méthode pour admin)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'ADMINISTRATEUR') return res.status(403).json({ message: 'Accès refusé' });

  const { nom, regionId, domaineId } = req.body;
  const equipe = await prisma.equipe.create({ data: { nom, regionId, domaineId } });
  res.status(201).json(equipe);
});

// modification d'une équipe avec PUT (méthode pour admin)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMINISTRATEUR') return res.status(403).json({ message: 'Accès refusé' });

  const { nom, regionId, domaineId } = req.body;
  const equipe = await prisma.equipe.update({
    where: { id: parseInt(req.params.id) },
    data: { nom, regionId, domaineId }
  });
  res.json(equipe);
});

// suppression d'une équipe avec DELETE (méthode pour admin)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMINISTRATEUR') return res.status(403).json({ message: 'Accès refusé' });

  await prisma.equipe.update({
    where: { id: parseInt(req.params.id) },
    data: { actif: false }
  });
  res.json({ message: 'Équipe désactivée' });
});

module.exports = router;