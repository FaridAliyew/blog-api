import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app, setDb } from '../server.js'
import { createMockDb } from './mockDb.js'

describe('Authentication API', () => {
  let mockDb

  beforeEach(() => {
    mockDb = createMockDb()
    setDb(mockDb)
  })

  it('yeni istifadəçini uğurla qeydiyyatdan keçirməlidir', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Tural Həsənov',
        email: 'tural@example.com',
        password: 'password123'
      })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('tural@example.com')
    expect(res.body.user.role).toBe('user')
  })

  it('eyni email ilə təkrar qeydiyyat cəhdində xəta qaytarmalıdır', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Tural',
        email: 'tural@example.com',
        password: 'password123'
      })

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Tural 2',
        email: 'tural@example.com',
        password: 'password456'
      })

    expect(duplicateRes.status).toBe(400)
    expect(duplicateRes.body.message).toContain('artıq qeydiyyatdan keçib')
  })

  it('düzgün məlumatlarla uğurla daxil olmalıdır (login)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Leyla',
        email: 'leyla@example.com',
        password: 'password123'
      })

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'leyla@example.com',
        password: 'password123'
      })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.username).toBe('Leyla')
  })

  it('yanlış şifrə daxil edildikdə girişi rədd etməlidir', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Leyla',
        email: 'leyla@example.com',
        password: 'password123'
      })

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'leyla@example.com',
        password: 'wrongpassword'
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('Yanlış email və ya şifrə')
  })
})
