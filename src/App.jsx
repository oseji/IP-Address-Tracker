import { useState } from "react";

import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import iconArrow from "./assets/icon-arrow.svg";

function App() {
  const [count, setCount] = useState(0);
  const [position, setPosition] = useState([6.5243793, 3.3792057]);

  return (
    <div className="app">
      <header>
        <h1 className="heading">IP Address Tracker</h1>

        <div className="searchSection">
          <input
            type="text"
            className="searchBar"
            placeholder="Search for any IP address or domain"
          />
          <button className="searchBtn">
            <img src={iconArrow} alt="Arrow" className="arrowImg" />
          </button>
        </div>

        <div className="IPDetailsContainer">
          <div className="IPDetail">
            <h1 className="detailHeading">ip address</h1>
            <p className="detailInfo">192.212.174.101</p>
          </div>
          <div className="IPDetail border-x lg:border-slate-300">
            <h1 className="detailHeading">location</h1>
            <p className="detailInfo">Brooklyn,NY 10001</p>
          </div>
          <div className="IPDetail border-r lg:border-slate-300">
            <h1 className="detailHeading">timezone</h1>
            <p className="detailInfo">UTC -5:00</p>
          </div>
          <div className="IPDetail">
            <h1 className="detailHeading">isp</h1>
            <p className="detailInfo">SpaceX Starlink</p>
          </div>
        </div>
      </header>

      <div id="mapContainer">
        <MapContainer center={position} zoom={8} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>Marker</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
