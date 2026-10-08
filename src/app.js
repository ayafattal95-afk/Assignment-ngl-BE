
import './lib/db/mongoose.js'
import express from 'express';
import cors from 'cors';

import {globalErrorHandler} from "./lib/error/error.handler.js";
import {router} from "./route.js";
import {correlationId} from "./lib/correlation/correlationId.js";
import cookieParser from "cookie-parser";

export function createApp() {
    const app = express();
    app.use(cors({origin: 'http://localhost:4200'}));
    //parse incoming requests buffer to object
    app.use(express.json());
    // parsing cookies
    app.use(cookieParser())

    app.use(correlationId);

    // routes navigate to features
    app.use('/api', router);

    //global error handler
    app.use(globalErrorHandler)

    return app;

}