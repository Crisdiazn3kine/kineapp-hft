import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAdminAuth } from "../context/AdminAuthContext";
import { crearKinesiologo } from "../utils/crearKinesiologo";

function diasParaVencer(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  const venc = new Date(fecha);
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
}

async function borrarKineCompleto(uid) {
  const alumnosSnap = await getDocs(collection(db, "kinesiologos", uid, "alumnos"));
  for (const alumnoDoc of alumnosSnap.docs) {
    const sesionesSnap = await getDocs(collection(db, "kinesiologos", uid, "alumnos", alumnoDoc.id, "sesiones"));
    for (const s of sesionesSnap.docs) await deleteDoc(s.ref);
    await deleteDoc(alumnoDoc.ref);
  }
  for (const col of ["agenda", "pagos", "biblioteca_personal"]) {
    const snap = await getDocs(collection(db, "kinesiologos", uid, col));
    for (const d of snap.docs) await deleteDoc(d.ref);
  }
  await deleteDoc(doc(db, "kinesiologos", uid));
}

export default function AdminDashboard() {
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [kines, setKines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", telefono: "", montoMensual: "", proximoPago: "" });
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "kinesiologos"), (snap) => {
      setKines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setCreando(true);
    try {
      await crearKinesiologo(form);
      setForm({ nombre: "", email: "", password: "", telefono: "", montoMensual: "", proximoPago: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "Ese correo ya está en uso." : "No se pudo crear la cuenta.");
    } finally {
      setCreando(false);
    }
  }

  async function toggleActivo(kine) {
    await updateDoc(doc(db, "kinesiologos", kine.id), { activo: !kine.activo });
  }

  async function eliminarKine(kine) {
    if (!confirm(`¿Eliminar completamente a ${kine.nombre}? Esto borra todos sus alumnos, agenda y pagos. No se puede deshacer.`)) return;
    await borrarKineCompleto(kine.id);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Panel de Administrador — KineApp HFT</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Nuevo kinesiólogo</button>
          <button className="btn-secondary" onClick={async () => { await adminLogout(); navigate("/admin/login"); }}>Cerrar sesión</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 24, display: "grid", gap: 12, maxWidth: 480 }}>
          <input required placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input required type="email" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="text" placeholder="Contraseña inicial (mín. 6 caracteres)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <input type="number" placeholder="Monto mensual del arriendo (CLP)" value={form.montoMensual} onChange={(e) => setForm({ ...form, montoMensual: e.target.value })} />
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Próxima fecha de pago</label>
            <input type="date" value={form.proximoPago} onChange={(e) => setForm({ ...form, proximoPago: e.target.value })} />
          </div>
          {error && <div style={{ color: "var(--red-warn)", fontSize: 13 }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={creando}>{creando ? "Creando..." : "Crear cuenta"}</button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {kines.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14, padding: 20 }}>Aún no has creado ningún kinesiólogo.</p>}
        {kines.map((k) => {
          const dias = diasParaVencer(k.proximoPago);
          const porVencer = dias !== null && dias <= 5;
          return (
            <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{k.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {k.email} {k.telefono && `· ${k.telefono}`} {k.montoMensual ? `· $${k.montoMensual}/mes` : ""}
                  {k.proximoPago && ` · Próximo pago: ${k.proximoPago}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {porVencer && <span className="badge badge-warn">Vence pronto</span>}
                <span className={`badge ${k.activo ? "badge-ok" : "badge-warn"}`}>{k.activo ? "Activo" : "Desactivado"}</span>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => toggleActivo(k)}>
                  {k.activo ? "Desactivar" : "Activar"}
                </button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "5px 10px", borderColor: "var(--red-warn)", color: "var(--red-warn)" }} onClick={() => eliminarKine(k)}>
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
