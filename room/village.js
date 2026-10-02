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
 *  So he smashed it, and when asked what he actually wanted: a burrow.
 *  House 2, variant 'burrow': a grassy hill; his leaves poke out the top. With build: true, the house draws itself as
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
    grass: mat('#5f9a40', { roughness: 0.95, clearcoat: 0 }),
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

  const windTime = { value: 0 }
  // the lawn: short grass over the whole village (one blade drawn 36,000 times), kept off the path, the houses and the fence line
  {
    const blade = new THREE.PlaneGeometry(0.045, 1, 1, 2); blade.translate(0, 0.5, 0)
    const pos = blade.attributes.position, cols = [], lo = new THREE.Color('#5d9e3f'), hi = new THREE.Color('#bfe58a')
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setX(i, pos.getX(i) * (1 - y * 0.85)); pos.setZ(i, y * y * 0.08); const c = lo.clone().lerp(hi, y); cols.push(c.r, c.g, c.b) }
    blade.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); blade.computeVertexNormals()
    const lawnMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 })
    lawnMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = windTime
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec2 r0 = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        float g = sin(uTime * 1.25 + r0.x * 0.45 + r0.y * 0.3) * 0.7 + sin(uTime * 2.9 + r0.x * 1.6 - r0.y * 1.2) * 0.25;
        transformed.x += g * 0.12 * position.y * position.y;`)
    }
    const N = 36000, lawn = new THREE.InstancedMesh(blade, lawnMat, N)
    const rr = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new V3(), p3 = new V3()
    let made = 0
    for (let k = 0; made < N && k < N * 3; k++) {
      const a = rr(k, 1) * Math.PI * 2, r = Math.pow(rr(k, 2), 0.7) * 17
      const x = Math.cos(a) * r, z = -3.2 + 2 + Math.sin(a) * r
      if (Math.abs(x) < 2.9 && z > -6.0 && z < -0.3) continue                   // under the houses
      if (Math.abs(x) < 0.75 && z > -1.2 && z < 9) continue                     // the stepping-stone path and out of the gate
      p3.set(x, 0, z)
      e.set((rr(k, 3) - 0.5) * 0.5, rr(k, 4) * Math.PI * 2, (rr(k, 5) - 0.5) * 0.5)
      const h = 0.1 + rr(k, 6) * 0.16, w = 0.9 + rr(k, 7)
      m4.compose(p3, q.setFromEuler(e), sc.set(w, h, w)); lawn.setMatrixAt(made++, m4)
    }
    lawn.count = made
    lawn.receiveShadow = true
    world.add(lawn)
  }

  // ---- his house ----
  const HX = 0, HZ = -3.2                      // house centre
  const W = 4.2, D = 3.3, WH = 2.5             // walls
  const house = new THREE.Group()
  house.position.set(HX, 0, HZ)
  world.add(house)
  const plinth = box(W + 0.3, 0.26, D + 0.3, 0.06, C.plinth); plinth.position.y = 0.13; house.add(plinth); plinth.userData.chunk = [5, 1, 4, true]
  const walls = box(W, WH, D, 0.12, C.wall); walls.position.y = 0.26 + WH / 2; house.add(walls); walls.userData.chunk = [5, 4, 4, true]   // (when smashed: breaks into a shell of chunks)
  // corner posts and a band under the eaves: a little timber frame
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = box(0.16, WH, 0.16, 0.04, C.trim); p.position.set(sx * (W / 2 - 0.02), 0.26 + WH / 2, sz * (D / 2 - 0.02)); house.add(p)
  }
  const band = box(W + 0.12, 0.14, D + 0.12, 0.04, C.trim); band.position.y = 0.26 + WH - 0.05; house.add(band); band.userData.chunk = [6, 1, 5, true]

  // the roof: two slabs meeting at a ridge, with carrot rings (darker stripes) across them
  const RY = 0.26 + WH, PITCH = 0.62, SLAB = (D / 2 + 0.45) / Math.cos(PITCH), RL = W + 0.7
  for (const s of [-1, 1]) {
    const slab = new THREE.Group()
    slab.position.set(0, RY + Math.tan(PITCH) * (D / 2 + 0.45) / 2 + 0.05, s * (D / 2 + 0.45) / 2)
    slab.rotation.x = s * PITCH
    const top = box(RL, 0.2, SLAB, 0.08, C.roof); slab.add(top); top.userData.chunk = [4, 1, 3, false]
    for (let k = 0; k < 4; k++) {
      const ring = box(RL + 0.02, 0.05, 0.08, 0.02, C.roofDark, { cast: false }); ring.userData.chunk = [5, 1, 1, false]
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
  const pathStone = mat('#cbc3b4', { roughness: 0.9, clearcoat: 0 })
  for (let k = 0; k < 8; k++) {                     // flat, irregular stones (not discs), a little uneven
    const sh = new THREE.Shape(), n = 7, base = 0.17 + ((k * 37) % 7) * 0.01
    for (let q = 0; q < n; q++) { const a = (q / n) * Math.PI * 2, r = base * (0.8 + ((k * 13 + q * 29) % 10) * 0.04); q ? sh.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r * 1.3, Math.sin(a) * r) }
    const st = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }), pathStone, { cast: false, receive: true })
    st.rotation.x = -Math.PI / 2; st.rotation.z = (k % 3 - 1) * 0.3
    st.position.set((k % 2 ? 0.16 : -0.14) + (k % 3 - 1) * 0.05, 0.02, -1.15 + k * 0.5); world.add(st)
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

  // ---- house 2: a burrow. carrots live underground. (his idea.) Like a hobbit hole: a long, low, grassy hill,
  // its front cut into a cream plaster wall with a timber beam following the hill's edge, a round green door
  // (low: he ducks), round windows, two lanterns, a brick chimney on top. He ducks in and he's home.
  const burrow = new THREE.Group(); burrow.position.set(HX, 0, HZ); world.add(burrow)
  burrow.visible = variant === 'burrow'
  const r01 = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
  const HILL = { rx: 5.2, ry: 3.1, rz: 3.0, cz: -0.7 }   // tall enough in the middle to hide all of him (2.8)
  const FZ = 1.6                                          // the front wall (local z); the hill is cut off there
  const cut = new THREE.Plane(new V3(0, 0, -1), HZ + FZ)  // world: keep z <= the wall
  const across = Math.sqrt(1 - ((FZ - HILL.cz) / HILL.rz) ** 2), WALL = { hw: HILL.rx * across, h: HILL.ry * across }
  const wallTop = (x) => WALL.h * Math.sqrt(Math.max(0, 1 - (x / WALL.hw) ** 2))
  const hillY = (x, z) => HILL.ry * Math.sqrt(Math.max(0, 1 - (x / HILL.rx) ** 2 - ((z - HILL.cz) / HILL.rz) ** 2))
  // the hill: smooth and soft, like a toy — light mint on top fading to a deeper green at the base
  const hillGeo = new THREE.SphereGeometry(1, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2)
  { const pos = hillGeo.attributes.position, cols = [], top = new THREE.Color('#8fd26a'), base = new THREE.Color('#3f8f3a')
    for (let k = 0; k < pos.count; k++) { const c = base.clone().lerp(top, Math.pow(pos.getY(k), 0.8)); cols.push(c.r, c.g, c.b) }
    hillGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)) }
  const soilG = mat('#ffffff', { roughness: 0.75, clearcoat: 0.15, vertexColors: true }); soilG.clippingPlanes = [cut]
  const hill = mesh(hillGeo, soilG, { receive: true })
  hill.scale.set(HILL.rx, HILL.ry, HILL.rz); hill.position.z = HILL.cz; burrow.add(hill)
  // chunky three-leaf grass tufts dotted over it, and flowers in his colours (blue, orange, cream)
  {
    const tuftLeaf = new THREE.SphereGeometry(0.1, 10, 8); tuftLeaf.scale(0.75, 2.6, 0.45); tuftLeaf.translate(0, 0.24, 0)   // a soft rounded leaf
    const tuftM = mat('#4f9e3e', { roughness: 0.7, clearcoat: 0 }), tuftLt = mat('#7cc556', { roughness: 0.7, clearcoat: 0 })
    const petals = [mat('#2338d4', { roughness: 0.5 }), mat('#f47b20', { roughness: 0.5 }), mat('#fff6e0', { roughness: 0.5 })], eyeM = mat('#ffd84a', { roughness: 0.5 })
    for (let k = 0; k < 190; k++) {
      const a = r01(k, 51) * Math.PI * 2, y = 0.1 + r01(k, 52) * 0.8, ring = Math.sqrt(1 - y * y)
      const p = new V3(Math.cos(a) * ring * HILL.rx, y * HILL.ry - 0.02, HILL.cz + Math.sin(a) * ring * HILL.rz)
      if (p.z > FZ - 0.2) continue
      const g = new THREE.Group(); g.position.copy(p); burrow.add(g)
      if (k % 3) {                                    // a tuft
        for (let q = 0; q < 3; q++) { const lf = mesh(tuftLeaf, q === 1 ? tuftLt : tuftM); lf.rotation.set(0, a, (q - 1) * 0.55); g.add(lf) }
        g.scale.setScalar(1.0 + r01(k, 53) * 0.9)
      } else {                                        // a flower: five round petals around a yellow eye, on a stem
        const st = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 5), tuftM, { cast: false }); st.position.y = 0.15; g.add(st)
        const pm = petals[(k / 3 | 0) % 3]
        for (let q = 0; q < 5; q++) { const pt = mesh(new THREE.SphereGeometry(0.085, 10, 8), pm, { cast: false }); const qa = (q / 5) * Math.PI * 2; pt.scale.y = 0.5; pt.position.set(Math.cos(qa) * 0.1, 0.32, Math.sin(qa) * 0.1); g.add(pt) }
        const ey = mesh(new THREE.SphereGeometry(0.06, 10, 8), eyeM, { cast: false }); ey.position.y = 0.33; g.add(ey)
      }
    }
  }
  // the front wall: cream plaster, the shape of the hill's cut edge, with holes for the door and two windows
  const plaster = mat('#fbf1dc', { roughness: 0.7, clearcoat: 0.1 }), wood = mat('#f47b20', { roughness: 0.5 }), woodDk = mat('#c85f12', { roughness: 0.55 })   // his orange
  const DR = 0.84, DY = 0.88                               // the round door: radius, centre height (top 1.72: he ducks)
  const WINS = [{ x: -2.05, y: 1.0, r: 0.38 }, { x: 2.05, y: 1.0, r: 0.38 }]
  const wallS = new THREE.Shape()
  wallS.moveTo(-WALL.hw, 0)
  for (let k = 0; k <= 40; k++) { const x = -WALL.hw + (2 * WALL.hw * k) / 40; wallS.lineTo(x, wallTop(x)) }
  wallS.lineTo(WALL.hw, 0); wallS.closePath()
  const hole = (x, y, r) => { const h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); return h }
  wallS.holes.push(hole(0, DY, DR + 0.02), ...WINS.map((w) => hole(w.x, w.y, w.r)))
  const facade = mesh(new THREE.ExtrudeGeometry(wallS, { depth: 0.3, bevelEnabled: false, curveSegments: 32 }), plaster, { receive: true })
  facade.position.z = FZ - 0.3; burrow.add(facade)
  const dark = new THREE.MeshBasicMaterial({ color: '#2e2219' })
  const bHall = mesh(new THREE.CircleGeometry(DR, 40), dark, { cast: false }); bHall.position.set(0, DY, FZ - 0.25); burrow.add(bHall)
  // the timber beam along the top edge, following the curve, with little blocks under it (like the reference)
  const eave = []
  for (let k = 0; k <= 30; k++) { const x = -WALL.hw * 1.02 + (2.04 * WALL.hw * k) / 30; eave.push(new V3(x, wallTop(Math.min(Math.abs(x), WALL.hw - 0.001)) + 0.06, FZ + 0.08)) }
  const beam = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(eave), 80, 0.13, 10, false), wood); burrow.add(beam)
  for (let k = 1; k < 9; k++) {
    const x = -WALL.hw + (2 * WALL.hw * k) / 9
    const blk = box(0.16, 0.22, 0.2, 0.03, woodDk); blk.position.set(x, wallTop(x) - 0.12, FZ + 0.06); burrow.add(blk)
  }
  // the door: round, green, planks fanning out from a centre knob, in a timber ring; hinged on the left, swings in
  const doorG = mat('#2338d4', { roughness: 0.35, clearcoat: 0.6 }), doorDk = mat('#1b2ba8', { roughness: 0.4 })   // his glasses blue
  const ringD = mesh(new THREE.TorusGeometry(DR + 0.07, 0.1, 12, 48), wood); ringD.position.set(0, DY, FZ + 0.02); burrow.add(ringD)
  const bHinge = new THREE.Group(); bHinge.position.set(-DR, DY, FZ - 0.12); burrow.add(bHinge)
  const dg = new THREE.Group(); dg.position.x = DR; bHinge.add(dg)
  const disc = mesh(new THREE.CylinderGeometry(DR - 0.02, DR - 0.02, 0.08, 40), doorG); disc.rotation.x = Math.PI / 2; dg.add(disc)
  for (let k = 0; k < 8; k++) { const sp = box(0.04, DR * 1.8, 0.02, 0.01, doorDk, { cast: false }); sp.rotation.z = (k * Math.PI) / 8; sp.position.z = 0.05; dg.add(sp) }
  const hub = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 20), doorDk); hub.rotation.x = Math.PI / 2; hub.position.z = 0.07; dg.add(hub)
  const bKnob = mesh(new THREE.SphereGeometry(0.08, 14, 10), mat('#f47b20', { roughness: 0.4 })); bKnob.position.z = 0.12; dg.add(bKnob)
  // a little orange-and-cream striped awning over the door
  for (let k = 0; k < 7; k++) {
    const st = box(0.3, 0.06, 0.55, 0.02, k % 2 ? plaster : wood)
    st.position.set(-0.9 + k * 0.3, DY + DR + 0.42, FZ + 0.27); st.rotation.x = 0.45; burrow.add(st)
    const sc = mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), k % 2 ? plaster : wood); sc.rotation.x = Math.PI; sc.scale.y = 0.6; sc.position.set(-0.9 + k * 0.3, DY + DR + 0.3, FZ + 0.52); burrow.add(sc)
  }
  // round windows with little panes
  for (const w of WINS) {
    const fr = mesh(new THREE.TorusGeometry(w.r + 0.04, 0.07, 10, 32), wood); fr.position.set(w.x, w.y, FZ + 0.02); burrow.add(fr)
    const gl = mesh(new THREE.CircleGeometry(w.r, 32), C.glass, { cast: false }); gl.position.set(w.x, w.y, FZ - 0.08); burrow.add(gl)
    for (const r of [0, Math.PI / 2]) { const bar = box(w.r * 2, 0.035, 0.03, 0.01, woodDk, { cast: false }); bar.rotation.z = r; bar.position.set(w.x, w.y, FZ - 0.06); burrow.add(bar) }
    const inner = mesh(new THREE.TorusGeometry(w.r * 0.5, 0.02, 6, 24), woodDk, { cast: false }); inner.position.set(w.x, w.y, FZ - 0.06); burrow.add(inner)
  }
  // a flower box under the right window
  const fbx = box(0.95, 0.2, 0.25, 0.04, wood); fbx.position.set(2.05, 0.5, FZ + 0.14); burrow.add(fbx)
  const bloomCols = ['#ff7a9c', '#ffd84a', '#ffffff', '#d9c8ff', '#ff5a5a']
  for (let k = 0; k < 6; k++) { const fl = mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(bloomCols[k % 5], { roughness: 0.6 }), { cast: false }); fl.scale.y = 0.7; fl.position.set(1.7 + k * 0.14, 0.66 + (k % 2) * 0.04, FZ + 0.16); burrow.add(fl) }
  // two lanterns either side of the door, glowing
  for (const sx of [-1, 1]) {
    const lt = new THREE.Group(); lt.position.set(sx * 1.25, 1.3, FZ + 0.12); burrow.add(lt)
    const arm = box(0.05, 0.05, 0.22, 0.01, woodDk); arm.position.z = -0.06; lt.add(arm)
    const lb = box(0.2, 0.28, 0.2, 0.04, C.glass); lb.position.set(0, -0.12, 0.05); lt.add(lb)
    const lc = mesh(new THREE.ConeGeometry(0.2, 0.16, 4), doorG); lc.rotation.y = Math.PI / 4; lc.position.set(0, 0.1, 0.05); lt.add(lc)   // a little blue roof
  }
  // potted plants and a basket of apples by the door
  const terra = mat('#c9724a', { roughness: 0.7 })
  const leafy = mat('#4f9a3d', { roughness: 0.8, clearcoat: 0 })
  for (const [x, z] of [[-1.0, FZ + 0.45], [1.05, FZ + 0.42]]) {
    const pot = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 14), terra); pot.position.set(x, 0.15, z); burrow.add(pot)
    for (let k = 0; k < 9; k++) {                       // a little fern: long leaves fanning out of the pot
      const lf = mesh(new THREE.SphereGeometry(0.1, 8, 6), leafy); lf.scale.set(0.35, 1.6, 0.35)
      const a = (k / 9) * Math.PI * 2, tilt = 0.5 + (k % 3) * 0.15
      lf.position.set(x + Math.cos(a) * 0.08, 0.42, z + Math.sin(a) * 0.08); lf.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); burrow.add(lf)
    }
  }
  const capM = mat('#e8463c', { roughness: 0.5 }), dotM = mat('#fff6e8', { roughness: 0.6 })
  const basket = box(0.36, 0.2, 0.26, 0.06, mat('#c9a063', { roughness: 0.8 })); basket.position.set(-1.65, 0.1, FZ + 0.5); basket.rotation.y = 0.3; burrow.add(basket)
  for (let k = 0; k < 3; k++) { const ap = mesh(new THREE.SphereGeometry(0.07, 10, 8), capM); ap.position.set(-1.73 + k * 0.09, 0.25, FZ + 0.48 + (k % 2) * 0.05); burrow.add(ap) }
  // a few red mushrooms where the hill meets the lawn
  for (let k = 0; k < 6; k++) {
    const a = 0.25 + k * 0.5, x = Math.cos(a) * (HILL.rx + 0.15) * (k % 2 ? 1 : -1), z = HILL.cz - Math.sin(a) * (HILL.rz + 0.1) * 0.6 + 0.9
    if (z > FZ) continue
    const m = new THREE.Group(); m.position.set(x, 0, z); m.scale.setScalar(0.8 + r01(k, 13) * 0.6); burrow.add(m)
    const stem = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.18, 8), dotM); stem.position.y = 0.09; m.add(stem)
    const top = mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capM); top.position.y = 0.16; m.add(top)
  }
  // a brick chimney with a cap, up on the hill, smoking
  const brick = mat('#f47b20', { roughness: 0.6 }), CHX = 1.8, CHZ = -1.5, CHY = hillY(CHX, CHZ)
  const stack = box(0.55, 0.95, 0.55, 0.04, brick); stack.position.set(CHX, CHY + 0.3, CHZ); burrow.add(stack)
  for (let k = 0; k < 2; k++) { const ln = box(0.57, 0.06, 0.57, 0.02, mat('#fff6e0', { roughness: 0.7 }), { cast: false }); ln.position.set(CHX, CHY + 0.1 + k * 0.3, CHZ); burrow.add(ln) }   // cream stripes
  const chCap = box(0.72, 0.1, 0.72, 0.03, brick); chCap.position.set(CHX, CHY + 0.82, CHZ); burrow.add(chCap)
  const chHole = mesh(new THREE.PlaneGeometry(0.4, 0.4), dark, { cast: false }); chHole.rotation.x = -Math.PI / 2; chHole.position.set(CHX, CHY + 0.875, CHZ); burrow.add(chHole)
  const bPuffs = [0, 1, 2, 3].map((k) => { const p = mesh(new THREE.SphereGeometry(0.15, 12, 10), C.smoke.clone(), { cast: false }); burrow.add(p); return { p, k } })
  const CHIMNEY_TOP = new V3(CHX, CHY + 0.95, CHZ)
  const hinges = { cottage: hinge, burrow: bHinge }

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
      const own = [].concat(o.material)[0].clippingPlanes || []
      o.material = [].concat(o.material).map((m) => { const c = m.clone(); c.clippingPlanes = [...own, solidCut]; c.clipShadows = true; c.onBeforeCompile = m.onBeforeCompile; return c })
      if (o.material.length === 1) o.material = o.material[0]
      let wm = wire
      if (own.length) { wm = wire.clone(); wm.clippingPlanes = [wireCut, ...own] }
      const w = o.isInstancedMesh ? new THREE.InstancedMesh(o.geometry, wm, o.count) : new THREE.Mesh(o.geometry, wm); w.userData.wire = true
      if (o.isInstancedMesh) { w.instanceMatrix.copy(o.instanceMatrix); w.count = o.count }
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
  const burrowStep = new V3(HX, 0, HZ + FZ + 0.85)     // outside the burrow's door
  const burrowDoorZ = HZ + FZ
  const burrowMiddle = new V3(HX, 0, HZ + HILL.cz)     // the middle of the hill, tucked in

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
      // nothing ends up in him: if a piece's outline overlaps his body (a 0.5 circle, 2.4 tall), push it out sideways
      if (sinkAt < 0) {
        const bx = tmpBox.setFromObject(o)
        const cx = Math.max(bx.min.x, Math.min(him.x, bx.max.x)), cz = Math.max(bx.min.z, Math.min(him.z, bx.max.z))
        const dx = cx - him.x, dz = cz - him.z, dd = Math.hypot(dx, dz)
        if (dd < 0.55 && bx.min.y < 2.4) {
          const mx = (bx.min.x + bx.max.x) / 2 - him.x, mz = (bx.min.z + bx.max.z) / 2 - him.z, ml = Math.hypot(mx, mz) || 1
          const push = 0.55 - dd + 0.02
          o.position.x += (mx / ml) * push; o.position.z += (mz / ml) * push
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
    const ds = api.active === 'burrow' ? burrowStep : doorstep
    const nearDoor = Math.hypot(him.x - ds.x, him.z - ds.z) < 1.4 || him.z < ds.z - 0.3 && Math.abs(him.x - HX) < 0.7
    doorOpen += (((nearDoor && !api.shut) || api.forceDoor ? 1 : 0) - doorOpen) * (1 - Math.exp(-5 * dt))   // (shut: he's home, door closed behind him)
    if (hinges[api.active] && (!api.smashed || api.active === 'burrow')) hinges[api.active].rotation.y = doorOpen * 1.55            // swings in
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
    windTime.value = t
    for (const { p, k } of bPuffs) {
      const u = ((t * 0.32 + k / bPuffs.length) % 1)
      p.position.set(CHIMNEY_TOP.x + Math.sin(u * 5 + k) * 0.1 + u * 0.3, CHIMNEY_TOP.y + u * 1.5, CHIMNEY_TOP.z)
      p.scale.setScalar(0.55 + u * 1.5)
      p.material.opacity = 0.7 * (1 - u) * Math.min(1, u * 6)
    }
  }
  // the builds: made up front for the house(s) that will draw themselves
  const builds = []
  const buildOf = {}
  const want = variant === 'story' ? ['cottage'] : build ? [variant] : []
  for (const v of want) { const g = v === 'burrow' ? burrow : house; buildOf[v] = makeBuild(g); builds.push(buildOf[v]) }
  const api = { world, update, solids, doorstep, inside, burrowStep, burrowMiddle, burrowDoorZ, house, burrow, forceDoor: false, gateZ: GZ, BUILD, smashed: false, shake: 0,
    active: variant === 'burrow' ? 'burrow' : 'cottage',
    get doorTop() { return api.active === 'burrow' ? BDH : 0.26 + DH },
    // start drawing a house ('cottage' or 'burrow') at time t
    startBuild(v, t) { if (!buildOf[v]) { buildOf[v] = makeBuild(v === 'burrow' ? burrow : house); builds.push(buildOf[v]) } buildOf[v].at = t; api.active = v },
    built(v) { return !!buildOf[v]?.done },
    smash(t) { smash(house, t) }, clearRubble }
  return api
}
