import { useState, useEffect, useRef } from "react";

import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import bgDesk from "./assets/pattern-bg-desktop.png";
import bgMob from "./assets/pattern-bg-mobile.png";

function App() {
  const loadingVariants = {
    animation: {
      x: [-100, 100],

      transition: {
        x: {
          repeat: Infinity,
          yoyo: Infinity,
          duration: 1,
        },
        y: {
          repeat: Infinity,
          yoyo: Infinity,
          duration: 1,
        },
      },
    },
  };

  const iconArrow = (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="14">
      <path fill="none" stroke="#FFF" strokeWidth="3" d="M2 1l6 6-6 6" />
    </svg>
  );

  const iconLocation = (
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="56">
      <path
        fillRule="evenodd"
        d="M39.263 7.673c8.897 8.812 8.966 23.168.153 32.065l-.153.153L23 56 6.737 39.89C-2.16 31.079-2.23 16.723 6.584 7.826l.153-.152c9.007-8.922 23.52-8.922 32.526 0zM23 14.435c-5.211 0-9.436 4.185-9.436 9.347S17.79 33.128 23 33.128s9.436-4.184 9.436-9.346S28.21 14.435 23 14.435z"
      />
    </svg>
  );
  const mapRef = useRef(null);
  const [deviceLocation, setDeviceLocation] = useState([]);
  const [ipLoading, setIpLoading] = useState(true);
  const [searchedIP, setSearchedIP] = useState("");

  const [ipAddress, setIpAddress] = useState("--");
  const [iPLocation, setIpLocation] = useState("--");
  const [timeZone, setTimezone] = useState("--");
  const [isp, setIsp] = useState("--");

  const getIP = "https://api.ipify.org?format=json";
  const [getIpData, setGetIpData] = useState(
    `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=${searchedIP}`
  );

  const [apiData, setApiData] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

  const fetchIP = async () => {
    try {
      const response = await fetch(getIP);

      if (!response.ok) {
        throw new Error("Could'nt get device IP");
      }

      const data = await response.json();
      setIpAddress(data.ip);
      setGetIpData(
        `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=${data.ip}`
      );
      console.log(data.ip);
    } catch (err) {
      console.log(err);
    } finally {
      setIpLoading(false);
    }
  };

  const fetchIpData = async () => {
    try {
      const response = await fetch(getIpData);

      if (!response.ok) {
        throw new Error(`Could'nt get IP data`);
      }

      const data = await response.json();

      setDeviceLocation([data.location.lat, data.location.lng]);
      setIpAddress(data.ip);
      setIpLocation(data.location.city);
      setTimezone(data.location.timezone);
      setIsp(data.isp);

      console.log(data);
    } catch (err) {
      setApiError(err);
      console.log(err);
    } finally {
      setApiLoading(false);
    }
  };

  //fetch IP address on initial page load
  useEffect(() => {
    fetchIP();
  }, []);

  //fetch IP data when IP address has finished loading
  useEffect(() => {
    fetchIpData();
  }, [ipLoading]);

  //update link to get IP data when user types
  useEffect(() => {
    setGetIpData(
      `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=${searchedIP}`
    );
  }, [searchedIP]);

  //update map when device location changes
  useEffect(() => {
    const mapView = mapRef.current;

    if (mapView) {
      mapView.setView(deviceLocation);
      mapView.setZoom(17);
    }
  }, [deviceLocation]);

  return (
    <div className="App">
      <header className="bg-[url('./assets/pattern-bg-mobile.png')] lg:bg-[url('./assets/pattern-bg-desktop.png')]">
        <h1 className="heading">IP Address Tracker</h1>

        <form
          className="inputGrp"
          onSubmit={(e) => {
            e.preventDefault();
            fetchIpData();
            setSearchedIP("");
          }}
        >
          <input
            type="text"
            value={searchedIP}
            onChange={(e) => setSearchedIP(e.target.value)}
          />
          <button
            className="submitBtn"
            onClick={(e) => {
              e.preventDefault();
              fetchIpData();
              setSearchedIP("");
            }}
          >
            {iconArrow}
          </button>
        </form>

        <div className="displayResults">
          <div className="resultContainer">
            <h3 className="resultHeading">ip address</h3>
            <p className="result">{ipAddress}</p>
          </div>

          <div className="resultContainer">
            <h3 className="resultHeading">location</h3>
            <p className="result">{iPLocation}</p>
          </div>

          <div className="resultContainer">
            <h3 className="resultHeading">timezone</h3>
            <p className="result">{timeZone}</p>
          </div>

          <div className="resultContainer">
            <h3 className="resultHeading">isp</h3>
            <p className="result">{isp}</p>
          </div>
        </div>
      </header>

      {apiLoading && (
        <div className="mapContainer">
          <h1 className="pt-48 lg:pt-32 text-3xl text-center text-white font-bold">
            Loading...
          </h1>
        </div>
      )}

      {!apiLoading && deviceLocation.length > 0 && (
        <div id="map" className="z-0">
          <MapContainer
            center={deviceLocation}
            zoom={13}
            scrollWheelZoom={false}
            className="mapContainer"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={deviceLocation}>
              <Popup>You are here</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default App;
