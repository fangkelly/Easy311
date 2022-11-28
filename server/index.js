const path = require("path");
const express = require("express");
const axios = require("axios");
const { stat } = require("fs");

const PORT = process.env.PORT || 3001;

const app = express();

const timeMap = {
  "This year": 365,
  "Last 30 days": 30,
  "Last 7 days": 7,
  Today: 1,
  "All time": 36500,
};

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
app.get("/analysis_data", async (req, res, next) => {
  // Get filter variables passed in from the front-end
  let time = timeMap[req.query.time];
  let trend = req.query.trend === "true";

  if (!trend) {
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
  } else {
    try {
      axios
        .get(
          // TODO: filter by search not working : status LIKE '% ${search} %'
          `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM public_cases_fc WHERE 
        (requested_datetime > current_date - ${time * 2} AND  current_date - ${time} >= requested_datetime) AND service_name != 'Information Request'
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
  }
});

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
