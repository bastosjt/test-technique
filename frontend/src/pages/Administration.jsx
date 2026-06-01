import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../style/administration.css';

const api = (token) => axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { Authorization: `Bearer ${token}` }
});

export default function Administration() {
  const { token, user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const http = useMemo(() => api(token), [token]);

  const [onglet, setOnglet] = useState('collaborateurs');
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [modal, setModal] = useState(null); // null | 'collab' | 'equipe'
  const [form, setForm] = useState({});
  const [erreur, setErreur] = useState('');

  const chargerDonnees = useCallback(async () => {
    try {
      const collaborateursUrl = isAdmin ? '/collaborateurs?inclureInactifs=true' : '/collaborateurs';
      const [c, e, r, d] = await Promise.all([
        http.get(collaborateursUrl),
        http.get('/equipes'),
        http.get('/regions'),
        http.get('/domaines'),
      ]);
      setCollaborateurs(c.data.filter(collab => collab.role !== 'ADMINISTRATEUR' || collab.id === user?.id));
      setEquipes(e.data);
      setRegions(r.data);
      setDomaines(d.data);
    } catch {
      setErreur('Impossible de charger les données d’administration.');
    }
  }, [http, isAdmin, user?.id]);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

  // --- COLLABORATEURS ---
  const ouvrirModalCollab = (collab = null) => {
    setForm(collab ? { ...collab, regionId: collab.region?.id, equipeId: collab.equipe?.id } : {
      matricule: '', nom: '', prenom: '', email: '', motDePasse: '',
      role: 'COLLABORATEUR', regionId: '', equipeId: '', dateEntree: ''
    });
    setModal('collab');
    setErreur('');
  };

  const sauvegarderCollab = async () => {
    try {
      if (form.id) {
        await http.put(`/collaborateurs/${form.id}`, form);
      } else {
        await http.post('/collaborateurs', form);
      }
      setModal(null);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    }
  };

  const supprimerCollab = async (id) => {
    if (!confirm('Désactiver ce collaborateur ?')) return;
    await http.delete(`/collaborateurs/${id}`);
    chargerDonnees();
  };

  const reactiverCollab = async (id) => {
    if (!confirm('Réactiver ce collaborateur ?')) return;
    await http.patch(`/collaborateurs/${id}/reactiver`);
    chargerDonnees();
  };

  // --- EQUIPES ---
  const ouvrirModalEquipe = (equipe = null) => {
    setForm(equipe ? { ...equipe, regionId: equipe.region?.id, domaineId: equipe.domaine?.id } : {
      nom: '', regionId: '', domaineId: ''
    });
    setModal('equipe');
    setErreur('');
  };

  const sauvegarderEquipe = async () => {
    try {
      if (form.id) {
        await http.put(`/equipes/${form.id}`, form);
      } else {
        await http.post('/equipes', form);
      }
      setModal(null);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    }
  };

  const supprimerEquipe = async (id) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    await http.delete(`/equipes/${id}`);
    chargerDonnees();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="page administration-page">
      <section className="card">
        <div className="card-header">
          <p className="page-title page-title-header">Administration <span style={{ color: '#64748b' }}>- Outil de pilotage</span></p>
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

        <button onClick={() => navigate('/planning')} className="card-navigation-button navigation-bttn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          <span>Planning</span>
        </button>

        {isAdmin && <button onClick={() => navigate('/jours-feries')} className="card-navigation-button navigation-bttn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock-icon lucide-calendar-clock"><path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/></svg>
          <span>Jours fériés</span>
        </button>}
      </section>

        {erreur && <p className="alert">{erreur}</p>}

        <section className="card panel">
          <div className="card-planning-toolbar">
            <select
              className="planning-equipe-select planning-equipe-select-secondary"
              value={onglet}
              onChange={e => setOnglet(e.target.value)}
            >
              <option value="collaborateurs">Collaborateurs</option>
              <option value="equipes">Equipes</option>
            </select>
            {isAdmin && onglet === 'collaborateurs' && (
              <button className="planning-equipe-select planning-equipe-select-primary" onClick={() => ouvrirModalCollab()}>
                Nouveau collaborateur
              </button>
            )}
            {isAdmin && onglet === 'equipes' && (
              <button className="planning-equipe-select planning-equipe-select-primary" onClick={() => ouvrirModalEquipe()}>
                Nouvelle équipe
              </button>
            )}
          </div>

          {onglet === 'collaborateurs' && (
            <div className="stack">
              <div className="table-wrap">
                <table className="card-planning-table">
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Equipe</th>
                      <th>Statut</th>
                      {isAdmin && <th className="administration-actions-column"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {collaborateurs.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.matricule}</strong></td>
                        <td>{c.prenom} {c.nom}</td>
                        <td>{c.email}</td>
                        <td><span className="badge">{c.role}</span></td>
                        <td>{c.equipe?.nom || <span className="muted">Non rattaché</span>}</td>
                        <td><span className="badge">{c.actif ? 'Actif' : 'Inactif'}</span></td>
                        {isAdmin && (
                          <td className="administration-actions-cell">
                            <button className="administration-action-button administration-action-edit" onClick={() => ouvrirModalCollab(c)} aria-label="Modifier">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            {c.actif ? (
                              <button className="administration-action-button administration-action-delete" onClick={() => supprimerCollab(c.id)} aria-label="Désactiver">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            ) : (
                              <button className="administration-action-button administration-action-reactivate" onClick={() => reactiverCollab(c.id)} aria-label="Réactiver">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-ccw-icon lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {collaborateurs.length === 0 && (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="empty-state">Aucun collaborateur enregistré.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {onglet === 'equipes' && (
            <div className="stack">
              <div className="table-wrap">
                <table className="card-planning-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Région</th>
                      <th>Domaine</th>
                      <th>Collaborateurs</th>
                      {isAdmin && <th className="administration-actions-column"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {equipes.map(e => (
                      <tr key={e.id}>
                        <td><strong>{e.nom}</strong></td>
                        <td>{e.region?.nom || <span className="muted">Non renseignée</span>}</td>
                        <td>{e.domaine?.nom || <span className="muted">Non renseigné</span>}</td>
                        <td><span className="badge">{e.collaborateurs?.length || 0}</span></td>
                        {isAdmin && (
                          <td className="administration-actions-cell">
                            <button className="administration-action-button administration-action-edit" onClick={() => ouvrirModalEquipe(e)} aria-label="Modifier">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button className="administration-action-button administration-action-delete" onClick={() => supprimerEquipe(e.id)} aria-label="Désactiver">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {equipes.length === 0 && (
                      <tr><td colSpan={isAdmin ? 5 : 4} className="empty-state">Aucune équipe enregistrée.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {isAdmin && modal === 'collab' && (
          <div className="modal-overlay">
            <div className="modal stack">
              <div>
                <p className="eyebrow">Collaborateur</p>
                <h2>{form.id ? 'Modifier un collaborateur' : 'Nouveau collaborateur'}</h2>
              </div>
              {erreur && <p className="alert">{erreur}</p>}
              {!form.id && <input className="input" placeholder="Matricule" value={form.matricule} onChange={e => setForm({ ...form, matricule: e.target.value })} />}
              <input className="input" placeholder="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
              <input className="input" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              {!form.id && <input className="input" placeholder="Mot de passe" type="password" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} />}
              <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="COLLABORATEUR">Collaborateur</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMINISTRATEUR">Administrateur</option>
              </select>
              <select className="select" value={form.regionId} onChange={e => setForm({ ...form, regionId: Number(e.target.value) })}>
                <option value="">Région</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
              <select className="select" value={form.equipeId} onChange={e => setForm({ ...form, equipeId: Number(e.target.value) })}>
                <option value="">Equipe</option>
                {equipes.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
              {!form.id && <input className="input" type="date" value={form.dateEntree} onChange={e => setForm({ ...form, dateEntree: e.target.value })} />}
              <div className="toolbar">
                <button className="btn btn-primary" onClick={sauvegarderCollab}>Sauvegarder</button>
                <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {isAdmin && modal === 'equipe' && (
          <div className="modal-overlay">
            <div className="modal stack">
              <div>
                <p className="eyebrow">Équipe</p>
                <h2>{form.id ? 'Modifier une équipe' : 'Nouvelle équipe'}</h2>
              </div>
              {erreur && <p className="alert">{erreur}</p>}
              <input className="input" placeholder="Nom de l'équipe" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              <select className="select" value={form.regionId} onChange={e => setForm({ ...form, regionId: Number(e.target.value) })}>
                <option value="">Région</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
              <select className="select" value={form.domaineId} onChange={e => setForm({ ...form, domaineId: Number(e.target.value) })}>
                <option value="">Domaine</option>
                {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
              <div className="toolbar">
                <button className="btn btn-primary" onClick={sauvegarderEquipe}>Sauvegarder</button>
                <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}