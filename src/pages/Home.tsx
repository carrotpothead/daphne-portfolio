import { Hero } from '@/sections/Hero/Hero'
import { Projects } from '@/sections/Projects/Projects'
import { Stack } from '@/sections/Stack/Stack'
import { About } from '@/sections/About/About'
import { Contact } from '@/sections/Contact/Contact'

export function Home() {
  return (
    <main id="main">
      <Hero />
      <Projects />
      <Stack />
      <About />
      <Contact />
    </main>
  )
}
