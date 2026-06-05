import type * as T from "three";
import type { IslandDef } from "./config";
import {
  CHEST_CHANCE, CHEST_POINTS, COLLECT_RADIUS, COLLECTIBLE_COUNT, CRATE_POINTS,
} from "./config";

type ThreeNS = typeof import("three");

type Kind = "crate" | "chest";

interface Item {
  group: T.Group;
  kind: Kind;
  points: number;
  baseY: number;
  bobPhase: number;
  spin: number;
  /** elapsed time the pickup pop started, or -1 when idle/floating. */
  popStart: number;
}

export interface Collectibles {
  group: T.Group;
  /** advance bob/spin animation; when in play mode, scoop up nearby items.
   *  returns points gained this frame. */
  update(elapsed: number, shipX: number, shipZ: number, collect: boolean): number;
  dispose(): void;
}

/** Random water position clear of islands and the world edge. */
function randomWaterPos(
  islands: IslandDef[], worldR: number,
): { x: number; z: number } {
  for (let tries = 0; tries < 40; tries++) {
    const a = Math.random() * Math.PI * 2;
    const r = 120 + Math.random() * (worldR - 160);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    let clear = true;
    for (const isl of islands) {
      const dx = x - isl.x, dz = z - isl.z;
      if (dx * dx + dz * dz < (isl.radius + 18) ** 2) { clear = false; break; }
    }
    if (clear) return { x, z };
  }
  // Fallback: drop it somewhere reasonable rather than loop forever.
  return { x: (Math.random() - 0.5) * worldR, z: (Math.random() - 0.5) * worldR };
}

export function buildCollectibles(
  scene: T.Scene,
  islands: IslandDef[],
  worldR: number,
  THREE: ThreeNS,
): Collectibles {
  const group = new THREE.Group();
  scene.add(group);

  // ── Soft glow beacon so items are visible from across the water ─────────────
  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,   "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,255,255,0.45)");
    g.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const crateGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffe6a0, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  const chestGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffc23a, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });

  // ── Shared geometries / materials (cheap — every item reuses these) ─────────
  const wood     = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.85, emissive: 0x2a1808, emissiveIntensity: 0.35 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.9,  emissive: 0x1a1004, emissiveIntensity: 0.3 });
  const gold     = new THREE.MeshStandardMaterial({ color: 0xffcb45, roughness: 0.35, metalness: 0.85, emissive: 0x6a4a00, emissiveIntensity: 0.55 });

  const crateGeo  = new THREE.BoxGeometry(2, 2, 2);
  const crateEdge = new THREE.EdgesGeometry(crateGeo);
  const edgeMat   = new THREE.LineBasicMaterial({ color: 0x3a2410, transparent: true, opacity: 0.6 });

  const chestBaseGeo  = new THREE.BoxGeometry(2.9, 1.5, 2);
  const chestLidGeo   = new THREE.CylinderGeometry(1, 1, 2.9, 14, 1, false, 0, Math.PI);
  const chestBandGeo  = new THREE.BoxGeometry(3.1, 0.32, 0.32);
  const chestLockGeo  = new THREE.BoxGeometry(0.5, 0.6, 0.22);

  const makeCrate = (): T.Group => {
    const g = new THREE.Mesh(crateGeo, wood);
    g.castShadow = true;
    const edges = new THREE.LineSegments(crateEdge, edgeMat);
    const wrap = new THREE.Group();
    wrap.add(g); wrap.add(edges);
    return wrap;
  };

  const makeChest = (): T.Group => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(chestBaseGeo, wood);
    base.position.y = 0.75; base.castShadow = true;
    const lid = new THREE.Mesh(chestLidGeo, woodDark);
    lid.rotation.z = Math.PI / 2;            // barrel lid lying across the length
    lid.position.y = 1.5; lid.castShadow = true;
    // gold straps + lock
    const bandFront = new THREE.Mesh(chestBandGeo, gold); bandFront.position.set(0, 0.75, 0.88);
    const bandBack  = new THREE.Mesh(chestBandGeo, gold); bandBack.position.set(0, 0.75, -0.88);
    const lock = new THREE.Mesh(chestLockGeo, gold);      lock.position.set(0, 0.8, 1.02);
    g.add(base, lid, bandFront, bandBack, lock);
    return g;
  };

  const items: Item[] = [];
  for (let i = 0; i < COLLECTIBLE_COUNT; i++) {
    const kind: Kind = Math.random() < CHEST_CHANCE ? "chest" : "crate";
    const mesh = kind === "chest" ? makeChest() : makeCrate();
    const { x, z } = randomWaterPos(islands, worldR);
    const baseY = kind === "chest" ? 0.4 : 0.8;
    mesh.position.set(x, baseY, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    // floating glow beacon (billboard — always faces the camera)
    const beacon = new THREE.Sprite(kind === "chest" ? chestGlowMat : crateGlowMat);
    beacon.scale.setScalar(kind === "chest" ? 7 : 5);
    beacon.position.y = 2.6;
    mesh.add(beacon);
    group.add(mesh);
    items.push({
      group: mesh, kind,
      points: kind === "chest" ? CHEST_POINTS : CRATE_POINTS,
      baseY, bobPhase: Math.random() * Math.PI * 2,
      spin: (Math.random() < 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.3),
      popStart: -1,
    });
  }

  const POP_DUR = 0.45;
  const r2 = COLLECT_RADIUS * COLLECT_RADIUS;

  const update = (elapsed: number, shipX: number, shipZ: number, collect: boolean): number => {
    let gained = 0;
    crateGlowMat.opacity = 0.42 + Math.sin(elapsed * 2.0) * 0.18;
    chestGlowMat.opacity = 0.55 + Math.sin(elapsed * 2.6) * 0.22;
    for (const it of items) {
      if (it.popStart >= 0) {
        // Pickup animation: pop up + spin + shrink, then respawn elsewhere.
        const t = (elapsed - it.popStart) / POP_DUR;
        if (t >= 1) {
          const { x, z } = randomWaterPos(islands, worldR);
          it.group.position.set(x, it.baseY, z);
          it.group.scale.setScalar(1);
          it.bobPhase = Math.random() * Math.PI * 2;
          it.popStart = -1;
        } else {
          const s = Math.max(0.001, 1 - t);
          it.group.scale.setScalar(s);
          it.group.position.y = it.baseY + t * 6;
          it.group.rotation.y += 0.4;
        }
        continue;
      }

      // Idle float: gentle bob + slow spin.
      it.group.position.y = it.baseY + Math.sin(elapsed * 1.1 + it.bobPhase) * 0.5;
      it.group.rotation.y += it.spin * 0.016;

      if (collect) {
        const dx = it.group.position.x - shipX, dz = it.group.position.z - shipZ;
        if (dx * dx + dz * dz < r2) {
          gained += it.points;
          it.popStart = elapsed;
        }
      }
    }
    return gained;
  };

  const dispose = () => {
    scene.remove(group);
    crateGeo.dispose(); crateEdge.dispose();
    chestBaseGeo.dispose(); chestLidGeo.dispose(); chestBandGeo.dispose(); chestLockGeo.dispose();
    wood.dispose(); woodDark.dispose(); gold.dispose(); edgeMat.dispose();
    glowTex.dispose(); crateGlowMat.dispose(); chestGlowMat.dispose();
  };

  return { group, update, dispose };
}
