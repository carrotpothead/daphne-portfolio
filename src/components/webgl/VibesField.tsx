import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePointer } from '@/lib/usePointer'
import { useIsMobile } from '@/lib/useMediaQuery'

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uPixelRatio;

  attribute float aSeed;
  attribute float aScale;
  attribute float aMix;

  varying float vMix;
  varying float vAlpha;

  void main() {
    vMix = aMix;

    vec3 p = position;

    // Gentle organic drift
    float t = uTime * 0.15 + aSeed * 6.2831;
    p.x += sin(t) * 0.25;
    p.y += cos(t * 0.9) * 0.25;
    p.z += sin(t * 0.7) * 0.2;

    // Cursor parallax + soft repel near the pointer
    vec2 m = uMouse * 2.0;
    float d = distance(p.xy, m);
    float pull = smoothstep(2.2, 0.0, d);
    p.xy += normalize(p.xy - m + 0.0001) * pull * 0.6;
    p.xy += m * 0.18 * (0.4 + aScale);

    // Drift up + fade as the hero scrolls away
    p.y += uScroll * 1.6;
    vAlpha = 1.0 - smoothstep(0.0, 0.85, uScroll);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective-attenuated point size
    gl_PointSize = aScale * 26.0 * uPixelRatio * (1.0 / -mvPosition.z);
    gl_PointSize *= (0.7 + pull * 0.8);
  }
`

const fragment = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying float vMix;
  varying float vAlpha;

  void main() {
    // Soft round glow
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.0, dist);
    alpha = pow(alpha, 1.6);

    vec3 mint = vec3(0.369, 0.878, 0.690);
    vec3 peri = vec3(0.478, 0.635, 1.0);
    vec3 color = mix(mint, peri, vMix);

    // subtle core brightening
    color += (1.0 - dist) * 0.25;

    gl_FragColor = vec4(color, alpha * vAlpha * 0.9);
  }
`

export function VibesField() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { ref: pointer, update } = usePointer()
  const isMobile = useIsMobile()
  const { size } = useThree()

  const count = isMobile ? 1000 : 3200

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)
    const mixes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Distribute in a soft elliptical disc with depth
      const r = Math.pow(Math.random(), 0.65) * 5.2
      const theta = Math.random() * Math.PI * 2
      positions[i * 3 + 0] = Math.cos(theta) * r * 1.25
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.85
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.0

      seeds[i] = Math.random()
      scales[i] = 0.35 + Math.random() * Math.random() * 1.4
      mixes[i] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.setAttribute('aMix', new THREE.BufferAttribute(mixes, 1))

    const u = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
    }
    return { geometry: geo, uniforms: u }
  }, [count])

  useFrame((_, delta) => {
    update(0.06)
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += delta
    const u = m.uniforms.uMouse.value as THREE.Vector2
    u.x += (pointer.current.x - u.x) * 0.08
    u.y += (pointer.current.y - u.y) * 0.08
    // hero scroll progress 0..1
    const scrolled = Math.min(1, window.scrollY / (size.height || window.innerHeight))
    m.uniforms.uScroll.value = scrolled
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
