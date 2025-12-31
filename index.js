const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://gameReview:gamereview@cluster0.uf9fl2q.mongodb.net/?appName=Cluster0";

// const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("GameReviewsDB");
    const gameReviewCollection = db.collection("gamereviews");
    const watchListCollection = db.collection("watchList");

    /* ================= REVIEWS ================= */

    app.post("/addReview", async (req, res) => {
      const review = req.body;
      // Check if the incoming data is an array
      if (Array.isArray(review)) {
        const result = await gameReviewCollection.insertMany(review);
        res.send(result);
      } else {
        const result = await gameReviewCollection.insertOne(review);
        res.send(result);
      }
    });

    app.get("/reviews", async (req, res) => {
      const result = await gameReviewCollection.find().toArray();
      res.send(result);
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await gameReviewCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.patch("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const updatedReview = req.body;

      const result = await gameReviewCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            review: updatedReview.review,
            rating: updatedReview.rating,
            imageUrl: updatedReview.imageUrl,
          },
        }
      );
      res.send(result);
    });

    app.delete("/deleteReview/:id", async (req, res) => {
      const id = req.params.id;
      const result = await gameReviewCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    /* ================= WATCH LIST ================= */

    // ➕ Add to WatchList
    app.post("/watchlist", async (req, res) => {
      const watchListData = req.body;

      // 1. Basic Validation: Ensure required names are present
      if (!watchListData.reviewerName) {
        return res
          .status(400)
          .send({ message: "Original reviewer name is missing" });
      }

      // 2. Duplicate prevention
      const exists = await watchListCollection.findOne({
        reviewId: watchListData.reviewId,
        addWatchListReviewerEmail: watchListData.addWatchListReviewerEmail,
      });

      if (exists) {
        return res.status(409).send({ message: "Already added to watchlist" });
      }

      watchListData.addedAt = new Date();

      const result = await watchListCollection.insertOne(watchListData);
      res.send(result);
    });

    // 📥 Get WatchList (email wise optional)
    app.get("/watchlist", async (req, res) => {
      const email = req.query.email;

      let query = {};
      if (email) {
        query = { addWatchListReviewerEmail: email };
      }

      const result = await watchListCollection.find(query).toArray();
      res.send(result);
    });

    // ❌ Remove from WatchList
    app.delete("/watchlist/:id", async (req, res) => {
      const id = req.params.id;
      const result = await watchListCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    console.log("✅ MongoDB Connected Successfully!");
  } finally {
    // keep connection alive
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("🚀 Game Review Server Running");
});
