import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc, getDoc, collection, addDoc, onSnapshot, query, orderBy,
  updateDoc, arrayUnion, arrayRemove, writeBatch,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

const CATEGORIAS = [
  "Lumbalgia", "Cervicalgia", "Dolor patelofemoral", "Síndrome subacromial",
  "Esguince de tobillo", "Core / estabilidad", "Post-cirugía LCA/menisco",
  "Post-fractura tobillo", "Post-fractura brazo", "Post-cirugía hombro", "Otra",
];

const ETIQUETA_UNIDAD = { sesiones: "Sesión", dias: "Día", semanas: "Semana" };

export default function AlumnoDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const [alumno, setAlumno] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [planActivoId, setPlanActivoId] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [bibliotecaGeneral, setBibliotecaGeneral] = useState([]);
  const [bibliotecaPersonal, setBibliotecaPersonal] = useState([]);
  const [unidadAbierta, setUnidadAbierta] = useState(null);
  const [buscador, setBuscador] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [ejercicioManual, setEjercicioManual] = useState({ nombre: "", series: "", repeticiones: "", guardarEnPersonal: false });
  const [showNuevoPlan, setShowNuevoPlan] = useState(false);
  const [nuevoPlan, setNuevoPlan] = useState({ tipo: "sesiones", cantidad: 6, nombre: "" });
  const [verArchivados, setVerArchivados] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "kinesiologos", user.uid, "alumnos", id)).then((snap) => {
      if (snap.exists()) setAlumno({ id: snap.id, ...snap.data() });
    });
  }, [user, id]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "kinesiologos", user.uid, "alumnos", id, "planes"), orderBy("creadoEl", "desc")),
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPlanes(lista);
        const activo = lista.find((p) => p.estado === "activo");
        setPlanActivoId((prev) => prev || activo?.id || lista[0]?.id || null);
      }
    );
    return unsub;
  }, [user, id]);

  useEffect(() => {
    if (!user || !planActivoId) { setUnidades([]); return; }
    const unsub = onSnapshot(
      query(collection(db, "kinesiologos", user.uid, "alumnos", id, "planes", planActivoId, "unidades"), orderBy("numero")),
      (snap) => setUnidades(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [user, id, planActivoId]);

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

  async function crearPlan(e) {
    e.preventDefault();
    const cantidad = Math.max(1, Number(nuevoPlan.cantidad) || 1);

    // Archiva cualquier plan activo anterior
    const activos = planes.filter((p) => p.estado === "activo");
    const batch = writeBatch(db);
    for (const p of activos) {
      batch.update(doc(db, "kinesiologos", user.uid, "alumnos", id, "planes", p.id), { estado: "archivado" });
    }
    await batch.commit();

    const planRef = await addDoc(collection(db, "kinesiologos", user.uid, "alumnos", id, "planes"), {
      tipo: nuevoPlan.tipo,
      cantidad,
      nombre: nuevoPlan.nombre || "",
      estado: "activo",
      creadoEl: new Date().toISOString(),
    });

    const batch2 = writeBatch(db);
    for (let i = 1; i <= cantidad; i++) {
      const unidadRef = doc(collection(db, "kinesiologos", user.uid, "alumnos", id, "planes", planRef.id, "unidades"));
      batch2.set(unidadRef, { numero: i, ejercicios: [] });
    }
    await batch2.commit();

    setPlanActivoId(planRef.id);
    setShowNuevoPlan(false);
    setNuevoPlan({ tipo: "sesiones", cantidad: 6, nombre: "" });
  }

  async function reactivarPlan(planId) {
    const activos = planes.filter((p) => p.estado === "activo");
    const batch = writeBatch(db);
    for (const p of activos) {
      batch.update(doc(db, "kinesiologos", user.uid, "alumnos", id, "planes", p.id), { estado: "archivado" });
    }
    batch.update(doc(db, "kinesiologos", user.uid, "alumnos", id, "planes", planId), { estado: "activo" });
    await batch.commit();
    setPlanActivoId(planId);
  }

  async function agregarEjercicioDeBiblioteca(unidadId, ejercicio) {
    const ref = doc(db, "kinesiologos", user.uid, "alumnos", id, "planes", planActivoId, "unidades", unidadId);
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

  async function agregarEjercicioManual(unidadId) {
    if (!ejercicioManual.nombre) return;
    const nuevo = {
      nombre: ejercicioManual.nombre,
      link: "",
      series: ejercicioManual.series,
      repeticiones: ejercicioManual.repeticiones,
      origen: "manual",
    };
    const ref = doc(db, "kinesiologos", user.uid, "alumnos", id, "planes", planActivoId, "unidades", unidadId);
    await updateDoc(ref, { ejercicios: arrayUnion(nuevo) });

    if (ejercicioManual.guardarEnPersonal) {
      await addDoc(collection(db, "kinesiologos", user.uid, "biblioteca_personal"), {
        nombre: nuevo.nombre,
        series: nuevo.series,
        repeticiones: nuevo.repeticiones,
        link: "",
        categoria: categoriaFiltro !== "Todas" ? categoriaFiltro : "Otra",
        creadoEl: new Date().toISOString(),
      });
    }
    setEjercicioManual({ nombre: "", series: "", repeticiones: "", guardarEnPersonal: false });
  }

  async function quitarEjercicio(unidadId, ejercicio) {
    const ref = doc(db, "kinesiologos", user.uid, "alumnos", id, "planes", planActivoId, "unidades", unidadId);
    await updateDoc(ref, { ejercicios: arrayRemove(ejercicio) });
  }

  if (!alumno) return <p style={{ color: "var(--text-dim)" }}>Cargando...</p>;

  const planSeleccionado = planes.find((p) => p.id === planActivoId);
  const etiqueta = planSeleccionado ? ETIQUETA_UNIDAD[planSeleccionado.tipo] : "Unidad";

  const todaLaBiblioteca = [
    ...bibliotecaGeneral.map((e) => ({ ...e, origenTipo: "General" })),
    ...bibliotecaPersonal.map((e) => ({ ...e, origenTipo: "Mía" })),
  ].filter((e) => {
    const coincideCategoria = categoriaFiltro === "Todas" || e.categoria === categoriaFiltro;
    const coincideTexto = e.nombre?.toLowerCase().includes(buscador.toLowerCase());
    return coincideCategoria && coincideTexto;
  });

  const planesArchivados = planes.filter((p) => p.estado === "archivado");

  return (
    <div>
      <Link to="/alumnos" style={{ color: "var(--text-dim)", fontSize: 13 }}>← Volver a alumnos</Link>
      <h1 style={{ fontSize: 24, marginTop: 8 }}>{alumno.nombre}</h1>
      <p style={{ color: "var(--text-dim)", marginTop: -8 }}>{alumno.patologia || "Sin diagnóstico registrado"}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24, maxWidth: 500 }}>
        <div className="card"><div style={{ fontSize: 12, color: "var(--text-dim)" }}>Teléfono</div><div>{alumno.telefono || "—"}</div></div>
        <div className="card"><div style={{ fontSize: 12, color: "var(--text-dim)" }}>Monto sesión</div><div>${alumno.montoSesion || 0}</div></div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Plan de trabajo</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {planesArchivados.length > 0 && (
            <button className="btn-secondary" onClick={() => setVerArchivados(!verArchivados)}>
              {verArchivados ? "Ocultar archivados" : `Ver archivados (${planesArchivados.length})`}
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowNuevoPlan(!showNuevoPlan)}>+ Nuevo plan</button>
        </div>
      </div>

      {showNuevoPlan && (
        <form onSubmit={crearPlan} className="card" style={{ marginBottom: 20, display: "grid", gap: 12, maxWidth: 420 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Nombre del plan (opcional)</label>
            <input placeholder="ej. Fase 1 post-cirugía" value={nuevoPlan.nombre} onChange={(e) => setNuevoPlan({ ...nuevoPlan, nombre: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Organizar por</label>
            <select value={nuevoPlan.tipo} onChange={(e) => setNuevoPlan({ ...nuevoPlan, tipo: e.target.value })}>
              <option value="sesiones">Sesiones</option>
              <option value="dias">Días</option>
              <option value="semanas">Semanas</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)" }}>
              ¿Cuántas {nuevoPlan.tipo === "sesiones" ? "sesiones" : nuevoPlan.tipo === "dias" ? "días" : "semanas"}?
            </label>
            <input type="number" min="1" value={nuevoPlan.cantidad} onChange={(e) => setNuevoPlan({ ...nuevoPlan, cantidad: e.target.value })} />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", margin: 0 }}>
            El plan actual (si hay uno activo) se archivará automáticamente, sin perder su historial.
          </p>
          <button type="submit" className="btn-primary">Crear plan</button>
        </form>
      )}

      {verArchivados && planesArchivados.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 10 }}>Planes archivados</div>
          {planesArchivados.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{p.nombre || `Plan por ${p.tipo}`} · {p.cantidad} {ETIQUETA_UNIDAD[p.tipo].toLowerCase()}(s)</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setPlanActivoId(p.id)}>Ver</button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => reactivarPlan(p.id)}>Reactivar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {planSeleccionado ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <strong>{planSeleccionado.nombre || `Plan por ${planSeleccionado.tipo}`}</strong>
            <span className={`badge ${planSeleccionado.estado === "activo" ? "badge-ok" : "badge-warn"}`}>
              {planSeleccionado.estado === "activo" ? "Activo" : "Archivado"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {unidades.map((u) => (
              <div key={u.id} className="card">
                <div
                  style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setUnidadAbierta(unidadAbierta === u.id ? null : u.id)}
                >
                  <strong>{etiqueta} {u.numero}</strong>
                  <span style={{ color: "var(--text-dim)", fontSize: 13 }}>{u.ejercicios?.length || 0} ejercicios</span>
                </div>

                {unidadAbierta === u.id && (
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    {u.ejercicios?.map((ej, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{ej.nombre}</div>
                          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                            {ej.series && ej.repeticiones ? `${ej.series}x${ej.repeticiones}` : ""}
                            {ej.link && <> · <a href={ej.link} target="_blank" rel="noreferrer" style={{ color: "var(--orange)" }}>ver video</a></>}
                          </div>
                        </div>
                        <button className="btn-secondary" style={{ fontSize: 12, padding: "3px 8px" }} onClick={() => quitarEjercicio(u.id, ej)}>Quitar</button>
                      </div>
                    ))}

                    <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <select style={{ maxWidth: 220 }} value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                        <option>Todas</option>
                        {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <input style={{ maxWidth: 220 }} placeholder="Buscar ejercicio..." value={buscador} onChange={(e) => setBuscador(e.target.value)} />
                    </div>
                    {(buscador || categoriaFiltro !== "Todas") && (
                      <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
                        {todaLaBiblioteca.slice(0, 10).map((ej) => (
                          <div key={ej.origenTipo + ej.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                            <span>{ej.nombre} <span style={{ color: "var(--text-dim)" }}>({ej.origenTipo}{ej.categoria ? ` · ${ej.categoria}` : ""})</span></span>
                            <button className="btn-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => agregarEjercicioDeBiblioteca(u.id, ej)}>Agregar</button>
                          </div>
                        ))}
                        {todaLaBiblioteca.length === 0 && <p style={{ fontSize: 12, color: "var(--text-dim)" }}>Sin resultados en la biblioteca.</p>}
                      </div>
                    )}

                    <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <input style={{ maxWidth: 180 }} placeholder="Ejercicio propio" value={ejercicioManual.nombre} onChange={(e) => setEjercicioManual({ ...ejercicioManual, nombre: e.target.value })} />
                      <input style={{ maxWidth: 70 }} placeholder="Series" value={ejercicioManual.series} onChange={(e) => setEjercicioManual({ ...ejercicioManual, series: e.target.value })} />
                      <input style={{ maxWidth: 70 }} placeholder="Reps" value={ejercicioManual.repeticiones} onChange={(e) => setEjercicioManual({ ...ejercicioManual, repeticiones: e.target.value })} />
                      <label style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="checkbox" style={{ width: "auto" }} checked={ejercicioManual.guardarEnPersonal} onChange={(e) => setEjercicioManual({ ...ejercicioManual, guardarEnPersonal: e.target.checked })} />
                        Guardar en mi biblioteca
                      </label>
                      <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => agregarEjercicioManual(u.id)}>Agregar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Este alumno todavía no tiene ningún plan. Crea uno con "+ Nuevo plan".</p>
      )}
    </div>
  );
}
