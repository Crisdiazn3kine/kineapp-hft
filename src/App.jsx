import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Alumnos from "./pages/Alumnos";
import AlumnoDetalle from "./pages/AlumnoDetalle";
import Pagos from "./pages/Pagos";
import Biblioteca from "./pages/Biblioteca";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: "var(--text-dim)", padding: 40 }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
      <Route path="/alumnos" element={<PrivateRoute><Alumnos /></PrivateRoute>} />
      <Route path="/alumnos/:id" element={<PrivateRoute><AlumnoDetalle /></PrivateRoute>} />
      <Route path="/pagos" element={<PrivateRoute><Pagos /></PrivateRoute>} />
      <Route path="/biblioteca" element={<PrivateRoute><Biblioteca /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
