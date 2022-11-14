import React, { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faChevronDown,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

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

const TIME_RANGE = ["This year", "This month", "This week", "Today"];

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
                  {index > 0 && <hr></hr>}
                  <div
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

export default function DataView({}) {
  const [timeRange, setTimeRange] = useState(TIME_RANGE[0]);
  const [toggleDD, setToggleDD] = useState(false);
  return (
    <div className="card card-style">
      <div className="data-container">
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
            <input
              type="search"
              id="dataView-searchBar"
              placeholder={"Search Neighborhood"}
            ></input>

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
              return (
                <div className="flexCol-sm">
                  <div className="flexRow">
                    <p className="font-16">{category}</p>
                    <p className="font-16">45%</p>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar"></div>
                  </div>
                  <p className="nor-sub"> Average Closed Time: 21 Days</p>
                  <p className="nor-sub"> Agency Responsible: Streets Department</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
