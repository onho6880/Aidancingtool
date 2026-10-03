module.exports = {
  apps: [
    {
      name:         'vidai-web',
      script:       'node_modules/.bin/next',
      args:         'start -p 3000',
      cwd:          '/var/www/vidai-studio',
      instances:    1,
      autorestart:  true,
      watch:        false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name:         'vidai-worker',
      script:       'worker/index.js',
      cwd:          '/var/www/vidai-studio',
      instances:    1,
      autorestart:  true,
      watch:        false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
      // Restart worker if it crashes repeatedly
      exp_backoff_restart_delay: 5000,
    },
  ],
};
