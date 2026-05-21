// src/pages/GPUUsageTable.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function GPUUsageTable() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedDay, setSelectedDay] = useState("All");
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch records once
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setErrorMsg(null);
        const res = await axios.get(`${BASE_URL}/api/records`);
        setRecords(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching records:", err);
        setErrorMsg("Failed to fetch records. Please try again.");
      }
    };
    fetchRecords();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = records.filter((record) => {
      if (!record.date) return false;
      const [, month, day] = record.date.split("-");
      if (selectedMonth !== "All" && selectedMonth !== month) return false;
      if (selectedDay !== "All" && selectedDay !== day) return false;
      return true;
    });
    setFilteredRecords(filtered);
  }, [records, selectedMonth, selectedDay]);

  // Count flights with GPU used
  const countGpuUsedFlights = useCallback((flights) => {
    return flights.filter(
      (f) =>
        f.gpuStart &&
        f.gpuEnd &&
        f.gpuStart.trim() !== "" &&
        f.gpuEnd.trim() !== ""
    ).length;
  }, []);

  // Group by Stand
  const groupedByStand = useMemo(() => {
    return filteredRecords.reduce((acc, rec) => {
      if (!rec.serialNo) return acc;
      if (!acc[rec.serialNo]) acc[rec.serialNo] = [];
      acc[rec.serialNo].push(rec);
      return acc;
    }, {});
  }, [filteredRecords]);

  // Unique airlines list
  const uniqueAirlines = useMemo(
    () => Array.from(new Set(filteredRecords.map((r) => r.airline))).sort(),
    [filteredRecords]
  );

  // Airline usage %
  const airlineUsagePercent = useMemo(() => {
    return uniqueAirlines.reduce((acc, airline) => {
      const flightsOfAirline = filteredRecords.filter((f) => f.airline === airline);
      const totalFlights = flightsOfAirline.length;
      const gpuUsedFlights = countGpuUsedFlights(flightsOfAirline);
      acc[airline] = totalFlights
        ? ((gpuUsedFlights / totalFlights) * 100).toFixed(1)
        : "0.0";
      return acc;
    }, {});
  }, [uniqueAirlines, filteredRecords, countGpuUsedFlights]);

  // Overall usage %
  const totalFlightsAll = filteredRecords.length;
  const totalGpuUsedAll = countGpuUsedFlights(filteredRecords);
  const overallUsagePercent = totalFlightsAll
    ? ((totalGpuUsedAll / totalFlightsAll) * 100).toFixed(1)
    : "0.0";

  // CSV Download
  const downloadCSV = () => {
    if (!Object.keys(groupedByStand).length) {
      alert("No records to download");
      return;
    }

    const headers = [
      "Stand No.",
      "Total Flights",
      ...uniqueAirlines.map((a) => `Total ${a}`),
      ...uniqueAirlines.map((a) => `Total ${a} GPU`),
      "Total GPU Usage Hrs (HH.MM)",
    ];
    const csvRows = [headers.join(",")];

    // Per-stand rows
    Object.entries(groupedByStand).forEach(([standNo, flights]) => {
      const totalFlights = flights.length;
      const countsByAirline = {};
      const gpuUsedCountsByAirline = {};

      uniqueAirlines.forEach((airline) => {
        const flightsOfAirline = flights.filter((f) => f.airline === airline);
        countsByAirline[airline] = flightsOfAirline.length;
        gpuUsedCountsByAirline[airline] = countGpuUsedFlights(flightsOfAirline);
      });

      const totalGpuUsageHours = flights.reduce((sum, f) => {
        if (!f.gpuStart || !f.gpuEnd) return sum;
        const [startH, startM] = f.gpuStart.split(":").map(Number);
        const [endH, endM] = f.gpuEnd.split(":").map(Number);
        let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
        if (diffMinutes < 0) diffMinutes = 0;
        return sum + diffMinutes / 60;
      }, 0);

      const gpuHrsDisplay = `${Math.floor(totalGpuUsageHours)}.${Math.round(
        (totalGpuUsageHours % 1) * 60
      )
        .toString()
        .padStart(2, "0")}`;

      const row = [
        `Stand no. ${standNo}`,
        totalFlights,
        ...uniqueAirlines.map((a) => countsByAirline[a] || 0),
        ...uniqueAirlines.map((a) => gpuUsedCountsByAirline[a] || 0),
        gpuHrsDisplay,
      ];

      csvRows.push(row.join(","));
    });

    // Totals row
    const totalGpuHours = filteredRecords.reduce((sum, f) => {
      if (!f.gpuStart || !f.gpuEnd) return sum;
      const [startH, startM] = f.gpuStart.split(":").map(Number);
      const [endH, endM] = f.gpuEnd.split(":").map(Number);
      let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes < 0) diffMinutes = 0;
      return sum + diffMinutes / 60;
    }, 0);

    const totalRow = [
      "TOTAL",
      totalFlightsAll,
      ...uniqueAirlines.map(
        (a) => filteredRecords.filter((f) => f.airline === a).length
      ),
      ...uniqueAirlines.map((a) =>
        countGpuUsedFlights(filteredRecords.filter((f) => f.airline === a))
      ),
      `${Math.floor(totalGpuHours)}.${Math.round((totalGpuHours % 1) * 60)
        .toString()
        .padStart(2, "0")}`,
    ];
    csvRows.push(totalRow.join(","));

    // Export CSV
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpu_usage_${selectedMonth}_${selectedDay}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 border-b pb-2 sm:border-none sm:pb-0">
          GPU Usage Report
        </h2>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Download CSV
        </button>
      </div>

      {errorMsg && <p className="text-red-600 text-center mb-4">{errorMsg}</p>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 items-stretch sm:items-center">
        <label className="flex flex-col w-full sm:w-auto">
          <span className="mb-1 text-sm font-semibold text-gray-700">
            Filter by Month
          </span>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="All">All</option>
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

        <label className="flex flex-col w-full sm:w-auto">
          <span className="mb-1 text-sm font-semibold text-gray-700">
            Filter by Day
          </span>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="All">All</option>
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

      {/* --- Main Table --- */}
      <div className="flex-1 overflow-y-auto max-w-[1150px] w-full border rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                Stand No.
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                Total Flights
              </th>
              {uniqueAirlines.map((airline) => (
                <th
                  key={airline}
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase"
                >
                  Total {airline}
                </th>
              ))}
              {uniqueAirlines.map((airline) => (
                <th
                  key={`${airline}-gpu`}
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase"
                >
                  Total {airline} GPU
                </th>
              ))}
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                Total GPU Usage Hrs (HH.MM)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedByStand).map(([standNo, flights]) => {
              const totalFlights = flights.length;
              const countsByAirline = {};
              const gpuUsedCountsByAirline = {};

              uniqueAirlines.forEach((airline) => {
                const flightsOfAirline = flights.filter(
                  (f) => f.airline === airline
                );
                countsByAirline[airline] = flightsOfAirline.length;
                gpuUsedCountsByAirline[airline] =
                  countGpuUsedFlights(flightsOfAirline);
              });

              const totalGpuUsageHours = flights.reduce((sum, f) => {
                if (!f.gpuStart || !f.gpuEnd) return sum;
                const [startH, startM] = f.gpuStart.split(":").map(Number);
                const [endH, endM] = f.gpuEnd.split(":").map(Number);
                let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
                if (diffMinutes < 0) diffMinutes = 0;
                return sum + diffMinutes / 60;
              }, 0);

              const gpuHrsDisplay = `${Math.floor(totalGpuUsageHours)}.${Math.round(
                (totalGpuUsageHours % 1) * 60
              )
                .toString()
                .padStart(2, "0")}`;

              return (
                <tr
                  key={standNo}
                  className="hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-blue-900 font-semibold">
                    Stand no. {standNo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {totalFlights}
                  </td>
                  {uniqueAirlines.map((airline) => (
                    <td
                      key={`count-${airline}`}
                      className="px-4 py-3 whitespace-nowrap text-center"
                    >
                      {countsByAirline[airline]}
                    </td>
                  ))}
                  {uniqueAirlines.map((airline) => (
                    <td
                      key={`gpuUsedCount-${airline}`}
                      className="px-4 py-3 whitespace-nowrap text-center text-green-700 font-semibold"
                    >
                      {gpuUsedCountsByAirline[airline]}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-700">
                    {gpuHrsDisplay}
                  </td>
                </tr>
              );
            })}

            {/* TOTALS ROW */}
            <tr className="bg-blue-100 font-bold text-blue-900">
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3">{totalFlightsAll}</td>
              {uniqueAirlines.map((airline) => (
                <td
                  key={`total-count-${airline}`}
                  className="px-4 py-3 whitespace-nowrap text-center"
                >
                  {
                    filteredRecords.filter((f) => f.airline === airline).length
                  }
                </td>
              ))}
              {uniqueAirlines.map((airline) => (
                <td
                  key={`total-gpu-count-${airline}`}
                  className="px-4 py-3 whitespace-nowrap text-center text-green-800 font-semibold"
                >
                  {countGpuUsedFlights(
                    filteredRecords.filter((f) => f.airline === airline)
                  )}
                </td>
              ))}
              <td className="px-4 py-3 whitespace-nowrap font-mono">
                {(() => {
                  const totalGpuHours = filteredRecords.reduce((sum, f) => {
                    if (!f.gpuStart || !f.gpuEnd) return sum;
                    const [startH, startM] = f.gpuStart.split(":").map(Number);
                    const [endH, endM] = f.gpuEnd.split(":").map(Number);
                    let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
                    if (diffMinutes < 0) diffMinutes = 0;
                    return sum + diffMinutes / 60;
                  }, 0);
                  return `${Math.floor(totalGpuHours)}.${Math.round(
                    (totalGpuHours % 1) * 60
                  )
                    .toString()
                    .padStart(2, "0")}`;
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Table */}
      <div className="max-w-md mt-8 mx-auto border border-gray-300 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left font-semibold text-gray-700">
                AIRLINES
              </th>
              <th className="border px-4 py-2 text-left font-semibold text-gray-700">
                Usage (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {uniqueAirlines.map((airline) => (
              <tr
                key={airline}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                <td className="border px-4 py-2 font-medium text-gray-800">
                  {airline}
                </td>
                <td className="border px-4 py-2 text-gray-900 font-semibold">
                  {airlineUsagePercent[airline]}
                </td>
              </tr>
            ))}
            <tr className="bg-blue-100 font-bold text-blue-900">
              <td className="border px-4 py-2">USAGE (%)</td>
              <td className="border px-4 py-2">{overallUsagePercent}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-gray-600 font-medium text-sm">
        Total Records:{" "}
        <span className="font-semibold">{filteredRecords.length}</span>
      </p>
    </div>
  );
}
