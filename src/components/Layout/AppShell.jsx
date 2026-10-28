import { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut, Menu, X } from "lucide-react";
import BrandMark from "../BrandMark";

/*
 * The signed-in layout shared by the dashboards: a navy menu on the left (large screens),
 * a slim top bar with where you are and who is signed in, and a slide-out menu on phones.
 *
 * `menu` is a list of sections: { label, items }. An item is either a link
 * { to, label, icon, end } or a group { key, base, label, icon, items: [{ to, label, end }] }.
 */

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white";
const linkIdle = "text-blue-100/80 hover:bg-white/10 hover:text-white";
const linkActive = "bg-[#155dfd] text-white shadow-md shadow-blue-900/30";

// Called when a link is followed, so the slide-out menu can close itself.
const NavContext = createContext(() => {});

const inside = (pathname, base) => pathname === base || pathname.startsWith(base + "/");

const SectionLabel = ({ children }) => (
  <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-blue-200/50">{children}</p>
);

const Item = ({ item }) => {
  const onNavigate = useContext(NavContext);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
};

// A parent with sub-links. Opens by itself when the current page is inside it.
const Group = ({ group, open, onToggle }) => {
  const onNavigate = useContext(NavContext);
  const { pathname } = useLocation();
  const here = group.items.some((i) => inside(pathname, i.to));
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`${linkBase} w-full ${here ? "bg-white/10 text-white" : linkIdle}`}
      >
        <group.icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="ml-[1.35rem] mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {group.items.map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                end={i.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block truncate rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                    isActive ? "font-semibold text-white" : "text-blue-100/70 hover:text-white"
                  }`
                }
              >
                {i.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SidebarMenu = ({ menu, onNavigate, onLogout }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState({});

  // Open the group the page belongs to (also when arriving from a link elsewhere).
  useEffect(() => {
    menu.forEach((section) =>
      section.items.forEach((item) => {
        if (item.items?.some((i) => inside(pathname, i.to))) {
          setOpen((o) => (o[item.key] ? o : { ...o, [item.key]: true }));
        }
      }),
    );
  }, [pathname, menu]);

  return (
    <NavContext.Provider value={onNavigate || (() => {})}>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {menu.map((section) => (
          <div key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            <div className="space-y-1">
              {section.items.map((item) =>
                item.items ? (
                  <Group
                    key={item.key}
                    group={item}
                    open={!!open[item.key]}
                    onToggle={() => setOpen((o) => ({ ...o, [item.key]: !o[item.key] }))}
                  />
                ) : (
                  <Item key={item.to} item={item} />
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className={`${linkBase} w-full text-blue-100/80 hover:bg-rose-500/15 hover:text-rose-200`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Log out
        </button>
      </div>
    </NavContext.Provider>
  );
};

const Brand = ({ brand, homePath, onClick }) => (
  <Link to={homePath} onClick={onClick} className="flex h-16 shrink-0 items-center gap-3 px-5">
    <BrandMark className="h-10 w-10 rounded-xl text-lg" />
    <span className="min-w-0">
      <span className="block truncate text-sm font-bold leading-tight text-white">{brand.title}</span>
      <span className="block truncate text-[11px] text-blue-200/70">{brand.subtitle}</span>
    </span>
  </Link>
);

// Where the current page sits in the menu: [group label, page label], or [page label].
const findTrail = (menu, pathname) => {
  let best = null;
  const consider = (to, trail) => {
    if (inside(pathname, to) && (!best || to.length > best.to.length)) best = { to, trail };
  };
  menu.forEach((section) =>
    section.items.forEach((item) => {
      if (item.items) item.items.forEach((i) => consider(i.to, [item.label, i.label]));
      else consider(item.to, [item.label]);
    }),
  );
  return best?.trail || [];
};

const Avatar = ({ name, className = "h-9 w-9" }) => (
  <span className={`grid shrink-0 place-items-center rounded-full bg-[#155dfd] text-xs font-bold uppercase text-white ${className}`}>
    {(name || "?").slice(0, 2)}
  </span>
);

const UserMenu = ({ user, accountLinks, onLogout, compact }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
      >
        <Avatar name={user.name} className={compact ? "h-8 w-8" : "h-9 w-9"} />
        {!compact && (
          <>
            <span className="text-left leading-tight">
              <span className="block max-w-[12rem] truncate text-sm font-semibold capitalize text-slate-900">{user.name}</span>
              {user.role && <span className="block text-xs text-slate-500">{user.role}</span>}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold capitalize text-slate-900">{user.name}</p>
              {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
            </div>
            <div className="my-1 h-px bg-slate-100" />
            {accountLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                role="menuitem"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <l.icon className="h-4 w-4 text-slate-400" />
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const AppShell = ({ brand, homePath, menu, user, accountLinks = [], onLogout, children }) => {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trail = findTrail(menu, pathname);

  // Close the slide-out menu with Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-slate-50 lg:pl-64 print:bg-white print:pl-0">
      {/* Left menu (large screens) */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-gradient-to-b from-[#0b1f4d] to-[#0a1a3f] text-white print:!hidden lg:flex"
        aria-label="Main menu"
      >
        <Brand brand={brand} homePath={homePath} />
        <SidebarMenu menu={menu} onLogout={onLogout} />
      </aside>

      {/* Top bar on phones and tablets */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 print:hidden lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-slate-900">{trail[trail.length - 1] || brand.title}</span>
        </div>
        <UserMenu user={user} accountLinks={accountLinks} onLogout={onLogout} compact />
      </header>

      {/* Slide-out menu on phones and tablets */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Main menu">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-gradient-to-b from-[#0b1f4d] to-[#0a1a3f] text-white shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand brand={brand} homePath={homePath} onClick={() => setDrawerOpen(false)} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-blue-100/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarMenu menu={menu} onNavigate={() => setDrawerOpen(false)} onLogout={onLogout} />
          </aside>
        </div>
      )}

      {/* Top bar on large screens */}
      <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur print:hidden lg:flex">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
          <span className="shrink-0">{brand.area}</span>
          {trail.map((t, i) => (
            <span key={t + i} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className={`truncate ${i === trail.length - 1 ? "font-semibold text-slate-900" : ""}`}>{t}</span>
            </span>
          ))}
        </nav>
        <UserMenu user={user} accountLinks={accountLinks} onLogout={onLogout} />
      </header>

      <main id="main-content" className="min-w-0">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
