import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRequired } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import characterRouter from './routes/character.js';
import activityTypesRouter from './routes/activityTypes.js';
import activitiesRouter from './routes/activities.js';
import achievementsRouter from './routes/achievements.js';
import questsRouter from './routes/quests.js';
import statsRouter from './routes/stats.js';
import weeklyTasksRouter from './routes/weeklyTasks.js';
import outsourceRouter from './routes/outsource.js';
import userSettingsRouter from './routes/userSettings.js';
import checkinRouter from './routes/checkin.js';
import narrativeRouter from './routes/narrative.js';
import studyRouter from './routes/study.js';
import dailyReportsRouter from './routes/dailyReports.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Protected routes (auth required)
app.use('/api/character', authRequired, characterRouter);
app.use('/api/activity-types', authRequired, activityTypesRouter);
app.use('/api/activities', authRequired, activitiesRouter);
app.use('/api/achievements', authRequired, achievementsRouter);
app.use('/api/quests', authRequired, questsRouter);
app.use('/api/stats', authRequired, statsRouter);
app.use('/api/weekly-tasks', authRequired, weeklyTasksRouter);
app.use('/api/outsource', authRequired, outsourceRouter);
app.use('/api/user/settings', authRequired, userSettingsRouter);
app.use('/api/checkin', authRequired, checkinRouter);
app.use('/api/narrative', authRequired, narrativeRouter);
app.use('/api/study', authRequired, studyRouter);
app.use('/api/daily-reports', authRequired, dailyReportsRouter);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// Only start server when run directly (not on Vercel serverless)
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`RPG Tracker backend running on http://localhost:${PORT}`);

    // Initialize Feishu integration (delayed to let server settle)
    setTimeout(async () => {
      try {
        const { initFeishuSync } = await import('./services/feishuSync.js');
        await initFeishuSync();
      } catch (err) {
        console.error('[feishu] init error:', err.message);
      }
      try {
        const { sendDailySummary } = await import('./services/feishuNotify.js');
        await sendDailySummary();
      } catch (err) {
        console.error('[feishu] daily summary error:', err.message);
      }
    }, 3000);
  });
}

export default app;
