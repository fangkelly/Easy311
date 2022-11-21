import React, {useEffect, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function LoadingWheel({heading, loader, text}) {
    return (
        <div className="loadingWheel-container">
            {!loader &&  <button id="closeLoader-btn"
            // onClick={() => {
            //   setToggleForm(false);
            // }}
          >
            <FontAwesomeIcon icon={faXmark} size={"2x"}></FontAwesomeIcon>
          </button>}
             <p className={"loader-heading"}>{heading}</p>
            {loader && <div className={"loader"}></div>}
            <p className={"loader-text"}>{text}</p>
        </div>
        
    )
}