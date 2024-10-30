const mongoose = require("mongoose");
const process = require("process");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB successfully connected");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        if (process.env.NODE_ENV !== 'test') process.exit(1);
    }
};

module.exports = connectDB;

