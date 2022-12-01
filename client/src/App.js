import React, { useEffect, useMemo, useState } from "react";
import SubmissionForm from "./components/SubmissionForm";
import axios from "axios";
import logo from "./icons/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faXmark,
  faEllipsis,
  faChevronDown,
  faLayerGroup,
  faPlus,
  faCommentDots,
  faShareNodes,
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
import { point, polygon } from "@turf/helpers";

import neighborhoods from "./data/neighborhoods.json";
import { timer } from "d3-timer";

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

const TIME_RANGE_DAYS = {
  "All time": 36525,
  "This year": 365,
  "Last 30 days": 30,
  "Last 7 days": 7,
  Today: 1,
};

const CATEGORY_MINUS_OTHER = CATEGORY_OPTIONS.filter(
  (category) => category != "Other"
);

const NEIGHBORHOODS = neighborhoods;

const validateTime = (datetime, timeRange) => {
  let date = new Date(datetime);
  let currDate = new Date();

  const diff = Date.parse(currDate) - Date.parse(date);
  if (diff <= TIME_RANGE_DAYS[timeRange] * 86400 * 1000) {
    return true;
  } else {
    return false;
  }
};

const convertDate = (datetime) => {
  if (datetime) {
    try {
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
    } catch {
      return;
    }
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
  // const [data, setData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [dataView, setDataView] = useState(false);
  const [toggleFilter, setToggleFilter] = useState(false);
  const [pointData, setPointData] = useState(false);
  const [filterStatus, setFilterStatus] = useState(STATUS_OPTIONS);
  const [filterCategory, setFilterCategory] = useState(CATEGORY_OPTIONS);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [neighborhood, setNeighborhood] = useState(null);
  const [stats, setStats] = useState(null);
  const [toggleForm, setToggleForm] = useState(false);

  let emptySet = new Set();

  // keeps track of all points we've seen and processed
  const [points, setPoints] = useState(emptySet);
  const [trendData, setTrendData] = useState(null);

  const [dataDict, setDataDict] = useState({
    coordDict: {},
    neighborhoodDict: {},
  });

  const createDicts = (analysisData) => {
    if (analysisData) {
      let newCoordDict = dataDict.coordDict;
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
            break;
          }
        }
      });
      setDataDict({
        coordDict: newCoordDict,
        neighborhoodDict: newNeighborhoodDict,
      });
    }
  };

  const [comments, setComments] = useState(null);
  const [commentSection, setCommentSection] = useState(false);

  useEffect(() => {
    if (pointData) {
      fetch(`/comments?id=${pointData.properties.service_request_id}`)
        .then((res) => {
          if (res) return res.json();
        })
        .then((d) => setComments(d));
    } else {
      setComments(null);
    }
  }, [pointData, comments]);

  useEffect(()=>{
    setCommentSection(false);
  },[pointData])


  useEffect(() => {
    fetch(`/analysis_data?time=${timeRange}&trend=true`)
      .then((res) => res.json())
      .then((data) => setTrendData(data));
  }, [timeRange]);

  useEffect(() => {
    fetch(`/analysis_data?time=${timeRange}&trend=${false}`)
      .then((res) => res.json())
      .then((data) => setAnalysisData(data));
  }, [timeRange]);

  useEffect(() => {
    createDicts(analysisData);
  }, [analysisData]);

  const data = useMemo(() => {
    console.log("ANALYSIS DATA ", analysisData);
    if (analysisData) {
      return analysisData.filter(
        (d) =>
          d.properties.service_request_id.toString().startsWith(search) &&
          filterStatus.includes(d.properties.status) &&
          (filterCategory.includes(d.properties.service_name) ||
            (filterCategory.includes("Other") &&
              !filterCategory.includes(d.properties.service_name)))
      );
    }
  }, [filterStatus, filterCategory, search, analysisData]);

  useEffect(() => {
    let serviceStats = {};
    let total = 0;

    if (neighborhood) {
      let subset = dataDict.neighborhoodDict[neighborhood.properties.listname];

      if (subset) {
        let running_time = 0;
        let num_closed = 0;
        for (const coord of subset) {
          total += 1;
          const info = dataDict.coordDict[coord];
          let key = info.properties.service_name;
          if (!CATEGORY_MINUS_OTHER.includes(key)) {
            key = "Other";
          }
          if (!serviceStats[key]) {
            serviceStats[key] = {
              Total: 0,
              Open: 0,
              Closed: 0,
              running_time: 0,
            };
          }

          serviceStats[key].Total += 1;
          serviceStats[key][info.properties.status] += 1;
          if (info.properties.status === "Closed") {
            num_closed += 1;
            const diff =
              Date.parse(info.properties.updated_datetime) -
              Date.parse(info.properties.requested_datetime);
            running_time += diff;
            serviceStats[key].running_time += diff;
          }
        }

        const poly = polygon(neighborhood.geometry.coordinates[0]);
        const neighborhood_trend = trendData.filter((d) =>
          booleanPointInPolygon(point(d.geometry.coordinates), poly)
        );
        console.log(
          "TREND ",
          (
            ((total - neighborhood_trend.length) * 100) /
            neighborhood_trend.length
          ).toFixed(2)
        );

        setStats((stats) => {
          return {
            ...stats,
            serviceStats: serviceStats,
            total: total,
            avg_resolution: running_time / 1000 / num_closed,
            trend: (
              ((total - neighborhood_trend.length) * 100) /
              neighborhood_trend.length
            ).toFixed(2),
          };
        });
      }
    } else {
      let running_time = 0;
      let num_closed = 0;
      // when no neighborhood is chosen, calculate citywide stats
      for (const [k, v] of Object.entries(dataDict.neighborhoodDict)) {
        for (const coord of v) {
          total += 1;
          const info = dataDict.coordDict[coord];
          let key = info.properties.service_name;
          if (!CATEGORY_MINUS_OTHER.includes(key)) {
            key = "Other";
          }

          if (!serviceStats[key]) {
            serviceStats[key] = {
              Total: 0,
              Open: 0,
              Closed: 0,
              running_time: 0,
            };
          }

          serviceStats[key].Total += 1;
          serviceStats[key][info.properties.status] += 1;
          if (info.properties.status === "Closed") {
            num_closed += 1;
            const diff =
              Date.parse(info.properties.updated_datetime) -
              Date.parse(info.properties.requested_datetime);
            running_time += diff;
            serviceStats[key].running_time += diff;
          }
        }
      }

      setStats((stats) => {
        return {
          ...stats,
          serviceStats: serviceStats,
          total: total,
          avg_resolution: running_time / 1000 / num_closed,
          trend:
            (((total - trendData?.length) * 100) / trendData?.length).toFixed(
              2
            ) || 0,
        };
      });
    }
  }, [dataDict.neighborhoodDict, neighborhood]);

  const [comment, setComment] = useState("");

  const handleKeyUp = async (e) => {
    const code = e.keyCode;
    if (code === 13 && comment) {
      let newComments;
      const currentTime = new Date();
      const newComment = { text: comment, time: currentTime };
      if (comments) {
        newComments = comments.comments;
        newComments.push(newComment);
      } else {
        newComments = [newComment];
      }

      const data = {
        id: pointData.properties.service_request_id,
        comments: newComments,
      };

      setComments(data);



      fetch("/add_comment", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) {
            console.log("error");
          } else {
            console.log("successfully submitted comment");
          }
          setComment("");
        })
        .catch((err) => {
          console.log("error");
        });
    }
  };

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
            coordDict={dataDict.coordDict}
            neighborhoodDict={dataDict.neighborhoodDict}
            stats={stats}
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
              <div
                className="bottomSheet"
                style={{ minHeight: commentSection ? "65vh" : "30vh" }}
              >
                <p className="backDrop-sub bold">
                  {pointData?.properties?.service_name}
                </p>
                {!commentSection ? (
                  <>
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
                              <p className="vertical-timeline-element-subtitle">
                                {time == "requested_datetime"
                                  ? "Service request opened"
                                  : time == "updated_datetime"
                                  ? pointData.properties?.status_notes
                                    ? pointData.properties.status_notes
                                    : "Service request updated"
                                  : "Service request closed"}
                              </p>
                            </VerticalTimelineElement>
                          );
                        }
                      })}
                    </VerticalTimeline>{" "}
                  </>
                ) : (
                  <>
                    <p className="backDrop-sub bold">Comments</p>
                    <div className="comment-section">
                      {comments?.comments.map((comment) => {
                        return (
                          <div className="comment-row">
                            <div className="comment">{comment.text}</div>
                            <div className="comment-time">
                              {convertDate(comment.time)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="reactComment-container">
                {/* TODO: react and comment */}
                <div
                  className="comment-container"
                  style={{ flex: commentSection ? 1 : 0 }}
                >
                  <div
                    className="comment-info"
                    onClick={() => {
                      setCommentSection(!commentSection);
                    }}
                  >
                    <FontAwesomeIcon icon={faCommentDots} />
                    {comments ? comments.comments.length : 0}
                  </div>
                  {commentSection && (
                    <>
                      <div className="vr"></div>

                      <input
                        placeholder="Comment..."
                        type="search"
                        id="comment-input"
                        value={comment}
                        onChange={(e) => {
                          setComment(e.target.value);
                        }}
                        onKeyUp={handleKeyUp}
                      />
                    </>
                  )}
                </div>

                <div className="share-btn">
                  <FontAwesomeIcon icon={faShareNodes} />
                </div>

                <div className="react-container">hi</div>
              </div>
            </Sheet.Content>
          </Sheet.Container>

          <Sheet.Backdrop>
            <div
              style={{
                padding: "1rem 1rem",
                height: "calc(100vh)",
                width: "calc(100vw)",
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
            placeholder="Search for a service request by ID"
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

        <button
          id="toggleForm-btn"
          onClick={(e) => {
            e.stopPropagation();
            setToggleForm(true);
          }}
        >
          <FontAwesomeIcon icon={faPlus}></FontAwesomeIcon>
        </button>

        {toggleForm && <SubmissionForm setToggleForm={setToggleForm} />}

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
