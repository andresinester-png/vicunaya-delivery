import { Navigate, Outlet } from 'react-router-dom';

function getSession() {
  try {
    const raw = localStorage.getItem('vicunaya_encomiendas_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function EncomiendaPanelGuard() {
  const empresa = getSession();
  if (!empresa) return <Navigate to="/encomiendas/panel/login" replace />;
  return <Outlet context={empresa} />;
}
