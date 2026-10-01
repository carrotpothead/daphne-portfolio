/* ------------------------------------------------------------------ *
 *  The veggie village (/village): carroto's own little Animal Crossing.
 *  v1 is his house: a carrot cottage (cream walls, an orange roof with
 *  carrot rings, a leafy tuft on the ridge), a round cobalt door that
 *  swings open when he walks up, round glowing windows with flower
 *  boxes, a puffing chimney, a mailbox with his name on it, and a front
 *  garden: stepping stones, a picket fence with a gate, a tree, bushes.
 *  main.js walks him around; this file builds the place and animates it.
 *  The house story (for filming): house 1 is the cottage, but its door is
 *  too short for him (he's 2.8 tall with his leaves; it's 2.2): bonk.
 *  So he went on pinterest, and fell for a house made of potato sticks:
 *  house 2, variant 'fries'. With build: true, the house draws itself as
 *  a wireframe, piece by piece from the ground up, then a sweep rises
 *  through it and paints it in. (Variant 'box': a plain grey box.)
 * ------------------------------------------------------------------ */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const V3 = THREE.Vector3

export function createVillage({ scene, mat, mesh, canvasTex, variant = 'cottage', build = false }) {
  const world = new THREE.Group()
  scene.add(world)
  const box = (w, h, d, r, material, { cast = true, receive = true } = {}) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), material, { cast, receive })
  const C = {
    grass: mat('#8cc063', { roughness: 0.95, clearcoat: 0 }),
    path: mat('#e6d6b8', { roughness: 0.9, clearcoat: 0 }),
    plinth: mat('#d8c7a8', { roughness: 0.8 }),
    wall: mat('#fbf1dc', { roughness: 0.7 }),
    trim: mat('#b9814f', { roughness: 0.6 }),
    roof: mat('#f47b20', { roughness: 0.45 }),
    roofDark: mat('#dc6614', { roughness: 0.5 }),
    leaf: mat('#58b862', { roughness: 0.5 }),
    door: mat('#2338d4', { roughness: 0.35, clearcoat: 0.6 }),
    brass: mat('#e3b54a', { roughness: 0.25, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: '#ffe7b0', emissive: '#ffcf73', emissiveIntensity: 0.55, roughness: 0.2 }),
    brick: mat('#c96a4a', { roughness: 0.8 }),
    fence: mat('#fffaf0', { roughness: 0.6 }),
    bark: mat('#8a5a3a', { roughness: 0.9, clearcoat: 0 }),
    canopy: mat('#5fae52', { roughness: 0.8, clearcoat: 0 }),
    bush: mat('#6fbf5c', { roughness: 0.8, clearcoat: 0 }),
    soil: mat('#8b5e3c', { roughness: 1, clearcoat: 0 }),
    stone: mat('#cfc6b6', { roughness: 0.85, clearcoat: 0 }),
    mail: mat('#e8544a', { roughness: 0.4 }),
    smoke: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.8 }),
  }

  // ---- the land: a big soft green, a sandy path from his gate ----
  const land = mesh(new THREE.CircleGeometry(40, 72), C.grass, { cast: false, receive: true })
  land.rotation.x = -Math.PI / 2
  world.add(land)

  // ---- his house ----
  const HX = 0, HZ = -3.2                      // house centre
  const W = 4.2, D = 3.3, WH = 2.5             // walls
  const house = new THREE.Group()
  house.position.set(HX, 0, HZ)
  world.add(house)
  const plinth = box(W + 0.3, 0.26, D + 0.3, 0.06, C.plinth); plinth.position.y = 0.13; house.add(plinth)
  const walls = box(W, WH, D, 0.12, C.wall); walls.position.y = 0.26 + WH / 2; house.add(walls); walls.userData.chunk = [5, 4, 4, true]   // (when smashed: breaks into a shell of chunks)
  // corner posts and a band under the eaves: a little timber frame
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = box(0.16, WH, 0.16, 0.04, C.trim); p.position.set(sx * (W / 2 - 0.02), 0.26 + WH / 2, sz * (D / 2 - 0.02)); house.add(p)
  }
  const band = box(W + 0.12, 0.14, D + 0.12, 0.04, C.trim); band.position.y = 0.26 + WH - 0.05; house.add(band)

  // the roof: two slabs meeting at a ridge, with carrot rings (darker stripes) across them
  const RY = 0.26 + WH, PITCH = 0.62, SLAB = (D / 2 + 0.45) / Math.cos(PITCH), RL = W + 0.7
  for (const s of [-1, 1]) {
    const slab = new THREE.Group()
    slab.position.set(0, RY + Math.tan(PITCH) * (D / 2 + 0.45) / 2 + 0.05, s * (D / 2 + 0.45) / 2)
    slab.rotation.x = s * PITCH
    const top = box(RL, 0.2, SLAB, 0.08, C.roof); slab.add(top); top.userData.chunk = [4, 1, 3, false]
    for (let k = 0; k < 4; k++) {
      const ring = box(RL + 0.02, 0.05, 0.08, 0.02, C.roofDark, { cast: false })
      ring.position.set(0, 0.1, (k - 1.5) * SLAB / 4.2); slab.add(ring)
    }
    house.add(slab)
  }
  // gables (the triangles under the roof), front and back
  const tri = new THREE.Shape()
  const gw = D / 2 + 0.02, gh = Math.tan(PITCH) * (D / 2 + 0.02)
  tri.moveTo(-gw, 0); tri.lineTo(gw, 0); tri.lineTo(0, gh); tri.closePath()
  for (const s of [-1, 1]) {
    const g = mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.12, bevelEnabled: false }), C.wall)
    g.rotation.y = Math.PI / 2
    g.position.set(s * (W / 2 - 0.08) - 0.06, RY, 0)
    house.add(g)
  }
  // the leafy tuft on the ridge: his house has a top like his
  const ridgeY = RY + Math.tan(PITCH) * (D / 2 + 0.45) + 0.12
  const tuft = new THREE.Group(); tuft.position.set(0, ridgeY, 0); house.add(tuft)
  const leaves = []
  for (let k = 0; k < 5; k++) {
    const l = mesh(new THREE.SphereGeometry(0.2, 16, 12), C.leaf)
    l.scale.set(0.5, 1.9, 0.32)
    const piv = new THREE.Group(); piv.rotation.z = (k - 2) * 0.32; piv.rotation.x = (k % 2 ? 0.15 : -0.12)
    l.position.y = 0.34; piv.add(l); tuft.add(piv); leaves.push(piv)
  }
  const knob = mesh(new THREE.SphereGeometry(0.2, 16, 12), C.leaf); knob.scale.set(1.2, 0.7, 1.2); tuft.add(knob)

  // chimney, with smoke puffs that rise, grow and fade
  const chim = box(0.5, 1.1, 0.5, 0.05, C.brick); chim.position.set(1.25, RY + 0.95, -0.55); house.add(chim)
  const chimTop = box(0.62, 0.14, 0.62, 0.04, C.brick); chimTop.position.set(1.25, RY + 1.52, -0.55); house.add(chimTop)
  const puffs = [0, 1, 2, 3].map((k) => { const p = mesh(new THREE.SphereGeometry(0.16, 12, 10), C.smoke.clone(), { cast: false }); house.add(p); return { p, k } })

  // the door: round-topped, cobalt, hinged on the left, a brass knob. It swings open when he walks up.
  const DW = 1.05, DH = 1.95
  const ds = new THREE.Shape()
  ds.moveTo(-DW / 2, 0); ds.lineTo(DW / 2, 0); ds.lineTo(DW / 2, DH - DW / 2)
  ds.absarc(0, DH - DW / 2, DW / 2, 0, Math.PI, false); ds.lineTo(-DW / 2, 0)
  const frameS = new THREE.Shape()
  const FW = DW + 0.26, FH = DH + 0.13
  frameS.moveTo(-FW / 2, 0); frameS.lineTo(FW / 2, 0); frameS.lineTo(FW / 2, FH - FW / 2)
  frameS.absarc(0, FH - FW / 2, FW / 2, 0, Math.PI, false); frameS.lineTo(-FW / 2, 0)
  frameS.holes.push(ds)
  // the dark inside, seen through the open door (he steps out of it)
  const hall = mesh(new THREE.ShapeGeometry(ds, 24), new THREE.MeshBasicMaterial({ color: '#3a2a22' }), { cast: false })
  hall.position.set(0, 0.26, D / 2 + 0.004); house.add(hall)
  const frame = mesh(new THREE.ExtrudeGeometry(frameS, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), C.trim)
  frame.position.set(0, 0.26, D / 2 - 0.02); house.add(frame)
  const hinge = new THREE.Group(); hinge.position.set(-DW / 2, 0.26, D / 2 + 0.02); house.add(hinge)
  const door = mesh(new THREE.ExtrudeGeometry(ds, { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), C.door)
  door.position.set(DW / 2, 0, -0.04); hinge.add(door)
  const dk = mesh(new THREE.SphereGeometry(0.06, 14, 10), C.brass); dk.position.set(DW - 0.18, 0.95, 0.1); hinge.add(dk)
  // a tiny round window in the door
  const peep = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24), C.glass, { cast: false }); peep.rotation.x = Math.PI / 2; peep.position.set(DW / 2, 1.45, 0.07); hinge.add(peep)
  // doorstep and a mat
  const step = box(1.5, 0.14, 0.6, 0.05, C.plinth); step.position.set(0, 0.07, D / 2 + 0.36); house.add(step)
  const matTex = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#e9c07a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8954c'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16)
    g.fillStyle = '#8a5a2e'; g.font = 'bold 44px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('hi.', w / 2, h / 2 + 2)
  })
  const doormat = mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshStandardMaterial({ map: matTex, roughness: 1 }), { cast: false, receive: true })
  doormat.rotation.x = -Math.PI / 2; doormat.position.set(0, 0.145, D / 2 + 0.36); house.add(doormat)

  // round windows either side of the door, with a cross and a flower box under each
  const flowerCols = ['#ffffff', '#ffb3c7', '#ffe27a', '#d9c8ff', '#ff8b8b']
  for (const sx of [-1, 1]) {
    const wx = sx * 1.35, wy = 0.26 + 1.45
    const rimG = mesh(new THREE.TorusGeometry(0.42, 0.07, 12, 32), C.trim); rimG.position.set(wx, wy, D / 2 + 0.02); house.add(rimG)
    const pane = mesh(new THREE.CircleGeometry(0.42, 32), C.glass, { cast: false }); pane.position.set(wx, wy, D / 2 + 0.005); house.add(pane)
    for (const r of [0, Math.PI / 2]) { const bar = box(0.84, 0.05, 0.04, 0.01, C.trim, { cast: false }); bar.rotation.z = r; bar.position.set(wx, wy, D / 2 + 0.03); house.add(bar) }
    const fb = box(1.0, 0.22, 0.3, 0.04, C.trim); fb.position.set(wx, wy - 0.62, D / 2 + 0.16); house.add(fb)
    const dirt = box(0.9, 0.04, 0.22, 0.01, C.soil, { cast: false }); dirt.position.set(wx, wy - 0.5, D / 2 + 0.16); house.add(dirt)
    for (let k = 0; k < 5; k++) {
      const fx = wx - 0.36 + k * 0.18
      const stem = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 5), C.leaf, { cast: false }); stem.position.set(fx, wy - 0.4, D / 2 + 0.16); house.add(stem)
      const bloom = mesh(new THREE.SphereGeometry(0.075, 12, 8), mat(flowerCols[(k + (sx > 0 ? 2 : 0)) % flowerCols.length], { roughness: 0.6 }), { cast: false })
      bloom.scale.y = 0.7; bloom.position.set(fx, wy - 0.3 + (k % 2) * 0.04, D / 2 + 0.16); house.add(bloom)
    }
  }
  // a little sign over the door
  const signTex = canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 40); g.fill()
    g.lineWidth = 8; g.strokeStyle = '#b9814f'; g.stroke()
    g.fillStyle = '#f47b20'; g.font = '900 84px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('carroto', w / 2, h / 2 + 4)
  })
  const sign = mesh(new THREE.PlaneGeometry(1.2, 0.375), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }), { cast: false })
  sign.position.set(0, 0.26 + DH + 0.36, D / 2 + 0.03); house.add(sign)

  // ---- the front garden ----
  // stepping stones from the doorstep to the gate
  const GZ = 2.4                                    // the fence line (world z)
  for (let k = 0; k < 5; k++) {
    const s = mesh(new THREE.CylinderGeometry(0.3 + (k % 2) * 0.05, 0.32, 0.06, 18), C.stone, { cast: false, receive: true })
    s.scale.z = 0.8; s.position.set((k % 2 ? 0.12 : -0.1), 0.03, HZ + D / 2 + 0.95 + k * 0.72); world.add(s)
  }
  // picket fence along the front, with a gap (and a swinging gate) for the path
  const pickets = []
  const picketGeo = new RoundedBoxGeometry(0.12, 0.7, 0.06, 2, 0.03)
  for (let x = -4.6; x <= 4.61; x += 0.32) {
    if (Math.abs(x) < 0.6) continue
    const p = mesh(picketGeo, C.fence); p.position.set(x, 0.35, GZ); world.add(p); pickets.push(p)
  }
  for (const y of [0.22, 0.52]) for (const s of [-1, 1]) {
    const rail = box(4.1, 0.07, 0.04, 0.02, C.fence); rail.position.set(s * 2.62, y, GZ - 0.05); world.add(rail)
  }
  // the fence runs back along both sides to the house
  for (const s of [-1, 1]) {
    for (let z = GZ - 0.32; z > HZ + D / 2 - 0.1; z -= 0.32) { const p = mesh(picketGeo, C.fence); p.position.set(s * 4.62, 0.35, z); p.rotation.y = Math.PI / 2; world.add(p) }
    for (const y of [0.22, 0.52]) { const rail = box(0.04, 0.07, GZ - HZ - D / 2, 0.02, C.fence); rail.position.set(s * 4.57, y, (GZ + HZ + D / 2) / 2); world.add(rail) }
  }
  const gate = new THREE.Group(); gate.position.set(-0.56, 0, GZ); world.add(gate)
  for (let k = 0; k < 4; k++) { const p = mesh(picketGeo, C.fence); p.position.set(0.14 + k * 0.28, 0.35, 0); gate.add(p) }
  for (const y of [0.22, 0.52]) { const r = box(1.1, 0.07, 0.04, 0.02, C.fence); r.position.set(0.56, y, -0.05); gate.add(r) }

  // mailbox by the gate, his name on it, flag up (there's mail… nobody's sent any yet)
  const mailbox = new THREE.Group(); mailbox.position.set(1.25, 0, GZ + 0.5); world.add(mailbox)
  const post = box(0.1, 1.0, 0.1, 0.03, C.trim); post.position.y = 0.5; mailbox.add(post)
  const mb = box(0.34, 0.3, 0.52, 0.12, C.mail); mb.position.y = 1.12; mailbox.add(mb)
  const flag = new THREE.Group(); flag.position.set(0.19, 1.12, -0.1); mailbox.add(flag)
  const fl = box(0.03, 0.26, 0.03, 0.01, C.brass); fl.position.y = 0.13; flag.add(fl)
  const fh = box(0.03, 0.1, 0.14, 0.01, C.brass); fh.position.set(0, 0.24, 0.06); flag.add(fh)
  const nameTex = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h); g.fillStyle = '#26282d'; g.font = '700 48px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('carroto', w / 2, h / 2 + 2) })
  const plate = mesh(new THREE.PlaneGeometry(0.4, 0.15), new THREE.MeshStandardMaterial({ map: nameTex }), { cast: false }); plate.position.set(0, 1.12, 0.27); mailbox.add(plate)

  // a tree to the side of the house, and some bushes
  const tree = new THREE.Group(); tree.position.set(-6.2, 0, -2.2); world.add(tree)
  const trunk = mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 10), C.bark); trunk.position.y = 1.1; tree.add(trunk)
  for (const [x, y, z, r] of [[0, 2.7, 0, 1.2], [0.7, 2.3, 0.3, 0.85], [-0.7, 2.4, -0.2, 0.9], [0.1, 3.3, -0.1, 0.8], [-0.2, 2.2, 0.7, 0.75]]) {
    const c = mesh(new THREE.IcosahedronGeometry(r, 2), C.canopy); c.position.set(x, y, z); tree.add(c)
  }
  const bushes = [[-2.9, 1.7, 0.55], [2.9, 1.55, 0.5], [-3.9, 0.3, 0.45], [3.8, 0.5, 0.6], [5.6, -3.4, 0.7], [-5.2, 1.4, 0.55]]
  for (const [x, z, r] of bushes) {
    const b = new THREE.Group(); b.position.set(x, 0, z); world.add(b)
    for (const [dx, dy, dz, k] of [[0, 0.6, 0, 1], [0.45, 0.45, 0.1, 0.75], [-0.4, 0.45, -0.05, 0.8]]) {
      const s = mesh(new THREE.IcosahedronGeometry(r * k, 2), C.bush); s.position.set(dx * r * 1.4, dy * r * 1.3, dz); b.add(s)
    }
  }

  // ---- v0: the first house my human built him. It's a box. ----
  const boxHouse = new THREE.Group(); boxHouse.position.set(HX, 0, HZ); world.add(boxHouse)
  const grey = new THREE.MeshStandardMaterial({ color: '#c9cdd2', roughness: 0.95 })
  const bw = mesh(new THREE.BoxGeometry(3.2, 2.4, 2.8), grey, { receive: true }); bw.position.y = 1.2; boxHouse.add(bw)
  const br = mesh(new THREE.ConeGeometry(2.45, 1.3, 4), new THREE.MeshStandardMaterial({ color: '#8f959c', roughness: 0.95 })); br.rotation.y = Math.PI / 4; br.position.y = 2.4 + 0.65; boxHouse.add(br)
  const bd = mesh(new THREE.BoxGeometry(0.9, 1.7, 0.05), new THREE.MeshStandardMaterial({ color: '#7d838a', roughness: 0.9 })); bd.position.set(-0.6, 0.85, 1.42); boxHouse.add(bd)
  const bwin = mesh(new THREE.BoxGeometry(0.6, 0.6, 0.05), new THREE.MeshStandardMaterial({ color: '#b7c3cc', roughness: 0.4 })); bwin.position.set(0.8, 1.5, 1.42); boxHouse.add(bwin)
  boxHouse.visible = variant === 'box'
  house.visible = variant === 'cottage' || variant === 'story'

  // ---- house 2: made of potato sticks (he found it on pinterest. he loves it. nobody knows why) ----
  const fries = new THREE.Group(); fries.position.set(HX, 0, HZ); world.add(fries)
  fries.visible = variant === 'fries'
  const FRY = ['#f5c04e', '#f2b544', '#f7c95e', '#eeab3c', '#f4bb4a'].map((c) => mat(c, { roughness: 0.62, clearcoat: 0.15 }))
  const fryDark = mat('#d99a2e', { roughness: 0.7, clearcoat: 0.1 })
  const r01 = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
  let fi = 0
  const fry = (len, x, y, z, axis = 'y', th = 0.2, parent = fries) => {
    const g = axis === 'y' ? [th, len, th] : axis === 'x' ? [len, th, th] : [th, th, len]
    const f = box(...g, 0.07, FRY[Math.floor(r01(++fi, 1) * FRY.length)]); f.position.set(x, y, z)
    f.rotation.set((r01(fi, 2) - 0.5) * 0.04, (r01(fi, 3) - 0.5) * 0.06, (r01(fi, 4) - 0.5) * 0.04)   // hand-made: nothing quite straight
    parent.add(f); return f
  }
  const FW2 = 4.2, FD2 = 3.3, FH2 = 3.9                       // walls: tall, so he fits
  const FDW = 1.3, FDH = 3.05                                // the doorway: tall enough for him and his leaves
  const WINS = [{ x: -1.35, y0: 1.5, y1: 2.9 }, { x: 1.35, y0: 1.5, y1: 2.9 }]   // arched windows either side
  // a base of fries lying down
  for (const [w, d] of [[FW2 + 0.3, 0], [0, FD2 + 0.3]]) for (const s of [-1, 1]) {
    if (w) fry(w, 0, 0.12, s * (FD2 / 2 + 0.05), 'x', 0.24); else fry(d, s * (FW2 / 2 + 0.05), 0.12, 0, 'z', 0.24)
  }
  // walls: fries standing side by side; the front has the doorway and two windows cut out of it
  const step2 = 0.205
  for (let x = -FW2 / 2 + 0.1; x <= FW2 / 2 - 0.09; x += step2) {
    const cut = []
    if (Math.abs(x) < FDW / 2) cut.push([0.24, 0.24 + FDH])
    for (const w of WINS) if (Math.abs(x - w.x) < 0.42) cut.push([w.y0, w.y1])
    let y = 0.24
    for (const [a, b] of cut.sort((p, q) => p[0] - q[0])) { if (a - y > 0.05) fry(a - y, x, (y + a) / 2, FD2 / 2, 'y'); y = b }
    // above the doorway / windows: the tops are uneven, like the reference (fries don't come in one length)
    const top = FH2 + (r01(x * 10, 5) - 0.5) * 0.35
    fry(top - y, x, (y + top) / 2, FD2 / 2, 'y')
    fry(FH2 + (r01(x * 10, 6) - 0.5) * 0.35 - 0.24, x, (0.24 + FH2) / 2, -FD2 / 2, 'y')          // back wall (no holes)
  }
  for (let z = -FD2 / 2 + 0.1; z <= FD2 / 2 - 0.09; z += step2) for (const s of [-1, 1]) {
    const top = FH2 + (r01(z * 10 + s, 7) - 0.5) * 0.35
    fry(top - 0.24, s * FW2 / 2, (0.24 + top) / 2, z, 'y')
  }
  // the dark insides of the doorway and windows, and ledges (fries lying across) under the windows and over the door
  const hollow = new THREE.MeshBasicMaterial({ color: '#4a2f1c' })
  const arch = (w, h) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w / 2); sh.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); sh.closePath(); return sh }
  const fHall = mesh(new THREE.ShapeGeometry(arch(FDW - 0.02, FDH), 24), hollow, { cast: false }); fHall.position.set(0, 0.24, FD2 / 2 - 0.02); fries.add(fHall)
  for (const w of WINS) {
    const g = mesh(new THREE.ShapeGeometry(arch(0.78, w.y1 - w.y0), 20), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffbf5c', emissiveIntensity: 0.5 }), { cast: false })
    g.position.set(w.x, w.y0, FD2 / 2 - 0.02); fries.add(g)
    fry(1.1, w.x, w.y0 - 0.08, FD2 / 2 + 0.14, 'x', 0.18)                                   // sill
    fry(0.95, w.x, w.y1 + 0.1, FD2 / 2 + 0.12, 'x', 0.16)                                   // lintel
    const bar = fry(w.y1 - w.y0 - 0.1, w.x, (w.y0 + w.y1) / 2, FD2 / 2 + 0.02, 'y', 0.07)     // a thin fry down the middle
  }
  fry(FDW + 0.5, 0, 0.24 + FDH + 0.14, FD2 / 2 + 0.14, 'x', 0.22)                             // over the door
  fry(4.0, 0, FH2 * 0.55, FD2 / 2 + 0.16, 'x', 0.14).visible = false                         // (a band would cut the windows; left out)
  // the roof: a flat lid, then a heap of fries piled on top every which way
  const lid = box(FW2 + 0.35, 0.16, FD2 + 0.35, 0.06, fryDark); lid.position.y = FH2 + 0.1; fries.add(lid)
  for (let k = 0; k < 70; k++) {
    const f = fry(0.9 + r01(k, 8) * 0.9, (r01(k, 9) - 0.5) * (FW2 - 0.3), FH2 + 0.28 + r01(k, 10) * 0.55 * (1 - Math.abs(r01(k, 9) - 0.5)), (r01(k, 11) - 0.5) * (FD2 - 0.3), 'x', 0.19)
    f.rotation.set((r01(k, 12) - 0.5) * 0.9, r01(k, 13) * Math.PI, (r01(k, 14) - 0.5) * 0.7)
  }
  // the door: planks of fries, hinged on the left, swings in
  const fHinge = new THREE.Group(); fHinge.position.set(-FDW / 2 + 0.02, 0.24, FD2 / 2 + 0.02); fries.add(fHinge)
  for (let k = 0; k < 6; k++) {
    const px = 0.11 + k * 0.205
    const h = FDH - (px - FDW / 2 < 0 ? 0 : 0) - Math.max(0, (Math.abs(px - FDW / 2) / (FDW / 2)) ** 2 * (FDW / 2)) - 0.02
    fry(h, px, h / 2, 0, 'y', 0.2, fHinge)
  }
  const fKnob = mesh(new THREE.SphereGeometry(0.07, 14, 10), mat('#c9362c', { roughness: 0.4 })); fKnob.position.set(FDW - 0.22, 1.35, 0.14); fHinge.add(fKnob)
  // red fry cartons either side of the door, fries sticking out (planters)
  const red = mat('#d8342b', { roughness: 0.45 }), redTrim = mat('#f6d24a', { roughness: 0.4 })
  for (const s of [-1, 1]) {
    const c = new THREE.Group(); c.position.set(s * 1.25, 0, FD2 / 2 + 0.75); fries.add(c)
    const cup = mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.6, 20), red); cup.position.y = 0.3; c.add(cup)
    const band2 = mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 28), redTrim); band2.rotation.x = Math.PI / 2; band2.position.y = 0.52; c.add(band2)
    for (let k = 0; k < 9; k++) { const f = fry(0.5 + r01(k + s * 20, 15) * 0.3, (r01(k + s * 20, 16) - 0.5) * 0.4, 0.75, (r01(k + s * 20, 17) - 0.5) * 0.4, 'y', 0.09, c); f.rotation.z = (r01(k + s * 20, 18) - 0.5) * 0.5; f.rotation.x = (r01(k + s * 20, 19) - 0.5) * 0.5 }
  }
  // a little sign: "carroto" (on a fry)
  const fSign = mesh(new THREE.PlaneGeometry(1.2, 0.375), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }), { cast: false })
  fSign.position.set(0, 0.24 + FDH + 0.42, FD2 / 2 + 0.26); fries.add(fSign)
  const hinges = { cottage: hinge, fries: fHinge }

  // ---- building a house: a wireframe copy of every piece pops in, bottom to top; then a sweep rises and paints it in ----
  const WIRE = new THREE.MeshBasicMaterial({ color: '#2338d4', wireframe: true, transparent: true, opacity: 0.55 })
  const BUILD = { pop: 4.4, sweepAt: 4.9, sweep: 2.6 }
  function makeBuild(group) {
    const solidCut = new THREE.Plane(new V3(0, -1, 0), -1)     // keeps y <= constant (the painted part); -1: nothing yet
    const wireCut = new THREE.Plane(new V3(0, 1, 0), 1)        // keeps y >= -constant (the wire part)
    const wire = WIRE.clone(); wire.clippingPlanes = [wireCut]
    group.visible = true
    world.updateMatrixWorld(true)
    const found = [], skip = new Set(puffs.map((q) => q.p))
    group.traverse((o) => { if (o.isMesh && !skip.has(o) && !o.userData.wire) found.push(o) })
    const pieces = []
    for (const o of found) {
      // its own copy of the material, so clipping the house doesn't clip the rest of the village
      o.material = [].concat(o.material).map((m) => { const c = m.clone(); c.clippingPlanes = [solidCut]; c.clipShadows = true; return c })
      if (o.material.length === 1) o.material = o.material[0]
      const w = new THREE.Mesh(o.geometry, wire); w.userData.wire = true
      w.position.copy(o.position); w.quaternion.copy(o.quaternion); w.scale.set(0.001, 0.001, 0.001)
      o.parent.add(w)
      pieces.push({ o, w, y: new THREE.Box3().setFromObject(o).min.y, x: o.getWorldPosition(new V3()).x, s: o.scale.clone() })
    }
    if (group === house) for (const q of puffs) { q.p.material.clippingPlanes = [solidCut] }
    pieces.sort((a, b) => a.y - b.y || a.x - b.x)
    const b = { at: null, done: false, update(t) {
      if (b.at == null || b.done) return
      const e = t - b.at
      pieces.forEach((q, i) => {
        const u = e - (i / pieces.length) * BUILD.pop
        const k = u <= 0 ? 0.001 : 1 - Math.exp(-7 * u) * Math.cos(11 * u)   // pops in with a little overshoot
        q.w.scale.copy(q.s).multiplyScalar(Math.max(0.001, k))
      })
      const h = e < BUILD.sweepAt ? -1 : -0.3 + ((e - BUILD.sweepAt) / BUILD.sweep) * 7.5
      solidCut.constant = h; wireCut.constant = -h
      if (e > BUILD.sweepAt + BUILD.sweep + 0.3) { b.done = true; pieces.forEach((q) => { q.w.visible = false }); solidCut.constant = 99 }
    } }
    return b
  }

  // ---- smashing a house (clash of clans): every piece flies off, tumbles, lands as rubble; a cloud of dust ----
  let debris = [], dustAt = -99, sinkAt = -99
  const tmpBox = new THREE.Box3()
  const dust = [...Array(18)].map((_, k) => {
    const d = mesh(new THREE.IcosahedronGeometry(0.5, 2), new THREE.MeshStandardMaterial({ color: '#f3ead8', roughness: 1, transparent: true, opacity: 0 }), { cast: false })
    d.userData.a = (k / 18) * Math.PI * 2 + r01(k, 30); d.userData.r = r01(k, 31); world.add(d); return d
  })
  // break a big box into smaller boxes in its place (just its outer shell if `shell`), so it crumbles instead of flying off whole
  function chunkify(o, [nx, ny, nz, shell]) {
    o.geometry.computeBoundingBox()
    const size = o.geometry.boundingBox.getSize(new V3()), cell = new V3(size.x / nx, size.y / ny, size.z / nz)
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
      if (shell && i > 0 && i < nx - 1 && k > 0 && k < nz - 1) continue
      const c = box(cell.x * 0.98, cell.y * 0.98, cell.z * 0.98, Math.min(cell.x, cell.y, cell.z) * 0.12, o.material)
      c.position.set(-size.x / 2 + cell.x * (i + 0.5), -size.y / 2 + cell.y * (j + 0.5), -size.z / 2 + cell.z * (k + 0.5)).applyMatrix4(o.matrix)
      c.quaternion.copy(o.quaternion)
      o.parent.add(c)
    }
    o.visible = false
  }
  function smash(group, t) {
    group.traverse((o) => { if (o.isMesh && o.userData.chunk && o.visible) chunkify(o, o.userData.chunk) })
    group.updateMatrixWorld(true)
    const bits = []
    group.traverse((o) => { if (o.isMesh && o.visible && !o.userData.wire && !puffs.some((q) => q.p === o)) bits.push(o) })
    const c = group.getWorldPosition(new V3()).add(new V3(0, 0, 0.4))
    bits.forEach((o, k) => {
      world.attach(o)                                   // keep where it is in the world, now loose
      o.geometry.computeBoundingBox()
      const sz = o.geometry.boundingBox.getSize(new V3()).multiply(o.scale)
      const out = new V3(o.position.x - c.x, 0, o.position.z - c.z)
      if (out.lengthSq() < 1e-3) out.set(r01(k, 32) - 0.5, 0, r01(k, 33) - 0.5)
      if (out.z > 0) out.z *= 0.25                            // not much toward the camera (or onto him)
      out.normalize()
      o.userData.v = out.multiplyScalar(0.6 + r01(k, 34) * 1.9).setY(2.2 + r01(k, 35) * 3.2 + o.position.y * 0.35)
      o.userData.w = new V3(r01(k, 36) - 0.5, r01(k, 37) - 0.5, r01(k, 38) - 0.5).multiplyScalar(9)
      o.userData.rest = Math.max(0.02, Math.min(sz.x, sz.y, sz.z) / 2)
      o.userData.delay = Math.max(0, 1.6 - o.position.y) * 0.03          // the top goes first
      o.userData.t0 = t
    })
    debris = bits; dustAt = t
    for (const q of puffs) q.p.visible = false
    api.smashed = true
  }
  function clearRubble(t) { sinkAt = t }

  // ---- what main.js needs to walk him around it ----
  // solid things he can't walk through: the house (a box) and round things
  const solids = [
    { kind: 'box', x: HX, z: HZ, hw: W / 2 + 0.25, hd: D / 2 + 0.25 },
    { kind: 'circle', x: tree.position.x, z: tree.position.z, r: 0.6 },
    { kind: 'circle', x: mailbox.position.x, z: mailbox.position.z, r: 0.3 },
    ...bushes.map(([x, z, r]) => ({ kind: 'circle', x, z, r: r * 1.1 })),
  ]
  const doorstep = new V3(HX, 0, HZ + D / 2 + 0.55)    // right outside the door
  const inside = new V3(HX, 0, HZ + D / 2 - 0.55)      // just inside it (for the walk-out)

  // ---- animation ----
  let doorOpen = 0, gateOpen = 0
  function update(t, dt, him) {
    for (const b of builds) b.update(t)
    // flying pieces: gravity, a bounce, then they lie there as rubble
    for (const o of debris) {
      const u = o.userData
      if (t - u.t0 < u.delay) continue
      if (!u.still) {
        u.v.y -= 9.8 * dt
        o.position.addScaledVector(u.v, dt)
        o.rotateX(u.w.x * dt); o.rotateY(u.w.y * dt); o.rotateZ(u.w.z * dt)
        const low = tmpBox.setFromObject(o).min.y                // its real lowest point, however it's turned
        if (low < 0) {
          o.position.y -= low; u.v.y *= -0.28; u.v.x *= 0.55; u.v.z *= 0.55; u.w.multiplyScalar(0.5)
          if (Math.abs(u.v.y) < 0.4 && Math.hypot(u.v.x, u.v.z) < 0.3) u.still = true
        }
      }
      if (sinkAt > 0) { const k = Math.min(1, (t - sinkAt) / 1.2); o.position.y -= k * dt * 1.6; o.scale.multiplyScalar(1 - dt * 1.5 * k); if (k >= 1) o.visible = false }
    }
    // the dust: a ring of puffs rolls out from the house and rises, then thins away
    const du = t - dustAt
    dust.forEach((d) => {
      const on = du >= 0 && du < 2.2
      d.visible = on
      if (!on) return
      const k = du / 2.2, a = d.userData.a, r = 1.2 + k * (2.6 + d.userData.r * 1.5)
      d.position.set(HX + Math.cos(a) * r, 0.3 + k * (1.2 + d.userData.r), HZ + Math.sin(a) * r * 0.8)
      d.scale.setScalar(0.6 + k * 1.6 + d.userData.r * 0.4)
      d.material.opacity = 0.85 * (1 - k) * Math.min(1, du * 8)
    })
    api.shake = Math.max(0, 1 - du / 0.6) * (du >= 0 ? 1 : 0)
    // the door swings open when he's close to it (or it's told to), the gate when he's at the fence gap
    const nearDoor = Math.hypot(him.x - doorstep.x, him.z - doorstep.z) < 1.4 || him.z < doorstep.z - 0.3 && Math.abs(him.x - HX) < 0.7
    doorOpen += (((nearDoor && !api.shut) || api.forceDoor ? 1 : 0) - doorOpen) * (1 - Math.exp(-5 * dt))   // (shut: he's home, door closed behind him)
    if (hinges[api.active] && !api.smashed || api.active === 'fries') hinges[api.active].rotation.y = doorOpen * 1.55            // swings in
    const nearGate = Math.abs(him.z - GZ) < 1.1 && Math.abs(him.x) < 1.2
    gateOpen += ((nearGate ? 1 : 0) - gateOpen) * (1 - Math.exp(-5 * dt))
    gate.rotation.y = gateOpen * 1.5
    // the tuft sways, the smoke puffs
    leaves.forEach((l, k) => { l.rotation.x = (k % 2 ? 0.15 : -0.12) + Math.sin(t * 1.4 + k) * 0.05 })
    for (const { p, k } of puffs) {
      const u = ((t * 0.35 + k / puffs.length) % 1)
      p.position.set(1.25 + Math.sin(u * 5 + k) * 0.12 + u * 0.35, RY + 1.65 + u * 1.5, -0.55)
      p.scale.setScalar(0.6 + u * 1.6)
      p.material.opacity = 0.75 * (1 - u) * Math.min(1, u * 6)
    }
    flag.rotation.z = Math.sin(t * 2) * 0.03
  }
  // the builds: made up front for the house(s) that will draw themselves
  const builds = []
  const buildOf = {}
  const want = variant === 'story' ? ['cottage'] : build ? [variant] : []
  for (const v of want) { const g = v === 'fries' ? fries : house; buildOf[v] = makeBuild(g); builds.push(buildOf[v]) }
  const api = { world, update, solids, doorstep, inside, house, fries, forceDoor: false, gateZ: GZ, BUILD, smashed: false, shake: 0,
    active: variant === 'fries' ? 'fries' : 'cottage',
    get doorTop() { return api.active === 'fries' ? 0.24 + FDH : 0.26 + DH },
    // start drawing a house ('cottage' or 'fries') at time t
    startBuild(v, t) { if (!buildOf[v]) { buildOf[v] = makeBuild(v === 'fries' ? fries : house); builds.push(buildOf[v]) } buildOf[v].at = t; api.active = v },
    built(v) { return !!buildOf[v]?.done },
    smash(t) { smash(house, t) }, clearRubble }
  return api
}
