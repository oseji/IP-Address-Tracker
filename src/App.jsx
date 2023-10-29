import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import iconArrow from "./assets/icon-arrow.svg";
import mobileBg from "./assets/pattern-bg-mobile.png";
import desktopBg from "./assets/pattern-bg-desktop.png";

function App() {
  const [position, setPosition] = useState([0, 0]);
  const [ipPosition, setIpPosition] = useState(position);
  const [load, setLoad] = useState(true);

  const [apiLoading, setApiLoading] = useState(false);
  const [data, setData] = useState(null);
  const [country, setCountry] = useState("");

  const [ipAddress, setIpAddress] = useState("loading");
  const [location, setLocation] = useState("loading");
  const [timezone, setTimezone] = useState("loading");
  const [isp, setIsp] = useState("loading");

  const [apiLink, setApiLink] = useState(
    `https://geo.ipify.org/api/v2/country,city?apiKey=at_YqU1rh19CMul6kttwJmJ9QtkVfx7K&ipAddress=${ipAddress}`
  );
  const [error, setError] = useState(null);

  //fetch IP address
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
        setApiLink(
          `https://geo.ipify.org/api/v2/country,city?apiKey=at_YqU1rh19CMul6kttwJmJ9QtkVfx7K&ipAddress=${data.ip}`
        );
      } catch (error) {
        console.error("Error fetching IP address: ", error);
      }
    };

    fetchIpAddress();
  }, []);

  const getLocation = (e) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (e) => {
          console.log(e);
          //setPosition([e.coords.latitude, e.coords.longitude]);
          //console.log(position);
          setLoad(false);
        },
        (err) => {
          setError(err.message);
          alert(error);
        }
      );
    } else {
      setError("Geolocation is currently not supported by this device");
    }
  };

  const fetchData = async () => {
    setApiLoading(true);

    try {
      const response = await fetch(apiLink);

      if (!response.ok) {
        throw new Error(`Network response wasnt okay`);
      }
      const data = await response.json();
      setData(data);
      console.log(data);

      setLocation(data.location.region);
      setTimezone(data.location.timezone);
      setIsp(data.isp);
      setIpPosition([data.location.lat, data.location.lng]);
      console.log(position);
    } catch (error) {
      setError(error);
      // if (error) {
      //   alert(error.message);
      // }
    } finally {
      setApiLoading(false);
    }
  };

  //fetch data and get location when ipAddress changes
  useEffect(() => {
    getLocation();
    fetchData();
  }, [ipAddress]);

  // useEffect(() => {
  //   fetchData();
  // }, [ipAddress]);

  const submitBtn = (e) => {
    e.preventDefault();
    console.log(country, position);

    fetchData();

    setCountry("");
  };

  return (
    <div className="app">
      <header>
        <h1 className="heading">IP Address Tracker</h1>

        <div className="searchSection">
          <input
            type="text"
            className="searchBar"
            placeholder="Search for any IP address or domain"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
            }}
          />
          <button className="searchBtn">
            <img
              src={iconArrow}
              alt="Arrow"
              className="arrowImg"
              onClick={submitBtn}
            />
          </button>
        </div>

        <div className="IPDetailsContainer">
          <div className="IPDetail">
            <h1 className="detailHeading">ip address</h1>
            <p className="detailInfo">{ipAddress}</p>
          </div>
          <div className="IPDetail border-x lg:border-slate-300">
            <h1 className="detailHeading">location</h1>
            <p className="detailInfo">{location}</p>
          </div>
          <div className="IPDetail border-r lg:border-slate-300">
            <h1 className="detailHeading">timezone</h1>
            <p className="detailInfo">{timezone}</p>
          </div>
          <div className="IPDetail">
            <h1 className="detailHeading">isp</h1>
            <p className="detailInfo">{isp}</p>
          </div>
        </div>
      </header>

      <div id="mapContainer" onClick={getLocation}>
        {/* if location data is still loading */}
        {load && (
          <div className="loadingScreen">
            <h1 className="text-center text-xl lg:text-4xl mt-32 lg:mt-52 font-semibold">
              Loading please wait....
            </h1>
          </div>
        )}

        {/* if location data is done loading */}
        {!load && (
          <MapContainer center={position} zoom={8} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>Marker</Popup>
            </Marker>
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default App;
