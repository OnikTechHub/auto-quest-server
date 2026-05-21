const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully! ");

    const db = client.db("autoQuestDB");
    const carsCollection = db.collection("cars");
    const bookingsCollection = db.collection("bookings");

    //  Add Car API
    app.post("/api/cars", async (req, res) => {
      try {
        const newCar = req.body;

        if (!newCar.bookingCount) newCar.bookingCount = 0;
        const result = await carsCollection.insertOne(newCar);
        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  All Cars API
    app.get("/api/cars", async (req, res) => {
      try {
        const { search, carType, sortBy } = req.query;
        let query = {};

        if (search) {
          query.carName = { $regex: search, $options: "i" };
        }

        if (carType && carType !== "All") {
          query.carType = carType;
        }

        let sortOptions = {};
        if (sortBy === "priceLowHigh") {
          sortOptions = { dailyPrice: 1 }; 
        } else if (sortBy === "priceHighLow") {
          sortOptions = { dailyPrice: -1 }; 
        } else {
          sortOptions = { _id: -1 }; 
        }

        const result = await carsCollection
          .find(query)
          .sort(sortOptions)
          .toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  My Added Cars API
    app.get("/api/my-cars", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res
            .status(400)
            .send({ success: false, message: "Email query param is required" });
        }
        const query = { userEmail: email };
        const result = await carsCollection.find(query).toArray();
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

    // Book a Car API
    app.post("/api/bookings", async (req, res) => {
      try {
        const bookingData = req.body;
        const result = await bookingsCollection.insertOne(bookingData);

        if (bookingData.carId) {
          await carsCollection.updateOne(
            { _id: new ObjectId(bookingData.carId) },
            { $inc: { bookingCount: 1 } },
          );
        }

        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  User's Bookings API
    app.get("/api/bookings", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res
            .status(400)
            .send({ success: false, message: "Email query param is required" });
        }
        const query = { userEmail: email };
        const result = await bookingsCollection.find(query).toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // Delete Booking API
    app.delete("/api/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const booking = await bookingsCollection.findOne({
          _id: new ObjectId(id),
        });

        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount > 0 && booking && booking.carId) {
          await carsCollection.updateOne(
            { _id: new ObjectId(booking.carId) },
            { $inc: { bookingCount: -1 } },
          );
        }

        res.send({ success: true, deletedCount: result.deletedCount });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  New Car API
    app.post("/api/cars", async (req, res) => {
      try {
        const carData = req.body;
        const result = await carsCollection.insertOne(carData);
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    
    app.get("/api/my-cars", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.send({ success: true, data: [] });
        }
        
        const query = { userEmail: email };
        const result = await carsCollection.find(query).toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  Car Update API (Put)
    app.put("/api/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        delete updatedData._id; 
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };
        const result = await carsCollection.updateOne(filter, updateDoc);
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // car delete API
    app.delete("/api/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await carsCollection.deleteOne(filter);
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

app.get("/", (req, res) => {
  res.send("AutoQuest Server is active and waiting for data...");
});

app.listen(PORT, () => {
  console.log(`Server is perfectly running on port: ${PORT}`);
});
