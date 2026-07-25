import Hero from '@/components/Hero'
import About from '@/components/About'
import ContentPillars from '@/components/ContentPillars'
import Writeups from '@/components/Writeups'
import Footer from '@/components/Footer'
import MatrixRain from '@/components/MatrixRain'

export default function Home() {
  return (
    <main className="relative">
      <MatrixRain />
      <div className="relative z-10">
        <Hero />
        <About />
        <ContentPillars />
        <Writeups />
        <Footer />
      </div>
    </main>
  )
}
