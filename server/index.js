const path = require("path");
const fs = require("fs");
const { Readable } = require("stream");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3001;
const axios = require("axios");
const dotenv = require("dotenv");
const stream = require("stream");

dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const commentModel = require("../models/CommentModel");
const reactionModel = require("../models/ReactionModel");
const Twit = require("twit");
const app = express();

// Database connection
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
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));

// Google Sheets API
const { google } = require("googleapis");
const sheets = google.sheets("v4");
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];
const spreadsheetId = "1BQB3HWjFXnxcbvG0uzv72dLMk3CkI7whFJoufnUa_Y0";
const sheetName = "Easy 311";

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
  });
  const authToken = await auth.getClient();
  return authToken;
}

async function writeSpreadSheetValues(
  { spreadsheetId, auth, sheetName },
  vals
) {
  const res = await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: "Easy 311!A1:G",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [
        [
          vals.name,
          vals.category,
          vals.media,
          vals.address,
          vals.description,
          vals.email,
          vals.phone,
        ],
      ],
    },
  });

  return res;
}

async function createFolder(auth, folderName) {
  const service = google.drive({ version: "v3", auth });
  const fileMetadata = {
    name: folderName,
    parents: ["1Ivtb7Ja_TyeM6pSAXJHrK8xJQw56H6ik"],
    mimeType: "application/vnd.google-apps.folder",
  };
  try {
    const file = await service.files.create({
      resource: fileMetadata,
      fields: "id",
    });
    console.log("Folder Id:", file.data.id);
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

async function uploadToFolder(auth, folderId, fileProps) {
  const service = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: `${fileProps.name}.${fileProps.extension}`,
    parents: [folderId],
  };
  const media = {
    mimeType: `image/${fileProps.extension}`,
    body: fileProps.buffer,
  };
  try {
    const file = await service.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
      uploadType: "multipart",
    });
    console.log("File Id:", file.data.id);
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

app.post("/upload_media", async (request, response) => {
  const medias = request.body.media;
  if (medias) {
    try {
      const auth = await getAuthToken();
      const folder = await createFolder(auth, "name");

      for (let i = 0; i < medias.length; i++) {
        const fileProps = {
          name: i,
          extension: medias[i][1],
          buffer: medias[i][0],
        };
        const id = await uploadToFolder(auth, folder, fileProps);
      }
      console.log("FOLDER ID ", folder);

      response.send({ folderId: folder });
    } catch (error) {
      console.log(error.message, error.stack);
    }
  } else {
    response.send({ folderId: null });
  }
});

app.post("/write_sheets", async (request, response) => {
  try {
    const auth = await getAuthToken();
    const response = await writeSpreadSheetValues(
      {
        spreadsheetId,
        sheetName,
        auth,
      },
      request.body
    );
    console.log(
      "output for getSpreadSheetValues",
      JSON.stringify(response.data, null, 2)
    );
  } catch (error) {
    console.log(error.message, error.stack);
  }
});

// POST add a new reaction to the database
app.post("/add_reaction", async (request, response) => {
  const string_id = request.body.id.toString();

  try {
    db.collection("reactions").updateOne(
      { id: string_id },
      {
        $set: {
          id: string_id,
          reactions: request.body.reactions,
        },
      },
      { upsert: true }
    );
    response.status(200).send("success");
    console.log("success!");
    // await model.save();
    // response.send(model);
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

// GET a service request's reactions
app.get("/reactions", async (request, response) => {
  console.log("in GET ", request.query);

  callback_reactions = (c) => {
    console.log("here ", c);
    return response.send(c);
  };

  reactionModel.findOne({ id: request.query.id }).exec((err, res) => {
    if (err) {
      return response.status(500).send(err);
    } else {
      return callback_reactions(res);
    }
  });
});

// POST add a new comment to the database
app.post("/add_comment", async (request, response) => {
  const string_id = request.body.id.toString();

  try {
    db.collection("comments").updateOne(
      { id: string_id },
      {
        $set: {
          id: string_id,
          comments: request.body.comments,
        },
      },
      { upsert: true }
    );
    response.status(200).send("success");
    console.log("success!");
    // await model.save();
    // response.send(model);
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
});

// GET
app.get("/comments", async (request, response) => {
  callback_comments = (c) => {
    return response.send(c);
  };

  commentModel.findOne({ id: request.query.id }).exec((err, res) => {
    if (err) {
      return response.status(500).send(err);
    } else {
      return callback_comments(res);
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

// TWITTER

// const T = new Twit({
//   consumer_key: process.env.API_KEY,
//   consumer_secret: process.env.API_SECRET,
//   access_token: process.env.ACCESS_TOKEN,
//   access_token_secret: process.env.ACCESS_TOKEN_SECRET,
// });

// const getAuth = () => {
//   T.post(`https://api.twitter.com/oauth/request_token?oauth_callback="https%3A%2F%2Fwww.easy311.app%2F%0A"`)
// }

// getAuth();

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
