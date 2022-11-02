const path = require('path');
const express = require("express");
const axios = require('axios')


const PORT = process.env.PORT || 3001;

const app = express();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));



// Handle GET requests to /api route
app.get("/api", async (req, res, next) => {
  try {
    axios.get("https://phl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM public_cases_fc WHERE requested_datetime >= current_date - 7")
    .then(response => res.json(response.data.features.filter(d => d.geometry !== null)))
    .catch(error => {
      console.log(error);
    });
  }
  catch (err) {
    next(err)
  }
})

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});