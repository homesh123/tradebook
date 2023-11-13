import React from "react";
import Dashboard from "./components/Dashboard";

const App = () => {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
      <Dashboard />
      </div>
    </div>
  );
};

export default App;