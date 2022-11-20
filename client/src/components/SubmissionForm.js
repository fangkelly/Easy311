import React, { useEffect, useState } from "react";
import DropDown from "./DropDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

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


export default function SubmissionForm({ setToggleForm }) {

const [response, setResponse] = useState({category:null, description:null, media:null})

const setCategory = (newCategory) => {
    setResponse({...response, category:newCategory})
}

const setDescription = (newDescription) => {
    setResponse({...response, description: newDescription})
}
  return (
    <div className="card card-style">
      <div className="card-container form-container">
        <div style={{display:"flex", flexDirection:"row", justifyContent:"flex-end"}}>
          <button
            id="closeForm-btn"
            onClick={() => {
              setToggleForm(false);
            }}
          >
            <FontAwesomeIcon icon={faXmark}></FontAwesomeIcon>
          </button>
        </div>
        <form>
            <DropDown val={response.category} setVal={setCategory} items={CATEGORY_OPTIONS} placeholder={"Select a category"}/>
            {/* TODO: implement form */}
        </form>
        
      </div>
    </div>
  );
}
