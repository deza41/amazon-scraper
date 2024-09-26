import WebScraper from './components/WebScraper'

export const metadata = {
  title: 'Amazon Web Scraper',
  description: 'Simple web scraper application',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function Home() {
  return (
    <div>
      <main>
        <WebScraper />
      </main>
    </div>
  )
}
