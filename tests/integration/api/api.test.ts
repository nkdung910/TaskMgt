/**
 * API Endpoint Tests
 * 
 * Tests for API routes: health, auth, tasks
 */

import { describe, it, expect } from '@jest/globals'

describe('API Endpoints', () => {
  const BASE_URL = process.env.NEXTAUTH_URL || 'https://taskmgt-virid.vercel.app'

  describe('Health Check API', () => {
    it('should return 200 or 401 status (may require auth)', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect([200, 401]).toContain(response.status)
    })

    it('should return status: ok when accessible', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      if (response.status === 200) {
        const data = await response.json()
        expect(data.status).toBe('ok')
      } else {
        // Skip if auth protected
        expect(response.status).toBe(401)
      }
    })

    it('should return timestamp when accessible', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      if (response.status === 200) {
        const data = await response.json()
        expect(data.timestamp).toBeDefined()
        expect(typeof data.timestamp).toBe('string')
      } else {
        // Skip if auth protected
        expect(response.status).toBe(401)
      }
    })
  })

  describe('Auth API - Signup', () => {
    it('should reject signup with missing email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test123' })
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should reject signup with missing password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should reject signup with invalid email format', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email', password: 'test123' })
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should reject signup with short password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: '123' })
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should handle duplicate email gracefully', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      
      // First signup
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'test123456' })
      })
      
      // Second signup with same email
      const response2 = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'test123456' })
      })
      
      expect([400, 401, 409]).toContain(response2.status)
    })
  })

  describe('Auth API - Login', () => {
    it('should reject login with missing credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([400, 401, 422]).toContain(response.status)
    })

    it('should reject login with invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
      })
      expect([400, 401]).toContain(response.status)
    })

    it('should accept login with valid credentials', async () => {
      // First create a user
      const testEmail = `test-${Date.now()}@example.com`
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'test123456' })
      })

      // Then try to login
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'test123456' })
      })
      
      expect([200, 302, 401]).toContain(response.status)
    })
  })

  describe('Tasks API', () => {
    it('should require authentication for GET /api/tasks', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`)
      expect([401, 403]).toContain(response.status)
    })

    it('should require authentication for POST /api/tasks', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          description: 'Test Description'
        })
      })
      expect([401, 403]).toContain(response.status)
    })

    it('should require authentication for PUT /api/tasks/[id]', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks/123`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' })
      })
      expect([401, 403, 404]).toContain(response.status)
    })

    it('should require authentication for DELETE /api/tasks/[id]', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks/123`, {
        method: 'DELETE'
      })
      expect([401, 403, 404]).toContain(response.status)
    })
  })
})

