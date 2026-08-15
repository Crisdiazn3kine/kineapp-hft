import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLogin() {
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "var(--orange)" }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>Panel de dueño</span>
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Correo administrador</label>
        <div style={{ marginBottom: 14, marginTop: 6 }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Contraseña</label>
        <div style={{ marginBottom: 18, marginTop: 6 }}>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div style={{ color: "var(--red-warn)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
