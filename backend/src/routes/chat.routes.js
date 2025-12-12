const express = require('express')

const chatRoutes = express.Router()
const chatMiddleware = require("../middleware/chat.middleware")
const {
    createChatController,
    getAllChatsController,
    getChatMessagesController,
    sendMessageController,
    deleteChatController
} = require('../controller/chat.controller')

// Create a new chat
chatRoutes.post("/chats", chatMiddleware, createChatController)

// Get all chats for the user
chatRoutes.get("/chats", chatMiddleware, getAllChatsController)

// Get messages for a specific chat
chatRoutes.get("/chats/:chatId/messages", chatMiddleware, getChatMessagesController)

// Send a message in a chat
chatRoutes.post("/chats/:chatId/messages", chatMiddleware, sendMessageController)

// Delete a chat
chatRoutes.delete("/chats/:chatId", chatMiddleware, deleteChatController)

module.exports = chatRoutes
