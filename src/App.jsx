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

function App() {
  const [position, setPosition] = useState([0, 0]);
  const [ipPosition, setIpPosition] = useState([]);

  const [load, setLoad] = useState(true);

  const [apiLoading, setApiLoading] = useState(false);
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

  //GET DEVICE LOCATION FOR THE MAPS INITIAL LOAD
  const getLocation = (e) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (e) => {
          console.log(e);
          setPosition([e.coords.latitude, e.coords.longitude]);
          //setPosition(ipPosition);
          //console.log(position);
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

  //fetch data and get location when ipAddress changes
  useEffect(() => {
    getLocation();
    //fetchData();
  }, []);

  //FETCH IP ADDRESS WHENEVER DEVICE LOCATION CHANGES
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        //fetching device IP
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        console.log(data);

        setIpAddress(data.ip);

        setApiLink(
          `https://geo.ipify.org/api/v2/country,city?apiKey=at_xFRAXtrPbpaoVAwKOkSYAXyH9bveA&ipAddress=${data.ip}`
        );

        coords.load(apiLink);
        //setIpPosition([data.latitude, data.longitude]);
      } catch (error) {
        console.error("Error fetching IP address: ", error);
      }
    };

    fetchIpAddress();
  }, [position]);

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
      setIpPosition([data.location.lat, data.location.lng]);

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

  // useEffect(() => {
  //   fetchData();
  // }, [position, apiLink]);

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

      <div id="mapContainer" onClick={getLocation}>
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
          <MapContainer center={position} zoom={12} scrollWheelZoom={false}>
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
