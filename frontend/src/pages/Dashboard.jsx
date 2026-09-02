import {
  AlertTriangle,
  Target,
  BarChart3,
  CreditCard,
  Grid3X3,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";

import { fetchApi } from "../api";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchApi("/dashboard/summary"),
      fetchApi("/transactions?limit=8"),
      fetchApi("/metrics"),
    ])
      .then(([summaryResponse, transactionsResponse, metricsResponse]) => {
        setSummary(summaryResponse);
        setTransactions(transactionsResponse.transactions);
        setMetrics(metricsResponse);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const heatmapBuckets = ["00", "04", "08", "12", "16", "20"];
  const heatmapRows = ["HIGH", "MEDIUM", "LOW"].map((riskLevel) => ({
    riskLevel,
    values: heatmapBuckets.map((_, bucketIndex) => transactions.filter((transaction) => {
      const hour = new Date(transaction.timestamp).getHours();
      return transaction.risk_level === riskLevel && Math.floor(hour / 4) === bucketIndex;
    }).length),
  }));
  const heatmapMax = Math.max(...heatmapRows.flatMap((row) => row.values), 1);
  const watchlistTransactions = transactions.filter(
    (transaction) => ["HIGH", "MEDIUM"].includes(transaction.risk_level),
  );

  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-[#f4f4f5] sm:px-8 lg:px-12">
      
      <div className="mx-auto max-w-[1800px]">

        

        <section className="mb-10 flex flex-col justify-between gap-6 border-b-2 border-[#27272f] pb-8 lg:flex-row lg:items-end">
          
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 bg-[#c7ff3d]" />

              <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#ffffff]">
                Real-time Intelligence
              </p>
            </div>

            <h1 className="font-display text-4xl leading-tight sm:text-5xl">
              Risk Dashboard
            </h1>

            <p className="mt-4 max-w-xl font-body text-base text-zinc-400">
              Monitor transactions, fraud signals, and model performance
              from one central command center.
            </p>
          </div>


          {/* Live Status */}
          <div className="flex items-center gap-4 border-2 border-black bg-[#c7ff3d] px-5 py-4 text-black shadow-[5px_5px_0px_#ffffff]">
            
            <span className="h-3 w-3 animate-pulse rounded-full bg-black" />

            <div>
              <p className="font-body text-xs font-bold uppercase">
                Live Monitoring
              </p>

              <p className="font-body text-xs">
                All systems operational
              </p>
            </div>

          </div>

        </section>


        {/* Top Metrics*/}

        <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* ALERTS */}

          <div className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[9px_9px_0px_#ff4d4d]">
            
            <div className="flex items-start justify-between">
              
              <div>
                <p className="font-body text-sm font-semibold text-zinc-400">
                  Alerts Today
                </p>

                <h2 className="font-display mt-6 text-5xl text-[#ff4d4d]">
                  {summary ? summary.high_risk + summary.medium_risk : "--"}
                </h2>
              </div>

              <div className="border-2 border-black bg-[#ff4d4d] p-3 text-black">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>

            </div>

            <div className="mt-10 border-t-2 border-[#27272f] pt-4">
              <p className="font-body text-sm text-zinc-500">
                High &amp; medium risk alerts today
              </p>
            </div>

          </div>


          {/* PRECISION  */}

          <div className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[9px_9px_0px_#d946ef]">
            
            <div className="flex items-start justify-between">
              
              <div>
                <p className="font-body text-sm font-semibold text-zinc-400">
                  PR AUC
                </p>

                <h2 className="font-display mt-6 text-5xl text-[#d946ef]">
                  {metrics ? metrics.pr_auc.toFixed(3) : "--"}
                </h2>
              </div>

              <div className="border-2 border-black bg-[#d946ef] p-3 text-black">
                <Target size={24} strokeWidth={2.5} />
              </div>

            </div>

            <div className="mt-10 border-t-2 border-[#27272f] pt-4">
              <p className="font-body text-sm text-zinc-500">
                Precision-recall performance
              </p>
            </div>

          </div>


          {/*  RECALL  */}

          <div className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[9px_9px_0px_#22d3ee]">
            
            <div className="flex items-start justify-between">
              
              <div>
                <p className="font-body text-sm font-semibold text-zinc-400">
                  ROC AUC
                </p>

                <h2 className="font-display mt-6 text-5xl text-[#22d3ee]">
                  {metrics ? metrics.roc_auc.toFixed(3) : "--"}
                </h2>
              </div>

              <div className="border-2 border-black bg-[#22d3ee] p-3 text-black">
                <BarChart3 size={24} strokeWidth={2.5} />
              </div>

            </div>

            <div className="mt-10 border-t-2 border-[#27272f] pt-4">
              <p className="font-body text-sm text-zinc-500">
                Ranking quality across thresholds
              </p>
            </div>

          </div>

        </section>


        
        {/* MIDDLE SECTION */}
        

        <section className="mb-10 grid grid-cols-1 gap-7 xl:grid-cols-12">


          {/*  LIVE TRANSACTION FEED  */}

          <div className="border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f] xl:col-span-7">

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[#27272f] px-7 py-6">

              <div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-[#ff4d4d]">
                  Recent Activity
                </p>

                <h2 className="font-display mt-2 text-2xl">
                  Transactions
                </h2>
              </div>

              <div className="flex items-center gap-2 border-2 border-[#ff4d4d] px-3 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d4d]" />

                <span className="font-body text-xs font-bold text-[#ffffff]">
                  API Connected
                </span>
              </div>

            </div>


            <div className="p-7">
              {error && <p className="mb-4 font-body text-sm text-[#ff4d4d]">{error}</p>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] font-body text-sm">
                  <thead><tr className="text-left text-xs uppercase tracking-wider text-zinc-500"><th className="pb-4">Transaction</th><th className="pb-4">Risk</th><th className="pb-4">Score</th><th className="pb-4 text-right">Action</th></tr></thead>
                  <tbody>{transactions.length ? transactions.map((transaction) => <tr key={`${transaction.transaction_id}-${transaction.timestamp}`} className="border-t border-[#27272f]"><td className="py-4 font-semibold">#{transaction.transaction_id}</td><td className={`py-4 font-bold ${transaction.risk_level === "HIGH" ? "text-[#ff4d4d]" : transaction.risk_level === "MEDIUM" ? "text-[#facc15]" : "text-[#c7ff3d]"}`}>{transaction.risk_level}</td><td className="py-4 text-zinc-400">{(transaction.risk_score * 100).toFixed(2)}%</td><td className="py-4 text-right text-zinc-400">{transaction.action}</td></tr>) : <tr><td colSpan="4" className="py-14 text-center text-zinc-500">{error || "Loading transactions..."}</td></tr>}</tbody>
                </table>
              </div>

            </div>

          </div>


          {/*  RISK DISTRIBUTION  */}

          <div className="border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f] xl:col-span-5">

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[#27272f] px-7 py-6">

              <div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-[#22d3ee]">
                  Pattern Analysis
                </p>

                <h2 className="font-display mt-2 text-2xl">
                  Spike Heatmap
                </h2>
              </div>

              <Grid3X3
                size={28}
                className="text-[#22d3ee]"
              />

            </div>


            <div className="p-7">
              <div className="flex min-h-[330px] flex-col justify-center gap-6 border-2 border-dashed border-[#3a3a45] bg-[#0f0f14] p-8">
                <div className="grid grid-cols-[4.5rem_repeat(6,minmax(0,1fr))] gap-2 font-body text-[10px] font-bold text-zinc-500">
                  <span />
                  {heatmapBuckets.map((bucket) => <span key={bucket} className="text-center">{bucket}:00</span>)}
                  {heatmapRows.map((row) => <div key={row.riskLevel} className="contents"><span className={`flex items-center ${row.riskLevel === "HIGH" ? "text-[#ff4d4d]" : row.riskLevel === "MEDIUM" ? "text-[#facc15]" : "text-[#c7ff3d]"}`}>{row.riskLevel}</span>{row.values.map((count, index) => <div key={`${row.riskLevel}-${heatmapBuckets[index]}`} title={`${row.riskLevel} at ${heatmapBuckets[index]}:00: ${count} transaction${count === 1 ? "" : "s"}`} className="flex aspect-square items-center justify-center border border-[#27272f] text-white" style={{ backgroundColor: row.riskLevel === "HIGH" ? `rgba(255, 77, 77, ${count / heatmapMax || 0.04})` : row.riskLevel === "MEDIUM" ? `rgba(250, 204, 21, ${count / heatmapMax || 0.04})` : `rgba(199, 255, 61, ${count / heatmapMax || 0.04})` }}>{count || ""}</div>)}</div>)}
                </div>
                <p className="mt-6 text-center font-body text-xs text-zinc-500">Transactions grouped by risk level and four-hour activity window</p>
              </div>

            </div>

          </div>

        </section>


        {/* TOP MERCHANTS TABLE */}

        <section className="border-2 border-[#27272f] bg-[#15151c] shadow-[6px_6px_0px_#27272f]">

          {/* Header */}
          <div className="flex flex-col justify-between gap-5 border-b-2 border-[#27272f] px-7 py-6 sm:flex-row sm:items-center">

            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-[#c7ff3d]">
                Risk Watchlist
              </p>

              <h2 className="font-display mt-2 text-2xl">
                Top Merchants Under Watch
              </h2>
            </div>


            <button className="flex items-center justify-center gap-2 border-2 border-black bg-[#c7ff3d] px-5 py-3 font-body text-sm font-bold text-black shadow-[4px_4px_0px_#ffffff] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#ffffff]">
              View All
              <ArrowUpRight size={18} />
            </button>

          </div>


          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead className="border-b-2 border-[#27272f] bg-[#101015]">

                <tr>
                  <th className="px-7 py-5 text-left font-body text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Merchant ID
                  </th>

                  <th className="px-7 py-5 text-left font-body text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Category
                  </th>

                  <th className="px-7 py-5 text-right font-body text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Volume (24H)
                  </th>

                  <th className="px-7 py-5 text-right font-body text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Risk Score
                  </th>

                  <th className="px-7 py-5 text-right font-body text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Action
                  </th>
                </tr>

              </thead>


              <tbody>
                {watchlistTransactions.slice(0, 5).map((transaction) => <tr key={`watch-${transaction.transaction_id}-${transaction.timestamp}`} className="transition-colors hover:bg-[#1c1c24]"><td className="px-7 py-5 font-body text-sm font-semibold">{transaction.transaction_id}</td><td className="px-7 py-5 font-body text-sm text-zinc-500">{transaction.risk_level}</td><td className="px-7 py-5 text-right font-body text-sm text-zinc-500">{(transaction.risk_score * 100).toFixed(2)}%</td><td className="px-7 py-5 text-right font-body text-sm text-zinc-500">{transaction.action}</td><td className="px-7 py-5 text-right"><span className="border-2 border-[#22d3ee] px-4 py-2 font-body text-xs font-bold text-[#22d3ee]">{transaction.reasons?.length || 0} signals</span></td></tr>)}
                {!watchlistTransactions.length && <tr><td colSpan="5" className="px-7 py-12 text-center"><p className="font-display text-lg">No merchants currently under watch</p><p className="mt-3 font-body text-sm text-zinc-500">Merchants will appear here when repeated medium/high-risk activity is detected.</p></td></tr>}
              </tbody>

            </table>

          </div>

        </section>


        

        <div className="mt-10 flex flex-col justify-between gap-3 border-t-2 border-[#27272f] pt-6 sm:flex-row sm:items-center">

        

          

        </div>

      </div>
    </main>
  );
}

export default Dashboard;