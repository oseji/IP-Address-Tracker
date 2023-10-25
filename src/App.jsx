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

function App() {
  const [position, setPosition] = useState([0, 0]);
  const [load, setLoad] = useState(true);

  const [apiLoading, setApiLoading] = useState(false);
  const [data, setData] = useState(null);
  const [country, setCountry] = useState("");

  const [apiLink, setApiLink] = useState(
    `https://geo.ipify.org/api/v2/${country}}?apiKey=at_YqU1rh19CMul6kttwJmJ9QtkVfx7K&ipAddress=8.8.8.8`
  );
  const [error, setError] = useState(null);

  const apiiii = `https://geo.ipify.org/api/v2/country?apiKey=at_YqU1rh19CMul6kttwJmJ9QtkVfx7K&ipAddress=8.8.8.8`;

  useEffect(() => {
    const fetchData = async () => {
      setApiLoading(true);

      try {
        const response = await fetch(apiiii);

        if (!response.ok) {
          throw new Error(`Network response wasnt okay`);
        }
        const data = await response.json();
        setData(data);
        console.log(data);
      } catch (error) {
        setError(error);
        if (error) {
          alert(error.message);
        }
      } finally {
        setApiLoading(false);
      }
    };

    fetchData();
  }, []);

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
    } catch (error) {
      setError(error);
      if (error) {
        alert(error.message);
      }
    } finally {
      setApiLoading(false);
    }
  };

  const getLocation = (e) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (e) => {
          console.log(e);
          setPosition([e.coords.latitude, e.coords.longitude]);
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

  const submitBtn = (e) => {
    e.preventDefault();
    console.log(country);

    fetchData();

    setCountry("");
  };

  useEffect(() => {
    setApiLink(
      `https://geo.ipify.org/api/v2/${country}?apiKey=at_YqU1rh19CMul6kttwJmJ9QtkVfx7K&ipAddress=8.8.8.8`
    );
  }, [country]);

  useEffect(() => {
    getLocation();
  }, []);

  if (!load) {
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

        <div id="mapContainer" onClick={getLocation}>
          {load && (
            <div className="loadingScreen">
              <h1 className="text-center text-xl lg:text-4xl mt-32 lg:mt-52 font-semibold">
                Loading please wait....
              </h1>
            </div>
          )}

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
}

export default App;
