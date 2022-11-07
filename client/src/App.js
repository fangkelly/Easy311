// client/src/App.js

import React, {useEffect, useState} from "react";
import logo from "./icons/logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartColumn, faXmark, faEllipsis, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import "./App.css";
import Map from "./components/Map.js";
import DataView from "./components/DataView";
import Sheet from 'react-modal-sheet';



function App() {
  const [data, setData] = useState(null);
  const [dataView, setToggleDataView] = useState(false);
  const [pointData, setPointData] = useState(false);


  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div id="App-header-logo-container">
          <img src={logo} className="App-logo" alt="logo" />
          <p>EASY 311</p>
        </div>
        <div id="App-header-settings-container">
          <p>EN</p>
          <FontAwesomeIcon icon={dataView?faXmark:faChartColumn} color={"#A1A1A1"} size={"lg"}
          onClick={()=>{setToggleDataView(!dataView)}}
          ></FontAwesomeIcon>
        </div>
      </header>
      <div id={"map-container"}>
        <Map data={data} setPointData={setPointData}/>
        {dataView && <DataView/>}

        <Sheet isOpen={pointData?true:false} onClose={() => setPointData(null)}>
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            {<div className="bottomSheet">
                <p className="backDrop-sub bold">Updates</p>

                <div className="updates">updates</div>
                <div className="comment">comment section</div>
            </div>}
          </Sheet.Content>
        </Sheet.Container>

        <Sheet.Backdrop>
          <div style={{padding:"1rem 1rem", height:"calc(100vh - 2rem)", width: "calc(100vw - 2rem)",
          backgroundSize: "cover",
          backgroundImage:`url(${pointData?.properties?.media_link || "https://pbs.twimg.com/media/Fd4imgrXoAEQxzS?format=jpg&name=large"})`}}>
            <div className="backDrop-btns">
              <button className="backDrop-btn" 
              onClick={(e)=>{
                  e.stopPropagation();
                  setPointData(null)}
                } >
                  <FontAwesomeIcon icon={faChevronDown} color={"black"}/></button>
              <button className="backDrop-btn"><FontAwesomeIcon icon={faEllipsis} color={"black"}/></button>
            </div>
            <p className="backDrop">Request #{pointData?.properties?.service_request_id}</p>
            <p className="backDrop-sub">{pointData?.properties?.address} </p>
          </div>
        </Sheet.Backdrop>
      </Sheet>

      <div className="searchFilter-container">
        <input type="search" id="searchBar" placeholder="Search..."></input>
        <div className="filter-container">
          <div className="category-filter">
            <p className="secondaryLabel">Category</p>

          </div>

          <div className="status-filter">
            <p className="secondaryLabel">Status</p>

          </div>


        </div>
      </div>
      </div>

      
      
    </div>
  );
}

export default App;
