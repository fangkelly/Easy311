import React, { useEffect, useState } from "react";
import DropDown from "./DropDown";
import Form from "react-bootstrap/Form";
import imageCompression from "browser-image-compression";
import SlideShow from "./SlideShow";
import LoadingWheel from "./LoadingWheel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { set } from "mongoose";

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
    date: null,
  });

  const [geo, setGeo] = useState({});
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

  const setCategory = (newCategory) => {
    
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
          ext.toLowerCase();
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
      message: `Hi! Welcome to EASY 311. What kind of service request can I help you submit today? Please select a number from below:
      \n 1. Illegal Dumping \n 2. Rubbish and Recycling \n 3. Abandoned Vehicle \n 4. Pothole Repair \n 5. Graffiti Removal \n 6. Vacant Lots \n 7. Street Light Outage \n 8. Property Maintenance \n 9. Street Trees \n 10. Other`,
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [sendResponse, setSendResponse] = useState(false);
  const [proofread, setProofread] = useState(false);

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
  }, [sendResponse, response.media]);

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
    if (message) {
      submitMessage();
    }
  };

  const getWidget = (widgetType) => {
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
          {response.media && response.media.length >= 1 && (
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
    fetch("/upload_media", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    })
      .then((res) => {
        if (!res.ok) {
          console.log("error");
        } else {
          res.json().then((d) => {
            fetch("/write_sheets", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...data,
                media: d.folderId
                  ? `https://drive.google.com/drive/folders/${d.folderId}`
                  : "No images provided",
              }),
            })
              .then((res) => {
                setResponse({
                  category: null,
                  description: null,
                  media: null,
                  subscribe: false,
                  email: null,
                  address: null,
                  name: null,
                  phone: null,
                  date: null,
                });
                if (!res.ok) {
                  console.log("error");
                } else {
                  console.log("successfully wrote to sheets");
                }
              })
              .catch((err) => {
                console.log("error");
              });
          });
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
          message: `Hi! Welcome to EASY 311. What kind of service request can I help you submit today?
          \n 1. Illegal Dumping \n 2. Rubbish and Recycling \n 3. Abandoned Vehicle \n 4. Pothole Repair \n 5. Graffiti Removal \n 6. Vacant Lots \n 7. Street Light Outage \n 8. Property Maintenance \n 9. Street Trees \n 10. Other`,
        },
      ]);
      setProofread(false);
      setCurrentStep(0);
    } else if (currentStep === 0) {
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
        if (proofread) {
          setMessageHistory([
            ...messageHistory,
            {
              sender: "bot",
              message: `Here is what we have from you:
              1. Category: ${categoryMap[option]|| "N/A"}
              2. Location: ${response.address || "N/A"}
              3. Description: ${response.description || "N/A"}
              4. Email: ${response.email || "N/A"}
              5. Phone: ${response.phone || "N/A"}
              6. Media: ${response.media?.length || 0} files
  
              If you would like to make your submission, please type 0.
              If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
              `,
            },
          ]);
          setCurrentStep(11);
          setSendResponse(false);
        } else {
          setMessageHistory([
            ...messageHistory,
            {
              sender: "bot",
              message:
                "Would you like to submit any supporting media including images or videos? [Y/N]",
            },
          ]);
          setCurrentStep(1);
          setSendResponse(false);
        }
      }
    } else if (currentStep === 1) {
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
        setCurrentStep(2);
        setSendResponse(false);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Where is this issue located? You can type in an address or use your current location.",
            widget: "geolocate",
          },
        ]);
        setCurrentStep(3);
        setSendResponse(false);
      }
    } else if (currentStep === 2) {
      if (!proofread) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Where is this issue located? You can type in an address or use your current location.",
            widget: "geolocate",
          },
        ]);
        setCurrentStep(3);
        setSendResponse(false);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Here is what we have from you:
            1. Category: ${response.category|| "N/A"}
            2. Location: ${response.address || "N/A"}
            3. Description: ${response.description || "N/A"}
            4. Email: ${response.email || "N/A"}
            5. Phone: ${response.phone || "N/A"}
            6. Media: ${response.media?.length || 0} files

            If you would like to make your submission, please type 0.
            If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
            `,
          },
        ]);
        setCurrentStep(11);
        setSendResponse(false);
      }
    } else if (currentStep === 3) {
      setAddress(msg);
      if (!proofread) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Describe the issue.",
          },
        ]);
        setCurrentStep(4);
        setSendResponse(false);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Here is what we have from you:
            1. Category: ${response.category|| "N/A"}
            2. Location: ${msg || "N/A"}
            3. Description: ${response.description || "N/A"}
            4. Email: ${response.email || "N/A"}
            5. Phone: ${response.phone || "N/A"}
            6. Media: ${response.media?.length || 0} files

            If you would like to make your submission, please type 0.
            If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
            `,
          },
        ]);
        setSendResponse(false);
        setCurrentStep(11)
      }
    } else if (currentStep === 4) {
      setDescription(msg);
      if (!proofread) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Would you like to provide your email address so that our volunteer/advocate can help update you on the status of your request? [Y/N]",
          },
        ]);
        setCurrentStep(5);
        setSendResponse(false);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Here is what we have from you:
            1. Category: ${response.category || "N/A"}
            2. Location: ${response.address || "N/A"}
            3. Description: ${msg || "N/A"}
            4. Email: ${response.email || "N/A"}
            5. Phone: ${response.phone || "N/A"}
            6. Media: ${response.media?.length || 0} files

            If you would like to make your submission, please type 0.
            If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
            `,
          },
        ]);
        setSendResponse(false);
        setCurrentStep(11);
      }
    } else if (currentStep === 5) {
      if (msg.toLowerCase() !== "y" && msg.toLowerCase() !== "n") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please respond with either 'Y' or 'N' to indicate if you would like to provide your email address.",
          },
        ]);
      } else if (msg.toLowerCase() === "y") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Please provide your email address.",
          },
        ]);
        setSendResponse(false);
        setCurrentStep(6);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Would you like to provide your phone number so that our volunteer/advocate can help update you on the status of your request? [Y/N]",
          },
        ]);
        setSendResponse(false);
        setCurrentStep(7);
      }
    } else if (currentStep === 6) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let email = msg;
      if (re.test(email)) {
        setEmail(email);
        if (!proofread) {
          setMessageHistory([
            ...messageHistory,
            {
              sender: "bot",
              message: `Would you like to provide your phone number so that our volunteer/advocate can help update you on the status of your request? [Y/N]`,
            },
          ]);
          setSendResponse(false);
          setCurrentStep(7);
        } else {
          setMessageHistory([
            ...messageHistory,
            {
              sender: "bot",
              message: `Here is what we have from you:
              1. Category: ${response.category || "N/A"}
              2. Location: ${response.address || "N/A"}
              3. Description: ${response.description || "N/A"}
              4. Email: ${email || "N/A"}
              5. Phone: ${response.phone || "N/A"}
              6. Media: ${response.media?.length || 0} files
  
              If you would like to make your submission, please type 0.
              If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
              `,
            },
          ]);
          setSendResponse(false);
          setCurrentStep(11);
        }
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Please submit a valid email address.",
          },
        ]);
        setSendResponse(false);

      }
    } else if (currentStep === 7) {
      if (msg.toLowerCase() !== "y" && msg.toLowerCase() !== "n") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please respond with either 'Y' or 'N' to indicate if you would like to provide your phone number.",
          },
        ]);
        setSendResponse(false);

      } else if (msg.toLowerCase() === "y") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please provide your phone number. Do not include the country code!",
          },
        ]);
        setSendResponse(false);
        setCurrentStep(8);
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Lastly, would you like to provide your name? [Y/N]",
          },
        ]);
        setSendResponse(false);
        setCurrentStep(9);
      }
    } else if (currentStep === 8) {
      const re = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
      let number = msg;
      setPhone(number);
      if (re.test(number)) {
        if (!proofread) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Lastly, would you like to provide your name? [Y/N]`,
          },
        ]);
        setSendResponse(false);

        setCurrentStep(9);} else {
          setMessageHistory([
            ...messageHistory,
            {
              sender: "bot",
              message: `Here is what we have from you:
              1. Category: ${response.category || "N/A"}
              2. Location: ${response.address || "N/A"}
              3. Description: ${response.description || "N/A"}
              4. Email: ${response.email || "N/A"}
              5. Phone: ${number || "N/A"}
              6. Media: ${response.media?.length || 0} files
  
              If you would like to make your submission, please type 0.
              If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
              `,
            },

          ]);
          setSendResponse(false);

          setCurrentStep(11);
        }
      } else {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "Please provide a valid phone number.",
          },
        ]);
      }
    } else if (currentStep === 9) {
      if (msg.toLowerCase() !== "y" && msg.toLowerCase() !== "n") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message:
              "Please respond with either 'Y' or 'N' to indicate if you would like to provide your name.",
          },
        ]);
        setSendResponse(false);

      } else if (msg.toLowerCase() === "y") {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: "What is your name?",
          },
        ]);
        setSendResponse(false);

        setCurrentStep(10);
      } else {
        let date = new Date();
        date = date.toString();
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Here is what we have from you:
            1. Category: ${response.category || "N/A"}
            2. Location: ${response.address || "N/A"}
            3. Description: ${response.description || "N/A"}
            4. Email: ${response.email || "N/A"}
            5. Phone: ${response.phone || "N/A"}
            6. Media: ${response.media?.length || 0} files

            If you would like to make your submission, please type 0.
            If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
            `,
          },
        ]);
        setCurrentStep(11);
        setSendResponse(false);
        // handleSubmit({ ...response, date: date });
      }
    } else if (currentStep === 10) {
      let date = new Date();
      date = date.toString();
      setName(msg);
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message: `Here is what we have from you:
            1. Category: ${response.category || "N/A"}
            2. Location: ${response.address || "N/A"}
            3. Description: ${response.description || "N/A"}
            4. Email: ${response.email || "N/A"}
            5. Phone: ${response.phone || "N/A"}
            6. Media: ${response.media?.length || 0} files

            If you would like to complete your submission, please type 0.
            If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
            `,
        },
      ]);
      setProofread(true);
      setCurrentStep(11);
      setSendResponse(false);
    } else if (currentStep === 11) {
      setSendResponse(false);
      const option = parseInt(msg);
      if (option < 0 || option > 7) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `If you would like to complete your submission, please type 0.
         If you would like to change any of your responses, please type the number corresponding to the field you would like to correct:
          1: Category
          2: Location
          3: Description
          4: Email
          5: Phone
          6: Media
         `,
          },
        ]);
      } else if (option === 0) {
        let date = new Date();
        date = date.toString();
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `Congrats! You've submitted to Easy 311! Here is what we received from you.

            1. Category: ${response.category || "N/A"}
            2. Location: ${response.address || "N/A"}
            3. Description: ${response.description || "N/A"}
            4. Email: ${response.email || "N/A"}
            5. Phone: ${response.phone || "N/A"}
            6. Media: ${response.media?.length || 0} files

            If you've provided your email or phone number, a volunteer/advocate will be in touch with you shortly to update you on the status of your request.
            To begin another submission, text anything in the chat.
            Thank you for looking after the Philly community <3
            `,
          },
        ]);
        setCurrentStep(-1);
        setSendResponse(false);
        setProofread(false);
        handleSubmit({ ...response, date: date });
      
      } else if (option === 1) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `What would you like to change the category of your request to?
            \n 1. Illegal Dumping \n 2. Rubbish and Recycling \n 3. Abandoned Vehicle \n 4. Pothole Repair \n 5. Graffiti Removal \n 6. Vacant Lots \n 7. Street Light Outage \n 8. Property Maintenance \n 9. Street Trees \n 10. Other`,
          },
        ]);
        setProofread(true);
        setCurrentStep(0);
        setSendResponse(false);

      } else if (option === 2) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `What would you like to change the location of the service request to?`,
            widget: "geolocate",
          },
        ]);
        setProofread(true);
        setCurrentStep(3);
        setSendResponse(false);

      } else if (option === 3) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `What would you like to change the description of the service request to?`,
          
          },
        ]);
        setProofread(true);
        setCurrentStep(4);
        setSendResponse(false);

      } else if (option === 4) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `What would you like to change the email to?`,
          },
        ]);
        setProofread(true);
        setCurrentStep(6);
        setSendResponse(false);

      } else if (option === 5) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `What would you like to change the phone number to?`,
          },
        ]);
        setProofread(true);
        setCurrentStep(8);
        setSendResponse(false);

      } else if (option === 6) {
        setMessageHistory([
          ...messageHistory,
          {
            sender: "bot",
            message: `What would you like to change the media to?`,
            widget: "media_upload"
          },
        ]);
        setProofread(true);
        setSendResponse(false);

        setCurrentStep(12);

      }
    } else if (currentStep===12) {
      setMessageHistory([
        ...messageHistory,
        {
          sender: "bot",
          message: `Here is what we have from you:
          1. Category: ${response.category || "N/A"}
          2. Location: ${response.address || "N/A"}
          3. Description: ${response.description || "N/A"}
          4. Email: ${response.email || "N/A"}
          5. Phone: ${response.phone || "N/A"}
          6. Media: Updated files

          If you would like to make your submission, please type 0.
          If you would like to change any of your responses, please type the number corresponding to the field you would like to correct.
          `,
        },
      ]);
      setCurrentStep(11);
      setSendResponse(false);
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
