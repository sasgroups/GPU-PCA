import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function AirlineUsageReplica() {
  const [records, setRecords] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------- Fetch Records -----------------
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/records`);
        setRecords(res.data || []);
      } catch (err) {
        console.error("Error fetching records", err);
        setError("Failed to fetch records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // ----------------- Derived Data -----------------
  const uniqueAirlines = useMemo(() => {
    return Array.from(
      new Set(records.map((r) => r.flightNo?.substring(0, 2)))
    ).filter(Boolean);
  }, [records]);

  const uniqueYears = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((r) => {
            const d = new Date(r.date);
            return isNaN(d) ? null : d.getFullYear();
          })
          .filter(Boolean)
      )
    ).sort();
  }, [records]);

  const filteredData = useMemo(() => {
    return records.filter((r) => {
      const code = r.flightNo?.substring(0, 2);
      const recDate = r.date ? new Date(r.date) : null;
      if (!recDate || isNaN(recDate)) return false;
      return (
        (!selectedAirline || code === selectedAirline) &&
        (!year || recDate.getFullYear() === parseInt(year)) &&
        (!month || recDate.getMonth() + 1 === parseInt(month)) &&
        (!day || recDate.getDate() === parseInt(day))
      );
    });
  }, [records, selectedAirline, year, month, day]);

  // ----------------- Counts (optimized reduce) -----------------
  const {
    totalFlights,
    bothConnected,
    onlyPCA,
    onlyGPU,
    nonUsage,
    shortDeparture,
    dieselGPU,
    bmeFaulty,
  } = useMemo(() => {
    return filteredData.reduce(
      (acc, f) => {
        acc.totalFlights++;
        const gpu = f.gpuStart && f.gpuEnd;
        const pca = f.pcaStart && f.pcaEnd;

        if (gpu && pca) acc.bothConnected++;
        else if (pca) acc.onlyPCA++;
        else if (gpu) acc.onlyGPU++;
        else acc.nonUsage++;

        if (f.departureType === "Short") acc.shortDeparture++;
        if (f.gpuType === "Diesel") acc.dieselGPU++;
        if (f.status === "Faulty") acc.bmeFaulty++;

        return acc;
      },
      {
        totalFlights: 0,
        bothConnected: 0,
        onlyPCA: 0,
        onlyGPU: 0,
        nonUsage: 0,
        shortDeparture: 0,
        dieselGPU: 0,
        bmeFaulty: 0,
      }
    );
  }, [filteredData]);

  // ----------------- Download CSV -----------------
  const downloadCSV = () => {
    if (!filteredData.length) {
      alert("No records to download");
      return;
    }

    const airlineLabel = selectedAirline || "ALL AIRLINES";

    const rows = [
      [`USAGE / NON USAGE OF ${airlineLabel}`],
      [
        "TOTAL FLIGHTS",
        "BOTH CONNECTED",
        "ONLY PCA USED",
        "ONLY GPU USED",
        "TOTAL NON USAGE",
      ],
      [totalFlights, bothConnected, onlyPCA, onlyGPU, nonUsage],
      [],
      [`JUSTIFICATION OF NON USAGE OF ${airlineLabel}`],
      [
        "TOTAL NON USAGE",
        "SHORT DEPARTURE",
        "DIESEL ENGINE GPU USED",
        "BME FAULTY",
      ],
      [nonUsage, shortDeparture, dieselGPU, bmeFaulty],
    ];

    const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AirlineUsage_${airlineLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------- Render -----------------
  if (loading) {
    return <div className="p-4 text-blue-600">Loading records...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
      {/* Airline Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {uniqueAirlines.map((air) => (
          <button
            key={air}
            onClick={() => setSelectedAirline(air)}
            className={`px-4 py-2 rounded font-semibold ${
              selectedAirline === air
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {air}
          </button>
        ))}
        <button
          onClick={() => setSelectedAirline("")}
          className={`px-4 py-2 rounded font-semibold ${
            selectedAirline === ""
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          All
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Year</option>
          {uniqueYears.map((y) => (
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
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadCSV}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      >
        Download CSV
      </button>

      {/* Usage / Non Usage Table */}
      <table className="min-w-full border border-black text-sm text-center mb-6">
        <thead>
          <tr>
            <th colSpan={5} className="border border-black p-2">
              USAGE / NON USAGE OF {selectedAirline || "ALL AIRLINES"}
            </th>
          </tr>
          <tr>
            <th className="border border-black p-2">TOTAL FLIGHTS</th>
            <th className="border border-black p-2">BOTH CONNECTED</th>
            <th className="border border-black p-2">ONLY PCA USED</th>
            <th className="border border-black p-2">ONLY GPU USED</th>
            <th className="border border-black p-2">TOTAL NON USAGE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">{totalFlights}</td>
            <td className="border border-black p-2">{bothConnected}</td>
            <td className="border border-black p-2">{onlyPCA}</td>
            <td className="border border-black p-2">{onlyGPU}</td>
            <td className="border border-black p-2">{nonUsage}</td>
          </tr>
        </tbody>
      </table>

      {/* Justification Table */}
      <table className="min-w-full border border-black text-sm text-center">
        <thead>
          <tr>
            <th colSpan={4} className="border border-black p-2">
              JUSTIFICATION OF NON USAGE OF {selectedAirline || "ALL AIRLINES"}
            </th>
          </tr>
          <tr>
            <th className="border border-black p-2">TOTAL NON USAGE</th>
            <th className="border border-black p-2">SHORT DEPARTURE</th>
            <th className="border border-black p-2">DIESEL ENGINE GPU USED</th>
            <th className="border border-black p-2">BME FAULTY</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">{nonUsage}</td>
            <td className="border border-black p-2">{shortDeparture}</td>
            <td className="border border-black p-2">{dieselGPU}</td>
            <td className="border border-black p-2">{bmeFaulty}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
