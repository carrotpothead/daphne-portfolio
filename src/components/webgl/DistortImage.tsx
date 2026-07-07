import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uImgAspect;
  uniform float uPlaneAspect;
  uniform vec2 uMouse;
  uniform float uHover;

  void main() {
    // cover-fit the texture inside the plane
    vec2 uv = vUv;
    float ratio = uPlaneAspect / uImgAspect;
    if (ratio > 1.0) uv.y = (uv.y - 0.5) / ratio + 0.5;
    else uv.x = (uv.x - 0.5) * ratio + 0.5;

    // ripple radiating from the cursor
    float dist = distance(vUv, uMouse);
    float strength = smoothstep(0.45, 0.0, dist) * uHover;
    vec2 dir = normalize(vUv - uMouse + 0.0001);
    uv += dir * sin(dist * 26.0 - uHover * 5.0) * 0.008 * strength;

    // gentle zoom while hovered
    uv = (uv - 0.5) * (1.0 - 0.05 * uHover) + 0.5;

    // chromatic split toward the cursor
    vec2 sp = (uMouse - vUv) * 0.014 * uHover;
    float r = texture2D(uTex, uv + sp).r;
    float g = texture2D(uTex, uv).g;
    float b = texture2D(uTex, uv - sp).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`

function Plane({ src }: { src: string }) {
  const tex = useTexture(src)
  const { viewport, size } = useThree()
  const targetHover = useRef(0)
  const mouse = useRef(new THREE.Vector2(0.5, 0.5))

  const uniforms = useMemo(() => {
    tex.minFilter = THREE.LinearFilter
    const img = tex.image as { width: number; height: number }
    return {
      uTex: { value: tex },
      uImgAspect: { value: img.width / img.height },
      uPlaneAspect: { value: size.width / size.height },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex])

  useFrame(() => {
    uniforms.uHover.value += (targetHover.current - uniforms.uHover.value) * 0.1
    uniforms.uMouse.value.lerp(mouse.current, 0.12)
    uniforms.uPlaneAspect.value = size.width / size.height
  })

  return (
    <mesh
      scale={[viewport.width, viewport.height, 1]}
      onPointerOver={() => (targetHover.current = 1)}
      onPointerOut={() => (targetHover.current = 0)}
      onPointerMove={(e) => {
        if (e.uv) mouse.current.set(e.uv.x, e.uv.y)
      }}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  )
}

/** WebGL image with a cursor-driven ripple + chromatic-split on hover. */
export function DistortImage({ src }: { src: string }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <Plane src={src} />
      </Suspense>
    </Canvas>
  )
}
