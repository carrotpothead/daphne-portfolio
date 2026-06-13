import { Hero } from '@/sections/Hero/Hero'
import { Concept } from '@/sections/Concept/Concept'
import { Services } from '@/sections/Services/Services'
import { Projects } from '@/sections/Projects/Projects'
import { Creative } from '@/sections/Creative/Creative'
import { About } from '@/sections/About/About'
import { Experience } from '@/sections/Experience/Experience'
import { Contact } from '@/sections/Contact/Contact'

export function Home() {
  return (
    <main id="main">
      <Hero />
      <Concept />
      <Services />
      <Projects />
      <Creative />
      <About />
      <Experience />
      <Contact />
    </main>
  )
}
