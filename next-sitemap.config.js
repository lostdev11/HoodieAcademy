/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://hoodieacademy.com',
  generateRobotsTxt: false, // We have a custom robots.txt
  generateIndexSitemap: false,
  exclude: [
    '/admin*',
    '/admin-auth-check',
    '/api/*',
    '/placement/*',
    '/_next/*',
    '/profile',
    '/dashboard',
    '/onboarding',
    '/squads/*/chat',
    '/courses/*/submit',
    '/bounties/*',
    '/submit',
    '/test-leaderboard',
    '/xp-tracker-demo',
    '/leveling-demo',
    '/bounty-xp-demo',
    '/hoodie-squad-track',
    '/great-hoodie-hall',
    '/dojo/logs',
    '/debug-*',
    '/test-*',
    '/optimization-demo',
    '/tracking-demo',
    '/setup',
    '/feedback',
    '/mentorship',
    '/social',
    '/squads/analytics',
    '/squads/tracker',
    '/wallet-wizardry/*',
    '/wallet-wizardry',
    '/sns/*',
    '/sns',
    '/sns-primary',
    '/retailstar-incentives',
    '/login',
    '/media',
    '/meme-coin-mania'
  ],
  additionalPaths: async (config) => {
    const fs = require('fs');
    const path = require('path');
    
    // Get all course files from public/courses
    const coursesDir = path.join(process.cwd(), 'public', 'courses');
    const courseFiles = fs.readdirSync(coursesDir).filter(file => file.endsWith('.json'));
    
    const coursePaths = courseFiles.map(file => {
      const courseId = file.replace('.json', '');
      return {
        loc: `/courses/${courseId}`,
        changefreq: 'monthly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    });

    return coursePaths;
  },
  transform: async (config, path) => {
    // Set priority and changefreq based on path
    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/courses') {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (path.startsWith('/courses/')) {
      priority = 0.8;
      changefreq = 'monthly';
    } else if (path === '/leaderboard') {
      priority = 0.8;
      changefreq = 'daily';
    } else if (path === '/bounties') {
      priority = 0.7;
      changefreq = 'weekly';
    } else if (path === '/achievements') {
      priority = 0.6;
      changefreq = 'weekly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
