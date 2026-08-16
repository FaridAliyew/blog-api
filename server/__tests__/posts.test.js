import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { app, setDb, jwtSecret } from '../server.js'
import { createMockDb } from './mockDb.js'

describe('Posts CRUD API', () => {
  let mockDb
  let adminToken
  let userToken

  beforeEach(() => {
    mockDb = createMockDb()
    setDb(mockDb)

    const adminId = new ObjectId()
    const userId = new ObjectId()

    adminToken = jwt.sign(
      { id: adminId, username: 'Farid Admin', role: 'admin' },
      jwtSecret,
      { expiresIn: '1d' }
    )

    userToken = jwt.sign(
      { id: userId, username: 'Adi İstifadəçi', role: 'user' },
      jwtSecret,
      { expiresIn: '1d' }
    )
  })

  it('bütün istifadəçilər postları oxuya bilməlidir (GET /api/posts)', async () => {
    await mockDb.collection('posts').insertOne({
      title: 'İlk Məqalə',
      content: 'Məzmun',
      author: 'Admin',
      createdAt: new Date().toISOString()
    })

    const res = await request(app).get('/api/posts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)
    expect(res.body[0].title).toBe('İlk Məqalə')
  })

  it('yalnız Admin yeni post yarada bilməlidir', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Admin Məqaləsi',
        content: 'Bu məqalə admin tərəfindən yazıldı',
        author: 'Emin Məmmədov'
      })

    expect(res.status).toBe(201)
    expect(res.body.post.title).toBe('Admin Məqaləsi')
    expect(res.body.post.author).toBe('Emin Məmmədov')
  })

  it('adi istifadəçi post yaratmaq istədikdə 403 xətası almalıdır', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Qeyri-qanuni post',
        content: 'Test'
      })

    expect(res.status).toBe(403)
    expect(res.body.message).toContain('Adminlər üçün icazəlidir')
  })

  it('Admin postu redaktə edə bilməlidir', async () => {
    const post = await mockDb.collection('posts').insertOne({
      title: 'Köhnə Başlıq',
      content: 'Köhnə Məzmun',
      author: 'Müəllif'
    })

    const res = await request(app)
      .put(`/api/posts/${post.insertedId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Yenilənmiş Başlıq'
      })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('uğurla yenilendi')
  })

  it('Admin postu silə bilməlidir', async () => {
    const post = await mockDb.collection('posts').insertOne({
      title: 'Silinəcək Post',
      content: 'Məzmun'
    })

    const res = await request(app)
      .delete(`/api/posts/${post.insertedId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('uğurla silindi')
  })
})
