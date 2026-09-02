import { AlertTriangle, ChevronDown, Clock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchApi } from "../api";

const riskStyles = {
  HIGH: "border-[#ff4d4d] text-[#ff4d4d]",
  MEDIUM: "border-[#facc15] text-[#facc15]",
};

function AlertQueue() {
  const [alerts, setAlerts] = useState([]);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [error, setError] = useState("");
  const [updatingAlert, setUpdatingAlert] = useState(null);

  useEffect(() => {
    fetchApi("/alerts?limit=100")
      .then((response) => setAlerts(response.alerts))
      .catch((requestError) => setError(requestError.message));
  }, []);

  const highRiskCount = alerts.filter((alert) => alert.risk_level === "HIGH").length;
  const mediumRiskCount = alerts.filter((alert) => alert.risk_level === "MEDIUM").length;
  const pendingReviewCount = alerts.filter((alert) => (alert.review_status || "PENDING") === "PENDING").length;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? "--" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatAmount = (amount) => amount == null ? "--" : `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const updateReview = (alert, status, decision) => {
    setUpdatingAlert(alert.transaction_id);
    fetchApi(`/alerts/${encodeURIComponent(alert.transaction_id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, decision }),
    })
      .then((updatedAlert) => setAlerts((currentAlerts) => currentAlerts.map((item) => item.timestamp === alert.timestamp ? updatedAlert : item)))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setUpdatingAlert(null));
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-[#f4f4f5] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1800px]">
        <section className="mb-10 flex flex-col justify-between gap-6 border-b-2 border-[#27272f] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 bg-[#ff4d4d]" />
              <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-white">Human Review Operations</p>
            </div>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Alert Queue</h1>
            <p className="mt-4 max-w-xl font-body text-base text-zinc-400">Investigate transactions that require human attention after risk evaluation.</p>
          </div>
          <div className="flex items-center gap-3 border-2 border-[#27272f] bg-[#15151c] px-5 py-4 shadow-[4px_4px_0px_#27272f]">
            <ShieldAlert size={22} className="text-[#ff4d4d]" />
            <div><p className="font-body text-xs font-bold uppercase text-[#ff4d4d]">Review Status</p><p className="font-body text-xs text-zinc-400">{alerts.length ? "Active alerts require attention" : "No active alerts"}</p></div>
          </div>
        </section>

        <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="High Risk Alerts" value={highRiskCount} color="text-[#ff4d4d]" icon={<AlertTriangle size={23} />} />
          <SummaryCard label="Medium Risk Alerts" value={mediumRiskCount} color="text-[#facc15]" icon={<AlertTriangle size={23} />} />
          <SummaryCard label="Total Alerts" value={alerts.length} color="text-[#d946ef]" icon={<ShieldAlert size={23} />} />
          <SummaryCard label="Pending Review" value={pendingReviewCount} color="text-[#22d3ee]" icon={<Clock size={23} />} />
        </section>

        <section className="border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f]">
          <div className="flex items-center justify-between border-b-2 border-[#27272f] px-7 py-6">
            <div><p className="font-body text-xs font-bold uppercase tracking-widest text-[#ff4d4d]">Investigation Queue</p><h2 className="font-display mt-2 text-2xl">Active Risk Alerts</h2></div>
            <span className="font-body text-xs font-bold text-zinc-500">{alerts.length} result{alerts.length === 1 ? "" : "s"}</span>
          </div>

          {error ? <div className="p-12 text-center"><p className="font-display text-lg text-[#ff4d4d]">Unable to load alerts</p><p className="mt-3 font-body text-base text-zinc-500">{error}</p></div> : alerts.length === 0 ? <div className="p-16 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black bg-[#c7ff3d] text-black shadow-[5px_5px_0px_#ffffff]"><ShieldAlert size={30} /></div><h3 className="font-display mt-7 text-xl">No active risk alerts</h3><p className="mx-auto mt-3 max-w-md font-body text-base text-zinc-500">All recently evaluated transactions are currently below the review threshold.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-190 font-body text-base"><thead className="border-b-2 border-[#27272f] bg-[#101015]"><tr><th className="px-7 py-5 text-left text-sm uppercase tracking-wider text-zinc-500">Transaction</th><th className="px-7 py-5 text-left text-sm uppercase tracking-wider text-zinc-500">Risk</th><th className="px-7 py-5 text-right text-sm uppercase tracking-wider text-zinc-500">Score</th><th className="px-7 py-5 text-left text-sm uppercase tracking-wider text-zinc-500">Action</th><th className="px-7 py-5 text-left text-sm uppercase tracking-wider text-zinc-500">Time</th><th className="px-7 py-5 text-right text-sm uppercase tracking-wider text-zinc-500">Details</th></tr></thead><tbody>{alerts.map((alert) => <AlertRow key={`${alert.transaction_id}-${alert.timestamp}`} alert={alert} expanded={expandedAlert === alert.timestamp} updating={updatingAlert === alert.transaction_id} onToggle={() => setExpandedAlert(expandedAlert === alert.timestamp ? null : alert.timestamp)} onReview={(status, decision) => updateReview(alert, status, decision)} formatTime={formatTime} formatAmount={formatAmount} />)}</tbody></table></div>}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return <div className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f]"><div className="flex items-start justify-between"><div><p className="font-body text-base font-semibold text-zinc-400">{label}</p><p className={`font-display mt-6 text-5xl ${color}`}>{value}</p></div><div className={`border-2 border-black bg-[#0f0f14] p-3 ${color}`}>{icon}</div></div></div>;
}

function AlertRow({ alert, expanded, updating, onToggle, onReview, formatTime, formatAmount }) {
  const riskClass = riskStyles[alert.risk_level] || "border-zinc-500 text-zinc-400";
  return <>
    <tr className="cursor-pointer border-b border-[#27272f] transition-colors hover:bg-[#1c1c24]" onClick={onToggle}>
      <td className="px-7 py-7 font-semibold">#{alert.transaction_id}</td>
      <td className="px-7 py-7"><span className={`border-2 px-3 py-1 text-sm font-bold ${riskClass}`}>{alert.risk_level}</span></td>
      <td className="px-7 py-7 text-right text-zinc-300">{(alert.risk_score * 100).toFixed(2)}%</td>
      <td className="px-7 py-7 font-bold text-[#ff4d4d]">{alert.action}</td>
      <td className="px-7 py-7 text-zinc-500">{formatTime(alert.timestamp)}</td>
      <td className="px-7 py-7 text-right"><ChevronDown size={21} className={`ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} /></td>
    </tr>
    {expanded && <tr className="border-b-2 border-[#27272f] bg-[#101015]"><td colSpan="6" className="px-7 py-8"><div className="max-w-4xl"><p className="font-body text-sm font-bold uppercase tracking-widest text-[#ff4d4d]">Transaction #{alert.transaction_id}</p><div className="my-5 grid grid-cols-1 gap-5 border-y-2 border-[#27272f] py-5 sm:grid-cols-3 lg:grid-cols-5"><Detail label="Risk Level" value={alert.risk_level} color={riskClass.split(" ")[1]} /><Detail label="Risk Score" value={`${(alert.risk_score * 100).toFixed(2)}%`} /><Detail label="Action" value={alert.action} color="text-[#ff4d4d]" /><Detail label="Review Status" value={alert.review_status || "PENDING"} color="text-[#22d3ee]" /><Detail label="Amount / Time" value={<>{formatAmount(alert.amount)}<br /><span className="font-body text-xs text-zinc-500">{formatTime(alert.timestamp)}</span></>} /></div><p className="font-body text-sm font-bold uppercase tracking-widest text-[#ff4d4d]">Why was this flagged?</p><div className="mt-6 space-y-5">{alert.reasons?.length ? alert.reasons.map((reason) => <div key={`${reason.feature}-${reason.contribution}`} className="flex gap-4"><span className="mt-2 h-3 w-3 shrink-0 bg-[#c7ff3d]" /><div><p className="font-body text-base font-semibold">{reason.label}</p><p className="mt-1 font-body text-sm text-zinc-400">{reason.direction}</p></div></div>) : <p className="font-body text-base text-zinc-500">No explanation details were recorded.</p>}</div><div className="mt-8 border-t-2 border-[#27272f] pt-6"><p className="font-body text-sm font-bold uppercase tracking-widest text-[#facc15]">Review Outcome</p>{alert.review_status === "REVIEWED" && <p className="mt-3 font-body text-sm text-zinc-400">Reviewed At: {formatTime(alert.reviewed_at)}<br />Reviewer Decision: {alert.reviewer_decision || "--"}</p>}<div className="mt-5 flex flex-wrap gap-3"><button disabled={updating} onClick={(event) => { event.stopPropagation(); onReview("REVIEWED", "CLEARED"); }} className="border-2 border-[#c7ff3d] px-5 py-3 font-body text-sm font-bold text-[#c7ff3d] transition hover:bg-[#c7ff3d] hover:text-black disabled:opacity-50">✓ Clear</button><button disabled={updating} onClick={(event) => { event.stopPropagation(); onReview("ESCALATED", "ESCALATED"); }} className="border-2 border-[#ff4d4d] px-5 py-3 font-body text-sm font-bold text-[#ff4d4d] transition hover:bg-[#ff4d4d] hover:text-black disabled:opacity-50">⚠ Escalate</button><button disabled={updating || alert.review_status === "REVIEWED"} onClick={(event) => { event.stopPropagation(); onReview("REVIEWED", alert.reviewer_decision || "CLEARED"); }} className="border-2 border-[#22d3ee] px-5 py-3 font-body text-sm font-bold text-[#22d3ee] transition hover:bg-[#22d3ee] hover:text-black disabled:opacity-50">{updating ? "Saving..." : "Mark as Reviewed"}</button></div></div></div></td></tr>}
  </>;
}

function Detail({ label, value, color = "text-white" }) {
  return <div><p className="font-body text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p><p className={`mt-2 font-display text-lg ${color}`}>{value}</p></div>;
}

export default AlertQueue;
