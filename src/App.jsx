import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Alumnos from "./pages/Alumnos";
import AlumnoDetalle from "./pages/AlumnoDetalle";
import Pagos from "./pages/Pagos";
import Biblioteca from "./pages/Biblioteca";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: "var(--text-dim)", padding: 40 }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) return <div style={{ color: "var(--text-dim)", padding: 40 }}>Cargando...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
       <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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
        <AdminAuthProvider>
          <AppRoutes />
        </AdminAuthProvider>
      </AuthProvider>
    </HashRouter>
  );
}
