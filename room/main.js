import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createDesk } from './desk.js'
import { mountPet } from './pet.js'

/* ------------------------------------------------------------------ *
 *  Carrot room, step 1
 *  One carrot, one locked cabinet. Everything is built from code:
 *  no models, no textures beyond canvas-drawn labels and glints.
 * ------------------------------------------------------------------ */

const $ = (s) => document.querySelector(s)
const V3 = THREE.Vector3
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt))

const C = {
  ink: '#1b1d22', cream: '#f7f3ea',
  cobalt: '#2338d4', cobaltHi: '#3551ee',
  orange: '#f47b20', orangeDk: '#cc5510',
  leaf: '#45a852', leafDk: '#2d7c39',
  denim: '#a9c3e6', pink: '#ff8b8b', brass: '#e2ae2c', chrome: '#dadfe8',
  bandOrange: '#c2410c', bandPurple: '#6d28d9',
}
const BG_LIT = new THREE.Color('#d6eee0') // mint, lights on
const BG_DARK = new THREE.Color('#2b3e37') // the room before the lights come on
const state = { font: 'Gochi Hand', sound: true }

/* ---------------- springs ---------------- */
class Spring {
  constructor(v = 0, k = 170, d = 14) { this.v = v; this.t = v; this.vel = 0; this.k = k; this.d = d }
  step(dt) { this.vel += (-this.k * (this.v - this.t) - this.d * this.vel) * dt; this.v += this.vel * dt; return this.v }
}

/* ---------------- renderer / scene ---------------- */
const canvas = $('#c')
// ?render=walk: export the carrot as frames for the dock pet (carroto). see renderPose() near the end.
const RENDER = new URLSearchParams(location.search).get('render')
// /meadow (or ?world=meadow): carroto's grass world. ?stage=1..4 shows how it was built, for filming.
const WORLD = location.pathname.startsWith('/meadow') ? 'meadow' : new URLSearchParams(location.search).get('world')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!RENDER, preserveDrawingBuffer: !!RENDER })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.NeutralToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

const scene = new THREE.Scene()
scene.background = BG_DARK.clone()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = 0.7

const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100)
const camTarget = new V3()
let camDist = 12

scene.add(new THREE.HemisphereLight(0xffffff, 0xe0cfae, 0.55))
const sun = new THREE.DirectionalLight(0xfff3e2, 2.3)
sun.position.set(-3.5, 7, 6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -2, near: 1, far: 22 })
sun.shadow.radius = 5
sun.shadow.blurSamples = 16
sun.shadow.bias = -0.0005
sun.shadow.normalBias = 0.02
scene.add(sun)
const rim = new THREE.DirectionalLight(0xe4ebff, 0.9)
rim.position.set(4, 3, -4)
scene.add(rim)
const hemi = scene.children.find((o) => o.isHemisphereLight)

// before the lights come on: one warm spot on the carrot, everything else in shadow
const spot = new THREE.SpotLight(0xfff0dc, 3.2, 0, 0.3, 0.75, 0)
spot.position.set(-2.1, 6.5, 4.2)
spot.castShadow = true
spot.shadow.mapSize.set(1024, 1024)
spot.shadow.radius = 5
spot.shadow.bias = -0.0005
scene.add(spot, spot.target)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.ShadowMaterial({ opacity: 0.16, color: 0x10352a }),
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

/* ---------------- helpers ---------------- */
const mat = (color, o = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, ...o })

function mesh(geo, material, { cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material)
  m.castShadow = cast
  m.receiveShadow = receive
  return m
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// soft contact shadow so objects sit on the flat ground instead of floating
const BLOB = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(12,44,32,0.5)')
  gr.addColorStop(1, 'rgba(12,44,32,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
})
function contact(w, d) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, toneMapped: false }),
  )
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.003
  return m
}

const STAR = canvasTex(128, 128, (g) => {
  g.translate(64, 64)
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(-64, -64, 128, 128)
  g.fillStyle = '#fff'
  for (let i = 0; i < 4; i++) {
    g.rotate(Math.PI / 2)
    g.beginPath(); g.moveTo(-5, 0); g.lineTo(0, -60); g.lineTo(5, 0); g.fill()
  }
})
function glint(size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }))
  s.scale.setScalar(size)
  s.renderOrder = 5
  return s
}

/* ================================================================== *
 *  CARROT
 * ================================================================== */
const BY = 0.34 // tip height above the ground; the legs live under it

const profile = new THREE.SplineCurve(
  [[0, 0], [0.06, 0.04], [0.19, 0.19], [0.33, 0.41], [0.45, 0.68], [0.53, 0.95], [0.565, 1.17], [0.545, 1.34], [0.45, 1.47], [0.26, 1.55], [0, 1.575]]
    .map(([r, y]) => new THREE.Vector2(r, y)),
)
const prof = profile.getPoints(100).map((p) => new THREE.Vector2(Math.max(p.x, 0), p.y))
function radiusAt(y) {
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i], b = prof[i + 1]
    if (y >= a.y && y <= b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1)
  }
  return 0
}
// a point on the carrot surface: height y, angle th around the front (0 = facing camera)
function surf(y, th, lift = 0) {
  const r = radiusAt(y) + lift
  return new V3(Math.sin(th) * r, y, Math.cos(th) * r)
}

function carrotBodyGeo() {
  // seam at the back (phiStart = PI) so it never faces the camera
  const g = new THREE.LatheGeometry(prof, 112, Math.PI, Math.PI * 2)
  const pos = g.attributes.position
  const cA = new THREE.Color(C.orange), cB = new THREE.Color(C.orangeDk), tmp = new THREE.Color()
  const col = []
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const th = Math.atan2(x, z)
    const band = smooth(0.08, 0.35, y) * (1 - smooth(1.22, 1.44, y))
    // soft horizontal growth rings, slightly wavy, like a real carrot but toy-clean
    const ring = Math.sin(y * 33 + Math.sin(th * 3) * 0.7)
    const k = 1 + band * (0.011 * ring + 0.006 * Math.sin(th * 5 + y * 4))
    pos.setXYZ(i, x * k, y, z * k)
    tmp.copy(cA).lerp(cB, band * (0.5 - 0.5 * ring) * 0.45 + (1 - smooth(0, 0.45, y)) * 0.3)
    col.push(tmp.r, tmp.g, tmp.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

const HOME = new V3(-1.15, 0, 0.1) // his spot next to fernando
const carrot = new THREE.Group()
carrot.position.copy(HOME)
carrot.scale.setScalar(0.001)
scene.add(carrot)
carrot.add(contact(1.05, 0.7))

const torso = new THREE.Group()
torso.position.y = BY
carrot.add(torso)

const skin = mat('#ffffff', { vertexColors: true, roughness: 0.48, clearcoat: 0.28 })
const body = mesh(carrotBodyGeo(), skin)
body.userData.tag = 'carrot'
torso.add(body)

// googly eyes: glossy whites, pupils on a loose spring, orange lids for blinks and moods
const lidMat = mat(C.orange, { roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide })
const eyes = [-1, 1].map((side) => {
  const th = side * 0.29
  const g = new THREE.Group()
  g.position.copy(surf(1.13, th, -0.025))
  g.rotation.y = th
  const white = mesh(new THREE.SphereGeometry(0.14, 48, 32), mat('#ffffff', { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 }))
  white.scale.z = 0.62
  const capGeo = new THREE.SphereGeometry(0.1412, 44, 12, 0, Math.PI * 2, 0, 0.49)
  capGeo.rotateX(Math.PI / 2)
  const pupilWrap = new THREE.Group()
  pupilWrap.scale.z = 0.62
  const pupil = new THREE.Group()
  pupil.rotation.order = 'YXZ'
  pupil.add(mesh(capGeo, mat(C.ink, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }), { cast: false }))
  pupilWrap.add(pupil)
  const lidWrap = new THREE.Group()
  lidWrap.scale.z = 0.66
  const lid = mesh(new THREE.SphereGeometry(0.15, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidMat, { cast: false })
  lidWrap.add(lid)
  g.add(white, pupilWrap, lidWrap)
  torso.add(g)
  return { side, g, pupil, lid }
})

const gaze = { x: new Spring(0, 240, 11), y: new Spring(0, 240, 11) }
const eyeMid = surf(1.13, 0, -0.025)

// agent carroto (the dock colleague) wears round cobalt glasses; ?glasses=1 on the render page.
// The carrot on the site doesn't.
const GLASSES = new URLSearchParams(location.search).has('glasses')
if (GLASSES) {
  const frameMat = mat(C.cobalt, { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 })
  const lensMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14 }) // a faint glint, cheap to render
  const ringAt = []
  for (const e of eyes) {
    const th = e.side * 0.29
    const g = new THREE.Group()
    g.position.copy(surf(1.13, th, 0.075))
    g.rotation.y = th
    g.add(mesh(new THREE.TorusGeometry(0.168, 0.024, 16, 48), frameMat))
    const lens = mesh(new THREE.CircleGeometry(0.16, 40), lensMat, { cast: false })
    lens.position.z = 0.004
    g.add(lens)
    // arm back toward where his ear would be
    const arm = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 10), frameMat)
    arm.rotation.x = Math.PI / 2
    arm.position.set(e.side * 0.17, 0.02, -0.2)
    arm.rotation.y = -e.side * 0.35
    g.add(arm)
    torso.add(g)
    ringAt.push(g.position.clone())
  }
  // the bridge between the lenses
  const mid = ringAt[0].clone().lerp(ringAt[1], 0.5)
  const bridge = mesh(new THREE.TorusGeometry(0.06, 0.018, 10, 24, Math.PI), frameMat)
  bridge.position.copy(mid).add(new V3(0, 0.02, 0.02))
  torso.add(bridge)
}

const browMat = mat(C.leafDk, { roughness: 0.5 })
const brows = [-1, 1].map((side) => {
  const m = mesh(new THREE.CapsuleGeometry(0.021, 0.11, 6, 14), browMat)
  const base = surf(1.34, side * 0.3, 0.005)
  m.position.copy(base)
  m.rotation.set(0, side * 0.3, Math.PI / 2)
  torso.add(m)
  return { side, m, base, lift: new Spring(0, 200, 16), tilt: new Spring(0, 200, 16) }
})

const mouthMat = mat('#5b1c0c', { roughness: 0.4, clearcoat: 0.6 })
const smile = mesh(new THREE.TorusGeometry(0.058, 0.016, 12, 36, Math.PI), mouthMat, { cast: false })
smile.position.copy(surf(0.955, 0, -0.004))
smile.rotation.z = Math.PI
const oMouth = mesh(new THREE.SphereGeometry(0.052, 24, 16), mouthMat, { cast: false })
oMouth.scale.set(0.9, 1.1, 0.4)
oMouth.position.copy(surf(0.94, 0, -0.01))
oMouth.visible = false
torso.add(smile, oMouth)
const mouthPop = new Spring(1, 300, 14)

const cheekMat = mat(C.pink, { roughness: 0.6, clearcoat: 0, transparent: true, opacity: 0.7 })
const freckMat = mat('#a8440f', { roughness: 0.6, clearcoat: 0 })
for (const side of [-1, 1]) {
  const ck = mesh(new THREE.SphereGeometry(0.078, 24, 16), cheekMat, { cast: false })
  ck.position.copy(surf(0.985, side * 0.62, -0.012))
  ck.rotation.y = side * 0.62
  ck.scale.set(1, 0.62, 0.22)
  torso.add(ck)
  for (const [dy, dth] of [[0.05, 0.04], [0.035, -0.09], [0.075, -0.03]]) {
    const f = mesh(new THREE.SphereGeometry(0.011, 10, 8), freckMat, { cast: false })
    f.position.copy(surf(0.985 + dy, side * (0.62 + dth), -0.002))
    torso.add(f)
  }
}

// the leafy top, tied up like a messy bun
const top = new THREE.Group()
top.position.y = 1.54
torso.add(top)
const tie = mesh(new THREE.TorusGeometry(0.1, 0.034, 16, 44), mat(C.cobalt, { roughness: 0.35, clearcoat: 0.6 }))
tie.rotation.x = Math.PI / 2
tie.position.y = 0.05
const bun = mesh(new THREE.SphereGeometry(0.155, 36, 24), mat(C.leaf, { roughness: 0.5 }))
bun.scale.set(1, 0.82, 1)
bun.position.y = 0.19
top.add(tie, bun)
const leafGeo = new THREE.SphereGeometry(1, 28, 16)
leafGeo.scale(0.07, 0.3, 0.028)
leafGeo.translate(0, 0.3, 0)
const leaves = []
const leafMats = [mat(C.leaf, { roughness: 0.5 }), mat(C.leafDk, { roughness: 0.5 })]
for (let i = 0; i < 7; i++) {
  const piv = new THREE.Group()
  piv.position.y = 0.22
  piv.rotation.y = (i / 7) * Math.PI * 2 + 0.3
  const tilt = new THREE.Group()
  tilt.rotation.z = -(0.32 + 0.3 * (i % 2))
  const blade = mesh(leafGeo, leafMats[i % 2])
  blade.scale.setScalar(0.85 + 0.25 * ((i * 37) % 3) / 2)
  tilt.add(blade)
  piv.add(tilt)
  top.add(piv)
  leaves.push({ tilt, base: tilt.rotation.z, ph: i * 1.7 })
}
// two stray strands escaping the bun
for (const side of [-1, 1]) {
  const curve = new THREE.CatmullRomCurve3([
    new V3(side * 0.07, 0.12, 0.08), new V3(side * 0.17, 0.08, 0.15), new V3(side * 0.22, -0.02, 0.2),
  ])
  top.add(mesh(new THREE.TubeGeometry(curve, 20, 0.009, 8), leafMats[1]))
}

/* roots: tapered tubes, rewritten in place every frame so they can sway and follow through */
function taperTube(geo, pts, r0, r1, segs = 20, radial = 9) {
  const curve = new THREE.CatmullRomCurve3(pts)
  const frames = curve.computeFrenetFrames(segs, false)
  const n = (segs + 1) * (radial + 1)
  if (!geo.attributes.position) {
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    const idx = []
    for (let i = 0; i < segs; i++)
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j
        idx.push(a, b, a + 1, b, b + 1, a + 1)
      }
    geo.setIndex(idx)
  }
  const P = geo.attributes.position.array, N = geo.attributes.normal.array
  const c = new V3(), nv = new V3()
  for (let i = 0; i <= segs; i++) {
    const u = i / segs
    curve.getPointAt(u, c)
    const r = r0 + (r1 - r0) * Math.pow(u, 0.8)
    const fn = frames.normals[i], fb = frames.binormals[i]
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2, sn = Math.sin(v), cs = -Math.cos(v)
      nv.set(cs * fn.x + sn * fb.x, cs * fn.y + sn * fb.y, cs * fn.z + sn * fb.z).normalize()
      const k = (i * (radial + 1) + j) * 3
      P[k] = c.x + r * nv.x; P[k + 1] = c.y + r * nv.y; P[k + 2] = c.z + r * nv.z
      N[k] = nv.x; N[k + 1] = nv.y; N[k + 2] = nv.z
    }
  }
  geo.attributes.position.needsUpdate = true
  geo.attributes.normal.needsUpdate = true
  geo.computeBoundingSphere()
  return geo
}
const inkMat = mat(C.ink, { roughness: 0.45, clearcoat: 0.2 })
const rootMat = mat('#f5a262', { roughness: 0.55, clearcoat: 0.15 })
const rootDk = mat('#e0853f', { roughness: 0.6, clearcoat: 0.1 })

// three little rootlets splay out from the end of every limb
function rootlets(parent, count, material) {
  return Array.from({ length: count }, () => {
    const m = mesh(new THREE.BufferGeometry(), material)
    parent.add(m)
    return m
  })
}
function drawRootlets(list, base, dir, side, spread, len, wig, r0 = 0.016) {
  const up = Math.abs(dir.y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0)
  const ax = new V3().crossVectors(dir, up).normalize()
  list.forEach((m, i) => {
    const a = (i - (list.length - 1) / 2) * spread + Math.sin(t * 3.1 + i * 2 + side) * wig
    const d = dir.clone().applyAxisAngle(ax, a).normalize()
    const curl = new V3().crossVectors(d, ax).multiplyScalar(0.25 * side)
    const l = len * (i === 1 ? 1.15 : 0.9)
    const p1 = base.clone().addScaledVector(d, l * 0.55)
    const p2 = base.clone().addScaledVector(d, l).addScaledVector(curl, l * 0.35)
    taperTube(m.geometry, [base, p1, p2], r0, 0.003, 8, 7)
  })
}

// legs: two roots down to the ground, each ending in toes that spread on the floor
const legs = [-1, 1].map((side) => {
  const m = mesh(new THREE.BufferGeometry(), rootMat)
  carrot.add(m)
  const foot = new THREE.Group()
  foot.position.set(side * 0.16, 0, 0.05)
  foot.rotation.y = side * -0.18
  const bean = mesh(new THREE.CapsuleGeometry(0.05, 0.1, 10, 24), rootMat)
  bean.rotation.x = Math.PI / 2
  bean.scale.z = 0.7
  bean.position.set(0, 0.035, 0.06)
  foot.add(bean)
  carrot.add(foot)
  return { side, m, foot, lift: 0, swing: 0 }
})
function updateLegs() {
  for (const L of legs) {
    const s = L.side
    const sway = reduce ? 0 : Math.sin(t * 1.7 + s) * 0.004
    const out = L.out || 0
    const ankle = new V3(s * 0.16 + out, 0.06 + L.lift, 0.06 + L.swing)
    const knee = new V3(s * 0.155 + out * 0.5 + (L.knee || 0), 0.15 + L.lift * 0.7, 0.05 + L.swing * 0.8)
    const pts = [new V3(s * 0.07, BY + 0.26, 0), new V3(s * 0.12 + sway + (L.knee || 0) * 0.6, BY * 0.62, 0.02 + L.swing * 0.4), knee, ankle]
    taperTube(L.m.geometry, pts, 0.036, 0.03, 16, 9)
    L.foot.position.set(s * 0.16 + out, L.lift, 0.05 + L.swing)
  }
}

// arms: roots with an elbow and a hand that lag behind the pose, plus a wave travelling to the tip
const arms = [-1, 1].map((side) => {
  const sh = surf(0.74, side * 1.3, -0.03)
  const m = mesh(new THREE.BufferGeometry(), rootMat)
  torso.add(m)
  return { side, sh, m, fingers: rootlets(torso, 3, rootMat), elbow: sh.clone(), hand: sh.clone(), pose: 'rest' }
})
const POSES = {
  rest: (s, sh) => [sh.clone().add(new V3(s * 0.09, -0.2, 0.07)), sh.clone().add(new V3(s * 0.1, -0.44, 0.16))],
  behind: (s, sh) => [sh.clone().add(new V3(s * 0.1, -0.2, -0.14)), sh.clone().add(new V3(s * 0.02, -0.34, -0.4))],
  stretch: (s, sh) => [sh.clone().add(new V3(s * 0.26, 0.22, 0.06)), sh.clone().add(new V3(s * 0.4, 0.6, 0.1))],
  hips: (s, sh) => [sh.clone().add(new V3(s * 0.22, -0.02, -0.02)), sh.clone().add(new V3(s * 0.05, -0.2, 0.1))],
  pat: (s, sh) => [sh.clone().add(new V3(s * 0.2, -0.2, 0.16)), new V3(s * 0.27, 0.62, 0.4)],
  point: (s, sh) => [sh.clone().add(new V3(s * 0.25, 0.06, 0.14)), sh.clone().add(new V3(s * 0.52, 0.16, 0.26))],
  wave: (s, sh) => [sh.clone().add(new V3(s * 0.2, 0.15, 0.06)), sh.clone().add(new V3(s * 0.25, 0.45, 0.12))],
  whisper: (s, sh) => [sh.clone().add(new V3(s * 0.1, -0.16, 0.3)), new V3(s * 0.19, 0.94, 0.6)],
  tap: () => [
    torso.worldToLocal(cab.localToWorld(new V3(-CW / 2 - 0.2, 1.08, CD / 2 - 0.1))),
    torso.worldToLocal(cab.localToWorld(new V3(-CW / 2 - 0.03, 1.2, CD / 2 - 0.22))),
  ],
}
Object.assign(POSES, {
  // hands out low to the sides, palms trailing over the grass tips (the meadow)
  brush: (s, sh) => {
    const sway = Math.sin(t * 1.4 + s * 1.3) * 0.05
    return [sh.clone().add(new V3(s * 0.3, -0.2, 0.02)), new V3(s * (0.78 + sway * 0.4), 0.4 + sway, 0.12 - (MEADOW.speed || 0) * 0.18)]
  },
  namaste: (s, sh) => [sh.clone().add(new V3(s * 0.16, -0.08, 0.3)), new V3(s * 0.05, 0.9, 0.66)],
  yogaUp: (s, sh) => [sh.clone().add(new V3(s * 0.2, 0.3, 0.06)), new V3(s * 0.46, 1.78, 0.16)],
  wide: (s, sh) => [sh.clone().add(new V3(s * 0.3, 0.04, 0.02)), sh.clone().add(new V3(s * 0.62, 0.08, 0.04))],
  // can held up high so it pours from above fernando's leaves, not through them
  walk: (s, sh) => {
    const k = Math.sin(REC.phase + (s > 0 ? Math.PI : 0)) * REC.speed
    return [sh.clone().add(new V3(s * 0.09, -0.2, 0.07 + k * 0.05)), sh.clone().add(new V3(s * 0.1, -0.42, 0.16 + k * 0.16))]
  },
  // watch party: bucket held in front at the belly; the other hand goes bucket -> mouth (REC.munch 0..1)
  bucket: (s, sh) => [sh.clone().add(new V3(s * 0.3, -0.18, 0.02)), new V3(s * 0.66, 0.5, 0.12)],  // out at his side, visible from behind
  munch: (s, sh) => {
    const m = REC.munch ?? 0
    return [sh.clone().add(new V3(s * 0.3, -0.12 + m * 0.2, 0.18)), new V3(s * (0.6 - m * 0.42), 0.58 + m * 0.4, 0.3 + m * 0.3)]
  },
  // typing on the laptop: hands on the keys, bobbing in turn (REC.type is the clip time)
  type: (s, sh) => {
    const tap = Math.max(0, Math.sin((REC.type ?? 0) * Math.PI * 4 + (s > 0 ? 0 : Math.PI))) * 0.035
    return [sh.clone().add(new V3(s * 0.2, -0.22, 0.26)), new V3(s * 0.2, 0.46 + tap, 0.72)]
  },
  // bento held at the belly, onigiri raised to the mouth for each bite
  bento: (s, sh) => [sh.clone().add(new V3(s * 0.2, -0.2, 0.22)), new V3(s * 0.3, 0.55, 0.6)],
  bite: (s, sh) => {
    const b = REC.bite ?? 0
    return [sh.clone().add(new V3(s * 0.2, -0.1 + b * 0.1, 0.25)), new V3(s * (0.34 - b * 0.22), 0.66 + b * 0.28, 0.6 + b * 0.04)]
  },
  // holding something up at chest height, off to the side, to look at it
  clock: (s, sh) => [sh.clone().add(new V3(s * 0.24, 0.02, 0.24)), new V3(s * 0.42, 1.02, 0.62)],
  pour: (s, sh) => [sh.clone().add(new V3(s * 0.22, 0.08, 0.26)), new V3(s * 0.24, 1.04, 0.74)],
})
function pose(left, right = left) {
  arms[0].pose = left
  arms[1].pose = right
}

// the key glints inside the belly now and then
const GLOW = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,236,170,0.95)')
  gr.addColorStop(0.35, 'rgba(255,196,90,0.45)')
  gr.addColorStop(1, 'rgba(255,170,60,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
})
const bellyGlint = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }))
bellyGlint.scale.setScalar(0.34)
bellyGlint.renderOrder = 6
bellyGlint.position.copy(surf(0.66, 0.2, 0.07))

spot.target.position.set(carrot.position.x, 0.9, carrot.position.z)
const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 2.2),
  new THREE.MeshBasicMaterial({
    map: canvasTex(256, 256, (g) => {
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128)
      gr.addColorStop(0, 'rgba(255,244,222,0.34)')
      gr.addColorStop(0.55, 'rgba(255,244,222,0.12)')
      gr.addColorStop(1, 'rgba(255,244,222,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, 256, 256)
    }),
    transparent: true, depthWrite: false, toneMapped: false,
  }),
)
pool.rotation.x = -Math.PI / 2
pool.position.set(carrot.position.x, 0.002, carrot.position.z + 0.15)
scene.add(pool)

const carrotPop = new Spring(0, 90, 9)
const lean = new Spring(0, 80, 12)
const squash = new Spring(0, 240, 9)
const lidAngle = new Spring(-1.25, 320, 22)

/* ================================================================== *
 *  CABINET
 * ================================================================== */
const cab = new THREE.Group()
cab.position.set(1.3, 4, -0.05)
scene.add(cab)
cab.add(contact(2.3, 1.9))
const CW = 1.46, CH = 2.3, CD = 1.15, FEET = 0.07

const cabBody = mesh(new RoundedBoxGeometry(CW, CH, CD, 6, 0.1), mat(C.cobalt, { roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.25 }), { receive: true })
cabBody.position.y = FEET + CH / 2
cab.add(cabBody)
for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
  const f = mesh(new THREE.CylinderGeometry(0.05, 0.06, FEET, 16), inkMat)
  f.position.set(x * (CW / 2 - 0.14), FEET / 2, z * (CD / 2 - 0.14))
  cab.add(f)
}

const faceMat = mat(C.cobaltHi, { roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 })
const creamMat = mat(C.cream, { roughness: 0.3, clearcoat: 0.7 })
const chromeMat = mat(C.chrome, { metalness: 1, roughness: 0.22, clearcoat: 0 })
const keyholeMat = mat('#0c0d10', { roughness: 0.6, clearcoat: 0 })

function labelDraw(text) {
  return (g, w, h) => {
    g.fillStyle = '#f8f2e4'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(90,115,219,0.28)'
    g.lineWidth = 3
    g.beginPath(); g.moveTo(24, h * 0.76); g.lineTo(w - 24, h * 0.76); g.stroke()
    g.fillStyle = C.ink
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    let size = 150
    do { g.font = `${size}px "${state.font}"`; size -= 6 } while (g.measureText(text).width > w - 70 && size > 40)
    g.save(); g.translate(w / 2, h * 0.54); g.rotate(-0.035); g.fillText(text, 0, 0); g.restore()
  }
}

function makeDrawer(name, y) {
  const d = new THREE.Group()
  d.position.set(0, y, CD / 2 - 0.02)
  cab.add(d)
  const face = mesh(new RoundedBoxGeometry(1.28, 0.98, 0.12, 5, 0.05), faceMat, { receive: true })
  d.add(face)

  const handle = new THREE.Group()
  handle.position.set(0, -0.24, 0.06)
  const bar = mesh(new RoundedBoxGeometry(0.46, 0.078, 0.075, 4, 0.034), creamMat)
  bar.position.z = 0.075
  handle.add(bar)
  for (const s of [-1, 1]) {
    const post = mesh(new RoundedBoxGeometry(0.06, 0.07, 0.085, 3, 0.025), creamMat)
    post.position.set(s * 0.19, 0, 0.03)
    handle.add(post)
  }
  d.add(handle)

  const frame = mesh(new RoundedBoxGeometry(0.52, 0.29, 0.03, 3, 0.012), chromeMat)
  frame.position.set(0, 0.13, 0.07)
  const tex = canvasTex(512, 256, labelDraw(name))
  const card = mesh(new THREE.PlaneGeometry(0.45, 0.225), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), { cast: false })
  card.position.set(0, 0.13, 0.087)
  d.add(frame, card)

  const lock = new THREE.Group()
  lock.position.set(0.49, 0.36, 0.06)
  const cyl = mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.05, 36), chromeMat)
  cyl.rotation.x = Math.PI / 2
  cyl.position.z = 0.02
  const hole = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 20), keyholeMat, { cast: false })
  hole.rotation.x = Math.PI / 2
  hole.position.set(0, 0.008, 0.047)
  const slot = mesh(new THREE.BoxGeometry(0.013, 0.032, 0.01), keyholeMat, { cast: false })
  slot.position.set(0, -0.012, 0.047)
  lock.add(cyl, hole, slot)
  lock.userData.tag = 'lock'
  d.add(lock)

  d.traverse((o) => { if (!o.userData.tag) o.userData.tag = name })
  return { name, d, handle, tex, baseZ: d.position.z, pull: new Spring(0, 260, 15), hov: new Spring(0, 120, 14), lock }
}
const drawers = [makeDrawer('builds', FEET + CH * 0.735), makeDrawer('personal', FEET + CH * 0.27)]

// the opening the top drawer slides out of: a dark cavity with faint inner walls,
// sitting just proud of the body so it only shows once the drawer is pulled
{
  const holeTex = canvasTex(512, 384, (g, w, h) => {
    const ix = w * 0.1, iy = h * 0.14
    g.fillStyle = '#0b1150'
    g.fillRect(0, 0, w, h)
    const wall = (pts, a, b) => {
      const gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1])
      gr.addColorStop(0, a); gr.addColorStop(1, b)
      g.fillStyle = gr
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill()
    }
    wall([[0, 0], [w, 0], [w - ix, iy], [ix, iy]], '#03061e', '#0a0f3f')
    wall([[0, 0], [ix, iy], [ix, h - iy], [0, h]], '#141c63', '#0d1449')
    wall([[w, 0], [w - ix, iy], [w - ix, h - iy], [w, h]], '#101759', '#0b1148')
    wall([[0, h], [ix, h - iy], [w - ix, h - iy], [w, h]], '#1a2370', '#101756')
    g.fillStyle = '#080c34'
    g.fillRect(ix, iy, w - 2 * ix, h - 2 * iy)
  })
  for (const y of [FEET + CH * 0.735, FEET + CH * 0.27]) {
    const hole = mesh(new THREE.PlaneGeometry(1.26, 0.96), new THREE.MeshBasicMaterial({ map: holeTex, toneMapped: false }), { cast: false })
    hole.position.set(0, y, CD / 2 + 0.003)
    cab.add(hole)
  }
}

function redrawLabels() {
  for (const dr of drawers) {
    const c = dr.tex.image
    labelDraw(dr.name)(c.getContext('2d'), c.width, c.height)
    dr.tex.needsUpdate = true
  }
}

/* ================================================================== *
 *  DRAWER CONTENTS: a real drawer box with hanging files
 * ================================================================== */
const FILES = [
  { id: 'dossier', label: 'confidential', color: '#e6c27f', ink: '#b3261e', tabX: -0.34 },
  { id: 'bandroom', label: 'bandroom', color: '#0b1fd4', ink: '#ffffff', tabX: -0.02 },
  { id: 'misemash', label: 'misemash', color: '#c2410c', ink: '#fff7ed', tabX: 0.3 },
  { id: 'space-vibes', label: 'space vibes', color: '#6d28d9', ink: '#f5f3ff', tabX: -0.16 },
  { id: 'agent-carroto', label: 'agent carroto', color: '#f47b20', ink: '#fff7ed', tabX: 0.16 },
]
function drawerBox(dr, rails) {
  const g = new THREE.Group()
  dr.d.add(g)
  const sideMat = mat('#1f33c4', { roughness: 0.4, clearcoat: 0.4 })
  const liner = mat('#e7eaf6', { roughness: 0.75, clearcoat: 0 })
  const bottom = mesh(new RoundedBoxGeometry(1.2, 0.03, 0.98, 2, 0.01), liner, { receive: true })
  bottom.position.set(0, -0.42, -0.55)
  const back = mesh(new RoundedBoxGeometry(1.2, 0.66, 0.035, 2, 0.012), sideMat, { receive: true })
  back.position.set(0, -0.1, -1.03)
  g.add(bottom, back)
  for (const s of [-1, 1]) {
    const side = mesh(new RoundedBoxGeometry(0.035, 0.66, 0.98, 2, 0.012), sideMat, { receive: true })
    side.position.set(s * 0.6, -0.1, -0.55)
    g.add(side)
    if (rails) {
      const rail = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.96, 12), chromeMat)
      rail.rotation.x = Math.PI / 2
      rail.position.set(s * 0.56, 0.22, -0.55)
      g.add(rail)
    }
  }
  return g
}
const builds = drawers[0]
const inner = drawerBox(builds, true)
function tabDraw(f) {
  return (g, w, h) => {
    g.fillStyle = f.color
    g.fillRect(0, 0, w, h)
    g.fillStyle = f.ink
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    let size = 78
    do { g.font = `${size}px "${state.font}"`; size -= 4 } while (g.measureText(f.label).width > w - 30 && size > 24)
    g.fillText(f.label, w / 2, h * 0.56)
  }
}
const files = FILES.map((f, i) => {
  const g = new THREE.Group()
  g.position.set(0, -0.06, -0.23 - i * 0.13) // five files hang in the drawer
  const folderMat = mat(f.color, { roughness: 0.62, clearcoat: 0.08 })
  const body = mesh(new RoundedBoxGeometry(1.06, 0.6, 0.018, 2, 0.008), folderMat)
  const paper = mesh(new RoundedBoxGeometry(0.98, 0.6, 0.01, 2, 0.004), mat(C.cream, { roughness: 0.85, clearcoat: 0 }))
  paper.position.set(0.02, 0.035, -0.012)
  const rod = mesh(new RoundedBoxGeometry(1.16, 0.014, 0.014, 2, 0.006), chromeMat)
  rod.position.y = 0.29
  const tab = mesh(new RoundedBoxGeometry(0.34, 0.13, 0.018, 2, 0.008), folderMat)
  tab.position.set(f.tabX, 0.35, 0)
  const tex = canvasTex(320, 120, tabDraw(f))
  const label = mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), { cast: false })
  label.position.set(f.tabX, 0.355, 0.0101)
  g.add(body, paper, rod, tab, label)
  g.traverse((o) => { o.userData.tag = `file:${f.id}` })
  inner.add(g)
  return { ...f, g, tex, baseY: g.position.y, lift: new Spring(0, 170, 14), out: 0 }
})
function redrawFileTabs() {
  for (const f of files) {
    const c = f.tex.image
    tabDraw(f)(c.getContext('2d'), c.width, c.height)
    f.tex.needsUpdate = true
  }
}

/* ================================================================== *
 *  THE PERSONAL DRAWER: it was carrots all along
 * ================================================================== */
const personal = drawers[1]
const family = drawerBox(personal, false)
const minis = []
{
  const eyeGeo = new THREE.SphereGeometry(1, 20, 14)
  const whiteMat = mat('#ffffff', { roughness: 0.16, clearcoat: 1 })
  const pupilMat = mat(C.ink, { roughness: 0.2, clearcoat: 1 })
  const tieMat = mat(C.cobalt, { roughness: 0.35, clearcoat: 0.6 })
  const tieGeo = new THREE.TorusGeometry(0.1, 0.034, 12, 28)
  const bunGeo = new THREE.SphereGeometry(0.155, 20, 14)
  const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
  // a heap of them, piled on top of each other at odd angles
  const N = 22
  for (let i = 0; i < N; i++) {
    const m = new THREE.Group()
    const layer = i < 10 ? 0 : i < 17 ? 1 : 2
    const home = new V3((rnd(i, 1) - 0.5) * 0.62, -0.41 + layer * 0.12, -0.28 - rnd(i, 2) * 0.56)
    const tilt = new THREE.Euler((rnd(i, 3) - 0.5) * (0.35 + layer * 0.2), (rnd(i, 4) - 0.5) * 1.4, (rnd(i, 5) - 0.5) * (0.4 + layer * 0.25))
    m.position.copy(home)
    m.rotation.copy(tilt)
    const inner2 = new THREE.Group()
    inner2.scale.setScalar(0.16 + rnd(i, 6) * 0.05)
    m.add(inner2)
    inner2.add(mesh(body.geometry, skin, { cast: false }))
    const eyesG = []
    for (const side of [-1, 1]) {
      const e = new THREE.Group()
      e.position.copy(surf(1.13, side * 0.3, -0.02))
      e.rotation.y = side * 0.3
      const w = mesh(eyeGeo, whiteMat, { cast: false }); w.scale.set(0.15, 0.15, 0.09)
      const pu = mesh(eyeGeo, pupilMat, { cast: false }); pu.scale.set(0.075, 0.075, 0.03); pu.position.z = 0.085
      e.add(w, pu)
      inner2.add(e)
      eyesG.push({ e, pu })
    }
    // the same top as the big one: a tie, a bun, and leaves
    const topG = new THREE.Group()
    topG.position.y = 1.54
    const tie = mesh(tieGeo, tieMat, { cast: false }); tie.rotation.x = Math.PI / 2; tie.position.y = 0.05
    const bn = mesh(bunGeo, leafMats[0], { cast: false }); bn.scale.set(1, 0.82, 1); bn.position.y = 0.19
    topG.add(tie, bn)
    for (let k = 0; k < 5; k++) {
      const piv = new THREE.Group(); piv.position.y = 0.22; piv.rotation.y = (k / 5) * Math.PI * 2
      const tl = new THREE.Group(); tl.rotation.z = -(0.3 + 0.25 * (k % 2))
      tl.add(mesh(leafGeo, leafMats[k % 2], { cast: false }))
      piv.add(tl)
      topG.add(piv)
    }
    inner2.add(topG)
    m.traverse((o) => { o.userData.tag = `mini:${i}` })
    family.add(m)
    minis.push({ m, eyes: eyesG, home, tilt, pop: new Spring(0, 80 + (i % 7) * 9, 9), ph: i * 1.3, blink: 0, free: false, held: false, vel: new V3() })
  }
}
function updateFamily(dt) {
  for (const f of minis) {
    if (f.held) {
      // dangling from the pointer
      f.m.position.lerp(miniDrag.target, 1 - Math.exp(-16 * dt))
      f.m.rotation.x = damp(f.m.rotation.x, 0.25, 8, dt)
      f.m.rotation.z = damp(f.m.rotation.z, Math.sin(t * 6) * 0.15, 8, dt)
    } else if (f.free) {
      // out on the floor: fall, bounce, stand back up
      if (f.m.position.y > 0 || f.vel.y > 0) {
        f.vel.y -= 9.8 * dt
        f.m.position.addScaledVector(f.vel, dt)
        if (f.m.position.y <= 0) {
          f.m.position.y = 0
          f.vel.y = Math.abs(f.vel.y) > 1 ? -f.vel.y * 0.35 : 0
          f.vel.x *= 0.5; f.vel.z *= 0.5
          if (Math.abs(f.vel.y) > 0.5) sfx.pip()
        }
      }
      f.m.rotation.x = damp(f.m.rotation.x, 0, 6, dt)
      f.m.rotation.z = damp(f.m.rotation.z, 0, 6, dt)
      keepOut(f.m.position)
      if (f.m.position.y === 0 && f.vel.y === 0) {
        f.landedAt ??= t
        if (t - f.landedAt > 4.5) { f.landedAt = null; hopHome(f) }
      }
    } else {
      const p = f.pop.step(dt)
      f.m.position.y = f.home.y + p * 0.18 + (p > 0.5 && !reduce ? Math.sin(t * 2.4 + f.ph) * 0.008 : 0)
      f.m.rotation.x = f.tilt.x - 0.3 * p // a little lean back to look up at you
      f.m.visible = personal.pull.v > 0.3
    }
    // every tiny carrot watches you
    const head = f.m.localToWorld(new V3(0, 0.25, 0.1))
    const d = pointerWorld.clone().sub(head)
    const len = Math.hypot(d.x, d.y) || 1
    const ox = (d.x / len) * 0.04, oy = (d.y / len) * 0.04
    if (Math.random() < dt * 0.25) f.blink = 0.12
    f.blink = Math.max(0, f.blink - dt)
    for (const { e, pu } of f.eyes) {
      pu.position.x = ox; pu.position.y = oy
      e.scale.y = f.blink > 0 ? 0.15 : 1
    }
  }
}
/* ---- pick a tiny carrot up and drop it somewhere ---- */
const miniDrag = { f: null, target: new V3(), plane: new THREE.Plane(new V3(0, 0, 1), 0), sx: 0, sy: 0, down: null, moved: false }
function miniDown(i, e) {
  miniDrag.down = minis[i]
  miniDrag.sx = e.clientX; miniDrag.sy = e.clientY
  miniDrag.moved = false
}
function miniMove(e) {
  const f = miniDrag.down
  if (!f) return false
  if (!miniDrag.moved && Math.hypot(e.clientX - miniDrag.sx, e.clientY - miniDrag.sy) > 6) {
    miniDrag.moved = true
    miniDrag.f = f
    f.held = true
    f.free = false
    scene.attach(f.m)
    const wp = f.m.getWorldPosition(new V3())
    miniDrag.plane.constant = -(wp.z + 0.1)
    miniDrag.target.copy(wp)
    sfx.pip()
  }
  if (miniDrag.f) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = new V3()
    if (ray.ray.intersectPlane(miniDrag.plane, hit)) miniDrag.target.copy(hit).add(new V3(0, -0.2, 0))
    return true
  }
  return false
}
function miniUp() {
  const f = miniDrag.f
  const clicked = miniDrag.down && !miniDrag.moved ? miniDrag.down : null
  if (miniDrag.down) miniDrag.swallowClick = true // the click that follows this pointerup belongs to the carrot
  miniDrag.down = null
  miniDrag.f = null
  if (clicked) { clicked.pop.vel += 6; clicked.blink = 0.2; sfx.pip(); return true }
  if (!f) return false
  f.held = false
  f.free = true
  f.vel.set((Math.random() - 0.5) * 0.4, 0.6, 0.3)
  // he notices every time
  const lines = ['hey! put him back!', 'that’s my cousin!', 'he doesn’t like the floor.', 'careful, he bruises.', 'you’re gonna lose one.']
  if (!story.lastYell || t - story.lastYell > 1.2) {
    story.lastYell = t
    setTimeout(() => say(lines[(story.yells = (story.yells ?? -1) + 1) % lines.length], { mood: 'shock', hold: 1300 }), 250)
  }
  return true
}
// push a point on the floor out of the cabinet (and its pulled-out drawers) and the copier
function keepOut(p) {
  const pull = Math.max(builds.pull.v, personal.pull.v) * 0.1
  const box = { x0: cab.position.x - CW / 2 - 0.12, x1: cab.position.x + CW / 2 + 0.12, z0: cab.position.z - CD / 2 - 0.12, z1: cab.position.z + CD / 2 + pull + 0.14 }
  if (p.x > box.x0 && p.x < box.x1 && p.z > box.z0 && p.z < box.z1) {
    const out = [[p.x - box.x0, () => (p.x = box.x0)], [box.x1 - p.x, () => (p.x = box.x1)], [box.z1 - p.z, () => (p.z = box.z1)]]
    out.sort((a, b) => a[0] - b[0])[0][1]()
  }
  const lc = copier.worldToLocal(p.clone())
  if (Math.abs(lc.x) < 0.56 && Math.abs(lc.z) < 0.46) {
    lc.z = lc.z > 0 ? 0.46 : -0.46
    const w = copier.localToWorld(lc)
    p.x = w.x; p.z = w.z
  }
}
function hopHome(f) {
  if (!f.free || f.held) return
  family.attach(f.m)
  const from = f.m.position.clone()
  sfx.pip()
  tween(0.6, (u) => {
    f.m.position.lerpVectors(from, f.home, u)
    f.m.position.y += Math.sin(u * Math.PI) * 0.6
  }, () => { f.free = false; f.m.rotation.copy(f.tilt) })
}
function recallMinis() {
  minis.forEach((f, i) => {
    if (!f.free && !f.held) return
    f.held = false
    setTimeout(() => {
      family.attach(f.m)
      const from = f.m.position.clone()
      tween(0.5, (u) => {
        f.m.position.lerpVectors(from, f.home, u)
        f.m.position.y += Math.sin(u * Math.PI) * 0.5
      }, () => { f.free = false; f.m.rotation.copy(f.tilt) })
    }, i * 60)
  })
}
/* ---------------- adopt one: the desktop pet ---------------- */
const adoptEl = document.createElement('aside')
adoptEl.className = 'adopt'
adoptEl.hidden = true
adoptEl.innerHTML = `
  <p class="ad-h">adoption papers</p>
  <p class="ad-sub">one carrot, to live on your mac dock.</p>
  <ol>
    <li><b>download</b> carroto and unzip him.</li>
    <li>drag <b>carroto</b> into your applications folder.</li>
    <li>the first time, <b>right-click → open</b>. he’s homemade, so your mac double-checks.</li>
    <li>he walks along your dock. <b>right-click him</b> for tricks. drag him around. he naps if you leave.</li>
  </ol>
  <p class="ad-care">for macs. chatting with him needs claude code; everything else just works.</p>
  <a class="act ad-get" href="./assets/carroto-for-mac.zip" download>download carroto →</a>
  <button class="ad-try" type="button">or try him in your browser first</button>
  <p class="ad-follow">follow his adventures: <a href="https://www.instagram.com/agentcarroto/" target="_blank" rel="noopener">@agentcarroto ↗</a></p>`
document.body.appendChild(adoptEl)
adoptEl.querySelector('.ad-get').addEventListener('click', () => say('take care of him.', { mood: 'happy', hold: 1600 }))
// the quick option: a carrot in a little floating browser window, no download
adoptEl.querySelector('.ad-try').addEventListener('click', async () => {
  try {
    if ('documentPictureInPicture' in window) {
      const w = await window.documentPictureInPicture.requestWindow({ width: 240, height: 300 })
      mountPet(w)
    } else {
      window.open('./pet.html', 'carrot-pet', 'width=240,height=300,popup')
    }
    say('take care of him.', { mood: 'happy', hold: 1600 })
  } catch {
    window.open('./pet.html', 'carrot-pet', 'width=240,height=300,popup')
  }
})

function openFamily() {
  story.familyOpen = true
  setTimeout(() => { if (story.familyOpen) adoptEl.hidden = false }, 1800)
  builds.pull.t = 0 // shut the files drawer so we can see down into this one
  personal.pull.t = 8.4
  // look down into the drawer, the same way we look into the files
  story.diveTo = family
  dive.t = 1
  backBtn.hidden = false
  $('.hint').textContent = '( say hi )'
  sfx.clunk()
  minis.forEach((f, i) => setTimeout(() => { f.pop.t = 1; sfx.pip() }, 350 + i * 90))
  setTimeout(() => {
    glanceAt(personal.d.localToWorld(new V3(0, 0, 0.4)), 1500)
    say('…okay. you found my family.', { mood: 'shock', arms: story.atCabinet ? ['rest', 'tap'] : ['rest', 'point'], hold: 1600, then: () => say('say hi. they don’t bite.', { mood: 'happy', hold: 1800 }) })
  }, 1300)
}
function closeFamily() {
  story.familyOpen = false
  adoptEl.hidden = true
  recallMinis()
  story.diveTo = null
  dive.t = 0
  backBtn.hidden = true
  $('.hint').textContent = '( psst: the files are open )'
  minis.forEach((f) => { f.pop.t = 0 })
  setTimeout(() => { personal.pull.t = 0; if (story.unlocked) builds.pull.t = 8.4 }, 350)
  say('shh. they’re napping.', { mood: 'smug', hold: 1300 })
}

// a little stack of folders on top, in the site's band colours: a hint of what's inside
{
  const stack = new THREE.Group()
  stack.position.set(-0.05, FEET + CH, 0.02)
  const cols = [C.bandPurple, C.cream, C.bandOrange, C.cream, C.cobalt]
  cols.forEach((c, i) => {
    const paper = c === C.cream
    const s = mesh(new RoundedBoxGeometry(paper ? 0.86 : 0.92, paper ? 0.018 : 0.034, paper ? 0.58 : 0.64, 2, paper ? 0.006 : 0.012), mat(c, { roughness: paper ? 0.8 : 0.4 }))
    s.position.set(i * 0.012, 0.012 + i * 0.028, 0)
    s.rotation.y = (i % 2 ? -1 : 1) * 0.05 + i * 0.015
    if (!paper) {
      const tab = mesh(new RoundedBoxGeometry(0.22, 0.034, 0.1, 2, 0.012), s.material)
      tab.position.set(-0.22 + i * 0.12, 0, -0.34)
      s.add(tab)
    }
    stack.add(s)
  })
  cab.add(stack)
}
/* ================================================================== *
 *  FERNANDO THE PLANT, and a watering can
 * ================================================================== */
const plant = new THREE.Group()
plant.position.set(-2.05, 0, 0.35)
scene.add(plant)
plant.add(contact(0.7, 0.55))
plant.perk = new Spring(0, 140, 7)
plant.grow = 1
const plantTop = new THREE.Group()
{
  const potProf = [[0, 0], [0.15, 0], [0.16, 0.02], [0.2, 0.3], [0.23, 0.31], [0.23, 0.36], [0.19, 0.36], [0, 0.34]].map(([r, y]) => new THREE.Vector2(r, y))
  const pot = mesh(new THREE.LatheGeometry(potProf, 40), mat('#d0714a', { roughness: 0.7, clearcoat: 0.1 }), { receive: true })
  const soil = mesh(new THREE.CircleGeometry(0.19, 32), mat('#4a3322', { roughness: 1, clearcoat: 0 }), { cast: false })
  soil.rotation.x = -Math.PI / 2
  soil.position.y = 0.335
  plant.add(pot, soil)
  plantTop.position.y = 0.33
  plant.add(plantTop)
  const big = new THREE.SphereGeometry(1, 24, 14)
  big.scale(0.11, 0.42, 0.035)
  big.translate(0, 0.42, 0)
  const greens = [mat('#3f9b4f', { roughness: 0.5 }), mat('#58b862', { roughness: 0.5 }), mat('#2f7d3c', { roughness: 0.5 })]
  for (let i = 0; i < 9; i++) {
    const piv = new THREE.Group()
    piv.rotation.y = (i / 9) * Math.PI * 2 + (i % 2) * 0.3
    const tilt = new THREE.Group()
    tilt.rotation.z = -(0.25 + 0.35 * ((i * 5) % 3) / 2)
    const leaf = mesh(big, greens[i % 3])
    leaf.scale.setScalar(0.75 + ((i * 7) % 4) * 0.1)
    tilt.add(leaf)
    piv.add(tilt)
    plantTop.add(piv)
  }
}
{
  const signDraw = (g, w, h) => {
    g.fillStyle = '#f6ecd6'; g.fillRect(0, 0, w, h)
    g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = `64px "${state.font}"`
    g.fillText('fernando', w / 2, h / 2 + 4)
  }
  const tex = canvasTex(256, 96, signDraw)
  tex.redraw = () => { const c = tex.image; signDraw(c.getContext('2d'), c.width, c.height); tex.needsUpdate = true }
  // stake planted in the soil, sign poking up just above the rim
  const stake = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 8), mat('#b98a55', { roughness: 0.8 }))
  stake.position.set(0.07, 0.4, 0.185)
  stake.rotation.x = 0.3
  const sign = mesh(new RoundedBoxGeometry(0.28, 0.1, 0.012, 2, 0.006), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }))
  sign.position.set(0.07, 0.47, 0.245)
  sign.rotation.set(-0.1, 0.12, -0.05)
  plant.add(stake, sign)
  plant.userData.signTex = tex
}
plant.traverse((o) => { o.userData.tag = 'plant' })

const can = new THREE.Group()
{
  const canMat = mat('#48b07a', { roughness: 0.35, clearcoat: 0.6 })
  const b = mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.13, 24), canMat)
  const spout = mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.2, 12), canMat)
  spout.position.set(0, 0.03, 0.12)
  spout.rotation.x = Math.PI / 2 - 0.5
  const rose = mesh(new THREE.CylinderGeometry(0.028, 0.016, 0.03, 14), canMat)
  rose.position.set(0, 0.075, 0.21)
  rose.rotation.x = Math.PI / 2 - 0.5
  const handle = mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 20, Math.PI), canMat)
  handle.position.set(0, 0.06, -0.02)
  handle.rotation.y = Math.PI / 2
  can.add(b, spout, rose, handle)
}
can.visible = false
can.scale.setScalar(1.6)
can.userData.tilt = 0
torso.add(can)
const drops = Array.from({ length: 10 }, () => {
  const d = mesh(new THREE.SphereGeometry(0.012, 8, 6), mat('#8cc4ff', { roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 }), { cast: false })
  d.visible = false
  scene.add(d)
  return { d, v: new V3(), live: false }
})
const canTilt = new Spring(0, 60, 10)
function updatePlant(dt) {
  const pk = plant.perk.step(dt)
  plantTop.scale.set(plant.grow, plant.grow * (1 + pk * 0.08), plant.grow)
  plantTop.rotation.z = reduce ? 0 : Math.sin(t * 1.1) * 0.03 + pk * 0.04
  // the can rides in the carrot's left hand and tips forward to pour
  if (can.visible) {
    can.position.copy(arms[0].hand).add(new V3(0.02, 0.04, 0.04))
    canTilt.t = can.userData.tilt
    can.rotation.set(canTilt.step(dt) * 0.9, 0, 0)
  }
  const pouring = can.visible && canTilt.v > 0.6
  const tip = can.localToWorld(new V3(0, 0.08, 0.23))
  for (const p of drops) {
    if (!p.live && pouring && Math.random() < dt * 30) {
      p.live = true
      p.d.visible = true
      p.d.position.copy(tip)
      p.v.set((Math.random() - 0.5) * 0.3, -0.2, (Math.random() - 0.5) * 0.3)
    }
    if (p.live) {
      p.v.y -= 9.8 * dt
      p.d.position.addScaledVector(p.v, dt)
      if (p.d.position.y < 0.34) { p.live = false; p.d.visible = false }
    }
  }
}

/* ================================================================== *
 *  THE PHOTOCOPIER: it will not copy the resume. it can be bribed.
 * ================================================================== */
const copier = new THREE.Group()
copier.position.set(2.62, 0, 0.15)
copier.rotation.y = -0.28
scene.add(copier)
copier.add(contact(1.4, 1.1))
const copierLight = mat('#3ddc84', { roughness: 0.3, emissive: '#3ddc84', emissiveIntensity: 0.6 })
{
  const cream = mat('#f3efe6', { roughness: 0.4, clearcoat: 0.5 })
  const baseMesh = mesh(new RoundedBoxGeometry(0.92, 0.62, 0.74, 5, 0.08), cream, { receive: true })
  baseMesh.position.y = 0.05 + 0.31
  const lid = mesh(new RoundedBoxGeometry(0.95, 0.08, 0.76, 4, 0.035), mat(C.cobalt, { roughness: 0.34, clearcoat: 0.6 }))
  lid.position.y = 0.72
  const panel = mesh(new RoundedBoxGeometry(0.36, 0.06, 0.2, 3, 0.025), mat('#2a2d36', { roughness: 0.5 }))
  panel.position.set(0.22, 0.79, 0.24)
  panel.rotation.x = 0.35
  const btn = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.04, 28), mat(C.orange, { roughness: 0.35, clearcoat: 0.8 }))
  btn.position.set(0.3, 0.83, 0.26)
  btn.rotation.x = 0.35
  const led = mesh(new THREE.SphereGeometry(0.018, 14, 10), copierLight)
  led.position.set(0.14, 0.82, 0.27)
  const slot = mesh(new THREE.BoxGeometry(0.56, 0.035, 0.02), keyholeMat, { cast: false })
  slot.position.set(0, 0.4, 0.375)
  const tray = mesh(new RoundedBoxGeometry(0.6, 0.025, 0.34, 2, 0.01), cream)
  tray.position.set(0, 0.3, 0.52)
  tray.rotation.x = 0.12
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const f = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.05, 14), inkMat)
    f.position.set(x * 0.36, 0.025, z * 0.27)
    copier.add(f)
  }
  // a few vents, and the brand plate
  for (let i = 0; i < 4; i++) {
    const v = mesh(new RoundedBoxGeometry(0.02, 0.26, 0.012, 1, 0.005), mat('#d8d2c4', { roughness: 0.6 }), { cast: false })
    v.position.set(-0.3 + i * 0.05, 0.25, 0.372)
    copier.add(v)
  }
  const plateTex = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#2a2d36'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#f3efe6'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = '700 30px "JetBrains Mono", monospace'
    g.fillText('COPY-O-MATIC', w / 2, h / 2 + 2)
  })
  const plate = mesh(new THREE.PlaneGeometry(0.3, 0.075), new THREE.MeshBasicMaterial({ map: plateTex, toneMapped: false }), { cast: false })
  plate.position.set(0.2, 0.2, 0.372)
  copier.add(baseMesh, lid, panel, btn, led, slot, tray)
  copier.add(plate)
  copier.userData.btn = btn
}
// the sheet it prints
const deniedTex = canvasTex(360, 480, (g, w, h) => {
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(0,0,0,0.12)'
  for (let y = 70; y < h - 40; y += 26) g.fillRect(40, y, w - 80 - ((y * 7) % 90), 5)
  g.save(); g.translate(w / 2, h / 2); g.rotate(-0.2)
  g.strokeStyle = '#c8322a'; g.lineWidth = 10; g.strokeRect(-150, -52, 300, 104)
  g.fillStyle = '#c8322a'; g.font = '800 54px "Bricolage Grotesque", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText('DENIED', 0, 4)
  g.restore()
})
const sheetGeo = new THREE.PlaneGeometry(0.4, 0.53, 10, 12)
const sheetFlat = sheetGeo.attributes.position.array.slice()
const printSheet = mesh(sheetGeo, new THREE.MeshStandardMaterial({ map: deniedTex, roughness: 0.85, side: THREE.DoubleSide }))
printSheet.rotation.order = 'YXZ'
printSheet.visible = false
const sheet = { pos: new V3(), vel: new V3(), flying: false, age: 0, curl: 0, yaw: 0 }
// bend the sheet: a curl along its length plus a little wave across it
function bendSheet(curl, wave) {
  const p = sheetGeo.attributes.position.array
  for (let i = 0; i < p.length; i += 3) {
    const x = sheetFlat[i], y = sheetFlat[i + 1]
    const v = (y + 0.265) / 0.53
    p[i + 2] = curl * v * v * 0.35 + wave * Math.sin(x * 14) * 0.02
  }
  sheetGeo.attributes.position.needsUpdate = true
  sheetGeo.computeVertexNormals()
}
copier.add(printSheet)
copier.traverse((o) => { o.userData.tag = 'copier' })
const copy = { busy: false, t0: -1 }

const cabDrop = new Spring(4, 110, 11)
let cabShake = 0

/* ================================================================== *
 *  KEY (hiccuped out on "pick the lock")
 * ================================================================== */
const key = new THREE.Group()
{
  const brass = mat(C.brass, { metalness: 1, roughness: 0.26, clearcoat: 0 })
  const bow = mesh(new THREE.TorusGeometry(0.075, 0.027, 18, 44), brass)
  const shaft = mesh(new RoundedBoxGeometry(0.27, 0.042, 0.036, 2, 0.014), brass)
  shaft.position.x = 0.2
  const t1 = mesh(new RoundedBoxGeometry(0.045, 0.075, 0.036, 2, 0.01), brass)
  t1.position.set(0.3, -0.045, 0)
  const t2 = mesh(new RoundedBoxGeometry(0.035, 0.05, 0.036, 2, 0.01), brass)
  t2.position.set(0.235, -0.035, 0)
  const ring = mesh(new THREE.TorusGeometry(0.046, 0.009, 10, 32), chromeMat)
  ring.position.set(-0.115, 0, 0)
  ring.rotation.y = Math.PI / 2.4
  const charm = new THREE.Group()
  charm.position.set(-0.13, -0.06, 0)
  const cone = mesh(new THREE.ConeGeometry(0.034, 0.12, 20), mat(C.orange))
  cone.rotation.z = Math.PI
  cone.position.y = -0.04
  const sprig = mesh(new THREE.SphereGeometry(0.022, 12, 10), mat(C.leaf))
  sprig.scale.set(0.8, 1.4, 0.6)
  sprig.position.y = 0.035
  charm.add(cone, sprig)
  key.add(bow, shaft, t1, t2, ring, charm)
}
key.visible = false
key.traverse((o) => { o.userData.tag = 'key' })
scene.add(key)
const keyGlint = glint(0.3)
scene.add(keyGlint)
const kp = { pos: new V3(), vel: new V3(), spin: new V3(), resting: false, flying: false }

/* ================================================================== *
 *  speech bubble
 * ================================================================== */
const bubble = $('#bubble'), btxt = bubble.querySelector('.txt'), bacts = bubble.querySelector('.acts')
let sayId = 0, typeTimer = 0, holdTimer = 0
function hideBubble() { bubble.hidden = true; clearInterval(typeTimer); clearTimeout(holdTimer) }
/* ---------------- idle: little things it does when nobody's talking to it ---------------- */
const idle = { name: null, until: 0, next: 5, queue: ['water', 'yoga'] }
const IDLES = {
  hips: { dur: 3, start: () => pose('hips') },
  behind: { dur: 3.4, start: () => { pose('behind'); mood('smug'); wander() } },
  look: { dur: 2.6, start: () => wander() },
  tap: { dur: 2.8, start: () => { pose('hips'); mood('smug') } },
  stretch: {
    dur: 1.9,
    start: () => { pose('stretch'); mood('shock'); squash.t = -0.07 },
    end: () => { squash.t = 0 },
  },
  hum: { dur: 3.2, start: () => pose('behind') },
  peek: { dur: 2.2, start: () => { glanceAt(lockWorld(), 1800); mood('smug') }, ok: () => story.revealed && !story.unlocked },
  // a little yoga flow: namaste, tree, warrior
  yoga: {
    dur: 7.6,
    start: () => { pose('namaste'); mood('sleepy'); lidOpen = -0.5; idle.legs = null; idle.warrior = false },
    tick: (u) => {
      if (u > 0.25 && !idle.said1) { idle.said1 = true; say('inhale…', { whisper: true, idle: true, hold: 500 }) }
      if (u > 2.2 && u < 5.0) { pose('yogaUp'); idle.legs = [{ lift: 0, out: 0, knee: 0 }, { lift: 0.24, out: -0.12, knee: 0.16 }] }
      if (u > 3.4 && !idle.said2) { idle.said2 = true; say('exhale…', { whisper: true, idle: true, hold: 500 }) }
      if (u >= 5.0) { pose('wide'); idle.warrior = true; idle.legs = [{ lift: 0, out: -0.09, knee: 0 }, { lift: 0, out: 0.09, knee: 0 }] }
    },
    end: () => { idle.legs = null; idle.warrior = false; idle.said1 = idle.said2 = false },
  },
  // water fernando (only when standing next to him)
  water: {
    dur: 4.4,
    start: () => { pose('pour', 'rest'); mood('happy'); can.visible = true; idle.poured = false },
    tick: (u) => {
      can.userData.tilt = u > 0.7 && u < 3.4 ? 1 : 0
      if (u > 1.6 && !idle.poured) { idle.poured = true; plant.perk.vel += 3.5; plant.grow = Math.min(1.22, plant.grow + 0.03) }
      if (u > 3.3 && !idle.said1) { idle.said1 = true; say('grow, fernando. grow.', { idle: true, hold: 700 }) }
    },
    end: () => { can.visible = false; can.userData.tilt = 0; idle.said1 = false },
    ok: () => story.revealed && (!story.atCabinet || story.unlocked),
  },
}
function wander() {
  const c = carrot.position
  glanceSeq([[() => new V3(c.x - 3, 1.6, 2), 700], [() => new V3(c.x + 3, 1.2, 2), 800], [() => new V3(c.x, 1.3, 4), 1]])
}
function endIdle() {
  if (!idle.name) return
  story.idleBubble = false
  IDLES[idle.name].end?.()
  idle.name = null
  pose('rest')
  mood('happy')
}
function updateIdle() {
  if (idle.name && t > idle.until) { endIdle(); idle.next = t + 4 + Math.random() * 4 }
  if (idle.name) IDLES[idle.name].tick?.(t - idle.t0)
  const calm = !story.inDrawer && !story.familyOpen && copyEl.hidden && (bubble.hidden || story.idleBubble) && !game.open && !walk.on && !story.busy && !story.sleeping && !drag.on && !kp.flying && story.introduced
  if (!calm) { if (idle.name) endIdle(); idle.next = Math.max(idle.next, t + 3); return }
  if (!idle.name && t > idle.next) {
    const names = Object.keys(IDLES).filter((n) => IDLES[n].ok?.() ?? true)
    names.push(...(names.includes('water') ? ['water', 'water'] : []), ...(names.includes('yoga') ? ['yoga', 'yoga'] : []))
    // the first two things he does are always watering fernando, then yoga
    const first = idle.queue.find((n) => names.includes(n))
    const name = first ?? names[Math.floor(Math.random() * names.length)]
    if (name === 'water' && story.atCabinet) {
      // stroll back to fernando first; the water idle starts once he's there
      walkTo(HOME.clone(), () => { story.atCabinet = false; idle.next = t + 0.6 })
      return
    }
    idle.queue = idle.queue.filter((n) => n !== name)
    idle.name = name
    idle.t0 = t
    idle.until = t + IDLES[name].dur
    IDLES[name].start()
  }
}

// wait for the handwriting font before he talks: the bubble is sized to the text,
// and measuring it in the fallback font on a first visit squeezes it to one word per line
let fontsReady = false
document.fonts.ready.then(() => { fontsReady = true })
setTimeout(() => { fontsReady = true }, 4000)

function say(text, { acts = [], hold = 2400, then, mood: m, arms: a, whisper = false, idle: fromIdle = false } = {}) {
  // an idle's own little lines don't interrupt the idle
  if (!fromIdle) endIdle()
  if (text !== 'zzz') story.sleeping = false
  story.idleBubble = fromIdle
  const id = ++sayId
  clearInterval(typeTimer); clearTimeout(holdTimer)
  if (m) mood(m)
  if (a) pose(...a)
  else if (!fromIdle) pose('rest')
  bubble.hidden = false
  bubble.classList.toggle('whisper', whisper)
  bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop')
  // size the bubble to the text's balanced lines, so the gap is even on both sides
  btxt.style.width = ''
  bubble.style.left = '0px' // measure with the full max-width available, not squeezed against a screen edge
  btxt.textContent = text
  const range = document.createRange()
  range.selectNodeContents(btxt)
  // the pop-in animation scales the bubble; measure in unscaled pixels
  const k = bubble.offsetWidth ? bubble.getBoundingClientRect().width / bubble.offsetWidth : 1
  const lineW = Math.max(0, ...[...range.getClientRects()].map((r) => r.width)) / (k || 1)
  btxt.style.width = `${Math.ceil(lineW + (whisper ? 22 : 0)) + 2}px`
  btxt.textContent = ''
  bacts.replaceChildren()
  let i = 0
  const done = () => {
    for (const act of acts) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = act.kind || 'act'
      b.textContent = act.label
      b.addEventListener('click', (e) => { e.stopPropagation(); act.onClick() })
      bacts.appendChild(b)
    }
    if (!acts.length && hold !== Infinity) {
      holdTimer = setTimeout(() => { if (id === sayId) { hideBubble(); pose('rest'); then?.() } }, hold + text.length * 18)
    }
  }
  if (reduce) { btxt.textContent = text; done(); return }
  typeTimer = setInterval(() => {
    btxt.textContent = text.slice(0, ++i)
    if (i % 3 === 0) sfx.blip()
    if (i >= text.length) { clearInterval(typeTimer); done() }
  }, 30)
}

/* ================================================================== *
 *  moods
 * ================================================================== */
let lidOpen = -1.25
function mood(name) {
  const M = {
    happy: { lid: -1.25, b: [[0, 0], [0, 0]], mouth: 'smile' },
    smug: { lid: -0.42, b: [[0.035, -0.22], [-0.01, 0.12]], mouth: 'smirk' },
    shock: { lid: -1.55, b: [[0.05, 0.1], [0.05, -0.1]], mouth: 'o' },
    sulk: { lid: -0.62, b: [[-0.01, 0.32], [-0.01, -0.32]], mouth: 'frown' },
    sleepy: { lid: 0.08, b: [[-0.02, 0], [-0.02, 0]], mouth: 'smile' },
  }[name]
  if (!M) return
  lidOpen = M.lid
  brows.forEach((br, i) => { br.lift.t = M.b[i][0]; br.tilt.t = M.b[i][1] })
  oMouth.visible = M.mouth === 'o'
  smile.visible = !oMouth.visible
  smile.rotation.z = M.mouth === 'frown' ? 0 : Math.PI
  smile.rotation.y = M.mouth === 'smirk' ? 0.25 : 0
  smile.scale.x = M.mouth === 'smirk' ? 0.8 : 1
  smile.position.y = surf(0.955, 0).y + (M.mouth === 'frown' ? -0.04 : 0)
  mouthPop.v = 0.6
}

/* ================================================================== *
 *  sound (tiny synth, off by default)
 * ================================================================== */
const sfx = (() => {
  let ac
  const ctx = () => (ac ??= new (window.AudioContext || window.webkitAudioContext)())
  function tone(f0, f1, dur, type = 'sine', vol = 0.2) {
    if (!state.sound) return
    const a = ctx()
    if (a.state === 'suspended') { a.resume(); return }
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    o.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(a.destination)
    o.start(t); o.stop(t + dur)
  }
  function noise(dur, freq, vol) {
    if (!state.sound) return
    const a = ctx()
    if (a.state === 'suspended') { a.resume(); return }
    const b = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain()
    s.buffer = b; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol
    s.connect(f).connect(g).connect(a.destination)
    s.start()
  }
  return {
    clunk() { noise(0.16, 900, 0.5); tone(130, 55, 0.2, 'sine', 0.35) },
    boing() { tone(200, 560, 0.24, 'triangle', 0.16) },
    hic() { tone(320, 980, 0.13, 'sine', 0.25) },
    clink() { tone(2500, 2380, 0.28, 'sine', 0.07); tone(3700, 3600, 0.2, 'sine', 0.045) },
    blip() { tone(650 + Math.random() * 220, 560, 0.035, 'square', 0.012) },
    whoosh() { noise(0.35, 2400, 0.12) },
    tap() { tone(180, 120, 0.05, 'sine', 0.06) },
    copier() {
      noise(1.3, 650, 0.14)
      for (let i = 0; i < 8; i++) setTimeout(() => tone(190, 170, 0.05, 'square', 0.025), i * 140)
      setTimeout(() => tone(900, 620, 0.2, 'sine', 0.06), 1250)
    },
    pip() { tone(900 + Math.random() * 500, 1500, 0.08, 'sine', 0.08) },
    paper() { noise(0.14, 3200, 0.07) },
    lights() { noise(0.05, 5000, 0.35); setTimeout(() => noise(0.05, 5000, 0.3), 160); tone(120, 119, 0.9, 'sawtooth', 0.012) },
  }
})()

/* ================================================================== *
 *  story
 * ================================================================== */
const story = { atCabinet: false, unlocked: false, revealed: false, revealAt: 0, asked: false, keyOut: false, pokes: 0, personal: 0, sleeping: false, lastInput: performance.now(), busy: false }
let lookOverride = null, lookUntil = 0
function glanceAt(v, ms = 1200) { lookOverride = v; lookUntil = performance.now() + ms }
const lockWorld = () => drawers[0].lock.getWorldPosition(new V3())

function glanceSeq(steps) {
  let d = 0
  for (const [where, ms] of steps) {
    setTimeout(() => { if (where) glanceAt(where(), ms); else lookOverride = null }, d)
    d += ms
  }
}

/* ---------------- it remembers you ---------------- */
const MEM_KEY = 'carrot-room'
const mem = (() => { try { return JSON.parse(localStorage.getItem(MEM_KEY) || '{}') } catch { return {} } })()
const remember = (patch) => { Object.assign(mem, patch); try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)) } catch { /* private mode */ } }

// the key already turned in the lock, the carrot already standing by the cabinet
function restoreUnlocked({ move = false } = {}) {
  Object.assign(story, { asked: true, keyOut: true, unlocked: true })
  if (move) { story.atCabinet = true; carrot.position.set(-0.16, 0, 0.42) }
  const dr = drawers[0]
  dr.d.attach(key)
  key.visible = true
  key.rotation.order = 'YXZ'
  const lp = dr.lock.position
  key.position.set(lp.x, lp.y + 0.008, lp.z + 0.35)
  key.rotation.set(Math.PI / 2, Math.PI / 2, 0)
  kp.flying = false; kp.resting = false
  dr.pull.t = 8.4
}

function intro() {
  const visits = mem.visits || 0
  remember({ visits: visits + 1 })
  // ?at=drawer: testing shortcut, lights on and the drawer already unlocked
  if (new URLSearchParams(location.search).get('at') === 'drawer') {
    Object.assign(story, { revealed: true, revealAt: t - 5, flick: true })
    restoreUnlocked({ move: true })
    setTimeout(enterDrawer, 600)
    return
  }
  if (visits > 0) {
    story.returning = true // they've seen the files before; nothing is gated this time
    say('oh. it’s you again.', {
      mood: 'smug', arms: ['rest', 'wave'], hold: 700,
      then: () => say('back for a recipe, or here to climb the leaderboard?', {
        mood: 'happy',
        acts: [
          { label: 'a recipe →', onClick: () => comeBack('recipe') },
          { label: '▶ play space vibes', onClick: () => comeBack('game') },
          { label: 'just looking', kind: 'link', onClick: justLooking },
        ],
      }),
    })
    return
  }
  say('hi!', { mood: 'happy', arms: ['rest', 'wave'], hold: 650, then: secret })
}

function secret() {
  lean.t = 1
  glanceSeq([[lockWorld, 240], [null, 200], [lockWorld, 320], [null, 1]])
  say('can you keep a secret?', {
    mood: 'smug',
    whisper: true,
    arms: ['rest', 'whisper'],
    acts: [
      { label: 'yes →', onClick: () => say("okay. lights, please.", { mood: 'smug', whisper: true, arms: ['rest', 'whisper'], hold: 250, then: reveal }) },
      { label: 'nope', kind: 'link', onClick: () => say("too bad. i'm telling you anyway.", { mood: 'sulk', hold: 450, then: reveal }) },
    ],
  })
}

// free roam: lights on, everything already unlocked, no tour
function justLooking() {
  reveal({ quiet: true })
  restoreUnlocked()
  $('.hint').textContent = '( everything’s open. go nuts. )'
  setTimeout(() => say('suit yourself. it’s all unlocked.', { mood: 'smug', arms: ['rest', 'hips'], hold: 2200 }), 2000)
}

function comeBack(where) {
  reveal({ quiet: true })
  if (mem.unlocked || where === 'recipe') restoreUnlocked()
  setTimeout(() => {
    if (where === 'recipe') { enterDrawer(); setTimeout(() => openFile('misemash'), 1400) }
    else openGame()
  }, 2100)
}

function reveal({ quiet = false } = {}) {
  if (story.revealed) return
  story.revealed = true
  story.revealAt = t
  lean.t = 0
  hideBubble()
  mood('happy')
  pose('rest')
  $('.hint').textContent = '( psst: try the cabinet )'
  if (quiet) return
  setTimeout(() => {
    glanceAt(lockWorld(), 1600)
    say('what do we have here…', { mood: 'smug', arms: ['rest', 'point'], hold: 2200 })
  }, 2000)
}
addEventListener('wheel', () => reveal(), { passive: true })
addEventListener('touchmove', () => reveal(), { passive: true })
addEventListener('keydown', (e) => { if (['ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) reveal() })

function onDrawer(dr) {
  if (dr.name === 'personal' && story.unlocked && (story.seen?.size || story.returning)) { story.familyOpen ? closeFamily() : openFamily(); return }
  rattle(dr)
  if (dr.name === 'personal' && story.unlocked) { say('not yet. go look at the files first.', { mood: 'smug' }); return }
  if (dr.name === 'personal') {
    const lines = ['nice try.', "that one's personal.", 'not even with a key.', '…why do you keep doing that?']
    say(lines[Math.min(story.personal++, lines.length - 1)], { mood: 'smug', arms: ['hips'] })
    return
  }
  if (story.unlocked) return
  if (story.keyOut) {
    glanceAt(key.position.clone(), 1400)
    say("the key's right there. drag it.", { mood: 'smug' })
    return
  }
  if (!story.asked) {
    story.asked = true
    say('locked.', {
      hold: 500, mood: 'smug', arms: ['hips'],
      then: () => walkTo(new V3(-0.16, 0, 0.42), () => {
        story.atCabinet = true
        say("you wanna see inside, don't you?", { mood: 'smug', arms: ['rest', 'tap'], hold: 1100, then: offerGame })
      }),
    })
  } else offerGame()
}

// a short walk: feet lift in turn, the body bobs and turns toward where it's going
const walk = { on: false, from: new V3(), to: new V3(), t0: 0, dur: 1.5, done: null }
function walkTo(to, done) {
  hideBubble()
  pose('rest')
  Object.assign(walk, { on: true, from: carrot.position.clone(), to, t0: t, dur: 0.45 + carrot.position.distanceTo(to) * 0.9, done })
}
function updateWalk(dt) {
  let yaw = story.atCabinet ? -0.18 : 0
  if (!walk.on) for (const L of legs) {
    const y = idle.name === 'yoga' ? idle.legs?.[L.side > 0 ? 1 : 0] : null
    L.lift = y ? y.lift : idle.name === 'tap' && L.side > 0 ? Math.max(0, Math.sin(t * 11)) * 0.04 : 0
    L.out = y ? y.out : 0
    L.knee = y ? y.knee : 0
    L.swing = 0
  }
  if (idle.name === 'water') yaw = -0.95
  if (idle.name === 'yoga' && idle.warrior) yaw = 0.35
  if (walk.on) {
    const u = Math.min(1, (t - walk.t0) / walk.dur)
    const e = u * u * (3 - 2 * u)
    carrot.position.lerpVectors(walk.from, walk.to, e)
    const phase = u * Math.PI * 2 * 3
    for (const L of legs) {
      const ph = phase + (L.side > 0 ? 0 : Math.PI)
      L.lift = Math.max(0, Math.sin(ph)) * 0.085 * Math.sin(u * Math.PI)
      L.swing = Math.cos(ph) * 0.06 * Math.sin(u * Math.PI)
    }
    torso.position.y = BY + Math.abs(Math.sin(phase)) * 0.035
    if (Math.sin(phase) * Math.sin(phase - dt * 40) < 0) sfx.tap()
    yaw = Math.atan2(walk.to.x - walk.from.x, walk.to.z - walk.from.z) * 0.55 * Math.sin(u * Math.PI)
    if (u >= 1) {
      walk.on = false
      for (const L of legs) { L.lift = 0; L.swing = 0 }
      torso.position.y = BY
      walk.done?.()
    }
  }
  carrot.rotation.y = damp(carrot.rotation.y, yaw, 6, dt)
}

/* ---------------- space vibes on the toy tv ---------------- */
const KEY_SCORE = Number(new URLSearchParams(location.search).get('need') ?? 10) // ?need= is for testing
// local dev talks to the carrotvibes dev server; ?game= overrides; otherwise the live game
const GAME_ORIGIN = new URLSearchParams(location.search).get('game')
  ?? (location.hostname === '127.0.0.1' || location.hostname === 'localhost' ? 'http://127.0.0.1:3010' : 'https://spacevibes.vercel.app')
const tv = $('#tv'), tvFrame = tv.querySelector('iframe')
const tvStatus = $('#tvStatus')
const game = { won: false, tries: 0, open: false }
$('#tvNeed').textContent = KEY_SCORE

// if the local dev game isn't running, fall back to the live one instead of a black screen
let gameOrigin = GAME_ORIGIN
const gameReady = GAME_ORIGIN.includes('127.0.0.1')
  ? fetch(GAME_ORIGIN, { mode: 'no-cors', signal: AbortSignal.timeout(1500) }).catch(() => { gameOrigin = 'https://spacevibes.vercel.app' })
  : Promise.resolve()
function preloadGame() {
  if (tvFrame.getAttribute('src')) return
  gameReady.then(() => { if (!tvFrame.getAttribute('src')) tvFrame.src = `${gameOrigin}/?embed=1` })
}
function openGame() {
  preloadGame()
  hideBubble()
  game.open = true
  tv.hidden = false
  tv.classList.remove('show'); void tv.offsetWidth; tv.classList.add('show')
  document.body.classList.add('dim')
  sfx.whoosh()
  setTimeout(() => tvFrame.focus(), 400)
}
function closeGame(result) {
  game.open = false
  tv.hidden = true
  tv.classList.remove('won')
  // unload the game so its music and loop stop; it reloads fresh next time
  tvFrame.removeAttribute('src')
  tvFrame.src = 'about:blank'
  tvFrame.removeAttribute('src')
  setStatus(`score <b>0</b> / ${KEY_SCORE} for the key`)
  document.body.classList.remove('dim')
  if (result === 'won' && story.unlocked) {
    say('show-off.', { mood: 'smug', arms: ['hips'], hold: 1400 })
  } else if (result === 'won') {
    story.busy = true
    say("ok ok. you're good.", { mood: 'happy', hold: 500, then: () => hiccup('happy') })
  } else if (result === 'pity' && story.unlocked) {
    say('the leaderboard will wait.', { mood: 'happy', hold: 1400 })
  } else if (result === 'pity') {
    story.busy = true
    say('i feel bad. here.', { mood: 'sulk', hold: 500, then: () => hiccup('sulk') })
  } else {
    say(game.tries ? 'quitter.' : 'scared?', { mood: 'smug', arms: ['hips'], hold: 900, then: offerGame })
  }
}
function setStatus(html) { tvStatus.innerHTML = html }

addEventListener('message', (e) => {
  if (e.source !== tvFrame.contentWindow || e.origin !== new URL(gameOrigin).origin) return
  const d = e.data
  if (!d || d.source !== 'spacevibes' || d.type !== 'state') return
  if (d.phase === 'playing') setStatus(`score <b>${d.score}</b> / ${KEY_SCORE} for the key`)
  if (!game.won && d.score >= KEY_SCORE) {
    game.won = true
    tv.classList.add('won')
    sfx.clink()
  }
  if (game.won && d.phase === 'playing') setStatus(`score <b>${d.score}</b>`)
  if (d.phase === 'over' && game.open) {
    game.tries++
    if (game.won) setStatus('<b>key earned.</b> take it whenever.')
    else if (game.tries >= 2) setStatus(`scored <b>${d.score}</b>. <button class="tv-pity" type="button">the carrot feels bad. take the key →</button>`)
    else setStatus(d.score ? `scored <b>${d.score}</b>. so close. again?` : 'the asteroids won that one. again?')
  }
})
tv.querySelector('.tv-x').addEventListener('click', () => closeGame(game.won ? 'won' : null))
tv.querySelector('.tv-take').addEventListener('click', () => closeGame('won'))
tvStatus.addEventListener('click', (e) => { if (e.target.closest('.tv-pity')) closeGame('pity') })
addEventListener('keydown', (e) => { if (e.key === 'Escape' && game.open) closeGame(game.won ? 'won' : null) })

function offerGame() {
  preloadGame()
  say("play this mini game and i'll give you the key.", {
    mood: 'happy',
    arms: ['rest', 'pat'],
    acts: [
      { label: '▶ play space vibes', onClick: openGame },
      { label: 'no time? pick the lock →', kind: 'link', onClick: pickLock },
    ],
  })
}

function pickLock() {
  if (story.busy || story.keyOut) return
  story.busy = true
  say('ugh. fine.', { mood: 'sulk', hold: 400, then: () => hiccup('sulk') })
}

function hiccup(after = 'sulk') {
  hideBubble()
  mood('shock')
  squash.t = -0.1 // swell up
  setTimeout(() => {
    squash.t = 0
    squash.vel = 7 // and hic
    sfx.hic()
    spitKey()
    say('hic!', { mood: 'shock', hold: 500, then: () => {
      story.busy = false
      story.keyOut = true
      glanceAt(lockWorld(), 1600)
      say('there. drag it to the lock.', { mood: after, arms: ['rest', 'point'], hold: 2600 })
    } })
  }, 650)
}

function spitKey() {
  const from = torso.localToWorld(new V3(0, 0.9, 0.5))
  kp.pos.copy(from)
  if (story.atCabinet) kp.vel.set(-0.7, 2.6, 0.1)
  else kp.vel.set(1.05, 3.3, 0.55)
  kp.spin.set(9, 4, 13)
  kp.flying = true
  kp.resting = false
  key.visible = true
  key.position.copy(from)
}

/* ---------------- the drawer view ---------------- */
const dive = new Spring(0, 34, 11)
const shotDrawer = { dir: new V3(-0.04, 1.1, 0.8).normalize(), dist: 4 }
const backBtn = $('#back')
function enterDrawer() {
  if (story.inDrawer) return
  if (story.familyOpen) { story.familyOpen = false; adoptEl.hidden = true; recallMinis(); minis.forEach((f) => { f.pop.t = 0 }); personal.pull.t = 0; story.diveTo = null }
  story.inDrawer = true
  builds.pull.t = 8.4
  dive.t = 1
  hideBubble()
  sfx.whoosh()
  backBtn.hidden = false
  $('.hint').textContent = '( pick a file )'
}
function exitDrawer() {
  if (!story.inDrawer) return
  closeFile()
  story.inDrawer = false
  dive.t = 0
  backBtn.hidden = true
  $('.hint').textContent = '( psst: the files are open )'
  setTimeout(() => say('told you it was good.', { mood: 'smug', hold: 1500 }), 900)
}
backBtn.addEventListener('click', () => (story.familyOpen ? closeFamily() : exitDrawer()))

function openFile(id) {
  if (!story.inDrawer) { enterDrawer(); return }
  if (story.fileOpen) return
  const f = files.find((x) => x.id === id)
  story.fileOpen = id
  ;(story.seen ??= new Set()).add(id)
  backBtn.hidden = true
  sfx.whoosh()
  tween(0.4, (u) => { f.out = u * 0.7 }, () => desk.open(id))
}
function closeFile() {
  if (story.fileOpen && desk.isOpen) desk.close()
}

/* ---------------- the desk: where a pulled file opens ---------------- */
const desk = createDesk({
  sfx: { whoosh: () => sfx.whoosh(), paper: () => sfx.paper(), tap: () => sfx.blip() },
  // "adopt carroto →" in the agent carroto file: shut the folder, open the personal drawer (the adoption papers)
  onAction: (action) => {
    if (action !== 'adopt') return
    desk.close()
    setTimeout(() => { exitDrawer(); setTimeout(openFamily, 700) }, 450)
  },
  onClose: (id) => {
    const f = files.find((x) => x.id === id)
    story.fileOpen = null
    backBtn.hidden = !story.inDrawer
    if (f) tween(0.35, (u) => { f.out = (1 - u) * 0.7 })
  },
})

/* ---------------- dragging the key into the lock ---------------- */
const drag = { on: false, justEnded: false, target: new V3(), plane: new THREE.Plane(new V3(0, 0, 1), 0) }
const tweens = []
function tween(dur, fn, done) { tweens.push({ t0: t, dur, fn, done }) }

function startDrag() {
  if (!kp.resting || story.unlocked) return
  drag.on = true
  kp.resting = false
  keyGlint.material.opacity = 0
  drag.plane.constant = -(lockWorld().z + 0.22)
  drag.target.copy(key.position)
  canvas.style.cursor = 'grabbing'
  glanceAt(lockWorld(), 900)
  say('ooh.', { mood: 'shock', whisper: true, hold: 500 })
}
function moveDrag() {
  ray.setFromCamera(ndc, camera)
  const hit = new V3()
  if (ray.ray.intersectPlane(drag.plane, hit)) drag.target.copy(hit)
}
// forgiving: counts if the pointer or the key's tip lands within ~70px of the lock on screen
function nearLock() {
  const toScreen = (v) => { const p = v.clone().project(camera); return new THREE.Vector2((p.x * 0.5 + 0.5) * innerWidth, (-p.y * 0.5 + 0.5) * innerHeight) }
  const lock = toScreen(lockWorld())
  const tip = toScreen(drag.target.clone().add(new V3(0.32, 0, 0)))
  const ptr = toScreen(drag.target)
  return Math.min(lock.distanceTo(tip), lock.distanceTo(ptr)) < 70
}
function endDrag() {
  if (nearLock()) { insertKey(); drag.justEnded = true; return }
  drag.on = false
  drag.justEnded = true
  canvas.style.cursor = 'default'
  if (story.unlocked) return
  // missed: it drops back to the floor
  kp.pos.copy(key.position)
  kp.vel.set(0, 0.5, 0.4)
  kp.spin.set(2, 1, 3)
  kp.flying = true
  say('so close.', { mood: 'smug', hold: 900 })
}
function insertKey() {
  drag.on = false
  story.unlocked = true
  canvas.style.cursor = 'default'
  // parent the key to the drawer first, then slide it into the keyhole in the drawer's own space,
  // so it stays in the lock however far the drawer moves afterwards
  const dr = drawers[0]
  dr.d.attach(key)
  key.rotation.order = 'YXZ'
  const lp = dr.lock.position
  const hole = new V3(lp.x, lp.y + 0.008, lp.z + 0.05)
  const from = key.position.clone(), r0 = key.rotation.clone()
  const out = hole.clone().add(new V3(0, 0, 0.3)) // bow sticks out toward you, tip in the keyhole
  tween(0.24, (u) => {
    key.position.lerpVectors(from, out, u)
    key.rotation.set(r0.x * (1 - u), r0.y + (Math.PI / 2 - r0.y) * u, r0.z * (1 - u))
  }, () => {
    sfx.clink()
    tween(0.35, (u) => { key.rotation.x = (Math.PI / 2) * u }, () => {
      sfx.clunk()
      dr.pull.t = 8.4 // all the way out, so every file is visible
      remember({ unlocked: true })
      squash.vel += 5
      say('ta-da!', {
        mood: 'happy', arms: ['wave'], hold: 900,
        then: () => say('go on. have a look.', {
          mood: 'happy',
          acts: [{ label: 'open the files →', onClick: enterDrawer }],
        }),
      })
    })
  })
}

/* ---------------- the photocopier and the bribe ---------------- */
const DISPOSABLE = ['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mintemail.com', 'mohmal.com', 'emailondeck.com']
const copyEl = document.createElement('div')
copyEl.className = 'copy'
copyEl.hidden = true
copyEl.innerHTML = `
  <div class="copy-sheet" role="dialog" aria-label="The photocopy">
    <p class="cp-head"><span>copy-o-matic · 1 of 1</span><span>subject: daphne</span></p>
    <div class="cp-stamp" aria-hidden="true">denied</div>
    <div class="cp-body">
      <dl class="cp-rec"><div><dt>document</dt><dd>resume</dd></div><div><dt>clearance</dt><dd>insufficient</dd></div><div><dt>reason</dt><dd>the carrot said no</dd></div></dl>
      <p class="cp-p">This copier only prints for people the carrot trusts. Good news: the carrot can be bribed.</p>
      <form class="cp-form" novalidate>
        <label>where are you from?<input name="from" autocomplete="organization" placeholder="company, studio, planet" maxlength="120" /></label>
        <label>your email<input name="email" type="email" autocomplete="email" placeholder="you@work.com" maxlength="160" /></label>
        <fieldset><legend>your bribe</legend>
          <label class="chip"><input type="radio" name="bribe" value="a fresh carrot" checked /><span>a fresh carrot 🥕</span></label>
          <label class="chip"><input type="radio" name="bribe" value="carrot cake" /><span>carrot cake</span></label>
          <label class="chip"><input type="radio" name="bribe" value="a compliment" /><span>a compliment</span></label>
          <label class="chip"><input type="radio" name="bribe" value="a job offer" /><span>a job offer</span></label>
        </fieldset>
        <label>anything to add? <em>(optional)</em><input name="note" maxlength="280" placeholder="the carrot reads everything" /></label>
        <input class="cp-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <p class="cp-err" role="alert"></p>
        <div class="cp-acts"><button class="act" type="submit">slip it to the carrot →</button><button class="link" type="button" data-x>never mind</button></div>
        <p class="cp-fine">your email goes to daphne only. nothing else happens with it.</p>
      </form>
      <div class="cp-done" hidden>
        <p class="cp-done-h">bribe received.</p>
        <p class="cp-p">The carrot is considering your offer. If it goes well, the copy comes to your inbox.</p>
        <div class="cp-acts"><button class="act" type="button" data-x>back to the room</button></div>
      </div>
    </div>
  </div>`
document.body.appendChild(copyEl)
const cpForm = copyEl.querySelector('.cp-form'), cpErr = copyEl.querySelector('.cp-err'), cpDone = copyEl.querySelector('.cp-done')

function onCopier() {
  if (copy.busy || !story.revealed) return
  copy.busy = true
  copy.t0 = t
  copy.printing = -1
  printSheet.visible = false
  hideBubble()
  glanceAt(copier.localToWorld(new V3(0, 0.8, 0.3)), 2000)
  sfx.copier()
  const b = copier.userData.btn
  b.position.y = 0.812
  setTimeout(() => { b.position.y = 0.83 }, 180)
  setTimeout(() => {
    printSheet.visible = true
    Object.assign(sheet, { flying: true, age: 0, yaw: (Math.random() - 0.5) * 0.8 })
    sheet.pos.set(0, 0.4, 0.38)
    sheet.vel.set((Math.random() - 0.5) * 0.4, 1.3, 1.5)
  }, 900)
  setTimeout(() => {
    say('…nice try. that one’s classified.', {
      mood: 'smug', arms: ['hips'], hold: 700,
      then: () => { copy.busy = false; openCopy() },
    })
  }, 2300)
}
function openCopy() {
  cpErr.textContent = ''
  copyEl.hidden = false
  copyEl.classList.remove('show'); void copyEl.offsetWidth; copyEl.classList.add('show')
  document.body.classList.add('dim')
  setTimeout(() => { sfx.clunk() }, 380)
}
function closeCopy() {
  copyEl.hidden = true
  document.body.classList.remove('dim')
  if (!cpDone.hidden) say('i’ll put in a good word. maybe.', { mood: 'happy', hold: 1600 })
}
copyEl.addEventListener('click', (e) => { if (e.target === copyEl || e.target.closest('[data-x]')) closeCopy() })
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !copyEl.hidden) closeCopy() })
cpForm.addEventListener('input', () => { cpErr.textContent = '' })
cpForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(cpForm))
  const email = String(d.email || '').trim().toLowerCase()
  const domain = email.split('@')[1] || ''
  if (String(d.from || '').trim().length < 2) return (cpErr.textContent = 'tell the carrot where you’re from.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return (cpErr.textContent = 'that email doesn’t look real.')
  if (DISPOSABLE.includes(domain)) return (cpErr.textContent = 'the carrot doesn’t take throwaway emails.')
  const btn = cpForm.querySelector('button[type=submit]')
  btn.disabled = true
  btn.textContent = 'slipping it over…'
  try {
    const r = await fetch('/api/cv-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, email }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) cpErr.textContent = j.error || 'the carrot’s mailbox isn’t connected yet.'
    else { cpForm.hidden = true; cpDone.hidden = false; sfx.pip() }
  } catch {
    cpErr.textContent = 'the carrot’s mailbox isn’t connected yet.'
  } finally {
    btn.disabled = false
    btn.textContent = 'slip it to the carrot →'
  }
})

function onCarrot() {
  squash.vel += 5.5
  gaze.x.vel += (Math.random() - 0.5) * 2.5; gaze.y.vel += 1.6
  sfx.boing()
  if (story.busy) return
  const lines = ['hey!', 'that tickles.', 'eyes up here.', "i'm not telling you where the key is.", "…it's not in my belly."]
  const line = story.keyOut ? 'you already got the key. go on.' : lines[story.pokes++ % lines.length]
  say(line, { mood: story.pokes === 5 ? 'smug' : 'shock', arms: story.pokes === 5 ? ['rest', 'pat'] : ['rest'], hold: 1500, then: () => mood('happy') })
}

function rattle(dr) {
  dr.pull.vel += 2.6
  cabShake = 0.45
  sfx.clunk()
}

/* ================================================================== *
 *  input
 * ================================================================== */
const ndc = new THREE.Vector2(0, 0)
let hasPointer = false
const ray = new THREE.Raycaster()
const eyePlane = new THREE.Plane(new V3(0, 0, 1), -1.8)
const pointerWorld = new V3(0, 1.3, 4)
let hovered = null

function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  const hit = ray.intersectObjects(WORLD ? [torso] : [cab, torso, key, copier, plant], true)[0]
  return hit?.object.userData.tag ?? null
}

function wake() {
  story.lastInput = performance.now()
  if (story.sleeping) {
    story.sleeping = false
    squash.vel += 6
    say('i was awake.', { mood: 'shock', hold: 1200, then: () => mood('happy') })
  }
}

addEventListener('pointermove', (e) => {
  hasPointer = true
  wake()
  if (drag.on) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    moveDrag()
    return
  }
  if (miniMove(e)) return
  hovered = pick(e.clientX, e.clientY)
  if (!story.revealed && hovered !== 'carrot') hovered = null
  if (story.inDrawer && !hovered?.startsWith('file:')) hovered = null
  if (story.fileOpen) hovered = null
  canvas.style.cursor = hovered === 'key' && kp.resting ? 'grab' : hovered ? 'pointer' : 'default'
})
canvas.addEventListener('pointerdown', (e) => {
  const tg = story.familyOpen || minis.some((f) => f.free) ? pick(e.clientX, e.clientY) : null
  if (tg?.startsWith('mini:')) { try { canvas.setPointerCapture(e.pointerId) } catch { /* ignore */ } miniDown(+tg.slice(5), e); return }
  if (story.revealed && pick(e.clientX, e.clientY) === 'key' && kp.resting) {
    canvas.setPointerCapture(e.pointerId)
    startDrag()
  }
})
canvas.addEventListener('pointerup', () => { if (miniUp()) return; if (drag.on) endDrag() })
canvas.addEventListener('click', (e) => {
  wake()
  if (miniDrag.swallowClick) { miniDrag.swallowClick = false; return }
  if (drag.justEnded || story.unlocked && pick(e.clientX, e.clientY) === 'key') { drag.justEnded = false; return }
  const tag = pick(e.clientX, e.clientY)
  if (!story.revealed) { if (tag === 'carrot') { squash.vel += 5; sfx.boing(); reveal() } return }
  if (tag === 'copier') { onCopier(); return }
  if (tag === 'plant') { plant.perk.vel += 3; say(story.atCabinet ? 'that’s fernando. i’ll water him later.' : 'that’s fernando. he’s thriving.', { mood: 'happy', hold: 1500 }); return }
  if (tag?.startsWith('mini:')) return
  if (tag?.startsWith('file:')) openFile(tag.slice(5))
  else if (story.unlocked && (tag === 'builds' || tag === 'lock')) enterDrawer()
  else if (tag === 'carrot') onCarrot()
  else if (tag === 'builds' || tag === 'lock') onDrawer(drawers[0])
  else if (tag === 'personal') onDrawer(drawers[1])
  else if (tag === 'key') say('drag it. to the lock.', { mood: 'smug', hold: 1400 })
})

/* ---------------- sound toggle + label font ---------------- */
const soundBtn = $('#sound')
soundBtn.onclick = () => { state.sound = !state.sound; soundBtn.textContent = `sound: ${state.sound ? 'on' : 'off'}`; if (state.sound) sfx.boing() }
document.fonts.load(`60px "${state.font}"`).then(() => { redrawLabels(); redrawFileTabs(); plant.userData.signTex.redraw() })

/* ---------------- layout ---------------- */
const shotCarrot = { target: new V3(-1.0, 1.28, 0.1), dist: 10 }
const shotRoom = { target: new V3(0.55, 1.3, 0), dist: 12 }
function fit(needW, needH) {
  const f = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
  return Math.max(needH / 2 / f, needW / 2 / (f * camera.aspect))
}
function resize() {
  if (RENDER) return
  const w = innerWidth, h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  shotCarrot.dist = fit(w < 640 ? 2.5 : 3.2, 3.1)
  shotRoom.dist = fit(w < 640 ? 5.9 : 6.1, 3.0)
  shotDrawer.dist = fit(w < 640 ? 1.5 : 1.85, 1.95)
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

/* ================================================================== *
 *  loop
 * ================================================================== */
const clock = new THREE.Clock()
const camDir = new V3(0, 0.22, 1).normalize()
let nextBlink = 1.5, blinkT = -1, nextGlance = 8, nextGlint = 3, glintT = -1, t = 0

// keep a limb point outside the carrot's body, whatever the pose asks for
function outside(p, margin = 0.06) {
  if (p.y < 0 || p.y > 1.6) return p
  const r = radiusAt(Math.min(p.y, 1.55)) + margin
  const d = Math.hypot(p.x, p.z)
  if (d < r) {
    if (d < 1e-4) p.x = r
    else { p.x *= r / d; p.z *= r / d }
  }
  return p
}

function updateArms(dt) {
  for (const a of arms) {
    const s = a.side
    const [eT, hT] = POSES[a.pose](s, a.sh)
    if (a.pose === 'pat') hT.y += Math.sin(t * 13) * 0.035
    if (a.pose === 'wave') hT.x += Math.sin(t * 9) * 0.06
    if (a.pose === 'tap') hT.x -= Math.max(0, Math.sin(t * 11)) * 0.035
    if (a.pose === 'rest' && !reduce) { hT.y += Math.sin(t * 2 + s) * 0.006; hT.x += Math.sin(t * 1.3 + s) * 0.004 }
    outside(eT, 0.05); outside(hT, 0.07)
    // the elbow leads, the hand follows through
    a.elbow.lerp(eT, 1 - Math.exp(-16 * dt))
    a.hand.lerp(hT, 1 - Math.exp(-12 * dt))
    outside(a.elbow, 0.04); outside(a.hand, 0.06)
    const w = (k) => (reduce ? 0 : Math.sin(t * 2.2 - k * 1.2 + s) * 0.005 * k)
    const pts = [
      a.sh,
      outside(a.sh.clone().lerp(a.elbow, 0.55).add(new V3(0, w(1), w(1) * 0.5)), 0.03),
      a.elbow.clone().add(new V3(0, w(2), 0)),
      outside(a.elbow.clone().lerp(a.hand, 0.55).add(new V3(0, w(3), 0)), 0.05),
      a.hand,
    ]
    const path = new THREE.CatmullRomCurve3(pts).getPoints(14)
    for (let i = 1; i < path.length; i++) outside(path[i], 0.05)
    taperTube(a.m.geometry, path, 0.032, 0.017, 22, 9)
    const dir = a.hand.clone().sub(a.elbow).normalize()
    drawRootlets(a.fingers, a.hand, dir, s, 0.55, 0.1, a.pose === 'pat' ? 0.12 : 0.035)
  }
}

function frame() {
  const dt = RENDER ? 1 / REC.fps : Math.min(clock.getDelta(), 0.05)
  t += dt
  const now = performance.now()

  // intro: cabinet drops in, then the carrot pops up
  cabDrop.t = 0
  cab.position.y = Math.max(0, cabDrop.step(dt))
  if (t > 0.55) carrotPop.t = 1
  carrot.scale.setScalar(Math.max(0.001, carrotPop.step(dt)))
  if (t > 1.5 && fontsReady && !story.introduced && !RENDER && !WORLD) { story.introduced = true; intro() }

  // cabinet rattle
  if (cabShake > 0) cabShake = Math.max(0, cabShake - dt)
  cab.rotation.z = Math.sin(t * 70) * 0.016 * (cabShake / 0.45)
  cab.position.x = 1.3 + Math.sin(t * 55) * 0.012 * (cabShake / 0.45)
  for (const f of files) {
    f.lift.t = story.inDrawer && !story.fileOpen && hovered === `file:${f.id}` ? 1 : 0
    f.g.position.y = f.baseY + f.lift.step(dt) * 0.13 + f.out
  }
  for (const dr of drawers) {
    dr.hov.t = hovered === dr.name || (hovered === 'lock' && dr === drawers[0]) ? 1 : 0
    dr.d.position.z = dr.baseZ + dr.pull.step(dt) * 0.1 + dr.hov.step(dt) * 0.012
    dr.handle.rotation.x = reduce ? 0 : Math.sin(t * 26) * 0.07 * dr.hov.v
  }

  // carrot body: squash, breathe, lean toward the pointer
  const sq = squash.step(dt)
  const breathe = reduce ? 0 : Math.sin(t * 2.1) * 0.012
  torso.scale.set(1 + sq * 0.55 - breathe * 0.4, 1 - sq + breathe, 1 + sq * 0.55 - breathe * 0.4)
  const px = hasPointer ? ndc.x : 0, py = hasPointer ? ndc.y : 0
  torso.rotation.y = damp(torso.rotation.y, px * 0.32, 4, dt)
  const ln = lean.step(dt)
  torso.rotation.x = damp(torso.rotation.x, -py * 0.06 + ln * 0.2, 4, dt)
  torso.rotation.z = damp(torso.rotation.z, idle.name === 'hum' ? Math.sin(t * 3.4) * 0.08 : 0, 5, dt)
  torso.position.z = ln * 0.14
  for (const l of leaves) l.tilt.rotation.z = l.base + (reduce ? 0 : Math.sin(t * 1.6 + l.ph) * 0.05 - sq * 0.5)
  updateIdle()
  updateWalk(dt)
  if (RENDER) renderPose(dt)
  if (WORLD === 'meadow') updateMeadow(dt)
  updateFamily(dt)
  updatePlant(dt)
  {
    const run = copy.t0 >= 0 ? t - copy.t0 : 99
    copier.position.x = 2.62 + (run < 1.8 ? Math.sin(t * 64) * 0.006 : 0)
    copierLight.emissiveIntensity = run < 1.8 ? (Math.sin(t * 22) > 0 ? 1.4 : 0.1) : 0.6
    if (sheet.flying) {
      // paper: light, draggy, flutters as it falls
      sheet.age += dt
      sheet.vel.y = Math.max(sheet.vel.y - 3.2 * dt, -0.7)
      sheet.vel.x *= Math.pow(0.35, dt); sheet.vel.z *= Math.pow(0.35, dt)
      sheet.pos.addScaledVector(sheet.vel, dt)
      sheet.pos.x += Math.sin(sheet.age * 5) * 0.25 * dt
      const f = Math.max(0, 1 - sheet.age / 2.2)
      printSheet.rotation.set(-Math.PI / 2 + Math.sin(sheet.age * 7) * 0.5 * f, sheet.yaw + sheet.age * 0.6, Math.sin(sheet.age * 5.3) * 0.35 * f)
      bendSheet(0.5 * f + Math.sin(sheet.age * 9) * 0.2 * f, Math.sin(sheet.age * 11) * f)
      if (sheet.pos.y <= 0.004) {
        sheet.pos.y = 0.004
        sheet.flying = false
        printSheet.rotation.set(-Math.PI / 2, sheet.yaw + sheet.age * 0.6, 0)
        bendSheet(0.06, 0)
      }
      printSheet.position.copy(sheet.pos)
    }
  }
  updateArms(dt)
  updateLegs()
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i], u = Math.min(1, (t - tw.t0) / tw.dur)
    tw.fn(u * u * (3 - 2 * u))
    if (u >= 1) { tweens.splice(i, 1); tw.done?.() }
  }
  if (drag.on) {
    key.position.lerp(drag.target, 1 - Math.exp(-18 * dt))
    key.rotation.x = damp(key.rotation.x, 0, 12, dt)
    key.rotation.y = damp(key.rotation.y, 0, 12, dt)
    key.rotation.z = damp(key.rotation.z, (drag.target.x - key.position.x) * -2, 10, dt)
    if (nearLock()) insertKey()
  }

  // where the eyes look
  if (hasPointer) {
    ray.setFromCamera(ndc, camera)
    ray.ray.intersectPlane(eyePlane, pointerWorld)
  } else pointerWorld.copy(camera.position)
  const look = lookOverride && now < lookUntil ? lookOverride : pointerWorld
  {
    const local = torso.worldToLocal(look.clone()).sub(eyeMid).normalize()
    let dx = local.x, dy = local.y
    const len = Math.hypot(dx, dy)
    const lim = 0.056
    if (len > 1e-4) { const m = Math.min(1, len * 1.6) * lim; dx = (dx / len) * m; dy = (dy / len) * m }
    gaze.x.t = dx; gaze.y.t = dy
    const ox = gaze.x.step(dt), oy = gaze.y.step(dt)
    for (const e of eyes) e.pupil.rotation.set(-Math.asin(oy / 0.14), Math.asin(ox / 0.14), 0)
  }

  // blinks (occasionally a double) and mood lids
  if (t > nextBlink && !story.sleeping) { blinkT = 0; nextBlink = t + 2.4 + Math.random() * 3.2; if (Math.random() < 0.2) nextBlink = t + 0.28 }
  if (blinkT >= 0) { blinkT += dt; if (blinkT > 0.12) blinkT = -1 }
  lidAngle.t = blinkT >= 0 ? 1.5 : lidOpen
  const la = lidAngle.step(dt)
  for (const e of eyes) e.lid.rotation.x = la

  for (const br of brows) {
    const lift = br.lift.step(dt), tilt = br.tilt.step(dt)
    br.m.position.y = br.base.y + lift
    br.m.rotation.z = Math.PI / 2 + tilt
  }
  const mp = mouthPop.step(dt)
  mouthPop.t = 1
  smile.scale.y = mp
  oMouth.scale.y = 1.1 * mp

  // idle glances at the cabinet, belly glints, and eventually a nap
  if (false && t > nextGlance) {
    glanceAt(story.keyOut ? key.position.clone() : lockWorld(), 1100)
    nextGlance = t + 7 + Math.random() * 5
  }
  if (!story.keyOut && t > nextGlint) { glintT = 0; nextGlint = t + 3.5 + Math.random() * 3 }
  if (glintT >= 0) { glintT += dt; if (glintT > 0.6) glintT = -1 }
  const g = glintT >= 0 ? Math.sin((glintT / 0.6) * Math.PI) : 0
  bellyGlint.material.opacity = g * 0.75
  if (!RENDER && story.revealed && !story.inDrawer && !story.familyOpen && !game.open && !story.sleeping && !story.busy && !idle.name && bubble.hidden && now - story.lastInput > 60000) {
    story.sleeping = true
    say('zzz', { mood: 'sleepy', hold: Infinity })
  }

  // key physics: arc, bounce, settle flat
  if (kp.flying) {
    kp.vel.y -= 9.8 * dt
    kp.pos.addScaledVector(kp.vel, dt)
    key.rotation.x += kp.spin.x * dt
    key.rotation.y += kp.spin.y * dt
    key.rotation.z += kp.spin.z * dt
    if (kp.pos.y < 0.03) {
      kp.pos.y = 0.03
      if (Math.abs(kp.vel.y) > 0.8) sfx.clink()
      kp.vel.y *= -0.42
      kp.vel.x *= 0.45
      kp.vel.z *= 0.45
      kp.spin.multiplyScalar(0.5)
      if (Math.abs(kp.vel.y) < 0.35) { kp.flying = false; kp.resting = true }
    }
    key.position.copy(kp.pos)
  }
  // keep the key on screen: wide desktop frames crop the top and the near floor
  if (kp.flying || kp.resting) {
    const sp = kp.pos.clone().project(camera), m = 0.75
    if (sp.y > m && kp.vel.y > 0) kp.vel.y *= 0.2
    if (sp.y < -m) { kp.vel.z = Math.min(kp.vel.z, 0); kp.pos.z -= 1.6 * dt }
    if (sp.x > m) { kp.vel.x = Math.min(kp.vel.x, 0); kp.pos.x -= 1.6 * dt }
    if (sp.x < -m) { kp.vel.x = Math.max(kp.vel.x, 0); kp.pos.x += 1.6 * dt }
    if (kp.resting) key.position.copy(kp.pos)
  }
  if (kp.resting) {
    key.rotation.x = damp(key.rotation.x, -Math.PI / 2, 8, dt)
    key.rotation.y = damp(key.rotation.y, 0, 8, dt)
    key.rotation.z = damp(key.rotation.z, 0.5, 8, dt)
    const kg = Math.max(0, Math.sin(t * 2.2)) ** 12
    keyGlint.position.copy(key.position).add(new V3(0.05, 0.1, 0.05))
    keyGlint.material.opacity = kg
  }

  // camera: gentle parallax
  const cx = reduce ? 0 : px * 0.35, cy = reduce ? 0 : py * 0.18
  // reveal: lights flicker on, then the camera eases back to show the cabinet
  const rt = story.revealAt ? t - story.revealAt : -1
  const light = rt < 0 ? 0 : rt < 0.07 ? 1 : rt < 0.16 ? 0.05 : rt < 0.23 ? 1 : rt < 0.36 ? 0.25 : 1
  const move = rt < 0 ? 0 : smooth(0.3, 1.9, rt)
  if (rt >= 0 && !story.flick) { story.flick = true; sfx.lights() }
  scene.background?.copy(BG_DARK).lerp(BG_LIT, light)
  sun.intensity = 2.3 * light
  hemi.intensity = 0.2 + 0.35 * light
  scene.environmentIntensity = 0.26 + 0.44 * light
  spot.intensity = 3.2 * (1 - light)
  spot.castShadow = light < 0.99
  pool.material.opacity = 1 - light
  ground.material.opacity = 0.16 + 0.1 * (1 - light)
  document.body.classList.toggle('dark', light < 0.5)
  camTarget.lerpVectors(shotCarrot.target, shotRoom.target, move)
  camDist = shotCarrot.dist + (shotRoom.dist - shotCarrot.dist) * move
  const dv = Math.min(1, Math.max(0, dive.step(dt)))
  if (dv > 0.0005) {
    camTarget.lerp((story.diveTo || inner).localToWorld(new V3(0, -0.02, -0.5)), dv)
    camDist += (shotDrawer.dist - camDist) * dv
  }
  const dir = camDir.clone().lerp(shotDrawer.dir, dv).normalize()
  camera.position.copy(camTarget).addScaledVector(dir, camDist)
  camera.position.x += cx * (1 - dv * 0.8)
  camera.position.y += cy * (1 - dv * 0.8)
  camera.lookAt(camTarget)
  if (RENDER) renderShot()
  if (WORLD === 'meadow') meadowShot(dt)

  // keep the bubble on the carrot's head
  if (!bubble.hidden && WORLD) {
    // in the meadow: tucked right beside his head, whichever way he's facing
    camera.updateMatrixWorld() // the camera just moved this frame; project with where it is now
    const head = carrot.position.clone().add(new V3(0, BY + 1.3, 0))
    const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0)
    const side = head.clone().addScaledVector(right, 0.62).add(new V3(0, 0.25, 0)).project(camera)
    const sx = (side.x * 0.5 + 0.5) * innerWidth, sy = (-side.y * 0.5 + 0.5) * innerHeight
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight
    bubble.style.left = `${Math.min(Math.max(16, sx), innerWidth - bw - 16)}px`
    bubble.style.top = `${Math.min(Math.max(16, sy - bh), innerHeight - bh - 16)}px`
  } else if (!bubble.hidden) {
    const p = carrot.localToWorld(new V3(0.22, BY + 2.02, 0)).project(camera)
    const sx = (p.x * 0.5 + 0.5) * innerWidth
    const sy = (-p.y * 0.5 + 0.5) * innerHeight
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight
    bubble.style.left = `${Math.min(Math.max(16, sx - 14), innerWidth - bw - 16)}px`
    bubble.style.top = `${Math.min(Math.max(70, sy - bh - 12), innerHeight - bh - 70)}px`
  }

  renderer.render(scene, camera)
  if (RENDER) { recordFrame(); return }
  requestAnimationFrame(frame)
}

requestAnimationFrame(() => { canvas.classList.add('ready'); frame() })

/* ================================================================== *
 *  RENDER MODE (?render=walk): frames for the dock pet
 *  Matches lil-agents' character videos: 1080x1920, 10s, the character
 *  stands 0-3s, eases into a walk (3-3.75s), walks in place (to 7.5s),
 *  eases out (to 8.25s) and stands again. The app slides the window, so
 *  he walks on the spot, facing right. Frames POST to the dev server,
 *  which writes them next to the carroto repo (see vite.config.ts).
 * ================================================================== */
// tricks (water, yoga) start and end in the walk video's standing pose so the clips join up
const TRICKS = {
  water: { dur: 7, idle: 'water', at: 1.3, face: -0.95 },
  yoga: { dur: 9.4, idle: 'yoga', at: 0.9, face: 0 },
}
// the standing loop that plays between walks; 12s so breathing and leaf sway wrap round cleanly
const IDLE_LOOP = 12
// short clips the dock app plays on cue: lunch alarm, nap (doze / sleep loop / wake), held up (dangle loop / land)
const CLIPS = { pfp: 0.1, rick: 0.1, lunch: 6.5, doze: 4.8, sleep: 6, wake: 2.4, dangle: 2, land: 1.4, focusin: 1.2, focus: 6, focusout: 2.4, eat: 6, cheer: 2.4, watchin: 1.8, watch: 6, watchout: 1.4 }
const REC = { fps: 24, dur: TRICKS[RENDER]?.dur ?? CLIPS[RENDER] ?? (RENDER === 'idle' ? IDLE_LOOP : 10), warm: 2, n: 0, phase: 0, speed: 0, started: false }
const potPop = new Spring(0, 120, 11)
const clockProp = new THREE.Group()
// the nap: a pillow he pulls out and lies down on
const pillow = new THREE.Group()
const pillowPop = new Spring(0, 150, 12)
// the pillow lies across his head, at right angles to his body
const PILLOW_YAW = () => LIE.yaw + Math.PI / 2
const LIE = { yaw: -0.8, roll: Math.PI / 2 - 0.1, x: 0.88, y: 0.5, z: -1.1 } // lying on his side, head back and to the left
const lieShadow = contact(2.2, 1.1)
// colleague props: a tiny desk + laptop for focusing, a bento and onigiri for lunch, confetti
const desk3d = new THREE.Group(), bento = new THREE.Group(), onigiri = new THREE.Group(), confetti = []
const propPop = new Spring(0, 150, 12)
// watch party: a striped popcorn bucket
const popcorn = new THREE.Group()
const clockPop = new Spring(0, 150, 12)
function walkSpeed(u) {
  if (u < 3 || u > 8.25) return 0
  if (u < 3.75) return smooth(3, 3.75, u)
  if (u < 7.5) return 1
  return 1 - smooth(7.5, 8.25, u)
}
if (RENDER) {
  document.body.classList.add('render')
  for (const o of [cab, plant, copier, key, keyGlint, ground, pool, can]) o.visible = false
  // a pocket-sized fernando for the dock, popped out just for the watering
  if (RENDER === 'water') { plant.visible = true; plant.position.set(-0.72, 0, 0.25); plant.rotation.y = 0.5 }
  if (RENDER === 'lunch') {
    const red = mat('#e8452c', { roughness: 0.35, clearcoat: 0.8 }), brass = mat('#e2b54a', { roughness: 0.3, metalness: 0.6 })
    const body = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 32), red)
    body.rotation.x = Math.PI / 2
    const face = mesh(new THREE.CircleGeometry(0.11, 32), mat('#fbf6ea', { roughness: 0.6 }))
    face.position.z = 0.036
    const hand = (len, w, rot) => { const h = mesh(new THREE.BoxGeometry(w, len, 0.006), mat(C.ink)); h.geometry.translate(0, len / 2, 0); h.position.z = 0.04; h.rotation.z = rot; return h }
    const bells = [-1, 1].map((sd) => { const b = mesh(new THREE.SphereGeometry(0.055, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass); b.position.set(sd * 0.085, 0.12, 0); b.rotation.z = -sd * 0.5; return b })
    const feet = [-1, 1].map((sd) => { const f = mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.05, 8), brass); f.position.set(sd * 0.08, -0.13, 0); f.rotation.z = sd * 0.5; return f })
    clockProp.add(body, face, hand(0.07, 0.014, -0.35), hand(0.095, 0.009, 0), ...bells, ...feet)
    torso.add(clockProp)
    clockProp.scale.setScalar(0.001)
  }
  if (['doze', 'sleep', 'wake'].includes(RENDER)) {
    const cloth = mat('#fbf6ea', { roughness: 0.7 }), stripe = mat(C.cobalt, { roughness: 0.6 })
    const cushion = mesh(new RoundedBoxGeometry(0.95, 0.24, 0.62, 4, 0.11), cloth)
    const band = mesh(new RoundedBoxGeometry(0.12, 0.245, 0.625, 2, 0.04), stripe)
    band.position.x = 0.26
    pillow.add(cushion, band)
    pillow.scale.setScalar(0.001)
    scene.add(pillow)
    lieShadow.material.opacity = 0
    scene.add(lieShadow)
  }
  if (['focusin', 'focus', 'focusout'].includes(RENDER)) {
    const wood = mat('#e9c99a', { roughness: 0.6 }), panel = mat(C.cobalt, { roughness: 0.4, clearcoat: 0.5 })
    const top = mesh(new RoundedBoxGeometry(1.35, 0.07, 0.62, 3, 0.03), wood)
    top.position.y = 0.72
    const front = mesh(new RoundedBoxGeometry(1.3, 0.62, 0.05, 3, 0.02), panel)
    front.position.set(0, 0.38, 0.27)
    const legs = [-1, 1].map((sd) => { const l = mesh(new RoundedBoxGeometry(0.05, 0.7, 0.55, 2, 0.02), panel); l.position.set(sd * 0.62, 0.35, 0); return l })
    // laptop, screen facing him, lid back to you (with a little carrot sticker)
    const grey = mat('#cfd3da', { roughness: 0.3, metalness: 0.5 })
    const base = mesh(new RoundedBoxGeometry(0.56, 0.03, 0.38, 2, 0.012), grey)
    base.position.set(0, 0.77, 0.02)
    const lid = mesh(new RoundedBoxGeometry(0.56, 0.36, 0.02, 2, 0.01), grey)
    lid.geometry.translate(0, 0.18, 0)
    lid.position.set(0, 0.785, 0.2); lid.rotation.x = 0.28
    const sticker = mesh(new THREE.CircleGeometry(0.05, 20), mat(C.orange, { roughness: 0.5 }))
    sticker.position.set(0, 0.2, 0.012); lid.add(sticker)
    const mug = mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.12, 20), mat('#fbf6ea', { roughness: 0.5 }))
    mug.position.set(0.47, 0.82, 0.08)
    desk3d.add(top, front, ...legs, base, lid, mug)
    desk3d.position.set(0.05, 0, 0.62)
    desk3d.rotation.y = 0.35
    desk3d.add(contact(1.6, 0.9))
    desk3d.scale.setScalar(0.001)
    scene.add(desk3d)
  }
  if (['watchin', 'watch', 'watchout'].includes(RENDER)) {
    const stripes = canvasTex(256, 64, (g, w, h) => {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fbf6ea' : '#e0412c'; g.fillRect((i * w) / 8, 0, w / 8 + 1, h) }
    })
    const bucket = mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.28, 32, 1, true), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5, side: THREE.DoubleSide }))
    const bottom = mesh(new THREE.CircleGeometry(0.12, 24), mat('#e0412c'))
    bottom.rotation.x = Math.PI / 2; bottom.position.y = -0.14
    popcorn.add(bucket, bottom)
    const kernel = mat('#fff4d2', { roughness: 0.8 }), butter = mat('#ffd98a', { roughness: 0.7 })
    const r = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
    for (let i = 0; i < 26; i++) {
      const a = r(i, 1) * Math.PI * 2, d = Math.sqrt(r(i, 2)) * 0.14
      const k = mesh(new THREE.IcosahedronGeometry(0.035 + r(i, 3) * 0.02, 1), i % 4 ? kernel : butter)
      k.position.set(Math.cos(a) * d, 0.14 + (0.14 - d) * 0.5 + r(i, 4) * 0.04, Math.sin(a) * d)
      popcorn.add(k)
    }
    torso.add(popcorn)
    popcorn.scale.setScalar(0.001)
  }
  if (RENDER === 'eat') {
    const red = mat('#d8452e', { roughness: 0.4, clearcoat: 0.5 }), rice = mat('#fbf6ea', { roughness: 0.8 }), nori = mat('#23302a', { roughness: 0.7 })
    const box = mesh(new RoundedBoxGeometry(0.42, 0.12, 0.28, 3, 0.03), red)
    const inside = mesh(new RoundedBoxGeometry(0.38, 0.02, 0.24, 2, 0.01), rice)
    inside.position.y = 0.055
    const bits = [['#58b862', -0.1], ['#f47b20', 0.02], ['#ffcf5c', 0.12]].map(([c, x]) => { const b = mesh(new THREE.SphereGeometry(0.04, 12, 8), mat(c, { roughness: 0.5 })); b.position.set(x, 0.075, 0); return b })
    bento.add(box, inside, ...bits)
    torso.add(bento)
    const ball = mesh(new THREE.ConeGeometry(0.1, 0.16, 3, 1), rice)
    ball.geometry.rotateX(Math.PI / 2); ball.geometry.rotateZ(Math.PI)
    const wrap = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.03), nori)
    wrap.position.set(0, -0.05, 0.005)
    onigiri.add(ball, wrap)
    torso.add(onigiri)
  }
  if (RENDER === 'cheer') {
    const cols = ['#f47b20', '#2338d4', '#58b862', '#ff8b8b', '#ffcf5c', '#8a5cf6']
    for (let i = 0; i < 70; i++) {
      const c = mesh(new THREE.PlaneGeometry(0.06, 0.1), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.6 }), { cast: false })
      const r = (k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
      c.userData = { x: (r(1) - 0.5) * 1.5, z: (r(2) - 0.3) * 0.9, delay: r(3) * 0.35, spin: 3 + r(4) * 6, drift: r(5) * 6, vy: 2.4 + r(6) * 1.2 }
      c.visible = false
      confetti.push(c); scene.add(c)
    }
  }
  // ?render=rick: long, straight, glossy black hair with a centre part (a rick owens moment). One still.
  if (RENDER === 'rick') {
    tie.visible = false
    top.position.y = 1.5 // sit the leafy top down into the hair
    top.children.filter((o) => o.isMesh && o.geometry?.type === 'TubeGeometry').forEach((o) => { o.visible = false })
    const hairMat = mat('#0d0c0f', { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.18, metalness: 0.1 })
    const rnd = (i, k) => { const x = Math.sin(i * 91.7 + k * 37.1) * 43758.5453; return x - Math.floor(x) }
    const hair = new THREE.Group()
    // one heavy, glossy curtain: a smooth sheet (not separate strands) with fine strand grooves,
    // parted in the middle, open at the face, falling straight once the carrot narrows
    const COLS = 220, ROWS = 64, GAP = 0.84
    const pos = []
    for (let c = 0; c <= COLS; c++) {
      const u = c / COLS
      // all the way round the head; over the face it stops at a hairline above the brows
      const th = u * Math.PI * 2
      const a = th > Math.PI ? th - Math.PI * 2 : th
      const side = Math.sign(a) || 1
      const long = 0.24 + 0.05 * Math.sin(u * 23) + 0.03 * Math.sin(u * 61) - 0.06 * Math.cos(u * Math.PI * 2) // blunt, a little uneven
      const face = 1 - smooth(GAP * 0.72, GAP, Math.abs(a)) // 1 over the face, 0 at the sides
      const endY = long + (1.43 - long) * face
      let rMax = 0
      for (let k = 0; k <= ROWS; k++) {
        const t = k / ROWS
        const y = 1.64 - t * (1.64 - endY) // from the very top of the crown
        const ang = side * 0.02 + (a - side * 0.02) * Math.min(1, t / 0.12) // fans out from the centre part
        rMax = Math.max(rMax, radiusAt(Math.min(y, 1.572)) + 0.045)
        const r = rMax + t * t * 0.04 + 0.006 * Math.sin(u * 420) // strand grooves
        pos.push(Math.sin(ang) * r, y, Math.cos(ang) * r)
      }
    }
    const idx = []
    for (let c = 0; c < COLS; c++) for (let k = 0; k < ROWS; k++) {
      const i0 = c * (ROWS + 1) + k, i1 = (c + 1) * (ROWS + 1) + k
      idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    const sheet = mesh(g, mat('#0d0c0f', { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.15, side: THREE.DoubleSide }))
    hair.add(sheet)
    // a smooth cap over the crown so no scalp shows between strands
    const cap = mesh(new THREE.SphereGeometry(0.5, 40, 20, 0, Math.PI * 2, 0, 0.9), hairMat)
    cap.scale.set(1.05, 0.62, 1.05)
    cap.position.y = 1.2
    hair.add(cap)
    torso.add(hair)
  }
  // held up: his shadow stays on the ground below him
  if (RENDER === 'dangle') { const sh = carrot.children.find((o) => o.material?.map === BLOB); sh.position.y = 0.003 - 0.22; sh.scale.setScalar(0.8); sh.material.opacity = 0.6 }
  scene.background = null
  Object.assign(story, { introduced: true, revealed: true, revealAt: -60, flick: true, busy: true })
  state.sound = false
  renderer.setPixelRatio(1)
  // ?render=pfp: a square, right-up-to-the-lens close-up for a profile picture
  const square = RENDER === 'pfp'
  renderer.setSize(1080, square ? 1080 : 1920, false)
  camera.aspect = square ? 1 : 1080 / 1920
  if (square) camera.fov = 44
  camera.updateProjectionMatrix()
  mood('happy')
}
function renderPose(dt) {
  const u = t - REC.warm
  const trick = TRICKS[RENDER]
  if (CLIPS[RENDER]) { renderClip(RENDER, u, dt); return }
  if (RENDER === 'idle') {
    // look along the dock, up at the menu bar, back at you, a little bounce, then settle where the walk video starts
    const ahead = carrot.localToWorld(new V3(0.2, 1.7, 3))
    const spots = [[0, ahead], [2.2, new V3(-3, 0.9, 2.5)], [4.2, new V3(1.5, 4.5, 3)], [6.2, camera.position.clone()], [9.6, ahead]]
    let look = ahead
    for (const [at, p] of spots) if (u >= at) look = p
    lookOverride = look; lookUntil = Infinity
    if (u > 7.6 && !REC.hopped) { REC.hopped = true; squash.vel += 5 }
    if (u > 6.2 && u < 9.4) setMood('happy')
    carrot.rotation.y = 0.5
    torso.rotation.y = 0
    pose(u > 6.4 && u < 7.4 ? 'wave' : 'rest', 'rest')
    return
  }
  if (trick) {
    idle.next = Infinity
    story.busy = false
    if (u >= trick.at && !REC.started) {
      REC.started = true
      idle.name = trick.idle; idle.t0 = t; idle.until = t + IDLES[trick.idle].dur
      IDLES[trick.idle].start()
    }
    // turn from the walk video's three-quarter pose to the trick and back again
    const endAt = trick.at + IDLES[trick.idle].dur
    const turn = smooth(trick.at - 0.6, trick.at, u) * (1 - smooth(endAt, endAt + 0.6, u))
    carrot.rotation.y = 0.5 + (trick.face + (idle.warrior ? 0.35 : 0) - 0.5) * turn
    torso.rotation.y = 0
    if (RENDER === 'water') {
      potPop.t = u > trick.at - 0.9 && u < endAt + 0.2 ? 0.62 : 0
      plant.scale.setScalar(Math.max(0.001, potPop.step(dt)))
    }
    lookOverride = RENDER === 'water' && turn > 0.5 ? plant.localToWorld(new V3(0, 0.7, 0)) : carrot.localToWorld(new V3(0.2, 1.7, 3))
    lookUntil = Infinity
    return
  }
  REC.speed = walkSpeed(u)
  REC.phase += dt * REC.speed * Math.PI * 2 * 1.6 // ~3 steps a second
  for (const L of legs) {
    const ph = REC.phase + (L.side > 0 ? 0 : Math.PI)
    L.lift = Math.max(0, Math.sin(ph)) * 0.09 * REC.speed
    L.swing = Math.cos(ph) * 0.075 * REC.speed
    L.out = 0; L.knee = 0
  }
  torso.position.y = BY + Math.abs(Math.sin(REC.phase)) * 0.04 * REC.speed
  torso.rotation.z = Math.sin(REC.phase) * 0.035 * REC.speed
  pose(REC.speed > 0.05 ? 'walk' : 'rest')
  // three-quarters toward the viewer, turning further right as he walks
  carrot.rotation.y = 0.5 + 0.45 * REC.speed
  torso.rotation.y = 0
  lookOverride = carrot.localToWorld(new V3(0.2, 1.7, 3)); lookUntil = Infinity
}
// render clips set moods every frame; only apply a change, or the mouth's pop animation keeps restarting
let recMood = null
function setMood(n) { if (recMood !== n) { recMood = n; mood(n) } }
// lying down on his side, k: 0 standing -> 1 lying
function lie(k) {
  carrot.rotation.set(0, 0.5 + (LIE.yaw - 0.5) * k, LIE.roll * k)
  // mid-swing his head sweeps out left, so nudge him right on the way down (and up)
  carrot.position.set(LIE.x * k + 0.4 * Math.sin(k * Math.PI), LIE.y * Math.sin(k * Math.PI / 2), LIE.z * k)
  const own = carrot.children.find((o) => o.material?.map === BLOB)
  if (own) own.visible = k < 0.25
  lieShadow.material.opacity = smooth(0.2, 0.8, k) * 0.9
}
// where the pillow goes: under his head once he's lying down
function pillowSpot() {
  const keep = [carrot.rotation.clone(), carrot.position.clone()]
  lie(1); carrot.updateMatrixWorld(true)
  const head = carrot.localToWorld(new V3(0, BY + 1.25, 0))
  lieShadow.position.copy(carrot.localToWorld(new V3(0, BY + 0.7, 0))).setY(0.003)
  lieShadow.rotation.set(-Math.PI / 2, 0, LIE.yaw + Math.PI / 2)
  carrot.rotation.copy(keep[0]); carrot.position.copy(keep[1]); carrot.updateMatrixWorld(true)
  return head.setY(0.12).add(new V3(-0.32, 0, 0.12))
}
// eyes shut, breathing slowly, lying on the pillow: shared by the doze, sleep and wake clips
function sleepPose(k, u) {
  story.sleeping = true // no blinking
  setMood('sleepy')
  lidOpen = -1.25 + (1.5 + 1.25) * k
  lie(k)
  torso.rotation.x = 0
  const br = Math.sin((u / 3) * Math.PI * 2) // 3s breaths, so the 6s loop wraps
  torso.scale.set(1 + br * 0.018 * k, 1 + br * 0.008 * k, 1 + br * 0.018 * k)
  pose('rest')
  for (const L of legs) { L.lift = 0; L.swing = 0.04 * k; L.out = 0; L.knee = 0.12 * k }
}
function renderClip(name, u, dt) {
  carrot.rotation.y = 0.5
  torso.rotation.y = 0
  const ahead = carrot.localToWorld(new V3(0.2, 1.7, 3))
  lookOverride = ahead; lookUntil = Infinity
  if (name === 'pfp') {
    // leaning into the lens: face-on, wide eyes, a little head tilt
    carrot.rotation.y = 0
    torso.rotation.set(0.14, 0, -0.08)
    setMood('happy'); lidOpen = -1.55; nextBlink = Infinity; blinkT = -1
    lookOverride = camera.position.clone(); lookUntil = Infinity
    pose('rest')
    return
  }
  if (name === 'rick') { pose('hips'); setMood('smug'); nextBlink = Infinity; blinkT = -1; lookOverride = camera.position.clone(); carrot.rotation.y = 0.35; return }
  if (name === 'lunch') {
    // pulls out an alarm clock, checks it, it rings, he jumps: lunch time
    clockPop.t = u > 0.6 && u < 5.3 ? 1 : 0
    clockProp.scale.setScalar(Math.max(0.001, clockPop.step(dt)))
    const hand = arms[1].hand
    clockProp.position.copy(hand).add(new V3(-0.02, 0.1, 0.06))
    const ring = u > 2.3 && u < 3.6
    clockProp.rotation.set(0.15, -0.5, ring ? Math.sin(u * 70) * 0.25 : 0)
    pose('rest', u > 0.6 && u < 5.3 ? 'clock' : 'rest')
    if (u > 1.1 && u < 2.3) { lookOverride = torso.localToWorld(clockProp.position.clone()); setMood('smug') }
    if (u > 2.3 && !REC.jumped) { REC.jumped = true; squash.vel += 7; setMood('shock') }
    if (u > 2.3 && u < 3.3) lookOverride = camera.position.clone()
    if (u > 3.3 && !REC.happy) { REC.happy = true; setMood('happy') }
    if (u > 3.3 && u < 5.3) { lookOverride = camera.position.clone(); pose('wave', 'clock') }
    carrot.rotation.y = 0.5 - 0.3 * smooth(0.4, 1.0, u) * (1 - smooth(5.3, 6.0, u))
    return
  }
  if (name === 'doze') {
    // yawn and stretch, pull out a pillow, drop it, lie down, eyes shut
    lie(0)
    if (u > -0.5) REC.spot ??= pillowSpot()
    if (!REC.spot) { pose('rest'); return }
    if (u < 0) { pose('rest'); return } // warm-up: standing, like the end of every other clip
    if (u < 1.1) { setMood('shock'); pose('stretch'); story.sleeping = true; lidOpen = -0.6; return }
    // pillow appears in his hand, then drops to the floor where his head will go
    pillowPop.t = 1
    pillow.scale.setScalar(Math.max(0.001, pillowPop.step(dt)))
    const held = torso.localToWorld(arms[0].hand.clone()).add(new V3(-0.05, -0.42, 0.3)) // his left hand: more room that side
    const drop = smooth(1.9, 2.4, u)
    pillow.position.lerpVectors(held, REC.spot, drop)
    pillow.position.y += Math.sin(drop * Math.PI) * 0.25
    pillow.rotation.set(0, PILLOW_YAW() * drop, (1 - drop) * 0.4)
    if (u < 1.9) { setMood('happy'); lidOpen = -0.9; pose('clock', 'rest'); lookOverride = held; return }
    lookOverride = REC.spot.clone()
    const k = smooth(2.5, 3.6, u)
    sleepPose(k, u)
    lidOpen = u < 3.3 ? -0.9 : -0.9 + 2.4 * smooth(3.3, 4.1, u)
    return
  }
  if (name === 'sleep') {
    lie(0)
    if (u > -0.5) REC.spot ??= pillowSpot()
    if (!REC.spot) { pose('rest'); return }
    pillow.scale.setScalar(1); pillow.position.copy(REC.spot); pillow.rotation.set(0, PILLOW_YAW(), 0)
    sleepPose(1, u)
    return
  }
  if (name === 'wake') {
    // startled awake: up on his feet, the pillow poofs away, back to standing like nothing happened
    lie(0)
    if (u > -0.5) REC.spot ??= pillowSpot()
    if (!REC.spot) { pose('rest'); return }
    pillow.position.copy(REC.spot); pillow.rotation.set(0, PILLOW_YAW(), 0)
    pillowPop.v = pillowPop.v || 1
    pillowPop.t = u > 0.7 ? 0 : 1
    pillow.scale.setScalar(Math.max(0.001, pillowPop.step(dt)))
    if (u < 0.15) { sleepPose(1, u); return }
    if (!REC.jumped) { REC.jumped = true; setMood('shock'); story.sleeping = false; lidOpen = -1.55 }
    const k = 1 - smooth(0.15, 0.65, u)
    lie(k)
    if (u > 0.65 && !REC.landed) { REC.landed = true; squash.vel += 5 }
    for (const L of legs) { L.lift = 0; L.swing = 0; L.out = 0; L.knee = 0 }
    lookOverride = camera.position.clone()
    if (u > 1.5 && !REC.happy) { REC.happy = true; setMood('happy') }
    if (u > 1.7) lookOverride = ahead
    pose(u < 0.9 ? 'stretch' : 'rest')
    return
  }
  if (name === 'watchin' || name === 'watch' || name === 'watchout') {
    // turn his back to us to face the screen, popcorn out, munching now and then
    const BACK = Math.PI - 0.45 // mostly back to us, the bucket side turned our way
    let turn = 1, have = 1
    if (name === 'watchin') { turn = smooth(0.2, 1.1, u); have = u > 0.5 ? 1 : 0 }
    if (name === 'watchout') { turn = 1 - smooth(0.3, 1.2, u); have = u < 0.35 ? 1 : 0 }
    carrot.rotation.y = 0.5 + (BACK - 0.5) * turn
    propPop.t = have
    if (name === 'watch') propPop.v = 1
    popcorn.scale.setScalar(Math.max(0.001, propPop.step(dt)))
    popcorn.position.copy(arms[1].hand).add(new V3(0.02, 0.12, 0.05))
    // a handful every 3s (twice per 6s loop, so it wraps)
    REC.munch = name === 'watch' ? Math.max(0, Math.sin((u / 3) * Math.PI * 2 - 1.3)) ** 2 : 0
    pose(turn > 0.4 ? 'munch' : 'rest', turn > 0.4 ? 'bucket' : 'rest')
    torso.rotation.z = name === 'watch' ? Math.sin((u / 6) * Math.PI * 2) * 0.02 : 0
    lookOverride = carrot.localToWorld(new V3(0, 1.6, 4)); lookUntil = Infinity
    setMood('happy')
    return
  }
  if (name === 'focusin' || name === 'focus' || name === 'focusout') {
    // a tiny desk pops up in front of him; he types; then stands and stretches as it pops away
    const k = name === 'focusin' ? smooth(0.1, 0.7, u) : name === 'focus' ? 1 : 1 - smooth(0.2, 0.8, u)
    propPop.t = name === 'focusout' && u > 0.2 ? 0 : name === 'focusin' && u < 0.1 ? 0 : 1
    if (name === 'focus') propPop.v = 1
    desk3d.scale.setScalar(Math.max(0.001, propPop.step(dt)))
    carrot.rotation.y = 0.5 - 0.2 * k
    const screen = desk3d.localToWorld(new V3(0, 0.95, 0.2))
    if (name === 'focusout' && u > 0.9) {
      lookOverride = u < 1.9 ? camera.position.clone() : ahead
      pose(u < 1.9 ? 'stretch' : 'rest')
      if (u > 0.9 && !REC.happy) { REC.happy = true; setMood('happy') }
      return
    }
    lookOverride = k > 0.5 ? screen : ahead
    if (k > 0.5) setMood('smug')
    // typing: hands bob on the keys, 2 taps a second per hand so the 6s loop wraps
    REC.type = u
    pose(k > 0.3 ? 'type' : 'rest')
    torso.rotation.x = 0.08 * k
    return
  }
  if (name === 'eat') {
    // bento in one hand, onigiri in the other, a bite every 3 seconds (2 per 6s loop)
    setMood('happy')
    const bite = Math.max(0, Math.sin((u / 3) * Math.PI * 2 - 1.2)) ** 3
    bento.position.copy(arms[0].hand).add(new V3(0.05, 0.02, 0.1)); bento.rotation.set(0.2, 0.3, 0)
    onigiri.position.copy(arms[1].hand).add(new V3(-0.02, 0.08, 0.06)); onigiri.rotation.set(0.3, -0.4, 0)
    const sc = 1 - 0.25 * smooth(0, 6, u) // it gets smaller as he eats (and pops back on the loop, like a fresh one)
    onigiri.scale.setScalar(sc)
    REC.bite = bite
    pose('bento', 'bite')
    lookOverride = bite > 0.3 ? torso.localToWorld(onigiri.position.clone()) : camera.position.clone()
    lidOpen = -1.25 + bite * 0.9
    torso.scale.set(1 + bite * 0.02, 1 - bite * 0.03, 1 + bite * 0.02)
    return
  }
  if (name === 'cheer') {
    // jump for joy, confetti everywhere
    if (u < 0) return
    setMood(u < 1.6 ? 'shock' : 'happy')
    if (u > 0.05 && !REC.jumped) { REC.jumped = true; squash.vel += 6 }
    const hop = Math.max(0, Math.sin(Math.min(1, (u - 0.2) / 0.6) * Math.PI)) * (u > 0.2 ? 1 : 0)
    carrot.position.y = hop * 0.16
    pose(u < 1.8 ? 'stretch' : 'rest')
    lookOverride = u < 1.8 ? camera.position.clone() : ahead
    for (const c of confetti) {
      const d = c.userData, v = u - 0.25 - d.delay
      c.visible = v > 0 && v < 2.2
      if (!c.visible) continue
      c.position.set(d.x + Math.sin(v * 3 + d.drift) * 0.12, 0.4 + d.vy * v - 2.2 * v * v, d.z)
      if (c.position.y < 0.02) c.position.y = 0.02
      c.rotation.set(v * d.spin, v * d.spin * 0.7, d.drift)
    }
    return
  }
  if (name === 'dangle') {
    // held up in the air: a slow swing, feet kicking, arms up (2s, loops)
    const w = (u / 2) * Math.PI * 2
    carrot.position.y = 0.22
    carrot.rotation.z = Math.sin(w) * 0.07
    setMood('shock')
    pose('stretch')
    for (const L of legs) {
      const ph = w * 2 + (L.side > 0 ? 0 : Math.PI)
      L.lift = 0.06 + Math.sin(ph) * 0.05; L.swing = Math.cos(ph) * 0.06; L.out = 0; L.knee = 0.1
    }
    for (const l of leaves) l.tilt.rotation.z = l.base + Math.sin(w + l.ph) * 0.06
    lookOverride = camera.position.clone()
    return
  }
  if (name === 'land') {
    // hits the dock, squashes, wobbles dizzily, then stands
    if (u < 0) { pose('rest'); return }
    if (!REC.jumped) { REC.jumped = true; squash.vel += 8; setMood('shock') }
    torso.rotation.z = Math.sin(u * 14) * 0.1 * Math.exp(-u * 2.5)
    if (u > 0.7 && !REC.happy) { REC.happy = true; setMood('happy') }
    lookOverride = u < 0.9 ? camera.position.clone().add(new V3(Math.sin(u * 20) * 2, 0, 0)) : ahead
    pose('rest')
  }
}
function renderShot() {
  if (RENDER === 'pfp') { camera.position.set(0.04, BY + 1.45, 3.1); camera.lookAt(0, BY + 1.36, 0.1); carrot.position.set(0, 0, 0); return }
  if (['doze', 'sleep', 'wake'].includes(RENDER)) { camera.position.set(0, 1.9, 8.4); camera.lookAt(0, 1.24, 0); return }
  if (RENDER === 'cheer') { camera.position.set(0, 1.9, 8.4); camera.lookAt(0, 1.24, 0); carrot.position.x = 0; carrot.position.z = 0; return }
  if (RENDER !== 'dangle') carrot.position.y = 0
  if (RENDER === 'dangle') { camera.position.set(0, 1.9, 8.4); camera.lookAt(0, 1.24, 0); carrot.position.x = 0; carrot.position.z = 0; return }
  // feet 15% up from the bottom edge, leaves near the top, like the lil-agents characters
  camera.position.set(0, 1.9, 8.4)
  camera.lookAt(0, 1.24, 0)
  carrot.position.set(0, 0, 0)
}
async function recordFrame() {
  const u = t - REC.warm
  if (u >= 0 && REC.n < REC.fps * REC.dur) {
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
    // keep trying this frame if the dev server hiccups, rather than silently stopping
    for (;;) {
      try { if ((await fetch(`/__frames?name=${RENDER}${GLASSES ? '-agent' : ''}&i=${REC.n}`, { method: 'POST', body: blob })).ok) break } catch { /* server restarting */ }
      await new Promise((r) => setTimeout(r, 1000))
    }
    REC.n++
    document.title = `rendering ${REC.n}/${REC.fps * REC.dur}`
    if (REC.n === REC.fps * REC.dur) { document.title = 'render done'; return }
  }
  setTimeout(frame, 0)
}

/* ================================================================== *
 *  THE MEADOW (/meadow): a field of grass carroto can walk through and touch
 *  One blade (a tapered strip) drawn tens of thousands of times with an
 *  InstancedMesh. The vertex shader bends every blade: wind (two waves
 *  rolling across the field) and a push away from his body and both hands,
 *  so the grass parts as he walks and bends under his fingers.
 *  ?stage=1 one blade · 2 a field · 3 + wind · 4 + it reacts to him (default)
 * ================================================================== */
const MEADOW = { stage: Number(new URLSearchParams(location.search).get('stage') ?? 4), speed: 0, phase: 0, heading: 0,
  keys: new Set(), lastKey: -99, cam: 'follow', grass: null, uniforms: null, camPos: new V3(), camLook: new V3() }
if (WORLD === 'meadow') {
  document.title = 'the meadow'
  for (const o of [cab, plant, copier, key, keyGlint, ground, pool, can]) { o.visible = false; o.removeFromParent() }
  Object.assign(story, { introduced: true, revealed: true, revealAt: -60, flick: true, busy: true })
  carrot.position.set(MEADOW.stage === 1 ? -2.4 : 0, 0, 0)
  scene.fog = new THREE.Fog(BG_LIT, 7, 19)
  $('.hint').textContent = '( arrow keys to walk · h hides this )'
  // clean frame for recording: no logo or sound button up top; H hides the rest
  $('.top').style.display = 'none'
  const cams = document.createElement('div')
  cams.className = 'meadow-cams'
  cams.innerHTML = [['follow', '1 wide'], ['hand', '2 hand'], ['low', '3 low']].map(([k, l]) => `<button class="pill" data-cam="${k}" type="button">${l}</button>`).join('')
  document.body.appendChild(cams)
  const markCam = () => cams.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.cam === MEADOW.cam))
  cams.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { MEADOW.cam = b.dataset.cam; markCam(); b.blur() } })
  MEADOW.markCam = markCam
  setTimeout(markCam, 0)
  // the ground under the grass
  const soil = mesh(new THREE.CircleGeometry(40, 64), mat('#5f8a3a', { roughness: 1, clearcoat: 0 }), { cast: false, receive: true })
  soil.rotation.x = -Math.PI / 2
  scene.add(soil)
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -3
  sun.shadow.camera.updateProjectionMatrix()
  scene.add(sun.target)

  // one blade: 1 unit tall (scaled per instance), tapered to a point, a gentle built-in curve
  const blade = new THREE.PlaneGeometry(0.05, 1, 1, 6)
  blade.translate(0, 0.5, 0)
  const pos = blade.attributes.position, cols = []
  const base = new THREE.Color('#2f5f24'), mid = new THREE.Color('#6fa341'), tip = new THREE.Color('#e3d78f')
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    pos.setX(i, pos.getX(i) * (1 - y * 0.92))          // taper
    pos.setZ(i, y * y * 0.12)                           // curve
    const c = y < 0.55 ? base.clone().lerp(mid, y / 0.55) : mid.clone().lerp(tip, (y - 0.55) / 0.45)
    cols.push(c.r, c.g, c.b)
  }
  blade.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  blade.computeVertexNormals()

  const N = MEADOW.stage === 1 ? 1 : 42000, R = 11
  const grassMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 })
  const U = { uTime: { value: 0 }, uBody: { value: new V3(0, 0, 99) }, uHandL: { value: new V3(0, -9, 0) }, uHandR: { value: new V3(0, -9, 0) },
    uWind: { value: MEADOW.stage >= 3 ? 1 : 0 }, uPush: { value: MEADOW.stage >= 4 ? 1 : 0 } }
  grassMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U)
    sh.vertexShader = 'uniform float uTime, uWind, uPush; uniform vec3 uBody, uHandL, uHandR;\n' + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        vec3 root = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float bh = length(instanceMatrix[1].xyz);
      #else
        vec3 root = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float bh = 1.0;
      #endif
      vec4 wp = modelMatrix * mvPosition;
      float h = clamp(position.y, 0.0, 1.0);
      float h2 = h * h;
      // wind: a slow swell plus a quicker ripple, rolling across the field
      float g = sin(uTime * 1.25 + root.x * 0.45 + root.z * 0.3) * 0.7 + sin(uTime * 2.9 + root.x * 1.6 - root.z * 1.2) * 0.25;
      wp.x += g * 0.1 * uWind * h2;
      wp.z += g * 0.045 * uWind * h2;
      // he parts the grass: body (wide) and each hand (where it's low enough to reach the tips)
      vec2 push = vec2(0.0);
      vec2 d = root.xz - uBody.xz;
      push += normalize(d + 1e-4) * (1.0 - smoothstep(0.2, 0.62, length(d))) * 0.38;
      d = root.xz - uHandL.xz;
      push += normalize(d + 1e-4) * (1.0 - smoothstep(0.02, 0.3, length(d))) * (1.0 - smoothstep(bh - 0.05, bh + 0.25, uHandL.y)) * 0.26;
      d = root.xz - uHandR.xz;
      push += normalize(d + 1e-4) * (1.0 - smoothstep(0.02, 0.3, length(d))) * (1.0 - smoothstep(bh - 0.05, bh + 0.25, uHandR.y)) * 0.26;
      wp.xz += push * uPush * h2;
      wp.y -= length(push) * uPush * h2 * 0.45 * bh;   // bent blades get shorter, not stretched
      mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;`)
  }
  const grass = new THREE.InstancedMesh(blade, grassMat, N)
  grass.receiveShadow = true
  grass.frustumCulled = false
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), sc = new V3(), p3 = new V3(), col = new THREE.Color()
  const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
  for (let i = 0; i < N; i++) {
    if (N === 1) { p3.set(0, -5, 0); e3.set(0, 0.4, 0); sc.set(1.4, 0.001, 1.4) } // stage 1: hidden until it sprouts
    else {
      const a = rnd(i, 1) * Math.PI * 2, r = Math.sqrt(rnd(i, 2)) * R
      p3.set(Math.cos(a) * r, 0, Math.sin(a) * r)
      e3.set((rnd(i, 3) - 0.5) * 0.25, rnd(i, 4) * Math.PI * 2, (rnd(i, 5) - 0.5) * 0.25)
      const hgt = 0.5 + rnd(i, 6) * 0.42, w = 0.8 + rnd(i, 7) * 0.7
      sc.set(w, hgt, w)
    }
    m4.compose(p3, q.setFromEuler(e3), sc)
    grass.setMatrixAt(i, m4)
    grass.setColorAt(i, col.setHSL(0.24 + (rnd(i, 8) - 0.5) * 0.06, 0.5, 0.42 + rnd(i, 9) * 0.2).multiplyScalar(1.45))
  }
  scene.add(grass)
  MEADOW.grass = grass; MEADOW.uniforms = U

  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase()
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { MEADOW.keys.add(k); MEADOW.lastKey = t; e.preventDefault() }
    const n = e.code?.startsWith('Digit') || e.code?.startsWith('Numpad') ? e.code.slice(-1) : k
    if (n === '1') MEADOW.cam = 'follow'
    if (n === '2') MEADOW.cam = 'hand'
    if (n === '3') MEADOW.cam = 'low'
    MEADOW.markCam?.()
    if (k === 'h') { const on = cams.style.display === 'none'; cams.style.display = on ? '' : 'none'; $('.hint').style.display = on ? '' : 'none' }
  })
  addEventListener('keyup', (e) => MEADOW.keys.delete(e.key.toLowerCase()))
  if (MEADOW.stage > 1) setTimeout(() => say('touched grass.', { mood: 'happy', hold: 2200 }), 1800)
}

function updateMeadow(dt) {
  const K = MEADOW.keys
  let vx = (K.has('arrowright') || K.has('d') ? 1 : 0) - (K.has('arrowleft') || K.has('a') ? 1 : 0)
  let vz = (K.has('arrowdown') || K.has('s') ? 1 : 0) - (K.has('arrowup') || K.has('w') ? 1 : 0)
  // stage 1: he wanders the bare field, then ONE blade sprouts beside him
  if (MEADOW.stage === 1) {
    const SPROUT = 11 // a good long wander first
    if (!MEADOW.sprouted && t >= SPROUT) {
      MEADOW.sprouted = t
      // beside him, on the camera side, so it's clearly its own little thing
      MEADOW.bladeAt = carrot.position.clone().add(new V3(0.85, 0, 0.45))
      MEADOW.keys.clear(); MEADOW.lastKey = t
      squash.vel += 6; mood('shock'); sfx.pip?.()
      setTimeout(() => say('that’s it? one?', { mood: 'sulk', hold: 3000 }), 1300)
    }
    if (MEADOW.sprouted) {
      const u = t - MEADOW.sprouted
      const g = u <= 0 ? 0 : 1 - Math.exp(-5.5 * u) * Math.cos(9 * u)   // pops up, overshoots, settles
      const m = new THREE.Matrix4().compose(MEADOW.bladeAt, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0)), new V3(1.4, Math.max(0.001, 0.9 * g), 1.4))
      MEADOW.grass.setMatrixAt(0, m); MEADOW.grass.instanceMatrix.needsUpdate = true
      // turn to face it
      const d = MEADOW.bladeAt.clone().sub(carrot.position)
      MEADOW.heading = Math.atan2(d.x, d.z)
      vx = vz = 0
    }
  }
  // nobody driving: he wanders the meadow on his own (a slow loop), so it films itself
  if (!vx && !vz && t - MEADOW.lastKey > 4 && (MEADOW.stage > 1 || !MEADOW.sprouted)) {
    const a = t * 0.12
    let goal
    if (MEADOW.stage === 1) {
      // a wander across the bare field: out, around, back toward the camera
      const WP = [[1.4, -1.0], [-0.6, -2.2], [-2.0, -0.6], [0.4, 0.9], [2.0, 0.3]]
      MEADOW.wp ??= 0
      const w = WP[Math.min(MEADOW.wp, WP.length - 1)]
      goal = new V3(w[0], 0, w[1])
      if (goal.distanceTo(carrot.position) < 0.25 && MEADOW.wp < WP.length - 1) MEADOW.wp++
    } else goal = new V3(Math.sin(a) * 3.2, 0, Math.sin(a * 2) * 1.6)
    const d = goal.sub(carrot.position)
    if (d.length() > 0.15) { vx = d.x; vz = d.z }
  }
  const len = Math.hypot(vx, vz)
  const moving = len > 0.01
  MEADOW.speed = damp(MEADOW.speed, moving ? 1 : 0, 5, dt)
  if (moving) {
    vx /= len; vz /= len
    carrot.position.x += vx * dt * 1.1 * MEADOW.speed
    carrot.position.z += vz * dt * 1.1 * MEADOW.speed
    MEADOW.heading = Math.atan2(vx, vz)
  }
  const pr = Math.hypot(carrot.position.x, carrot.position.z)
  if (pr > 8) carrot.position.multiplyScalar(8 / pr)   // stays in the meadow
  let dh = MEADOW.heading - carrot.rotation.y
  dh = Math.atan2(Math.sin(dh), Math.cos(dh))
  carrot.rotation.y += dh * (1 - Math.exp(-7 * dt))
  // legs and a little bob, like the dock walk
  const sp = MEADOW.speed
  MEADOW.phase += dt * sp * Math.PI * 2 * 1.5
  for (const L of legs) {
    const ph = MEADOW.phase + (L.side > 0 ? 0 : Math.PI)
    L.lift = Math.max(0, Math.sin(ph)) * 0.08 * sp; L.swing = Math.cos(ph) * 0.07 * sp; L.out = 0; L.knee = 0
  }
  torso.position.y = BY + Math.abs(Math.sin(MEADOW.phase)) * 0.035 * sp
  pose(MEADOW.stage >= 4 ? 'brush' : 'rest')
  // tell the grass where he and his hands are
  const U = MEADOW.uniforms
  if (U) {
    U.uTime.value = t
    U.uBody.value.copy(carrot.position)
    U.uHandL.value.copy(torso.localToWorld(arms[0].hand.clone()))
    U.uHandR.value.copy(torso.localToWorld(arms[1].hand.clone()))
  }
  // the sun (and its shadow box) follows him
  sun.target.position.copy(carrot.position)
  sun.position.copy(carrot.position).add(new V3(-3.5, 7, 6))
  // eyes: out over the field, or down at his hand in the close-up
  lookOverride = MEADOW.sprouted ? MEADOW.bladeAt.clone().add(new V3(0, 0.6, 0)) : MEADOW.cam === 'hand' ? U.uHandR.value.clone() : carrot.localToWorld(new V3(0, 1.5, 4)); lookUntil = Infinity
}

function meadowShot(dt) {
  const c = carrot.position
  let pos, look
  if (MEADOW.stage === 1 && MEADOW.cam === 'follow' && MEADOW.sprouted) {
    // after the sprout: frame him and his one blade together
    const mid = c.clone().lerp(MEADOW.bladeAt, 0.5)
    pos = mid.clone().add(new V3(3.4, 2.1, 8.2)); look = mid.clone().add(new V3(0, 0.75, 0))
  }
  else if (MEADOW.cam === 'hand') {
    // the wheat-field shot: low, beside his hand, grass tips in the foreground
    const hand = torso.localToWorld(arms[1].hand.clone())
    const side = new V3(Math.cos(carrot.rotation.y), 0, -Math.sin(carrot.rotation.y))
    pos = hand.clone().addScaledVector(side, 0.9).add(new V3(0, -0.05, 0)).addScaledVector(new V3(Math.sin(carrot.rotation.y), 0, Math.cos(carrot.rotation.y)), 0.9)
    look = hand.clone().add(new V3(0, -0.08, 0))
  } else if (MEADOW.cam === 'low') { pos = c.clone().add(new V3(1.2, 0.55, 6.5)); look = c.clone().add(new V3(0, 1.0, 0)) }
  else { pos = c.clone().add(new V3(4.2, 3.2, 10.5)); look = c.clone().add(new V3(0, 0.8, 0)) }
  const k = 1 - Math.exp(-4 * dt)
  if (MEADOW.camPos.lengthSq() === 0) { MEADOW.camPos.copy(pos); MEADOW.camLook.copy(look) }
  MEADOW.camPos.lerp(pos, k); MEADOW.camLook.lerp(look, k)
  camera.position.copy(MEADOW.camPos)
  camera.lookAt(MEADOW.camLook)
}

// ?debug: a handle for testing from the console
if (new URLSearchParams(location.search).has('debug')) {
  window.__room = {
    story, openFamily, closeFamily, minis, openFile, desk, spitKey, kp, key, camera, carrot, plant, arms, torso, can, plantTop, say, idleState: idle, calm: () => ({ inDrawer: story.inDrawer, fam: story.familyOpen, copy: copyEl.hidden, bub: bubble.hidden, ib: story.idleBubble, game: game.open, walk: walk.on, busy: story.busy, sleep: story.sleeping, drag: drag.on, kp: kp.flying, t }),
    idle: (name) => { endIdle(); idle.name = name; idle.t0 = t; idle.until = t + IDLES[name].dur; IDLES[name].start() },
  }
}
