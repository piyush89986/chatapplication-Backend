import MessageModel from "../models/message.model.js";
import chatModel from "../models/chat.model.js";
import userModel from "../models/user.model.js"
import ServerResponse from "../response/pattern.js";
import { getIo } from "../websocketServer/socket.js";

// one and one chat option created-
export const accessChat = async (req, res) => {
    const { receiverId } = req.body;
    const myId = req.user.id;
    try {

        if (!receiverId) {
            return res.status(400).json(new ServerResponse(false, null, "receiverId required", null));
        }

        let reciver = await userModel.findById(receiverId).select("user_name _id phone email avatar").lean();

        let chat = await chatModel.findOne({
            isGroupChat: false,
            members: { $all: [myId, receiverId], $size: 2 },
        })
            .populate("members", "_id user_name email phone avatar")
            .populate("lastMessage")
            .lean();


        if (chat) {
            chat.reciver = reciver;
            return res.status(200).json(new ServerResponse(true, chat, "success", null));
        }

        const newChat = await chatModel.create({
            members: [myId, receiverId],
        });

        newChat.reciver = reciver;
        res.status(201).json(new ServerResponse(true, newChat, "chat created", null));

    } catch (error) {
        res.status(500).json(new ServerResponse(false, null, error.message, error));
    }
};

/**
 * Create Group Chat
 */
export const createGroupChat = async (req, res) => {
    const { members, groupName } = req.body;

    if (!members || members.length < 2) {
        return res.status(400).json(new ServerResponse(false, null, "At least 2 users required", null));
    }

    try {

        const groupChat = await chatModel.create({
            members: [...members, req.user.id],
            isGroupChat: true,
            groupName,
            groupAdmin: req.user.id,
        });

        res.status(201).json(new ServerResponse(true, groupChat, "success", null));

    } catch (error) {
        res.status(500).json(new ServerResponse(false, null, error.message, error));
    }
};

/**
 * Get My Chats
 */
export const getMyChats = async (req, res) => {
    try {
        let chats = await chatModel.find({
            members: req.user.id,
        })
            .populate("members", "_id user_name email phone avatar")
            .populate({
                path: "lastMessage",
                select: "sender message createdAt delivered seen",
            })
            .sort({ updatedAt: -1 })
            .lean();

        res.json(new ServerResponse(true, chats, "success", null));
    } catch (error) {
        res.status(500).json(new ServerResponse(false, null, error.message, error));
    }
};


/**
 * Send Message
 */
export const sendMessage = async (req, res) => {
    const { chatId, message } = req.body;

    try {

        let getMessage = await MessageModel.create({
            chatId,
            sender: req.user.id,
            message,
        });

        await chatModel.findByIdAndUpdate(chatId, {
            lastMessage: getMessage._id,
        });

        getMessage = getMessage.toObject();

        getMessage.sender = req.userData

        let io = getIo();

        io.to(chatId).emit("newMessage", getMessage);


        res.status(201).json(new ServerResponse(true, getMessage, "message Sent", null));

    } catch (error) {
        res.status(500).json(new ServerResponse(false, null, error.message, error));
    }
};

/**
 * Get Messages of a Chat
 */
export const getMessages = async (req, res) => {
    const { chatId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;
    try {
        const messages = await MessageModel.find({ chatId })
            .populate("sender", "user_name email")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json(new ServerResponse(true, messages, "success", null));
    } catch (error) {
        res.status(500).json(new ServerResponse(false, null, error.message, error));
    }
};

