---
description: How to deploy the application to Vercel and MongoDB Atlas
---

### 1. Database Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a shared cluster (Free Tier).
2. Create a Database User with "Read and Write to any database" privileges.
3. In "Network Access", allow access from "Anywhere" (0.0.0.0/0).
4. Copy the connection string (format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).

### 2. Vercel Deployment
1. Go to [Vercel](https://vercel.com/) and import your project from GitHub.
2. In the "Configure Project" screen, go to **Environment Variables**.
3. Add the following keys:
   - `MONGODB_URI`: [Your Atlas Connection String]
   - `JWT_SECRET`: [A long random string for authentication]
   - `NODE_ENV`: `production`
4. Click **Deploy**.

### 3. Data Migration (Optional)
If you want to move your local data to production, use the migration scripts:
```bash
# Update .env with production URI temporarily
node scripts/migrateQuestions.js
node scripts/migrateSubjects.js
```
