const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middlewere
app.use(cors());
app.use(express.json());

// running the server
app.get("/", (req, res) => {
  res.send("Green Chain Is Rinning ohh");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
