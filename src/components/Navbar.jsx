import { useEffect, useState, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm lg:text-base transition hover:bg-white/5 ${isActive ? "text-brand-300" : "text-white/90"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  // Close on route change
  useEffect(() => setOpen(false), [location]);

  // ❌ REMOVED: body scroll lock effect (so the page can scroll while menu is open)

  // Auto-close on desktop breakpoint (≥1024px)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handle = (e) => e.matches && setOpen(false);
    mql.addEventListener?.("change", handle);
    mql.addListener?.(handle);
    return () => {
      mql.removeEventListener?.("change", handle);
      mql.removeListener?.(handle);
    };
  }, []);

  // Outside click closes the menu
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      const menu = menuRef.current;
      const button = buttonRef.current;
      if (menu && !menu.contains(e.target) && button && !button.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const items = [
    { to: "/about", label: "About" },
    { to: "/research", label: "Research" },
    { to: "/people", label: "People" },
    { to: "/publications", label: "Publications" },
    { to: "/news", label: "News" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-950/70 backdrop-blur supports-[backdrop-filter]:bg-brand-950/40">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center">
          <div className="h- w-auto flex items-center">
            <img
              src="/images/logos/bioloom.png"
              alt="BioLoom Labs Logo"
              className="h-14 w-auto object-contain object-center"
              style={{ display: "block" }}
            />
          </div>
        </Link>



        {/* Desktop nav (≥ lg) */}
        <div className="hidden lg:flex items-center gap-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={linkClass}>
              {it.label}
            </NavLink>
          ))}
        </div>

        {/* Hamburger (< lg) */}
        <button
          ref={buttonRef}
          type="button"
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-300"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6 text-white/90" /> : <Menu className="h-6 w-6 text-white/90" />}
        </button>
      </nav>

      {/* Mobile overlay + animated panel */}
      <div className={`lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          // CHANGED: let page scroll/touch through the backdrop
          className={`fixed inset-0 bg-black/40 transition-opacity duration-200 ease-out pointer-events-none ${open ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Animated dropdown */}
        <div
          ref={menuRef}
          className={`
            fixed left-3 right-3 top-[56px]
            rounded-2xl border border-white/10 bg-brand-950/90 backdrop-blur shadow-xl
            overflow-y-auto max-h-[calc(100vh-72px)]
            transition-all duration-200 ease-out
              ${open
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }
  `}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >

          <div className="px-2 py-2">
            {items.map((it, i) => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-3 rounded-xl text-base transition hover:bg-white/5 ${isActive ? "text-brand-300" : "text-white/90"
                  }`
                }
                style={{
                  transitionProperty: "opacity, transform, background-color, color",
                  transitionDuration: "200ms",
                  transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                  transitionDelay: open ? `${60 + i * 30}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "none" : "translateY(-4px)",
                }}
              >
                {it.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
