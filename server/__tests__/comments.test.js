import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { app, setDb, jwtSecret } from '../server.js'
import { createMockDb } from './mockDb.js'

describe('Comments, Likes & Replies API', () => {
  let mockDb
  let userToken
  let otherUserToken
  let userId
  let otherUserId
  let postId

  beforeEach(async () => {
    mockDb = createMockDb()
    setDb(mockDb)

    userId = new ObjectId().toString()
    otherUserId = new ObjectId().toString()

    userToken = jwt.sign(
      { id: userId, username: 'Elvin', role: 'user' },
      jwtSecret,
      { expiresIn: '1d' }
    )

    otherUserToken = jwt.sign(
      { id: otherUserId, username: 'Aysel', role: 'user' },
      jwtSecret,
      { expiresIn: '1d' }
    )

    const post = await mockDb.collection('posts').insertOne({
      title: 'Texnologiya Xəbərləri',
      content: 'Məzmun...',
      comments: []
    })
    postId = post.insertedId.toString()
  })

  it('daxil olmuş istifadəçi şərh yaza bilməlidir', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Çox maraqlı məqalədir!' })

    expect(res.status).toBe(201)
    expect(res.body.comment.text).toBe('Çox maraqlı məqalədir!')
    expect(res.body.comment.author).toBe('Elvin')
  })

  it('şərhə Like basanda like artmalı, təkrar basanda Unlike olmalıdır', async () => {
    const commentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Bəyəniləcək şərh' })

    const commentId = commentRes.body.comment._id

    const likeRes = await request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${otherUserToken}`)

    expect(likeRes.status).toBe(200)
    expect(likeRes.body.likes).toContain(otherUserId)

    const unlikeRes = await request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${otherUserToken}`)

    expect(unlikeRes.status).toBe(200)
    expect(unlikeRes.body.likes).not.toContain(otherUserId)
  })

  it('istifadəçi başqa istifadəçinin şərhinə cavab (Reply) yaza bilməlidir', async () => {
    const commentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Əsas şərh' })

    const commentId = commentRes.body.comment._id

    const replyRes = await request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ text: 'Səninlə tamamilə razıyam!' })

    expect(replyRes.status).toBe(201)
    expect(replyRes.body.reply.text).toBe('Səninlə tamamilə razıyam!')
    expect(replyRes.body.reply.author).toBe('Aysel')
  })
})
