/**
 * Lightweight, dependency-free split-text.
 * Wraps each word (and optionally each char) in a masked span so GSAP can
 * translate the inner element up from behind an overflow:hidden mask.
 *
 * Keeps the original text in a data attribute and restores it on revert(),
 * so screen readers, copy-paste, and SEO always see clean text.
 */
export type SplitType = 'words' | 'chars'

export type SplitResult = {
  words: HTMLElement[]
  chars: HTMLElement[]
  revert: () => void
}

export function splitText(el: HTMLElement, type: SplitType = 'words'): SplitResult {
  const original = el.getAttribute('data-split-original') ?? el.textContent ?? ''
  el.setAttribute('data-split-original', original)

  // ARIA: expose the clean string, hide the shrapnel from AT.
  el.setAttribute('aria-label', original.trim())

  const words: HTMLElement[] = []
  const chars: HTMLElement[] = []

  el.textContent = ''

  const tokens = original.split(/(\s+)/) // keep whitespace tokens
  for (const token of tokens) {
    if (token.trim() === '') {
      el.appendChild(document.createTextNode(token))
      continue
    }

    const mask = document.createElement('span')
    mask.className = 'split-mask'
    mask.setAttribute('aria-hidden', 'true')

    const word = document.createElement('span')
    word.className = 'split-word'

    if (type === 'chars') {
      for (const ch of Array.from(token)) {
        const c = document.createElement('span')
        c.className = 'split-char'
        c.textContent = ch
        word.appendChild(c)
        chars.push(c)
      }
    } else {
      word.textContent = token
    }

    mask.appendChild(word)
    el.appendChild(mask)
    words.push(word)
  }

  const revert = () => {
    el.textContent = el.getAttribute('data-split-original') ?? ''
    el.removeAttribute('aria-label')
  }

  return { words, chars, revert }
}
