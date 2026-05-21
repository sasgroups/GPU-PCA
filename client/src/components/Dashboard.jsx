// Dashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ArchiveBoxIcon,
  UserPlusIcon,
  ViewColumnsIcon,
  CpuChipIcon,
  ChartBarSquareIcon,
  IdentificationIcon,
  PresentationChartBarIcon,
  ChartPieIcon,
  Bars3BottomLeftIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ✅ Import pages
import ViewData from "./ViewData";
import Dashbordcontent from "../pages/Dashbordcontent";
import AddOperator from "../pages/AddOperator";
import GateManagement from "../pages/GateManagement";
import GPUUsageTable from "../pages/GPUUsageTable";
import PCAUsageTable from "../pages/PCAUsageTable";
import AirlineUsagePage from "../pages/AirlineUsagePage";
import TotalAirlineBarCodeData from "../pages/TotalAirlineBarCodeData";
import UsageDetailsOfAirlines from "../pages/UsageDetailsOfAirlines";
import Simpledata from "../pages/Simpledata";
import SerialNumberRows from "../pages/SerialNumberRows";
import OperatorNameData from "../pages/OperatorNameData";

// ✅ Import Header & Footer
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const menuSections = [
    {
      title: "Main",
      items: [
        { key: "dashboard", label: "Dashboard", icon: HomeIcon, component: <Dashbordcontent /> },
        { key: "records", label: "Records", icon: ArchiveBoxIcon, component: <ViewData /> },
      ],
    },
    {
      title: "Management",
      items: [
        { key: "add-operater", label: "Add Operator", icon: UserPlusIcon, component: <AddOperator /> },
        { key: "gate", label: "Gate Management", icon: ViewColumnsIcon, component: <GateManagement /> },
      ],
    },
    {
      title: "Reports",
      items: [
        { key: "GPUUsageTable", label: "GPU Usage Report", icon: CpuChipIcon, component: <GPUUsageTable /> },
        { key: "PCAUsageTable", label: "PCA Usage Report", icon: PresentationChartBarIcon, component: <PCAUsageTable /> },
      ],
    },
    {
      title: "Airlines",
      items: [
        { key: "AirlineUsagePage", label: "Airline GPU Usage", icon: IdentificationIcon, component: <AirlineUsagePage /> },
        { key: "TotalAirlineBarCodeData", label: "Airline Usage Bar Chart", icon: ChartBarSquareIcon, component: <TotalAirlineBarCodeData /> },
        { key: "UsageDetailsOfAirlines", label: "Usage Details Of Airlines", icon: ChartPieIcon, component: <UsageDetailsOfAirlines /> },
      ],
    },
    {
      title: "Other Data",
      items: [
        { key: "Simpledata", label: "Simple Data", icon: ClipboardDocumentListIcon, component: <Simpledata /> },
        { key: "SerialNumberRows", label: "Serial Number Rows", icon: Bars3BottomLeftIcon, component: <SerialNumberRows /> },
        { key: "operatorNameData", label: "Operator Name Data", icon: UserGroupIcon, component: <OperatorNameData /> },
      ],
    },
  ];

  const renderContent = () => {
    for (const section of menuSections) {
      const match = section.items.find((item) => item.key === activePage);
      if (match) return match.component;
    }
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); // ✅ smoother navigation instead of reload
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative md:flex-shrink-0 z-30 bg-white shadow-lg p-5 w-64 h-full flex flex-col 
        transition-transform duration-300 ease-in-out transform md:translate-x-0 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        overflow-y-auto`}
      >
        {/* Sidebar Title */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <h1 className="text-2xl font-bold text-blue-600">🛩 BMESync</h1>
          <button className="text-gray-700" onClick={() => setIsSidebarOpen(false)}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <h1 className="hidden md:block text-2xl font-bold text-blue-600 mb-6">🛩 BMESync</h1>

        {/* Navigation */}
        <nav className="space-y-6 flex-1">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{section.title}</p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActivePage(item.key);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition 
                      ${
                        activePage === item.key
                          ? "bg-blue-100 text-blue-600 font-semibold"
                          : "hover:bg-blue-50"
                      }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-6 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg w-full text-left text-red-600 hover:bg-red-50 transition"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* ✅ Sticky Header */}
        <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Page Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="min-w-0">{renderContent()}</div>
        </div>

        {/* ✅ Full-Width Footer */}
        <Footer />
      </div>
    </div>
  );
}
