import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authenticate, router as apiRouter } from './server/routes';
import { initializeDatabase } from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON bodies (support image payload sizes)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Initialize in-memory relational seed data
  await initializeDatabase();

  // JWT Auth context middleware
  app.use(authenticate);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Samaadhaan AI Core Server',
      timestamp: new Date().toISOString(),
      ai_mode: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' ? 'real_gemini_api' : 'local_demo_nlp'
    });
  });

  // Mount all API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 SAMAADHAAN AI SERVER RUNNING ON PORT ${PORT}`);
    console.log(`   From Community Problems to Real Solutions`);
    console.log(`   AI Engine: ${process.env.GEMINI_API_KEY ? 'Gemini 3.7 Flash Active' : 'Local NLP Fallback'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Samaadhaan AI server:', err);
});
