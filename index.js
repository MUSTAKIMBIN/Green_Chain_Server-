const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middlewere
app.use(cors());
app.use(express.json());
// CVqbHVCx84e5KqKy
// GreenChain

// mongodb uri
const uri =
  "mongodb+srv://GreenChain:CVqbHVCx84e5KqKy@cluster0.96upm.mongodb.net/?appName=Cluster0";
// mongobd client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("greenDB");
    const cropsCollection = database.collection("crops");

    // crops apis
    app.post("/crops", async (req, res) => {
      const newCrops = req.body;
      const result = await cropsCollection.insertOne(newCrops);
      res.send(result);
    });

    app.get("/crops", async (req, res) => {
      const corsor = cropsCollection.find();
      const result = await corsor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// running the server
app.get("/", (req, res) => {
  res.send("Green Chain Is Rinning ohh");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
