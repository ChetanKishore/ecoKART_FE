// Temporary bridge script for workflow compatibility
// The actual backend is now Spring Boot Java running on port 8080

import { spawn } from 'child_process';
import path from 'path';

console.log('🌱 EcoMarket Development Server');
console.log('Backend: Spring Boot (Java) on port 8080');
console.log('Frontend: React + Vite on port 5000');
console.log('─'.repeat(50));

// Start Spring Boot backend
const backend = spawn('mvn', ['spring-boot:run'], {
  cwd: path.join(process.cwd(), 'backend'),
  stdio: 'inherit'
});

// Start React frontend after backend starts
setTimeout(() => {
  const frontend = spawn('npx', [
    'vite', 
    '--host', '0.0.0.0', 
    '--port', '5000',
    '--force'
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_ALLOWED_HOSTS: 'all'
    }
  });

  frontend.on('error', (err) => {
    console.error('Frontend error:', err);
  });
}, 10000);

backend.on('error', (err) => {
  console.error('Backend error:', err);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  backend.kill();
  process.exit(0);
});