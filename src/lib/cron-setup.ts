import cron from 'node-cron';
import { processAllTokens } from './cron-burn-service';

// Initialize cron jobs
export function initializeCronJobs() {
  console.log('Initializing cron jobs...');

  // Update burn data every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled burn data update...');
    try {
      await processAllTokens();
      console.log('Scheduled burn data update completed successfully');
    } catch (error) {
      console.error('Scheduled burn data update failed:', error);
    }
  });

  // Update burn data every hour (backup)
  cron.schedule('0 * * * *', async () => {
    console.log('Running hourly burn data update...');
    try {
      await processAllTokens();
      console.log('Hourly burn data update completed successfully');
    } catch (error) {
      console.error('Hourly burn data update failed:', error);
    }
  });

  console.log('Cron jobs initialized successfully');
}

// Function to start cron jobs (call this in your app initialization)
export function startCronJobs() {
  if (process.env.NODE_ENV === 'production') {
    initializeCronJobs();
  } else {
    console.log('Cron jobs disabled in development mode');
  }
} 