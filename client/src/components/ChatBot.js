import React, { useEffect, useState } from "react";
import DropDown from "./DropDown";
import Form from "react-bootstrap/Form";
import imageCompression from "browser-image-compression";
import SlideShow from "./SlideShow";
import LoadingWheel from "./LoadingWheel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const SPREADSHEET_ID = "1BQB3HWjFXnxcbvG0uzv72dLMk3CkI7whFJoufnUa_Y0";
const CLIENT_ID =
  "674249811099-cb72cfg2k8aklpbkths41mknhurmepv4.apps.googleusercontent.com";
const API_KEY = "AIzaSyBFN1wVr58SqaQdz3Rx0me_BXZBb7mkg1w";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

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
    phone: null,
  });

  const [geo, setGeo] = useState({});

  useEffect(() => {
    console.log(response);
  }, [response]);

  const setCategory = (newCategory) => {
    const categoryMap = {
      1: "Illegal Dumping",
      2: "Rubbish and Recycling",
      3: "Abandoned Vehicle",
      4: "Pothole Repair",
      5: "Graffiti Removal",
      6: "Vacant Lots",
      7: "Street Light Outage",
      8: "Property Maintenance",
      9: "Street Trees",
      10: "Other",
    };
    setResponse({ ...response, category: categoryMap[newCategory] });
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

  const setPhone = (newPhone) => {
    setResponse({ ...response, phone: newPhone });
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
    setSendResponse(true);
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
    console.log("geolocate");
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
          setMessage(location);
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
    setMessageHistory([
      ...messageHistory,
      { sender: "user", message: message },
    ]);
    const msg = message;
    setSendResponse(true);
  };

  useEffect(() => {
    if (sendResponse) {
      messageParser(message);
      setSendResponse(false);
      setMessage("");
    }
  }, [sendResponse]);

  useEffect(() => {
    const chatbot = document.getElementsByClassName("messages")[0];
    chatbot.scrollTop = chatbot.scrollHeight;
  }, [messageHistory]);

  const handleKeyUp = async (e) => {
    const code = e.keyCode;
    if (code === 13 && message) {
      submitMessage();
    }
  };

  const handleClick = (e) => {
    submitMessage();
  };

  const getWidget = (widgetType) => {
    console.log(widgetType);
    if (widgetType === "media_upload") {
      return (
        <div>
          <input
            type="file"
            id="files"
            multiple
            accept="image/*"
            onChange={(e) => {
              handleUploadImage(e);
            }}
          />
          {response.media && response.media.length > 1 && (
            <SlideShow items={response.media} />
          )}
        </div>
      );
    } else if (widgetType === "geolocate") {
      return (
        <button id={"geolocate-btn"} onClick={geolocate}>
          Use my location
        </button>
      );
    }
  };

  const handleSubmit = (data) => {
    fetch("/write_sheets", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) {
          console.log("error");
          sendResponse({
            category: null,
            description: null,
            media: null,
            subscribe: false,
            email: null,
            address: null,
            name: null,
            phone: null,
          });
        } else {
          console.log("successfully wrote to sheets");
        }
      })
      .catch((err) => {
        console.log("error");
      });
  };

  const messageParser = (msg) => {
    if (currentStep === -1) {
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message: "Hi. Welcome to EASY 311. What is your name?",
        },
      ]);
      setCurrentStep(0);
    } else if (currentStep === 0) {
      setName(msg);
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message: `Nice to meet you ${msg}! \nWhat type of service request would you like to make? Please select a number from below: 
          \n 1. Illegal Dumping \n 2. Rubbish and Recycling \n 3. Abandoned Vehicle \n 4. Pothole Repair \n 5. Graffiti Removal \n 6. Vacant Lots \n 7. Street Light Outage \n 8. Property Maintenance \n 9. Street Trees \n 10. Other`,
        },
      ]);
      setCurrentStep(1);
      setSendResponse(false);
    } else if (currentStep === 1) {
      let option = parseInt(msg);
      if (!option || option < 1 || option > 10) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please select a valid number from below: \n 1. Illegal Dumping \n 2. Rubbish and Recycling \n 3. Abandoned Vehicle \n 4. Pothole Repair \n 5. Graffiti Removal \n 6. Vacant Lots \n 7. Street Light Outage \n 8. Property Maintenance \n 9. Street Trees \n 10. Other",
          },
        ]);
      } else {
        setCategory(option);
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Would you like to submit any supporting media including images or videos? [Y/N]",
          },
        ]);
        setCurrentStep(2);
        setSendResponse(false);
      }
    } else if (currentStep === 2) {
      if (msg.toLowerCase() !== "y" && msg.toLowerCase() !== "n") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please respond with either 'Y' or 'N' to indicate if you would like to include an supporting media.",
          },
        ]);
      } else if (msg.toLowerCase() === "y") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Upload your media below.",
            widget: "media_upload",
          },
        ]);
        setCurrentStep(3);
        setSendResponse(false);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Where is this issue located?",
            widget: "geolocate",
          },
        ]);
        setCurrentStep(4);
        setSendResponse(false);
      }
    } else if (currentStep === 3) {
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message:
            "Where is this issue located? You can type in an address or use your current location.",
          widget: "geolocate",
        },
      ]);
      setCurrentStep(4);
      setSendResponse(false);
    } else if (currentStep === 4) {
      setAddress(msg);
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message: "Describe the issue.",
        },
      ]);
      setCurrentStep(5);
      setSendResponse(false);
    } else if (currentStep === 5) {
      setDescription(msg);
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message:
            "If you would like to remain updated on the status of your request, please indicate how you would like to be contacted: \n \n 1. E-mail address \n 2. Phone Number \n 3. I do not want to be updated on the status of this service request.",
        },
      ]);
      setCurrentStep(6);
      setSendResponse(false);
    } else if (currentStep === 6) {
      let option = parseInt(msg);
      if (!option || option < 1 || option > 3) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please select a valid number from below: \n 1. E-mail address \n 2. Phone Number \n 3. I do not want to be updated on the status of this service request.",
          },
        ]);
      } else if (option === 1) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "What is your email address?",
          },
        ]);

        setCurrentStep(7);
        setSendResponse(false);
      } else if (option === 2) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "What is your phone number?",
          },
        ]);

        setCurrentStep(8);
        setSendResponse(false);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Thank you for submitting via EASY 311. Here is what we have from you: \n
            Name: ${response.name}
            Category: ${response.category}
            Location: ${response.address}
            Description: ${response.description}
            Email: ${response.email}
            Phone: ${response.phone}
            Media: ${response.media?.length || 0} files

            Feel free to submit a new request by typing anything.
            `,
          },
        ]);
        setCurrentStep(-1);
        setSendResponse(true);
        handleSubmit(response);
      }
    } else if (currentStep === 7) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let email = msg;
      if (re.test(email)) {
        // setEmail(email);
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Thank you for submitting via EASY 311. Here is what we have from you: \n
            Name: ${response.name}
            Category: ${response.category}
            Location: ${response.address}
            Description: ${response.description}
            Email: ${email}
            Phone: ${response.phone}
            Media: ${response.media?.length || 0} files

            Feel free to submit a new request by typing anything.
            `,
          },
        ]);
        setCurrentStep(-1);
        handleSubmit({ ...response, email: email });
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Please submit a valid email address.",
          },
        ]);
      }
    } else if (currentStep === 8) {
      const re = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
      let number = msg;
      if (re.test(number)) {
        // setPhone(number);
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Thank you for submitting via EASY 311. Here is what we have from you: \n
            Name: ${response.name}
            Category: ${response.category}
            Location: ${response.address}
            Description: ${response.description}
            Email: ${response.email}
            Phone: ${number}
            Media: ${response.media?.length || 0} files

            Feel free to submit a new request by typing anything.
            `,
          },
        ]);
        handleSubmit({ ...response, phone: number });
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Please submit a valid 10-digit phone number.",
          },
        ]);
      }
    }
  };

  return (
    <div className="chatbot-container">
      {geo.geoLocateTitle && (
        <LoadingWheel
          heading={geo.geoLocateTitle}
          loader={geo.geoLocateLoader}
          text={geo.geoLocateDialog}
          closeFunction={() => {
            setGeo({
              geoLocateTitle: null,
              geoLocateDialog: null,
              geoLocateLoader: false,
            });
          }}
        />
      )}

      <div className="messages">
        {messageHistory.map((msg) => {
          return (
            <div className={`message-row ${msg.sender}`}>
              <div className={`message-container ${msg.sender}`}>
                <p style={{ whiteSpace: "pre-line" }}>{msg.message}</p>
                <div> {getWidget(msg?.widget)} </div>
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
    </div>
  );
}
