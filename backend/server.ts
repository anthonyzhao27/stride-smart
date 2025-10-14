import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import workoutsRoutes from './routes/workouts';
import plansRoutes from './routes/plans';
import onboardingRoutes from './routes/onboarding';

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_ORIGIN || process.env.NEXT_PUBLIC_API_ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use('/workouts', workoutsRoutes);
app.use('/plans', plansRoutes);
app.use('/onboarding', onboardingRoutes);

app.get("/health", (req, res) => {
    res.send("OK");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});