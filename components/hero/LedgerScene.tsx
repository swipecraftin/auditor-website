"use client";

import { ContactShadows } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PAGE_COUNT, pageAngle, restAngle } from "./ledger-math";

export type SceneDrivers = {
  open: { v: number }[]; // per-page intro progress 0 → 1
  light: { v: number }; // key light 0 → 1
  scroll: { v: number }; // hero scroll progress 0 → 1
  pointer: { x: number }; // −0.5 … 0.5
};

type Props = { tier: "full" | "lite"; drivers: SceneDrivers; frozen: boolean; onFirstFrame: () => void };

const PAGE = { w: 3.1, t: 0.016, d: 4.2 };
const COVER_ANGLES = [0.012, Math.PI - 0.012];
const LANDSCAPE = { fov: 30, y: 2.9, z: 12, lookY: 3.3 };
// Portrait: the spec's fov 40 / look-at 4.6 crops the covers (±3.5 units) at phone aspect ratios (~0.46), spec §6 asks to
// fix that by framing. A wider fov (not a farther camera, which the fog at 12–28 would darken) fits the whole fan at
// 390 px; the higher look-at keeps it in the lower third, clear of the headline and the corner box.
const PORTRAIT = { fov: 50, y: 3.4, z: 19, lookY: 5.2 };

export function LedgerScene({ tier, drivers, frozen, onFirstFrame }: Props) {
  const pages = useRef<THREE.InstancedMesh>(null);
  const book = useRef<THREE.Group>(null);
  const key = useRef<THREE.SpotLight>(null);
  const frames = useRef(0);
  const time = useRef(0);

  const rest = useMemo(() => Array.from({ length: PAGE_COUNT }, (_, i) => restAngle(i)), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pageGeometry = useMemo(() => new THREE.BoxGeometry(PAGE.w, PAGE.t, PAGE.d).translate(PAGE.w / 2, 0, 0), []);
  const coverGeometry = useMemo(
    () => new THREE.BoxGeometry(PAGE.w + 0.14, 0.06, PAGE.d + 0.18).translate((PAGE.w + 0.14) / 2, 0, 0),
    [],
  );
  const pageMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E8E1D4", roughness: 0.9 }), []);
  const coverMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1D1B19", roughness: 0.55, metalness: 0.15 }), []);

  useEffect(
    () => () => {
      pageGeometry.dispose();
      coverGeometry.dispose();
      pageMaterial.dispose();
      coverMaterial.dispose();
    },
    [pageGeometry, coverGeometry, pageMaterial, coverMaterial],
  );

  useEffect(() => {
    key.current?.target.position.set(0, 1.2, 0);
    key.current?.target.updateMatrixWorld();
  }, []);

  useFrame((state, delta) => {
    const mesh = pages.current;
    const group = book.current;
    if (!mesh || !group) return;
    // Own clock: fiber resets state.clock whenever the frameloop pauses off-screen, which would snap the breathing.
    if (!frozen) time.current += Math.min(delta, 0.1);
    const t = time.current;
    const s = drivers.scroll.v;
    for (let i = 0; i < PAGE_COUNT; i++) {
      dummy.position.set(0, 0.07, 0);
      dummy.rotation.set(0, 0, pageAngle(rest[i], drivers.open[i].v, s, t, i));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    const parallax = tier === "full" && !frozen ? drivers.pointer.x * 0.08 : 0;
    group.rotation.y = -0.5 - 0.3 * s + Math.sin(t * 0.18) * 0.04 + parallax;
    // Framing follows the canvas orientation; fiber keeps the aspect in sync on resize.
    const cam = state.camera as THREE.PerspectiveCamera;
    const f = state.size.width < state.size.height ? PORTRAIT : LANDSCAPE;
    if (cam.fov !== f.fov) {
      cam.fov = f.fov;
      cam.updateProjectionMatrix();
    }
    cam.position.set(0, f.y, f.z - 1.5 * s);
    cam.lookAt(0, f.lookY, 0);
    if (key.current) key.current.intensity = 260 * drivers.light.v;
    if (frames.current < 2 && ++frames.current === 2) onFirstFrame();
  });

  return (
    <>
      <color attach="background" args={["#0B0B0C"]} />
      <fog attach="fog" args={["#0B0B0C", 12, 28]} />
      <ambientLight intensity={0.05} />
      <spotLight ref={key} position={[1.2, 10, 3.5]} color="#FFE3C0" intensity={0} distance={40} angle={0.5} penumbra={0.85} decay={2} />
      <directionalLight position={[-3, 5, -10]} color="#FFC98A" intensity={1.8} />
      <directionalLight position={[-8, 2, 7]} color="#A9B8FF" intensity={0.18} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#121113" roughness={0.6} metalness={0.1} />
      </mesh>
      <group ref={book} rotation-y={-0.5} scale={0.9}>
        <instancedMesh ref={pages} args={[pageGeometry, pageMaterial, PAGE_COUNT]} frustumCulled={false} />
        {COVER_ANGLES.map((rz) => (
          <mesh key={rz} geometry={coverGeometry} material={coverMaterial} rotation-z={rz} position-y={0.035} />
        ))}
      </group>
      {tier === "full" && <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={14} blur={2.4} far={4} resolution={512} />}
    </>
  );
}
