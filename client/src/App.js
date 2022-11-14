import React, { useEffect, useState } from "react";
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

const STATUS_OPTIONS = ['Open', 'Closed'];
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
  const [dataView, setToggleDataView] = useState(false);
  const [toggleFilter, setToggleFilter] = useState(false);
  const [pointData, setPointData] = useState(false);
  const [filterStatus, setFilterStatus] = useState(STATUS_OPTIONS);
  const [filterCategory, setFilterCategory] = useState(CATEGORY_OPTIONS);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/data?status=${filterStatus}&category=${filterCategory}&search=${search}`)
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [filterStatus, filterCategory, search]);


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
              setToggleDataView(!dataView);
            }}
          ></FontAwesomeIcon>
        </div>
      </header>
      <div id={"map-container"}>
        <Map data={data} setPointData={setPointData} />
        {dataView && <DataView />}

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
                  <p className="backDrop-sub bold">Updates</p>
                  <div className="updates">updates</div>
                  <div className="comment">comment section</div>
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
