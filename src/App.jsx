import { useState, useEffect, useRef } from "react";

import { motion } from "framer-motion";
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
import { map } from "leaflet";

function App() {
  const [position, setPosition] = useState([0, 0]);
  const [ipPosition, setIpPosition] = useState([0, 0]);

  const [load, setLoad] = useState(true); //this is for location loading

  const [apiLoading, setApiLoading] = useState(false);
  const [isIpSet, setIsIpSet] = useState(false);
  const [data, setData] = useState(null);
  const [country, setCountry] = useState("");
  const [inputIP, setInputIP] = useState("");

  const [ipAddress, setIpAddress] = useState("loading");
  const [city, setCity] = useState("loading");

  const [ipType, setIpType] = useState("loading");

  const [apiLink, setApiLink] = useState(
    `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=8.8.8.8`
  );

  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const mapview = mapRef.current;

  //FUNCTIONS
  const getLocation = (e) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (e) => {
          console.log(e);
          setPosition([e.coords.latitude, e.coords.longitude]);

          setLoad(false);
        },
        (err) => {
          setError(err.message);
          //alert(error);
        }
      );
    } else {
      setError("Geolocation is currently not supported by this device");
    }
  };

  const fetchIpAddress = async () => {
    try {
      //fetching device IP
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();

      setIpAddress(data.ip);

      setApiLink(
        `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=${data.ip}`
      );
    } catch (error) {
      console.error("Error fetching IP address: ", error);
    } finally {
      setIsIpSet(true);
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

      setCity(data.location.city);
      setCountry(data.location.country);
      setIpType(data.isp);
      setPosition([data.location.lat, data.location.lng]);

      // if (map) {
      //   map.setView(position);
      // }

      console.log(position, ipPosition, apiLink);
    } catch (error) {
      setError(error);
      // if (error) {
      //   alert(error.message);
      // }
    } finally {
      setApiLoading(false);
    }
  };

  const submitBtn = (e) => {
    e.preventDefault();
    console.log(inputIP, position);

    setIpAddress(inputIP);

    fetchData();

    setInputIP("");
  };

  useEffect(() => {
    getLocation();
  }, []);

  //UPDATE MAP WHEN POSITION CHANGES
  useEffect(() => {
    const mapView = mapRef.current;
    if (mapView) {
      mapView.setView(position);
      mapView.setZoom(17);
    }
  }, [position]);

  //FETCH IP ADDRESS WHENEVER DEVICE LOCATION CHANGES
  useEffect(() => {
    fetchIpAddress();
  }, [position]);

  //FETCH NEW DATA ABOUT IP WHEN IP ADDRESS HAS BEEN SET
  useEffect(() => {
    fetchData();
  }, [isIpSet]);

  const loadingVariants = {
    animation: {
      x: [-100, 100],
      // y: [100, -70, 100],

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

  return (
    <div className="app">
      <header className=" bg-[url('./assets/pattern-bg-mobile.png')] lg:bg-[('./assets/pattern-bg-desktop.png')]">
        <h1 className="heading">IP Address Tracker</h1>

        <div className="searchSection">
          <input
            type="text"
            className="searchBar"
            placeholder="Search for any IP address or domain"
            value={inputIP}
            onChange={(e) => {
              setInputIP(e.target.value);
              setApiLink(
                `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=${e.target.value}`
              );
              console.log(inputIP);
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
            <h1 className="detailHeading">city</h1>
            <p className="detailInfo">{city}</p>
          </div>
          <div className="IPDetail border-r lg:border-slate-300">
            <h1 className="detailHeading">country</h1>
            <p className="detailInfo">{country}</p>
          </div>
          <div className="IPDetail">
            <h1 className="detailHeading">type</h1>
            <p className="detailInfo">{ipType}</p>
          </div>
        </div>
      </header>

      <div id="mapContainer">
        {/* if location data is still loading */}
        {load && (
          <div className="loadingScreen">
            {/* <div className="flex flex-row items-center justify-center gap-5">
              <h1 className="text-center text-xl lg:text-4xl mt-32 lg:mt-52 font-semibold">
                Loading please wait....
              </h1>

             
            </div> */}

            <motion.div
              variants={loadingVariants}
              animate="animation"
              className="loader"
            ></motion.div>
          </div>
        )}

        {/* if location data is done loading */}
        {!load && (
          <MapContainer
            ref={mapRef}
            center={position}
            zoom={12}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>You are here</Popup>
            </Marker>
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default App;
