import MangoDb from '../mangoDB/MangoDb'
import '../css/blog.css'

function Blog() {
  return (
    <main className="blog-page">
      <header className="blog-header-center">
        <h1>Blog</h1>
      </header>

      <section className="blog-container">
        <MangoDb />
      </section>
    </main>
  )
}

export default Blog
