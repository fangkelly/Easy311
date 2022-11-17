const path = require("path");
const express = require("express");
const axios = require("axios");
const { stat } = require("fs");

const PORT = process.env.PORT || 3001;

const app = express();

const timeMap = {
  "This year": 365,
  "This month": 30,
  "This week":7,
  "Today":1,
  "All time":36500
}

const ALL_CATEGORY_OPTIONS = [
  "Illegal Dumping",
  "Rubbish and Recycling",
  "Abandoned Vehicle",
  "Pothole Repair",
  "Graffiti Removal",
  "Vacant Lots",
  "Street Light Outage",
  "Property Maintenance",
  "Street Trees",
  "Information Request",
];

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));

// Handle GET requests to /data route
app.get("/data", async (req, res, next) => {

  // Get filter variables passed in from the front-end

  let status = req.query.status; // String in format of 'Open,Closed'
  status = `(${status.split(',').map((item)=>{return `'${item}'`}).join(', ')})`; // get in format of ('Open', 'Closed')

  let category = req.query.category;
  category = `(${category.split(',').map((item)=>{return `'${item}'`}).join(', ')})`;
  allCategory_plus_infoReq = `(${ALL_CATEGORY_OPTIONS.map((item)=>{return `'${item}'`}).join(', ')})`;
  const includeOther = category.includes("Other");

  console.log(includeOther);

  
  let search = req.query.search;

  let time = timeMap[req.query.time];

  let url = `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM public_cases_fc WHERE requested_datetime >= current_date - ${time} AND status IN ${status} AND (service_name IN ${category} ${includeOther?`OR service_name NOT IN ${allCategory_plus_infoReq}`:''})`

  console.log(url)



  try {
    axios
      .get(
        // TODO: filter by search not working : status LIKE '% ${search} %'
        url
      )
      .then((response) =>
        res.json(response.data.features.filter((d) => d.geometry !== null))
      )
      .catch((error) => {
        console.log("error");
      });
  } catch (err) {
    next(err);
  }
});


// Handle GET requests to /data route
app.get("/analysis_data", async (req, res, next) => {

  // Get filter variables passed in from the front-end
  let time = timeMap[req.query.time];


  try {
    axios
      .get(
        // TODO: filter by search not working : status LIKE '% ${search} %'
        `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM public_cases_fc WHERE 
        requested_datetime >= current_date - ${time} AND service_name != 'Information Request'
        `
      )
      .then((response) =>
        res.json(response.data.features.filter((d) => d.geometry !== null))
      )
      .catch((error) => {
        console.log(error);
      });
  } catch (err) {
    next(err);
  }
});

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
