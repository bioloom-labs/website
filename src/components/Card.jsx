export function Card({ icon: Icon, title, children, footer }) {
  return (<div className="group card"><div className="card-spot group-hover:opacity-100" />
    <div className="card-body">{Icon && (<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/20 to-emerald-400/20"><Icon className="h-6 w-6 text-brand-300" /></div>)}{title && <h3 className="text-lg md:text-xl font-semibold mb-2">{title}</h3>}
      <div className="text-sm md:text-base text-white/80 leading-relaxed">{children}</div></div>
    {footer && <div className="relative border-t border-white/10 p-4 text-sm text-white/70">{footer}</div>}</div>)
}