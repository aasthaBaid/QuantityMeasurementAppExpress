const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const sequelize = require("./src/config/db");
const quantityRoutes = require("./src/routes/quantityRoutes");


dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());

app.use("/api/v1/quantities", quantityRoutes);

sequelize.sync()
  .then(() => {
    console.log("Database Connected");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.log(err));