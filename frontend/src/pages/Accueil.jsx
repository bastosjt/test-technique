import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../style/accueil.css';

const api = (token) => axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { Authorization: `Bearer ${token}` }
});

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export default function Accueil() {
  const { token, user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const http = useMemo(() => api(token), [token]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [donnees, setDonnees] = useState({
    collaborateurs: [],
    equipes: [],
    joursFeries: []
  });

  useEffect(() => {
    if (!token) return;

    let actif = true;

    const chargerAccueil = async () => {
      try {
        setChargement(true);
        setErreur('');

        const [collaborateurs, equipes, joursFeries] = await Promise.all([
          isManager ? http.get('/collaborateurs') : Promise.resolve({ data: [] }),
          http.get('/equipes'),
          http.get('/jours-feries')
        ]);

        if (!actif) return;

        setDonnees({
          collaborateurs: collaborateurs.data,
          equipes: equipes.data,
          joursFeries: joursFeries.data
        });
      } catch {
        if (actif) setErreur('Impossible de charger les indicateurs de l’accueil.');
      } finally {
        if (actif) setChargement(false);
      }
    };

    chargerAccueil();

    return () => {
      actif = false;
    };
  }, [http, isManager, token]);

  const aujourdHui = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const joursFeriesAVenir = useMemo(() => donnees.joursFeries
    .filter((jour) => {
      const dateJour = new Date(jour.date);
      const concerneRegion = isAdmin || !user?.region || !jour.regions?.length || jour.regions.some((region) => region.nom === user.region);
      return dateJour >= aujourdHui && concerneRegion;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)), [aujourdHui, donnees.joursFeries, isAdmin, user?.region]);

  const prochainJourFerie = joursFeriesAVenir[0];
  const equipeUtilisateur = donnees.equipes.find((equipe) => equipe.nom === user?.equipe);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="page accueil-page">
      <section className="card">
        <div className="card-header">
          <p className="page-title page-title-header">Accueil <span style={{ color: '#64748b' }}>- Outil de pilotage</span></p>
          <button className="btn btn-primary btn-header btn-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
        <div className="card-header-user">
          <div className="user-info">
            <h2 className="user-name">{user?.prenom} {user?.nom}</h2>
            <p className="user-role">{user?.role}</p>
          </div>

          <div className="user-info-more">
            {user?.region && <p className="user-info-item user-info-item-region">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{user.region}</span>
            </p>}
            {user?.equipe && <p className="user-info-item user-info-item-equipe">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
              <span>{user.equipe}</span>
            </p>}
          </div>
        </div>
      </section>

      <section className="card-navigation">
        <button onClick={() => navigate('/planning')} className="card-navigation-button navigation-bttn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          <span>Planning</span>
        </button>

        {isManager && <button onClick={() => navigate('/administration')} className="card-navigation-button navigation-bttn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-cog-icon lucide-user-cog"><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m14.305 16.53.923-.382"/><path d="m15.228 13.852-.923-.383"/><path d="m16.852 12.228-.383-.923"/><path d="m16.852 17.772-.383.924"/><path d="m19.148 12.228.383-.923"/><path d="m19.53 18.696-.382-.924"/><path d="m20.772 13.852.924-.383"/><path d="m20.772 16.148.924.383"/><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Administration</span>
          </button>}

        {isAdmin && <button onClick={() => navigate('/jours-feries')} className="card-navigation-button navigation-bttn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock-icon lucide-calendar-clock"><path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/></svg>
          <span>Jours fériés</span>
        </button>}
      </section>

      <section className="accueil-dashboard">
        <div className="dashboard-section-header">
          <div>
            <p className="page-title">Vue d’ensemble</p>
          </div>
          {chargement && <span className="dashboard-status">Chargement...</span>}
        </div>

        {erreur && <p className="dashboard-error">{erreur}</p>}

        <div className="dashboard-grid">
          <article className="dashboard-card dashboard-card-highlight">
            <span className="dashboard-card-label">Prochain jour férié</span>
            <strong>{prochainJourFerie ? prochainJourFerie.libelle : 'Aucun à venir'}</strong>
            <p>{prochainJourFerie ? formatDate(prochainJourFerie.date) : 'Aucun jour férié configuré pour votre région.'}</p>
          </article>

          <article className="dashboard-card">
            <span className="dashboard-card-label">Votre équipe</span>
            <strong>{user?.equipe || 'Non rattaché'}</strong>
            <p>
              {equipeUtilisateur?.domaine?.nom
                ? `Domaine ${equipeUtilisateur.domaine.nom}`
                : user?.region
                  ? `Région ${user.region}`
                  : 'Aucune équipe renseignée pour votre profil.'}
            </p>
          </article>

          {isManager && (
            <article className="dashboard-card">
              <span className="dashboard-card-label">Collaborateurs actifs</span>
              <strong>{donnees.collaborateurs.length}</strong>
              <p>
                {user?.equipe
                  ? 'dans votre équipe'
                  : 'Périmètre manager et administration'}
              </p>
            </article>
          )}
        </div>
      </section>

    </main>
  );
}