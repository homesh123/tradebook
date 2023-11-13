import React from "react";

const Navigation = () => {
  return (
    <nav className="w-64 h-screen bg-gray-800 flex flex-col">
    <ul className="mt-10">
      <li>
        <a href="/trade-history" className="text-white p-2">Trade History</a>
      </li>
      <li>
        <a href="/user-settings" className="text-white p-2">User Settings</a>
      </li>
    </ul>
  </nav>
  );
};

export default Navigation;