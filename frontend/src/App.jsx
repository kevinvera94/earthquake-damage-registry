// Rutas de la aplicación (CODING-STANDARDS §2.1: solo se definen aquí).
// Las rutas /app/* se protegen con RequireAuth en T-06.
import { Navigate, Route, Routes } from 'react-router-dom';
import DemoBanner from './components/DemoBanner';
import BuildingDetail from './pages/BuildingDetail';
import BuildingForm from './pages/BuildingForm';
import Buildings from './pages/Buildings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Public from './pages/Public';
import Users from './pages/Users';

export default function App() {
  return (
    <>
      <DemoBanner />
      <main id="contenido" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Public />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Navigate to="/app/edificaciones" replace />} />
          <Route path="/app/edificaciones" element={<Buildings />} />
          <Route path="/app/edificaciones/nueva" element={<BuildingForm />} />
          <Route path="/app/edificaciones/:id" element={<BuildingDetail />} />
          <Route path="/app/edificaciones/:id/editar" element={<BuildingForm />} />
          <Route path="/app/usuarios" element={<Users />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
