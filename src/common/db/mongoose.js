import mongoose from "mongoose";
import {config} from "dotenv";

config();
mongoose.connect(process.env.MONGODB_URL);

