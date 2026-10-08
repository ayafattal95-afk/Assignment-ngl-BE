import mongoose from "mongoose";
import {config} from "dotenv";
import {env} from "../config/env.js";


mongoose.connect(env.db.url);

