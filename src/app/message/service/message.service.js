import * as userRepository from '../../user/repository/user.repository.js';
import {userNotExist} from "../../user/errors.js";
import * as messageRepository from '../../message/repository/message.repository.js';

export async function sendMessage(content, receiver, sender) {
    // 1. check receiver exists
    const user = await userRepository.findUSerById(receiver);
    if (!user) throw userNotExist;
    // 2. save message into DB
    return await messageRepository.createMessage(content, receiver, sender);

}