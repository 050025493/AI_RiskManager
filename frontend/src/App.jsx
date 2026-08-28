import { useState } from "react";

import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import ModelPerformance from "./pages/modelperformance";

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

        {/* You will connect these pages later */}

        {activePage === "Alert Queue" && (
          <div className="p-10 text-white">
            Alert Queue Page
          </div>
        )}

        {activePage === "Model Performance" && <ModelPerformance/>
          
        }

        {activePage === "Settings" && (
          <div className="p-10 text-white">
            Settings Page
          </div>
        )}

      </div>

    </div>
  );
}

export default App;