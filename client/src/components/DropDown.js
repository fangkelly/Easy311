import React, {useState, useEffect} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";


export default function DropDown({ val=null, setVal, items, placeholder=null }) {
    const [toggleDD, setToggleDD] = useState(false)
    return (
      <div id="data-dd">
        <div className="dd-toggle" onClick={(e) => {
          setToggleDD(!toggleDD);
        }}>
          <p>{val || placeholder}</p>
          <FontAwesomeIcon icon={faChevronDown} />
          {toggleDD && (
            <div className="dd-items">
              {items.map((item, index) => {
                return (
                  <>
                    {index > 0 && <hr key={`${item}-hr`}></hr>}
                    <div
                      key={`${item}-dd`}
                      className={"dd-item"}
                      onClick={() => {
                        setVal(item);
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