import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/demo'


export default async function dbConnect() {
    try {
        const client = await connect(mongoUri);

        if (client) {
            console.log("Database Connected Successfully")
        }

    } catch (error) {
        console.log("Database connection failed:", error.message);
        throw error;
    }
}