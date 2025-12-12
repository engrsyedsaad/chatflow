const chatModel = require("../model/chat.model")
const messageModel = require("../model/message.model")
const chatMiddleware = require("../middleware/chat.middleware")
const { generateResponse, generateVector } = require("../service/ai.service")
const { createMemory, queryMemory } = require("../service/vector.service")

async function createChatController(req, res) {
    try {
        const { chat } = req.body

        const newChat = await chatModel.create({
            user: req.user._id,
            chat
        })
        
        res.status(201).json({
            message: "Chat Created Successfully",
            chat: newChat
        })
    } catch (err) {
        res.status(500).json({
            message: "Error creating chat",
            error: err.message
        })
    }
}

async function getAllChatsController(req, res) {
    try {
        const chats = await chatModel.find({ user: req.user._id }).sort({ createdAt: -1 })
        
        res.status(200).json({
            message: "Chats retrieved successfully",
            chats
        })
    } catch (err) {
        res.status(500).json({
            message: "Error fetching chats",
            error: err.message
        })
    }
}

async function getChatMessagesController(req, res) {
    try {
        const { chatId } = req.params
        
        const messages = await messageModel.find({ chat: chatId })
            .populate('user', 'email fullName')
            .sort({ createdAt: 1 })
        
        res.status(200).json({
            message: "Messages retrieved successfully",
            messages: messages.map(msg => ({
                _id: msg._id,
                content: msg.content,
                role: msg.role,
                user: msg.user,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
                timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            }))
        })
    } catch (err) {
        res.status(500).json({
            message: "Error fetching messages",
            error: err.message
        })
    }
}

async function sendMessageController(req, res) {
    try {
        const { chatId } = req.params
        const { content, role } = req.body

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Message content is required"
            })
        }

        // Save user message
        const userMessage = await messageModel.create({
            user: req.user._id,
            chat: chatId,
            content: content.trim(),
            role: role || "user"
        })

        console.log("User message saved:", {
            _id: userMessage._id,
            chat: chatId,
            role: userMessage.role
        })

        // Generate vector embedding for the user message
        let userVector = null
        try {
            userVector = await generateVector(content)
            // Save vector to Pinecone
            await createMemory({
                vector: userVector,
                metadata: {
                    messageId: userMessage._id.toString(),
                    chatId: chatId.toString(),
                    role: "user",
                    content: content.trim()
                },
                messageId: userMessage._id.toString()
            })
            
            // Update message with vector
            await messageModel.findByIdAndUpdate(userMessage._id, {
                vectorEmbedding: userVector,
                vectorId: userMessage._id.toString()
            })
        } catch (vectorErr) {
            console.log("Vector generation error:", vectorErr.message)
        }

        // Get Short Term Memory (last 10 messages)
        const stmMessages = await messageModel.find({
            chat: chatId
        }).sort({ createdAt: -1 }).limit(10).lean()

        console.log("STM retrieved:", {
            chatId,
            messageCount: stmMessages.length,
            messages: stmMessages.map(m => ({
                role: m.role,
                contentLength: m.content.length
            }))
        })

        // Get Long Term Memory (semantic search)
        let ltmMessages = []
        try {
            if (userVector) {
                ltmMessages = await queryMemory({
                    queryVector: userVector,
                    limit: 3,
                    metadata: { chatId: chatId.toString() }
                })
                console.log("LTM retrieved:", {
                    matchesFound: ltmMessages.length,
                    matches: ltmMessages.map(m => ({
                        score: m.score,
                        hasContent: !!m.metadata?.content
                    }))
                })
            }
        } catch (ltmErr) {
            console.log("LTM query error:", ltmErr.message)
        }

        // Build conversation context with STM and LTM
        const ltmContext = ltmMessages && ltmMessages.length > 0
            ? `\n\nRelevant previous context:\n${
                ltmMessages
                    .map(m => m.metadata?.content)
                    .filter(c => c)
                    .join('\n---\n')
              }`
            : ''

        const conversationMessages = [
            {
                role: "user",
                parts: [{
                    text: `You are a helpful AI assistant. Use the following context from previous conversations:${ltmContext}`
                }]
            },
            ...stmMessages.map(msg => ({
                role: msg.role,
                parts: [{
                    text: msg.content
                }]
            })).reverse()
        ]

        console.log("Conversation context prepared:", {
            stmMessages: conversationMessages.length - 1,
            ltmContextLength: ltmContext.length,
            totalMessages: conversationMessages.length
        })

        // Generate AI response
        let aiResponse = null
        let aiMessage = null
        try {
            const aiContent = await generateResponse(conversationMessages)
            
            aiMessage = await messageModel.create({
                user: req.user._id,
                chat: chatId,
                content: aiContent,
                role: "model"
            })

            console.log("AI response saved:", {
                _id: aiMessage._id,
                contentLength: aiContent.length
            })
            
            // Generate vector for AI response
            try {
                const aiVector = await generateVector(aiContent)
                // Save vector to Pinecone
                await createMemory({
                    vector: aiVector,
                    metadata: {
                        messageId: aiMessage._id.toString(),
                        chatId: chatId.toString(),
                        role: "model",
                        content: aiContent.trim()
                    },
                    messageId: aiMessage._id.toString()
                })
                
                // Update message with vector
                await messageModel.findByIdAndUpdate(aiMessage._id, {
                    vectorEmbedding: aiVector,
                    vectorId: aiMessage._id.toString()
                })
            } catch (aiVectorErr) {
                console.log("AI vector error:", aiVectorErr.message)
            }
            
            aiResponse = aiMessage
        } catch (aiErr) {
            console.log("AI response error:", aiErr.message)
        }

        // Format response with timestamps
        const formattedUserMessage = {
            _id: userMessage._id,
            content: userMessage.content,
            role: userMessage.role,
            createdAt: userMessage.createdAt,
            timestamp: new Date(userMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }

        const formattedAiResponse = aiMessage ? {
            _id: aiMessage._id,
            content: aiMessage.content,
            role: aiMessage.role,
            createdAt: aiMessage.createdAt,
            timestamp: new Date(aiMessage.createdAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        } : null

        res.status(201).json({
            message: "Message sent successfully",
            userMessage: formattedUserMessage,
            aiResponse: formattedAiResponse
        })
    } catch (err) {
        res.status(500).json({
            message: "Error sending message",
            error: err.message
        })
    }
}

async function deleteChatController(req, res) {
    try {
        const { chatId } = req.params
        
        // Delete all messages in the chat first
        await messageModel.deleteMany({ chat: chatId })
        
        // Delete the chat
        const deletedChat = await chatModel.findByIdAndDelete(chatId)
        
        if (!deletedChat) {
            return res.status(404).json({
                message: "Chat not found"
            })
        }
        
        res.status(200).json({
            message: "Chat deleted successfully",
            deletedChatId: chatId
        })
    } catch (err) {
        res.status(500).json({
            message: "Error deleting chat",
            error: err.message
        })
    }
}

module.exports = {
    createChatController,
    getAllChatsController,
    getChatMessagesController,
    sendMessageController,
    deleteChatController
}

