import React, { useEffect, useState } from "react";
import DropDown from "./DropDown";
import Form from "react-bootstrap/Form";
import imageCompression from "browser-image-compression";
import SlideShow from "./SlideShow";
import LoadingWheel from "./LoadingWheel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

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

export default function ChatBot({ setToggleForm }) {
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

  useEffect(() => {
    console.log(response);
  }, [response]);

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
        });

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


  const steps = ["name", "issue", "image", "location", "description", "contact", "update", "review", "submit"];


  // Store user's messages
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([
    {
      sender: "bot",
      message: "Hi. Welcome to EASY 311. What is your name?",
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  const [sendResponse, setSendResponse] = useState(false);


  const submitMessage = () => {
    setMessageHistory([...messageHistory, {sender:"user", message:message}]);
    const msg = message;
    // messageParser(msg);
    setSendResponse(true);
  }

  useEffect(()=>{
    if (sendResponse) {
      messageParser(message)
      setSendResponse(false);
      setMessage(""); 
    }
  }, [sendResponse])

  const handleKeyUp = async (e) => {
    const code = e.keyCode;
    if (code === 13) {
      submitMessage();
    }
  };

  const handleClick = (e) => {
    submitMessage();
  };

  const messageParser = (msg) => {
    console.log("in parser")
    if (currentStep === 0) {
      setMessageHistory([...messageHistory, {sender:"bot", message:`Nice to meet you ${msg}!`}])
    }

  }


  return (
    <div className="chatbot-container">
      <div className="messages">
        {messageHistory.map((msg) => {
          return (
            <div className={`message-row ${msg.sender}`}>
              <div className={`message-container ${msg.sender}`}>
                <p>
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="response">
        <input
          placeholder="Type in your response"
          type="text"
          id="chatbot-input"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          onKeyUp={handleKeyUp}
        />
        <button className="send-message" onClick={handleClick}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>

      {/* <div className={"data-section"}>
          <p className={"data-title"}>What is your name?</p>
          <input
              placeholder="Type in your name"
              type="text"
              id="name"
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
        </div>

        <div className={"data-section"}>
          <p className={"data-title"}>What would you like to report today?</p>
          <DropDown
            val={response.category}
            setVal={setCategory}
            items={CATEGORY_OPTIONS}
            placeholder={"Select a category"}
          />
        </div>
        <div className={"data-section"}>
          <p className={"data-title"}>
            Please upload one or more images of the issue.
          </p>

          <input
            type="file"
            id="files"
            multiple
            accept="image/*"
            onChange={(e) => {
              handleUploadImage(e);
            }}
          />

          {response.media && response.media.length > 0 && (
            <SlideShow items={response.media} />
          )}
        </div>
        <div className={"data-section"}>
          <p className={"data-title"}>Where is this issue located?</p>
          <div>
            <input
              placeholder="Type in an address"
              type="text"
              id="address"
              onChange={(e) => {
                setAddress(e.target.value);
              }}
            />
            <div
              className={"d-flex flex-row"}
              style={{ justifyContent: "flex-end" }}
            >
              <button id={"geolocate-btn"} onClick={geolocate}>
                Use my location
              </button>
            </div>
          </div>
        </div>
        <div className={"data-section"}>
          <p className={"data-title"}>Please describe the issue.</p>
          <input
            placeholder="Description of issue"
            type="text"
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
        </div>
        <div className={"data-section"}>
          <p className={"data-title"}>
            If you'd like to receive updates on your issue status, please reply
            with your email.
          </p>
          <input
            placeholder="Email address"
            type="email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div className={"data-section"}>
          <p className={"data-title"}>
            We'd love to work with residents on bettering Philly. Would you like
            to get connected with our partner non-profits?{" "}
          </p>
          <Form className="filter-items">
            <Form.Check
              onChange={(e) => {
                setSubscribe(e.target.checked);
              }}
              key={"subscribe"}
              label={"Yes, connect me with partner non-profits"}
              name={"subscribe"}
              type={"checkbox"}
              id={`subscribe-checkbox`}
              checked={response.subscribe}
              className={response.subscribe ? "active-label" : "inactive-label"}
            />
          </Form>
        </div>

        <div className={"data-section"} style={{ alignItems: "center" }}>
          <button id={"submitForm-btn"}>Submit</button>
        </div>  */}
    </div>
  );
}
