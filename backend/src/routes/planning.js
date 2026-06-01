const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

function formatDateParis(date) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const getPart = (type) => parts.find(part => part.type === type)?.value;
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

function estJourPasse(date) {
  return formatDateParis(new Date(date)) < formatDateParis(new Date());
}

// récupération de tous les motifs avec GET (méthode pour admin)
router.get('/motifs', auth, async (req, res) => {
  const motifs = await prisma.motif.findMany({ orderBy: { libelle: 'asc' } });
  res.json(motifs);
});

// récupération du planning d'une équipe sur une période avec GET
router.get('/', auth, async (req, res) => {
  const { equipeId, debut, fin } = req.query;

  const planning = await prisma.planning.findMany({
    where: {
      collaborateur: { equipeId: parseInt(equipeId), actif: true },
      date: { gte: new Date(debut), lte: new Date(fin) }
    },
    include: { collaborateur: true, motif: true }
  });
  res.json(planning);
});

// création / modification d'un planning avec POST (méthode pour manager et admin)
router.post('/', auth, async (req, res) => {
  const { collaborateurId, date, demiJournee, motifId } = req.body;
  const { role, id: userId } = req.user;

  if (role === 'COLLABORATEUR' && collaborateurId !== userId) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  if (estJourPasse(date)) {
    return res.status(403).json({ message: 'Impossible de modifier un jour passé' });
  }

  // création d'une entrée / mise à jour de celle qui existe déjà
  const entry = await prisma.planning.upsert({
    where: {
      collaborateurId_date_demiJournee: {
        collaborateurId,
        date: new Date(date),
        demiJournee
      }
    },
    update: { motifId },
    create: { collaborateurId, date: new Date(date), demiJournee, motifId }
  });
  res.json(entry);
});

// suppression d'un planning avec DELETE (méthode pour manager et admin)
router.delete('/:id', auth, async (req, res) => {
  const { role, id: userId } = req.user;

  const entry = await prisma.planning.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!entry) return res.status(404).json({ message: 'Introuvable' });

  if (role === 'COLLABORATEUR' && entry.collaborateurId !== userId) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  if (estJourPasse(entry.date)) {
    return res.status(403).json({ message: 'Impossible de modifier un jour passé' });
  }

  await prisma.planning.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Entrée supprimée' });
});

module.exports = router;