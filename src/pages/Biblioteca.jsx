import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

const CATEGORIAS = [
  "Lumbalgia", "Cervicalgia", "Dolor patelofemoral", "Síndrome subacromial",
  "Esguince de tobillo", "Core / estabilidad", "Post-cirugía LCA/menisco",
  "Post-fractura tobillo", "Post-fractura brazo", "Post-cirugía hombro", "Otra",
];

export default function Biblioteca() {
  const { user } = useAuth();
  const [general, setGeneral] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [tab, setTab] = useState("general");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", categoria: CATEGORIAS[0], link: "", series: "", repeticiones: "", notas: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "biblioteca_general"), (snap) => {
      setGeneral(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "kinesiologos", user.uid, "biblioteca_personal"), (snap) => {
      setPersonal(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function agregarPersonal(e) {
    e.preventDefault();
    if (!form.nombre) return;
    await addDoc(collection(db, "kinesiologos", user.uid, "biblioteca_personal"), {
      ...form,
      creadoEl: new Date().toISOString(),
    });
    setForm({ nombre: "", categoria: CATEGORIAS[0], link: "", series: "", repeticiones: "", notas: "" });
    setShowForm(false);
  }

  const lista = tab === "general" ? general : personal;
  const listaFiltrada = categoriaFiltro === "Todas" ? lista : lista.filter((e) => e.categoria === categoriaFiltro);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Biblioteca de ejercicios</h1>
        {tab === "personal" && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Agregar ejercicio</button>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={tab === "general" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("general")}>Biblioteca general</button>
        <button className={tab === "personal" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("personal")}>Mi biblioteca personal</button>
      </div>

      <select style={{ maxWidth: 260, marginBottom: 16 }} value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
        <option>Todas</option>
        {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
      </select>

      {showForm && tab === "personal" && (
        <form onSubmit={agregarPersonal} className="card" style={{ marginBottom: 20, display: "grid", gap: 12, maxWidth: 480 }}>
          <input required placeholder="Nombre del ejercicio" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Link de YouTube (opcional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Series" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} />
            <input placeholder="Repeticiones" value={form.repeticiones} onChange={(e) => setForm({ ...form, repeticiones: e.target.value })} />
          </div>
          <textarea placeholder="Notas / tips" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <button type="submit" className="btn-primary">Guardar</button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {listaFiltrada.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14 }}>No hay ejercicios en esta categoría todavía.</p>}
        {listaFiltrada.map((ej) => (
          <div key={ej.id} className="card">
            <div style={{ fontWeight: 600 }}>{ej.nombre}</div>
            <div style={{ fontSize: 12, color: "var(--orange)", marginTop: 2 }}>{ej.categoria}</div>
            {(ej.series || ej.repeticiones) && (
              <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 6 }}>{ej.series}x{ej.repeticiones}</div>
            )}
            {ej.notas && <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 6 }}>{ej.notas}</div>}
            {ej.link && <a href={ej.link} target="_blank" rel="noreferrer" style={{ color: "var(--orange)", fontSize: 13, display: "inline-block", marginTop: 8 }}>▶ Ver video</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
