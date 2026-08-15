import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIA_INDEX = [1, 2, 3, 4, 5, 6, 0]; // getDay(): domingo=0

export default function Agenda() {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [diaSel, setDiaSel] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ alumnoId: "", hora: "", tipo: "permanente", cantidad: "" });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "kinesiologos", user.uid, "agenda"), (snap) => {
      setCitas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "kinesiologos", user.uid, "alumnos"), orderBy("nombre")), (snap) => {
      setAlumnos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function crearCita(e) {
    e.preventDefault();
    const alumno = alumnos.find((a) => a.id === form.alumnoId);
    if (!alumno || !form.hora) return;
    await addDoc(collection(db, "kinesiologos", user.uid, "agenda"), {
      alumnoId: alumno.id,
      alumnoNombre: alumno.nombre,
      dia: diaSel,
      hora: form.hora,
      tipo: form.tipo, // unica | permanente | paquete_sesiones | paquete_semanas
      cantidad: form.tipo === "paquete_sesiones" || form.tipo === "paquete_semanas" ? Number(form.cantidad) : null,
      creadoEl: new Date().toISOString(),
    });
    setForm({ alumnoId: "", hora: "", tipo: "permanente", cantidad: "" });
    setShowForm(false);
  }

  async function eliminarCita(id) {
    if (!confirm("¿Eliminar esta sesión de la agenda?")) return;
    await deleteDoc(doc(db, "kinesiologos", user.uid, "agenda", id));
  }

  const citasDelDia = citas
    .filter((c) => c.dia === diaSel)
    .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Agenda</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Agendar sesión</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {DIAS.map((d, i) => {
          const idx = DIA_INDEX[i];
          return (
            <button
              key={d}
              onClick={() => setDiaSel(idx)}
              className={diaSel === idx ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: 13 }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {showForm && (
        <form onSubmit={crearCita} className="card" style={{ marginBottom: 20, display: "grid", gap: 12, maxWidth: 480 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Alumno</label>
            <select required value={form.alumnoId} onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}>
              <option value="">Selecciona...</option>
              {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Hora</label>
            <input type="time" required value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>¿Cómo se agenda esta sesión?</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="unica">Única (solo este día)</option>
              <option value="permanente">Permanente (se repite cada semana)</option>
              <option value="paquete_sesiones">Por número de sesiones</option>
              <option value="paquete_semanas">Por número de semanas</option>
            </select>
          </div>
          {(form.tipo === "paquete_sesiones" || form.tipo === "paquete_semanas") && (
            <div>
              <label style={{ fontSize: 13, color: "var(--text-dim)" }}>
                {form.tipo === "paquete_sesiones" ? "Cantidad de sesiones" : "Cantidad de semanas"}
              </label>
              <input type="number" min="1" required value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
            </div>
          )}
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{DIAS[DIA_INDEX.indexOf(diaSel)]}</h3>
        {citasDelDia.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14 }}>No hay sesiones agendadas este día.</p>}
        {citasDelDia.map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.alumnoNombre}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {c.tipo === "unica" && "Sesión única"}
                {c.tipo === "permanente" && "Permanente (semanal)"}
                {c.tipo === "paquete_sesiones" && `Paquete de ${c.cantidad} sesiones`}
                {c.tipo === "paquete_semanas" && `Paquete de ${c.cantidad} semanas`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--orange)", fontWeight: 600 }}>{c.hora}</span>
              <button onClick={() => eliminarCita(c.id)} className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
