import React, {useEffect, useState} from "react";
import logo from "./icons/logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartColumn, faXmark, faEllipsis, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import "./App.css";
import Map from "./components/Map.js";
import DataView from "./components/DataView";
import Sheet from 'react-modal-sheet';
import Form from 'react-bootstrap/Form';


/**
 * App.
 * @constructor
 * @param {object[]} data - 311 service requests displayed on map.
 * @param {boolean} dataView - True if data analysis panel open.
 * @param {object} pointData - Single 311 service request.
 * @param {object} filterStatus - If user has toggled Opened, In Progress, or Closed
 * @param {object} search - What the current search query is
 */



function App() {
  const [data, setData] = useState(null);
  const [dataView, setToggleDataView] = useState(false);
  const [pointData, setPointData] = useState(false);
  const [filterStatus, setFilterStatus] = useState({opened: false, inprogress: false, closed: false})
  const [search, setSearch] = useState('');


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
           
            {
              <div class="bottomSheet">
                <p>
                Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to an unknown typesetter in the 15th century who is thought to have scrambled parts of Cicero's De Finibus Bonorum et Malorum for use in a type specimen book. It usually begins with:

“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.”
The purpose of lorem ipsum is to create a natural looking block of text (sentence, paragraph, page, etc.) that doesn't distract from the layout. A practice not without controversy, laying out pages with meaningless filler text can be very useful when the focus is meant to be on design, not content.

The passage experienced a surge in popularity during the 1960s when Letraset used it on their dry-transfer sheets, and again during the 90s as desktop publishers bundled the text with their software. Today it's seen all around the web; on templates, websites, and stock designs. Use our generator to get your own, or read on for the authoritative history of lorem ipsum.
              </p>
              </div>
            }
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
        <input type="search" id="searchBar" placeholder="Search..." onChange={(e)=>setSearch(e.target.value)} ></input>
        <div className="filter-container">
          <div className="category-filter">
            <p className="secondaryLabel">Category</p>

          </div>

          <div className="status-filter">
            <p className="secondaryLabel">Status</p>
            <Form>
              {["Opened", "In Progress", "Closed"].map((label)=>{
                  return (<Form.Check
                    onChange={(e) => {
                      let key = label.toLowerCase().replace(" ", "");
                      setFilterStatus({
                        ...filterStatus, // Copy the old fields
                        [key]: e.target.checked // But override this one
                      });
                    }}
                    label={label}
                    name={label}
                    type={"checkbox"}
                    id={`${label}-checkbox`}
                  />)
              })}
            </Form>

          </div>
        </div>
      </div>
      </div>

      
      
    </div>
  );
}

export default App;
