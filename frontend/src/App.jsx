import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Constituencies from './pages/Constituencies';
import ConstituencyDetail from './pages/ConstituencyDetail';
import Provinces from './pages/Provinces';
import MapPage from './pages/MapPage';
import Footer from './components/Footer';

// Inner component so it can read context
function AppShell() {
  const { dark } = useApp();

  // Apply data-theme to <html> so CSS vars cascade everywhere
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.style.background = dark ? '#0D1117' : '#F0F2F5';
    document.body.style.color = dark ? '#FFFFFF' : '#111827';
  }, [dark]);

  return (
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
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppShell />
      </Router>
    </AppProvider>
  );
}

export default App;
