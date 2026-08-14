import './App.css'

const posts = [
  { category: 'Technology', title: 'How modern teams build products that last', excerpt: 'Practical ideas for making thoughtful decisions from the first commit to launch day.', author: 'Nigar Əliyeva', date: '12 Aug 2026', read: '6 min read', color: 'blue' },
  { category: 'Design', title: 'Small details that make interfaces feel effortless', excerpt: 'A closer look at spacing, hierarchy, and the quiet moments that improve usability.', author: 'Murad Quliyev', date: '09 Aug 2026', read: '4 min read', color: 'orange' },
  { category: 'Lifestyle', title: 'Building a calmer, more intentional routine', excerpt: 'Simple rituals that help you make room for the work and people that matter.', author: 'Leyla Məmmədova', date: '05 Aug 2026', read: '5 min read', color: 'green' },
]

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top">nöqtə<span>.</span></a>
        <nav aria-label="Əsas naviqasiya">
          <a className="active" href="#articles">Məqalələr</a>
          <a href="#categories">Kateqoriyalar</a>
          <a href="#about">Haqqımızda</a>
        </nav>
        <button className="write-button" type="button">Məqalə yaz <span>↗</span></button>
      </header>

      <main id="top">
        <section className="intro">
          <p className="eyebrow">FİKİRLƏR, HEKAYƏLƏR VƏ YENİLİKLƏR</p>
          <h1>Maraq doğuran<br /><em>fikirlər.</em></h1>
          <p className="intro-copy">Texnologiya, dizayn və gündəlik həyat barədə düşünmək üçün kiçik bir yer.</p>
          <label className="search" htmlFor="search">
            <span>⌕</span>
            <input id="search" type="search" placeholder="Məqalə axtar..." />
          </label>
        </section>

        <section className="featured" aria-labelledby="featured-title">
          <div className="featured-art"><span>✦</span><small>IDEAS / 01</small></div>
          <div className="featured-content">
            <p className="tag">SEÇİLMİŞ MƏQALƏ</p>
            <h2 id="featured-title">Yaxşı ideyalar haradan başlayır?</h2>
            <p>Yaradıcılığın gözlənilməz yolları, marağın dəyəri və hər gün daha yaxşı suallar vermək haqqında.</p>
            <div className="byline"><div className="avatar">AS</div><span>Aysel Süleymanlı<br /><small>16 Aug 2026 · 8 min read</small></span></div>
            <a className="read-link" href="#articles">Oxumağa başla <span>→</span></a>
          </div>
        </section>

        <section className="content-grid" id="articles">
          <div>
            <div className="section-heading" id="categories"><h2>Son məqalələr</h2><a href="#all">Hamısına bax <span>→</span></a></div>
            <div className="filters" aria-label="Kateqoriya filtrləri">
              <button className="selected" type="button">Hamısı</button><button type="button">Texnologiya</button><button type="button">Dizayn</button><button type="button">Həyat tərzi</button>
            </div>
            <div className="post-list">
              {posts.map((post) => <article className="post-card" key={post.title}>
                <div className={`post-image ${post.color}`}><span>{post.category === 'Technology' ? '⌘' : post.category === 'Design' ? '◒' : '✳'}</span></div>
                <div className="post-body"><p className="tag">{post.category}</p><h3>{post.title}</h3><p>{post.excerpt}</p><div className="post-meta"><span>{post.author}</span><span>{post.date} · {post.read}</span></div></div>
              </article>)}
            </div>
          </div>
          <aside id="about">
            <div className="newsletter"><p className="tag">HƏFTƏLİK BÜLLETEN</p><h2>Yaxşı oxunuşlar, birbaşa inboxuna.</h2><p>Həftədə bir dəfə seçilmiş hekayələr və yeni məqalələr.</p><form><input type="email" placeholder="E-poçt ünvanın" aria-label="E-poçt ünvanın" /><button type="submit">Abunə ol →</button></form></div>
            <div className="topics"><p className="tag">POPULYAR MÖVZULAR</p><a href="#technology">Texnologiya <span>24</span></a><a href="#design">Dizayn <span>18</span></a><a href="#lifestyle">Həyat tərzi <span>12</span></a><a href="#culture">Mədəniyyət <span>9</span></a></div>
          </aside>
        </section>
      </main>
      <footer>© 2026 nöqtə. Düşüncələr üçün hazırlanıb.</footer>
    </div>
  )
}

export default App
