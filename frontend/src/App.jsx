import { useState } from "react";

import Sidebar from "./components/sidebar";
import Dashboard from "./pages/dashboard";
import AlertQueue from "./pages/alert";
import ModelPerformance from "./pages/modelperformance";
import Settings from "./pages/settings";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="flex min-h-screen bg-[#0b0b0f]">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="min-w-0 flex-1">

        {activePage === "Dashboard" && <Dashboard />}

        {activePage === "Alert Queue" && <AlertQueue />}

        {activePage === "Model Performance" && <ModelPerformance/>
          
        }

        {activePage === "Settings" && <Settings />}

      </div>

    </div>
  );
}

export default App;