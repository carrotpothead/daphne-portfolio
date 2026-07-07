import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Interactive ink-dot field — a sheet of archive "grid paper" whose dots
 * scatter away from the cursor and spring back. All displacement happens
 * in the vertex shader; the CPU only lerps two uniforms per frame.
 * Pointer is tracked on window so links layered above never block it.
 */

const vertex = /* glsl */ `
  attribute float aRand;
  uniform float uTime;
  uniform vec2 uMouse;      // world units
  uniform float uHover;     // 0..1
  uniform vec2 uScale;      // viewport w/h in world units
  uniform float uDpr;
  varying float vPeri;
  varying float vGlow;

  void main() {
    vec2 pos = position.xy * uScale;

    // idle drift — each dot breathes on its own phase
    float t = uTime * 0.45 + aRand * 6.2831;
    pos += vec2(sin(t), cos(t * 0.8)) * uScale.y * 0.004;

    // cursor repulsion with soft falloff
    vec2 d = pos - uMouse;
    float dist = length(d);
    float radius = uScale.y * 0.30;
    float f = smoothstep(radius, 0.0, dist) * uHover;
    pos += normalize(d + 0.0001) * f * uScale.y * 0.12;

    vGlow = f;
    vPeri = step(0.86, aRand);

    vec4 mv = modelViewMatrix * vec4(pos, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.6 + aRand * 1.8 + f * 3.2) * uDpr;
  }
`

const fragment = /* glsl */ `
  precision mediump float;
  varying float vPeri;
  varying float vGlow;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    float alpha = smoothstep(0.5, 0.32, r);
    vec3 ink = vec3(0.106, 0.114, 0.133);      // #1b1d22
    vec3 peri = vec3(0.353, 0.451, 0.859);     // #5a73db
    float periMix = max(vPeri, vGlow);
    vec3 col = mix(ink, peri, periMix);
    float a = alpha * mix(0.30, 0.85, max(vPeri * 0.35, vGlow));
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`

function Field({ cols, rows }: { cols: number; rows: number }) {
  const { viewport, gl } = useThree()
  const ndc = useRef(new THREE.Vector2(9, 9)) // offscreen until first move
  const targetHover = useRef(0)
  const world = useRef(new THREE.Vector2(9999, 9999))

  const { positions, rands } = useMemo(() => {
    const count = cols * rows
    const positions = new Float32Array(count * 3)
    const rands = new Float32Array(count)
    let i = 0
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        positions[i * 3] = (x / (cols - 1) - 0.5) * 1.1 + (Math.random() - 0.5) * 0.012
        positions[i * 3 + 1] = (y / (rows - 1) - 0.5) * 1.1 + (Math.random() - 0.5) * 0.012
        positions[i * 3 + 2] = 0
        rands[i] = Math.random()
        i++
      }
    }
    return { positions, rands }
  }, [cols, rows])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(9999, 9999) },
      uHover: { value: 0 },
      uScale: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: Math.min(window.devicePixelRatio, 2) },
    }),
    [],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      targetHover.current = inside ? 1 : 0
      if (inside) {
        ndc.current.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -(((e.clientY - rect.top) / rect.height) * 2 - 1),
        )
      }
    }
    const onLeave = () => (targetHover.current = 0)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [gl])

  useFrame((_, delta) => {
    uniforms.uTime.value += delta
    uniforms.uScale.value.set(viewport.width, viewport.height)
    world.current.set(
      (ndc.current.x * viewport.width) / 2,
      (ndc.current.y * viewport.height) / 2,
    )
    uniforms.uMouse.value.lerp(world.current, 0.14)
    uniforms.uHover.value += (targetHover.current - uniforms.uHover.value) * 0.08
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

export function HeroField({ dense = true }: { dense?: boolean }) {
  const cols = dense ? 72 : 36
  const rows = dense ? 40 : 22
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 1 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Field cols={cols} rows={rows} />
    </Canvas>
  )
}
