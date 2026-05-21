import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Form from './components/Form';
import Records from './components/ViewData';
import LoginPage from './pages/LoginPage';
import GateManagement from './pages/GateManagement';
import GPUUsageTable from './pages/GPUUsageTable';
import PCAUsageTable from './pages/PCAUsageTable';
import AirlineUsagePage from './pages/AirlineUsagePage';
import TotalAirlineBarCodeData from './pages/TotalAirlineBarCodeData';
import OperatorNameData from './pages/OperatorNameData';
import SerialNumberRows from './pages/SerialNumberRows';
import UsageDetailsOfAirlines from './pages/UsageDetailsOfAirlines';
import Simpledata from './pages/Simpledata';




function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/form" element={<Form />} />
          <Route path="/records" element={<Records />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/operator" element={<Form />} />
          <Route path="/gate_management" element={<GateManagement />} />
          <Route path="/gpu_usage_table" element={<GPUUsageTable />} />
          <Route path="/pca_usage_table" element={<PCAUsageTable />} />
          <Route path="/airline_usage_page" element={<AirlineUsagePage />} />
          <Route path="/total_airline_bar_code_data" element={<TotalAirlineBarCodeData />} />
          <Route path="/operator_name_data" element={<OperatorNameData />} />
          <Route path="/serial_number_rows" element={<SerialNumberRows />} />
          <Route path="/usage_details" element={<UsageDetailsOfAirlines />} />
          <Route path="/simple_data" element={<Simpledata />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
