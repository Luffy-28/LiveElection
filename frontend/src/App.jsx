import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Constituencies from './pages/Constituencies';
import ConstituencyDetail from './pages/ConstituencyDetail';
import Provinces from './pages/Provinces';
import MapPage from './pages/MapPage';
import Footer from './components/Footer';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/constituencies" element={<Constituencies />} />
              <Route path="/constituencies/:id" element={<ConstituencyDetail />} />
              <Route path="/provinces" element={<Provinces />} />
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
