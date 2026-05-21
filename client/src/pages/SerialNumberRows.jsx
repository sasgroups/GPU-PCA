import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function StandWiseUsageTable() {
  const [records, setRecords] = useState([]);
  const [year, setYear] = useState("All");
  const [month, setMonth] = useState("All");
  const [day, setDay] = useState("All");

  // 📥 Fetch once
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/records`)
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("Error fetching records", err));
  }, []);

  // 📌 Extract unique filters (memoized)
  const years = useMemo(
    () => ["All", ...new Set(records.map((r) => new Date(r.date).getFullYear()))],
    [records]
  );
  const months = ["All", ...Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))];
  const days = ["All", ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"))];

  // 📌 Filtered records (safe date handling)
  const filtered = useMemo(() => {
    return records.filter((rec) => {
      if (!rec.date) return false;
      const recDate = new Date(rec.date);
      if (isNaN(recDate)) return false; // skip invalid
      return (
        (year === "All" || recDate.getFullYear() === Number(year)) &&
        (month === "All" || String(recDate.getMonth() + 1).padStart(2, "0") === String(month)) &&
        (day === "All" || String(recDate.getDate()).padStart(2, "0") === String(day))
      );
    });
  }, [records, year, month, day]);

  // 📌 Group data by stand & airline
  const standData = useMemo(() => {
    const grouped = {};
    filtered.forEach((rec) => {
      const stand = rec.serialNo || "Unknown Stand";
      const airline = rec.flightNo?.substring(0, 2) || "XX";

      if (!grouped[stand]) {
        grouped[stand] = { flights: [], airlines: {} };
      }
      grouped[stand].flights.push(rec);

      if (!grouped[stand].airlines[airline]) {
        grouped[stand].airlines[airline] = [];
      }
      grouped[stand].airlines[airline].push(rec);
    });
    return grouped;
  }, [filtered]);

  // 📌 Helper to calculate usage
  const calculateUsage = (flights) => {
    const totalFlights = flights.length;
    const gpuUsed = flights.filter((f) => f.gpuStart && f.gpuEnd).length;
    const pcaUsed = flights.filter((f) => f.pcaStart && f.pcaEnd).length;
    return { totalFlights, gpuUsed, pcaUsed };
  };

  // 📌 Grand totals (memoized)
  const { grandTotalFlights, grandGPU, grandPCA } = useMemo(() => {
    return {
      grandTotalFlights: filtered.length,
      grandGPU: filtered.filter((f) => f.gpuStart && f.gpuEnd).length,
      grandPCA: filtered.filter((f) => f.pcaStart && f.pcaEnd).length,
    };
  }, [filtered]);

  // 📥 CSV Download (clean airline column, safer filename)
  const handleDownload = () => {
    let csv = "Stand,Airline,Count of Flight #,GPU Used,PCA Used\n";

    Object.entries(standData).forEach(([stand, data]) => {
      const { totalFlights, gpuUsed, pcaUsed } = calculateUsage(data.flights);
      csv += `${stand},ALL,${totalFlights},${gpuUsed},${pcaUsed}\n`;

      Object.entries(data.airlines).forEach(([airline, flights]) => {
        const { totalFlights: aTotal, gpuUsed: aGPU, pcaUsed: aPCA } = calculateUsage(flights);
        csv += `${stand},${airline},${aTotal},${aGPU},${aPCA}\n`;
      });
    });

    csv += `TOTAL,ALL,${grandTotalFlights},${grandGPU},${grandPCA}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `standwise_usage_${year}-${month}-${day}`
      .replace(/All/g, "")
      .replace(/--+/g, "-")
      .replace(/-$/, "");
    a.href = url;
    a.download = filename + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-center flex-1">
          TOTAL COUNT OF FLIGHTS & GPU/PCA USAGE - STAND WISE
        </h2>
        <button
          onClick={handleDownload}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-green-700"
        >
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        <select className="border p-2 rounded" value={year} onChange={(e) => setYear(e.target.value)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select className="border p-2 rounded" value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select className="border p-2 rounded" value={day} onChange={(e) => setDay(e.target.value)}>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-400 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Stand</th>
              <th className="border p-2">Airline</th>
              <th className="border p-2">Count of Flight #</th>
              <th className="border p-2">GPU Used</th>
              <th className="border p-2">PCA Used</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(standData).map(([stand, data]) => {
              const { totalFlights, gpuUsed, pcaUsed } = calculateUsage(data.flights);
              return (
                <React.Fragment key={stand}>
                  {/* Stand row */}
                  <tr className="bg-gray-50 font-bold">
                    <td className="border p-2">{stand}</td>
                    <td className="border p-2">ALL</td>
                    <td className="border p-2">{totalFlights}</td>
                    <td className="border p-2">{gpuUsed}</td>
                    <td className="border p-2">{pcaUsed}</td>
                  </tr>
                  {/* Airline rows */}
                  {Object.entries(data.airlines).map(([airline, flights]) => {
                    const { totalFlights: aTotal, gpuUsed: aGPU, pcaUsed: aPCA } = calculateUsage(flights);
                    return (
                      <tr key={`${stand}-${airline}`}>
                        <td className="border p-2 pl-6">{stand}</td>
                        <td className="border p-2">{airline}</td>
                        <td className="border p-2">{aTotal}</td>
                        <td className="border p-2">{aGPU}</td>
                        <td className="border p-2">{aPCA}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Total row */}
            <tr className="bg-gray-200 font-bold">
              <td className="border p-2">TOTAL</td>
              <td className="border p-2">ALL</td>
              <td className="border p-2">{grandTotalFlights}</td>
              <td className="border p-2">{grandGPU}</td>
              <td className="border p-2">{grandPCA}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
