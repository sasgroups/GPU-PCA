import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function PCAUsageTable() {
  const [records, setRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedDay, setSelectedDay] = useState("All");

  // Fetch records once
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/records`)
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("Error fetching records", err));
  }, []);

  // ✅ Helper: Count PCA used flights
  const countPcaUsedFlights = (flights) =>
    flights.filter(
      (f) =>
        f.pcaStart &&
        f.pcaEnd &&
        f.pcaStart.trim() !== "" &&
        f.pcaEnd.trim() !== ""
    ).length;

  // ✅ Helper: Calculate PCA usage hours (HH.MM format)
  const calculatePcaHours = (flights) => {
    const totalHours = flights.reduce((sum, f) => {
      if (!f.pcaStart || !f.pcaEnd) return sum;
      const [startH, startM] = f.pcaStart.split(":").map(Number);
      const [endH, endM] = f.pcaEnd.split(":").map(Number);
      let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes < 0) diffMinutes = 0;
      return sum + diffMinutes / 60;
    }, 0);
    return `${Math.floor(totalHours)}.${Math.round(
      (totalHours % 1) * 60
    )
      .toString()
      .padStart(2, "0")}`;
  };

  // ✅ Filtered records (optimized with useMemo)
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!record.date) return false;
      const date = new Date(record.date);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      if (selectedMonth !== "All" && selectedMonth !== month) return false;
      if (selectedDay !== "All" && selectedDay !== day) return false;
      return true;
    });
  }, [records, selectedMonth, selectedDay]);

  // ✅ Unique airlines
  const uniqueAirlines = useMemo(
    () => Array.from(new Set(filteredRecords.map((r) => r.airline))).sort(),
    [filteredRecords]
  );

  // ✅ Grouped by Stand
  const groupedByStand = useMemo(() => {
    return filteredRecords.reduce((acc, rec) => {
      if (!acc[rec.serialNo]) acc[rec.serialNo] = [];
      acc[rec.serialNo].push(rec);
      return acc;
    }, {});
  }, [filteredRecords]);

  // ✅ Airline usage %
  const airlineUsagePercent = useMemo(() => {
    return uniqueAirlines.reduce((acc, airline) => {
      const flights = filteredRecords.filter((f) => f.airline === airline);
      const usage = flights.length
        ? (countPcaUsedFlights(flights) / flights.length) * 100
        : 0;
      acc[airline] = usage.toFixed(1);
      return acc;
    }, {});
  }, [filteredRecords, uniqueAirlines]);

  const overallUsagePercent = useMemo(() => {
    const total = filteredRecords.length;
    const used = countPcaUsedFlights(filteredRecords);
    return total ? ((used / total) * 100).toFixed(1) : "0";
  }, [filteredRecords]);

  // ✅ CSV Export (fixed headers to PCA)
  const downloadCSV = () => {
    if (!Object.keys(groupedByStand).length) {
      alert("No records to download");
      return;
    }

    const headers = [
      "Stand No.",
      "Total Flights",
      ...uniqueAirlines.map((a) => `Total ${a}`),
      ...uniqueAirlines.map((a) => `Total ${a} PCA`),
      "Total PCA Usage Hrs (HH.MM)",
    ];
    const csvRows = [headers.join(",")];

    Object.entries(groupedByStand).forEach(([standNo, flights]) => {
      const totalFlights = flights.length;
      const countsByAirline = {};
      const usedByAirline = {};

      uniqueAirlines.forEach((a) => {
        const flts = flights.filter((f) => f.airline === a);
        countsByAirline[a] = flts.length;
        usedByAirline[a] = countPcaUsedFlights(flts);
      });

      const row = [
        `Stand no. ${standNo}`,
        totalFlights,
        ...uniqueAirlines.map((a) => countsByAirline[a] || 0),
        ...uniqueAirlines.map((a) => usedByAirline[a] || 0),
        calculatePcaHours(flights),
      ];
      csvRows.push(row.join(","));
    });

    // Totals row
    const totalRow = [
      "TOTAL",
      filteredRecords.length,
      ...uniqueAirlines.map(
        (a) => filteredRecords.filter((f) => f.airline === a).length
      ),
      ...uniqueAirlines.map((a) =>
        countPcaUsedFlights(filteredRecords.filter((f) => f.airline === a))
      ),
      calculatePcaHours(filteredRecords),
    ];
    csvRows.push(totalRow.join(","));

    // Trigger download
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pca_usage_${selectedMonth}_${selectedDay}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-full p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">
        PCA Usage Report
      </h2>

      {/* Filters & Download */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-6">
          <label className="flex flex-col w-full max-w-xs">
            <span className="mb-2 font-semibold text-gray-700">Filter by Month</span>
            <select
              className="border rounded-md px-4 py-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All</option>
              {[...Array(12).keys()].map((m) => {
                const monthNum = String(m + 1).padStart(2, "0");
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
              className="border rounded-md px-4 py-2"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="All">All</option>
              {[...Array(31).keys()].map((d) => {
                const dayNum = String(d + 1).padStart(2, "0");
                return (
                  <option key={dayNum} value={dayNum}>
                    {dayNum}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <button
          onClick={downloadCSV}
          className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md"
        >
          Download CSV
        </button>
      </div>

         {/* Main Table */}
   <div className="flex-1 overflow-y-auto max-w-[1150px] w-full border rounded-lg shadow">
    <table className="min-w-full border-collapse">
      <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Stand No.</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Total Flights</th>

              {uniqueAirlines.map((airline) => (
                <th
                  key={airline}
                  className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                >
                  Total {airline}
                </th>
              ))}

              {uniqueAirlines.map((airline) => (
                <th
                  key={`${airline}-pca`}
                  className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap"
                >
                  Total {airline} PCA
                </th>
              ))}

              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                Total PCA Usage Hrs (HH.MM)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedByStand).map(([standNo, flights]) => {
              const totalFlights = flights.length;

              const countsByAirline = {};
              const pcaUsedCountsByAirline = {};

              uniqueAirlines.forEach((airline) => {
                const flightsOfAirline = flights.filter((f) => f.airline === airline);
                countsByAirline[airline] = flightsOfAirline.length;
                pcaUsedCountsByAirline[airline] = countPcaUsedFlights(flightsOfAirline);
              });

              const totalPcaUsageHours = flights.reduce((sum, f) => {
                if (!f.pcaStart || !f.pcaEnd) return sum;
                const [startH, startM] = f.pcaStart.split(":").map(Number);
                const [endH, endM] = f.pcaEnd.split(":").map(Number);
                let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
                if (diffMinutes < 0) diffMinutes = 0;
                return sum + diffMinutes / 60;
              }, 0);

              const pcaHrsDisplay = `${Math.floor(totalPcaUsageHours)}.${Math.round(
                (totalPcaUsageHours % 1) * 60
              )
                .toString()
                .padStart(2, "0")}`;

              return (
                <tr key={standNo} className="hover:bg-indigo-50 transition-colors duration-200 font-medium">
                  <td className="px-5 py-4 whitespace-nowrap text-indigo-900 font-semibold">Stand no. {standNo}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{totalFlights}</td>

                  {uniqueAirlines.map((airline) => (
                    <td key={`count-${airline}`} className="px-5 py-4 whitespace-nowrap text-center">
                      {countsByAirline[airline]}
                    </td>
                  ))}

                  {uniqueAirlines.map((airline) => (
                    <td key={`pcaUsedCount-${airline}`} className="px-5 py-4 whitespace-nowrap text-center text-green-700 font-semibold">
                      {pcaUsedCountsByAirline[airline]}
                    </td>
                  ))}

                  <td className="px-5 py-4 whitespace-nowrap font-mono text-gray-700">{pcaHrsDisplay}</td>
                </tr>
              );
            })}

            {/* TOTALS ROW */}
            <tr className="bg-indigo-100 font-bold text-indigo-900">
              <td className="px-5 py-4 whitespace-nowrap">TOTAL</td>
              <td className="px-5 py-4 whitespace-nowrap">{filteredRecords.length}</td>

              {uniqueAirlines.map((airline) => {
                const sumTotalFlights = filteredRecords.filter(f => f.airline === airline).length;
                return (
                  <td key={`total-count-${airline}`} className="px-5 py-4 whitespace-nowrap text-center">
                    {sumTotalFlights}
                  </td>
                );
              })}

              {uniqueAirlines.map((airline) => {
                const sumPcaFlights = filteredRecords.filter(
                  (f) =>
                    f.airline === airline &&
                    f.pcaStart &&
                    f.pcaEnd &&
                    f.pcaStart.trim() !== "" &&
                    f.pcaEnd.trim() !== ""
                ).length;
                return (
                  <td key={`total-pca-count-${airline}`} className="px-5 py-4 whitespace-nowrap text-center text-green-800 font-semibold">
                    {sumPcaFlights}
                  </td>
                );
              })}

              <td className="px-5 py-4 whitespace-nowrap font-mono">
                {(() => {
                  const totalPcaHours = filteredRecords.reduce((sum, f) => {
                    if (!f.pcaStart || !f.pcaEnd) return sum;
                    const [startH, startM] = f.pcaStart.split(":").map(Number);
                    const [endH, endM] = f.pcaEnd.split(":").map(Number);
                    let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
                    if (diffMinutes < 0) diffMinutes = 0;
                    return sum + diffMinutes / 60;
                  }, 0);
                  return `${Math.floor(totalPcaHours)}.${Math.round((totalPcaHours % 1) * 60)
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
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-6 py-3 text-left font-semibold text-gray-700">AIRLINES</th>
              <th className="border px-6 py-3 text-left font-semibold text-gray-700">Usage (%)</th>
            </tr>
          </thead>
          <tbody>
            {uniqueAirlines.map((airline) => (
              <tr key={airline} className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50 transition-colors duration-200">
                <td className="border px-6 py-2 font-medium text-gray-800">{airline}</td>
                <td className="border px-6 py-2 text-gray-900 font-semibold">{airlineUsagePercent[airline]}</td>
              </tr>
            ))}
            <tr className="bg-indigo-100 font-bold text-indigo-900">
              <td className="border px-6 py-3">USAGE (%)</td>
              <td className="border px-6 py-3">{overallUsagePercent}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-gray-600 font-medium">
        Total Records: <span className="font-semibold">{filteredRecords.length}</span>
      </p>
    </div>
  );
}
