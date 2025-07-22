require("dotenv").config();
const express = require("express");

// Import the route
const placesRoutes = require("./routes/places");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/", placesRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
