import {
  AlertTriangle,
  CircleHelp,
  History,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

function ModelPerformance() {
  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-[#f4f4f5] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1800px]">
        <section className="mb-10 flex flex-col justify-between gap-6 border-b-2 border-[#27272f] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 bg-[#c7ff3d]" />
              <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-white">
                Production Model / v4.2.1-epsilon
              </p>
            </div>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">
              Model Performance
            </h1>
            <p className="mt-4 max-w-xl font-body text-base text-zinc-400">
              Evaluate model quality, tune decision thresholds, and understand
              the financial impact of fraud predictions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 border-2 border-[#27272f] bg-[#15151c] px-5 py-3 font-body text-sm font-bold text-zinc-300 shadow-[4px_4px_0px_#27272f] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#22d3ee] hover:text-white">
              <History size={17} />
              Historical Runs
            </button>
            <button className="flex items-center gap-2 border-2 border-black bg-[#c7ff3d] px-5 py-3 font-body text-sm font-bold text-black shadow-[4px_4px_0px_#ffffff] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#ffffff]">
              <Upload size={17} />
              Deploy Config
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-12">
          <section className="border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f] xl:col-span-8">
            <div className="flex flex-col justify-between gap-4 border-b-2 border-[#27272f] px-7 py-6 sm:flex-row sm:items-center">
              <div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-[#d946ef]">
                  Evaluation Signal
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <h2 className="font-display text-2xl">Precision-Recall Curve</h2>
                  <CircleHelp size={17} className="text-zinc-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <span className="border-2 border-[#d946ef] px-3 py-2 font-body text-xs font-bold text-[#d946ef]">AUC: --</span>
                <span className="border-2 border-[#22d3ee] px-3 py-2 font-body text-xs font-bold text-[#22d3ee]">F1: --</span>
              </div>
            </div>
            <div className="p-7">
              <div className="relative flex h-[480px] items-center justify-center border-2 border-dashed border-[#3a3a45] bg-[#0f0f14]">
                <div className="pointer-events-none absolute inset-x-10 top-8 bottom-12 flex flex-col justify-between">
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                </div>
                <div className="relative z-10 px-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black bg-[#c7ff3d] text-black shadow-[5px_5px_0px_#ffffff]"><SlidersHorizontal size={30} /></div>
                  <h3 className="font-display mt-7 text-lg">Awaiting Evaluation Data</h3>
                  <p className="mt-3 font-body text-sm text-zinc-500">Precision and recall data will appear here when the backend is connected.</p>
                </div>
                <p className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 font-body text-xs font-bold uppercase tracking-wider text-zinc-500">Precision</p>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-xs font-bold uppercase tracking-wider text-zinc-500">Recall</p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-7 xl:col-span-4">
            <section className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="font-body text-xs font-bold uppercase tracking-widest text-[#22d3ee]">Decision Control</p>
                  <h2 className="font-display mt-2 text-2xl">Threshold Tuning</h2>
                </div>
                <span className="border-2 border-[#22d3ee] px-3 py-2 font-body text-xs font-bold text-[#22d3ee]">T = --</span>
              </div>
              <div className="relative pt-2">
                <div className="h-1 w-full bg-[#3a3a45]"><div className="relative h-full w-1/2 bg-[#22d3ee]"><div className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 border-2 border-black bg-[#22d3ee]" /></div></div>
                <div className="mt-3 flex justify-between font-body text-xs font-bold text-zinc-500"><span>Permissive (0.0)</span><span>Strict (1.0)</span></div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-4">
                <Metric label="CURRENT BLOCK RATE" />
                <Metric label="REVIEW QUEUE EST." />
              </div>
            </section>

            <section className="flex-1 border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f]">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#ff4d4d]">Financial Exposure</p>
              <h2 className="font-display mt-2 text-2xl">Cost Matrix Impact</h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-zinc-500">Estimated daily financial impact based on the current model threshold.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center font-body text-xs font-bold text-zinc-500"><p>Pred: Fraud</p><p>Pred: Legit</p></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <MatrixCell label="TP" value="Saved: --" color="text-[#c7ff3d]" border="border-[#c7ff3d]" />
                <MatrixCell label="FN" value="Loss: --" color="text-[#ff4d4d]" border="border-[#ff4d4d]" />
                <MatrixCell label="FP" value="Cost: --" color="text-[#facc15]" border="border-[#facc15]" />
                <MatrixCell label="TN" value="--" color="text-[#22d3ee]" border="border-[#22d3ee]" />
              </div>
            </section>
          </div>
        </div>

        <section className="mt-10 border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f]">
          <div className="flex items-center gap-3 border-b-2 border-[#27272f] px-7 py-6"><AlertTriangle size={21} className="text-[#facc15]" /><div><p className="font-body text-xs font-bold uppercase tracking-widest text-[#facc15]">Model Notes</p><h2 className="font-display mt-2 text-2xl">Known Limitations &amp; Edge Cases</h2></div></div>
          <div className="grid grid-cols-1 gap-6 p-7 md:grid-cols-3">
            <Limitation title="Cold-start Merchants" color="bg-[#ff4d4d]">Model limitations for merchants with insufficient historical transaction data will appear here from backend evaluation.</Limitation>
            <Limitation title="Cross-border Gift Cards" color="bg-[#facc15]">Cross-border transaction behavior and false-positive patterns identified by the model will appear here.</Limitation>
            <Limitation title="Device Fingerprinting Decay" color="bg-[#22d3ee]">Feature drift and changes in device fingerprint reliability will be monitored and displayed here.</Limitation>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label }) {
  return <div className="border-2 border-[#27272f] bg-[#0f0f14] p-5"><p className="font-body text-xs font-bold tracking-wider text-zinc-500">{label}</p><p className="font-display mt-4 text-2xl text-[#d946ef]">--</p></div>;
}

function MatrixCell({ label, value, color, border }) {
  return <div className={`border-2 ${border} bg-[#0f0f14] p-4`}><p className={`font-body text-xs font-bold ${color}`}>{label}</p><p className={`font-display mt-4 text-center text-xl ${color}`}>--</p><p className={`mt-3 text-center font-body text-xs font-bold ${color}`}>{value}</p></div>;
}

function Limitation({ title, color, children }) {
  return <div className="border-2 border-[#27272f] bg-[#0f0f14] p-5"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 ${color}`} /><h3 className="font-body text-sm font-bold">{title}</h3></div><p className="mt-4 font-body text-sm leading-relaxed text-zinc-500">{children}</p></div>;
}

export default ModelPerformance;
