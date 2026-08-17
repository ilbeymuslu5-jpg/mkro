import { chromium } from 'playwright'

const OUT = '/tmp/claude-0/-home-user-vizard-api-skills/00c25a5e-89df-53d8-b48e-2a76577dc464/scratchpad'

// ------------------------------------------------------------- contrast --

function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function hex(value) {
  const h = value.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

function ratio(a, b) {
  const [x, y] = [luminance(hex(a)), luminance(hex(b))].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const T = {
  background: '#0f0f23',
  card: '#1b1b30',
  muted: '#27273b',
  foreground: '#f8fafc',
  mutedForeground: '#94a3b8',
  accent: '#22c55e',
  onAccent: '#0f172a',
  secondary: '#4338ca',
  secondaryBright: '#818cf8',
  destructiveBright: '#f87171',
  destructive: '#ef4444',
  border: '#4a4a70',
  primary: '#1e1b4b',
}

// Pairs the UI actually renders, with the minimum each one needs.
const PAIRS = [
  ['body text on background', T.foreground, T.background, 4.5],
  ['body text on card', T.foreground, T.card, 4.5],
  ['muted text on background', T.mutedForeground, T.background, 4.5],
  ['muted text on card', T.mutedForeground, T.card, 4.5],
  ['muted text on muted surface', T.mutedForeground, T.muted, 4.5],
  ['accent text on background', T.accent, T.background, 4.5],
  ['accent text on card', T.accent, T.card, 4.5],
  ['on-accent text on accent button', T.onAccent, T.accent, 4.5],
  ['destructive text on card', T.destructiveBright, T.card, 4.5],
  ['mid compat score on card', T.secondaryBright, T.card, 4.5],
  ['low compat score on card', T.mutedForeground, T.card, 4.5],
  ['border against card', T.border, T.card, 1.5],
]

console.log('--- contrast ---')
const contrastFailures = []
for (const [label, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg)
  const ok = r >= min
  if (!ok) contrastFailures.push(`${label}: ${r.toFixed(2)}:1 (need ${min}:1)`)
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.toFixed(2)}:1  ${label}`)
}

// ------------------------------------------------------------- rendering --

const ROUTES = [
  ['welcome', '/'],
  ['kesfet', '/kesfet'],
  ['anlik', '/anlik'],
  ['sosyal', '/sosyal'],
  ['muzik', '/muzik'],
  ['sohbetler', '/sohbetler'],
  ['sohbet', '/sohbetler/p-1'],
  ['etkinlikler', '/etkinlikler'],
  ['platinum', '/platinum'],
  ['profil', '/profil'],
  ['kisi', '/kisi/p-3'],
]

const problems = [...contrastFailures.map((f) => `[contrast] ${f}`)]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const [width, tag] of [
  [375, 'mobile'],
  [1440, 'desktop'],
]) {
  const page = await browser.newPage({ viewport: { width, height: width < 500 ? 812 : 900 } })
  page.on('pageerror', (e) => problems.push(`[${tag}] PAGEERROR ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) {
      problems.push(`[${tag}] console: ${m.text()}`)
    }
  })

  await page.goto('http://localhost:5173/giris', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /İzin ver/ }).click()
  await page.waitForURL('**/kesfet', { timeout: 20000 })

  for (const [name, path] of ROUTES) {
    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(350)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    if (overflow > 1) problems.push(`[${tag}/${name}] horizontal overflow ${overflow}px`)

    // Interactive controls smaller than 44px are hard to hit on a phone.
    if (width < 500) {
      const small = await page.evaluate(() => {
        const out = []
        for (const el of document.querySelectorAll('button, a[href], input, select, [role="switch"]')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          // Visually hidden controls are driven by a visible proxy.
          if (el.classList.contains('sr-only')) continue
          if (r.height < 40 || r.width < 40) {
            const label = (el.getAttribute('aria-label') || el.textContent || el.tagName)
              .trim()
              .slice(0, 34)
            out.push(`${label} (${Math.round(r.width)}x${Math.round(r.height)})`)
          }
        }
        return out
      })
      for (const entry of new Set(small)) problems.push(`[tap/${name}] ${entry}`)
    }

    // Text that clips rather than wrapping.
    const clipped = await page.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('h1, h2, h3, p, span, a, button')) {
        if (el.children.length > 0) continue
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          const style = getComputedStyle(el)
          if (style.textOverflow === 'ellipsis' || style.overflow === 'hidden') continue
          out.push((el.textContent || '').trim().slice(0, 34))
        }
      }
      return out
    })
    for (const entry of new Set(clipped)) problems.push(`[clip/${tag}/${name}] ${entry}`)

    await page.screenshot({ path: `${OUT}/G-${tag}-${name}.png`, fullPage: true })
  }

  await page.close()
}

await browser.close()

console.log('\n--- findings ---')
if (problems.length === 0) console.log('none')
else for (const p of problems) console.log(p)
