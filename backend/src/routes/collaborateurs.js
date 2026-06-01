const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authMiddleware: auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// récupération de tous les collaborateurs avec GET (méthode pour manager et admin)
router.get('/', auth, async (req, res) => {
    const { role } = req.user;
    if (role === 'COLLABORATEUR') return res.status(403).json({ message: 'Accès refusé' });

    const inclureInactifs = role === 'ADMINISTRATEUR' && req.query.inclureInactifs === 'true';
    const where = {
        OR: [
            { role: { not: 'ADMINISTRATEUR' } },
            { id: req.user.id }
        ]
    };

    if (!inclureInactifs) {
        where.actif = true;
    }

    const collabs = await prisma.collaborateur.findMany({
        where,
        include: { region: true, equipe: true },
        orderBy: { nom: 'asc' }
    });
    res.json(collabs);
});

// récupération d'un collaborateur avec GET (méthode pour manager et admin)
router.get('/:id', auth, async (req, res) => {
    const collab = await prisma.collaborateur.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { region: true, equipe: true }
    });
    if (!collab) return res.status(404).json({ message: 'Introuvable' });
    res.json(collab);
});

// création d'un collaborateur avec POST (méthode pour admin)
router.post('/', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
    const { matricule, nom, prenom, email, motDePasse, role, regionId, equipeId, dateEntree } = req.body;

    // hash du mot de passe avant l'enregistrement
    const hash = await bcrypt.hash(motDePasse, 10);

    try {
        const collab = await prisma.collaborateur.create({
        data: { matricule, nom, prenom, email, motDePasse: hash, role, regionId, equipeId, dateEntree: new Date(dateEntree) }
        });
        res.status(201).json(collab);
    } catch (e) {
        // erreur si l'email ou le matricule existe déjà
        if (e.code === 'P2002') {
        return res.status(400).json({ message: 'Cet email ou matricule est déjà utilisé' });
        }
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// modification d'un collaborateur avec PUT (méthode pour admin)
router.put('/:id', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
    const { nom, prenom, email, role, regionId, equipeId } = req.body;
    const collab = await prisma.collaborateur.update({
        where: { id: parseInt(req.params.id) },
        data: { nom, prenom, email, role, regionId, equipeId }
    });
    res.json(collab);
});

// réactivation d'un collaborateur avec PATCH (méthode pour admin)
router.patch('/:id/reactiver', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
    await prisma.collaborateur.update({
      where: { id: parseInt(req.params.id) },
      data: { actif: true, dateSortie: null }
    });
    res.json({ message: 'Collaborateur réactivé' });
});

// suppression d'un collaborateur avec DELETE (méthode pour admin)
router.delete('/:id', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
    await prisma.collaborateur.update({
      where: { id: parseInt(req.params.id) },
      data: { actif: false, dateSortie: new Date() }
    });
    res.json({ message: 'Collaborateur désactivé' });
});

module.exports = router;