/**
 * Turns the single-file build into an Artifact page body.
 *
 * The Artifact host supplies <!doctype>, <html>, <head> and <body>, so this
 * strips those wrappers and emits only <title>, the inlined <style> blocks, the
 * body content and the inlined <script> blocks. It also drops every external
 * reference — a strict CSP blocks font CDNs and favicon files, and a blocked
 * stylesheet fails silently.
 *
 * vite-plugin-singlefile emits the script tags into <head>, so they are
 * collected from the whole document rather than from <body> alone.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = readFileSync(resolve(root, 'dist-single/index.html'), 'utf8')
const target = resolve(root, 'artifact/makromusic.html')
const standaloneTarget = resolve(root, 'artifact/makromusic-standalone.html')

const pickOne = (pattern, label) => {
  const match = source.match(pattern)
  if (!match) throw new Error(`Could not find ${label} in the single-file build`)
  return match[1]
}

const pickAll = (pattern, label) => {
  const found = [...source.matchAll(pattern)].map((m) => m[0])
  if (found.length === 0) throw new Error(`Could not find any ${label} in the single-file build`)
  return found
}

const title = pickOne(/<title>([\s\S]*?)<\/title>/i, '<title>')
const styles = pickAll(/<style[^>]*>[\s\S]*?<\/style>/gi, '<style> block')
const scripts = pickAll(/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/gi, 'inlined <script> block')
const body = pickOne(/<body[^>]*>([\s\S]*?)<\/body>/i, '<body>')

const page = `<title>${title}</title>
${styles.join('\n')}
${body.trim()}
${scripts.join('\n')}
`

// --- guards: every one of these has silently produced a blank page before ---

const scriptBytes = scripts.join('').length
if (scriptBytes < 100_000) {
  throw new Error(
    `Inlined script is only ${scriptBytes} bytes — the bundle was not captured. ` +
      `Check where vite-plugin-singlefile emitted the <script> tags.`,
  )
}

if (!/<div[^>]+id=["']root["']/.test(page)) {
  throw new Error('Mount point #root is missing — React would have nothing to render into')
}

const external = [...page.matchAll(/(?:href|src)\s*=\s*["']([^"']*\/\/[^"']+)["']/gi)].map(
  (m) => m[1],
)
if (external.length > 0) {
  throw new Error(`External references survived and would be CSP-blocked:\n${external.join('\n')}`)
}

for (const wrapper of ['<!doctype', '<html', '<head', '<body']) {
  if (page.toLowerCase().includes(wrapper)) {
    throw new Error(`Wrapper tag "${wrapper}" leaked into the artifact body`)
  }
}

const MAX_BYTES = 16 * 1024 * 1024
if (page.length > MAX_BYTES) {
  throw new Error(`Page is ${(page.length / 1024 / 1024).toFixed(1)} MB — over the 16 MB limit`)
}

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, page)
console.log(
  `artifact/makromusic.html — ${(page.length / 1024).toFixed(0)} kB ` +
    `(script ${(scriptBytes / 1024).toFixed(0)} kB), no external refs`,
)

/*
  Second output: a complete document to open straight from disk or drop on any
  static host. The build references /favicon.svg by path, which 404s under
  file://, so it is inlined as a data URI and the file depends on nothing but
  the optional web font.
*/
const favicon = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')
const faviconUri = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`

const standalone = source.replace(
  /<link\s+rel="icon"[^>]*>/i,
  `<link rel="icon" type="image/svg+xml" href="${faviconUri}" />`,
)

if (standalone.includes('href="/favicon.svg"')) {
  throw new Error('Favicon path was not inlined — the standalone file would 404 under file://')
}
if (!/<!doctype html>/i.test(standalone)) {
  throw new Error('Standalone output is not a complete document')
}

writeFileSync(standaloneTarget, standalone)
console.log(
  `artifact/makromusic-standalone.html — ${(standalone.length / 1024).toFixed(0)} kB, ` +
    `complete document, favicon inlined`,
)
