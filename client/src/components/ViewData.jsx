import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function ViewData() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filters, setFilters] = useState({ flightNo: "", date: "" });

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let isMounted = true;

    axios
      .get(`${BASE_URL}/api/records`)
      .then((res) => {
        if (isMounted) {
          setRecords(res.data || []);
          setFilteredRecords(res.data || []);
        }
      })
      .catch((err) => console.error("Error fetching records:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    const filtered = records.filter((rec) => {
      const matchesFlight = rec.flightNo
        ?.toLowerCase()
        .includes(updatedFilters.flightNo.toLowerCase());
      const matchesDate = rec.date?.includes(updatedFilters.date);
      return matchesFlight && matchesDate;
    });

    setFilteredRecords(filtered);
    setCurrentPage(1); // reset to first page
  };

  const clearFilters = () => {
    setFilters({ flightNo: "", date: "" });
    setFilteredRecords(records);
    setCurrentPage(1);
  };

  // ✅ Duration calc
  const calculateDuration = useCallback((start, end) => {
    if (!start || !end) return "";
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diffMs = endTime - startTime;
    if (isNaN(diffMs)) return "";
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }, []);

  // ✅ Pagination slice
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  return (
    <div className="p-2 max-w-7xl mx-auto mt-6">
      <h2 className="text-3xl font-semibold mb-6 text-center">
        Saved Records
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          name="flightNo"
          value={filters.flightNo}
          onChange={handleFilterChange}
          placeholder="Filter by Flight No"
          className="border px-3 py-2 rounded shadow-sm w-full focus:outline-none focus:ring focus:border-blue-400"
        />
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          className="border px-3 py-2 rounded shadow-sm w-full focus:outline-none focus:ring focus:border-blue-400"
        />
        <button
          onClick={clearFilters}
          className="bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 transition"
        >
          Clear Filters
        </button>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <label className="mr-2">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 border">Flight No</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">GPU</th>
              <th className="p-3 border">GPU Duration</th>
              <th className="p-3 border">PCA</th>
              <th className="p-3 border">PCA Duration</th>
              <th className="p-3 border">Operator</th>
              <th className="p-3 border">Signature</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((rec, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border">{rec.flightNo}</td>
                  <td className="p-2 border">{rec.date}</td>
                  <td className="p-2 border">
                    {rec.gpuStart} - {rec.gpuEnd}
                  </td>
                  <td className="p-2 border">
                    {calculateDuration(rec.gpuStart, rec.gpuEnd)}
                  </td>
                  <td className="p-2 border">
                    {rec.pcaStart} - {rec.pcaEnd}
                  </td>
                  <td className="p-2 border">
                    {calculateDuration(rec.pcaStart, rec.pcaEnd)}
                  </td>
                  <td className="p-2 border">{rec.operatorName}</td>
                  <td className="p-2 border">
                    {rec.ghaSignature ? (
                      <img
                        src={`${BASE_URL}${rec.ghaSignature}`}
                        alt="Signature"
                        className="h-12 mx-auto object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No signature</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-gray-500 italic">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
