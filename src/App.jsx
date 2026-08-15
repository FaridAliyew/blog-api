import Blog from './components/Blog.jsx'

const posts = [
  { category: 'Technology', title: 'How modern teams build products that last', excerpt: 'Practical ideas for making thoughtful decisions from the first commit to launch day.', author: 'Nigar Əliyeva', date: '12 Aug 2026', read: '6 min read', color: 'blue' },
  { category: 'Design', title: 'Small details that make interfaces feel effortless', excerpt: 'A closer look at spacing, hierarchy, and the quiet moments that improve usability.', author: 'Murad Quliyev', date: '09 Aug 2026', read: '4 min read', color: 'orange' },
  { category: 'Lifestyle', title: 'Building a calmer, more intentional routine', excerpt: 'Simple rituals that help you make room for the work and people that matter.', author: 'Leyla Məmmədova', date: '05 Aug 2026', read: '5 min read', color: 'green' },
]

function App() {
  return <Blog />

}

export default App
