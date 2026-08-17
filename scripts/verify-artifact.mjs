import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'

const OUT = process.env.SHOT_DIR ?? '/tmp'
const inner = readFileSync(new URL('../artifact/makromusic.html', import.meta.url), 'utf8')
const cut = inner.indexOf('</style>') + 8

/*
  Hostile host: an unlayered `body { background; color }` injected before the
  page's own CSS. Unlayered rules beat anything in @layer, which is exactly how
  the published artifact repainted the page white and hid every element that
  inherited its colour. The reset stops at box-sizing and body margin — zeroing
  padding on `*` would also outrank Tailwind's utilities, which the real host
  does not do.
*/
writeFileSync('/tmp/artifact-host.html', `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;background:#ffffff;color:#111111;font-family:system-ui,sans-serif}
</style>
${inner.slice(0, cut)}</head><body>${inner.slice(cut)}</body></html>`)

const errors = []
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const [name, hash, viewport] of [
  ['A1-artifact-welcome', '', { width: 1280, height: 900 }],
  ['A2-artifact-discover', '#/kesfet', { width: 390, height: 844 }],
  ['A3-artifact-events', '#/etkinlikler', { width: 1280, height: 900 }],
]) {
  const page = await browser.newPage({ viewport })
  page.on('pageerror', (e) => errors.push(`[${name}] PAGEERROR ${e.message}`))
  page.on('request', (r) => {
    const u = r.url()
    if (!u.startsWith('file://') && !u.startsWith('data:')) errors.push(`[${name}] EXTERNAL ${u}`)
  })
  await page.goto(`file:///tmp/artifact-host.html${hash}`, { waitUntil: 'load' })
  await page.waitForTimeout(800)

  const rendered = await page.evaluate(() => document.getElementById('root')?.children.length ?? 0)
  if (rendered === 0) errors.push(`[${name}] #root is EMPTY`)

  const paint = await page.evaluate(() => {
    const cs = getComputedStyle(document.body)
    return { bg: cs.backgroundColor, color: cs.color }
  })
  if (paint.bg !== 'rgb(15, 15, 35)') errors.push(`[${name}] body background is ${paint.bg}`)
  if (paint.color !== 'rgb(248, 250, 252)') errors.push(`[${name}] body color is ${paint.color}`)

  // Any text that inherits its colour must still be readable on the dark ground.
  const dark = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('h1,h2,h3,p,span,a,button')) {
      if (el.children.length > 0) continue
      const t = (el.textContent || '').trim()
      if (!t) continue
      const r = el.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) continue
      const c = (getComputedStyle(el).color.match(/[\d.]+/g) || []).map(Number)
      const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
      if (lum >= 80) continue
      // Dark text is correct on a light ground (accent buttons), so find the
      // nearest painted backdrop before calling it invisible.
      let node = el, bgLum = null
      while (node) {
        const b = (getComputedStyle(node).backgroundColor.match(/[\d.]+/g) || []).map(Number)
        if (b.length >= 3 && (b[3] === undefined || b[3] > 0.5)) {
          bgLum = 0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2]
          break
        }
        node = node.parentElement
      }
      if (bgLum !== null && bgLum > 110) continue
      out.push(`${t.slice(0, 28)} → rgb(${c.slice(0, 3)}) on lum ${bgLum}`)
    }
    return out
  })
  for (const d of new Set(dark)) errors.push(`[${name}] dark text on dark ground: ${d}`)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (overflow > 1) errors.push(`[${name}] horizontal overflow ${overflow}px`)

  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log(`${name}: root=${rendered}, body=${paint.bg} / ${paint.color}`)
  await page.close()
}

await browser.close()
if (errors.length) { console.log('PROBLEMS:\n' + [...new Set(errors)].join('\n')); process.exit(1) }
console.log('OK — survives a hostile host')
