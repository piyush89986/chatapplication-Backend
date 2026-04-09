import { Server } from "socket.io";
import messageModel from "../models/message.model.js";

let io;

export default function InitSocket(server) {
    const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => normalizeOrigin(origin)).filter(Boolean)
        : [];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins.length ? allowedOrigins : true,
            credentials: true,
        }
    });

    io.on("connection", (socket) => {

        console.log(socket.id + " socket connected");

        // user join room
        socket.on("join", (userId) => {
            socket.join(userId)
        });

        // join chat room
        socket.on("chatroom", (chatId) => {
            socket.join(chatId)
        });

        // typing indicator
        socket.on("typing", (chatId) => {
            socket.to(chatId).emit("typing");
        });

        socket.on("stopTyping", (chatId) => {
            socket.to(chatId).emit("stopTyping");
        });

        socket.on("messageDelivered", async ({ messageId, userId, chatId }) => {
            await messageModel.findByIdAndUpdate(messageId, {
                delivered: true,
                $addToSet: { seen: userId },
            });

            socket.to(chatId).emit("deliverd", { messageId, userId, chatId ,message : "delivered"})
        });

        socket.on("disconnect", (reason) => {
            console.log(reason + " socket disconnected");
        });
    });

    return io;
};


export const getIo = () => io;