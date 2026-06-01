import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Accueil from './pages/Accueil';
import Planning from './pages/Planning';
import Administration from './pages/Administration';
import JoursFeries from './pages/JoursFeries';

function ProtectedRoute({ children, adminOnly = false, managerOnly = false }) {
  const { user, isAdmin, isManager } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  if (managerOnly && !isManager) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
          <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
          <Route path="/administration" element={<ProtectedRoute managerOnly><Administration /></ProtectedRoute>} />
          <Route path="/jours-feries" element={<ProtectedRoute adminOnly><JoursFeries /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}