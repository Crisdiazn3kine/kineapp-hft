import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [citasHoy, setCitasHoy] = useState([]);
  const [pagosAtrasados, setPagosAtrasados] = useState([]);

  useEffect(() => {
    if (!user) return;
    const hoy = new Date().getDay();
    const q = query(collection(db, "kinesiologos", user.uid, "agenda"), where("dia", "==", hoy));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
      setCitasHoy(rows);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "kinesiologos", user.uid, "alumnos"), where("estadoPago", "==", "atrasado"));
    const unsub = onSnapshot(q, (snap) => {
      setPagosAtrasados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Hola, {profile?.nombre?.split(" ")[0] || "kine"} 👋</h1>
      <p style={{ color: "var(--text-dim)", marginTop: 0 }}>{DIAS[new Date().getDay()]}, hoy tienes {citasHoy.length} sesión(es) agendada(s).</p>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 24 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Agenda de hoy</h3>
          {citasHoy.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14 }}>No tienes sesiones agendadas para hoy.</p>}
          {citasHoy.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{c.alumnoNombre}</span>
              <span style={{ color: "var(--orange)", fontWeight: 600 }}>{c.hora}</span>
            </div>
          ))}
          <Link to="/agenda" className="btn-secondary" style={{ display: "inline-block", marginTop: 14, fontSize: 13 }}>Ver agenda completa</Link>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pagos atrasados</h3>
          {pagosAtrasados.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Todos al día 🎉</p>}
          {pagosAtrasados.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{a.nombre}</span>
              <span className="badge badge-warn">Atrasado</span>
            </div>
          ))}
          <Link to="/pagos" className="btn-secondary" style={{ display: "inline-block", marginTop: 14, fontSize: 13 }}>Ver pagos</Link>
        </div>
      </div>
    </div>
  );
}
