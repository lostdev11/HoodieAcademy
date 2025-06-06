const express = require('express');
      const fs = require('fs').promises;
      const path = require('path');

      const app = express();
      app.use(express.json());

      const PROGRESS_FILE = path.join(__dirname, 'progress.json');

      // Initialize progress file if it doesn't exist
      async function initProgressFile() {
        try {
          await fs.access(PROGRESS_FILE);
        } catch {
          await fs.writeFile(PROGRESS_FILE, JSON.stringify({}));
        }
      }

      initProgressFile();

      // Get progress for a wallet
      app.get('/api/progress/:walletAddress', async (req, res) => {
        try {
          const data = await fs.readFile(PROGRESS_FILE, 'utf8');
          const progress = JSON.parse(data);
          res.json(progress[req.params.walletAddress] || {});
        } catch (error) {
          console.error('Error reading progress:', error);
          res.status(500).json({ error: 'Failed to fetch progress' });
        }
      });

      // Update progress for a wallet and lesson
      app.post('/api/progress/:walletAddress/:course', async (req, res) => {
        try {
          const { walletAddress, course } = req.params;
          const { lessonId, completed } = req.body;

          const data = await fs.readFile(PROGRESS_FILE, 'utf8');
          const progress = JSON.parse(data);

          if (!progress[walletAddress]) {
            progress[walletAddress] = { courses: {} };
          }
          if (!progress[walletAddress].courses[course]) {
            progress[walletAddress].courses[course] = {};
          }

          if (lessonId) {
            progress[walletAddress].courses[course][lessonId] = completed;
          } else {
            progress[walletAddress].courses[course] = completed;
          }

          await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
          res.json({ success: true });
        } catch (error) {
          console.error('Error updating progress:', error);
          res.status(500).json({ error: 'Failed to update progress' });
        }
      });

      // Get leaderboard
      app.get('/api/leaderboard', async (req, res) => {
        try {
          const data = await fs.readFile(PROGRESS_FILE, 'utf8');
          const progress = JSON.parse(data);
          const leaderboard = Object.entries(progress)
            .filter(([_, user]: [string, any]) => {
              const courseProgress = user.courses || {};
              return Object.values(courseProgress).every((course: any) =>
                Object.values(course).every((lesson: any) => lesson === true)
              );
            })
            .map(([walletAddress]: [string, any]) => ({
              walletAddress,
              completionDate: new Date().toISOString()
            }));
          res.json(leaderboard);
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
          res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
      });

      const PORT = process.env.PORT || 3007;
      app.listen(PORT, () => {
        console.log(`Progress API running on port ${PORT}`);
      });