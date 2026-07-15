export function App() {
  return <main className="min-h-screen bg-slate-950 px-8 py-16 text-slate-100">
    <div className="mx-auto max-w-4xl">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">The Vault Architect</p>
      <h1 className="text-5xl font-bold tracking-tight">Architecture intent, preserved for implementation.</h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">The web workspace is scaffolded for the blueprint, prompt, and review flow. Milestone 1 provides the API vertical slice behind this experience.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">{["Blueprint", "Prompt", "Execution record"].map((label, index) => <div className="rounded-xl border border-slate-800 bg-slate-900 p-5" key={label}><span className="text-sm text-cyan-400">0{index + 1}</span><h2 className="mt-8 font-semibold">{label}</h2><p className="mt-2 text-sm text-slate-400">Coming in the next UI milestone.</p></div>)}</div>
    </div>
  </main>;
}
