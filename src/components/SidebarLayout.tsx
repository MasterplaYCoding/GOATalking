import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useResponsive } from "../hooks/useResponsive";
import { theme } from "../theme/theme";
import { useGlobalStore } from "../store/useGlobalStore";

const baseNavItems = [
  { label: "Feed", to: "/feed", icon: "F" },
  { label: "Your Polls", to: "/your-polls", icon: "Y" },
  { label: "Lists", to: "/lists", icon: "L" },
  { label: "Global Chat", to: "/global-chat", icon: "C" },
  { label: "Marginality Test", to: "/marginality-test", icon: "M" },
];

export function SidebarLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const currentUserId = useGlobalStore((state) => state.currentUserId);
  const users = useGlobalStore((state) => state.users);

  const currentUser = users.find((u) => u.id === currentUserId);
  const roleName = currentUser?.roleName ?? 
                   (typeof currentUser?.role === "string" ? currentUser.role : currentUser?.role?.name);
  const isAdmin = currentUser?.username === "demo-user" || roleName === "Admin";

  const navItems = [...baseNavItems];
  if (isAdmin) {
    navItems.push({ label: "Security Logs", to: "/observations", icon: "S" });
  }

  const asideStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "76px",
        width: "100%",
        zIndex: 100,
        background: "rgba(16, 38, 37, 0.95)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        padding: "10px 14px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }
    : {
        width: collapsed ? "76px" : "220px",
        transition: "width 0.2s ease",
        background: "rgba(16, 38, 37, 0.88)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        padding: "18px 14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        position: "sticky",
        top: 0,
        height: "100vh",
      };

  return (
    <div style={{ minHeight: "100vh", display: "flex", paddingBottom: isMobile ? "76px" : 0 }}>
      <aside style={asideStyle}>
        {!isMobile && (
          <button
            onClick={() => setCollapsed((value) => !value)}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            {collapsed ? ">" : "<"}
          </button>
        )}

        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: "10px", flex: 1, overflowX: isMobile ? "auto" : "visible" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                padding: isMobile ? "10px 12px" : collapsed ? "12px 0" : "12px 14px",
                justifyContent: isMobile || collapsed ? "center" : "flex-start",
                borderRadius: "14px",
                color: "white",
                background: isActive ? "rgba(71, 199, 170, 0.22)" : "transparent",
                border: isActive ? "1px solid rgba(71, 199, 170, 0.45)" : "1px solid transparent",
                fontWeight: 600,
                flex: isMobile ? 1 : undefined,
              })}
            >
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: item.label === "Security Logs" ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.1)",
                  color: item.label === "Security Logs" ? "#FCA5A5" : "inherit",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              {!collapsed && !isMobile && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div style={{ marginTop: isMobile ? 0 : "auto" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              width: isMobile ? "48px" : "100%",
              height: "42px",
              borderRadius: "14px",
              border: "none",
              background: theme.colors.primary,
              color: "#173533",
              cursor: "pointer",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {collapsed || isMobile ? "L" : "Log Out"}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}