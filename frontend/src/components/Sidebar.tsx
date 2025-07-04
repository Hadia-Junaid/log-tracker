// src/components/Sidebar.tsx
import { h } from "preact";
import { route } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import "../styles/sidebar.css"; 

const navItems = [
  { label: "Dashboard", path: "/", icon: "oj-ux-ico-home" },
  { label: "Logs", path: "/logs", icon: "oj-ux-ico-document-text" },
  { label: "User Management", path: "/users", icon: "oj-ux-ico-people" },
  { label: "Applications", path: "/applications", icon: "oj-ux-ico-apps" },
  { label: "Settings", path: "/settings", icon: "oj-ux-ico-settings" },
];

export default function Sidebar() {
  const [activePath, setActivePath] = useState(window.location.pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onPop = () => setActivePath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleNav = (path: string) => {
    route(path);
    setActivePath(path);
  };

  return (
    <div class={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        class="collapse-button"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? "»" : "«"}
      </button>

      <ul class="sidebar-list">
        {navItems.map(({ label, path, icon }) => {
          const isActive = activePath === path;
          return (
            <li
              key={path}
              class={`sidebar-item ${isActive ? "active" : ""}`}
              onClick={() => handleNav(path)}
            >
              <span class={`sidebar-icon oj-icon ${icon}`}></span>
              {!collapsed && <span class="sidebar-label">{label}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
