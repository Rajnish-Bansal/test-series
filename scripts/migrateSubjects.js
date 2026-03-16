import fs from 'fs';
import path from 'path';
import connectToDatabase from '../api/lib/db.js';
import Subject from '../api/models/Subject.js';

async function migrate() {
    try {
        console.log('--- Starting Subject Structure Migration ---');
        await connectToDatabase();
        
        const dataPath = path.join(process.cwd(), 'data', 'subjects_structure.json');
        if (!fs.existsSync(dataPath)) {
            console.error('subjects_structure.json not found');
            process.exit(1);
        }

        const structure = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        // Clean and Re-insert
        await Subject.deleteMany({});
        await Subject.insertMany(structure);

        console.log(`Migrated ${structure.length} subjects successfully.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
