// Tests for server routes
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Create a minimal test app
function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Health endpoint
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  
  // 404 handler for /api routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  
  return app;
}

describe('Server routes', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('GET /api/health', () => {
    it('returns status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });
  
  describe('Unknown /api routes', () => {
    it('returns 404 with error shape', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('not found');
    });
    
    it('returns 404 for POST to unknown endpoint', async () => {
      const res = await request(app).post('/api/unknown');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('Error handling', () => {
    it('handles invalid JSON', async () => {
      const res = await request(app)
        .post('/api/test')
        .send('invalid json{')
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid JSON body.' });
    });
  });
});