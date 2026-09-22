import * as authService from "../service/auth.service.js";
import {toMs} from "../../../common/utils/time.js";

export async function register (req,res,next){
    try{
        const createdUser = await authService.register(req.body);
        res.status(201).json({
            message: 'User created successfully.',
            success: true,
            data: createdUser
        });
    }catch(err){
        next(err);
    }
}

export async function verifyAccount(req,res,next){
    try{
        const {email, code} = req.body;
        const updatedUser = await authService.verifyAccount(email, code);
        res.status(201).json({
            message: 'User verified successfully.',
            success: true,
            data: updatedUser
        })
    }catch(err){
        next(err);
    }
}

export async function login (req,res,next){
    try{
        const {email, password} = req.body;
        const token = await authService.login(email, password);
        res.cookie('access_token', token, {
            httpOnly: true, // BE http request -> ser or modify not js code
            maxAg: toMs (1, 'hours'),
        });
        res.json({
            message: 'User login successfully.',
            success: true
        });
    }catch(err){
        next(err);
    }
}

export async function sendOtp (req,res,next){
    try{
        const {email} = req.body;
        await authService.sendOtp(email);
        res.status(201).json({
            message: 'new otp sent, check user email',
            success: true,
        });
    }catch(err){
        next(err);
    }
}