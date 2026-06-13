import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LenisProvider } from '@/lib/lenis'
import { SoundProvider } from '@/lib/useSound'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { Preloader } from '@/components/layout/Preloader'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { Home } from '@/pages/Home'
import { ProjectDetail } from '@/project-detail/ProjectDetail'

export default function App() {
  const location = useLocation()
  const [, setReady] = useState(false)

  return (
    <SoundProvider>
      <LenisProvider>
        <Preloader onDone={() => setReady(true)} />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav />
        <ScrollProgress />

        {/* Home stays mounted; project detail renders as an overlay above it. */}
        <Home />
        <Footer />

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/work/:id" element={<ProjectDetail />} />
            <Route path="*" element={null} />
          </Routes>
        </AnimatePresence>
      </LenisProvider>
    </SoundProvider>
  )
}
