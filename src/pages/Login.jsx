import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Login() {
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
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const adminSnap = await getDoc(doc(db, "admins", cred.user.uid));
      if (adminSnap.exists()) {
        navigate("/admin");
        return;
      }

      const kineSnap = await getDoc(doc(db, "kinesiologos", cred.user.uid));
      if (kineSnap.exists() && kineSnap.data().activo !== false) {
        navigate("/");
        return;
      }

      await signOut(auth);
      setError("Esta cuenta no tiene acceso activo. Contacta a tu administrador.");
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

        <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
          ¿No tienes cuenta? Pídesela a tu administrador.
        </div>
      </form>
    </div>
  );
}
