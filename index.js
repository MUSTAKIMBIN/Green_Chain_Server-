const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// require("dotenv").config();
const dotenv = require("dotenv");
const app = express();
dotenv.config();
const port = process.env.PORT || 3000;

// middlewere
app.use(cors());
app.use(express.json());

// mongodb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.96upm.mongodb.net/?appName=Cluster0`;
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

    // Get a single crop by ID
    app.get("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const crop = await cropsCollection.findOne(query);
      res.send(crop);
    });

    app.patch("/crops/:cropId/interests/:interestId", async (req, res) => {
      try {
        const { cropId, interestId } = req.params;
        const { status } = req.body;

        // ✅ Validate input
        if (!ObjectId.isValid(cropId) || !ObjectId.isValid(interestId)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        if (!status || !["pending", "accepted", "rejected"].includes(status)) {
          return res.status(400).send({ message: "Invalid status value" });
        }

        // ✅ Update interest status in the specific crop
        const result = await cropsCollection.updateOne(
          {
            _id: new ObjectId(cropId),
            "interests._id": new ObjectId(interestId),
          },
          { $set: { "interests.$.status": status } }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Interest not found or already updated" });
        }

        // ✅ Return updated crop document
        const updatedCrop = await cropsCollection.findOne({
          _id: new ObjectId(cropId),
        });

        res.status(200).send(updatedCrop);
      } catch (error) {
        console.error("❌ Error updating interest:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // interested api

    // POST: Add a new interest to a crop
    app.post("/crops/:cropId/interests", async (req, res) => {
      try {
        const { cropId } = req.params;
        const { userEmail, userName, quantity, message } = req.body;

        // Validate ID
        if (!ObjectId.isValid(cropId)) {
          return res.status(400).send({ message: "Invalid Crop ID" });
        }

        // Validate required fields
        if (!userEmail || !userName || !quantity) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        // Create unique interest _id
        const interestId = new ObjectId();

        const interest = {
          _id: interestId,
          cropId,
          userEmail,
          userName,
          quantity,
          message,
          status: "pending",
        };

        // Push interest into crop
        const updateResult = await cropsCollection.updateOne(
          { _id: new ObjectId(cropId) },
          { $push: { interests: interest } }
        );

        if (updateResult.modifiedCount === 0) {
          return res.status(404).send({ message: "Crop not found" });
        }

        // Return updated crop to frontend
        const updatedCrop = await cropsCollection.findOne({
          _id: new ObjectId(cropId),
        });

        res.status(201).send(updatedCrop);
      } catch (error) {
        console.error("❌ Error creating interest:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.get("/myCrops", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query["oner.email"] = email;
      }

      const corsor = cropsCollection.find(query);
      const result = await corsor.toArray();
      res.send(result);
    });
    // GET: Get all interests sent by a user
    app.get("/myInterests", async (req, res) => {
      try {
        const userEmail = req.query.email; // read email from query
        if (!userEmail)
          return res.status(400).send({ message: "Missing user email" });

        const cursor = cropsCollection.find({
          "interests.userEmail": userEmail,
        });
        const crops = await cursor.toArray();

        const userInterests = crops.flatMap((crop) =>
          crop.interests
            .filter((interest) => interest.userEmail === userEmail)
            .map((interest) => ({
              _id: interest._id,
              cropId: crop._id,
              cropName: crop.name,
              ownerName: crop.oner?.name || "Unknown",
              quantity: interest.quantity,
              message: interest.message,
              status: interest.status,
            }))
        );

        res.status(200).send(userInterests);
      } catch (error) {
        console.error("❌ Error fetching user interests:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
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
