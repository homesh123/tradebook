import React from "react";
import Navigation from "./Navigation";
import TradeHistory from "./TradeHistory";
import RecentTrades from "./RecentTrades";

const Dashboard = () => {
  return (
    <div>
      <Navigation />
      <TradeHistory />
      <RecentTrades />
    </div>
  );
};

export default Dashboard;