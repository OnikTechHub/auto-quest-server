const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.post("/api/cars", async (req, res) => {
      try {
        const newCar = req.body;
        const result = await carsCollection.insertOne(newCar);
        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.get("/api/cars", async (req, res) => {
      try {
        const result = await carsCollection.find().toArray();
        res.send({ success: true, data: result });
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