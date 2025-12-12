
const { Server } = require("socket.io");
const { generateResponse, generateVector } = require("../service/ai.service")
const cookie = require("cookie")
const jwt = require("jsonwebtoken")
const userModel = require("../model/user.model")
const messageModel = require("../model/message.model")
const { createMemory, queryMemory } = require("../service/vector.service");
const { chat } = require("@pinecone-database/pinecone/dist/assistant/data/chat");


async function createServer(httpServer) {


    const io = new Server(httpServer, {});


    // socket middleware
    io.use(async (socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "")

        if (!cookies.token) {
            next(new Error("Unathorized token not found "))
        }
        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET)
            const user = await userModel.findById(decoded.id)
            socket.user = user
            next()

        }
        catch (err) {
            next(new Error("unauthorized invalid token"))
        }
    })

    //socket functioning 
    io.on("connection", (socket) => {
        console.log("A connection is connected ")
        socket.on("ai-message", async (messagePayload) => {

            //    const data = await messageModel.create({
            //            user:socket.user.id,
            //            chat:messagePayload.chat,
            //            content:messagePayload.content,
            //            role:"user"
            //         })
            //         const vector = await generateVector(messagePayload.content)

            const [data, vector] = await Promise.all([
                messageModel.create({
                    user: socket.user.id,
                    chat: messagePayload.chat,
                    content: messagePayload.content,
                    role: "user"
                }),
                generateVector(messagePayload.content)
            ])

            // console.log("User message created:", {
            //     _id: data._id,
            //     chat: data.chat,
            //     content: data.content,
            //     role: data.role
            // })

            await createMemory({
                    vector,
                    messageId: data._id,
                    metadata: {
                        chat: data.chat.toString(),
                        content: messagePayload.content,
                        role: "user"
                    }
                })
            
            // Query vector database for similar messages
            let similarMessages = []
            try {
                const ltmQuery = await queryMemory({
                    queryVector: vector,
                    limit: 5,
                    metadata: {
                        chat: socket.user.id
                    }
                })
                // console.log("LTM Query Result:", ltmQuery)
                similarMessages = ltmQuery || []
            } catch (ltmErr) {
                // console.log("LTM Query Error:", ltmErr.message)
                similarMessages = []
            }



            // Get conversation history from database (Short Term Memory)
            const memory = await messageModel.find({
                chat: messagePayload.chat
            }).sort({ createdAt: -1 }).limit(10).lean()

            // console.log("STM Query Results:", {
            //     chatId: messagePayload.chat,
            //     messagesFound: memory.length,
            //     messages: memory.map(m => ({
            //         id: m._id,
            //         role: m.role,
            //         content: m.content.substring(0, 50) + '...'
            //     }))
            // })

            if (!memory || memory.length === 0) {
                console.warn("No messages found in database for chat:", messagePayload.chat)
            }

            // Short Term Memory (STM) - Recent conversation context
            const stm = memory.map(item => {
                if (!item.role || !item.content) {
                    console.warn("Invalid message item:", item)
                    return null
                }
                return {
                    role: item.role,
                    parts: [{
                        text: item.content
                    }]
                }
            }).filter(item => item !== null).reverse() // Reverse to maintain chronological order

            // console.log("STM Formatted:", {
            //     count: stm.length,
            //     messages: stm.map(m => ({
            //         role: m.role,
            //         textLength: m.parts[0].text.length
            //     }))
            // })

            // Long Term Memory (LTM) - Semantic search from vector database
            let ltmContentList = []
            
            if (similarMessages && similarMessages.length > 0) {
                ltmContentList = similarMessages
                    .map(match => {
                        // Pinecone returns matches with metadata
                        if (match.metadata && match.metadata.content) {
                            return match.metadata.content
                        }
                        return null
                    })
                    .filter(content => content !== null && content !== undefined)
            }

            const ltmContext = ltmContentList.length > 0 
                ? `\n\nRelevant context from previous conversations:\n${ltmContentList.join('\n---\n')}`
                : ''

            // Combine STM and LTM for the AI prompt
            const systemMessage = {
                role: "user",
                parts: [{
                    text: `You are a helpful AI assistant. Use the following context from previous conversations to provide better answers.${ltmContext}`
                }]
            }

            // Build conversation history with system context
            const conversationHistory = [
                systemMessage,
                ...stm
            ]

            // console.log("=== MEMORY DEBUG ===")
            // console.log("STM (Short Term Memory - Last 10 messages):", JSON.stringify(stm, null, 2))
            // console.log("LTM Similar Messages Found:", similarMessages.length)
            // console.log("LTM Content List:", ltmContentList)
            // console.log("LTM Context:", ltmContext)
            // console.log("Full Conversation History:", JSON.stringify(conversationHistory, null, 2))
            // console.log("===================")

            const response = await generateResponse(conversationHistory)


            socket.emit("ai-response", {
                chat: messagePayload.chat,
                content: response
            })
            const [responseDaata, responseVector] = await Promise.all([
                messageModel.create({
                    user: socket.user.id,
                    chat: messagePayload.chat,
                    content: response,
                    role: "model"
                }),
                generateVector(response)
            ])

            await createMemory({
                vector: responseVector,
                messageId: responseDaata._id,
                metadata: {
                    chat: responseDaata.chat.toString(),
                    content: response,
                    role: "model"
                }
            })

        })


    });
}





module.exports = createServer