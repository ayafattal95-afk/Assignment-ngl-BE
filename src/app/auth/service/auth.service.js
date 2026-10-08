import * as authRepository from '../repository/auth.repository.js';
import * as otpRepository from '../repository/otp.repository.js';
import * as userRepository from '../../user/repository/user.repository.js'
import {sendEmail} from "../../../lib/email/nodemailer.js";
import {toMs} from "../../../pkg/utils/time.js";
import {otpExpired, invalidCode, invalidPassword} from "../errors.js";
import {userAlreadyVerified, userNotExist, userAlreadyExists, userNotVerified} from "../../user/errors.js";
import {generateOTPCode} from "../../../lib/utils/otp.js";
import {logger} from "../../../pkg/logger/logger.js";
import {generateToken} from "../utils/token.js";
import {comparePassword, hashPassword} from "../utils/hash.js";
import {OAuth2Client} from "google-auth-library";
import {verifyGoogleToken} from "../../../lib/utils/google-auth.js";
import {mailjetProvider} from "../../../lib/email/int.js";

export async function register(userData) {
    // 1. check user existence
    const userExists = await authRepository.checkUserExistByEmail(userData.email);
    // 2. if yes, throw an error
    if (userExists) throw userAlreadyExists
    // 3. prepare data [hash-password]
    userData.password = await hashPassword(userData.password);
    // 4. save user into DB -> isVerified: false
    const createdUser = await authRepository.createUser(userData);
    // 5. generate and save otp into DB
    const code = generateOTPCode();
    logger.info(code);
    await otpRepository.createOTP({
        code:code,
        email: userData.email,
        expiresAt: Date.now(Date.now() + toMs(5, 'minutes')),
    });
    // 6. send email verification OTP
    await mailjetProvider.sendMail(
        userData.email,
        'verification code',
        `<h1>Your verification code is ${code} </h1>`
    );
    return createdUser;
}

export async function verifyAccount (email, code) {
    // 1. check user existence
    const user = await authRepository.checkUserExistByEmail(email);
    // 1.1 if you don't exist >> error "User not exist."
    if (!user) throw userNotExist;
    // 1.2 if isVerified = true >> error "You already verified"
    if (user.isVerified === true) throw userAlreadyVerified;
    // 2. check otp validation
    const otp = await otpRepository.getOtpByEmail(email); // {code, email} | null
    // 2.1 not exist into DB >> error >> "otp expired" >> resend otp
    if (!otp) throw otpExpired
    // 2.2 otp stored into DB >> code not equal code stored >> error >> 'Invalid otp'
    if (otp.code !== code) throw invalidCode;
    // 3. Switch you isVerified to true [update user]
    const updatedUser = await userRepository.updateUserByEmail(email, {isVerified: true});
    // 4. delete otp from DB
    await otpRepository.deleteOTPsByEmail(email);

    return updatedUser;
}

export async function login (email, password) {
    // 1. check user existence
    const user = await authRepository.checkUserExistByEmail(email); // {} | null
    // 1.1 not exist
    if (!user) throw userNotExist;
    // 1.2 not verified
    if(user.isVerified === false) throw userNotVerified;
    // 2. compare password
    const match = await comparePassword(password, user['password']);
    if(!match) throw invalidPassword;
    // 3. generate access Token
    return generateToken({id: user._id, name: user.name});
}

export async function sendOtp(email) {
    // 1. check user existence
    const user = await authRepository.checkUserExistByEmail(email);
    if (!user) throw userNotExist;
    // 2. delete all old OTPs
    await otpRepository.deleteOTPsByEmail(email);
    // 3. generate OTP and save it into DB
    const code = generateOTPCode();
    await otpRepository.createOTP({
        code:code,
        email: email,
        expiresAt: Date.now() + toMs(3, 'minutes'),
    });
    // 4. send otp email
    await mailjetProvider.sendMail(email, 'new otp', `<p>you new otp is ${code}</p>`);
}

export async function  resetPassword (email, code, newPassword) {
    // 1. verify otp code
   const otp = await otpRepository.getOtpByEmail(email); // {} | null
    if (!otp) throw otpExpired;
    if (otp.code !== code) throw invalidCode;
    // 2. hash password
    const hashedPassword = await hashPassword(newPassword);
    // 3. update user password
    await userRepository.updateUserByEmail(email, {password: hashedPassword});
    // 4. delete otp
    await otpRepository.deleteOTPsByEmail(email);
}

export async function loginWithGoogle(idToken) {
    // 1. verify idToken >> jvodjfoivjgoijvoresihoufjpreoksf'pocjkproeifjupoeusjrhpf
    const payload = await verifyGoogleToken(idToken);
    // 2. check user exists
    const user = await authRepository.checkUserExistByEmail(payload.email);
    // 3. if exists >> generate Token
    if(user) {
        return generateToken({
            id: user._id,
            email: user.email,
        });
    }
    // 4. if not exist create user >> generate Token
    const createdUser = await authRepository.createUser({
        name: payload.name,
        email: payload.email,
        provider : 'google',
        isVerified: true,
    });
    return generateToken({
        id: createdUser._id,
        email: createdUser.email,
    })
}


