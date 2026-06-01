const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// appel de l'API depuis le frontend local (port 5173)
app.use(cors({ origin: 'http://localhost:5173' }));

// lecture des données JSON envoyées dans les requêtes
app.use(express.json());

// routes principales de l'API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/collaborateurs', require('./routes/collaborateurs'));
app.use('/api/equipes', require('./routes/equipes'));
app.use('/api/planning', require('./routes/planning'));
app.use('/api/jours-feries', require('./routes/joursFeries'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/domaines', require('./routes/domaines'));

// lancement du serveur backend
app.listen(process.env.PORT, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT}`);
});