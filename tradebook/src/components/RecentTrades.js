import React from "react";

const RecentTrades = () => {
  const trades = [
    {
      date: "2023-11-13",
      pair: "BTC/USDT",
      side: "long",
      entry: 10000,
      exit: 10500,
      profit: 500,
    },
    {
      date: "2023-11-12",
      pair: "ETH/USDT",
      side: "short",
      entry: 1500,
      exit: 1450,
      profit: 50,
    },
  ];

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Pair</th>
            <th>Side</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.date}</td>
              <td>{trade.pair}</td>
              <td>{trade.side}</td>
              <td>{trade.entry}</td>
              <td>{trade.exit}</td>
              <td>{trade.profit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
 }

  export default RecentTrades;