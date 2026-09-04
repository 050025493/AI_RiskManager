import { FlaskConical, LoaderCircle, Play, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchApi } from "../api";

const riskColors = {
  HIGH: "text-[#ff4d4d] border-[#ff4d4d]",
  MEDIUM: "text-[#facc15] border-[#facc15]",
  LOW: "text-[#c7ff3d] border-[#c7ff3d]",
};

function TestTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApi("/test-transactions?limit=20")
      .then((response) => setTransactions(response.transactions))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const analyzeBatch = async () => {
    setRunning(true);
    setError("");
    try {
      const response = await fetchApi("/test-transactions/analyze?offset=0&limit=25", {
        method: "POST",
      });
      const results = new Map(response.results.map((result) => [result.transaction_id, result]));
      setTransactions((current) => current.map((transaction) => ({
        ...transaction,
        result: results.get(String(transaction.transaction_id)) || transaction.result,
      })));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-[#f4f4f5] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1800px]">
        <section className="mb-10 flex flex-col justify-between gap-6 border-b-2 border-[#27272f] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 bg-[#22d3ee]" />
              <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-white">IEEE-CIS Evaluation Lab</p>
            </div>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Test Transactions</h1>
            <p className="mt-4 max-w-2xl font-body text-base text-zinc-400">Submit real merged IEEE-CIS test records to the RiskEngine API. Scores, explanations, risk bands, and audit history are produced by the backend.</p>
          </div>
          <div className="flex items-center gap-3 border-2 border-[#22d3ee] bg-[#101a1e] px-5 py-4 shadow-[4px_4px_0px_#22d3ee]">
            <ShieldCheck size={22} className="text-[#22d3ee]" />
            <div><p className="font-body text-xs font-bold uppercase text-[#22d3ee]">Backend Controlled</p><p className="font-body text-xs text-zinc-400">Model scoring is server-side</p></div>
          </div>
        </section>

        {error && <div className="mb-6 border-2 border-[#ff4d4d] bg-[#211316] p-4 font-body text-sm text-[#ff4d4d]">{error}</div>}
        {loading ? <div className="flex items-center gap-3 border-2 border-[#27272f] bg-[#15151c] p-8 font-body text-zinc-400"><LoaderCircle className="animate-spin" size={20} /> Loading IEEE-CIS test transactions...</div> : (
          <section className="border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f]">
            <div className="flex items-center justify-between gap-4 border-b-2 border-[#27272f] px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3"><FlaskConical size={21} className="text-[#22d3ee]" /><div><p className="font-body text-xs font-bold uppercase tracking-widest text-[#22d3ee]">Test Dataset</p><h2 className="font-display mt-2 text-2xl">Ready for analysis</h2></div></div>
              <div className="flex items-center gap-4"><span className="font-body text-xs font-bold text-zinc-500">{transactions.length} loaded</span><button type="button" disabled={running} onClick={analyzeBatch} className="inline-flex items-center gap-2 border-2 border-black bg-[#c7ff3d] px-4 py-2 font-body text-sm font-bold text-black shadow-[3px_3px_0px_#ffffff] disabled:cursor-wait disabled:opacity-60">{running ? <LoaderCircle className="animate-spin" size={16} /> : <Play size={16} />} {running ? "Analyzing batch" : "Analyze batch"}</button></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 font-body text-sm">
                <thead className="border-b-2 border-[#27272f] bg-[#101015]"><tr><th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-zinc-500 sm:px-7">Transaction</th><th className="px-5 py-4 text-right text-xs uppercase tracking-wider text-zinc-500 sm:px-7">Amount</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-zinc-500 sm:px-7">Identity</th><th className="px-5 py-4 text-left text-xs uppercase tracking-wider text-zinc-500 sm:px-7">AI Result</th><th className="px-5 py-4 text-right text-xs uppercase tracking-wider text-zinc-500 sm:px-7">Action</th></tr></thead>
                <tbody>{transactions.map((item) => <TestTransactionRow key={item.transaction_id} item={item} />)}</tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TestTransactionRow({ item }) {
  const result = item.result;
  const riskClass = riskColors[result?.risk_level] || "text-zinc-500 border-[#27272f]";
  return <tr className="border-b border-[#27272f] last:border-b-0 hover:bg-[#1c1c24]">
    <td className="px-5 py-5 font-semibold sm:px-7">#{item.transaction_id}</td>
    <td className="px-5 py-5 text-right text-zinc-300 sm:px-7">{item.amount == null ? "--" : `₹${Number(item.amount).toFixed(2)}`}</td>
    <td className="px-5 py-5 sm:px-7"><span className={item.has_identity ? "text-[#c7ff3d]" : "text-zinc-500"}>{item.has_identity ? "Available" : "Missing"}</span></td>
    <td className="px-5 py-5 sm:px-7">{result ? <span className={`border-2 px-3 py-1 font-bold ${riskClass}`}>{result.risk_level} · {(result.risk_score * 100).toFixed(1)}%</span> : <span className="text-zinc-500">Not analyzed</span>}</td>
    <td className="px-5 py-5 text-right text-zinc-500 sm:px-7">Backend batch</td>
  </tr>;
}

export default TestTransactions;
