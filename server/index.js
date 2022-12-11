const path = require("path");
const fs = require("fs");
const { PassThrough } = require("stream");
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
const subscriptionModel = require("../models/SubscriptionModel");
const Twit = require("twit");
const app = express();

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const twilAccount = process.env.TWILIO_ACCOUNT_SID;
const twilAuth = process.env.TWILIO_AUTH_TOKEN;
const twilClient = require("twilio")(twilAccount, twilAuth);

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
          vals.date,
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
  let buffer = Buffer.from(
    fileProps.buffer.replace(/^data:.*;base64,/, ""),
    "base64"
  );
  let bufStream = new PassThrough();
  bufStream.end(buffer);
  const media = {
    mimeType: `image/${fileProps.extension}`,
    body: bufStream,
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
      const folder = await createFolder(
        auth,
        `${request.body.name}_${request.body.category}`
      );

      for (let i = 0; i < medias.length; i++) {
        const fileProps = {
          name: i,
          extension: medias[i][1],
          buffer: medias[i][0],
        };
        const id = await uploadToFolder(auth, folder, fileProps);
      }
      response.send({ folderId: folder });
    } catch (error) {
      console.log(error.message, error.stack);
    }
  } else {
    response.send({ folderId: null });
  }
});

app.post("/write_sheets", async (request, res) => {
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

    const msg = {
      to: "easy311@mit.edu", // Change to your recipient
      from: "easy311@mit.edu", // Change to your verified sender
      subject: "New Easy 311 Request Made",
      text: `Hello! 
      
      A new Easy 311 submission has been made. Please check the spreadsheet: https://docs.google.com/spreadsheets/d/1BQB3HWjFXnxcbvG0uzv72dLMk3CkI7whFJoufnUa_Y0/edit?usp=sharing.
      
      Here is the information:
          Name: ${request.body.name}
          Email: ${request.body.email}
          Phone: ${request.body.phone}
          Category: ${request.body.category}
          Description: ${request.body.description}
          Location: ${request.body.address}

      If the user provided images, you will be able to access them via the link in the spreadhseet.

      If the contact information is given, please reach out to the user for updates on the status of the request. Thank you for looking after the Philadelphia community!

      Best, 
      Easy 311
      `,
    };

    // sgMail
    //   .send(msg)
    //   .then(() => {
    //     console.log("Email sent");
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });

    if (request.body.email) {
      const msg_2 = {
        to: `${request.body.email}`, // Change to your recipient
        from: `easy311@mit.edu`, // Change to your verified sender
        subject: `Thank you for your Easy 311 Submission, ${
          request.body.name ? request.body.name : ""
        }`,
        text: `

        Thank you for your Easy 311 Submission, ${
          request.body.name ? request.body.name : ""
        }!

        Here is what we received from you:
            Name: ${request.body.name}
            Email: ${request.body.email}
            Phone: ${request.body.phone}
            Category: ${request.body.category}
            Description: ${request.body.description}
            Location: ${request.body.address}
            Your images have been uploaded to our data base.

        A volunteer/advocate will be in touch with you shortly to update you on the status of this request. Thank you for looking after the Philadelphia community!

        Best,
        Easy 311
      `,
      };

      sgMail
        .send(msg_2)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });
    }

    // if (request.body.phone) {
    //   twilClient.messages
    //   .create({
    //      body: 'McAvoy or Stewart? These timelines can get so confusing.',
    //      from: '+13609970826',
    //      statusCallback: 'https://enn1ytq92dedf.x.pipedream.net/',
    //      to: `+1${request.body.}`
    //    })
    //   .then(message => console.log(message.sid));
    // }

    res.send(response);
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
  callback_reactions = (c) => {
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

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;



app.get("/get_subscriptions", async (request, response) => {
  callback_subs = (c) => {
    return response.send(c);
  };


  subscriptionModel.findOne({ encrypted: request.query.id }).exec((err, res) => {
    if (err) {
      console.log(err);
      return response.status(500).send(err);
    } else {
      return callback_subs(res);
    }
  });
});


// POST delete a subscription from the database
app.post("/delete_subscription", async (request, response) => {
  const encrypted = request.body.encrypted;
  const subType = request.body.subType;
  const subTo = request.body.subTo;

  try {
    if (subType === "neighborhoods") {
      db.collection("subscriptions").updateOne(
        { encrypted: encrypted },
        {
          $pull: { neighborhoods: { $in: [ subTo ] }}
        },
        { upsert: true }
      );
    } else {
      db.collection("subscriptions").updateOne(
        { encrypted: encrypted },
        {
          $pull: { requests: { $in: [ subTo ] }}
        },
        { upsert: true }
      );
    }

    var cryptorjs = require('cryptorjs');
    var myCryptor = new cryptorjs(ENCRYPTION_KEY);
    var email = myCryptor.decode(encrypted);

    let emailMsg = "";
    if (subType === "neighborhoods") {
      emailMsg = `receiving update emails regarding the status of service request ${subTo}`;
    } else {
      emailMsg = `receiving update emails regarding the status updates of service requests in ${subTo}`;
    }

    const msg = {
      to: email, // Change to your recipient
      from: "easy311@mit.edu", // Change to your verified sender
      subject: "Easy 311 Subscription Removed!",
      text: `Hello! 
      
      This email confirms you've been unsubscribed from ${emailMsg}. 

      You can manage your subscriptions here: www.easy311.app/subscription/?id=${encrypted}.
      
      Best, 
      Easy 311
      `,
    };

    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
        console.log(encrypted, typeof encrypted);
      })
      .catch((error) => {
        console.error(error);
      });

    response.status(200).send("success");
    console.log("success!");
  } catch (error) {
    console.log("ERROR ", error);
    response.status(500).send(error);
  }
})



// POST add a new subscription to the database
app.post("/add_subscription", async (request, response) => {
  
  var cryptorjs = require('cryptorjs');
  var myCryptor = new cryptorjs(ENCRYPTION_KEY);

  const email = request.body.email;
  const subType = request.body.subType;
  const subTo = request.body.subTo;

  var encrypted = myCryptor.encode(email);

  try {
    if (subType === "neighborhoods") {
      db.collection("subscriptions").updateOne(
        { email: email },
        {
          $addToSet: { neighborhoods: subTo },
          $set : {encrypted: encrypted}
        },
        { upsert: true }
      );
    } else {
      db.collection("subscriptions").updateOne(
        { email: email },
        {
          $addToSet: { requests: subTo },
          $set: {
            encrypted: encrypted,
          },
        },
        { upsert: true }
      );
    }

    let emailMsg = "";
    if (subType === "neighborhoods") {
      emailMsg = `receive update emails regarding the status of service requests made in ${subTo}`;
    } else {
      emailMsg = `receive update emails regarding the status updates of service requests #${subTo}`;
    }

    const msg = {
      to: email, // Change to your recipient
      from: "easy311@mit.edu", // Change to your verified sender
      subject: "New Easy 311 Subscription Made!",
      text: `Hello! 
      
      This email confirms you've been subscribed to ${emailMsg}. 

      Please manage your subscriptions here: www.easy311.app/subscription/?id=${encrypted}.
      
      Best, 
      Easy 311
      `,
    };

    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
        console.log(encrypted, typeof encrypted);
      })
      .catch((error) => {
        console.error(error);
      });

    response.status(200).send("success");
    console.log("success!");
  } catch (error) {
    console.log("ERROR ", error);
    response.status(500).send(error);
  }
});



app.get("/get_req", async (req, res, next) => {
  try {
    axios
        .get(
          `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM public_cases_fc WHERE service_request_id = ${parseInt(req.query.id)}`
        )
        .then((response) =>
          res.json(response.data.features.filter((d) => d.geometry !== null))
        )
        .catch((error) => {
          console.log(error);
        });
  } catch (err) {
    next(err);
  }}
)

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
          `https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM public_cases_fc WHERE requested_datetime >= current_date - ${time} AND service_name != 'Information Request'`
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

app.get("/philly", async (req, res, next) => {
  try {
    axios
      .get(
        `https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Limits/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=`
      )
      .then((response) => {
        res.send(response.data.features);
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  } catch (err) {
    next(err);
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
