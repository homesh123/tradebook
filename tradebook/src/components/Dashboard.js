import React from "react";
import Navigation from "./Navigation";
import TradeHistory from "./TradeHistory";
import RecentTrades from "./RecentTrades";

const Dashboard = () => {
  return (
    <div className="flex">
      <div className="flex flex-col">
      <Navigation />
      </div>
      <div className="flex-1 p-4">
        <TradeHistory />
        <RecentTrades />
      </div>
    </div>
  );
};

export default Dashboard;