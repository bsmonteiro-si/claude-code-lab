import { NavLink, Outlet } from "react-router";
import { useTheme } from "../hooks/useTheme";

const navigationItems = [
  { to: "/", label: "Home" },
  { to: "/templates", label: "Templates" },
  { to: "/pipelines", label: "Pipelines" },
  { to: "/executions", label: "Executions" },
];

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `block px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-accent-sidebar-active text-text-primary border border-glass-border"
            : "text-text-secondary hover:bg-glass-bg-hover"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="px-4 py-4 border-t border-glass-border">
      <p className="text-xs text-text-tertiary mb-2">Theme</p>
      <div className="flex gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
              theme === t.id
                ? "ring-2 ring-text-primary ring-offset-2 ring-offset-transparent scale-110"
                : "opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: t.color }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="flex h-screen mesh-gradient">
      <aside className="w-64 glass-sidebar text-text-primary flex flex-col">
        <div className="px-4 py-5 text-lg font-semibold border-b border-glass-border tracking-wide">
          LLM Prompt Lab
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <SidebarLink key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
        <ThemePicker />
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
