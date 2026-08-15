import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

export default function Pagos() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "kinesiologos", user.uid, "alumnos"), orderBy("nombre")), (snap) => {
      setAlumnos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  async function marcarPagado(alumno) {
    await updateDoc(doc(db, "kinesiologos", user.uid, "alumnos", alumno.id), {
      estadoPago: "al_dia",
      ultimoPago: new Date().toISOString().slice(0, 10),
    });
    await addDoc(collection(db, "kinesiologos", user.uid, "pagos"), {
      alumnoId: alumno.id,
      alumnoNombre: alumno.nombre,
      monto: alumno.montoSesion || 0,
      fecha: new Date().toISOString().slice(0, 10),
    });
  }

  async function marcarAtrasado(alumno) {
    await updateDoc(doc(db, "kinesiologos", user.uid, "alumnos", alumno.id), { estadoPago: "atrasado" });
  }

  const totalAlDia = alumnos.filter((a) => a.estadoPago !== "atrasado").length;
  const totalAtrasados = alumnos.filter((a) => a.estadoPago === "atrasado").length;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Pagos</h1>

      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Al día</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--green-ok)" }}>{totalAlDia}</div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Atrasados</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--red-warn)" }}>{totalAtrasados}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {alumnos.map((a) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{a.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {a.modalidadPago === "mensual" ? "Pago mensual" : "Pago por sesiones"} · ${a.montoSesion || 0} / sesión
                {a.ultimoPago && ` · Último pago: ${a.ultimoPago}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${a.estadoPago === "atrasado" ? "badge-warn" : "badge-ok"}`}>
                {a.estadoPago === "atrasado" ? "Atrasado" : "Al día"}
              </span>
              {a.estadoPago === "atrasado" ? (
                <button className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => marcarPagado(a)}>Marcar pagado</button>
              ) : (
                <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => marcarAtrasado(a)}>Marcar atrasado</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
