import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../style/login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3001/api/auth/login', { email, motDePasse });
      login(data.token, data.user);
      navigate('/');
    } catch {
      setErreur('Email ou mot de passe incorrect');
    }
  };

  return (
    <main className="page page-login">
      <section className="card card-login">
        <p className="page-title page-title-login">Connexion</p>
        <h2 className="page-title-login">Accès à l’outil de pilotage</h2>

        {erreur && <p className="alerte-erreur">{erreur}</p>}

        <form onSubmit={handleSubmit} className="login-champs">
          <div className="login-champ">
            <label htmlFor="email">Email professionnel</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="prenom.nom@axa.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="login-champ">
            <label htmlFor="motDePasse">Mot de passe</label>
            <input
              id="motDePasse"
              className="input"
              type="password"
              placeholder="Votre mot de passe"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-login">Se connecter</button>
        </form>
      </section>
    </main>
  );
}