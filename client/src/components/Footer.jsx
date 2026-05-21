// src/components/Footer.jsx
import React from "react";
import { Mail, Copyright } from "lucide-react";

const APP_VERSION = process.env.REACT_APP_VERSION || "dev";
const COMPANY_NAME = "Swati Airport Support Services Pvt Ltd";
const SUPPORT_EMAIL = "support@sasgroups.net";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 mt-auto shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        
        {/* Left side */}
        <p className="text-sm flex items-center gap-1">
          <Copyright size={14} className="text-gray-200" />
          {new Date().getFullYear()}{" "}
          <span className="font-semibold ml-1">{COMPANY_NAME}</span>
        </p>

        {/* Center */}
        <p className="text-sm bg-white/10 px-3 py-1 rounded-full shadow-sm">
          Version <span className="font-semibold">{APP_VERSION}</span>
        </p>

        {/* Right side */}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-1 text-sm text-gray-200 hover:text-white hover:underline transition"
        >
          <Mail size={14} className="text-gray-200" />
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
