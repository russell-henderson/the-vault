import type { ReactNode } from "react";

type LayoutProps = { children: ReactNode; onNavigate: (path: string) => void };

export function Layout({ children, onNavigate }: LayoutProps) {
  return <div className="min-h-screen bg-[#080d18] text-slate-100">
    <header className="border-b border-white/10 bg-[#0b1220]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <button className="flex items-center gap-3 text-left" onClick={() => onNavigate("/dashboard")}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 font-black text-slate-950">V</span>
          <span><span className="block text-sm font-bold tracking-wide">VAULT ARCHITECT</span><span className="block text-xs text-slate-500">Human intent → AI evidence</span></span>
        </button>
        <nav className="flex items-center gap-5 text-sm text-slate-400"><button className="transition hover:text-white" onClick={() => onNavigate("/dashboard")}>Blueprints</button><button className="rounded-lg border border-cyan-400/30 px-3 py-2 text-cyan-300 transition hover:bg-cyan-400/10" onClick={() => onNavigate("/blueprints/new")}>New blueprint <span className="ml-1">+</span></button></nav>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
  </div>;
}
