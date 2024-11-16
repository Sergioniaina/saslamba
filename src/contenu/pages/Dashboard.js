import React from "react";
import Sidebar from "./Sidebar";
import Dropdown from "./Dropdown";
// import "../css/dashboard.css";
import SignUp from "../../connexion/pages/SignUp";
import ClientPages from "../../connexion/pages/ClientPages";
import Test from "../../connexion/pages/Test";
import Historique from "../../connexion/pages/Historique";
import { Route, Routes } from "react-router-dom";

function Dashboard() {
  return (
    <div className="dashboard">
      <div>
        <Dropdown />
      </div>
      <main className="main">
        <Sidebar className="sidebar" />
        <div className="content">
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/historique" element={<ClientPages />} />
            <Route path="/test" element={<Test />} />
            <Route path="/settings" element={<Historique />} />
            <Route path="/about" element={<ClientPages />} />
            <Route path="/contact" element={<Historique />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
