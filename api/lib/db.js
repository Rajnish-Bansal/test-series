import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/upsc-engine";

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('MongoDB Connected Successfully');
            return mongoose;
        }).catch(err => {
            console.error('MongoDB Connection Error:', err.message);
            cached.promise = null; // Reset promise to allow retries
            throw err;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        throw new Error('Database connection failed: ' + e.message);
    }
    return cached.conn;
}

export default connectToDatabase;
