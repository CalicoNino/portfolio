import type * as T from "three";

type ThreeNS = typeof import("three");

interface WakeParticle {
  mesh: T.Mesh;
  mat: T.MeshBasicMaterial;
  active: boolean;
  age: number;
  life: number;
  startScale: number;
  endScale: number;
  maxOpacity: number;
  /** lateral drift (units/s) — bow foam slides outward to draw the V-wake */
  driftX: number;
  driftZ: number;
}

export interface Wake {
  /** Advance foam particles; spawns new ones behind the ship while it moves.
   *  `speed` is signed world units/s, `maxSpeed` the ship's top speed. */
  update(dt: number, x: number, z: number, angle: number, speed: number, maxSpeed: number): void;
  dispose(): void;
}

const POOL_SIZE = 90;

export function buildWake(scene: T.Scene, THREE: ThreeNS): Wake {
  const group = new THREE.Group();
  scene.add(group);

  // Soft round foam blob — radial gradient so patches blend into the water.
  const foamTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,    "rgba(255,255,255,0.9)");
    g.addColorStop(0.45, "rgba(255,255,255,0.5)");
    g.addColorStop(1,    "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const quad = new THREE.PlaneGeometry(1, 1);
  const particles: WakeParticle[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: foamTex, transparent: true, opacity: 0,
      depthWrite: false, fog: true,
    });
    const mesh = new THREE.Mesh(quad, mat);
    mesh.rotation.x = -Math.PI / 2; // lie flat on the water
    mesh.position.y = 0.3;          // just above the surface, no z-fighting
    mesh.renderOrder = 2;
    mesh.visible = false;
    group.add(mesh);
    particles.push({
      mesh, mat, active: false, age: 0, life: 1,
      startScale: 1, endScale: 1, maxOpacity: 0,
      driftX: 0, driftZ: 0,
    });
  }

  let cursor = 0; // round-robin pool slot — oldest particle gets recycled
  const spawn = (
    x: number, z: number,
    startScale: number, endScale: number,
    life: number, maxOpacity: number,
    driftX = 0, driftZ = 0,
  ) => {
    const p = particles[cursor];
    cursor = (cursor + 1) % POOL_SIZE;
    p.active = true;
    p.age = 0;
    p.life = life;
    p.startScale = startScale;
    p.endScale = endScale;
    p.maxOpacity = maxOpacity;
    p.driftX = driftX;
    p.driftZ = driftZ;
    p.mesh.position.x = x;
    p.mesh.position.z = z;
    p.mesh.scale.setScalar(startScale);
    p.mesh.visible = true;
  };

  let spawnAccum = 0;
  let bowSide = 1;

  const update = (dt: number, x: number, z: number, angle: number, speed: number, maxSpeed: number) => {
    // Age & fade the live particles.
    for (const p of particles) {
      if (!p.active) continue;
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.x += p.driftX * dt;
      p.mesh.position.z += p.driftZ * dt;
      p.mesh.scale.setScalar(p.startScale + (p.endScale - p.startScale) * t);
      // quick fade-in, long fade-out
      const fadeIn = t < 0.12 ? t / 0.12 : 1;
      p.mat.opacity = p.maxOpacity * fadeIn * (1 - t);
    }

    const spd = Math.min(Math.abs(speed) / maxSpeed, 1);
    if (spd < 0.03) return; // anchored — leave the water calm

    // Ship-local axes: the hull moves along +（sin a, cos a).
    const fx = Math.sin(angle), fz = Math.cos(angle);   // forward
    const rx = Math.cos(angle), rz = -Math.sin(angle);  // starboard

    spawnAccum += dt * (4 + spd * 24); // spawn rate scales with speed
    while (spawnAccum >= 1) {
      spawnAccum -= 1;

      // Stern foam — churned water trailing the hull.
      const back = 8 + Math.random() * 4;
      const lat  = (Math.random() - 0.5) * 3.5;
      spawn(
        x - fx * back + rx * lat,
        z - fz * back + rz * lat,
        1.5 + spd * 1.5,        // start small…
        6 + spd * 7,            // …spread wide as it dissipates
        1.4 + Math.random() * 0.9,
        0.22 + spd * 0.2,
      );

      // Bow waves — foam peels off both sides of the bow and drifts outward,
      // so the trail left behind spreads into the classic V-wake.
      if (spd > 0.15) {
        bowSide = -bowSide;
        const driftSpeed = (2.2 + spd * 3.5) * bowSide;
        spawn(
          x + fx * 5 + rx * bowSide * 3.2,
          z + fz * 5 + rz * bowSide * 3.2,
          1.0,
          3.0 + spd * 3.5,
          1.4 + Math.random() * 0.7,
          0.18 + spd * 0.24,
          rx * driftSpeed,
          rz * driftSpeed,
        );
      }
    }
  };

  const dispose = () => {
    scene.remove(group);
    quad.dispose();
    foamTex.dispose();
    for (const p of particles) p.mat.dispose();
  };

  return { update, dispose };
}
