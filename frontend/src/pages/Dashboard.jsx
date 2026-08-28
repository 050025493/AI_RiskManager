import {
  AlertTriangle,
  Target,
  BarChart3,
  CreditCard,
  Grid3X3,
  ArrowUpRight,
  Activity,
} from "lucide-react";

function Dashboard() {
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
                  --
                </h2>
              </div>

              <div className="border-2 border-black bg-[#ff4d4d] p-3 text-black">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>

            </div>

            <div className="mt-10 border-t-2 border-[#27272f] pt-4">
              <p className="font-body text-sm text-zinc-500">
                Fraud alerts detected today
              </p>
            </div>

          </div>


          {/* PRECISION  */}

          <div className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[9px_9px_0px_#d946ef]">
            
            <div className="flex items-start justify-between">
              
              <div>
                <p className="font-body text-sm font-semibold text-zinc-400">
                  Model Precision
                </p>

                <h2 className="font-display mt-6 text-5xl text-[#d946ef]">
                  --
                </h2>
              </div>

              <div className="border-2 border-black bg-[#d946ef] p-3 text-black">
                <Target size={24} strokeWidth={2.5} />
              </div>

            </div>

            <div className="mt-10 border-t-2 border-[#27272f] pt-4">
              <p className="font-body text-sm text-zinc-500">
                Accuracy of fraud predictions
              </p>
            </div>

          </div>


          {/*  RECALL  */}

          <div className="border-2 border-[#27272f] bg-[#15151c] p-6 shadow-[6px_6px_0px_#27272f] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[9px_9px_0px_#22d3ee]">
            
            <div className="flex items-start justify-between">
              
              <div>
                <p className="font-body text-sm font-semibold text-zinc-400">
                  Model Recall
                </p>

                <h2 className="font-display mt-6 text-5xl text-[#22d3ee]">
                  --
                </h2>
              </div>

              <div className="border-2 border-black bg-[#22d3ee] p-3 text-black">
                <BarChart3 size={24} strokeWidth={2.5} />
              </div>

            </div>

            <div className="mt-10 border-t-2 border-[#27272f] pt-4">
              <p className="font-body text-sm text-zinc-500">
                Fraud transactions successfully found
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
                  Live Feed
                </p>

                <h2 className="font-display mt-2 text-2xl">
                  Transactions
                </h2>
              </div>

              <div className="flex items-center gap-2 border-2 border-[#ff4d4d] px-3 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d4d]" />

                <span className="font-body text-xs font-bold text-[#ffffff]">
                  Streaming
                </span>
              </div>

            </div>


            {/* Backend Placeholder */}
            <div className="p-7">

              <div className="flex min-h-[330px] items-center justify-center border-2 border-dashed border-[#3a3a45] bg-[#0f0f14]">

                <div className="px-6 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black bg-[#c7ff3d] text-black shadow-[5px_5px_0px_#ffffff]">
                    <CreditCard size={30} />
                  </div>

                  <h3 className="font-display mt-7 text-lg">
                    Waiting for Transactions
                  </h3>

                  <p className="mt-3 font-body text-sm text-zinc-500">
                    Live transaction data from the backend will
                    appear here.
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/*  SPIKE HEATMAP  */}

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


            {/* Backend Graph Placeholder */}
            <div className="p-7">

              <div className="flex min-h-[330px] items-center justify-center border-2 border-dashed border-[#3a3a45] bg-[#0f0f14]">

                <div className="px-6 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black bg-[#c7ff3d] text-black shadow-[5px_5px_0px_#ffffff]">
                    <Grid3X3 size={30} />
                  </div>

                  <h3 className="font-display mt-7 text-lg">
                    Heatmap Analysis
                  </h3>

                  <p className="mt-3 font-body text-sm text-zinc-500">
                    Transaction spike patterns will appear here
                    when backend data is connected.
                  </p>

                </div>

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


              {/* Backend data will be mapped here */}
              <tbody>

                <tr className="transition-colors hover:bg-[#1c1c24]">

                  <td className="px-7 py-9 font-body text-sm font-semibold">
                    Waiting for backend data...
                  </td>

                  <td className="px-7 py-9 font-body text-sm text-zinc-500">
                    --
                  </td>

                  <td className="px-7 py-9 text-right font-body text-sm text-zinc-500">
                    --
                  </td>

                  <td className="px-7 py-9 text-right font-body text-sm text-zinc-500">
                    --
                  </td>

                  <td className="px-7 py-9 text-right">

                    <button className="border-2 border-[#22d3ee] px-4 py-2 font-body text-xs font-bold text-[#22d3ee] transition hover:bg-[#22d3ee] hover:text-black">
                      History
                    </button>

                  </td>

                </tr>

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