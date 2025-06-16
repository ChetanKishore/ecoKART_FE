const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5000;

// Start Spring Boot backend compilation in background
console.log('Starting Spring Boot backend compilation...');
const mvnProcess = spawn('mvn', ['spring-boot:run'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe'
});

let backendReady = false;

mvnProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('[Backend]', output);
  if (output.includes('Started EcoMarketApplication')) {
    backendReady = true;
    console.log('✓ Spring Boot backend is ready');
  }
});

mvnProcess.stderr.on('data', (data) => {
  console.error('[Backend Error]', data.toString());
});

// Simple proxy for API requests
app.use('/api/*', (req, res) => {
  if (!backendReady) {
    return res.status(503).json({ 
      message: 'Backend is starting up, please wait...' 
    });
  }
  
  const url = `http://localhost:8080${req.path}`;
  const options = {
    method: req.method,
    headers: req.headers,
  };
  
  if (req.body) {
    options.body = JSON.stringify(req.body);
  }
  
  fetch(url, options)
    .then(response => response.json())
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    frontend: 'ready',
    backend: backendReady ? 'ready' : 'starting'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Development server running on port ${PORT}`);
  console.log('Frontend: Ready');
  console.log('Backend: Compiling...');
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  mvnProcess.kill();
  process.exit();
});