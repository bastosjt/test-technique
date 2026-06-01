import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../style/joursferies.css';

const api = (token) => axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { Authorization: `Bearer ${token}` }
});

export default function JoursFeries() {
  const { token, user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const http = useMemo(() => api(token), [token]);

  const [jours, setJours] = useState([]);
  const [regions, setRegions] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: '', libelle: '', estPont: false, regionId: '' });
  const [erreur, setErreur] = useState('');

  const chargerDonnees = useCallback(async () => {
    try {
      const [j, r] = await Promise.all([
        http.get('/jours-feries'),
        http.get('/regions'),
      ]);
      setJours(j.data);
      setRegions(r.data);
    } catch {
      setErreur('Impossible de charger les jours fériés et ponts.');
    }
  }, [http]);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

  const ouvrirModal = () => {
    setForm({ date: '', libelle: '', estPont: false, regionId: '' });
    setErreur('');
    setModal(true);
  };

  const sauvegarder = async () => {
    try {
      await http.post('/jours-feries', {
        date: form.date,
        libelle: form.libelle,
        estPont: form.estPont,
        regionIds: form.regionId ? [Number(form.regionId)] : [],
      });
      setModal(false);
      chargerDonnees();
    } catch (e) {
      setErreur(e.response?.data?.message || 'Erreur');
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer ce jour férié ?')) return;
    await http.delete(`/jours-feries/${id}`);
    chargerDonnees();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="page jours-feries-page">
      <section className="card">
        <div className="card-header">
          <p className="page-title page-title-header">Jours fériés <span style={{ color: '#64748b' }}>- Outil de pilotage</span></p>
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

      <section className="card panel">
        <div className="card-planning-toolbar">
          <button className="planning-equipe-select planning-equipe-select-primary" onClick={ouvrirModal}>
            Ajouter un jour
          </button>
        </div>

        <div className="table-wrap">
          <table className="card-planning-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Type</th>
                <th>Région</th>
                <th className="jours-feries-actions-column"></th>
              </tr>
            </thead>
            <tbody>
              {jours.map(j => (
                <tr key={j.id}>
                  <td>{new Date(j.date).toLocaleDateString('fr-FR')}</td>
                  <td>{j.libelle}</td>
                  <td>{j.estPont ? 'Pont' : 'Férié'}</td>
                  <td>{j.regions?.map(r => r.nom).join(', ') || 'Toutes les régions'}</td>
                  <td className="jours-feries-actions-cell">
                    <button className="jours-feries-action-button jours-feries-action-delete" onClick={() => supprimer(j.id)} aria-label="Supprimer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {jours.length === 0 && (
                <tr><td colSpan={5}>Aucun jour férié enregistré.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="modal-overlay">
          <section className="modal champs">
            <div>
              <p className="eyebrow">Calendrier</p>
              <h2>Nouveau jour non travaillé</h2>
            </div>
            {erreur && <p className="alert">{erreur}</p>}
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
            <input
              className="input"
              placeholder="Libellé, ex: Lundi de Pâques"
              value={form.libelle}
              onChange={e => setForm({ ...form, libelle: e.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={form.estPont}
                onChange={e => setForm({ ...form, estPont: e.target.checked })}
              />
              C'est un pont, pas un jour férié officiel
            </label>
            <select
              className="select"
              value={form.regionId}
              onChange={e => setForm({ ...form, regionId: e.target.value })}
            >
              <option value="">Toutes les régions</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </select>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={sauvegarder}>Sauvegarder</button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Annuler</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}