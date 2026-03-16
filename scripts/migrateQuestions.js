import fs from 'fs';
import path from 'path';
import connectToDatabase from '../api/lib/db.js';
import Question from '../api/models/Question.js';

async function migrate() {
    try {
        console.log('--- Starting Question Migration ---');
        await connectToDatabase();
        console.log('Connected to Database.');

        const dataPath = path.join(process.cwd(), 'data', 'questions.json');
        if (!fs.existsSync(dataPath)) {
            console.error('questions.json not found at:', dataPath);
            process.exit(1);
        }

        const questionsJson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`Found ${questionsJson.length} questions in JSON file.`);

        // Clear existing questions to avoid duplication if running multiple times
        // WARNING: Only use this during initial migration
        const existingCount = await Question.countDocuments();
        if (existingCount > 0) {
            console.log(`Clearing ${existingCount} existing questions from DB...`);
            await Question.deleteMany({});
        }

        console.log('Uploading questions to MongoDB...');
        
        // Chunk processing to avoid memory issues or DB timeouts
        const chunkSize = 100;
        for (let i = 0; i < questionsJson.length; i += chunkSize) {
            const chunk = questionsJson.slice(i, i + chunkSize);
            await Question.insertMany(chunk);
            console.log(`Progress: ${Math.min(i + chunkSize, questionsJson.length)}/${questionsJson.length}`);
        }

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
