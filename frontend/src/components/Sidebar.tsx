// src/components/Sidebar.tsx
import { h } from "preact";
import { route } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import "../styles/sidebar.css";
import logoImage from "../assets/logtracker.png";
import { useUser } from "../context/UserContext";

const navItems = [
    { label: "Dashboard", path: "/", icon: "oj-ux-ico-dashboard" },
    { label: "Logs", path: "/logs", icon: "oj-ux-ico-documents" },
    { label: "User Management", path: "/users", icon: "oj-ux-ico-user-data" },
    {
        label: "Applications",
        path: "/applications",
        icon: "oj-ux-ico-applications",
    },
    { label: "Settings", path: "/settings", icon: "oj-ux-ico-settings" },
];

export default function Sidebar() {
    const [activePath, setActivePath] = useState(window.location.pathname);
    const [collapsed, setCollapsed] = useState(false);

    const { user } = useUser();

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
        <div
            class={`sidebar ${collapsed ? "collapsed" : ""}`}
            onMouseEnter={() => setCollapsed(false)}
            onMouseLeave={() => setCollapsed(true)}
        >
            <div class="sidebar-header">
                <div
                    class="sidebar-logo"
                    onClick={() => {
                        route("/");
                        setActivePath("/");
                    }}
                >
                    <img
                        src={logoImage}
                        alt="LogTracker"
                        class="sidebar-logo-image"
                    />
                    {!collapsed && (
                        <span class="sidebar-title">LogTracker</span>
                    )}
                </div>
            </div>

            <ul class="sidebar-list">
                {navItems
                    .filter(({ label }) => {
                        if (label === "User Management" && !user?.is_admin)
                            return false;
                        return true;
                    })
                    .map(({ label, path, icon }) => {
                        const isActive = activePath === path;
                        return (
                            <li
                                key={path}
                                class={`sidebar-item ${isActive ? "active" : ""}`}
                                onClick={() => handleNav(path)}
                            >
                                <span class={`oj-icon ${icon}`}></span>
                                {!collapsed && (
                                    <span class="sidebar-label">{label}</span>
                                )}
                            </li>
                        );
                    })}
            </ul>
        </div>
    );
}
