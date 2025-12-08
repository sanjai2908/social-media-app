import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import User from "./models/userModel.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // list indexes first (optional debug)
    const indexes = await User.collection.getIndexes();
    console.log("Current indexes on users:", indexes);

    // try dropping username_1 index
    await User.collection.dropIndex("username_1");
    console.log("Dropped index username_1");
  } catch (err) {
    console.error("Error while dropping index:", err);
  } finally {
    process.exit(0);
  }
};

run();
