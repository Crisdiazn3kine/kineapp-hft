import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await register(nombre, email, password);
      navigate("/");
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "Ese correo ya está registrado." : "No se pudo crear la cuenta.");
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
        <h2 style={{ margin: "0 0 20px", fontSize: 20 }}>Crear cuenta de kinesiólogo</h2>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Nombre completo</label>
        <div style={{ marginBottom: 14, marginTop: 6 }}>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Correo</label>
        <div style={{ marginBottom: 14, marginTop: 6 }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Contraseña</label>
        <div style={{ marginBottom: 18, marginTop: 6 }}>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>

        {error && <div style={{ color: "var(--red-warn)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: "var(--orange)" }}>Inicia sesión</Link>
        </div>
      </form>
    </div>
  );
}
