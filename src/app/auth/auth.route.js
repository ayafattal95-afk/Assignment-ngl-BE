import {Router} from 'express';
import * as authController from './controller/auth.controller.js';

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.patch('/verfiy-account', authController.verifyAccount);
authRouter.post('/login', authController.login);
authRouter.post('/send-otp', authController.sendOtp)


export default authRouter;