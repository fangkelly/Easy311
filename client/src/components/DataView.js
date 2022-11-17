import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faChevronDown,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import neighborhoods from "../data/neighborhoods.json";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const PHL_BBOX = "-75.353877, 39.859018, -74.92068962905012, 40.14958609050669";

const CATEGORY_OPTIONS = [
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

const CATEGORY_MINUS_OTHER = CATEGORY_OPTIONS.filter(
  (category) => category != "Other"
);

const TIME_RANGE = [
  "All time",
  "This year",
  "This month",
  "This week",
  "Today",
];

const NEIGHBORHOODS = neighborhoods;

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

function DropDown({ timeRange, setTimeRange, toggleDD, setToggleDD }) {
  return (
    <div id="data-dd">
      <div className="dd-toggle" onClick={(e) => setToggleDD(!toggleDD)}>
        <p>{timeRange}</p>
        <FontAwesomeIcon icon={faChevronDown} />
        {toggleDD && (
          <div className="dd-items">
            {TIME_RANGE.map((item, index) => {
              return (
                <>
                  {index > 0 && <hr key={`${item}-hr`}></hr>}
                  <div
                    key={`${item}-dd`}
                    className={"dd-item"}
                    onClick={() => {
                      setTimeRange(item);
                    }}
                  >
                    {item}
                  </div>
                </>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DataView({
  timeRange,
  setTimeRange,
  neighborhood,
  setNeighborhood,
  coordDict,
  neighborhoodDict,
}) {
  const [toggleDD, setToggleDD] = useState(false);
  const [geocodingRes, setGeocodingRes] = useState([]);
  const [locationSearch, setLocationSearch] = useState(null);
  const [inputFocus, setInputFocus] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    forwardGeocoding(locationSearch);
  }, [locationSearch]);

  // TODO: get stats
  useEffect(() => {
    let serviceStats = {};
    let total = 0;

    if (neighborhood) {
      let subset = neighborhoodDict[neighborhood.properties.listname];
      // TODO: handle citywide case
      if (subset) {
        for (const coord of subset) {
          total += 1;
          const info = coordDict[coord];
          let key = info.properties.service_name;
          if (!CATEGORY_MINUS_OTHER.includes(key)) {
            key = "Other";
          }
          if (serviceStats[key]) {
            serviceStats[key].Total += 1;
            serviceStats[key][info.properties.status] += 1;
          } else {
            serviceStats[key] = { Total: 1, Open: 0, Closed: 0 };
          }
        }

        setStats((stats) => {
          return { ...stats, serviceStats: serviceStats, total: total };
        });
      }
    }
  }, [neighborhoodDict, neighborhood]);

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
    <div className="card card-style">
      <div className="data-container">
        <div className="data-section">
          <p className="nor-name">
            {neighborhood ? neighborhood?.properties?.listname : "Philadelphia"}
          </p>
        </div>
        <div className="data-section">
          <p className="data-title">Number of Requests</p>
          <div className="nor-stat">
            <p className="nor-count">132,234</p>
            <div className={"negative-trend trend"}>
              <FontAwesomeIcon icon={faCaretUp} size={"2xl"} />
              <p className="nor-trend">12%</p>
            </div>
          </div>
          <p className="nor-sub">compared to last year</p>
          <div className="dataView-filter">
            <div style={{ position: "relative" }}>
              <input
                type="search"
                value={
                  neighborhood?.properties?.listname ||
                  neighborhood?.place_name.split(",")[0] ||
                  locationSearch
                }
                id="dataView-searchBar"
                placeholder={"Search Neighborhood"}
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

            <DropDown
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              toggleDD={toggleDD}
              setToggleDD={setToggleDD}
            />
          </div>
          <div style={{ height: "30vh" }}></div>
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
          <div className="flexCol">
            {CATEGORY_OPTIONS.map((category) => {
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
                    <p className="font-16">{category}</p>
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
                          perc_resolved > -1
                            ? `${Math.round(perc_resolved)}%`
                            : 0
                        }`,
                      }}
                    ></div>
                  </div>
                  <p className="nor-sub"> Average Closed Time: 21 Days</p>
                  <p className="nor-sub">
                    {" "}
                    Agency Responsible: Streets Department
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
