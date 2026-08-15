import { useEffect, useState } from 'react'
import {
  Search,
  Heart,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  User,
  Send,
  X,
  Calendar,
  CornerDownRight,
  ShieldCheck
} from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const POSTS_URL = `${BASE_URL}/api/posts`
const LOGIN_URL = `${BASE_URL}/api/auth/login`
const REGISTER_URL = `${BASE_URL}/api/auth/register`

function MangoDb() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // Modal States (Auth)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')

  // Post Modal States (Create & Edit - Admin Only)
  const [showPostModal, setShowPostModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [postForm, setPostForm] = useState({ title: '', content: '', published: true })
  const [postFormError, setPostFormError] = useState('')

  // Comment & Reply States
  const [commentInputs, setCommentInputs] = useState({})
  const [replyInputs, setReplyInputs] = useState({})
  const [activeReplyBox, setActiveReplyBox] = useState({})

  const fetchPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(POSTS_URL)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Məqalələr yüklənə bilmədi.')
      }

      setPosts(Array.isArray(data) ? data : data.posts || [])
    } catch (requestError) {
      setError(requestError.message || 'Server bağlantı xətası baş verdi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Auth Functions
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')

    const url = isRegister ? REGISTER_URL : LOGIN_URL
    const payload = isRegister
      ? { username: authForm.username, email: authForm.email, password: authForm.password }
      : { email: authForm.email, password: authForm.password }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Məlumatlar yanlışdır.')

      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setShowAuthModal(false)
      setAuthForm({ username: '', email: '', password: '' })
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Admin Post CRUD Functions
  const handleOpenCreateModal = () => {
    setEditingPost(null)
    setPostForm({ title: '', content: '', author: '', published: true })
    setPostFormError('')
    setShowPostModal(true)
  }

  const handleOpenEditModal = (post) => {
    setEditingPost(post)
    setPostForm({ title: post.title, content: post.content, author: post.author || '', published: post.published !== false })
    setPostFormError('')
    setShowPostModal(true)
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault()
    setPostFormError('')

    const isEdit = Boolean(editingPost)
    const url = isEdit ? `${POSTS_URL}/${editingPost._id}` : POSTS_URL
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postForm)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Əməliyyat uğursuz oldu.')

      setShowPostModal(false)
      fetchPosts()
    } catch (err) {
      setPostFormError(err.message)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bu məqaləni silmək istədiyinizdən əminsiniz?')) return

    try {
      const response = await fetch(`${POSTS_URL}/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Silinmə xətası.')

      setPosts(posts.filter(p => p._id !== postId))
    } catch (err) {
      alert('Məqalə silinmədi: ' + err.message)
    }
  }

  // Comment Functions
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]
    if (!text || !text.trim()) return

    try {
      const response = await fetch(`${POSTS_URL}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Şərh göndərilmədi.')

      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      fetchPosts()
    } catch (err) {
      alert('Xəta: ' + err.message)
    }
  }

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Bu şərhi silmək istədiyinizdən əminsiniz?')) return

    try {
      const response = await fetch(`${POSTS_URL}/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Şərh silinmədi.')

      fetchPosts()
    } catch (err) {
      alert('Xəta: ' + err.message)
    }
  }

  // Like Toggle Function
  const handleToggleLikeComment = async (postId, commentId) => {
    if (!user) {
      setIsRegister(false)
      setShowAuthModal(true)
      return
    }

    try {
      const response = await fetch(`${POSTS_URL}/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Bəyənmə xətası.')

      fetchPosts()
    } catch (err) {
      alert('Xəta: ' + err.message)
    }
  }

  // Reply Functions
  const handleAddReply = async (postId, commentId) => {
    const text = replyInputs[commentId]
    if (!text || !text.trim()) return

    try {
      const response = await fetch(`${POSTS_URL}/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Cavab göndərilmədi.')

      setReplyInputs(prev => ({ ...prev, [commentId]: '' }))
      setActiveReplyBox(prev => ({ ...prev, [commentId]: false }))
      fetchPosts()
    } catch (err) {
      alert('Xəta: ' + err.message)
    }
  }

  const handleDeleteReply = async (postId, commentId, replyId) => {
    if (!window.confirm('Bu cavabı silmək istədiyinizdən əminsiniz?')) return

    try {
      const response = await fetch(`${POSTS_URL}/${postId}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Cavab silinmədi.')

      fetchPosts()
    } catch (err) {
      alert('Xəta: ' + err.message)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getAuthorInitials = (author) => {
    if (!author) return 'B'
    return author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const d = date.getDate()
    const m = date.getMonth() + 1
    const y = String(date.getFullYear()).slice(-2)
    return `${d}/${m}/${y}`
  }

  return (
    <div className="main-content-wrapper">
      {/* Navigation & Controls Bar */}
      <div className="controls-bar">
        {/* Search Input */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Məqalə və ya müəllif axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* User Auth Info or Actions */}
        <div className="user-action-area">
          {user ? (
            <div className="logged-user-info">
              <div className="avatar-chip">
                <span className="chip-avatar">{getAuthorInitials(user.username)}</span>
                <span className="chip-name">{user.username}</span>
                {user.role === 'admin' && (
                  <span className="chip-badge">
                    <ShieldCheck size={12} /> Admin
                  </span>
                )}
              </div>

              {user.role === 'admin' && (
                <button className="primary-action-btn" onClick={handleOpenCreateModal}>
                  <Plus size={16} /> Yeni Məqalə
                </button>
              )}

              <button className="icon-action-btn logout-btn" title="Çıxış Et" onClick={handleLogout}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="guest-action-buttons">
              <button className="secondary-btn" onClick={() => { setIsRegister(false); setShowAuthModal(true); setAuthError(''); }}>
                Giriş
              </button>
              <button className="primary-btn" onClick={() => { setIsRegister(true); setShowAuthModal(true); setAuthError(''); }}>
                Qeydiyyat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="cards-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-line title"></div>
              <div className="skeleton-line body"></div>
              <div className="skeleton-line body short"></div>
              <div className="skeleton-footer"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error Box */}
      {!loading && error && (
        <div className="status-message-box error">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchPosts}>Yenidən yoxla</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPosts.length === 0 && (
        <div className="status-message-box empty">
          <p>Məlumat tapılmadı.</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && filteredPosts.length > 0 && (
        <div className="cards-grid">
          {filteredPosts.map((post) => {
            const comments = post.comments || []

            return (
              <article className="post-card" key={post._id}>
                <div className="card-top-bar">
                  <div className="post-author-block">
                    <div className="author-avatar">{getAuthorInitials(post.author)}</div>
                    <div className="author-meta">
                      <span className="author-name">{post.author || 'Müəllif'}</span>
                      {post.createdAt && (
                        <span className="post-date">
                          <Calendar size={12} /> {formatDate(post.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin Post Actions */}
                  {user?.role === 'admin' && (
                    <div className="card-admin-actions">
                      <button className="card-icon-btn edit" title="Redaktə et" onClick={() => handleOpenEditModal(post)}>
                        <Edit3 size={15} />
                      </button>
                      <button className="card-icon-btn delete" title="Sil" onClick={() => handleDeletePost(post._id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="post-title">{post.title}</h2>
                <p className="post-text">{post.content}</p>

                {/* --- COMMENTS SECTION --- */}
                <div className="card-comments-wrapper">
                  <div className="comments-title-row">
                    <span className="comments-heading">
                      <MessageSquare size={15} /> Şərhlər ({comments.length})
                    </span>
                  </div>

                  {/* Comment Input */}
                  {user ? (
                    <div className="comment-input-row">
                      <input
                        type="text"
                        placeholder="Şərh yazın..."
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                      />
                      <button
                        className="send-icon-btn"
                        disabled={!commentInputs[post._id]?.trim()}
                        onClick={() => handleAddComment(post._id)}
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="guest-comment-notice">
                      Şərh yazmaq üçün <button onClick={() => { setIsRegister(false); setShowAuthModal(true); }}>daxil olun</button>
                    </div>
                  )}

                  {/* Comments List */}
                  {comments.length > 0 && (
                    <div className="comments-feed">
                      {comments.map((comment) => {
                        const canDeleteComment = user && (user.role === 'admin' || user.id === comment.authorId)
                        const likesList = comment.likes || []
                        const isLikedByMe = user && likesList.includes(user.id)
                        const repliesList = comment.replies || []

                        return (
                          <div className="single-comment" key={comment._id}>
                            <div className="comment-header">
                              <span className="comment-author-name">{comment.author}</span>
                              {comment.createdAt && (
                                <span className="comment-timestamp">{formatDate(comment.createdAt)}</span>
                              )}
                            </div>

                            <p className="comment-content">{comment.text}</p>

                            <div className="comment-footer-actions">
                              {/* Like Button */}
                              <button
                                className={`like-action-btn ${isLikedByMe ? 'active-liked' : ''}`}
                                onClick={() => handleToggleLikeComment(post._id, comment._id)}
                              >
                                <Heart size={14} className={isLikedByMe ? 'heart-filled' : ''} />
                                <span>{likesList.length}</span>
                              </button>

                              {/* Reply Button - only for other users' comments */}
                              {user && comment.authorId !== user.id.toString() && (
                                <button
                                  className="reply-action-btn"
                                  onClick={() => setActiveReplyBox(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                >
                                  Cavab ver
                                </button>
                              )}

                              {/* Delete Comment */}
                              {canDeleteComment && (
                                <button
                                  className="delete-comment-icon-btn"
                                  title="Sil"
                                  onClick={() => handleDeleteComment(post._id, comment._id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            {/* Inline Reply Input */}
                            {activeReplyBox[comment._id] && user && (
                              <div className="inline-reply-form">
                                <input
                                  type="text"
                                  placeholder={`@${comment.author} istifadəçisinə cavab...`}
                                  value={replyInputs[comment._id] || ''}
                                  onChange={(e) => setReplyInputs({ ...replyInputs, [comment._id]: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddReply(post._id, comment._id)}
                                />
                                <button
                                  className="send-reply-btn"
                                  disabled={!replyInputs[comment._id]?.trim()}
                                  onClick={() => handleAddReply(post._id, comment._id)}
                                >
                                  Göndər
                                </button>
                              </div>
                            )}

                            {/* Replies List */}
                            {repliesList.length > 0 && (
                              <div className="replies-nested-feed">
                                {repliesList.map((reply) => {
                                  const canDeleteReply = user && (user.role === 'admin' || user.id === reply.authorId)

                                  return (
                                    <div className="single-reply" key={reply._id}>
                                      <div className="reply-content-box">
                                        <div className="reply-author-line">
                                          <CornerDownRight size={12} className="reply-arrow" />
                                          <span className="reply-author-name">{reply.author}</span>
                                          {reply.createdAt && <span className="reply-timestamp">{formatDate(reply.createdAt)}</span>}
                                        </div>
                                        <p className="reply-text">{reply.text}</p>
                                      </div>

                                      {canDeleteReply && (
                                        <button
                                          className="delete-reply-icon-btn"
                                          title="Sil"
                                          onClick={() => handleDeleteReply(post._id, comment._id, reply._id)}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Auth Modal (Login / Register) */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{isRegister ? 'Qeydiyyat' : 'Giriş'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>
                <X size={18} />
              </button>
            </div>

            {authError && <div className="auth-error-alert">{authError}</div>}

            <form onSubmit={handleAuthSubmit}>
              {isRegister && (
                <div className="input-field-group">
                  <label>İstifadəçi Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Ad və soyadınız"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  />
                </div>
              )}

              <div className="input-field-group">
                <label>Email Ünvanı</label>
                <input
                  type="email"
                  required
                  placeholder="nümunə@mail.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>

              <div className="input-field-group">
                <label>Şifrə</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-cancel" onClick={() => setShowAuthModal(false)}>Ləğv Et</button>
                <button type="submit" className="btn-primary">{isRegister ? 'Təsdiqlə' : 'Daxil Ol'}</button>
              </div>
            </form>

            <div className="modal-switch-text">
              {isRegister ? (
                <span>Hesabınız var? <button onClick={() => { setIsRegister(false); setAuthError(''); }}>Daxil olun</button></span>
              ) : (
                <span>Hesabınız yoxdur? <button onClick={() => { setIsRegister(true); setAuthError(''); }}>Qeydiyyatdan keçin</button></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Modal (Create / Edit - Admin Only) */}
      {showPostModal && (
        <div className="modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{editingPost ? 'Məqaləni Redaktə Et' : 'Yeni Məqalə Əlavə Et'}</h3>
              <button className="modal-close-btn" onClick={() => setShowPostModal(false)}>
                <X size={18} />
              </button>
            </div>

            {postFormError && <div className="auth-error-alert">{postFormError}</div>}

            <form onSubmit={handlePostSubmit}>
              <div className="input-field-group">
                <label>Müəllif Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Məqaləni yazan şəxsin adı"
                  value={postForm.author}
                  onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                />
              </div>

              <div className="input-field-group">
                <label>Məqalə Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Məqalənin başlığı"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                />
              </div>

              <div className="input-field-group">
                <label>Məzmun</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Məqalənin mətni..."
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-cancel" onClick={() => setShowPostModal(false)}>Ləğv Et</button>
                <button type="submit" className="btn-primary">{editingPost ? 'Yenilə' : 'Yayımla'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MangoDb
