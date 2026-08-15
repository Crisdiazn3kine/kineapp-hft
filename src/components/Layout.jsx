import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/agenda", label: "Agenda", icon: "📅" },
  { to: "/alumnos", label: "Alumnos", icon: "🧑‍🤝‍🧑" },
  { to: "/pagos", label: "Pagos", icon: "💰" },
  { to: "/biblioteca", label: "Biblioteca", icon: "📚" },
];

export default function Layout({ children }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 14px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 24px" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "var(--orange)" }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>KineApp <span style={{ color: "var(--orange)" }}>HFT</span></span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? "var(--orange)" : "var(--text-dim)",
                background: isActive ? "var(--orange-dim)" : "transparent",
              })}
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8, padding: "0 4px" }}>
            {profile?.nombre || "Kinesiólogo"}
          </div>
          <button
            className="btn-secondary"
            style={{ width: "100%", fontSize: 13 }}
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "28px 32px", overflowX: "auto" }}>{children}</main>
    </div>
  );
}
