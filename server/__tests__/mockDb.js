import { ObjectId } from 'mongodb'

export function createMockDb() {
  const users = []
  const posts = []

  const usersCollection = {
    async findOne(query) {
      if (query.email) {
        return users.find(u => u.email.toLowerCase() === query.email.toLowerCase()) || null
      }
      if (query._id) {
        return users.find(u => u._id.toString() === query._id.toString()) || null
      }
      return null
    },
    async insertOne(doc) {
      const _id = doc._id || new ObjectId()
      const newDoc = { ...doc, _id }
      users.push(newDoc)
      return { insertedId: _id }
    },
    async countDocuments(query = {}) {
      if (query.role) {
        return users.filter(u => u.role === query.role).length
      }
      return users.length
    }
  }

  const postsCollection = {
    find() {
      return {
        sort() {
          return {
            async toArray() {
              return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            }
          }
        }
      }
    },
    async findOne(query) {
      if (query._id) {
        const idStr = query._id.toString()
        return posts.find(p => p._id.toString() === idStr) || null
      }
      return null
    },
    async insertOne(doc) {
      const _id = doc._id || new ObjectId()
      const newDoc = { ...doc, _id, comments: doc.comments || [] }
      posts.push(newDoc)
      return { insertedId: _id }
    },
    async updateOne(query, update) {
      const idStr = query._id?.toString()
      const post = posts.find(p => p._id.toString() === idStr)
      if (!post) return { matchedCount: 0, modifiedCount: 0 }

      if (update.$set) {
        if (update.$set['comments.$.likes'] && query['comments._id']) {
          const comment = (post.comments || []).find(c => c._id === query['comments._id'])
          if (comment) {
            comment.likes = update.$set['comments.$.likes']
          }
        } else {
          Object.assign(post, update.$set)
        }
      }

      if (update.$push) {
        if (update.$push.comments) {
          post.comments = post.comments || []
          post.comments.push(update.$push.comments)
        }
        if (update.$push['comments.$.replies'] && query['comments._id']) {
          const comment = (post.comments || []).find(c => c._id === query['comments._id'])
          if (comment) {
            comment.replies = comment.replies || []
            comment.replies.push(update.$push['comments.$.replies'])
          }
        }
      }

      if (update.$pull) {
        if (update.$pull.comments && update.$pull.comments._id) {
          post.comments = (post.comments || []).filter(c => c._id !== update.$pull.comments._id)
        }
        if (update.$pull['comments.$.replies'] && query['comments._id']) {
          const comment = (post.comments || []).find(c => c._id === query['comments._id'])
          if (comment && update.$pull['comments.$.replies']._id) {
            comment.replies = (comment.replies || []).filter(r => r._id !== update.$pull['comments.$.replies']._id)
          }
        }
      }

      return { matchedCount: 1, modifiedCount: 1 }
    },
    async deleteOne(query) {
      const idStr = query._id?.toString()
      const index = posts.findIndex(p => p._id.toString() === idStr)
      if (index === -1) return { deletedCount: 0 }
      posts.splice(index, 1)
      return { deletedCount: 1 }
    }
  }

  return {
    collection(name) {
      if (name === 'users') return usersCollection
      if (name === 'posts') return postsCollection
      throw new Error(`Unknown collection: ${name}`)
    },
    _users: users,
    _posts: posts
  }
}
