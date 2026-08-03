"use client";

import { Environment, Float, Line, Sky, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type GenesisQuality = "high" | "medium" | "low";

type GenesisCanvasProps = {
  journeyActive: boolean;
  startHover?: boolean;
  quality: GenesisQuality;
  isVisible: boolean;
  debugEnabled?: boolean;
  debugCube?: boolean;
  onReady?: () => void;
};

type VectorTuple = [number, number, number];

const gold = "#D6B36A";
const brightGold = "#F5D98A";
const cyan = "#38BDF8";
const night = "#08090A";

export function GenesisCanvas({
  journeyActive,
  startHover = false,
  quality,
  isVisible,
  debugEnabled = false,
  debugCube = false,
  onReady
}: GenesisCanvasProps) {
  const dpr: [number, number] = quality === "high" ? [1, 1.45] : quality === "medium" ? [0.85, 1.18] : [0.7, 0.95];
  const shadows = quality !== "low";
  const shadowMapSize = quality === "high" ? 1536 : 1024;
  const particleCount = quality === "high" ? 88 : quality === "medium" ? 46 : 16;

  useEffect(() => {
    genesisCanvasDebug(debugEnabled, "GenesisCanvas mounted", { quality, isVisible, journeyActive, startHover, debugCube });
    return () => genesisCanvasDebug(debugEnabled, "GenesisCanvas unmounted");
  }, [debugCube, debugEnabled, isVisible, journeyActive, quality, startHover]);

  genesisCanvasDebug(debugEnabled, "GenesisCanvas render", { quality, isVisible, journeyActive, startHover, debugCube });

  return (
    <Canvas
      aria-hidden="true"
      shadows={shadows}
      dpr={dpr}
      frameloop={isVisible ? "always" : "demand"}
      camera={{ position: [8.2, 3.8, 10.8], fov: 34, near: 0.1, far: 120 }}
      gl={{ antialias: quality !== "low", alpha: true, powerPreference: "high-performance" }}
      className="absolute inset-0"
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        genesisCanvasDebug(debugEnabled, "Canvas created");
        onReady?.();
      }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={[night]} />
        <fog attach="fog" args={["#09111b", 13, 50]} />
        <CinematicCamera journeyActive={journeyActive} startHover={startHover} quality={quality} isVisible={isVisible} debugEnabled={debugEnabled} />
        <LightingRig quality={quality} shadows={shadows} shadowMapSize={shadowMapSize} journeyActive={journeyActive} />
        {quality !== "low" ? <Sky distance={450000} sunPosition={[-4, 1.4, -7]} inclination={0.55} azimuth={0.08} turbidity={8} rayleigh={0.35} mieCoefficient={0.012} mieDirectionalG={0.78} /> : null}
        {quality === "high" ? <Environment preset="city" background={false} blur={0.75} /> : null}
        {debugCube ? <DiagnosticCube /> : <LuxuryConstructionWorld quality={quality} journeyActive={journeyActive} />}
        <BlueprintGrid visible={journeyActive || startHover} />
        <HolographicVora journeyActive={journeyActive} quality={quality} />
        <Sparkles count={particleCount} scale={[20, 8, 20]} size={quality === "low" ? 0.8 : 1.05} speed={0.12} color={cyan} opacity={quality === "low" ? 0.18 : 0.38} />
      </Suspense>
    </Canvas>
  );
}

function LightingRig({
  quality,
  shadows,
  shadowMapSize,
  journeyActive
}: {
  quality: GenesisQuality;
  shadows: boolean;
  shadowMapSize: number;
  journeyActive: boolean;
}) {
  const pulse = journeyActive ? 1.18 : 1;
  return (
    <>
      <ambientLight intensity={quality === "low" ? 0.42 : 0.26} />
      <directionalLight
        castShadow={shadows}
        position={[7, 8, 4]}
        intensity={(quality === "low" ? 1.45 : 2.25) * pulse}
        color={brightGold}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={0.5}
        shadow-camera-far={44}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <spotLight position={[-4.5, 5, 7]} angle={0.32} penumbra={0.8} intensity={1.8} color="#cbeeff" distance={24} />
      <pointLight position={[-7, 2.8, -4]} intensity={2.45} color={cyan} distance={20} />
      <pointLight position={[3.5, 1.7, 2.8]} intensity={1.75 * pulse} color={gold} distance={12} />
      <pointLight position={[0, 0.45, 3.3]} intensity={1.35} color={cyan} distance={8} />
    </>
  );
}

function CinematicCamera({
  journeyActive,
  startHover = false,
  quality,
  isVisible,
  debugEnabled = false
}: {
  journeyActive: boolean;
  startHover?: boolean;
  quality: GenesisQuality;
  isVisible: boolean;
  debugEnabled?: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0.15, 1.25, -0.18));
  const desired = useRef(new THREE.Vector3(8.2, 3.8, 10.8));
  const clock = useRef(0);
  const lastCameraLog = useRef(0);

  useFrame((_, delta) => {
    if (!isVisible) return;
    clock.current += Math.min(delta, 0.035);

    const orbitSpeed = quality === "low" ? 0.055 : 0.075;
    const orbit = -0.58 + Math.sin(clock.current * orbitSpeed) * (quality === "low" ? 0.28 : 0.46);
    const breath = Math.sin(clock.current * 0.42);

    if (journeyActive) {
      desired.current.set(1.15, 1.55, 2.42);
      target.current.lerp(new THREE.Vector3(0.12, 1.28, -0.92), 0.045);
    } else if (startHover) {
      desired.current.set(5.45, 2.72 + breath * 0.06, 6.85);
      target.current.lerp(new THREE.Vector3(0.05, 1.2, -0.35), 0.036);
    } else {
      desired.current.set(8.2 * Math.cos(orbit), 3.75 + breath * 0.18, 8.2 * Math.sin(orbit) + 6.7);
      target.current.lerp(new THREE.Vector3(0.1, 1.22 + breath * 0.025, -0.18), 0.022);
    }

    camera.position.lerp(desired.current, journeyActive ? 0.04 : startHover ? 0.026 : 0.012);
    (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp((camera as THREE.PerspectiveCamera).fov, journeyActive ? 27 : startHover ? 31 : 34, 0.028);
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    camera.lookAt(target.current);

    if (debugEnabled && clock.current - lastCameraLog.current > 2) {
      lastCameraLog.current = clock.current;
      console.debug("[Project Genesis] camera position", {
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2)),
        fov: Number((camera as THREE.PerspectiveCamera).fov.toFixed(1)),
        journeyActive,
        startHover
      });
    }
  });

  return null;
}

function DiagnosticCube() {
  return (
    <mesh position={[0, 1.2, 0]} castShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshNormalMaterial />
    </mesh>
  );
}

function LuxuryConstructionWorld({ quality, journeyActive }: { quality: GenesisQuality; journeyActive: boolean }) {
  return (
    <group position={[0, -0.16, 0]}>
      <GroundPlane quality={quality} />
      <CityHorizon quality={quality} />
      <LuxuryPool quality={quality} />
      <ProceduralVilla journeyActive={journeyActive} />
      <Landscape quality={quality} />
      <EntrancePath quality={quality} />
      {quality !== "low" ? <ArchitecturalMeasurements /> : null}
    </group>
  );
}

function GroundPlane({ quality }: { quality: GenesisQuality }) {
  const roughness = quality === "low" ? 0.92 : 0.84;
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <planeGeometry args={[54, 54]} />
        <meshPhysicalMaterial color="#050607" roughness={roughness} metalness={0.06} clearcoat={0.08} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, -0.65]}>
        <planeGeometry args={[14.5, 9.6]} />
        <meshPhysicalMaterial color="#151719" roughness={0.58} metalness={0.18} clearcoat={0.16} />
      </mesh>
    </group>
  );
}

function ProceduralVilla({ journeyActive }: { journeyActive: boolean }) {
  const pulse = journeyActive ? 1.35 : 1;
  const concrete = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#d5cebf",
        roughness: 0.58,
        metalness: 0.04,
        clearcoat: 0.08,
        clearcoatRoughness: 0.72
      }),
    []
  );
  const darkConcrete = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#232321",
        roughness: 0.5,
        metalness: 0.12,
        clearcoat: 0.18
      }),
    []
  );
  const warmStone = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#b9aa8f",
        roughness: 0.64,
        metalness: 0.03,
        clearcoat: 0.08
      }),
    []
  );
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#bfefff",
        roughness: 0.025,
        metalness: 0.02,
        transmission: 0.42,
        thickness: 0.55,
        ior: 1.45,
        transparent: true,
        opacity: 0.46,
        clearcoat: 1,
        clearcoatRoughness: 0.04
      }),
    []
  );
  const metal = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#111827",
        roughness: 0.24,
        metalness: 0.82,
        clearcoat: 0.45
      }),
    []
  );

  return (
    <group position={[0.15, 0, -0.85]}>
      <mesh castShadow receiveShadow position={[0, 0.52, 0]} material={concrete}>
        <boxGeometry args={[5.75, 1.05, 2.95]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.02, 1.64, -0.18]} material={concrete}>
        <boxGeometry args={[3.72, 1.24, 2.65]} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.7, 1.62, 0.22]} material={warmStone}>
        <boxGeometry args={[2.7, 1.18, 2.38]} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.05, 2.36, 0]} material={darkConcrete}>
        <boxGeometry args={[6.45, 0.18, 3.45]} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.86, 1.11, 1.58]} material={darkConcrete}>
        <boxGeometry args={[5.4, 0.16, 0.34]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.1, 2.25, 1.44]} material={darkConcrete}>
        <boxGeometry args={[5.6, 0.16, 0.28]} />
      </mesh>
      <GlassWall material={glass} position={[-0.62, 0.75, 1.51]} scale={[4.65, 0.92, 0.08]} />
      <GlassWall material={glass} position={[1.72, 1.72, 1.31]} scale={[2.45, 0.86, 0.08]} />
      <GlassWall material={glass} position={[-1.18, 1.72, 1.31]} scale={[1.92, 0.86, 0.08]} />
      <GlassWall material={glass} position={[2.98, 0.82, 0.2]} scale={[0.08, 0.94, 1.85]} />
      <GlassWall material={glass} position={[-2.9, 0.78, -0.22]} scale={[0.08, 0.9, 1.72]} />
      <Entrance material={metal} />
      <Balcony material={metal} />
      <RoofLights journeyActive={journeyActive} pulse={pulse} />
      <InteriorGlow position={[-1.8, 0.86, 1.26]} pulse={pulse} />
      <InteriorGlow position={[0.32, 0.86, 1.28]} pulse={pulse} />
      <InteriorGlow position={[1.62, 1.82, 1.1]} pulse={pulse} />
      <ConcreteImperfections />
    </group>
  );
}

function GlassWall({ material, position, scale }: { material: THREE.Material; position: VectorTuple; scale: VectorTuple }) {
  return (
    <mesh castShadow position={position} material={material}>
      <boxGeometry args={scale} />
    </mesh>
  );
}

function Entrance({ material }: { material: THREE.Material }) {
  return (
    <group position={[-2.2, 0.56, 1.56]}>
      <mesh castShadow receiveShadow material={material}>
        <boxGeometry args={[0.78, 1.08, 0.12]} />
      </mesh>
      <mesh castShadow position={[0, 0.68, 0.09]}>
        <boxGeometry args={[1.08, 0.08, 0.14]} />
        <meshPhysicalMaterial color={gold} roughness={0.22} metalness={0.45} emissive="#5f4012" emissiveIntensity={0.25} />
      </mesh>
      <pointLight position={[0, 0.9, 0.38]} color={brightGold} intensity={1.25} distance={3.4} />
    </group>
  );
}

function Balcony({ material }: { material: THREE.Material }) {
  const rails = [-2.1, -1.05, 0, 1.05, 2.1];
  return (
    <group>
      {rails.map((x) => (
        <mesh key={x} castShadow position={[x, 1.5, 1.55]} material={material}>
          <boxGeometry args={[0.035, 0.48, 0.04]} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.72, 1.55]}>
        <boxGeometry args={[4.62, 0.035, 0.045]} />
        <meshPhysicalMaterial color={gold} metalness={0.45} roughness={0.24} emissive="#4d330d" emissiveIntensity={0.32} />
      </mesh>
      <mesh receiveShadow position={[0, 1.29, 1.22]}>
        <boxGeometry args={[4.92, 0.1, 0.78]} />
        <meshPhysicalMaterial color="#1b1d20" roughness={0.45} metalness={0.2} />
      </mesh>
    </group>
  );
}

function RoofLights({ journeyActive, pulse }: { journeyActive: boolean; pulse: number }) {
  return (
    <group>
      <EmissiveStrip position={[0.1, 2.48, 1.7]} scale={[5.8, 0.04, 0.04]} pulse={pulse} />
      <EmissiveStrip position={[-3.1, 1.08, 1.7]} scale={[0.04, 0.04, 2.35]} pulse={pulse} />
      <EmissiveStrip position={[3.06, 1.08, 1.62]} scale={[0.04, 0.04, 2.18]} pulse={pulse} />
      {journeyActive ? <pointLight position={[0, 2.5, 1.4]} color={gold} intensity={1.2} distance={7} /> : null}
    </group>
  );
}

function EmissiveStrip({ position, scale, pulse }: { position: VectorTuple; scale: VectorTuple; pulse: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={scale} />
      <meshBasicMaterial color={brightGold} />
      <pointLight color={gold} intensity={0.14 * pulse} distance={2.6} />
    </mesh>
  );
}

function InteriorGlow({ position, pulse }: { position: VectorTuple; pulse: number }) {
  return <pointLight position={position} color="#f5c77a" intensity={1.08 * pulse} distance={3.25} />;
}

function ConcreteImperfections() {
  const marks = [
    [-1.9, 1.04, 1.57, 0.62],
    [0.15, 1.03, 1.57, 0.36],
    [1.74, 2.04, 1.38, 0.42],
    [-2.54, 0.58, -1.52, 0.32],
    [2.2, 1.98, -1.2, 0.28]
  ] as const;
  return (
    <group>
      {marks.map(([x, y, z, width], index) => (
        <mesh key={`${x}-${index}`} position={[x, y, z]} rotation={[0, 0, index % 2 ? 0.03 : -0.02]}>
          <planeGeometry args={[width, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function LuxuryPool({ quality }: { quality: GenesisQuality }) {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!waterRef.current) return;
    waterRef.current.rotation.z += delta * 0.035;
    const material = waterRef.current.material;
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.opacity = 0.66 + Math.sin(performance.now() * 0.0012) * 0.045;
    }
  });

  return (
    <group position={[-2.75, 0.03, 2.75]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.014, 0]}>
        <planeGeometry args={[6.25, 2.7]} />
        <meshPhysicalMaterial color="#05090b" roughness={0.72} metalness={0.25} />
      </mesh>
      <mesh ref={waterRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.85, 2.32, quality === "high" ? 38 : 18, quality === "high" ? 16 : 8]} />
        <meshPhysicalMaterial color="#0f7896" roughness={0.025} metalness={0.08} transmission={0.18} thickness={0.36} transparent opacity={0.7} clearcoat={1} clearcoatRoughness={0.03} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <ringGeometry args={[1.0, 3.02, 72]} />
        <meshBasicMaterial color={cyan} transparent opacity={0.055} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color={cyan} intensity={1.35} distance={7} />
    </group>
  );
}

function Landscape({ quality }: { quality: GenesisQuality }) {
  const trees = [
    [-5.25, 0, -2.6],
    [-6.2, 0, 0.6],
    [4.45, 0, -2.4],
    [5.85, 0, 1.5],
    [-4.25, 0, 4.35],
    [4.05, 0, 4.75],
    [6.8, 0, -4.2],
    [-6.9, 0, -4.0]
  ] as const;
  const bushes = [
    [-3.1, 0, 0.9],
    [3.3, 0, 2.05],
    [1.4, 0, 4.2],
    [-5.4, 0, 2.8],
    [5.2, 0, 3.45]
  ] as const;
  const visibleTrees = quality === "low" ? trees.slice(0, 4) : trees;

  return (
    <group>
      {visibleTrees.map(([x, y, z]) => (
        <PremiumTree key={`${x}-${z}`} position={[x, y, z]} quality={quality} />
      ))}
      {quality !== "low"
        ? bushes.map(([x, y, z]) => (
            <mesh key={`${x}-${z}`} castShadow position={[x, y + 0.2, z]}>
              <sphereGeometry args={[0.32, 10, 8]} />
              <meshPhysicalMaterial color="#183822" roughness={0.9} />
            </mesh>
          ))
        : null}
      {quality !== "low" ? <DecorativeRocks /> : null}
    </group>
  );
}

function PremiumTree({ position, quality }: { position: VectorTuple; quality: GenesisQuality }) {
  const crownRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!crownRef.current || quality === "low") return;
    crownRef.current.rotation.z = Math.sin(performance.now() * 0.0007 + position[0]) * 0.025;
    crownRef.current.rotation.y += delta * 0.006;
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.07, 0.14, 0.96, 8]} />
        <meshPhysicalMaterial color="#4b2d18" roughness={0.76} />
      </mesh>
      <group ref={crownRef} position={[0, 1.16, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.58, 1.04, 10]} />
          <meshPhysicalMaterial color="#153623" roughness={0.84} />
        </mesh>
        {quality === "high" ? (
          <mesh castShadow position={[0.12, 0.1, -0.1]}>
            <coneGeometry args={[0.44, 0.82, 10]} />
            <meshPhysicalMaterial color="#1d4a2c" roughness={0.86} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}

function DecorativeRocks() {
  const rocks = [
    [-3.8, 0.06, 3.85, 0.24],
    [2.8, 0.05, 3.55, 0.18],
    [4.9, 0.05, -0.6, 0.22],
    [-5.1, 0.05, -0.8, 0.17]
  ] as const;
  return (
    <group>
      {rocks.map(([x, y, z, s]) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, y, z]} rotation={[0.2, 0.4, -0.12]}>
          <dodecahedronGeometry args={[s, 0]} />
          <meshPhysicalMaterial color="#313235" roughness={0.72} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function EntrancePath({ quality }: { quality: GenesisQuality }) {
  const pathLights = [-3.8, -2.3, -0.8, 0.8, 2.3, 3.8];
  return (
    <group>
      <mesh receiveShadow position={[0, 0.006, 4.34]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.4, 0.86]} />
        <meshPhysicalMaterial color="#16120c" roughness={0.78} metalness={0.1} />
      </mesh>
      {pathLights.map((x, index) => (
        <group key={x} position={[x, 0.07, 3.86 + (index % 2) * 0.38]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.2, 10]} />
            <meshPhysicalMaterial color="#1f2937" metalness={0.62} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshBasicMaterial color={brightGold} />
          </mesh>
          {quality !== "low" ? <pointLight position={[0, 0.25, 0]} color={gold} intensity={0.58} distance={2.45} /> : null}
        </group>
      ))}
    </group>
  );
}

function CityHorizon({ quality }: { quality: GenesisQuality }) {
  if (quality === "low") return null;
  const buildings = Array.from({ length: 16 }, (_, index) => ({
    x: -9 + index * 1.25,
    h: 0.45 + ((index * 7) % 11) * 0.12,
    z: -10.5 - (index % 3) * 0.35
  }));
  return (
    <group>
      {buildings.map((building, index) => (
        <mesh key={index} position={[building.x, building.h / 2 - 0.02, building.z]}>
          <boxGeometry args={[0.5, building.h, 0.42]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#10243d" : "#0f172a"} transparent opacity={0.66} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, -11.2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[22, 1.4]} />
        <meshBasicMaterial color={cyan} transparent opacity={0.035} />
      </mesh>
    </group>
  );
}

function ArchitecturalMeasurements() {
  return (
    <group position={[0.15, 0.08, -0.85]}>
      <Line points={[[-3.45, 0.02, 2.05], [3.45, 0.02, 2.05]]} color={cyan} lineWidth={1} transparent opacity={0.42} />
      <Line points={[[3.45, 0.02, 2.05], [3.45, 0.02, -1.9]]} color={cyan} lineWidth={1} transparent opacity={0.28} />
      <Line points={[[-3.45, 0.02, -1.9], [3.45, 0.02, -1.9]]} color={gold} lineWidth={1} transparent opacity={0.25} />
      <mesh position={[-3.45, 0.02, 2.05]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={cyan} />
      </mesh>
      <mesh position={[3.45, 0.02, 2.05]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={gold} />
      </mesh>
    </group>
  );
}

function HolographicVora({ journeyActive, quality }: { journeyActive: boolean; quality: GenesisQuality }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 1.08 + Math.sin(performance.now() * 0.0013) * 0.08;
    groupRef.current.rotation.y += delta * 0.09;
  });

  if (quality === "low") return null;

  return (
    <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.18}>
      <group ref={groupRef} position={[4.25, 1.08, 1.48]} scale={journeyActive ? 1.16 : 1}>
        <mesh>
          <sphereGeometry args={[0.42, 28, 20]} />
          <meshPhysicalMaterial color={cyan} transparent opacity={0.24} roughness={0.04} metalness={0.1} transmission={0.35} thickness={0.24} clearcoat={1} />
        </mesh>
        <mesh scale={[1.18, 1.18, 1.18]}>
          <sphereGeometry args={[0.42, 28, 20]} />
          <meshBasicMaterial color={cyan} wireframe transparent opacity={0.18} />
        </mesh>
        <mesh position={[-0.14, 0.06, 0.36]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshBasicMaterial color="#dffaff" />
        </mesh>
        <mesh position={[0.14, 0.06, 0.36]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshBasicMaterial color="#dffaff" />
        </mesh>
        <mesh position={[0, -0.18, 0.36]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.13, 0.008, 8, 22, Math.PI]} />
          <meshBasicMaterial color="#dffaff" />
        </mesh>
        <mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.58, 0.78, 48]} />
          <meshBasicMaterial color={cyan} transparent opacity={journeyActive ? 0.34 : 0.18} side={THREE.DoubleSide} />
        </mesh>
        <pointLight color={cyan} intensity={journeyActive ? 1.7 : 1.05} distance={4.8} />
      </group>
    </Float>
  );
}

function BlueprintGrid({ visible }: { visible: boolean }) {
  const opacity = visible ? 0.32 : 0.1;
  return (
    <group position={[0, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8, 1, 1]} />
        <meshBasicMaterial color={cyan} wireframe transparent opacity={opacity} />
      </mesh>
      {[-5, -3, -1, 1, 3, 5].map((x) => (
        <mesh key={`x-${x}`} position={[x, 0.052, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 8]} />
          <meshBasicMaterial color={cyan} transparent opacity={visible ? 0.26 : 0.08} />
        </mesh>
      ))}
      {[-3.5, -2, -0.5, 1, 2.5, 4].map((z) => (
        <mesh key={`z-${z}`} position={[0, 0.054, z]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.012, 12]} />
          <meshBasicMaterial color={visible ? cyan : gold} transparent opacity={visible ? 0.24 : 0.075} />
        </mesh>
      ))}
    </group>
  );
}

function genesisCanvasDebug(enabled: boolean, label: string, payload?: Record<string, unknown>) {
  if (!enabled) return;
  console.debug(`[Project Genesis] ${label}`, payload || {});
}
