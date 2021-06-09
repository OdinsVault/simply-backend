const express = require("express");
const app = express();
const morgan = require("morgan");
const {existsSync, mkdirSync} = require('fs');
const {resolve} = require('path');
const mongoose = require("mongoose");
const { ENV, CODEDIR } = require("./resources/constants");

mongoose.connect(
  "mongodb+srv://root:" +
    ENV.MONGO_PW +
    "@simplycluster.jqldp.mongodb.net/simply-mongodb?retryWrites=true&w=majority",
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }
);

app.use(morgan("dev"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// create temp code directory to compile & execute files
if (!existsSync(resolve(__dirname, CODEDIR))) {
    mkdirSync(resolve(__dirname, CODEDIR));
}

// Support for multiple origins
// get the comma delimited string of origins
const origins = ENV.ORIGINS.split(',');
//CORSE Error prevention
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", origins.find(org => org === req.headers.origin) || origins[0]);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    return res.status(200).json({});
  }
  next();
});

app.get('/', (_, res) => {
  console.log("Welcome to platform...");
  res.json({ message: "Welcome to platform..." });
});

//Routes>>>>>>>>>>>>>>>>
app.use('/v1', require('./routes'));


// Handle unmatched routes
app.use((_, res) => {
  res.status(404).json({message: 'Not found!'});
});

const port = ENV.PORT || 8080;
app.listen(port, () => console.log(`Server listening on port ${port}!`));
