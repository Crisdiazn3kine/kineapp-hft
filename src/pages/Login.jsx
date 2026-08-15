import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "var(--orange)" }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>KineApp <span style={{ color: "var(--orange)" }}>HFT</span></span>
        </div>
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Iniciar sesión</h2>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Correo</label>
        <div style={{ marginBottom: 14, marginTop: 6 }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Contraseña</label>
        <div style={{ marginBottom: 18, marginTop: 6 }}>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <div style={{ color: "var(--red-warn)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
          ¿No tienes cuenta? <Link to="/registro" style={{ color: "var(--orange)" }}>Regístrate</Link>
        </div>
      </form>
    </div>
  );
}
