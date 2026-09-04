import {
  LayoutDashboard,
  BellRing,
  ChartNoAxesCombined,
  Menu,
  X,
  Settings,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";

function Sidebar({ activePage, setActivePage }) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Alert Queue",
      icon: BellRing,
    },
    {
      name: "Model Performance",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Settings",
      icon: Settings,
    },
    {
      name: "Test Transactions",
      icon: FlaskConical,
    },
  ];

  const navigateTo = (page) => {
    setActivePage(page);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b-2 border-[#27272f] bg-[#0b0b0f] px-4 text-white md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#46ef46] text-black shadow-[3px_3px_0px_#ffffff]">
            <ShieldCheck size={19} strokeWidth={2.5} />
          </div>
          <span className="font-display text-base">RiskEngine</span>
        </div>
        <button
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center border-2 border-[#27272f] bg-[#15151c] text-white"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && <button type="button" aria-label="Close navigation" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/70 md:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r-2 border-[#27272f] bg-[#0b0b0f] text-white transition-transform duration-200 md:sticky md:top-0 md:min-h-screen md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      
      {/* ================= LOGO ================= */}
      <div className="border-b-2 border-[#27272f] px-6 py-7">
        <div className="flex items-center gap-3">
          
          <div className="flex h-11 w-11 items-center justify-center border-2 border-black bg-[#46ef46] shadow-[4px_4px_0px_#ffffff]">
            <ShieldCheck size={23} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="font-display text-lg leading-none">
              RiskEngine
            </h1>

            <p className="mt-1 font-body text-xs text-zinc-400">
              Vigilance AI
            </p>
          </div>

        </div>
      </div>


      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-4 py-6">
        
        <p className="mb-4 px-2 font-body text-xs font-bold uppercase tracking-widest text-zinc-500">
          Navigation
        </p>

        <div className="space-y-6">
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => navigateTo(item.name)}
                className={`flex w-full items-center gap-3 border-2 px-4 py-3.5 text-left font-body text-sm font-semibold transition-all duration-200
                  
                  ${
                    isActive
                      ? "border-black bg-[#c7ff3d] text-black shadow-[4px_4px_0px_#ffffff]"
                      : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-[#16161d] hover:text-white"
                  }
                `}
              >
                <Icon size={19} strokeWidth={2.2} />

                <span>
                  {item.name}
                </span>

                {/* Alert notification */}
                {item.name === "Alert Queue" && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#c7ff3d]" />
                )}
              </button>
            );
          })}

        </div>
      </nav>


      {/* ================= BOTTOM STATUS ================= */}
      <div className="border-t-2 border-[#27272f] p-5">
        
        <div className="border-2 border-[#27272f] bg-[#15151c] p-4 shadow-[3px_3px_0px_#27272f]">
          
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c7ff3d]" />

            <p className="font-body text-xs font-bold text-[#c7ff3d]">
              System Online
            </p>
          </div>

          <p className="mt-2 font-body text-xs text-zinc-500">
            Fraud detection active
          </p>

        </div>

        <p className="mt-5 text-center font-body text-[10px] text-zinc-600">
          RISKENGINE • V1.0
        </p>

      </div>

      </aside>
    </>
  );
}

export default Sidebar;