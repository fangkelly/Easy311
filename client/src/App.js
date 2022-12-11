import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

// import logos
import logo from "./icons/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faXmark,
  faChevronDown,
  faLayerGroup,
  faCommentDots,
  faShareNodes,
  faMessage,
  faCircleInfo,
  faMap,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import emoji_1 from "./icons/emoji_1.svg";
import emoji_2 from "./icons/emoji_2.svg";
import emoji_3 from "./icons/emoji_3.svg";
import emoji_4 from "./icons/emoji_4.svg";
import emoji_5 from "./icons/emoji_5.svg";

// import components
import SubmissionForm from "./components/SubmissionForm";
import Map from "./components/Map.js";
import DataView from "./components/DataView";
import Sheet from "react-modal-sheet";
import Form from "react-bootstrap/Form";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

// import turf packages
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

// import data
import neighborhoods from "./data/neighborhoods.json";

const TWEET_INTENT_URL = "https://twitter.com/intent/tweet";

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

// set APP constants
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

const CATEGORY_MINUS_OTHER = CATEGORY_OPTIONS.filter(
  (category) => category != "Other"
);

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

function App() {
  const [analysisData, setAnalysisData] = useState(null); // data used for DataView.js
  const [dataView, setDataView] = useState(false); // whether the data view is toggled or not
  const [toggleFilter, setToggleFilter] = useState(false); // whether the filter panel is toggled or not
  const [pointData, setPointData] = useState(false); // request data passed in to the bottom sheet when request is selected by user
  const [filterStatus, setFilterStatus] = useState(STATUS_OPTIONS); // list of what statuses the user wants visualized on map Open or Closed
  const [filterCategory, setFilterCategory] = useState(CATEGORY_OPTIONS); // list of what categories of requests the user wants visualized
  const [search, setSearch] = useState(""); // user's current search query
  const [timeRange, setTimeRange] = useState("Last 7 days"); // what time range the user has selected from the drop down (see requests from x days back)
  const [neighborhood, setNeighborhood] = useState(null); // what neighborhoos the user has selected to view
  const [stats, setStats] = useState(null); // calculated statistics of the neighborhood
  const [toggleForm, setToggleForm] = useState(false); // whether the chatbot is toggled or not
  const [toggleSplash, setToggleSplash] = useState(true); // whether the splash page is toggled or not
  const [imageOnly, setImageOnly] = useState(false); // whether the user wants to only visualize requests with images or not
  let emptySet = new Set();
  const [points, setPoints] = useState(emptySet); // keeps track of all points we've seen and processed
  const [trendData, setTrendData] = useState(null); // data to calculate trend statistic in data view
  const [dataDict, setDataDict] = useState({
    coordDict: {},
    neighborhoodDict: {},
  });
  const [comments, setComments] = useState(null); // list of comments to render on bottom sheet
  const [commentSection, setCommentSection] = useState(false); // whether to show comment section or not
  const [enableHeatmap, setEnableHeatmap] = useState(true); // whether to make heatmap active or not
  const [reaction, setReactions] = useState(null); // dicitonary of reactions mapped to their corresponding count

  useEffect(() => {
    const location = window.location;
    const queryParams = new URLSearchParams(location.search);
    let id;
    for (let pair of queryParams.entries()) {
      if (pair[0] === "id") {
        id = pair[1];
        setUserId(id);
      } else if (pair[0] === "req") {
        const req = pair[1];
        getRequest(req);
        setToggleSplash(false);
        setToggleSubscriptions(false);
      } else if (pair[0] === "neighborhood") {
        setDataView(true);
        setToggleSubscriptions(false);
        setToggleSplash(false);
        if (pair[1] !== "Philadelphia") {for (const neighborhood of neighborhoods.features) {
          if (neighborhood.properties.listname === pair[1]) {
            setNeighborhood(neighborhood);
            break;
          }
        }}
      }
    }

    window.history.pushState(null, "", location.href.split("?")[0]);
  }, []);

  const getPath = () => {
    let params;
    if (dataView) {
      if (neighborhood) {
        params = `neighborhood=${neighborhood.properties.listname}`;
      } else {
        params = `neighborhood=Philadelphia`;
      }
    } else if (pointData) {
      params = `req=${pointData.properties.service_request_id}`;
    }

    let path = window.location.href.split("?")[0];
    path = path.concat("?");
    path = path.concat(params);
    return path;
  };

  useEffect(() => {
    const path = getPath();
    if ("undefined" !== typeof window.history.pushState) {
      window.history.replaceState(null, "", path);
    } else {
      window.location.assign(path);
    }
  }, [dataView, pointData, neighborhood]);

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

  // get comments for specific service request
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
  }, [pointData]);

  // get reactions for specific service request
  useEffect(() => {
    if (pointData) {
      fetch(`/reactions?id=${pointData.properties.service_request_id}`)
        .then((res) => {
          if (res) return res.json();
        })
        .then((d) => setReactions(d));
    } else {
      setReactions(null);
    }
  }, [pointData]);

  // always default to timeline of status updates everytime bottom sheet opens
  useEffect(() => {
    setCommentSection(false);
    setToggleSubscribe(false);
  }, [pointData]);

  // get data for previous 2 * {timeRange} amount of time
  useEffect(() => {
    fetch(`/analysis_data?time=${timeRange}&trend=true`)
      .then((res) => res.json())
      .then((data) => setTrendData(data));
  }, [timeRange]);

  // get data for previous {timeRange} amount of time
  useEffect(() => {
    fetch(`/analysis_data?time=${timeRange}&trend=${false}`)
      .then((res) => res.json())
      .then((data) => setAnalysisData(data));
  }, [timeRange]);

  useEffect(() => {
    createDicts(analysisData);
  }, [analysisData]);

  // filter data for visualization
  const data = useMemo(() => {
    if (analysisData) {
      return analysisData.filter(
        (d) =>
          ((imageOnly && d.properties.media_url) || !imageOnly) &&
          d.properties.service_request_id.toString().startsWith(search) &&
          filterStatus.includes(d.properties.status) &&
          (filterCategory?.includes(d.properties.service_name) ||
            (filterCategory?.includes("Other") &&
              !filterCategory?.includes(d.properties.service_name)))
      );
    }
  }, [filterStatus, filterCategory, search, analysisData, imageOnly]);

  // create statistics
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

  const getRequest = (id) => {
    fetch(`/get_req?id=${id}`)
      .then((res) => {
        if (res) return res.json();
      })
      .then((d) => setPointData(d[0]));
  };

  const [userId, setUserId] = useState(null);

  const deleteSubscription = (encrypted, subType, subTo) => {
    const data = {
      encrypted: encrypted,
      subType: subType,
      subTo: subTo,
    };
    fetch("/delete_subscription", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((r) => {
      r.json();
    });
  };

  const [subscriptions, setSubscriptions] = useState(null);
  const [toggleSubscriptions, setToggleSubscriptions] = useState(true);

  useEffect(() => {
    if (userId) {
      getSubscriptions(userId);
    }
  }, [userId, toggleSubscriptions]);

  const getSubscriptions = (id) => {
    fetch(`/get_subscriptions?id=${userId}`)
      .then((res) => {
        if (res) return res.json();
      })
      .then((d) => setSubscriptions(d));
  };

  const [comment, setComment] = useState(""); // holds current typed comment

  // submit comment
  const handleKeyUp = async (e) => {
    const code = e.keyCode;
    if (code === 13 && comment) {
      let newComments;
      let currentTime = new Date();
      currentTime = currentTime.toString();
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

  // add reaction
  const addReaction = (r) => {
    const data = {
      id: pointData.properties.service_request_id,
      reactions: {
        r1: reaction ? reaction?.reactions?.r1 : 0,
        r2: reaction ? reaction?.reactions?.r2 : 0,
        r3: reaction ? reaction?.reactions?.r3 : 0,
        r4: reaction ? reaction?.reactions?.r4 : 0,
        r5: reaction ? reaction?.reactions?.r5 : 0,
        // r6:reaction?reaction?.reactions?.r6:0
      },
    };

    data.reactions[r] += 1;

    setReactions(data);

    fetch("/add_reaction", {
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
  };

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
        subTo: subTo,
      };

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
    <div className="App">
      <header className="App-header">
        <div
          id="App-header-logo-container"
          onClick={() => {
            setToggleSplash(true);
            setToggleSubscriptions(false);
          }}
        >
          <img src={logo} className="App-logo" alt="logo" />
          <p>EASY 311</p>
        </div>
        <div id="App-header-settings-container">
          <p>EN</p>
          <div className="row-btn-container">
            {userId && (
              <FontAwesomeIcon
                onClick={() => {
                  setToggleSubscriptions(!toggleSubscriptions);
                }}
                icon={faBell}
                color={"#A1A1A1"}
                className={"fa-lg"}
              />
            )}
            <FontAwesomeIcon
              icon={faCircleInfo}
              color={"#A1A1A1"}
              className={"fa-lg"}
            />
          </div>
        </div>
      </header>
      <div id={"map-container"}>
        {toggleSplash && !userId && (
          <div id="splash-page">
            <div className="splash-logo-container">
              <img src={logo} className={"splash-logo"} />
              <p className="splash-heading">EASY 311</p>
            </div>
            <div className={"splash-buttons"}>
              <button
                id="splash-viz"
                onClick={() => {
                  setToggleSplash(false);
                  setToggleForm(true);
                }}
              >
                <p>Submit a Request</p>
                <FontAwesomeIcon icon={faMessage} className={"fa-lg"} />
              </button>
              <button
                id="splash-bot"
                onClick={() => {
                  setToggleSplash(false);
                  // setDataView(true);
                }}
              >
                <p>View Request Map</p>
                <FontAwesomeIcon icon={faMap} className={"fa-lg"} />
              </button>
              <button
                id="splash-bot"
                onClick={() => {
                  setToggleSplash(false);
                  setDataView(true);
                }}
              >
                <p>View Request Analytics</p>
                <FontAwesomeIcon icon={faChartColumn} className={"fa-lg"} />
              </button>
            </div>
          </div>
        )}

        {toggleSubscriptions && userId && (
          <div className="subscription-page">
            <p className="splash-heading">My Subscriptions</p>
            {subscriptions && (
              <>
                <div className="data-section">
                  <p className={"data-title"}>Neighborhoods</p>
                  <div className="sub-list">
                    {subscriptions.neighborhoods.map((n) => {
                      return (
                        <div>
                          <FontAwesomeIcon
                            icon={faXmark}
                            onClick={() => {
                              deleteSubscription(userId, "neighborhoods", n);
                              let newNeigh = [
                                ...subscriptions.neighborhoods,
                              ].filter((d) => d !== n);
                              setSubscriptions({
                                ...subscriptions,
                                neighborhoods: newNeigh,
                              });
                            }}
                          />{" "}
                          &nbsp;
                          <a
                            className="sub-link"
                            onClick={() => {
                              for (const neighborhood of neighborhoods.features) {
                                if (neighborhood.properties.listname === n) {
                                  setNeighborhood(neighborhood);
                                  setDataView(true);
                                  setToggleSubscriptions(false);
                                  setToggleSplash(false);
                                  break;
                                }
                              }
                            }}
                          >
                            {n}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="data-section">
                  <p className={"data-title"}>Service Requests</p>
                  <div className="sub-list">
                    {subscriptions.requests.map((r) => {
                      return (
                        <div>
                          <FontAwesomeIcon
                            icon={faXmark}
                            onClick={() => {
                              deleteSubscription(userId, "requests", r);
                              let newReqs = [...subscriptions.requests].filter(
                                (d) => d !== r
                              );
                              setSubscriptions({
                                ...subscriptions,
                                requests: newReqs,
                              });
                            }}
                          />{" "}
                          &nbsp;
                          <a
                            className="sub-link"
                            onClick={() => {
                              getRequest(r);
                              setToggleSubscriptions(false);
                              setToggleSplash(false);
                            }}
                          >
                            {r}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <Map
          data={data}
          setDataView={setDataView}
          setPointData={setPointData}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
          enableHeatmap={enableHeatmap}
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
            setDataView={setDataView}
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
                <p
                  className="backDrop-sub bold"
                  style={{
                    alignItems: "center",
                    columnGap: "1rem",
                    display: "flex",
                    position: "relative",
                  }}
                >
                  {pointData?.properties?.service_name}

                  <FontAwesomeIcon
                    icon={faBell}
                    className={"fa-lg"}
                    onClick={() => {
                      setToggleSubscribe(!toggleSubscribe);
                    }}
                  />
                  {toggleSubscribe && (
                    <div className="subscribe-container" style={{ top: 30 }}>
                      <p>
                        Would you like to be notified of updates made to this
                        service request?
                      </p>
                      <input
                        id="sub-input"
                        type="text"
                        placeholder="Your email here"
                        value={subEmail}
                        onChange={(e) => {
                          document.getElementById("sub-input").style.border =
                            "none";
                          setSubEmail(e.target.value);
                        }}
                      />
                      <div className={"row-btn-container"}>
                        <button
                          className={"primary-btn-blue"}
                          onClick={() => {
                            handleSubscribe(
                              "requestss",
                              pointData?.properties?.service_request_id
                            );
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
                </p>
                {!commentSection ? (
                  <>
                    <p className="backDrop-sub bold">Updates</p>
                    <VerticalTimeline
                      lineColor={"#AAAAAA"}
                      layout={"1-column-left"}
                    >
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
                            <div className="comment-time">{comment.time}</div>
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
                    {comments && comments.comments
                      ? comments?.comments?.length
                      : 0}
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

                <div
                  className="react-container"
                  style={{
                    maxWidth: commentSection ? "0" : "",
                    opacity: commentSection ? 0 : 1,
                    padding: commentSection ? 0 : "0.25rem 0.75rem",
                    transition: "all 0.4s",
                  }}
                >
                  <div
                    className="emoji-container"
                    onClick={() => {
                      addReaction("r1");
                    }}
                    style={{ width: commentSection ? "0" : "" }}
                  >
                    <img src={emoji_1} />
                    <p>{reaction ? reaction?.reactions?.r1 : 0}</p>
                  </div>
                  <div
                    className="emoji-container"
                    onClick={() => {
                      addReaction("r2");
                    }}
                    style={{ width: commentSection ? "0" : "" }}
                  >
                    <img src={emoji_2} />{" "}
                    <p>{reaction ? reaction?.reactions?.r2 : 0}</p>
                  </div>
                  <div
                    className="emoji-container"
                    onClick={() => {
                      addReaction("r3");
                    }}
                    style={{ width: commentSection ? "0" : "" }}
                  >
                    <img src={emoji_3} />{" "}
                    <p>{reaction ? reaction?.reactions?.r3 : 0}</p>
                  </div>
                  <div
                    className="emoji-container"
                    onClick={() => {
                      addReaction("r4");
                    }}
                    style={{ width: commentSection ? "0" : "" }}
                  >
                    <img src={emoji_4} />{" "}
                    <p>{reaction ? reaction?.reactions?.r4 : 0}</p>
                  </div>
                  <div
                    className="emoji-container"
                    onClick={() => {
                      addReaction("r5");
                    }}
                    style={{ width: commentSection ? "0" : "" }}
                  >
                    <img src={emoji_5} />{" "}
                    <p>{reaction ? reaction?.reactions?.r5 : 0}</p>
                  </div>
                  {/* <div className="emoji-container" onClick={()=>{addReaction("r6")}} style={{width:commentSection?"0":""}}>
                    <img src={emoji_6} />{" "}
                    <p>{reaction ? reaction?.reactions?.r2 : 0}</p>
                  </div> */}
                </div>
              </div>
            </Sheet.Content>
          </Sheet.Container>

          <Sheet.Backdrop>
            <div
              style={{
                padding: "1rem 1rem",
                height: "calc(100vh)",
                width: "calc(100vw)",
                maxWidth: 500,
                margin: "auto",
                backgroundSize: "cover",
                backgroundImage: `url(${
                  pointData?.properties?.media_url ||
                  "https://pbs.twimg.com/media/Fd4imgrXoAEQxzS?format=jpg&name=large"
                })`,
              }}
            >
              <div className="backDrop-btns">
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`${TWEET_INTENT_URL}?text=${encodeURIComponent(
                    `Check out this ${pointData?.properties?.service_name || ''} service request`
                  )}&url=${getPath()}`}
                >
                  <button className="backDrop-btn">
                    <FontAwesomeIcon icon={faShareNodes} color={"black"} />
                  </button>
                </a>
                <button
                  className="backDrop-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPointData(null);
                  }}
                >
                  <FontAwesomeIcon icon={faChevronDown} color={"black"} />
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

          <div className="btns-container">
            <button
              id="filterToggle"
              onClick={(e) => {
                setToggleFilter(!toggleFilter);
              }}
            >
              <FontAwesomeIcon
                icon={faLayerGroup}
                color={"#FFFFFF"}
                className={"fa-lg"}
              />
            </button>

            <button
              id="dataToggle"
              onClick={() => {
                setDataView(!dataView);
              }}
            >
              <FontAwesomeIcon
                icon={faChartColumn}
                color={"#FFFFFF"}
                className={"fa-lg"}
              ></FontAwesomeIcon>
            </button>
          </div>
        </div>

        <button
          id="toggleForm-btn"
          onClick={(e) => {
            e.stopPropagation();
            setToggleForm(true);
          }}
        >
          <FontAwesomeIcon icon={faMessage} className={"fa-lg"} />
        </button>

        {toggleForm && <SubmissionForm setToggleForm={setToggleForm} />}

        {toggleFilter && (
          <div className="filter-container card-style">
            <div className="filter-section">
              <div className="x-header">
                <p className="filter-label">Status</p>
                <FontAwesomeIcon
                  icon={faXmark}
                  color={"#A1A1A1"}
                  size={"lg"}
                  onClick={() => {
                    setToggleFilter(false);
                  }}
                />
              </div>
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
              <div className="x-header align-items-center">
                <p className="filter-label">Category</p>
                <div>
                  <button
                    className="deselect-btns"
                    onClick={() => {
                      setFilterCategory([]);
                    }}
                  >
                    Deselect All
                  </button>
                  <button
                    className="deselect-btns"
                    onClick={() => {
                      setFilterCategory(CATEGORY_OPTIONS);
                    }}
                  >
                    Select All
                  </button>
                </div>
              </div>
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
                      label={
                        label === "Rubbish and Recycling"
                          ? "Missed Trash & Recycling Pickup"
                          : label
                      }
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
            <hr />
            <div className="filter-section">
              <p className="filter-label">More</p>
              <Form className="filter-items">
                <Form.Check
                  onChange={(e) => {
                    setImageOnly(e.target.checked);
                  }}
                  key={"image-checkbox"}
                  label={"Only show requests with images"}
                  type={"checkbox"}
                  id={`image-checkbox`}
                  checked={imageOnly}
                  className={imageOnly ? "active-label" : "inactive-label"}
                />
                <Form.Check
                  onChange={(e) => {
                    setEnableHeatmap(e.target.checked);
                  }}
                  key={"heatmap-checkbox"}
                  label={"Enable Heatmap"}
                  type={"checkbox"}
                  id={`heatmap-checkbox`}
                  checked={enableHeatmap}
                  className={enableHeatmap ? "active-label" : "inactive-label"}
                />
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
