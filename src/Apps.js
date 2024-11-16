import React from 'react';
import './components/Apps.css'; // Global styles
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardCard from './components/DashboardCard';
import ss from "./images/ss.png"
//import { Chart } from 'chart.js';
function Apps() {
  return (
    <div className="App">
       
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="dashboard-cards">
          <DashboardCard title="Total Invoices" value="2478" color="#8D6E63" icon={ss} />
          <DashboardCard title="Paid Invoices" value="983" color="#81C784" icon="paid-icon.png" />
          <DashboardCard title="Unpaid Invoices" value="1256" color="#BA68C8" icon="unpaid-icon.png" />
          <DashboardCard title="Total Sent" value="652" color="#4DD0E1" icon="sent-icon.png" />
        </div>
        <div className="charts-section">
      
        </div>
      </div>
    </div>
  );
}

export default Apps;
