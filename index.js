const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT 

app.use(cors({
  origin: ["http://localhost:3000"], 
  credentials: true 
}));

app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully! 🎉");

    const db = client.db("autoQuestDB");
    const carsCollection = db.collection("cars");

//  Add Car API 1

    app.post("/api/cars", async (req, res) => {
      try {
        const newCar = req.body;
        const result = await carsCollection.insertOne(newCar);
        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // Add Car API 2

    app.get("/api/cars", async (req, res) => {
      try {
        const result = await carsCollection.find().toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  Single Car Details API

    app.get("/api/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;
        
        const query = { _id: new ObjectId(id) };
        const result = await carsCollection.findOne(query);
        
        if (result) {
          res.send({ success: true, data: result });
        } else {
          res.status(404).send({ success: false, message: "Car not found" });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });
    
  } catch (error) {
    console.error("Database connection error:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("AutoQuest Server is active and waiting for Add Car data...");
});

app.listen(PORT, () => {
    console.log(`Server is perfectly running on port: ${PORT}`);
});