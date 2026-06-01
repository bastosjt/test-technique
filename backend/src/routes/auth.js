const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma')

const router = express.Router();

// connexion du collaborateur
router.post('/login', async (req, res) => {
  const { email, motDePasse } = req.body;

  // recherche du collaborateur par email avec sa région et son équipe
  const collab = await prisma.collaborateur.findUnique({
    where: { email },
    include: { region: true, equipe: true }
  });

  // vérification de l'existence et de l'activité du collaborateur
  if (!collab || !collab.actif) {
    return res.status(401).json({ message: 'Identifiants incorrects' });
  }

  const valid = await bcrypt.compare(motDePasse, collab.motDePasse);
  if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' });

  // création du token utilisé pour les prochaines requêtes
  const token = jwt.sign(
    { id: collab.id, role: collab.role, regionId: collab.regionId, equipeId: collab.equipeId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // envoi du token et des informations de l'utilisateur
  res.json({
    token,
    user: {
      id: collab.id,
      nom: collab.nom,
      prenom: collab.prenom,
      role: collab.role,
      region: collab.region?.nom,
      equipe: collab.equipe?.nom,
    }
  });
});

module.exports = router;