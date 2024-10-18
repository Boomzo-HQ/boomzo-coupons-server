const { config } = require("dotenv");
const express = require("express");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/AppError.js");
const mainRouter = require("./routes/mainRoutes.js");

config({ path: "./.env" });

const app = express();

// CORS
app.use(cors());
app.use(express.json({ limit: "10kb" }));


// ROUTES
app.use(mainRouter)
app.all("/", (req, res, next) => {
    res.send("Hello from Boomzo")
});
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);


// Database Connection (using async/await for cleaner syntax)
async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if MongoDB is not available
            socketTimeoutMS: 10000, // Close sockets after 10 seconds of inactivity
        });
        console.log("DB connection successful");
    } catch (err) {
        console.error("DB connection failed", err);
        process.exit(1); // Exit process if the database connection fails
    }
};


// Start the server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
    console.log(`Server running to port ${PORT}`);
});


// Handle uncaught exceptions (synchronous errors)
process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.log(err);
    console.log(err.name, err.message);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});