import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// import icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinus,
  faCaretDown,
  faCaretUp,
  faCircle,
  faXmark,
  faBell,
} from "@fortawesome/free-solid-svg-icons";

// import turf packages
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

//import data
import neighborhoods from "../data/neighborhoods.json";

// import components
import DonutChart from "./DonutChart";
import DropDown from "./DropDown";

// map constants
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const PHL_BBOX = "-75.353877, 39.859018, -74.92068962905012, 40.14958609050669";

let CATEGORY_OPTIONS = [
  "Illegal Dumping",
  "Rubbish and Recycling",
  "Abandoned Vehicle",
  "Pothole Repair",
  "Graffiti Removal",
  "Vacant Lots",
  "Street Light Outage",
  "Property Maintenance",
  "Street Trees",
  "Other",
];

let DEPARTMENTS = {
  "Illegal Dumping": "Streets Department",
  "Rubbish and Recycling": "Streets Department",
  "Abandoned Vehicle": "Police Department",
  "Pothole Repair": "Streets Department",
  "Graffiti Removal": "Community Life Improvement Program",
  "Vacant Lots": "License & Inspections",
  "Street Light Outage": "Streets Department",
  "Property Maintenance": "License & Inspections",
  "Street Trees": "Streets Department",
  Other: "Various",
};

const TIME_RANGE = [ "Last 30 days", "Last 7 days", "Today"];

const compareTime = {
  "Last 6 Months": "the 6 months before",
  "Last 3 Months": "the 3 months before",
  "Last 30 days": "the month before",
  "Last 7 days": "the week before",
  Today: "the day before",
};

// given a point, return neighborhood object it falls in
const pointInNeighborhood = (coord) => {
  for (let i = 0; i < neighborhoods.features.length; i++) {
    if (
      booleanPointInPolygon(
        coord,
        polygon(neighborhoods.features[i].geometry.coordinates[0])
      )
    ) {
      return neighborhoods.features[i];
    }
  }
  return null;
};

function SearchBox({ neighborhood, setNeighborhood }) {
  const [inputFocus, setInputFocus] = useState(false);
  const [geocodingRes, setGeocodingRes] = useState([]);
  const [locationSearch, setLocationSearch] = useState(null);

  useEffect(() => {
    forwardGeocoding(locationSearch);
  }, [locationSearch]);

  const forwardGeocoding = () => {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${locationSearch}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5&bbox=${PHL_BBOX}&proximity=ip&types=place,address,district,postcode,neighborhood,locality`;
    // const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${locationSearch}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5&bbox=${PHL_BBOX}&proximity=ip&types=neighborhood`;

    axios
      .get(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        let results = [];
        for (const r of res.data.features) {
          let n = pointInNeighborhood(r.geometry.coordinates);
          if (n) results.push([r.place_name, n]);
        }
        setGeocodingRes(results);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="search"
        value={
          neighborhood?.properties?.listname ||
          neighborhood?.place_name.split(",")[0] ||
          locationSearch
        }
        id="dataView-searchBar"
        placeholder={"Location"}
        onChange={(e) => {
          setNeighborhood(null);
          setLocationSearch(e.target.value);
        }}
        onFocus={(e) => setInputFocus(true)}
      ></input>
      {geocodingRes.length > 0 && inputFocus && (
        <div className={"dd-items"}>
          {geocodingRes.map((res, index) => {
            return (
              <>
                {index > 0 && <hr key={`${res}-hr`}></hr>}
                <div
                  className="dd-item"
                  onClick={() => {
                    setNeighborhood(res[1]);
                    setInputFocus(false);
                  }}
                >
                  {res[0]}
                </div>
              </>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DataView({
  timeRange,
  setTimeRange,
  neighborhood,
  setNeighborhood,
  stats,
  setDataView,
}) {
  function sortCategory(array) {
    const nans = array.filter(
      (a) => !Object.keys(stats.serviceStats).includes(a)
    );
    const not_nan = array.filter((a) =>
      Object.keys(stats.serviceStats).includes(a)
    );
    not_nan.sort(function (a, b) {
      var x = stats?.serviceStats[a]?.Closed / stats?.serviceStats[a]?.Total;
      var y = stats?.serviceStats[b]?.Closed / stats?.serviceStats[b]?.Total;
      return y - x;
    });
    return not_nan;
  }

  const getAverageTime = (category) => {
    if (stats.serviceStats[category].Closed < 1) {
      return "NA";
    } else {
      let timeRes_sec =
        stats.serviceStats[category].running_time /
        (stats.serviceStats[category].Closed * 1000);
      if (timeRes_sec > 604800) {
        return `${(timeRes_sec / 604800).toFixed(2)} weeks`;
      } else if (timeRes_sec > 86400) {
        return `${(timeRes_sec / 86400).toFixed(2)} days`;
      } else if (timeRes_sec > 3600) {
        return `${(timeRes_sec / 3600).toFixed(2)} hours`;
      } else {
        return `${(timeRes_sec / 60).toFixed(2)} minutes`;
      }
    }
  };

  const handleScroll = () =>
    (document.getElementById("tooltip").style.display = "none");

  const getProgressBars = () => {
    let sortedCategories = sortCategory(CATEGORY_OPTIONS);
    let pb = sortedCategories.map((category) => {
      let perc_resolved;
      if (stats?.serviceStats[category]) {
        perc_resolved = (
          (100 * stats.serviceStats[category].Closed) /
          stats.serviceStats[category].Total
        ).toFixed(2);
      } else {
        perc_resolved = -1;
      }
      return (
        <div className="flexCol-sm" key={category}>
          <div className="flexRow">
            <p className="font-16">
              {category === "Rubbish and Recycling"
                ? "Missed Trash & Recycling Pickup"
                : category}
            </p>
            <p className="font-16">
              {perc_resolved > -1 ? `${perc_resolved}%` : "NA"}
            </p>
          </div>
          <div
            className={`progress-bar-container ${
              perc_resolved > -1 ? "active" : "inactive"
            }`}
          >
            <div
              className="progress-bar"
              style={{
                width: `${
                  perc_resolved > -1 ? `${Math.round(perc_resolved)}%` : 0
                }`,
              }}
            ></div>
          </div>
          <p className="nor-sub">
            {" "}
            Average Closed Time: {getAverageTime(category)}
          </p>
          <p className="nor-sub">
            {" "}
            Agency Responsible: {DEPARTMENTS[category]}
          </p>
        </div>
      );
    });
    return pb;
  };

  useEffect(() => {
    const dataContainer = document.getElementById("data-container");
    dataContainer.addEventListener("scroll", () => {
      handleScroll();
    });
    return () => {
      dataContainer.removeEventListener("scroll", () => {
        handleScroll();
      });
    };
  }, []);

  const [toggleSubscribe, setToggleSubscribe] = useState(false);
  const [subEmail, setSubEmail] = useState("");

  const handleSubscribe = (subType, subTo) => {
    const email = subEmail;
    setSubEmail("");
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (re.test(email)) {

      const data = {
        email: email,
        subType: subType,
        subTo: subTo
      }

      fetch("/add_subscription", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          console.log(res);
        })
        .then((d) => console.log(d));
    } else {
      // if not a valid email
      document.getElementById("sub-input").style.border = "1px solid red";
    }
  };

  return (
    <div className="card card-style">
      <div className="card-container" id={"data-container"}>
        <div className="data-section">
          <div className="x-header position-relative">
            <p className="nor-name position-relative">
              {neighborhood
                ? neighborhood?.properties?.listname
                : "Philadelphia"}{" "}
              &nbsp;
              <FontAwesomeIcon
                icon={faBell}
                className={"fa-2xs"}
                onClick={() => {
                  setToggleSubscribe(!toggleSubscribe);
                }}
              />
            </p>

            <FontAwesomeIcon
              icon={faXmark}
              color={"#A1A1A1"}
              size={"lg"}
              onClick={() => {
                setDataView(false);
              }}
            />
            {toggleSubscribe && (
              <div className="subscribe-container">
                <p>
                  Would you like to be notified of service requests made in the{" "}
                  {neighborhood?.properties?.listname} area?
                </p>
                <input
                  id="sub-input"
                  type="text"
                  placeholder="Your email here"
                  value={subEmail}
                  onChange={(e) => {
                    document.getElementById("sub-input").style.border = "none";
                    setSubEmail(e.target.value);
                  }}
                />
                <div className={"row-btn-container"}>
                  <button
                    className={"primary-btn-blue"}
                    onClick={() => {
                      handleSubscribe("neighborhoods", neighborhood?.properties?.listname);
                    }}
                  >
                    Subscribe
                  </button>
                  <button
                    className={"primary-btn-gray"}
                    onClick={() => {
                      setToggleSubscribe(false);
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="data-section">
          <p className="data-title">Number of Requests</p>
          <div className="nor-stat">
            <p className="nor-count">
              {stats?.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </p>

            <div
              className={`${
                stats.trend < 0
                  ? "negative-trend"
                  : stats.trend > 0
                  ? "positive-trend"
                  : "neutral-trend"
              } trend`}
            >
              <FontAwesomeIcon
                icon={
                  stats.trend > 0
                    ? faCaretUp
                    : stats.trend < 0
                    ? faCaretDown
                    : faMinus
                }
                size={"2xl"}
              />
              <p className="nor-trend">{stats.trend}%</p>
            </div>
          </div>
          <p className="nor-sub">compared to {compareTime[timeRange]}</p>
          <div className="dataView-filter">
            <SearchBox
              neighborhood={neighborhood}
              setNeighborhood={setNeighborhood}
            />

            <DropDown
              val={timeRange}
              setVal={setTimeRange}
              items={TIME_RANGE}
            />
          </div>
          {stats && (
            <DonutChart total={stats?.total} data={stats?.serviceStats} />
          )}
        </div>
        <div className="data-section">
          <p className="data-title">Requests Completed</p>
          <div className="rs-legend">
            <p className="nor-sub">Status of the service request</p>
            <div className="open-closed flexRow">
              <div className="open-closed-itm flexRow">
                <FontAwesomeIcon
                  icon={faCircle}
                  size={"2xs"}
                  color={"#484848"}
                />
                <p className="nor-sub">Opened</p>
              </div>
              <div className="open-closed-itm flexRow">
                <FontAwesomeIcon
                  icon={faCircle}
                  size={"2xs"}
                  color={"#48D89E"}
                />
                <p className="nor-sub">Closed</p>
              </div>
            </div>
          </div>
          <div className="flexCol">{getProgressBars()}</div>
        </div>
      </div>
    </div>
  );
}
