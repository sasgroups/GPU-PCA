// src/components/Header.jsx
import React from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Header({ isSidebarOpen, setIsSidebarOpen, user = "Admin" }) {
  const today = new Date().toLocaleDateString();

  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-[#00c49f]">
      {/* Hamburger / Close button (mobile only) */}
      <button
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        className="md:hidden text-gray-700"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Title */}
      <h1 className="text-xl md:text-2xl font-bold text-blue-600">
        🛩 BMESync
      </h1>

      {/* User Info */}
      <div className="text-right">
        <p className="text-sm text-gray-700">Welcome back, {user} 👋</p>
        <p className="text-xs text-gray-500">{today}</p>
      </div>
    </header>
  );
}
