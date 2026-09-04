import { useEffect, useState } from "react";

import Sidebar from "./components/sidebar";
import Dashboard from "./pages/dashboard";
import AlertQueue from "./pages/alert";
import ModelPerformance from "./pages/modelperformance";
import Settings from "./pages/settings";
import TestTransactions from "./pages/testtransactions";

function App() {
  const [activePage, setActivePage] = useState(() => (
    new URLSearchParams(window.location.search).get("page") === "alerts"
      ? "Alert Queue"
      : "Dashboard"
  ));

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "open-alert-queue") {
        setActivePage("Alert Queue");
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0b0b0f]">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="min-w-0 flex-1 pt-16 md:pt-0">

        {activePage === "Dashboard" && <Dashboard />}

        {activePage === "Alert Queue" && <AlertQueue />}

        {activePage === "Model Performance" && <ModelPerformance/>
          
        }

        {activePage === "Settings" && <Settings />}

        {activePage === "Test Transactions" && <TestTransactions />}

      </div>

    </div>
  );
}

export default App;