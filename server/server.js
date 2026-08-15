import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })
dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const mongoUri = process.env.MONGODB_URI || ''
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_123'

app.use(cors())
app.use(express.json())

let client = null
let db = null

if (mongoUri && !mongoUri.includes('<db_password>')) {
  client = new MongoClient(mongoUri)
} else {
  console.warn('⚠️ MONGODB_URI təyin edilməyib. server/.env faylını yoxlayın.')
}

// Authentication Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Giriş icazəsi yoxdur. Lütfən daxil olun.' })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Token etibarsızdır və ya vaxtı bitib.' })
  }
}

// Admin Role Check Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu əməliyyat yalnız Adminlər üçün icazəlidir.' })
  }
  next()
}

// --- HEALTH CHECK ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: client ? 'ok' : 'error',
    database: db ? 'connected' : 'disconnected'
  })
})

// --- AUTHENTICATION ROUTES ---

// 1. REGISTER (Always assigns role: 'user')
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'İstifadəçi adı, email və şifrə mütləqdir.' })
  }

  try {
    const usersCol = db.collection('users')
    const existingUser = await usersCol.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return res.status(400).json({ message: 'Bu email artıq qeydiyyatdan keçib.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user', // Public registrations are ALWAYS standard users
      createdAt: new Date().toISOString()
    }

    const result = await usersCol.insertOne(newUser)
    
    const token = jwt.sign(
      { id: result.insertedId, username: newUser.username, email: newUser.email, role: newUser.role },
      jwtSecret,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Qeydiyyat uğurla tamamlandı.',
      token,
      user: { id: result.insertedId, username: newUser.username, email: newUser.email, role: newUser.role }
    })
  } catch (error) {
    res.status(500).json({ message: 'Qeydiyyat xətası: ' + error.message })
  }
})

// 2. LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email və şifrə daxil edilməlidir.' })
  }

  try {
    const usersCol = db.collection('users')
    const user = await usersCol.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(400).json({ message: 'Yanlış email və ya şifrə.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Yanlış email və ya şifrə.' })
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Uğurla daxil oldunuz.',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ message: 'Giriş xətası: ' + error.message })
  }
})

// 3. CURRENT USER (ME)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  res.json({ user: req.user })
})


// --- POSTS CRUD ROUTES ---

// READ ALL POSTS
app.get('/api/posts', async (_req, res) => {
  try {
    const posts = await db.collection('posts').find({}).sort({ createdAt: -1 }).toArray()
    res.json(posts)
  } catch (error) {
    res.status(500).json({ message: 'Postlar alına bilmədi: ' + error.message })
  }
})

// CREATE POST (Admin Only)
app.post('/api/posts', verifyToken, requireAdmin, async (req, res) => {
  const { title, content, published, author } = req.body

  if (!title || !content) {
    return res.status(400).json({ message: 'Post başlığı və məzmunu tələb olunur.' })
  }

  try {
    const newPost = {
      title,
      content,
      author: (author && author.trim()) ? author.trim() : req.user.username,
      authorId: req.user.id,
      published: published !== undefined ? Boolean(published) : true,
      createdAt: new Date().toISOString(),
      comments: []
    }

    const result = await db.collection('posts').insertOne(newPost)
    res.status(201).json({ message: 'Post uğurla yaratıldı.', post: { ...newPost, _id: result.insertedId } })
  } catch (error) {
    res.status(500).json({ message: 'Post yaratılarkən xəta: ' + error.message })
  }
})

// UPDATE POST (Admin Only)
app.put('/api/posts/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { title, content, published, author } = req.body

  try {
    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (published !== undefined) updateData.published = Boolean(published)
    if (author !== undefined && author.trim()) updateData.author = author.trim()

    const result = await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Post tapılmadı.' })
    }

    res.json({ message: 'Post uğurla yenilendi.' })
  } catch (error) {
    res.status(500).json({ message: 'Post yenilenərkən xəta: ' + error.message })
  }
})

// DELETE POST (Admin Only)
app.delete('/api/posts/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params

  try {
    const result = await db.collection('posts').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Post tapılmadı və ya artıq silinib.' })
    }

    res.json({ message: 'Post uğurla silindi.' })
  } catch (error) {
    res.status(500).json({ message: 'Post silinərkən xəta: ' + error.message })
  }
})


// --- COMMENTS & REPLIES & LIKES ROUTES ---

// ADD COMMENT
app.post('/api/posts/:id/comments', verifyToken, async (req, res) => {
  const { id } = req.params
  const { text } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Şərh mətni boş ola bilməz.' })
  }

  try {
    const comment = {
      _id: new ObjectId().toString(),
      text: text.trim(),
      author: req.user.username,
      authorId: req.user.id.toString(),
      createdAt: new Date().toISOString(),
      likes: [],
      replies: []
    }

    const result = await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Post tapılmadı.' })
    }

    res.status(201).json({ message: 'Şərh uğurla əlavə olundu.', comment })
  } catch (error) {
    res.status(500).json({ message: 'Şərh əlavə edilərkən xəta: ' + error.message })
  }
})

// DELETE COMMENT (User can delete own comment, Admin can delete ANY comment)
app.delete('/api/posts/:postId/comments/:commentId', verifyToken, async (req, res) => {
  const { postId, commentId } = req.params

  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) })

    if (!post) {
      return res.status(404).json({ message: 'Post tapılmadı.' })
    }

    const comment = (post.comments || []).find(c => c._id === commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Şərh tapılmadı.' })
    }

    const isAdmin = req.user.role === 'admin'
    const isOwner = comment.authorId === req.user.id.toString()

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Bu şərhi silmək hüququnuz yoxdur.' })
    }

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $pull: { comments: { _id: commentId } } }
    )

    res.json({ message: 'Şərh uğurla silindi.' })
  } catch (error) {
    res.status(500).json({ message: 'Şərh silinərkən xəta: ' + error.message })
  }
})

// TOGGLE LIKE ON COMMENT (Instagram Style)
app.post('/api/posts/:postId/comments/:commentId/like', verifyToken, async (req, res) => {
  const { postId, commentId } = req.params
  const userId = req.user.id.toString()

  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) })
    if (!post) return res.status(404).json({ message: 'Post tapılmadı.' })

    const commentIndex = (post.comments || []).findIndex(c => c._id === commentId)
    if (commentIndex === -1) return res.status(404).json({ message: 'Şərh tapılmadı.' })

    const comment = post.comments[commentIndex]
    const likes = comment.likes || []
    const userLikedIndex = likes.indexOf(userId)

    let updatedLikes = []
    if (userLikedIndex > -1) {
      // Unlike
      updatedLikes = likes.filter(id => id !== userId)
    } else {
      // Like
      updatedLikes = [...likes, userId]
    }

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId), 'comments._id': commentId },
      { $set: { 'comments.$.likes': updatedLikes } }
    )

    res.json({ message: 'Bəyənmə yeniləndi.', likes: updatedLikes })
  } catch (error) {
    res.status(500).json({ message: 'Bəyənmə xətası: ' + error.message })
  }
})

// ADD REPLY TO COMMENT (Nested Comments)
app.post('/api/posts/:postId/comments/:commentId/replies', verifyToken, async (req, res) => {
  const { postId, commentId } = req.params
  const { text } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Cavab mətni boş ola bilməz.' })
  }

  try {
    const reply = {
      _id: new ObjectId().toString(),
      text: text.trim(),
      author: req.user.username,
      authorId: req.user.id.toString(),
      createdAt: new Date().toISOString()
    }

    const result = await db.collection('posts').updateOne(
      { _id: new ObjectId(postId), 'comments._id': commentId },
      { $push: { 'comments.$.replies': reply } }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Şərh tapılmadı.' })
    }

    res.status(201).json({ message: 'Cavab uğurla əlavə edildi.', reply })
  } catch (error) {
    res.status(500).json({ message: 'Cavab əlavə edilərkən xəta: ' + error.message })
  }
})

// DELETE REPLY FROM COMMENT
app.delete('/api/posts/:postId/comments/:commentId/replies/:replyId', verifyToken, async (req, res) => {
  const { postId, commentId, replyId } = req.params

  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) })
    if (!post) return res.status(404).json({ message: 'Post tapılmadı.' })

    const comment = (post.comments || []).find(c => c._id === commentId)
    if (!comment) return res.status(404).json({ message: 'Şərh tapılmadı.' })

    const reply = (comment.replies || []).find(r => r._id === replyId)
    if (!reply) return res.status(404).json({ message: 'Cavab tapılmadı.' })

    const isAdmin = req.user.role === 'admin'
    const isOwner = reply.authorId === req.user.id.toString()

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Bu cavabı silmək hüququnuz yoxdur.' })
    }

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId), 'comments._id': commentId },
      { $pull: { 'comments.$.replies': { _id: replyId } } }
    )

    res.json({ message: 'Cavab uğurla silindi.' })
  } catch (error) {
    res.status(500).json({ message: 'Cavab silinərkən xəta: ' + error.message })
  }
})


// --- SERVER INITIALIZATION & ADMIN SEEDING ---
async function startServer() {
  if (client) {
    try {
      await client.connect()
      db = client.db(process.env.MONGODB_DATABASE || 'blog_api')
      console.log('✅ MongoDB Atlas bazasına uğurla qoşuldu.')

      // Auto-seed default Admin account if none exists
      const usersCol = db.collection('users')
      const adminCount = await usersCol.countDocuments({ role: 'admin' })

      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10)
        await usersCol.insertOne({
          username: 'Farid Admin',
          email: 'admin@blog.com',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date().toISOString()
        })
        console.log('👑 Defolt Admin hesabı yaradıldı (Email: admin@blog.com | Şifrə: admin123)')
      }
    } catch (error) {
      console.error('❌ MongoDB bağlantı xətası:', error.message)
    }
  }

  app.listen(port, () => console.log(`🚀 API Server işləyir: http://localhost:${port}`))
}

startServer()
