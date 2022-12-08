import React, { useEffect, useState } from "react";
import DropDown from "./DropDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Form from "react-bootstrap/Form";
import imageCompression from "browser-image-compression";
import SlideShow from "./SlideShow";
import LoadingWheel from "./LoadingWheel";
import ChatBot from "./ChatBot";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAP_STYLE = "mapbox://styles/fangk/clajv6ki9001z14nyv0bhi16q";

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
  const [response, setResponse] = useState({
    category: null,
    description: null,
    media: null,
    subscribe: false,
    email: null,
    address: null,
    name: null
  });

  const [geo, setGeo] = useState({});

  const setCategory = (newCategory) => {
    setResponse({ ...response, category: newCategory });
  };

  const setDescription = (newDescription) => {
    setResponse({ ...response, description: newDescription });
  };

  const setAddress = (newAddress) => {
    setResponse({ ...response, address: newAddress });
  };

  const setEmail = (newEmail) => {
    setResponse({ ...response, email: newEmail });
  };

  const setSubscribe = (newSubscribe) => {
    setResponse({ ...response, subscribe: newSubscribe });
  };

  const handleUpdateImage = (newUpload) => {
    setResponse({ ...response, media: newUpload });
  };

  const setName = (newName) => {
    setResponse({ ...response, name: newName });
  };

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

  const handleUploadImage = (e) => {
    console.log("triggered");
    let newUpload = [];

    const updateUpload = (upload, update = false) => {
      if (upload) newUpload.push(upload);
      if (update) handleUpdateImage(newUpload);
    };

    const files = e.target.files;
    if (files.length < 1) {
      handleUpdateImage([]);
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        imageCompression(file, options).then((compressedFile) => {
          let ext = file.name.toLowerCase().split(".").pop();
          if (ext === "jpg") ext = "jpeg";
          //   if (ext === "heic" || ext === "heif") {
          //     console.log("heic detected");
          //     heic2any({
          //       blob: compressedFile,
          //       toType: "image/jpeg",
          //       quality: 0.5,
          //     }).then((img) => {
          //       console.log("img", img);
          //       readFile(img, "jpeg");
          //     });
          //   } else {
          readFile(compressedFile, updateUpload, i == files.length - 1);
          //   }
        });
      }
    } catch (e) {
      handleUpdateImage(null);
    }
  };

  const readFile = (file, callback, update = false, ext = null) => {
    let info;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageBuffer = e.target.result;
      if (!ext) {
        ext = file.name.split(".").pop();
        if (ext === "jpg") ext = "jpeg";
      }
      callback([imageBuffer, ext], update);
    };
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      callback(null);
    }
  };

  /* GEOLOCATION */

  const geolocate = () => {
    const success = (position) => {

      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      )
        .then((response) => response.json())
        .then((data) => {
          const location = data.features[0].place_name
            .split(",")
            .slice(0, 2)
            .join(",");
          setAddress(location);
          document.getElementById("address").value = location;
        })
      
      
      
  
      setGeo({
        geoLocateDialog: null,
        geoLocateTitle: null,
        geoLocateLoader: false,
        geoLocateCoords: [position.coords.longitude, position.coords.latitude],
      });
    };

    const error = () => {
      setGeo({
        geoLocateTitle: "We couldn't find you!",
        geoLocateDialog:
          "There was an error. Please make sure location services and access are enabled in your system's and browser's settings.",
        geoLocateLoader: false,
      });
    };

    if (!navigator.geolocation) {
      setGeo({
        geoLocateTitle: "Geolocation is not supported!",
        geoLocateDialog:
          "Please make sure location services and access are enabled in your system's and browser's settings.",
        geoLocateLoader: false,
      });
    } else {
      setGeo({
        geoLocateTitle: "Geolocation in process",
        geoLocateDialog: "Loading...",
        geoLocateLoader: true,
      });

      navigator.geolocation.getCurrentPosition(
        function () {},
        function () {},
        {}
      );

      navigator.geolocation.getCurrentPosition(success, error, {
        maximumAge: 10000,
        timeout: 5000,
        enableHighAccuracy: true,
      });
    }
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
          <h1 style={{color:"white"}}>EASY 311</h1>
          <button
            id="closeForm-btn"
            onClick={() => {
              setToggleForm(false);
            }}
          >
            <FontAwesomeIcon icon={faXmark} color={"black"}></FontAwesomeIcon>
          </button>
        </div>

        

        <ChatBot setToggleForm={setToggleForm}/>
      </div>
    </div>
  );
}
