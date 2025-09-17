import React from 'react';
import ReactDOM from 'react-dom/client';
import VehicleDashboardMap from './VehicleDashboardMap.jsx'; 
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VehicleDashboardMap />
  </React.StrictMode>
);
