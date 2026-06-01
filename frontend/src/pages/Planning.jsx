import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../style/planning.css';

const api = (token) => axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { Authorization: `Bearer ${token}` }
});

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

function getLundiDeSemaine(date) {
  const d = new Date(date);
  const jour = d.getDay();
  const diff = jour === 0 ? -6 : 1 - jour;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ajouterJours(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

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

function formatAffichage(date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function Planning() {
  const { token, user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const http = useMemo(() => api(token), [token]);

  const [lundi, setLundi] = useState(getLundiDeSemaine(new Date()));
  const [equipes, setEquipes] = useState([]);
  const [equipeId, setEquipeId] = useState('');
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [motifs, setMotifs] = useState([]);
  const [joursFeries, setJoursFeries] = useState([]);
  const [modal, setModal] = useState(null);
  const [erreur, setErreur] = useState('');

  const chargerInit = useCallback(async () => {
    try {
      const [e, m, jf] = await Promise.all([
        http.get('/equipes'),
        http.get('/planning/motifs'),
        http.get('/jours-feries'),
      ]);
      setEquipes(e.data);
      setMotifs(m.data);
      setJoursFeries(jf.data.map(j => formatDate(new Date(j.date))));

      if (user?.equipeId) {
        setEquipeId(user.equipeId);
      } else if (e.data.length > 0) {
        setEquipeId(e.data[0].id);
      }
    } catch {
      setErreur('Impossible de charger les données du planning.');
    }
  }, [http, user?.equipeId]);

  const chargerPlanning = useCallback(async () => {
    const debut = formatDate(lundi);
    const fin = formatDate(ajouterJours(lundi, 40 * 7)); // 40 semaines

    try {
      const [p, collabs] = await Promise.all([
        http.get(`/planning?equipeId=${equipeId}&debut=${debut}&fin=${fin}`),
        http.get('/collaborateurs'),
      ]);

      setPlanning(p.data);
      setCollaborateurs(collabs.data.filter(c => c.equipeId === Number(equipeId)));
    } catch {
      setErreur('Impossible de charger la semaine sélectionnée.');
    }
  }, [equipeId, http, lundi]);

  useEffect(() => { chargerInit(); }, [chargerInit]);

  useEffect(() => {
    if (equipeId) chargerPlanning();
  }, [chargerPlanning, equipeId]);

  const getEntry = (collaborateurId, date, demiJournee) => {
    const dateStr = formatDate(date);
    return planning.find(p =>
      p.collaborateurId === collaborateurId &&
      formatDate(new Date(p.date)) === dateStr &&
      p.demiJournee === demiJournee
    );
  };

  const ouvrirModal = (collaborateurId, date, demiJournee) => {
    if (estJourPasse(date)) return;
    if (user.role === 'COLLABORATEUR' && collaborateurId !== user.id) return;

    const entry = getEntry(collaborateurId, date, demiJournee);
    setModal({ collaborateurId, date: formatDate(date), demiJournee, entryId: entry?.id, motifId: entry?.motifId || '' });
  };

  const sauvegarderMotif = async () => {
    if (!modal.motifId) {
      if (modal.entryId) await http.delete(`/planning/${modal.entryId}`);
    } else {
      await http.post('/planning', {
        collaborateurId: modal.collaborateurId,
        date: modal.date,
        demiJournee: modal.demiJournee,
        motifId: Number(modal.motifId)
      });
    }
    setModal(null);
    chargerPlanning();
  };

  const estFerie = (date) => joursFeries.includes(formatDate(date));
  const aujourdhui = formatDateParis(new Date());
  const estAujourdhui = (date) => formatDateParis(date) === aujourdhui;
  const estJourPasse = (date) => formatDateParis(date) < aujourdhui;

  // 40 semaines = 200 jours ouvrés (5 jours x 40 semaines)
  const jours = Array.from({ length: 200 }, (_, i) => {
    const semaine = Math.floor(i / 5);
    const jourDeSemaine = i % 5;
    return ajouterJours(lundi, semaine * 7 + jourDeSemaine);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <p className="page-title page-title-header">Planning <span style={{ color: '#64748b' }}>- Outil de pilotage</span></p>
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
        <button onClick={() => navigate('/')} className="card-navigation-button navigation-bttn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
          <span>Retour accueil</span>
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

        {erreur && <p className="alert">{erreur}</p>}

      <section className="card card-planning">
        <div className="card-planning-toolbar">
          {isManager && (
            <select className="planning-equipe-select planning-equipe-select-secondary" value={equipeId} onChange={e => setEquipeId(Number(e.target.value))}>
              {equipes.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          )}

          <div className="planning-equipe-select-week-selector">
            <button className="planning-equipe-select planning-equipe-select-third" onClick={() => setLundi(ajouterJours(lundi, -7))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
            </button>

            <span className="badge">Du {formatAffichage(lundi)} au {formatAffichage(ajouterJours(lundi, 4))}</span>
            
            <button className="planning-equipe-select planning-equipe-select-third" onClick={() => setLundi(ajouterJours(lundi, 7))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <button className="planning-equipe-select planning-equipe-select-primary" onClick={() => setLundi(getLundiDeSemaine(new Date()))}>Aujourd'hui</button>
        </div>

          <div className="card-planning-table-wrapper">
            <table className="card-planning-table">
              <thead>
                <tr>
                  <th>Collaborateur</th>
                  {jours.map((jour, i) => (
                    <th
                      key={formatDate(jour)}
                      colSpan={2}
                      className={estAujourdhui(jour) ? 'is-today' : undefined}
                    >
                      {JOURS[i % 5]} {formatAffichage(jour)}
                      {estFerie(jour) && <span> Férié</span>}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  {jours.map(jour => (
                    <Fragment key={`header-${formatDate(jour)}`}>
                      <th>Matin</th>
                      <th>Après-midi</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {collaborateurs.map(collab => (
                  <tr key={collab.id}>
                    <td><strong>{collab.prenom} {collab.nom}</strong></td>
                    {jours.map(jour => {
                      const ferie = estFerie(jour);
                      return (
                        <Fragment key={`${collab.id}-${formatDate(jour)}`}>
                          {['MATIN', 'APRES_MIDI'].map(demi => {
                            const entry = getEntry(collab.id, jour, demi);
                            const motif = motifs.find(m => m.id === entry?.motifId);
                            const peutModifier =
                              !estJourPasse(jour) &&
                              (user.role !== 'COLLABORATEUR' || collab.id === user.id) &&
                              !ferie;
                            return (
                              <td
                                key={`${collab.id}-${formatDate(jour)}-${demi}`}
                                className={`planning-cell ${estAujourdhui(jour) ? 'is-today' : ''} ${peutModifier ? 'is-clickable' : ''}`}
                                style={{
                                  backgroundColor: motif?.couleur || undefined,
                                  color: motif ? '#ffffff' : undefined,
                                }}
                                onClick={() => peutModifier && ouvrirModal(collab.id, jour, demi)}
                                title={motif?.libelle || ''}
                              >
                                {motif && (
                                  <span>
                                    {motif.libelle}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tr>
                ))}
                {collaborateurs.length === 0 && (
                  <tr>
                    <td colSpan={1 + jours.length * 2} className="empty-state">
                      Aucun collaborateur dans cette équipe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="legend">
            {motifs.map(m => (
              <span key={m.id} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: m.couleur }} />
                {m.libelle}
              </span>
            ))}
          </div>
      </section>

        {modal && (
          <div className="modal-overlay">
            <div className="modal stack">
              <div>
                <p className="eyebrow">Planning</p>
                <h2>Choisir un motif</h2>
                <p className="muted">{modal.date} - {modal.demiJournee === 'MATIN' ? 'Matin' : 'Après-midi'}</p>
              </div>
              <select className="select" value={modal.motifId} onChange={e => setModal({ ...modal, motifId: e.target.value })}>
                <option value="">Aucun motif, effacer la cellule</option>
                {motifs.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
              </select>
              <div className="toolbar">
                <button className="btn btn-primary" onClick={sauvegarderMotif}>Sauvegarder</button>
                <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}