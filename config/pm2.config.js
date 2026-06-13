// PM2 config for PULSE
// Usage: pm2 start pm2.config.js
// Auto-start: pm2 startup && pm2 save

module.exports = {
  apps: [{
    name: 'pulse',
    cwd: '/var/www/pulse/frontend',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/pulse/error.log',
    out_file: '/var/log/pulse/out.log',
  }],
}
