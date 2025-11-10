import express from "express";
import { createPool } from "./poolingController";

const router = express.Router();

router.post("/", createPool);

export default router;
