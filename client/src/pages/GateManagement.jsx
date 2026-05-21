// src/pages/GateManagement.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { BASE_URL } from "../config";

const GateManagement = () => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const qrRefs = useRef({});

  // Fetch gates
  const fetchGates = async () => {
    try {
      setErrorMsg(null);
      const res = await axios.get(`${BASE_URL}/api/gates`);
      setGates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch gates:", err);
      setErrorMsg("Unable to fetch gates. Please try again.");
    }
  };

  // Add new gate
  const addGate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/gates`);
      await fetchGates();
    } catch (err) {
      console.error("Failed to add gate:", err);
      setErrorMsg("Failed to add new gate.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a gate
  const deleteGate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gate?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/gates/${id}`);
      await fetchGates();
    } catch (err) {
      console.error("Failed to delete gate:", err);
      setErrorMsg("Failed to delete gate.");
    }
  };

  // Download QR code
  const downloadQR = (id, name) => {
    const qrCanvas = qrRefs.current[id];
    if (!qrCanvas) {
      alert("QR code not ready yet. Try again.");
      return;
    }

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = qrCanvas.width;
    finalCanvas.height = qrCanvas.height;

    const ctx = finalCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(qrCanvas, 0, 0);

    const dataUrl = finalCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${name}_QRCode.png`;
    link.click();
  };

  useEffect(() => {
    fetchGates();
  }, []);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
        Gate Management
      </h1>

      {/* Add Gate Button */}
      <form onSubmit={addGate} className="flex justify-center mb-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add New Gate"}
        </button>
      </form>

      {/* Error message */}
      {errorMsg && (
        <p className="text-red-600 text-center mb-4">{errorMsg}</p>
      )}

      {/* Gate Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm md:text-base">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="text-left p-3 whitespace-nowrap">Serial No</th>
              <th className="text-left p-3 whitespace-nowrap">Gate Name</th>
              <th className="text-center p-3 whitespace-nowrap">QR Code</th>
              <th className="text-center p-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gates.map((gate) => (
              <tr key={gate.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{gate.serial_no || "-"}</td>
                <td className="p-3">{gate.gate_name || "-"}</td>
                <td className="p-3 text-center">
                  <div
                    className="space-y-2 flex flex-col items-center"
                    ref={(el) => {
                      if (el) {
                        const canvas = el.querySelector("canvas");
                        if (canvas) qrRefs.current[gate.id] = canvas;
                      }
                    }}
                  >
                    <QRCodeCanvas
                      value={`Gate:${gate.gate_name}-${gate.serial_no}`}
                      size={100}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      includeMargin
                    />
                  </div>
                </td>
                <td className="p-3 text-center space-y-2 flex flex-col items-center">
                  <button
                    onClick={() => downloadQR(gate.id, gate.gate_name)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-sm"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => deleteGate(gate.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {gates.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-500 p-4"
                >
                  No gates added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GateManagement;
