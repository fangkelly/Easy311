import React, { useEffect, useState } from "react";
import axios from "axios";
import logo from "./icons/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faXmark,
  faEllipsis,
  faChevronDown,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import "./App.css";
import Map from "./components/Map.js";
import DataView from "./components/DataView";
import Sheet from "react-modal-sheet";
import Form from "react-bootstrap/Form";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

import neighborhoods from "./data/neighborhoods.json";

const MONTHS = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  10: "October",
  11: "November",
  12: "December",
};

const STATUS_OPTIONS = ["Open", "Closed"];
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

const NEIGHBORHOODS = neighborhoods;

const convertDate = (datetime) => {
  if (datetime) {
    let dt = datetime.split("T");
    let date = dt[0].split("-");
    let time = dt[1].slice(0, -1).split(":");

    date = `${MONTHS[date[1]]} ${date[2]}, ${date[0]}`;
    let convertedTime, AM;

    if (time[0] == 0) {
      convertedTime = 12;
      AM = true;
    } else if (time[0] < 12) {
      convertedTime = time[0];
      AM = true;
    } else {
      convertedTime = 24 - time[0];
      AM = false;
    }

    time[0] = convertedTime;
    time = time.join(":");

    return `${date} ${time} ${AM ? "AM" : "PM"}`;
  }
  return;
};

/**
 * App.
 * @constructor
 * @param {object[]} data - 311 service requests displayed on map.
 * @param {boolean} dataView - True if data analysis panel open.
 * @param {object} pointData - Single 311 service request.
 * @param {boolean} toggleFilter - Whether the filter is displayed or not.
 * @param {string[]} filterStatus - What status the user has filtered by.
 * @@param {string[]} filterCategory - What categories the user has filtered by.
 * @param {string} search - What the current search query is.
 */

function App() {
  const [data, setData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [dataView, setDataView] = useState(false);
  const [toggleFilter, setToggleFilter] = useState(false);
  const [pointData, setPointData] = useState(false);
  const [filterStatus, setFilterStatus] = useState(STATUS_OPTIONS);
  const [filterCategory, setFilterCategory] = useState(CATEGORY_OPTIONS);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("This week");
  const [neighborhood, setNeighborhood] = useState(null);

  let emptySet = new Set();

  // keeps track of all points we've seen and processed
  const [points, setPoints] = useState(emptySet);

  // maps hashed coordinate string keys to point objects representing individual service request
  const [coordDict, setCoordDict] = useState({});

  // maps neighborhoods to all points that within time frame inside the neighborhood 
  const [neighborhoodDict, setNeighborhoodDict] = useState({});

  useEffect(() => {
    fetch(
      `/data?status=${filterStatus}&category=${filterCategory}&search=${search}&time=${timeRange}`
    )
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [filterStatus, filterCategory, search, timeRange]);

  useEffect(() => {
    fetch(`/analysis_data?time=${timeRange}`)
      .then((res) => res.json())
      .then((data) => setAnalysisData(data));
  }, [timeRange]);


  useEffect(() => {
    if (analysisData) {
      let newCoordDict = coordDict;
      let newNeighborhoodDict = {};
      analysisData.map((d) => {
        const key = d.geometry.coordinates.toString();
        if (!points.has(key)) {
          newCoordDict[key] = d;
          // cache seen point
          points.add(key);
        }
        const coord = point(d.geometry.coordinates);
        for (let i = 0; i < neighborhoods.features.length; i++) {
          const nkey = neighborhoods.features[i].properties.listname;
          if (booleanPointInPolygon(coord, neighborhoods.features[i])) {
            if (newNeighborhoodDict[nkey]) {
              newNeighborhoodDict[nkey].push(key);
            } else {
              newNeighborhoodDict[nkey] = [key];
            }
            setNeighborhoodDict(newNeighborhoodDict);
            break;
          }
        }
      });
      setCoordDict(newCoordDict);
    }
  }, [analysisData]);

  return (
    <div className="App">
      <header className="App-header">
        <div id="App-header-logo-container">
          <img src={logo} className="App-logo" alt="logo" />
          <p>EASY 311</p>
        </div>
        <div id="App-header-settings-container">
          <p>EN</p>
          <FontAwesomeIcon
            icon={dataView ? faXmark : faChartColumn}
            color={"#A1A1A1"}
            size={"lg"}
            onClick={() => {
              setDataView(!dataView);
            }}
          ></FontAwesomeIcon>
        </div>
      </header>
      <div id={"map-container"}>
        <Map
          data={data}
          setDataView={setDataView}
          setPointData={setPointData}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
        />
        {dataView && (
          <DataView
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            neighborhood={neighborhood}
            setNeighborhood={setNeighborhood}
            coordDict={coordDict}
            neighborhoodDict={neighborhoodDict}
          />
        )}

        <Sheet
          isOpen={pointData ? true : false}
          onClose={() => setPointData(null)}
          detent={"content-height"}
        >
          <Sheet.Container>
            <Sheet.Header />
            <Sheet.Content>
              {
                <div className="bottomSheet">
                  <p className="backDrop-sub bold">
                    {pointData?.properties?.service_name}
                  </p>
                  <p className="backDrop-sub bold">Updates</p>
                  <VerticalTimeline lineColor={"#AAAAAA"}>
                    {[
                      "requested_datetime",
                      "updated_datetime",
                      "closed_datetime",
                    ].map((time) => {
                      let convertedDate = convertDate(
                        pointData?.properties?.[time]
                      );
                      if (convertedDate) {
                        return (
                          <VerticalTimelineElement
                            key={time}
                            className="vertical-timeline-element"
                            contentStyle={{
                              background: "transparent",
                              color: "#fff",
                              padding: "0",
                              border: "none",
                              boxShadow: "none",
                            }}
                            contentArrowStyle={{
                              display: "none",
                            }}
                            date={convertedDate}
                            iconStyle={{
                              background: "#AAAAAA",
                              color: "#AAAAAA",
                              boxShadow: "none",
                              height: "14px",
                              width: "14px",
                              left: "11px",
                            }}
                          >
                            <h4 className="vertical-timeline-element-subtitle">
                              {time == "requested_datetime"
                                ? "Service request opened"
                                : time == "updated_datetime"
                                ? pointData.properties?.status_notes
                                  ? pointData.properties.status_notes
                                  : "Service request updated"
                                : "Service request closed"}
                            </h4>
                          </VerticalTimelineElement>
                        );
                      }
                    })}
                  </VerticalTimeline>
                </div>
              }
            </Sheet.Content>
          </Sheet.Container>

          <Sheet.Backdrop>
            <div
              style={{
                padding: "1rem 1rem",
                height: "calc(100vh - 2rem)",
                width: "calc(100vw - 2rem)",
                backgroundSize: "cover",
                backgroundImage: `url(${
                  pointData?.properties?.media_url ||
                  "https://pbs.twimg.com/media/Fd4imgrXoAEQxzS?format=jpg&name=large"
                })`,
              }}
            >
              <div className="backDrop-btns">
                <button
                  className="backDrop-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPointData(null);
                  }}
                >
                  <FontAwesomeIcon icon={faChevronDown} color={"black"} />
                </button>
                <button className="backDrop-btn">
                  <FontAwesomeIcon icon={faEllipsis} color={"black"} />
                </button>
              </div>
              <p className="backDrop">
                Request #{pointData?.properties?.service_request_id}
              </p>
              <p className="backDrop-sub">{pointData?.properties?.address} </p>
            </div>
          </Sheet.Backdrop>
        </Sheet>

        <div className="searchFilter-container">
          <input
            type="search"
            id="searchBar"
            placeholder="Search..."
            onChange={(e) => setSearch(e.target.value)}
          ></input>
          <button
            id="filterToggle"
            onClick={(e) => {
              setToggleFilter(!toggleFilter);
            }}
          >
            <FontAwesomeIcon icon={faLayerGroup}></FontAwesomeIcon>
          </button>
        </div>

        {toggleFilter && (
          <div className="filter-container card-style">
            <div className="filter-section">
              <p className="filter-label">Status</p>
              <Form className="filter-items">
                {STATUS_OPTIONS.map((label) => {
                  return (
                    <Form.Check
                      onChange={(e) => {
                        if (filterStatus?.includes(label)) {
                          setFilterStatus((filterStatus) => {
                            return filterStatus.filter(
                              (status) => status !== label
                            );
                          });
                        } else {
                          let newFilterStatus = filterStatus.slice();
                          newFilterStatus.push(label);
                          setFilterStatus(newFilterStatus);
                        }
                      }}
                      key={label}
                      label={label}
                      name={label}
                      type={"checkbox"}
                      id={`${label}-checkbox`}
                      checked={filterStatus?.includes(label)}
                      className={
                        filterStatus?.includes(label)
                          ? "active-label"
                          : "inactive-label"
                      }
                    />
                  );
                })}
              </Form>
            </div>
            <hr />
            <div className="filter-section">
              <p className="filter-label">Category</p>
              <Form className="filter-items">
                {CATEGORY_OPTIONS.map((label) => {
                  return (
                    <Form.Check
                      onChange={(e) => {
                        if (filterCategory?.includes(label)) {
                          setFilterCategory((filterCategory) => {
                            return filterCategory.filter(
                              (cat) => cat !== label
                            );
                          });
                        } else {
                          let newFilterCategory = filterCategory.slice();
                          newFilterCategory.push(label);
                          setFilterCategory(newFilterCategory);
                        }
                      }}
                      key={label}
                      label={label}
                      name={label}
                      type={"checkbox"}
                      id={`${label}-checkbox`}
                      checked={filterCategory?.includes(label)}
                      className={
                        filterCategory?.includes(label)
                          ? "active-label"
                          : "inactive-label"
                      }
                    />
                  );
                })}
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
