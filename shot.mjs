import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.argv[2] || 'http://localhost:5174/'
const tag = process.argv[3] || 'shot'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=2'],
})

async function cap(w, h, name) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 })
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 1200))

  // scroll through to fire all scroll-triggered reveals, then back to top
  await page.evaluate(async () => {
    const total = document.body.scrollHeight
    const step = window.innerHeight * 0.6
    for (let y = 0; y <= total; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 220))
    }
    window.scrollTo(0, 0)
  })
  await new Promise((r) => setTimeout(r, 700))

  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true })
  await page.close()
  console.log(`wrote /tmp/${name}.png (${w}x${h})`)
}

await cap(1440, 900, `${tag}-desktop`)
await cap(390, 844, `${tag}-mobile`)
await browser.close()
