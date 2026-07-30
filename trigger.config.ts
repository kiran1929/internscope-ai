import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'internscope-ai',
  runtime: 'node',
  logLevel: 'log',
  dirs: ['./trigger'],
  maxDuration: 300, // 5 minutes max run duration
});
