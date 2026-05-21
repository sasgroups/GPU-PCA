import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function StandWiseUsageTable() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [airline, setAirline] = useState("");
  const [airlines, setAirlines] = useState([]);
  const [error, setError] = useState("");

  // Fetch records once
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/records`);
        const data = res.data || [];
        setRecords(data);
        setFiltered(data);

        const airlineList = [
          ...new Set(data.map((rec) => rec.flightNo?.slice(0, 2)).filter(Boolean)),
        ];
        setAirlines(airlineList);
      } catch (err) {
        console.error("Error fetching records", err);
        setError("Failed to load records. Please try again later.");
      }
    };

    fetchRecords();
  }, []);

  // Apply filters
  useEffect(() => {
    let data = [...records];

    if (airline) {
      data = data.filter((item) => item.flightNo?.startsWith(airline));
    }
    if (year) {
      data = data.filter(
        (item) => new Date(item.date).getFullYear() === Number(year)
      );
    }
    if (month) {
      data = data.filter(
        (item) => new Date(item.date).getMonth() + 1 === Number(month)
      );
    }
    if (day) {
      data = data.filter(
        (item) => new Date(item.date).getDate() === Number(day)
      );
    }

    setFiltered(data);
  }, [airline, year, month, day, records]);

  // Memoized grouped data
  const groupedData = useMemo(() => {
    return filtered.reduce((acc, rec) => {
      const serial = rec.serialNo || "Unknown";
      if (!acc[serial]) acc[serial] = [];
      acc[serial].push(rec);
      return acc;
    }, {});
  }, [filtered]);

  // Totals (memoized)
  const { totalFlights, totalGPU, totalPCA } = useMemo(() => {
    return {
      totalFlights: filtered.length,
      totalGPU: filtered.filter((f) => f.gpuStart && f.gpuEnd).length,
      totalPCA: filtered.filter((f) => f.pcaStart && f.pcaEnd).length,
    };
  }, [filtered]);

  // 📥 CSV Download
  const handleDownload = () => {
    let csvContent =
      "S.NO,EQUIPMENT DESCRIPTION,EQUIPMENT NAME,LOCATION,TOTAL NO. OF FLIGHTS,GPU USED,PCA USED\n";

    Object.entries(groupedData).forEach(([serialNo, flights], idx) => {
      const gpuUsed = flights.filter((f) => f.gpuStart && f.gpuEnd).length;
      const pcaUsed = flights.filter((f) => f.pcaStart && f.pcaEnd).length;

      csvContent += `${idx + 1},Stand no. ${serialNo},GPU & PCA,T1,${flights.length},${gpuUsed},${pcaUsed}\n`;
    });

    // Total row
    csvContent += `Total,,,,${
      totalFlights
    },${totalGPU},${totalPCA}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `standwise_usage_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          TOTAL COUNT OF FLIGHTS & GPU/PCA USAGE (STAND WISE)
        </h2>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Download CSV
        </button>
      </div>

      {/* Error handling */}
      {error && (
        <div className="mb-4 text-red-600 font-semibold">{error}</div>
      )}

      {/* Airline Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {airlines.map((al) => (
          <button
            key={al}
            onClick={() => setAirline(al)}
            className={`px-4 py-2 rounded border ${
              airline === al ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
          >
            {al}
          </button>
        ))}
        <button
          onClick={() => setAirline("")}
          className={`px-4 py-2 rounded border ${
            airline === "" ? "bg-blue-500 text-white" : "bg-white text-black"
          }`}
        >
          All Airlines
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Year</option>
          {[2023, 2024, 2025].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Month</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table className="min-w-full border border-gray-400 text-sm text-center">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">S.NO</th>
            <th className="border p-2">EQUIPMENT DESCRIPTION</th>
            <th className="border p-2">Equipment Name</th>
            <th className="border p-2">LOCATION</th>
            <th className="border p-2">TOTAL NO. OF FLIGHTS</th>
            <th className="border p-2">GPU USED</th>
            <th className="border p-2">PCA USED</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([serialNo, flights], idx) => {
            const gpuUsed = flights.filter((f) => f.gpuStart && f.gpuEnd).length;
            const pcaUsed = flights.filter((f) => f.pcaStart && f.pcaEnd).length;
            return (
              <tr key={serialNo}>
                <td className="border p-2">{idx + 1}</td>
                <td className="border p-2">Stand no. {serialNo}</td>
                <td className="border p-2">GPU & PCA</td>
                <td className="border p-2">T1</td>
                <td className="border p-2">{flights.length}</td>
                <td className="border p-2">{gpuUsed}</td>
                <td className="border p-2">{pcaUsed}</td>
              </tr>
            );
          })}

          {/* Total row */}
          <tr className="bg-gray-200 font-bold">
            <td className="border p-2" colSpan={4}>
              Total
            </td>
            <td className="border p-2">{totalFlights}</td>
            <td className="border p-2">{totalGPU}</td>
            <td className="border p-2">{totalPCA}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}