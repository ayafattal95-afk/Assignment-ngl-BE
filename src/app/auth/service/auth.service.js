import * as authRepository from '../repository/auth.repository.js';
import * as otpRepository from '../repository/otp.repository.js';
import * as userRepository from '../../user/repository/user.repository.js'
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import {sendEmail} from "../../../common/email/nodemailer.js";
import {toMs} from "../../../common/utils/time.js";
import {otpExpired, invalidCode, invalidPassword} from "../errors.js";
import {userAlreadyVerified, userNotExist, userAlreadyExists, userNotVerified} from "../../user/errors.js";
import {generateOTPCode} from "../../../common/utils/otp.js";

export async function register(userData) {
    // 1. check user existence
    const userExists = await authRepository.checkUserExistByEmail(userData.email);
    // 2. if yes, throw an error
    if (userExists) throw userAlreadyExists
    // 3. prepare data [hash-password]
    userData.password = await bcrypt.hash(userData.password, 10);
    // 4. save user into DB -> isVerified: false
    const createdUser = await authRepository.createUser(userData);
    // 5. generate and save otp into DB
    const code = generateOTPCode();
    await otpRepository.createOTP({
        code:code,
        email: userData.email,
        expiresAt: Date.now(Date.now() + toMs(5, 'minutes')),
    });
    // 6. send email verification OTP
    await sendEmail(
        userData.email,
        'verification code',
        `<h1>Your verification code is ${otp} </h1>`
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
    await otpRepository.deleteOTP(email);

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
    const match = await bcrypt.compare(password, user.password);
    if(!match) throw invalidPassword;
    // 3. generate access Token
    const token = jwt.sign(
        {id: user.id, email: user.email, name: user.name},
        process.env.JWT_SECRET,
        {expiresIn: toMs(1, 'hours')}
        );
    return token;
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
    await sendEmail(email, 'new otp', `<p>you new otp is ${code}</p>`);
}
