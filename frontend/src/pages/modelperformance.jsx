import {
  AlertTriangle,
  CircleHelp,
  History,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

import { fetchApi } from "../api";

function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [curve, setCurve] = useState([]);
  const [thresholdData, setThresholdData] = useState(null);
  const [selectedThreshold, setSelectedThreshold] = useState(0.5);
  const [hoveredCurvePoint, setHoveredCurvePoint] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchApi("/metrics"),
      fetchApi("/pr-curve?points=30"),
      fetchApi("/threshold-analysis"),
    ])
      .then(([metricsResponse, curveResponse, thresholdResponse]) => {
        setMetrics(metricsResponse);
        setCurve(curveResponse.curve);
        setThresholdData(thresholdResponse);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const selectedPoint = thresholdData?.operating_points.reduce(
    (nearest, point) => Math.abs(point.threshold - selectedThreshold) < Math.abs(nearest.threshold - selectedThreshold) ? point : nearest,
  );

  const formatPercent = (value) =>
    value == null ? "--" : `${(value * 100).toFixed(1)}%`;

  const formatRupees = (value) =>
    value == null ? "--" : `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const getNearestOperatingPoint = (point) => thresholdData?.operating_points.reduce(
    (nearest, candidate) => {
      const candidateDistance = Math.abs(candidate.precision - point.precision) + Math.abs(candidate.recall - point.recall);
      const nearestDistance = Math.abs(nearest.precision - point.precision) + Math.abs(nearest.recall - point.recall);
      return candidateDistance < nearestDistance ? candidate : nearest;
    },
  );

  const curvePath = curve.length
    ? curve.map((point, index) => {
        const x = 24 + point.recall * 126;
        const y = 24 + (1 - point.precision) * 252;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      }).join(" ")
    : "";

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
            <button className="flex items-center gap-2 border-2 border-[#27272f] bg-[#15151c] px-5 py-3 font-body text-sm font-bold text-zinc-300 shadow-[4px_4px_0px_#27272f] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:text-white">
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
          <section className="flex flex-col border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f] xl:col-span-8">
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
                <span className="border-2 border-[#d946ef] px-3 py-2 font-body text-xs font-bold text-[#d946ef]">PR-AUC: {metrics ? metrics.pr_auc.toFixed(3) : "--"}</span>
                <span className="border-2 border-[#22d3ee] px-3 py-2 font-body text-xs font-bold text-[#22d3ee]">ROC-AUC: {metrics ? metrics.roc_auc.toFixed(3) : "--"}</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7">
              <div className="relative flex h-full min-h-120 items-center justify-center border-2 border-dashed border-[#3a3a45] bg-[#0f0f14]">
                <div className="pointer-events-none absolute inset-x-10 top-8 bottom-12 flex flex-col justify-between">
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                  <div className="border-t border-[#27272f]" />
                </div>
                <div className="pointer-events-none absolute left-3 top-8 bottom-12 z-10 flex flex-col justify-between font-body text-xs font-bold text-zinc-300">
                  {["1.00", "0.75", "0.50", "0.25", "0.00"].map((tick) => <span key={tick}>{tick}</span>)}
                </div>
                <svg viewBox="0 0 160 300" preserveAspectRatio="none" className="absolute" style={{ top: "2rem", right: "2.5rem", bottom: "3rem", left: "2.5rem", width: "calc(100% - 5rem)", height: "calc(100% - 5rem)" }} role="img" aria-label="Precision recall curve">
                  <path d="M 24 276 L 150 276 M 24 276 L 24 24" stroke="#3a3a45" strokeWidth="1" fill="none" />
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => <text key={`x-${tick}`} x={24 + tick * 126} y="289" textAnchor="middle" fill="#a1a1aa" fontSize="5" fontWeight="700">{tick.toFixed(2)}</text>)}
                  {curvePath && <path d={curvePath} stroke="#d946ef" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />}
                  {curve.map((point, index) => <circle key={`point-${index}`} cx={24 + point.recall * 126} cy={24 + (1 - point.precision) * 252} r="2.5" fill="#d946ef" stroke="#0f0f14" strokeWidth="0.5" className="cursor-pointer" onMouseEnter={() => setHoveredCurvePoint(point)} onMouseLeave={() => setHoveredCurvePoint(null)} onFocus={() => setHoveredCurvePoint(point)} tabIndex="0" />)}
                </svg>
                {hoveredCurvePoint && <CurveTooltip point={hoveredCurvePoint} operatingPoint={getNearestOperatingPoint(hoveredCurvePoint)} formatPercent={formatPercent} />}
                {!curve.length && <div className="relative z-10 px-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black bg-[#c7ff3d] text-black shadow-[5px_5px_0px_#ffffff]"><SlidersHorizontal size={30} /></div>
                  <h3 className="font-display mt-7 text-lg">{error ? "Unable to load evaluation" : "Loading Evaluation Data"}</h3>
                  <p className="mt-3 max-w-sm font-body text-sm text-zinc-500">{error || "Fetching precision and recall data from the backend."}</p>
                </div>}
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
                <span className="border-2 border-[#22d3ee] px-3 py-2 font-body text-xs font-bold text-[#22d3ee]">Review Threshold: {selectedPoint?.threshold?.toFixed(2) || "--"}</span>
              </div>
              <div className="relative pt-2">
                <input type="range" min="0.1" max="0.95" step="0.05" value={selectedThreshold} onChange={(event) => setSelectedThreshold(Number(event.target.value))} className="w-full accent-[#22d3ee]" aria-label="Decision threshold" />
                <div className="mt-3 flex justify-between font-body text-xs font-bold text-zinc-500"><span>Permissive (0.0)</span><span>Strict (1.0)</span></div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-4">
                <Metric label="CURRENT REVIEW RATE" value={formatPercent(selectedPoint?.review_rate)} detail="Evaluation set" />
                <Metric label="REVIEW CASES" value={selectedPoint?.review_count?.toLocaleString("en-IN") ?? "--"} detail="Evaluation set" />
              </div>
            </section>

            <section className="flex-1 border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f]">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#ff4d4d]">Financial Exposure</p>
              <h2 className="font-display mt-2 text-2xl">Financial Impact</h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-zinc-500">Estimated impact on the evaluation set at the selected threshold.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center font-body text-xs font-bold text-zinc-500"><p>Sent to Review</p><p>Not Sent to Review</p></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <MatrixCell label="TP" count={selectedPoint?.tp} detail="Caught fraud cases" color="text-[#c7ff3d]" border="border-[#c7ff3d]" />
                <MatrixCell label="FN" count={selectedPoint?.fn} detail="Missed fraud cases" color="text-[#ff4d4d]" border="border-[#ff4d4d]" />
                <MatrixCell label="FP" count={selectedPoint?.fp} detail="Legitimate cases reviewed" color="text-[#facc15]" border="border-[#facc15]" />
                <MatrixCell label="TN" count={selectedPoint?.tn} detail="Legitimate cases not reviewed" color="text-[#22d3ee]" border="border-[#22d3ee]" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#27272f] pt-4 font-body text-xs"><div><p className="text-zinc-500">Review cost</p><p className="mt-2 font-bold text-[#facc15]">{formatRupees(selectedPoint?.review_cost)}</p></div><div><p className="text-zinc-500">Missed-fraud cost</p><p className="mt-2 font-bold text-[#ff4d4d]">{formatRupees(selectedPoint?.missed_fraud_cost)}</p></div><div><p className="text-zinc-500">Total impact</p><p className="mt-2 font-bold text-white">{formatRupees(selectedPoint ? selectedPoint.review_cost + selectedPoint.missed_fraud_cost : null)}</p></div></div>
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

function CurveTooltip({ point, operatingPoint, formatPercent }) {
  return <div className="absolute right-6 top-6 z-20 w-52 border-2 border-[#d946ef] bg-[#15151c] p-4 font-body text-xs shadow-[4px_4px_0px_#d946ef]">
    <p className="mb-3 font-bold uppercase tracking-wider text-[#d946ef]">Operating Point</p>
    <div className="space-y-2 text-zinc-300">
      <p className="flex justify-between"><span>Recall</span><strong>{formatPercent(point.recall)}</strong></p>
      <p className="flex justify-between"><span>Precision</span><strong>{formatPercent(point.precision)}</strong></p>
      <p className="flex justify-between"><span>Threshold</span><strong>{operatingPoint?.threshold?.toFixed(4) || "--"}</strong></p>
      <p className="flex justify-between"><span>Review Rate</span><strong>{formatPercent(operatingPoint?.review_rate)}</strong></p>
      <p className="flex justify-between"><span>Review Cases</span><strong>{operatingPoint?.review_count?.toLocaleString("en-IN") || "--"}</strong></p>
      <p className="flex justify-between"><span>TP / FP</span><strong>{operatingPoint ? `${operatingPoint.tp.toLocaleString("en-IN")} / ${operatingPoint.fp.toLocaleString("en-IN")}` : "--"}</strong></p>
      <p className="flex justify-between"><span>FN / TN</span><strong>{operatingPoint ? `${operatingPoint.fn.toLocaleString("en-IN")} / ${operatingPoint.tn.toLocaleString("en-IN")}` : "--"}</strong></p>
    </div>
  </div>;
}

function Metric({ label, value, detail }) {
  return <div className="border-2 border-[#27272f] bg-[#0f0f14] p-5"><p className="font-body text-xs font-bold tracking-wider text-zinc-500">{label}</p><p className="font-display mt-4 text-2xl text-[#d946ef]">{value}</p><p className="mt-2 font-body text-xs text-zinc-500">{detail}</p></div>;
}

function MatrixCell({ label, count, detail, color, border }) {
  const displayCount = count == null ? "--" : count.toLocaleString("en-IN");
  return <div className={`border-2 ${border} bg-[#0f0f14] p-4`}><p className={`font-body text-xs font-bold ${color}`}>{label}</p><p className={`font-display mt-4 text-center text-xl ${color}`}>{displayCount}</p><p className={`mt-3 text-center font-body text-xs font-bold ${color}`}>{detail}</p></div>;
}

function Limitation({ title, color, children }) {
  return <div className="border-2 border-[#27272f] bg-[#0f0f14] p-5"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 ${color}`} /><h3 className="font-body text-sm font-bold">{title}</h3></div><p className="mt-4 font-body text-sm leading-relaxed text-zinc-500">{children}</p></div>;
}

export default ModelPerformance;
