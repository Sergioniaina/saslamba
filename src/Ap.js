import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import "./components/main.css"
import MachineManagementPage from './pages/MachineManagementPage';
import SubscriptionManager from './components/SubscriptionManager';

function Ap() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/v" element={<SubscriptionManager />} />
          <Route path="/machines" element={<MachineManagementPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default Ap;
