// src/pages/AirlineTabsUsage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BASE_URL } from "../config";

const COLORS = ["#2563EB", "#A78BFA"]; // Indigo & Purple hues for nicer colors
const FILTER_ALL = "All";
const GPU_USED = "Used GPU";
const GPU_NOT_USED = "Not Used GPU";

/**
 * Safely parse a date-like string and return [MM, DD] as two-digit strings.
 * Supports YYYY-MM-DD, ISO strings, or Date-parsable strings.
 * If parsing fails, returns [null, null].
 */
function getMonthDayFromDateString(dateStr) {
  if (!dateStr) return [null, null];

  // If it's already in YYYY-MM-DD format, quick-split (most common in your codebase)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [, mm, dd] = dateStr.split("-");
    return [mm, dd];
  }

  // Attempt to parse with Date (supports ISO and many formats)
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return [mm, dd];
  }

  // Could not parse
  return [null, null];
}

/**
 * Count flights where both gpuStart and gpuEnd are set (non-empty trimmed).
 */
function countGpuUsedFlights(flights) {
  if (!Array.isArray(flights)) return 0;
  return flights.filter(
    (f) =>
      f &&
      f.gpuStart &&
      f.gpuEnd &&
      String(f.gpuStart).trim() !== "" &&
      String(f.gpuEnd).trim() !== ""
  ).length;
}

export default function AirlineTabsUsage() {
  const [records, setRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(FILTER_ALL);
  const [selectedDay, setSelectedDay] = useState(FILTER_ALL);
  const [selectedAirline, setSelectedAirline] = useState(FILTER_ALL);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/records`);
        if (!mounted) return;
        // guard: ensure data is an array
        setRecords(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching records", err);
        if (mounted) setErrorMsg("Failed to fetch records. Please try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // filteredRecords derived from records + selectedMonth + selectedDay
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];

    return records.filter((r) => {
      if (!r || !r.date) return false;
      const [month, day] = getMonthDayFromDateString(r.date);
      if (!month || !day) return false;
      if (selectedMonth !== FILTER_ALL && selectedMonth !== month) return false;
      if (selectedDay !== FILTER_ALL && selectedDay !== day) return false;
      return true;
    });
  }, [records, selectedMonth, selectedDay]);

  // If selectedAirline no longer exists in filteredRecords, auto-reset to All
  useEffect(() => {
    if (selectedAirline === FILTER_ALL) return;
    const exists = filteredRecords.some((r) => r && r.airline === selectedAirline);
    if (!exists) setSelectedAirline(FILTER_ALL);
  }, [filteredRecords, selectedAirline]);

  // Unique airlines based on filteredRecords
  const uniqueAirlines = useMemo(() => {
    const set = new Set();
    filteredRecords.forEach((r) => {
      if (r && r.airline) set.add(r.airline);
    });
    return Array.from(set).sort();
  }, [filteredRecords]);

  // records to show depending on selectedAirline
  const recordsToShow = useMemo(() => {
    if (selectedAirline === FILTER_ALL) return filteredRecords;
    return filteredRecords.filter((r) => r && r.airline === selectedAirline);
  }, [filteredRecords, selectedAirline]);

  const totalFlights = recordsToShow.length;
  const totalUsed = countGpuUsedFlights(recordsToShow);
  const totalNotUsed = Math.max(0, totalFlights - totalUsed);

  const pieData = useMemo(() => {
    return totalFlights > 0
      ? [
          { name: GPU_USED, value: totalUsed },
          { name: GPU_NOT_USED, value: totalNotUsed },
        ]
      : [];
  }, [totalFlights, totalUsed, totalNotUsed]);

  return (
    <div className="p-6 mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-extrabold mb-8 text-indigo-900 border-b border-indigo-200 pb-2">
        Airline GPU Usage Overview
      </h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8 items-center">
        <label className="flex flex-col w-full max-w-xs">
          <span className="mb-2 font-semibold text-gray-700">Filter by Month</span>
          <select
            className="border border-gray-300 rounded-md px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value={FILTER_ALL}>{FILTER_ALL}</option>
            {[...Array(12).keys()].map((m) => {
              const monthNum = (m + 1).toString().padStart(2, "0");
              return (
                <option key={monthNum} value={monthNum}>
                  {monthNum}
                </option>
              );
            })}
          </select>
        </label>

        <label className="flex flex-col w-full max-w-xs">
          <span className="mb-2 font-semibold text-gray-700">Filter by Day</span>
          <select
            className="border border-gray-300 rounded-md px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value={FILTER_ALL}>{FILTER_ALL}</option>
            {[...Array(31).keys()].map((d) => {
              const dayNum = (d + 1).toString().padStart(2, "0");
              return (
                <option key={dayNum} value={dayNum}>
                  {dayNum}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {/* Airline Tabs */}
      <div className="mb-8 border-b border-indigo-300 flex flex-wrap gap-2" role="tablist" aria-label="Airline tabs">
        <button
          onClick={() => setSelectedAirline(FILTER_ALL)}
          className={`px-5 py-2 rounded-t-lg font-semibold transition ${
            selectedAirline === FILTER_ALL
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
          }`}
          role="tab"
          aria-selected={selectedAirline === FILTER_ALL}
        >
          All
        </button>
        {uniqueAirlines.map((airline) => (
          <button
            key={airline}
            onClick={() => setSelectedAirline(airline)}
            className={`px-5 py-2 rounded-t-lg font-semibold transition ${
              selectedAirline === airline
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
            }`}
            role="tab"
            aria-selected={selectedAirline === airline}
          >
            {airline}
          </button>
        ))}
      </div>

      {/* Error / Loading */}
      {loading && (
        <p className="text-gray-500 text-center py-6">Loading records...</p>
      )}
      {errorMsg && !loading && (
        <p className="text-red-600 text-center py-4">{errorMsg}</p>
      )}

      {/* Pie Chart */}
      <div className="w-full h-72 mb-4">
        {!loading && pieData.length > 0 ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} flights`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
        {!loading && pieData.length === 0 && !errorMsg && (
          <p className="text-center text-gray-500 mt-10 text-lg font-medium">
            No data for selected filters.
          </p>
        )}
      </div>

      {/* Selected Airline Label */}
      <div className="text-center mb-10 font-semibold text-xl text-indigo-700">
        {selectedAirline === FILTER_ALL
          ? "Showing data for All Airlines"
          : `Showing data for ${selectedAirline}`}
      </div>

      {/* Airlines Table */}
      <div className="overflow-x-auto border border-indigo-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-indigo-200">
          <thead className="bg-indigo-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-indigo-700 uppercase text-xs">
                Airline
              </th>
              <th className="px-6 py-3 text-left font-semibold text-indigo-700 uppercase text-xs">
                Total Flights
              </th>
              <th className="px-6 py-3 text-left font-semibold text-indigo-700 uppercase text-xs">
                GPU Usage (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {uniqueAirlines.map((airline) => {
              const flights = filteredRecords.filter((f) => f && f.airline === airline);
              const total = flights.length;
              const used = countGpuUsedFlights(flights);
              const usagePercent = total ? ((used / total) * 100).toFixed(1) : "0";

              return (
                <tr
                  key={airline}
                  className="odd:bg-white even:bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-900">
                    {airline}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{total}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-indigo-700">
                    {usagePercent}
                  </td>
                </tr>
              );
            })}

            {/* If there are no airlines but filteredRecords exist, show single row */}
            {uniqueAirlines.length === 0 && filteredRecords.length > 0 && (
              <tr className="bg-white">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-900">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{filteredRecords.length}</td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-indigo-700">
                  {((countGpuUsedFlights(filteredRecords) / Math.max(1, filteredRecords.length)) * 100).toFixed(1)}
                </td>
              </tr>
            )}

            {/* No data row */}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No airlines / flights for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
