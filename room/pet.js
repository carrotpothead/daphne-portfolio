/* ------------------------------------------------------------------ *
 *  The desktop pet: a small carrot that lives in its own little window.
 *  mountPet(win) builds everything inside `win`, so it runs the same
 *  in a Document Picture-in-Picture window (floats above every app in
 *  Chrome and Edge) or in an ordinary popup (Safari, Firefox).
 * ------------------------------------------------------------------ */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const V3 = THREE.Vector3
const C = { orange: '#f47b20', orangeDk: '#cc5510', leaf: '#45a852', leafDk: '#2d7c39', cobalt: '#2338d4', ink: '#1b1d22', root: '#f5a262', pink: '#ff8b8b' }
const LINES = {
  hello: ['hi! i’ll keep you company.', 'reporting for duty.', 'oh, a new desk. nice.'],
  poke: ['hey!', 'that tickles.', 'working hard?', 'eyes on your work.', 'i’m helping.', 'boop.'],
  nudge: ['drink some water.', 'shoulders down. breathe.', 'stretch?', 'you’re doing great.', 'blink. i’ll wait.', 'ship it.'],
}
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

class Spring {
  constructor(v = 0, k = 170, d = 14) { this.v = v; this.t = v; this.vel = 0; this.k = k; this.d = d }
  step(dt) { this.vel += (-this.k * (this.v - this.t) - this.d * this.vel) * dt; this.v += this.vel * dt; return this.v }
}

export function mountPet(win) {
  const doc = win.document
  doc.title = 'your carrot'
  const font = doc.createElement('link')
  font.rel = 'stylesheet'
  font.href = 'https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap'
  doc.head.appendChild(font)
  const style = doc.createElement('style')
  style.textContent = `
    html, body { margin: 0; height: 100%; overflow: hidden; background: #d6eee0; }
    canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
    .b { position: fixed; left: 50%; top: 10px; translate: -50% 0; max-width: 86%; padding: 7px 12px 8px; border-radius: 16px;
      background: #fffaf0; color: #26282d; font: 17px/1.1 'Gochi Hand', cursive; text-align: center;
      box-shadow: 0 8px 20px -8px rgba(10,30,22,.35); opacity: 0; transition: opacity .25s ease, translate .25s ease; pointer-events: none; }
    .b.on { opacity: 1; translate: -50% 4px; }`
  doc.head.appendChild(style)
  doc.body.replaceChildren()
  const canvas = doc.createElement('canvas')
  const bubble = doc.createElement('div')
  bubble.className = 'b'
  doc.body.append(canvas, bubble)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.NeutralToneMapping
  const scene = new THREE.Scene()
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.7
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe0cfae, 0.55))
  const sun = new THREE.DirectionalLight(0xfff3e2, 2.2)
  sun.position.set(-3, 6, 6)
  scene.add(sun)
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50)

  const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, ...o })

  /* ---- the carrot (same shape as the one in the room) ---- */
  const prof = new THREE.SplineCurve(
    [[0, 0], [0.06, 0.04], [0.19, 0.19], [0.33, 0.41], [0.45, 0.68], [0.53, 0.95], [0.565, 1.17], [0.545, 1.34], [0.45, 1.47], [0.26, 1.55], [0, 1.575]]
      .map(([r, y]) => new THREE.Vector2(r, y)),
  ).getPoints(80).map((p) => new THREE.Vector2(Math.max(p.x, 0), p.y))
  const radiusAt = (y) => { for (let i = 0; i < prof.length - 1; i++) { const a = prof[i], b = prof[i + 1]; if (y >= a.y && y <= b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1) } return 0 }
  const surf = (y, th, lift = 0) => { const r = radiusAt(y) + lift; return new V3(Math.sin(th) * r, y, Math.cos(th) * r) }

  const pet = new THREE.Group()
  scene.add(pet)
  const torso = new THREE.Group()
  torso.position.y = 0.34
  pet.add(torso)
  {
    const g = new THREE.LatheGeometry(prof, 96, Math.PI, Math.PI * 2)
    const pos = g.attributes.position, col = [], cA = new THREE.Color(C.orange), cB = new THREE.Color(C.orangeDk), tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), th = Math.atan2(x, z)
      const band = smooth(0.08, 0.35, y) * (1 - smooth(1.22, 1.44, y)), ring = Math.sin(y * 33 + Math.sin(th * 3) * 0.7)
      const k = 1 + band * 0.011 * ring
      pos.setXYZ(i, x * k, y, z * k)
      tmp.copy(cA).lerp(cB, band * (0.5 - 0.5 * ring) * 0.45 + (1 - smooth(0, 0.45, y)) * 0.3)
      col.push(tmp.r, tmp.g, tmp.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    g.computeVertexNormals()
    torso.add(new THREE.Mesh(g, mat('#ffffff', { vertexColors: true, roughness: 0.48 })))
  }
  const eyes = [-1, 1].map((side) => {
    const e = new THREE.Group()
    e.position.copy(surf(1.13, side * 0.29, -0.025))
    e.rotation.y = side * 0.29
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 20), mat('#ffffff', { roughness: 0.16, clearcoat: 1 }))
    w.scale.z = 0.62
    const cap = new THREE.SphereGeometry(0.1412, 32, 10, 0, Math.PI * 2, 0, 0.49)
    cap.rotateX(Math.PI / 2)
    const wrap = new THREE.Group(); wrap.scale.z = 0.62
    const pupil = new THREE.Group(); pupil.rotation.order = 'YXZ'
    pupil.add(new THREE.Mesh(cap, mat(C.ink, { roughness: 0.18, clearcoat: 1 })))
    wrap.add(pupil)
    const lidWrap = new THREE.Group(); lidWrap.scale.z = 0.66
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.orange, { roughness: 0.45, side: THREE.DoubleSide }))
    lidWrap.add(lid)
    e.add(w, wrap, lidWrap)
    torso.add(e)
    return { pupil, lid }
  })
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.11, 6, 12), mat(C.leafDk, { roughness: 0.5 }))
    brow.position.copy(surf(1.34, side * 0.3, 0.005))
    brow.rotation.set(0, side * 0.3, Math.PI / 2)
    const ck = new THREE.Mesh(new THREE.SphereGeometry(0.078, 16, 12), mat(C.pink, { roughness: 0.6, clearcoat: 0, transparent: true, opacity: 0.7 }))
    ck.position.copy(surf(0.985, side * 0.62, -0.012)); ck.rotation.y = side * 0.62; ck.scale.set(1, 0.62, 0.22)
    torso.add(brow, ck)
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.016, 12, 32, Math.PI), mat('#5b1c0c', { roughness: 0.4 }))
  smile.position.copy(surf(0.955, 0, -0.004)); smile.rotation.z = Math.PI
  torso.add(smile)
  // the top: tie, bun, leaves
  const top = new THREE.Group()
  top.position.y = 1.54
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.034, 14, 36), mat(C.cobalt, { roughness: 0.35, clearcoat: 0.6 }))
  tie.rotation.x = Math.PI / 2; tie.position.y = 0.05
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.155, 28, 18), mat(C.leaf, { roughness: 0.5 }))
  bun.scale.set(1, 0.82, 1); bun.position.y = 0.19
  top.add(tie, bun)
  const leafGeo = new THREE.SphereGeometry(1, 20, 12); leafGeo.scale(0.07, 0.3, 0.028); leafGeo.translate(0, 0.3, 0)
  const leaves = []
  for (let i = 0; i < 7; i++) {
    const piv = new THREE.Group(); piv.position.y = 0.22; piv.rotation.y = (i / 7) * Math.PI * 2 + 0.3
    const tl = new THREE.Group(); tl.rotation.z = -(0.32 + 0.3 * (i % 2))
    tl.add(new THREE.Mesh(leafGeo, mat(i % 2 ? C.leafDk : C.leaf, { roughness: 0.5 })))
    piv.add(tl); top.add(piv)
    leaves.push({ tl, base: tl.rotation.z, ph: i * 1.7 })
  }
  torso.add(top)
  // root arms and legs, bean feet
  const rootMat = mat(C.root, { roughness: 0.55, clearcoat: 0.15 })
  const tube = (pts, r) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, r, 8), rootMat)
  const arms = [-1, 1].map((s) => {
    const sh = surf(0.74, s * 1.3, -0.03)
    const m = tube([sh, sh.clone().add(new V3(s * 0.09, -0.2, 0.07)), sh.clone().add(new V3(s * 0.1, -0.44, 0.16))], 0.026)
    torso.add(m)
    return m
  })
  for (const s of [-1, 1]) {
    pet.add(tube([new V3(s * 0.07, 0.6, 0), new V3(s * 0.12, 0.21, 0.02), new V3(s * 0.16, 0.06, 0.06)], 0.033))
    const bean = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.1, 8, 16), rootMat)
    bean.rotation.x = Math.PI / 2; bean.scale.z = 0.7; bean.position.set(s * 0.16, 0.035, 0.11)
    pet.add(bean)
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ color: 0x0c2c20, transparent: true, opacity: 0.12 }))
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.2, 0.7, 1); shadow.position.y = 0.002
  pet.add(shadow)

  /* ---- behaviour ---- */
  const gaze = { x: new Spring(0, 220, 11), y: new Spring(0, 220, 11) }
  const squash = new Spring(0, 240, 9)
  const lidA = new Spring(-1.25, 320, 22)
  let pointer = null, lastInput = performance.now(), asleep = false, nextBlink = 1.5, blinkT = -1, t = 0
  let bubbleTimer = 0, nextNudge = 60 * 20
  const say = (text, ms = 2200) => {
    bubble.textContent = text
    bubble.classList.add('on')
    win.clearTimeout(bubbleTimer)
    bubbleTimer = win.setTimeout(() => bubble.classList.remove('on'), ms)
  }
  const wake = () => { lastInput = performance.now(); if (asleep) { asleep = false; squash.vel += 5; say('i was awake.') } }
  win.addEventListener('pointermove', (e) => { pointer = { x: (e.clientX / win.innerWidth) * 2 - 1, y: -(e.clientY / win.innerHeight) * 2 + 1 }; wake() })
  doc.addEventListener('pointerleave', () => { pointer = null })
  canvas.addEventListener('click', () => { wake(); squash.vel += 6; gaze.y.vel += 2; say(pick(LINES.poke), 1600) })

  function resize() {
    const w = win.innerWidth, h = win.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const f = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const dist = Math.max(3.5 / 2 / f, 1.9 / 2 / (f * camera.aspect))
    camera.position.set(0, 1.35 + dist * 0.12, dist)
    camera.lookAt(0, 1.3, 0)
    camera.updateProjectionMatrix()
  }
  win.addEventListener('resize', resize)
  resize()

  let last = performance.now()
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    t += dt
    // breathe and squash
    const sq = squash.step(dt), br = Math.sin(t * 2.1) * 0.012
    torso.scale.set(1 + sq * 0.55 - br * 0.4, 1 - sq + br, 1 + sq * 0.55 - br * 0.4)
    for (const l of leaves) l.tl.rotation.z = l.base + Math.sin(t * 1.6 + l.ph) * 0.05 - sq * 0.5
    // look at the pointer, or wander when it's outside the window
    const tx = pointer ? pointer.x : Math.sin(t * 0.4) * 0.8
    const ty = pointer ? pointer.y : Math.sin(t * 0.27) * 0.3
    pet.rotation.y += ((pointer ? pointer.x * 0.35 : 0) - pet.rotation.y) * (1 - Math.exp(-4 * dt))
    gaze.x.t = tx * 0.05; gaze.y.t = ty * 0.045
    const ox = gaze.x.step(dt), oy = gaze.y.step(dt)
    for (const e of eyes) e.pupil.rotation.set(-Math.asin(Math.max(-0.9, Math.min(0.9, oy / 0.14))), Math.asin(Math.max(-0.9, Math.min(0.9, ox / 0.14))), 0)
    // blink, nap after a quiet minute and a half
    if (!asleep && performance.now() - lastInput > 90000) { asleep = true; say('zzz', 999999) }
    if (t > nextBlink && !asleep) { blinkT = 0; nextBlink = t + 2.4 + Math.random() * 3 }
    if (blinkT >= 0) { blinkT += dt; if (blinkT > 0.12) blinkT = -1 }
    lidA.t = blinkT >= 0 ? 1.5 : asleep ? 0.1 : -1.25
    const la = lidA.step(dt)
    for (const e of eyes) e.lid.rotation.x = la
    // every twenty minutes, a gentle nudge
    if (t > nextNudge && !asleep) { nextNudge = t + 60 * 20; squash.vel += 3; say(pick(LINES.nudge), 3500) }
    arms[1].rotation.z = Math.sin(t * 1.3) * 0.03
    renderer.render(scene, camera)
    win.requestAnimationFrame(frame)
  }
  win.requestAnimationFrame(frame)
  win.setTimeout(() => { squash.vel += 5; say(pick(LINES.hello), 2600) }, 700)
}
