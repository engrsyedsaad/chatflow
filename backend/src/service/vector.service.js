const  { Pinecone }= require('@pinecone-database/pinecone');


// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const vectorIndex = pc.Index("chatgpt");

async function createMemory({vector,metadata,messageId}){
    try {
        const vectorId = messageId.toString ? messageId.toString() : messageId
        // console.log("Storing vector in Pinecone:", {
        //     id: vectorId,
        //     metadataKeys: Object.keys(metadata),
        //     hasContent: !!metadata.content
        // })
        
        await vectorIndex.upsert([{
            id: vectorId,
            values: vector,
            metadata: {
                ...metadata,
                messageId: vectorId,
                timestamp: new Date().toISOString()
            }
        }])
        
        // console.log("Vector stored successfully in Pinecone")
    } catch (err) {
        console.error("Error storing vector in Pinecone:", err)
        throw err
    }
}

async function queryMemory({queryVector,limit=5,metadata}){
    try {
        // console.log("Querying Pinecone with filter:", metadata)
        
        const data = await vectorIndex.query({
            vector: queryVector,
            topK: limit,
            filter: metadata ? { chat: { $eq: metadata.chat } } : undefined,
            includeMetadata: true
        })
        
        // console.log("Pinecone Query Results:", {
        //     matchesFound: data.matches ? data.matches.length : 0,
        //     matches: data.matches ? data.matches.map(m => ({
        //         id: m.id,
        //         score: m.score,
        //         hasMetadata: !!m.metadata,
        //         metadataKeys: m.metadata ? Object.keys(m.metadata) : []
        //     })) : []
        // })
        
        return data.matches || []
    } catch (err) {
        console.error("Error querying Pinecone:", err)
        return []
    }
}

module.exports = {
    createMemory,
    queryMemory
}