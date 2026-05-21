import { useRef, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { useLocation, useNavigate } from 'react-router-dom';   // ✅ import useNavigate
import QRScanner from './QRScanner';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from '../config';

export default function GateForm() {
  const sigRef = useRef(null);
  const scannedRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();   // ✅ init navigate hook
  const username = location.state?.username || 'Operator';

  const [formData, setFormData] = useState({
    serialNo: '',
    gateName: '',
    flightNo: '',
    date: '',
    aircraftType: '',
    parkingStand: '',
    regNo: '',
    airline: '',
    onBlock: '',
    offBlock: '',
    origin: '',
    gpuStart: '',
    gpuEnd: '',
    pcaStart: '',
    pcaEnd: '',
    operatorName: '',
    shift: '',
    ghaName: '',
    ghaSignature: '',
  });

  const [started, setStarted] = useState({ gpu: false, pca: false, onBlock: false });
  const [loadingGate, setLoadingGate] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // ✅ Pre-fill date & operator name
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0],
      operatorName: username,
    }));
  }, [username]);

  // ✅ Current date (memoized)
  const today = useMemo(() => new Date().toLocaleDateString(), []);

  // ✅ Logout
  const handleLogout = () => {
    // Clear auth data (adjust as per your login flow)
    localStorage.removeItem('authToken');
    sessionStorage.clear();

    toast.info('Logged out successfully 👋');
    navigate('/'); // redirect to login page
  };

  // ✅ Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'flightNo' && value.length >= 2
        ? { airline: value.slice(0, 2).toUpperCase() }
        : {}),
    }));
  };

  // ✅ Helpers for time
  const getCurrentTimeString = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const setTimeNow = (fieldName) =>
    setFormData(prev => ({ ...prev, [fieldName]: getCurrentTimeString() }));

  const handleStartClick = (pairKey, startFieldName) => {
    setTimeNow(startFieldName);
    setStarted(prev => ({ ...prev, [pairKey]: true }));
  };

  const handleEndClick = (endFieldName) => setTimeNow(endFieldName);

  const handleNotNowClick = (pairKey, startFieldName, endFieldName) => {
    setFormData(prev => ({ ...prev, [startFieldName]: '', [endFieldName]: '' }));
    setStarted(prev => ({ ...prev, [pairKey]: false }));
  };

  // ✅ QR Scan
  const handleQRScan = async (text) => {
    if (!text || scannedRef.current) return;
    scannedRef.current = true;
    setShowScanner(false);
    setLoadingGate(true);

    const match = text.trim().match(/GATE:(.+)-(\d+)/i);
    if (!match) {
      toast.error('Invalid QR format. Expected: GATE:GateName-SerialNo');
      setLoadingGate(false);
      scannedRef.current = false;
      return;
    }

    const [ gateName, serialNo] = match;

    try {
      const res = await axios.get(`${BASE_URL}/api/gates`);
      const gate = res.data.find(
        g =>
          g.serial_no.toString() === serialNo.trim() &&
          g.gate_name.toLowerCase() === gateName.trim().toLowerCase()
      );

      if (!gate) {
        toast.warning('Gate not found');
        scannedRef.current = false;
        return;
      }

      setFormData(prev => ({
        ...prev,
        gateName: gate.gate_name,
        serialNo: gate.serial_no,
      }));
      toast.success('Gate loaded successfully ✅');
    } catch (err) {
      toast.error('Error fetching gate data');
    } finally {
      setLoadingGate(false);
    }
  };

  // ✅ Signature
  const clearSignature = () => {
    sigRef.current.clear();
    setFormData(prev => ({ ...prev, ghaSignature: '' }));
  };

  // ✅ Submit
  const handleSubmit = async () => {
    if (sigRef.current.isEmpty()) {
      toast.error('Please provide a GHA signature');
      return;
    }

    const signatureData = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    const blob = await (await fetch(signatureData)).blob();

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));
    formDataToSend.append('signature', blob, 'signature.png');

    try {
      await axios.post(`${BASE_URL}/api/records`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Record saved successfully 🎉');
      sigRef.current.clear();
    } catch {
      toast.error('Failed to submit record ❌');
    }
  };

  // ✅ Time field generator
  const renderTimePair = (label, pairKey, startFieldName, endFieldName) => (
    <div className="flex flex-col mb-4">
      <label className="text-base font-medium mb-1">{label}</label>
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
        <div className="flex gap-4">
          <input type="time" name={startFieldName} value={formData[startFieldName]} readOnly className="w-full sm:w-24 border border-gray-300 px-3 py-2 rounded-md bg-gray-100" />
          <input type="time" name={endFieldName} value={formData[endFieldName]} readOnly className="w-full sm:w-24 border border-gray-300 px-3 py-2 rounded-md bg-gray-100" />
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => handleStartClick(pairKey, startFieldName)} disabled={started[pairKey]} className={`w-full sm:w-auto px-3 py-2 rounded text-white text-sm ${started[pairKey] ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>Start</button>
          <button type="button" onClick={() => handleEndClick(endFieldName)} disabled={!started[pairKey]} className={`w-full sm:w-auto px-3 py-2 rounded text-white text-sm ${!started[pairKey] ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>End</button>
        </div>
        <button type="button" onClick={() => handleNotNowClick(pairKey, startFieldName, endFieldName)} className="w-full sm:w-auto px-3 py-2 rounded text-white text-sm bg-gray-600 hover:bg-gray-700">Not Now</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1000px] mx-auto p-4 sm:p-6 bg-white rounded-md shadow-md">
      <ToastContainer position="top-right" autoClose={3000} />

    {/* Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Gate Record Form</h1>
          <p className="text-xs text-gray-500">{today}</p>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">Welcome {username}! 👋</p>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* QR Scanner */}
      <button
        onClick={() => { setShowScanner(true); scannedRef.current = false; }}
        disabled={loadingGate || showScanner}
        className="mb-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded mt-10"
      >
        Scan Gate QR Code
      </button>

      {loadingGate && <p className="mb-4 text-sm">Loading gate data...</p>}
      {showScanner && <QRScanner onScanSuccess={handleQRScan} onClose={() => setShowScanner(false)} />}

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {[
          { name: "gateName", label: "Gate Name", readOnly: false, bg: "bg-gray-100" },
          { name: "serialNo", label: "Serial No", readOnly: false, bg: "bg-gray-100" },
          { name: "flightNo", label: "Flight No", placeholder: "e.g. AI123" },
          { name: "airline", label: "Airline", readOnly: true, bg: "bg-gray-100" },
          { name: "date", label: "Date", type: "date" },
          { name: "parkingStand", label: "Parking Stand" },
          { name: "regNo", label: "Registration No" },
          { name: "origin", label: "Origin" },
        ].map((field) => (
          <div key={field.name}>
            <label className="text-sm font-medium">{field.label}</label>
            <input
              name={field.name}
              type={field.type || "text"}
              placeholder={field.placeholder || ""}
              value={formData[field.name]}
              onChange={handleChange}
              readOnly={field.readOnly}
              className={`w-full border border-gray-300 p-2 rounded-md ${field.bg || ""}`}
            />
          </div>
        ))}

        {/* Aircraft Type */}
        <div className="flex flex-col">
          <label htmlFor="aircraftType" className="text-sm font-medium mb-1 text-gray-700">Aircraft Type</label>
          <select
            name="aircraftType"
            id="aircraftType"
            value={formData.aircraftType}
            onChange={handleChange}
            className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="Narrow">Narrow</option>
            <option value="Wide">Wide</option>
          </select>
        </div>
      </div>

      {/* Time Pairs */}
      {renderTimePair('On Block / Off Block', 'onBlock', 'onBlock', 'offBlock')}
      {renderTimePair('GPU Start / GPU End', 'gpu', 'gpuStart', 'gpuEnd')}
      {renderTimePair('PCA Start / PCA End', 'pca', 'pcaStart', 'pcaEnd')}

      {/* Operator */}
      <div className="mb-4">
        <label className="text-sm font-medium">Operator Name</label>
        <input name="operatorName" value={formData.operatorName} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-md" />
      </div>

      {/* GHA */}
      <div className="mb-4">
        <label className="text-sm font-medium">GHA Name</label>
        <input name="ghaName" value={formData.ghaName} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-md" />
      </div>

      {/* Signature */}
      <div className="mb-4">
        <label className="text-sm font-medium">GHA Signature</label>
        <SignatureCanvas penColor="black" ref={sigRef} canvasProps={{ className: 'w-full h-40 border border-gray-300 rounded-md' }} />
        <button type="button" onClick={clearSignature} className="mt-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
          Clear Signature
        </button>
      </div>

      {/* Submit */}
      <button type="button" onClick={handleSubmit} className="w-full px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded">
        Submit Record
      </button>
    </div>
  );
}
