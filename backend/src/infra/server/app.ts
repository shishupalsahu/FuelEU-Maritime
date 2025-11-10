const express = require("express");
const dotenv = require("dotenv");
import type {Request,Response} from "express"
const cors = require("cors"); // ✅ correct import
import routesRouter from "../../adapters/inbound/http/routesRouter";
import complianceRouter from "../../adapters/inbound/http/complianceRouter";
import poolingRouter from "../../adapters/inbound/http/poolingRouter";


dotenv.config(); // ✅ loads .env variables

const app = express();

app.use(cors()); // ✅ enables CORS
app.use(express.json());

// health check route
app.get("/", (req:Request, res:Response) => {
  res.send("FuelEU Maritime Backend is running 🚢");
});
app.use("/routes", routesRouter);
app.use("/compliance", complianceRouter);
app.use("/pools", poolingRouter);


module.exports = app; // ✅ CommonJS export
