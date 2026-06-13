// Dev-only screenshot helper. Usage: node scripts/shoot.mjs [url] [outdir]
import puppeteer from 'puppeteer-core'

const URL = process.argv[2] || 'http://localhost:5173/'
const OUT = process.argv[3] || '/tmp/dph-shots'
const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--hide-scrollbars',
    // Software WebGL so the particle field renders in headless.
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
  ],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
})
const page = await browser.newPage()
await page.goto(URL, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 2500)) // let intro animations settle

// Full page
await page.screenshot({ path: `${OUT}/full.png`, fullPage: true })

// Section viewports
const sections = ['#work', '#creative', '#about', '#contact']
for (const sel of sections) {
  const el = await page.$(sel)
  if (!el) continue
  await el.scrollIntoView()
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: `${OUT}/${sel.slice(1)}.png` })
}

console.log('shots written to', OUT)
await browser.close()
