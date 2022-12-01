const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const commentModel = require("../models");

const PORT = process.env.PORT || 3001;
const axios = require("axios");
const app = express();

mongoose.connect(
  `mongodb+srv://fangk:9V4kU5bXwCYHuz@easy311.oulkflp.mongodb.net/?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

//MiddleWare
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));

// POST add a new user to the database
app.post("/add_comment", async (request, response) => {
  console.log(request.body);
  const model = new commentModel({
    id: request.body.id,
    comments: request.body.comments,
  });

  try {
    await model.save();
    response.send(model);
  } catch (error) {
    response.status(500).send(error);
  }
});

// GET
app.get("/comments", async (request, response) => {
  
  callback = (c) => {
    console.log(c);
    response.send(c);
  }

  commentModel.findOne({ id: request.query.id }).exec((err, res) => {
    if (err) {
      response.status(500).send(err);
    } else {
      callback(res);
    }
  });
});

// Handle GET requests to /data route
app.get("/analysis_data", async (req, res, next) => {
  const timeMap = {
    "This year": 365,
    "Last 30 days": 30,
    "Last 7 days": 7,
    Today: 1,
    "All time": 36500,
  };

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
        (requested_datetime > current_date - ${
          time * 2
        } AND  current_date - ${time} >= requested_datetime) AND service_name != 'Information Request'
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
