import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BASE_URL } from "../config";

function isValidUsage(value) {
  if (!value) return false;
  const trimmed = value.trim().toUpperCase();
  return trimmed !== "" && trimmed !== "00:00" && trimmed !== "NA" && trimmed !== "--";
}

export default function AirlineUsageBarChart() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/api/records`);
        setRecords(res.data || []);
      } catch (err) {
        console.error("Error fetching records", err);
        setError("Failed to load flight records.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // ----------------- Filtering -----------------
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const dateObj = rec.date ? new Date(rec.date) : null;
      if (!dateObj || isNaN(dateObj)) return false;

      const year = dateObj.getFullYear().toString();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const day = dateObj.getDate().toString().padStart(2, "0");

      return (
        (!yearFilter || year === yearFilter) &&
        (!monthFilter || month === monthFilter) &&
        (!dayFilter || day === dayFilter)
      );
    });
  }, [records, yearFilter, monthFilter, dayFilter]);

  // ----------------- Airlines & Data -----------------
  const airlines = useMemo(
    () =>
      Array.from(
        new Set(
          filteredRecords.map((r) => r.airline?.toUpperCase()).filter(Boolean)
        )
      ),
    [filteredRecords]
  );

  const data = useMemo(() => {
    return airlines.map((airline) => {
      const stats = filteredRecords.reduce(
        (acc, f) => {
          if (f.airline?.toUpperCase() !== airline) return acc;

          acc.totalFlights++;
          const gpu = isValidUsage(f.gpuStart) && isValidUsage(f.gpuEnd);
          const pca = isValidUsage(f.pcaStart) && isValidUsage(f.pcaEnd);

          if (gpu) acc.gpuUsed++;
          if (pca) acc.pcaUsed++;
          if (!gpu && !pca) acc.nonUsage++;

          return acc;
        },
        { airline, totalFlights: 0, gpuUsed: 0, pcaUsed: 0, nonUsage: 0 }
      );

      return stats;
    });
  }, [airlines, filteredRecords]);

  // ----------------- Unique Years -----------------
  const uniqueYears = useMemo(() => {
    return [...new Set(records.map((r) => new Date(r.date).getFullYear().toString()))].sort();
  }, [records]);

  // ----------------- Excel Export -----------------
  const exportToExcel = () => {
    if (!data.length) return;

    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: ["airline", "totalFlights", "gpuUsed", "pcaUsed", "nonUsage"],
    });

    // Optional: Adjust column widths
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Airline Usage");
    XLSX.writeFile(workbook, "AirlineUsage.xlsx");
  };

  // ----------------- Render -----------------
  if (loading) {
    return <p className="text-center mt-16 text-gray-600 text-lg font-medium">Loading data...</p>;
  }

  if (error) {
    return <p className="text-center mt-16 text-red-600 text-lg font-medium">{error}</p>;
  }

  if (!records.length) {
    return <p className="text-center mt-16 text-gray-600 text-lg font-medium">No flight records available.</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-extrabold mb-8 text-indigo-900 border-b border-indigo-200 pb-2 text-center">
        Total Usage & Non-Usage of Flights by Airline
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border rounded p-2">
          <option value="">All Years</option>
          {uniqueYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border rounded p-2">
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => {
            const monthNum = (i + 1).toString().padStart(2, "0");
            return (
              <option key={monthNum} value={monthNum}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            );
          })}
        </select>

        <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="border rounded p-2">
          <option value="">All Days</option>
          {[...Array(31)].map((_, i) => {
            const dayNum = (i + 1).toString().padStart(2, "0");
            return (
              <option key={dayNum} value={dayNum}>{dayNum}</option>
            );
          })}
        </select>

        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          Export to Excel
        </button>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="airline" tick={{ fill: "#4b5563", fontWeight: "600" }} />
            <YAxis tick={{ fill: "#4b5563", fontWeight: "600" }} />
            <Tooltip wrapperStyle={{ fontSize: 14 }} contentStyle={{ borderRadius: 6, borderColor: '#a78bfa' }} />
            <Legend verticalAlign="bottom" height={36} />
            <Bar dataKey="totalFlights" fill="#8b5cf6" name="Total Flights" />
            <Bar dataKey="gpuUsed" fill="#2563eb" name="GPU Used" />
            <Bar dataKey="pcaUsed" fill="#fb923c" name="PCA Used" />
            <Bar dataKey="nonUsage" fill="#374151" name="Non Usage" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-x-auto border border-indigo-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-indigo-200 text-center">
          <thead className="bg-indigo-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-semibold text-indigo-700 uppercase text-xs">Airline</th>
              <th className="px-6 py-3 font-semibold text-indigo-700 uppercase text-xs">Total Flights</th>
              <th className="px-6 py-3 font-semibold text-indigo-700 uppercase text-xs">GPU Used</th>
              <th className="px-6 py-3 font-semibold text-indigo-700 uppercase text-xs">PCA Used</th>
              <th className="px-6 py-3 font-semibold text-indigo-700 uppercase text-xs">Non Usage</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ airline, totalFlights, gpuUsed, pcaUsed, nonUsage }) => (
              <tr key={airline} className="odd:bg-white even:bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-900">{airline}</td>
                <td className="px-6 py-4 whitespace-nowrap">{totalFlights}</td>
                <td className="px-6 py-4 whitespace-nowrap">{gpuUsed}</td>
                <td className="px-6 py-4 whitespace-nowrap">{pcaUsed}</td>
                <td className="px-6 py-4 whitespace-nowrap">{nonUsage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
