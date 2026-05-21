import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import * as XLSX from "xlsx";

export default function OperatorNameData() {
  const [records, setRecords] = useState([]);
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/records`)
      .then((res) => setRecords(res.data))
      .catch(() => setError("Failed to fetch records. Please try again later."));
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const dateObj = new Date(rec.date);
      if (isNaN(dateObj)) return false;

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

  // Group by operator
  const groupByOperator = (data) => {
    const grouped = {};
    data.forEach((rec) => {
      const operator = rec.operatorName || "Unknown Operator";
      const airline = rec.flightNo?.substring(0, 2) || "XX";
      if (!grouped[operator]) {
        grouped[operator] = { flights: [], airlines: {} };
      }
      grouped[operator].flights.push(rec);
      if (!grouped[operator].airlines[airline]) {
        grouped[operator].airlines[airline] = [];
      }
      grouped[operator].airlines[airline].push(rec);
    });
    return grouped;
  };

  const operatorData = useMemo(() => groupByOperator(filteredRecords), [filteredRecords]);

  const calculateUsage = (flights) => {
    const totalFlights = flights.length;
    const gpuUsage = flights.filter((f) => f.gpuStart && f.gpuEnd).length;
    const pcaUsage = flights.filter((f) => f.pcaStart && f.pcaEnd).length;
    const usagePercent = totalFlights
      ? ((gpuUsage / totalFlights) * 100).toFixed(2)
      : "0.00";
    return { totalFlights, gpuUsage, pcaUsage, usagePercent };
  };

  // Grand totals
  const allFlights = filteredRecords.length;
  const totalGPU = filteredRecords.filter((f) => f.gpuStart && f.gpuEnd).length;
  const totalPCA = filteredRecords.filter((f) => f.pcaStart && f.pcaEnd).length;
  const totalUsagePercent = allFlights
    ? ((totalGPU / allFlights) * 100).toFixed(2)
    : "0.00";

  // Unique years
  const uniqueYears = [...new Set(records.map((r) => new Date(r.date).getFullYear().toString()))].sort();

  // Download Excel
  const handleDownload = () => {
    const wsData = [["S.no", "Operator", "Total Flights", "GPU Usage", "PCA Usage", "Usage %"]];
    let sno = 1;

    Object.entries(operatorData).forEach(([operator, data]) => {
      const { totalFlights, gpuUsage, pcaUsage, usagePercent } = calculateUsage(data.flights);
      wsData.push([sno++, operator, totalFlights, gpuUsage, pcaUsage, usagePercent]);

      Object.entries(data.airlines).forEach(([airline, flights]) => {
        const aTotalFlights = flights.length;
        const aGPUUsage = flights.filter((f) => f.gpuStart && f.gpuEnd).length;
        const aPCAUsage = flights.filter((f) => f.pcaStart && f.pcaEnd).length;
        wsData.push(["", airline, aTotalFlights, aGPUUsage, aPCAUsage, ""]);
      });
    });

    wsData.push(["", "TOTAL", allFlights, totalGPU, totalPCA, totalUsagePercent]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BME Operators Usage");
    XLSX.writeFile(wb, "BME_Operators_Usage.xlsx");
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 flex justify-between items-center">
        BME OPERATORS USAGE IN PERCENTAGE
        <button
          onClick={handleDownload}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Download Excel
        </button>
      </h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
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
            return <option key={dayNum} value={dayNum}>{dayNum}</option>;
          })}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-400 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">S.no</th>
              <th className="border p-2">Row Labels</th>
              <th className="border p-2">Total Count of Flight</th>
              <th className="border p-2">GPU USAGE</th>
              <th className="border p-2">PCA USAGE</th>
              <th className="border p-2">Usage Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(operatorData).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 p-4">
                  No records found.
                </td>
              </tr>
            )}
            {Object.entries(operatorData).map(([operator, data], idx) => {
              const { totalFlights, gpuUsage, pcaUsage, usagePercent } = calculateUsage(data.flights);
              return (
                <React.Fragment key={operator}>
                  <tr className="bg-gray-50 font-bold">
                    <td className="border p-2">{idx + 1}</td>
                    <td className="border p-2">{operator}</td>
                    <td className="border p-2">{totalFlights}</td>
                    <td className="border p-2">{gpuUsage}</td>
                    <td className="border p-2">{pcaUsage}</td>
                    <td className="border p-2">{usagePercent}</td>
                  </tr>
                  {Object.entries(data.airlines).map(([airline, flights]) => {
                    const aTotalFlights = flights.length;
                    const aGPUUsage = flights.filter((f) => f.gpuStart && f.gpuEnd).length;
                    const aPCAUsage = flights.filter((f) => f.pcaStart && f.pcaEnd).length;
                    return (
                      <tr key={`${operator}-${airline}`}>
                        <td className="border p-2"></td>
                        <td className="border p-2">{airline}</td>
                        <td className="border p-2">{aTotalFlights}</td>
                        <td className="border p-2">{aGPUUsage}</td>
                        <td className="border p-2">{aPCAUsage}</td>
                        <td className="border p-2"></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {Object.entries(operatorData).length > 0 && (
              <tr className="bg-gray-200 font-bold">
                <td className="border p-2" colSpan={2}>TOTAL</td>
                <td className="border p-2">{allFlights}</td>
                <td className="border p-2">{totalGPU}</td>
                <td className="border p-2">{totalPCA}</td>
                <td className="border p-2">{totalUsagePercent}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
