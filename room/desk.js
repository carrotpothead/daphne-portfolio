/* ------------------------------------------------------------------ *
 *  The desk: a file pulled from the drawer lands here, closed.
 *  It slides into place, the cover swings over on its spine, and the
 *  contents sit the way they would in a real file: things clipped to
 *  the inside of the cover on the left, a stapled write-up on top of a
 *  stack on the right, and notes everywhere. Every piece can be dragged,
 *  thrown, or picked up; envelopes and bags tip their contents out.
 * ------------------------------------------------------------------ */

import { RECIPE_BACKS } from './recipes.js'

const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const P = './assets/proj/'

const S = './assets/social/'
const POSTS = [
  { type: 'post', label: 'TAP THIS #6', poster: `${S}tap6.jpg`, video: `${S}tap6.mp4` },
  { type: 'post', label: 'Guess the tune', poster: `${S}guess.jpg`, video: `${S}guess.mp4` },
  { type: 'post', label: 'TAP THIS #5', poster: `${S}tap5.jpg`, video: `${S}tap5.mp4` },
  { type: 'post', label: 'Hear this before you pick the double bass', poster: '/images/wall/double-bass-interview.jpg', video: '/videos/wall/double-bass-interview.mp4' },
  { type: 'post', label: 'Super Clavis, for the first 100', poster: '/images/wall/super-clavis.jpg', video: `${P}super-clavis.mp4` },
  { type: 'post', label: 'Mellophone confessional', poster: `${S}mellophone.jpg` },
  { type: 'post', label: 'Bandroom intern', poster: `${S}intern.jpg` },
  { type: 'post', label: 'Heaviest in the marching band', poster: `${S}heaviest.jpg` },
  { type: 'post', label: 'Duo instruments', poster: `${S}duos.jpg` },
]
const RECIPES = ['birria', 'smash-burger', 'thai-basil', 'bulgogi', 'garlic-noodles', 'katsu', 'risotto', 'whipped-feta', 'tacos', 'gnocchi'].map((r) => ({
  type: 'recipe', id: r, label: r.replace('-', ' '), poster: `${P}mm-recipe-${r}.jpg`,
}))
// the 14 in-app states, i.e. the product's whole feedback loop
const STATES = [
  ['13-greeting', 'greeting'], ['10-guide', 'new topic'], ['02-nod', 'correct'], ['03-wince', 'wrong'],
  ['01-perfect-dance', 'perfect lesson'], ['07-applause', 'lesson complete'], ['04-fire-dance', 'streak milestone'],
  ['05-slump', 'streak broken'], ['06-xp-confetti', 'xp milestone'], ['14-gem-reward', 'gem reward'],
  ['08-out-of-hearts', 'out of hearts'], ['09-comeback', 'comeback'], ['11-boss-trophy', 'boss'], ['12-idle', 'idle'],
].map(([f, label]) => ({ src: `/images/states/clavis-${f}.png`, label }))

const CAST = ['bass-guitar', 'bassoon', 'cello', 'clarinet', 'conductor', 'cymbal', 'dj', 'double-bass', 'drums', 'electric-guitar', 'electric-piano', 'flute', 'french-horn', 'oboe', 'recorder', 'saxophone', 'singer', 'snare-drum', 'timpani', 'triangle', 'trombone', 'trumpet', 'tuba', 'viola', 'violin', 'xylophone']
// agent carroto: his dock poses (rendered from this room, with glasses), for the contact sheet
const AGENT_POSES = [['walk', 'walk'], ['idle', 'hello'], ['water', 'water fernando'], ['yoga', 'tree pose'], ['lunch', 'lunch alarm'],
  ['eat', 'lunch with you'], ['focus', 'focus with me'], ['cheer', 'i did a thing'], ['sleep', 'nap'], ['dangle', 'picked up'],
].map(([f, label]) => ({ src: `${P}ac-pose-${f}.png`, label }))

/* the Bandroom app, a few screens to flick through on the phone in the evidence bag */
const SCREENS = ['02', '03', '05', '06', '07', '10', '13'].map((n) => `./assets/app/${n}.jpg`)
const Q = 2 // the question screen: tap an answer
const WRONG = './assets/app/wrong.jpg'

/*
 * What's in each folder.
 *  left:   clipped or tucked into the inside of the cover (dx/dy place them on that page, 0..1)
 *  stack:  sheets on the right page, TOP FIRST: squared up, pulled off one at a time
 *  extras: loose things on the right page, over the stack
 */
const FOLDERS = {
  dossier: {
    no: '001', title: 'daphne', tab: 'confidential', color: '#e6c27f', inside: '#f0d6a2', ink: '#b3261e',
    stamp: { text: 'confidential', color: '#c8322a' },
    left: [
      { type: 'photo', src: './assets/photo-color.png', caption: 'fig. 1: the subject', clip: true, bw: true, dx: 0.12, dy: 0.06, rot: -3, w: 14 },
      { type: 'card', title: 'capabilities', chips: ['ai_native_building', 'gtm_strategy', 'brand_art_direction', 'content_at_scale', 'community_social'], dx: 0.08, dy: 0.64, rot: 2 },
      { type: 'sticky', text: "that's the boss.", dx: 0.6, dy: 0.44, rot: 6 },
    ],
    stack: [
      {
        type: 'record',
        fields: [
          ['subject', 'daphne'],
          ['role', 'marketer who builds with ai'],
          ['known for', 'dreaming up the impossible. shipping the fun.'],
          ['handler', 'one carrot, armed with a key'],
          ['clearance', 'you, apparently ✓'],
        ],
      },
      {
        type: 'memo', to: 'whoever found the key', re: 'how i work',
        body: [
          'I orchestrate agents, models and pipelines to ship real products. Games, apps, characters, campaigns.',
          'Ideas with the right tools beat a perfect plan that never ships. Embrace the problem, question current methods, find the right tools, and you can build almost anything.',
          'The hardest part was never the building. It was deciding to start.',
        ],
      },
    ],
    extras: [],
  },

  bandroom: {
    no: '002', title: 'bandroom', tab: 'bandroom', color: '#1d33d8', inside: '#4a5fe8', ink: '#ffffff',
    stamp: { text: 'live', color: '#1f8a4c' },
    left: [
      { type: 'photo', src: '/images/projects/bandroom-site.png', caption: 'the site', clip: true, dx: 0.03, dy: 0.02, rot: -4, w: 15.5, fit: 'top', visit: { label: 'visit bandroom.ai ↗', href: 'https://bandroom.ai' } },
      { type: 'photo', src: '/images/wall/launch-video.jpg', video: '/videos/bandroom-launch.mp4', caption: 'the launch film', dx: 0.6, dy: 0.02, rot: 5, w: 11, tall: true },
      { type: 'bag', label: 'bandroom, the app', contents: [{ type: 'phone' }], dx: 0.04, dy: 0.42, rot: -5 },
      { type: 'card', title: 'my toolkit here', chips: ['Positioning', 'Brand & voice', 'Higgsfield', 'ElevenLabs', 'Claude Code', 'GA4'], dx: 0.44, dy: 0.62, rot: 2 },
      { type: 'tag', text: 'bandroom.ai ↗', href: 'https://bandroom.ai', dx: 0.06, dy: 0.9, rot: -3 },
      { type: 'sticky', text: 'ooh. the big one.', dx: 0.74, dy: 0.84, rot: 6 },
    ],
    stack: [
      {
        type: 'report', page: '1 of 2',
        title: 'bandroom', kicker: 'Anyone can hear the music. Bandroom teaches you to read it, five minutes at a time.',
        sections: [
          ['the brief', 'Graded music theory is a fixed sequence. Everyone gets the same order at the same pace, and the gaps carry forward. Bandroom is a graded course in five-minute daily sessions that adapts: it tracks mastery for each concept and reorders the path after every answer.'],
          ['my part', 'Built with a technical founder. I lead marketing (positioning, brand, go-to-market) and feed product input on UX and features. The positioning line is mine: everyone can hear music; this is for people who want to read it. It runs from the homepage through every post.'],
          ['who it’s for', ['The curious learner, 16 to 30.', 'The student with an exam coming up.', 'The instrument teacher, who gets a one-tap progress report.']],
        ],
      },
      {
        type: 'report', page: '2 of 2',
        sections: [
          ['what i built', [
            'Clavis, the mascot. Generated from one saved reference, kept on-model across 14 in-app states and a cast of 34 skins.',
            'The content machine. Every post moves idea → draft → ready → posted on a production board, with music and sound from ElevenLabs.',
            'The launch. A launch film, the TAP THIS and Liner Notes series, and Super Clavis, a reward skin for the first 100 users.',
          ]],
          ['how i keep him on-model', 'Feed a strong reference, describe only what is new, change one thing at a time. A new pose gets a fresh generation, never an edit.'],
          ['what i learned', 'Our most-viewed post was a trend-jack. It pulled in almost nobody who wanted to read music. Now every gag has to pass three tests before it ships: stranger, genre, listener.'],
        ],
      },
      { type: 'poster' },
      { type: 'contact', title: 'who’s that clavis? · 14 states', imgs: STATES },
    ],
    extras: [
      {
        type: 'receipt', title: 'shipped', clip: true, dx: 0.8, dy: 0.02, rot: 7,
        rows: [['campaigns', '32'], ['files posted', '445'], ['ideas in backlog', '194'], ['in-app states', '14'], ['cast skins', '34']],
        total: ['voice', 'one'],
      },
      { type: 'note', text: 'one reference image. every skin since comes from it.', dx: -0.14, dy: 0.84, rot: -7 },
      { type: 'envelope', label: 'posts that shipped', contents: POSTS, dx: 0.64, dy: 0.86, rot: -4 },
    ],
  },

  misemash: {
    no: '003', title: 'misemash', tab: 'misemash', color: '#c2410c', inside: '#dc6636', ink: '#fff7ed',
    stamp: { text: 'live soon', color: '#b45309' },
    left: [
      { type: 'photo', src: `${P}mm-welcome-hero.jpg`, caption: 'dinner, sorted', clip: true, portrait: true, dx: 0.04, dy: 0.02, rot: -3, w: 13 },
      { type: 'photo', src: `${P}mm-plan-hero.jpg`, caption: 'plan the week', portrait: true, dx: 0.54, dy: 0.05, rot: 5, w: 12 },
      { type: 'photo', src: `${P}mm-recipe-butter-chicken.jpg`, caption: 'butter chicken', portrait: true, dx: 0.06, dy: 0.5, rot: 3, w: 11 },
      { type: 'photo', src: `${P}mm-recipe-shakshuka.jpg`, caption: 'shakshuka', portrait: true, dx: 0.5, dy: 0.47, rot: -4, w: 11 },
      { type: 'card', title: 'my toolkit here', chips: ['Claude Code', 'Higgsfield', 'Next.js', 'Weavy'], dx: 0.3, dy: 0.82, rot: 2 },
      { type: 'sticky', text: 'this one makes dinner.', dx: 0.72, dy: 0.84, rot: 5 },
    ],
    stack: [
      {
        type: 'report', page: '1 of 2',
        title: 'misemash', kicker: 'Every recipe you’ve saved, one plan for the week, one list for the shop.',
        sections: [
          ['the problem', '47 saved reels. Zero idea what’s for dinner. Recipes live in six different apps, 6pm is a fridge stare, and the weekend shop has no plan. The space between finding food and actually cooking it belongs to nobody.'],
          ['what it is', ['Recipe vault: save from anywhere.', 'What can I cook? Matches recipes to what’s already in your fridge.', 'Weekend planning: it builds your week.', 'One grocery list for all of it.']],
        ],
      },
      {
        type: 'report', page: '2 of 2',
        sections: [
          ['how it evolved', ['V1: a web-app prototype.', 'V2: a landing page with Higgsfield visuals.', 'V3: a phone-first prototype built around the everyday moments food crosses your mind: scrolling on the couch, staring into the fridge at 6pm, standing in the supermarket aisle.', 'V4: an animated scroll site.']],
          ['where it is', 'Mobile-first, launching Q4 2026.'],
        ],
      },
    ],
    extras: [
      { type: 'envelope', label: 'recipes in the vault', contents: RECIPES, dx: 0.64, dy: 0.86, rot: -3 },
    ],
  },

  'space-vibes': {
    no: '004', title: 'space vibes', tab: 'space vibes', color: '#6d28d9', inside: '#8a52e8', ink: '#f5f3ff',
    stamp: { text: 'live', color: '#1f8a4c' },
    left: [
      { type: 'photo', src: '/images/projects/spacevibes-thumb.png', video: '/videos/space-vibes.mp4', caption: 'gameplay', clip: true, dx: 0.04, dy: 0.03, rot: -3, w: 20 },
      { type: 'sticker', src: `${P}sv-plastic_lover.png`, alt: 'Plastic Lover', dx: 0.08, dy: 0.44, rot: -8, w: 7 },
      { type: 'sticker', src: `${P}sv-pepe.png`, alt: 'Pepe', dx: 0.36, dy: 0.47, rot: 7, w: 7 },
      { type: 'sticker', src: `${P}sv-shower.png`, alt: 'Shower', dx: 0.66, dy: 0.42, rot: -4, w: 6 },
      { type: 'sticker', src: `${P}sv-stone.png`, alt: 'Asteroid', dx: 0.7, dy: 0.02, rot: 12, w: 6 },
      { type: 'card', title: 'my toolkit here', chips: ['Claude Code', 'Next.js', 'Postgres', 'Vercel'], dx: 0.06, dy: 0.7, rot: -2 },
      { type: 'tag', text: 'play it ↗', href: 'https://spacevibes.vercel.app/', dx: 0.5, dy: 0.9, rot: -4 },
      { type: 'sticky', text: 'you’ve met this one.', dx: 0.66, dy: 0.66, rot: 5 },
    ],
    stack: [
      {
        type: 'report', page: '1 of 1',
        title: 'space vibes', kicker: 'Fly, collect good vibes, convert the bad ones, climb the leaderboard.',
        sections: [
          ['the brief', 'The Good Vibes Club vibeathon: build something for the community, fast. My pitch was Temple Run meets Dookey Dash, in space.'],
          ['what it is', 'Fly through space, scoop up good vibes, flip the bad vibers to your side, dodge asteroids and fight for the top of a live leaderboard.'],
          ['my part', ['Solo. Vibe-coded through the GVC command line, then debugged to a stable production release.', 'iOS fullscreen and crash fixes, a tutorial, weapon balancing.', 'A rate-limited scores API on Postgres behind an all-time top-20 leaderboard.']],
          ['shipped', 'Listed on goodvibesclub.ai/builds. And it’s the game you played to get the key to this drawer.'],
        ],
      },
    ],
    extras: [
      {
        type: 'receipt', title: 'build log', clip: true, dx: 0.8, dy: 0.02, rot: 7,
        rows: [['commits', '33'], ['days', '7'], ['gvc badges', '101'], ['leaderboard', 'top 20'], ['keys issued', '1']],
        total: ['issued to', 'you'],
      },
      { type: 'note', text: '33 commits in 7 days.', dx: -0.24, dy: 0.8, rot: -6 },
    ],
  },
  'agent-carroto': {
    no: '005', title: 'agent carroto', tab: 'agent carroto', color: '#f47b20', inside: '#f79a52', ink: '#fff7ed',
    stamp: { text: 'on duty', color: '#2338d4' },
    left: [
      { type: 'photo', src: `${P}ac-walk.webp`, caption: 'on the dock', clip: true, dx: 0.04, dy: 0.02, rot: -3, w: 12, portrait: true },
      { type: 'contact', title: 'who’s that carroto? · 10 poses', imgs: AGENT_POSES, dx: 0.02, dy: 0.46, rot: -2 },
      { type: 'sticky', text: 'he got promoted. hence the glasses.', dx: 0.56, dy: 0.1, rot: 6 },
    ],
    stack: [
      {
        type: 'report', page: '1 of 1',
        title: 'agent carroto', kicker: 'I work alone. So I built the colleague I didn’t have.',
        sections: [
          ['the problem', 'Working solo means no one says morning, no one asks how the day went, no one sits with you while you focus, and no one taps you when the chart you meant to watch dips while you’re heads-down.'],
          ['what he is', ['A carrot who lives on the Mac dock: walks, naps on a pillow, waters a pocket-sized Fernando, does yoga.', 'A colleague: morning standup, 6pm wrap, focus sessions at a tiny desk, lunch at 12:30, remembers what I tell him.', 'A marketing second opinion: honest notes on a copied caption, ten angles on demand, knows my brands.', 'A lookout: watches my tokens every two minutes and shouts about big dips and jumps, even mid-focus. Facts, never advice.']],
          ['how i built him', ['Started from lil-agents, an open-source dock app (Ryan Stephen, MIT).', 'Rendered him frame by frame from this site’s own 3D room: a render mode that hides the room and walks him on the app’s timing, then encoded to transparent video.', 'Added the colleague layer, the price watchers and a locked-down chat with Claude Code.']],
          ['what i learned', 'A pet gets closed in a week. A colleague stays open. The trick wasn’t more animation; it was giving him jobs.'],
        ],
      },
    ],
    extras: [
      { type: 'tag', text: 'adopt carroto →', action: 'adopt', dx: 0.04, dy: 0.94, rot: -3 }, // opens the personal drawer's adoption papers
      { type: 'tag', text: 'his adventures: @agentcarroto ↗', href: 'https://www.instagram.com/agentcarroto/', dx: -0.6, dy: 0.28, rot: 4 },
      { type: 'note', text: 'the one you can adopt is plain carroto. the glasses stay with me.', dx: 0.62, dy: 0.86, rot: -5 },
      {
        type: 'receipt', title: 'on his desk', clip: true, dx: 0.8, dy: 0.02, rot: 7,
        rows: [['clips', '15'], ['checks', '2m'], ['rituals', '3'], ['coworkers', '1']],
        total: ['alerts cost', '$0'],
      },
    ],
  },
}

/* ---------------- paper renderers ---------------- */
const para = (p) => (Array.isArray(p) ? `<ul>${p.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(p)}</p>`)
const lastPage = (page) => page.startsWith(page.slice(-1)) // "2 of 2", "1 of 1"
function render(it, f) {
  switch (it.type) {
    case 'report':
      return `<div class="paper report">
        <span class="staple" aria-hidden="true"></span>
        <p class="rp-head"><span>case file · no. ${f.no}</span><span>p. ${esc(it.page)}</span></p>
        ${it.title ? `<h3 class="rp-title">${esc(it.title)}</h3><p class="rp-kicker">${esc(it.kicker)}</p>` : ''}
        ${it.sections.map(([k, v]) => `<section><p class="rp-k">${esc(k)}</p>${para(v)}</section>`).join('')}
        ${lastPage(it.page) ? '<p class="sign">— d.</p>' : '<p class="rp-over">over →</p>'}
      </div>`
    case 'memo':
      return `<div class="paper memo">
        <p class="memo-h">memo</p>
        <dl class="memo-meta"><div><dt>to</dt><dd>${esc(it.to)}</dd></div><div><dt>from</dt><dd>d.</dd></div><div><dt>re</dt><dd>${esc(it.re)}</dd></div></dl>
        ${it.body.map((p) => `<p>${esc(p)}</p>`).join('')}
        <p class="sign">— d.</p>
      </div>`
    case 'record':
      return `<div class="paper record">
        <p class="rec-h"><span>personnel record</span><span>no. ${f.no}</span></p>
        <dl>${it.fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p class="rec-foot">eyes only · do not photocopy (lol)</p>
      </div>`
    case 'card':
      return `<div class="paper card"><p class="card-h">${esc(it.title)}</p><ul>${it.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`
    case 'poster':
      return `<div class="paper poster">
        <p class="pst-top">bandroom presents</p>
        <h3 class="pst-title">the clavis cast</h3>
        <p class="pst-sub">one character · ${CAST.length} instruments · all on-model</p>
        <div class="pst-head"><img src="./assets/cast/super-clavis.png" alt="Super Clavis" draggable="false" /><p><strong>super clavis</strong><span>special guest · first 100 only</span></p></div>
        <div class="pst-grid">${CAST.map((c) => `<figure><img src="./assets/cast/${c}.png" alt="Clavis, ${c.replace('-', ' ')}" draggable="false" /><figcaption>${c.replace('-', ' ')}</figcaption></figure>`).join('')}</div>
        <p class="pst-foot">choose yours in the app · doors open daily</p>
      </div>`
    case 'photo':
      return `<figure class="paper photo${it.bw ? ' bw' : ''}${it.fit === 'top' ? ' top' : ''}${it.tall ? ' tall' : ''}${it.portrait ? ' portrait' : ''}">
        ${it.video
          ? `<video src="${it.video}" poster="${it.src}" muted loop playsinline preload="metadata"></video>`
          : `<img src="${it.src}" alt="${esc(it.caption)}" draggable="false" />`}
        <figcaption>${esc(it.caption)}</figcaption>
        ${it.visit ? `<a class="visit" href="${it.visit.href}" target="_blank" rel="noopener">${esc(it.visit.label)}</a>` : ''}
      </figure>`
    case 'sticky':
      return `<div class="paper sticky"><p>${esc(it.text)}</p><p class="by">— c.</p></div>`
    case 'note':
      return `<div class="paper note"><p>${esc(it.text)}</p><p class="by">— d.</p></div>`
    case 'tag':
      return `<div class="paper tag"><span class="hole"></span>${esc(it.text)}</div>`
    case 'ticket':
      return `<div class="paper ticket"><div class="tk-main"><p class="tk-h">admit one</p><p class="tk-title">${esc(it.title)}</p><p class="tk-line">${esc(it.line)}</p></div><div class="tk-stub">${esc(it.stub)}</div></div>`
    case 'sticker':
      return `<div class="sticker"><img src="${it.src}" alt="${esc(it.alt)}" draggable="false" /></div>`
    case 'receipt':
      return `<div class="paper receipt">
        <p class="r-h">${esc(it.title)}</p><p class="r-sub">file no. ${f.no} · ${esc(f.title)}</p>
        <ul>${it.rows.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join('')}</ul>
        <p class="r-total"><span>${esc(it.total[0])}</span><span>${esc(it.total[1])}</span></p>
        <p class="r-bar" aria-hidden="true"></p><p class="r-thx">thank you, come again</p>
      </div>`
    case 'contact':
      return `<div class="paper contact">
        <div class="c-grid">${it.imgs.map((m, i) => `<figure><img src="${m.src}" alt="Clavis, ${esc(m.label)}" draggable="false" /><span class="c-no">${String(i + 1).padStart(2, '0')}</span><span class="c-name">${esc(m.label)}</span></figure>`).join('')}</div>
        <p class="c-tape">${esc(it.title)}</p>
      </div>`
    case 'envelope':
      return `<div class="paper envelope">
        <div class="env-flap" aria-hidden="true"></div>
        <p class="env-label">${esc(it.label)}<span>× ${it.contents.length}</span></p>
        <p class="env-hint">tip it out</p>
      </div>`
    case 'bag':
      return `<div class="bag">
        <div class="bag-zip" aria-hidden="true"></div>
        <div class="bag-phone" aria-hidden="true"><img src="${SCREENS[0]}" alt="" draggable="false" /></div>
        <p class="bag-label"><span>evidence</span>${esc(it.label)}</p>
        <p class="env-hint">open the bag</p>
      </div>`
    case 'phone':
      return `<div class="phone">
        <div class="ph-screen"><div class="ph-status" aria-hidden="true"><span>9:41</span><span class="ph-island"></span><span class="ph-icons">▮▮▮ ◔</span></div><img src="${SCREENS[0]}" alt="Bandroom app screen" draggable="false" /></div>
        <p class="ph-hint">pick me up to play</p>
      </div>`
    case 'recipe': {
      // front: the photo. back: the actual recipe, like the cards you pick up at the supermarket
      const b = RECIPE_BACKS[it.id]
      return `<div class="recipe">
        <figure class="rc-face rc-front paper">
          <img src="${it.poster}" alt="${esc(it.label)}" draggable="false" />
          <figcaption><span class="rc-name">${esc(it.label)}</span><span class="rc-saved">saved to the vault ✓</span><span class="rc-flip">flip me ↻</span></figcaption>
        </figure>
        <div class="rc-face rc-back paper">
          <p class="rb-top">misemash · recipe card</p>
          <h4 class="rb-title">${esc(b.title)}</h4>
          <p class="rb-quirk">${esc(b.quirk)}</p>
          <p class="rb-meta"><span>⏱ ${b.minutes} min</span><span>serves ${b.serves}</span></p>
          <p class="rb-k">you'll need</p>
          <ul class="rb-ing">${b.ingredients.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          <p class="rb-k">how</p>
          <ol class="rb-steps">${b.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
          <p class="rb-foot">plan. cook. tame the chaos.</p>
        </div>
      </div>`
    }
    case 'post':
      return `<figure class="paper photo post${it.square ? ' square' : ''}">
        ${it.video ? `<video src="${it.video}" poster="${it.poster}" muted loop playsinline preload="metadata"></video>` : `<img src="${it.poster}" alt="${esc(it.label)}" draggable="false" />`}
        <figcaption>${esc(it.label)}</figcaption>
      </figure>`
  }
  return ''
}

/* ---------------- the desk ---------------- */
export function createDesk({ sfx = {}, onClose, onAction } = {}) {
  const el = document.createElement('div')
  el.className = 'desk'
  el.hidden = true
  el.innerHTML = `
    <div class="desk-bar"><span class="desk-no"></span><span class="desk-hint">( pull sheets off the stack · click to pick up )</span></div>
    <div class="fold">
      <div class="fold-back"><div class="fold-tab"></div><div class="fold-crease"></div></div>
      <div class="fold-cover">
        <div class="face front"></div>
        <div class="face inside"><p class="doodle">property of d.<br />if found, return to the carrot</p></div>
      </div>
    </div>
    <div class="items"></div>
    <div class="desk-dim"></div>
    <div class="desk-acts">
      <button class="pill" type="button" data-tidy>sort it back (like you weren't snooping)</button>
      <button class="pill" type="button" data-close>put it back ✕</button>
    </div>`
  document.body.appendChild(el)
  const fold = el.querySelector('.fold'), front = el.querySelector('.face.front')
  const itemsEl = el.querySelector('.items'), dim = el.querySelector('.desk-dim')

  let items = [], Z = 100, geo = null, current = null, inspecting = null, open = false, closing = false
  const timers = []
  const later = (ms, fn) => timers.push(setTimeout(fn, ms))

  function layout() {
    const vw = innerWidth, vh = innerHeight
    // always a two-page spread; on small screens the whole folder scales down, papers and all
    const Pw = Math.min(vw * 0.47, (vh - 140) * 0.78, 560)
    const H = Pw / 0.78
    const u = Pw / 35
    el.style.fontSize = `${u}px`
    const top = Math.max(64, (vh - H) / 2 + 6)
    const cx = vw / 2
    geo = {
      P: Pw, H, top, u,
      closedLeft: cx - Pw / 2,
      openLeft: cx,
      left: { x: cx - Pw, y: top, w: Pw, h: H },
      right: { x: cx, y: top, w: Pw, h: H },
    }
    Object.assign(fold.style, { width: `${Pw}px`, height: `${H}px`, top: `${top}px` })
    return geo
  }

  function place(it) {
    it.el.style.transform = `perspective(900px) translate(${it.x}px, ${it.y}px) rotate(${it.rot}deg) rotateX(${it.tx || 0}deg) scale(${it.s})`
    it.el.style.zIndex = it.z
  }
  // where an item lives when the file is tidy
  function home(it) {
    if (it.side === 'stack') {
      const r = geo.right, w = it.el.offsetWidth, i = it.stackIndex
      return {
        x: r.x + (r.w - w) / 2 + (i % 2 ? 1 : -1) * i * 5,
        y: r.y + r.h * 0.05 + i * 7,
        rot: (i % 2 ? 1 : -1) * (0.6 + i * 0.7),
        z: 60 - i,
      }
    }
    if (it.side === 'spilled') return { ...it.home, z: it.z }
    const r = geo[it.side === 'extra' ? 'right' : it.side]
    return { x: r.x + it.spec.dx * r.w, y: r.y + it.spec.dy * r.h, rot: it.spec.rot, z: it.side === 'extra' ? 70 + it.order : 20 + it.order }
  }

  function addItem(spec, side, f, extra = {}) {
    const wrap = document.createElement('div')
    wrap.className = `item it-${spec.type}${spec.clip ? ' has-clip' : ''}`
    wrap.innerHTML = render(spec, f) + (spec.clip ? '<span class="clip" aria-hidden="true"></span>' : '')
    if (spec.w) wrap.style.setProperty('--w', `${spec.w}em`)
    itemsEl.appendChild(wrap)
    const vid = wrap.querySelector('video')
    if (vid) {
      wrap.addEventListener('pointerenter', () => vid.play().catch(() => {}))
      wrap.addEventListener('pointerleave', () => { if (!wrap.classList.contains('held')) vid.pause() })
    }
    const it = { spec, side, el: wrap, x: 0, y: 0, rot: 0, s: 1, tx: 0, z: 1, order: items.length, screen: 0, ...extra }
    items.push(it)
    bind(it)
    return it
  }

  function build(f) {
    itemsEl.replaceChildren()
    items = []
    f.left.forEach((s) => addItem(s, 'left', f))
    f.stack.forEach((s, i) => addItem(s, 'stack', f, { stackIndex: i }))
    f.extras.forEach((s) => addItem(s, 'extra', f))
  }

  /* ---- envelopes and bags tip their contents out across the desk ---- */
  function spill(box) {
    if (box.spilled) return
    box.spilled = true
    box.el.classList.add('opened')
    sfx.paper?.()
    const f = FOLDERS[current]
    const cx = box.x + box.el.offsetWidth / 2, cy = box.y + box.el.offsetHeight * 0.3
    const n = box.spec.contents.length
    box.spec.contents.forEach((c, i) => {
      const it = addItem(c, 'spilled', f)
      it.box = box
      const w = it.el.offsetWidth, h = it.el.offsetHeight
      Object.assign(it, { x: cx - w / 2, y: cy - h / 2, rot: 0, s: 0.4, z: ++Z })
      it.el.classList.add('tucked')
      place(it)
      later(60 + i * 70, () => {
        it.el.classList.remove('tucked')
        it.s = 1
        const phone = c.type === 'phone'
        const a = phone ? -0.4 : -Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * 2.6 : 0) + (Math.random() - 0.5) * 0.3
        const sp = phone ? 520 : 700 + Math.random() * 500
        it.rot = phone ? -4 : (Math.random() - 0.5) * 30
        fling(it, Math.cos(a) * sp, Math.sin(a) * sp * 0.8, () => { it.home = { x: it.x, y: it.y, rot: it.rot } })
      })
    })
  }
  function unspill(box) {
    const out = items.filter((it) => it.box === box)
    out.forEach((it, i) => {
      it.fling = false
      it.el.classList.add('anim', 'tucked')
      it.el.style.transitionDelay = `${i * 30}ms`
      Object.assign(it, { x: box.x + 40, y: box.y + 10, rot: 0, s: 0.4 })
      place(it)
    })
    later(700, () => {
      out.forEach((it) => it.el.remove())
      items = items.filter((it) => it.box !== box)
      box.spilled = false
      box.el.classList.remove('opened')
    })
  }

  /* ---- the phone: tap through the app while you hold it ---- */
  function showScreen(it, src, n) {
    it.screen = n
    const img = it.el.querySelector('.ph-screen img')
    img.classList.remove('swap'); void img.offsetWidth; img.classList.add('swap')
    img.src = src
    const hint = it.el.querySelector('.ph-hint')
    hint.textContent = n === Q ? 'tap an answer' : n === -1 ? 'tap to try again' : 'tap → · left edge ←'
  }
  function tapPhone(it, e) {
    const r = it.el.querySelector('.ph-screen img').getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height
    sfx.tap?.()
    if (it.screen === -1) return showScreen(it, SCREENS[Q], Q)
    if (it.screen === Q) {
      if (fy > 0.26 && fy < 0.33) return showScreen(it, WRONG, -1) // quaver
      if (fy > 0.35 && fy < 0.42) return showScreen(it, SCREENS[Q + 1], Q + 1) // crochet
      if (fx > 0.22) {
        const hint = it.el.querySelector('.ph-hint')
        hint.classList.add('nudge')
        setTimeout(() => hint.classList.remove('nudge'), 400)
        return
      }
    }
    const n = fx < 0.22 ? Math.max(0, it.screen - 1) : (it.screen + 1) % SCREENS.length
    showScreen(it, SCREENS[n], n)
  }

  /* ---- drag, throw, pick up ---- */
  function bind(it) {
    let st = null
    it.el.addEventListener('pointerdown', (e) => {
      if (!open || closing) return
      if (inspecting) {
        if (inspecting !== it) return
        const fig = e.target.closest('.c-grid figure')
        if (fig) { fig.classList.toggle('seen'); return }
        if (it.spec.type === 'phone' && e.target.closest('.ph-screen')) { tapPhone(it, e); return }
        if (e.target.closest('.visit')) { window.open(it.spec.visit.href, '_blank', 'noopener'); return }
        if (it.spec.type === 'recipe') { it.el.classList.toggle('flipped'); sfx.paper?.(); return }
        putDown()
        return
      }
      e.preventDefault()
      try { it.el.setPointerCapture(e.pointerId) } catch { /* synthetic or already-released pointer */ }
      it.el.classList.remove('anim')
      it.fling = false
      it.z = ++Z
      st = { sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 }
      it.el.classList.add('lift')
      place(it)
      sfx.paper?.()
    })
    it.el.addEventListener('pointermove', (e) => {
      if (!st) return
      const dx = e.clientX - st.sx, dy = e.clientY - st.sy
      if (!st.moved && Math.hypot(dx, dy) > 6) st.moved = true
      if (!st.moved) return
      const now = performance.now(), dt = Math.max(1, now - st.lt)
      st.vx = st.vx * 0.6 + ((e.clientX - st.lx) / dt) * 1000 * 0.4
      st.vy = st.vy * 0.6 + ((e.clientY - st.ly) / dt) * 1000 * 0.4
      st.lx = e.clientX; st.ly = e.clientY; st.lt = now
      it.x = st.ox + dx
      it.y = st.oy + dy
      const base = it.home?.rot ?? it.spec.rot ?? 0
      it.rot = base + Math.max(-14, Math.min(14, st.vx * 0.012))
      it.tx = Math.max(-12, Math.min(12, -st.vy * 0.01)) // the paper tips as it moves, like it has weight
      place(it)
    })
    const up = () => {
      if (!st) return
      const s = st
      st = null
      it.el.classList.remove('lift')
      if (!s.moved) {
        it.tx = 0
        if (it.spec.href) window.open(it.spec.href, '_blank', 'noopener')
        else if (it.spec.action) onAction?.(it.spec.action)
        else if (it.spec.contents) it.spilled ? pickUp(it) : spill(it)
        else pickUp(it)
        return
      }
      fling(it, s.vx, s.vy, () => { if (it.side === 'spilled') it.home = { x: it.x, y: it.y, rot: it.rot } })
    }
    it.el.addEventListener('pointerup', up)
    it.el.addEventListener('pointercancel', up)
  }

  function fling(it, vx, vy, done) {
    it.fling = true
    let last = performance.now()
    const spin = Math.max(-3, Math.min(3, vx * 0.0015)) // paper drifts round a little, it doesn't twirl
    const step = (now) => {
      if (!it.fling) return
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      it.x += vx * dt
      it.y += vy * dt
      const k = Math.pow(0.02, dt) // friction
      vx *= k; vy *= k
      it.rot += spin * k * dt * 20
      it.tx *= k
      const w = it.el.offsetWidth, h = it.el.offsetHeight
      const minX = -w * 0.4, maxX = innerWidth - w * 0.6, minY = 40 - h * 0.3, maxY = innerHeight - h * 0.5
      if (it.x < minX) { it.x = minX; vx = Math.abs(vx) * 0.4 }
      if (it.x > maxX) { it.x = maxX; vx = -Math.abs(vx) * 0.4 }
      if (it.y < minY) { it.y = minY; vy = Math.abs(vy) * 0.4 }
      if (it.y > maxY) { it.y = maxY; vy = -Math.abs(vy) * 0.4 }
      place(it)
      if (Math.hypot(vx, vy) > 12) requestAnimationFrame(step)
      else { it.fling = false; it.tx = 0; place(it); done?.() }
    }
    requestAnimationFrame(step)
  }

  function pickUp(it) {
    inspecting = it
    it.before = { x: it.x, y: it.y, rot: it.rot, s: it.s, z: it.z }
    const w = it.el.offsetWidth, h = it.el.offsetHeight
    const cap = it.spec.type === 'sticky' || it.spec.type === 'tag' || it.spec.type === 'note' ? 2.2 : 3.2
    const s = Math.min((innerWidth * 0.9) / w, (innerHeight * 0.84) / h, cap)
    it.el.classList.add('anim', 'held')
    Object.assign(it, { x: innerWidth / 2 - w / 2, y: innerHeight / 2 - h / 2 + 10, rot: 0, tx: 0, s, z: 1000 }) // above the dim (500)
    place(it)
    dim.classList.add('on')
    el.classList.add('inspecting')
    if (it.spec.type === 'phone') showScreen(it, it.screen >= 0 ? SCREENS[it.screen] : WRONG, it.screen)
    if (it.spec.type === 'recipe') setTimeout(() => it.el.classList.add('flipped'), 260)
    const v = it.el.querySelector('video')
    if (v) { v.muted = false; v.currentTime = 0; v.play().catch(() => { v.muted = true; v.play() }) }
    sfx.paper?.()
  }
  function putDown() {
    const it = inspecting
    if (!it) return
    inspecting = null
    it.el.classList.add('anim')
    it.el.classList.remove('held', 'flipped')
    Object.assign(it, it.before)
    it.z = ++Z
    place(it)
    dim.classList.remove('on')
    el.classList.remove('inspecting')
    const v = it.el.querySelector('video')
    if (v) { v.muted = true; v.pause() }
  }
  dim.addEventListener('click', putDown)

  function settle(stagger = true) {
    items.forEach((it, i) => {
      if (it.side === 'spilled') return
      const h = home(it)
      it.fling = false
      it.el.classList.add('anim')
      it.el.style.transitionDelay = stagger ? `${i * 45}ms` : '0ms'
      Object.assign(it, h, { s: 1, tx: 0 })
      place(it)
    })
    later(1000, () => items.forEach((it) => { it.el.style.transitionDelay = '0ms' }))
  }

  function tidy() {
    putDown()
    items.filter((it) => it.spec.contents && it.spilled).forEach(unspill)
    settle(false)
    sfx.paper?.()
  }

  function openFile(id) {
    const f = FOLDERS[id]
    if (!f) return
    timers.splice(0).forEach(clearTimeout)
    current = id
    closing = false
    open = false
    layout()
    el.style.setProperty('--folder', f.color)
    el.style.setProperty('--folder-in', f.inside)
    el.style.setProperty('--folder-ink', f.ink)
    el.querySelector('.desk-no').textContent = `file no. ${f.no} · ${f.title}`
    el.querySelector('.fold-tab').textContent = f.tab
    front.innerHTML = `
      <div class="label"><span>file no. ${f.no}</span><strong>${esc(f.title)}</strong></div>
      <div class="cover-stamp" style="--stamp:${f.stamp.color}">${esc(f.stamp.text)}</div>`
    build(f)
    // the papers wait inside the closed folder, out of sight
    items.forEach((it) => {
      const r = geo.right
      Object.assign(it, { x: r.x + r.w * 0.3, y: r.y + r.h * 0.3, rot: 0, s: 0.6, z: 1 })
      it.el.classList.remove('anim')
      it.el.classList.add('tucked')
      place(it)
    })
    el.hidden = false
    el.classList.remove('is-open', 'inspecting', 'leaving')
    fold.classList.remove('opened')
    fold.style.left = `${geo.closedLeft}px`
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show')
    sfx.whoosh?.()
    // 1. it lands closed. 2. it slides over to make room. 3. the cover swings over on its spine. 4. the papers settle
    later(700, () => { fold.style.left = `${geo.openLeft}px` })
    later(1200, () => { fold.classList.add('opened'); sfx.paper?.() })
    later(1850, () => {
      open = true
      el.classList.add('is-open')
      items.forEach((it) => it.el.classList.remove('tucked'))
      settle()
    })
  }

  function close() {
    if (!current || closing) return
    closing = true
    open = false
    timers.splice(0).forEach(clearTimeout)
    putDown()
    // everything goes back in, the cover shuts, the folder slides back and drops away
    items.forEach((it, i) => {
      const r = geo.right
      it.fling = false
      it.el.classList.add('anim', 'tucked')
      it.el.style.transitionDelay = `${i * 16}ms`
      Object.assign(it, { x: r.x + r.w * 0.25, y: r.y + r.h * 0.25, rot: 0, tx: 0, s: 0.7 })
      place(it)
    })
    sfx.paper?.()
    later(420, () => fold.classList.remove('opened'))
    later(1150, () => { fold.style.left = `${geo.closedLeft}px` })
    later(1500, () => el.classList.add('leaving'))
    later(1900, () => {
      el.hidden = true
      el.classList.remove('leaving', 'show', 'is-open')
      itemsEl.replaceChildren()
      items = []
      const id = current
      current = null
      onClose?.(id)
    })
  }

  el.querySelector('[data-close]').addEventListener('click', close)
  el.querySelector('[data-tidy]').addEventListener('click', tidy)
  addEventListener('keydown', (e) => {
    if (el.hidden || e.key !== 'Escape') return
    if (inspecting) putDown()
    else close()
  })
  addEventListener('resize', () => {
    if (el.hidden) return
    layout()
    fold.style.left = `${fold.classList.contains('opened') ? geo.openLeft : geo.closedLeft}px`
    if (open) settle(false)
  })

  return { open: openFile, close, get isOpen() { return !el.hidden } }
}
