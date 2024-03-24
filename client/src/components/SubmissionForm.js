import React, { useEffect, useState } from "react";
import DropDown from "./DropDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Form from "react-bootstrap/Form";
import imageCompression from "browser-image-compression";
import SlideShow from "./SlideShow";
import LoadingWheel from "./LoadingWheel";
import ChatBot from "./ChatBot";

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

export default function SubmissionForm({ setToggleForm }) {
  const [response, setResponse] = useState({
    category: null,
    description: null,
    media: null,
    subscribe: false,
    email: null,
    address: null,
    name: null,
  });

  const [geo, setGeo] = useState({});

  /* IMAGE UPLOAD FUNCTIONS */

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/heic2any@0.0.3/dist/heic2any.min.js";
    script.async = true;
    //script.onload = () => this.scriptLoaded();
    document.body.appendChild(script);
  }, []);

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  return (
    <div className="card card-style">
      <div className="card-container form-container">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ color: "white" }}>EASY 311</h1>
          <button
            id="closeForm-btn"
            onClick={() => {
              setToggleForm(false);
            }}
          >
            <FontAwesomeIcon icon={faXmark} color={"black"}></FontAwesomeIcon>
          </button>
        </div>

        <ChatBot setToggleForm={setToggleForm} />
      </div>
    </div>
  );
}
