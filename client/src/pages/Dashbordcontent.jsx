// src/pages/Dashbordcontent.jsx
import { useState, useEffect, useMemo } from "react";
import { BASE_URL } from "../config";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashbordcontent() {
  const [recordCount, setRecordCount] = useState(0);
  const [records, setRecords] = useState([]);
  const [airlineData, setAirlineData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("2025-07");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#2563EB", "#16A34A", "#FACC15", "#F97316", "#0EA5E9"];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/records`);
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setRecords(data);
        setRecordCount(data.length);
      } catch (err) {
        console.error("Error fetching records", err);
        if (mounted) setErrorMsg("Failed to fetch records. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Recalculate airline usage when month or records change
  useEffect(() => {
    if (!records.length) {
      setAirlineData([]);
      return;
    }

    const filtered = records.filter((rec) => {
      if (!rec.date) return false;
      const d = new Date(rec.date);
      if (Number.isNaN(d.getTime())) return false;
      const recordMonth = d.toISOString().slice(0, 7); // YYYY-MM
      return recordMonth === selectedMonth;
    });

    const airlineCount = {};
    filtered.forEach((rec) => {
      if (rec.airline) {
        airlineCount[rec.airline] = (airlineCount[rec.airline] || 0) + 1;
      }
    });

    const total = filtered.length || 1; // avoid divide by zero
    const chartData = Object.entries(airlineCount).map(([name, count]) => ({
      name,
      value: (count / total) * 100,
    }));

    setAirlineData(chartData);
  }, [selectedMonth, records]);

  // Recent 3 records (memoized)
  const recentRecords = useMemo(() => records.slice(0, 3), [records]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">📊 Total Records</p>
          <h3 className="text-3xl font-bold text-blue-600">{recordCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">✈️ Recent Flight</p>
          <h3 className="text-lg font-semibold">
            {records[0]?.flightNo || "N/A"}
          </h3>
          <p className="text-sm text-gray-600">
            Aircraft: {records[0]?.aircraftType || "-"}
          </p>
          <p className="text-sm text-gray-600">Reg: {records[0]?.regNo || "-"}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">👷 Last Operator</p>
          <h3 className="text-lg font-semibold">
            {records[0]?.operatorName || "N/A"}
          </h3>
          <p className="text-sm text-gray-600">Shift: {records[0]?.shift || "-"}</p>
          <p className="text-sm text-gray-600">GHA: {records[0]?.ghaName || "-"}</p>
        </div>
      </div>

      {/* Airline usage pie chart */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">📈 Airline Usage (%)</h3>
          <select
            className="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="2025-06">June 2025</option>
            <option value="2025-07">July 2025</option>
            <option value="2025-08">August 2025</option>
          </select>
        </div>

        {loading && (
          <p className="text-gray-500 text-center py-6">Loading chart...</p>
        )}
        {errorMsg && !loading && (
          <p className="text-red-600 text-center py-6">{errorMsg}</p>
        )}

        {!loading && !errorMsg && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={airlineData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              >
                {airlineData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Records */}
      <h3 className="text-xl font-bold mt-8">🧾 Recent Records</h3>
      {loading && <p className="text-gray-500">Loading records...</p>}
      {errorMsg && !loading && (
        <p className="text-red-600">{errorMsg}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {!loading &&
          !errorMsg &&
          recentRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-blue-600">{rec.flightNo}</h4>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {rec.date}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                ✈️ {rec.aircraftType} - {rec.regNo}
              </p>
              <p className="text-sm text-gray-700">
                🛬 Stand: {rec.parkingStand} | Origin: {rec.origin}
              </p>
              <p className="text-sm text-gray-700">
                🔌 GPU: {rec.gpuStart} - {rec.gpuEnd}
              </p>
              <p className="text-sm text-gray-700">
                ❄️ PCA: {rec.pcaStart} - {rec.pcaEnd}
              </p>
              <p className="text-sm text-gray-700">
                👷 {rec.operatorName} (Shift: {rec.shift})
              </p>
            </div>
          ))}
        {!loading && !errorMsg && recentRecords.length === 0 && (
          <p className="text-gray-500 col-span-full text-center">
            No records available.
          </p>
        )}
      </div>
    </div>
  );
}
