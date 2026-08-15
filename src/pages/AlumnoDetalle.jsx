import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc, getDoc, collection, addDoc, onSnapshot, query, orderBy,
  updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

export default function AlumnoDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const [alumno, setAlumno] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [bibliotecaGeneral, setBibliotecaGeneral] = useState([]);
  const [bibliotecaPersonal, setBibliotecaPersonal] = useState([]);
  const [sesionAbierta, setSesionAbierta] = useState(null);
  const [buscador, setBuscador] = useState("");
  const [ejercicioManual, setEjercicioManual] = useState({ nombre: "", series: "", repeticiones: "", guardarEnPersonal: false });

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "kinesiologos", user.uid, "alumnos", id)).then((snap) => {
      if (snap.exists()) setAlumno({ id: snap.id, ...snap.data() });
    });
  }, [user, id]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "kinesiologos", user.uid, "alumnos", id, "sesiones"), orderBy("numero")),
      (snap) => setSesiones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [user, id]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "biblioteca_general"), (snap) => {
      setBibliotecaGeneral(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "kinesiologos", user.uid, "biblioteca_personal"), (snap) => {
      setBibliotecaPersonal(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function crearSesion() {
    const numero = sesiones.length + 1;
    const ref = await addDoc(collection(db, "kinesiologos", user.uid, "alumnos", id, "sesiones"), {
      numero,
      fecha: new Date().toISOString().slice(0, 10),
      ejercicios: [],
    });
    setSesionAbierta(ref.id);
  }

  async function agregarEjercicioDeBiblioteca(sesionId, ejercicio) {
    const ref = doc(db, "kinesiologos", user.uid, "alumnos", id, "sesiones", sesionId);
    await updateDoc(ref, {
      ejercicios: arrayUnion({
        nombre: ejercicio.nombre,
        link: ejercicio.link || "",
        series: ejercicio.series || "",
        repeticiones: ejercicio.repeticiones || "",
        origen: "biblioteca",
      }),
    });
  }

  async function agregarEjercicioManual(sesionId) {
    if (!ejercicioManual.nombre) return;
    const nuevo = {
      nombre: ejercicioManual.nombre,
      link: "",
      series: ejercicioManual.series,
      repeticiones: ejercicioManual.repeticiones,
      origen: "manual",
    };
    const ref = doc(db, "kinesiologos", user.uid, "alumnos", id, "sesiones", sesionId);
    await updateDoc(ref, { ejercicios: arrayUnion(nuevo) });

    if (ejercicioManual.guardarEnPersonal) {
      await addDoc(collection(db, "kinesiologos", user.uid, "biblioteca_personal"), {
        nombre: nuevo.nombre,
        series: nuevo.series,
        repeticiones: nuevo.repeticiones,
        link: "",
        creadoEl: new Date().toISOString(),
      });
    }
    setEjercicioManual({ nombre: "", series: "", repeticiones: "", guardarEnPersonal: false });
  }

  async function quitarEjercicio(sesionId, ejercicio) {
    const ref = doc(db, "kinesiologos", user.uid, "alumnos", id, "sesiones", sesionId);
    await updateDoc(ref, { ejercicios: arrayRemove(ejercicio) });
  }

  if (!alumno) return <p style={{ color: "var(--text-dim)" }}>Cargando...</p>;

  const todaLaBiblioteca = [
    ...bibliotecaGeneral.map((e) => ({ ...e, tipo: "General" })),
    ...bibliotecaPersonal.map((e) => ({ ...e, tipo: "Mía" })),
  ].filter((e) => e.nombre?.toLowerCase().includes(buscador.toLowerCase()));

  return (
    <div>
      <Link to="/alumnos" style={{ color: "var(--text-dim)", fontSize: 13 }}>← Volver a alumnos</Link>
      <h1 style={{ fontSize: 24, marginTop: 8 }}>{alumno.nombre}</h1>
      <p style={{ color: "var(--text-dim)", marginTop: -8 }}>{alumno.patologia || "Sin diagnóstico registrado"}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24, maxWidth: 500 }}>
        <div className="card"><div style={{ fontSize: 12, color: "var(--text-dim)" }}>Teléfono</div><div>{alumno.telefono || "—"}</div></div>
        <div className="card"><div style={{ fontSize: 12, color: "var(--text-dim)" }}>Monto sesión</div><div>${alumno.montoSesion || 0}</div></div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Plan de sesiones</h2>
        <button className="btn-primary" onClick={crearSesion}>+ Nueva sesión</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sesiones.map((s) => (
          <div key={s.id} className="card">
            <div
              style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setSesionAbierta(sesionAbierta === s.id ? null : s.id)}
            >
              <strong>Sesión {s.numero}</strong>
              <span style={{ color: "var(--text-dim)", fontSize: 13 }}>{s.fecha} · {s.ejercicios?.length || 0} ejercicios</span>
            </div>

            {sesionAbierta === s.id && (
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                {s.ejercicios?.map((ej, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{ej.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {ej.series && ej.repeticiones ? `${ej.series}x${ej.repeticiones}` : ""}
                        {ej.link && <> · <a href={ej.link} target="_blank" rel="noreferrer" style={{ color: "var(--orange)" }}>ver video</a></>}
                      </div>
                    </div>
                    <button className="btn-secondary" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => quitarEjercicio(s.id, ej)}>Quitar</button>
                  </div>
                ))}

                <div style={{ marginTop: 14 }}>
                  <input placeholder="Buscar en biblioteca (general + tuya)..." value={buscador} onChange={(e) => setBuscador(e.target.value)} />
                  {buscador && (
                    <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
                      {todaLaBiblioteca.slice(0, 8).map((ej) => (
                        <div key={ej.tipo + ej.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                          <span>{ej.nombre} <span style={{ color: "var(--text-dim)" }}>({ej.tipo})</span></span>
                          <button className="btn-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => agregarEjercicioDeBiblioteca(s.id, ej)}>Agregar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input style={{ maxWidth: 180 }} placeholder="Ejercicio propio" value={ejercicioManual.nombre} onChange={(e) => setEjercicioManual({ ...ejercicioManual, nombre: e.target.value })} />
                  <input style={{ maxWidth: 70 }} placeholder="Series" value={ejercicioManual.series} onChange={(e) => setEjercicioManual({ ...ejercicioManual, series: e.target.value })} />
                  <input style={{ maxWidth: 70 }} placeholder="Reps" value={ejercicioManual.repeticiones} onChange={(e) => setEjercicioManual({ ...ejercicioManual, repeticiones: e.target.value })} />
                  <label style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="checkbox" style={{ width: "auto" }} checked={ejercicioManual.guardarEnPersonal} onChange={(e) => setEjercicioManual({ ...ejercicioManual, guardarEnPersonal: e.target.checked })} />
                    Guardar en mi biblioteca
                  </label>
                  <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => agregarEjercicioManual(s.id)}>Agregar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
