import type * as T from "three";
import type { IslandDef } from "./config";

type ThreeNS = typeof import("three");

export function buildProceduralIslands(
  scene: T.Scene,
  islands: IslandDef[],
  THREE: ThreeNS,
): void {
  const rng = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

  const sandMat  = new THREE.MeshStandardMaterial({ color: 0xc8a87a, roughness: 0.9 });
  const rockMat  = new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 0.95 });
  const dRockMat = new THREE.MeshStandardMaterial({ color: 0x2a2820, roughness: 0.95 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 0.9 });
  const woodI    = new THREE.MeshStandardMaterial({ color: 0x6b4020, roughness: 0.85 });
  const buildMat = new THREE.MeshStandardMaterial({ color: 0xd4c090, roughness: 0.9 });
  const fortMat  = new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: 0.95 });

  for (const isl of islands) {
    const g = new THREE.Group();
    g.position.set(isl.x, 0, isl.z);
    if (isl.glbOnly) { scene.add(g); continue; }

    const base = new THREE.Mesh(new THREE.CylinderGeometry(isl.radius * 0.88, isl.radius * 1.12, 3, 16), sandMat);
    base.position.y = -1.2; base.castShadow = true; base.receiveShadow = true; g.add(base);

    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2 + rng(-0.3, 0.3), dist = isl.radius * rng(0.65, 0.90), rh = rng(1.5, 5);
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(rng(0.8, 1.8), rng(1.5, 3), rh, 6), rockMat);
      rock.position.set(Math.cos(ang) * dist, rh / 2, Math.sin(ang) * dist);
      rock.rotation.y = rng(0, Math.PI); rock.castShadow = true; g.add(rock);
    }

    if (isl.type === "lighthouse") {
      const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 3.5, 12), stoneMat);
      lhBase.position.y = 2.8; lhBase.castShadow = true; g.add(lhBase);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 24, 12), new THREE.MeshStandardMaterial({ color: 0xf5f0e8 }));
      tower.position.y = 16; tower.castShadow = true; g.add(tower);
      const dome = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4, 12), new THREE.MeshStandardMaterial({ color: 0xaa3322 }));
      dome.position.y = 30; dome.castShadow = true; g.add(dome);
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 12), new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.7 }));
      lantern.position.y = 28; g.add(lantern);
      const lhPt = new THREE.PointLight(0xffffaa, 6, 280); lhPt.position.set(0, 29, 0); g.add(lhPt);
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.TorusGeometry(3, 0.35, 4, 12), new THREE.MeshStandardMaterial({ color: 0xcc2211 }));
        s.position.y = 7 + i * 5; s.rotation.x = Math.PI / 2; g.add(s);
      }
    } else if (isl.type === "fort") {
      const wallH = 10, wallR = 17;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(wallR * 0.82, wallH, 1.8), fortMat);
        wall.position.set(Math.cos(ang) * wallR * 0.5, wallH / 2, Math.sin(ang) * wallR * 0.5);
        wall.rotation.y = ang + Math.PI / 2; wall.castShadow = true; g.add(wall);
      }
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, wallH + 4, 8), fortMat);
        t.position.set(Math.cos(ang) * wallR * 0.7, (wallH + 4) / 2, Math.sin(ang) * wallR * 0.7);
        t.castShadow = true; g.add(t);
      }
      const keep = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, wallH + 8, 10), fortMat);
      keep.position.y = (wallH + 8) / 2; keep.castShadow = true; g.add(keep);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 6), woodI);
      pole.position.y = wallH + 8 + 3; g.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.2), new THREE.MeshBasicMaterial({ color: 0x1a3a8a, side: THREE.DoubleSide }));
      flag.position.set(1.8, wallH + 8 + 5.5, 0); g.add(flag);
    } else if (isl.type === "ruins") {
      const ground = new THREE.Mesh(new THREE.CircleGeometry(isl.radius * 0.65, 14), grassMat);
      ground.rotation.x = -Math.PI / 2; ground.position.y = 0.5; g.add(ground);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2, ch = rng(4, 14);
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, ch, 8), stoneMat);
        col.position.set(Math.cos(ang) * isl.radius * rng(0.25, 0.45), ch / 2, Math.sin(ang) * isl.radius * rng(0.25, 0.45));
        col.castShadow = true; g.add(col);
        if (Math.random() > 0.45) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 2.4), stoneMat);
          cap.position.set(col.position.x, ch + 0.35, col.position.z); cap.rotation.y = rng(0, Math.PI); g.add(cap);
        }
      }
      for (let i = 0; i < 5; i++) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(rng(3, 6), 1, rng(1.5, 3)), stoneMat);
        slab.position.set(rng(-12, 12), 0.5, rng(-12, 12)); slab.rotation.y = rng(0, Math.PI); slab.rotation.x = rng(-0.3, 0.3); slab.castShadow = true; g.add(slab);
      }
    } else if (isl.type === "jungle") {
      const ground = new THREE.Mesh(new THREE.CircleGeometry(isl.radius * 0.72, 16), grassMat);
      ground.rotation.x = -Math.PI / 2; ground.position.y = 0.5; g.add(ground);
      const treeMat = new THREE.MeshStandardMaterial({ color: 0x1a4a0e, roughness: 0.9 });
      for (let i = 0; i < 28; i++) {
        const ang = rng(0, Math.PI * 2), r = rng(2, isl.radius * 0.72);
        const tg = new THREE.Group(); tg.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
        const th = rng(3, 8);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, th, 6), woodI);
        trunk.position.y = th / 2; trunk.castShadow = true; tg.add(trunk);
        for (let j = 0; j < 3; j++) {
          const crown = new THREE.Mesh(new THREE.ConeGeometry(2.8 - j * 0.5, 3.2, 8), treeMat);
          crown.position.y = th + j * 2.2; crown.castShadow = true; tg.add(crown);
        }
        g.add(tg);
      }
    } else if (isl.type === "port") {
      const ground = new THREE.Mesh(new THREE.CircleGeometry(isl.radius * 0.68, 14), new THREE.MeshStandardMaterial({ color: 0xc8b47a, roughness: 0.9 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = 0.5; g.add(ground);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xaa4422 });
      for (let i = 0; i < 5; i++) {
        const bw = rng(5, 9), bh = rng(5, 10), bd = rng(4, 7);
        const bld = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), buildMat);
        bld.position.set(-14 + i * 7 + rng(-1, 1), bh / 2, rng(-5, 5)); bld.castShadow = true; g.add(bld);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(bw, bd) * 0.78, 4, 4), roofMat);
        roof.position.set(bld.position.x, bh + 1.8, bld.position.z); roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
      }
      const dock = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 6), woodI);
      dock.position.set(4, 0.3, -22); dock.rotation.y = 0.15; g.add(dock);
      for (const lx of [-9, 9]) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa44 }));
        l.position.set(lx, 9, -20); g.add(l);
        const pt = new THREE.PointLight(0xffaa44, 3, 70); pt.position.set(lx, 9, -20); g.add(pt);
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + rng(-0.3, 0.3), r = rng(4, isl.radius * 0.65), h = rng(10, 30);
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(rng(0.3, 1.2), rng(2, 4), h, 6), dRockMat);
        spire.position.set(Math.cos(ang) * r, h / 2, Math.sin(ang) * r); spire.rotation.y = rng(0, Math.PI); spire.castShadow = true; g.add(spire);
      }
    }

    scene.add(g);
  }
}
