import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

export default function Alumnos() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", patologia: "", modalidadPago: "mensual", montoSesion: "" });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "kinesiologos", user.uid, "alumnos"), orderBy("nombre")), (snap) => {
      setAlumnos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function crearAlumno(e) {
    e.preventDefault();
    if (!form.nombre) return;
    await addDoc(collection(db, "kinesiologos", user.uid, "alumnos"), {
      ...form,
      montoSesion: Number(form.montoSesion) || 0,
      estadoPago: "al_dia",
      creadoEl: new Date().toISOString(),
    });
    setForm({ nombre: "", telefono: "", patologia: "", modalidadPago: "mensual", montoSesion: "" });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Alumnos</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Nuevo alumno</button>
      </div>

      {showForm && (
        <form onSubmit={crearAlumno} className="card" style={{ marginBottom: 20, display: "grid", gap: 12, maxWidth: 480 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Nombre</label>
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Patología / diagnóstico</label>
            <input value={form.patologia} onChange={(e) => setForm({ ...form, patologia: e.target.value })} placeholder="ej. Dolor patelofemoral" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Modalidad de pago</label>
            <select value={form.modalidadPago} onChange={(e) => setForm({ ...form, modalidadPago: e.target.value })}>
              <option value="mensual">Mensual (día fijo del mes)</option>
              <option value="por_sesiones">Cada N sesiones</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Monto por sesión (CLP)</label>
            <input type="number" value={form.montoSesion} onChange={(e) => setForm({ ...form, montoSesion: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Guardar alumno</button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {alumnos.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14, padding: 20 }}>Aún no tienes alumnos registrados.</p>}
        {alumnos.map((a) => (
          <Link key={a.id} to={`/alumnos/${a.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{a.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{a.patologia || "Sin diagnóstico registrado"}</div>
            </div>
            <span className={`badge ${a.estadoPago === "atrasado" ? "badge-warn" : "badge-ok"}`}>
              {a.estadoPago === "atrasado" ? "Atrasado" : "Al día"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
