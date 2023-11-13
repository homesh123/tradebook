import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
import { Bar } from 'react-chartjs-2';
  
ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
);

export const options = {
responsive: true,
plugins: {
    title: {
    display: true,
    text: 'Chart.js Bar Chart',
    },
},
};

const TradeHistory = () => {
  const data = {
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    datasets: [
      {
        label: "Trade Profile",
        data: [10, 20, 30, 40, 50],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
      },
      {
        label: "Loss in Percent",
        data: [-10, -20, -30, -40, -50],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
      },
    ],
  };

  return (
    <div>
      <Bar type="bar" data={data} />
    </div>
  );
};

export default TradeHistory;