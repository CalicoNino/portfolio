import type * as T from "three";
import type { IslandDef } from "./config";

type ThreeNS = typeof import("three");

function seededRng(seed: number) {
  let s = (seed | 0) + 1;
  return (lo: number, hi: number): number => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return lo + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (hi - lo);
  };
}

export function buildProceduralIslands(
  scene: T.Scene,
  islands: IslandDef[],
  THREE: ThreeNS,
): void {
  const S = (
    c: number, r = 0.9, m = 0,
    extra: Partial<T.MeshStandardMaterialParameters> = {},
  ) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });

  const M = {
    sand:    S(0xd4b87a, 0.96),
    sandDk:  S(0xb89860, 0.96),
    sandW:   S(0xe8d4a0, 0.94),
    rock:    S(0x6e6455, 0.97),
    rockDk:  S(0x3a3028, 0.97),
    rockMd:  S(0x524840, 0.97),
    rockLt:  S(0x8a7e6e, 0.95),
    grass:   S(0x3a8822, 0.9),
    grassD:  S(0x1e5510, 0.92),
    grassL:  S(0x5aaa34, 0.88),
    stone:   S(0x9e8e7c, 0.93),
    stoneDk: S(0x6a5e50, 0.95),
    stoneL:  S(0xd4c8b0, 0.88),
    mossSt:  S(0x4a6a38, 0.95),
    wood:    S(0x7a4a20, 0.85),
    woodDk:  S(0x402510, 0.88),
    woodL:   S(0xa06030, 0.82),
    white:   S(0xf0ece0, 0.82),
    red:     S(0xaa2211, 0.8),
    redDk:   S(0x7a1808, 0.85),
    build:   S(0xdcca90, 0.88),
    buildDk: S(0xb8a468, 0.9),
    roof:    S(0x8a3822, 0.82),
    roofDk:  S(0x3a1a10, 0.9),
    metal:   S(0x484640, 0.45, 0.7),
    metalDk: S(0x2a2820, 0.5, 0.6),
    glass:   S(0x88ccee, 0.1, 0.2, { transparent: true, opacity: 0.55 }),
    leaf:    S(0x2a8a12, 0.85, 0, { side: THREE.DoubleSide }),
    leafL:   S(0x4aaa22, 0.8, 0, { side: THREE.DoubleSide }),
    leafDk:  S(0x1a5a08, 0.9, 0, { side: THREE.DoubleSide }),
    palm:    S(0x3a9a18, 0.82, 0, { side: THREE.DoubleSide }),
    barrel:  S(0x5a3a14, 0.88),
    iron:    S(0x2a2820, 0.6, 0.5),
    lantern: S(0xffcc44, 0.3, 0, { emissive: new THREE.Color(0xffaa22), emissiveIntensity: 0.6 }),
    water:   S(0x1a5a9a, 0.25, 0.15, { transparent: true, opacity: 0.75 }),
  };

  const add = (parent: T.Object3D, geo: T.BufferGeometry, mat: T.Material, shadow = true): T.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m);
    return m;
  };

  const cyl  = (rT: number, rB: number, h: number, s = 12) => new THREE.CylinderGeometry(rT, rB, h, s);
  const box  = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const sph  = (r: number, ws = 8, hs = 6) => new THREE.SphereGeometry(r, ws, hs);
  const cone = (r: number, h: number, s = 8)  => new THREE.ConeGeometry(r, h, s);
  const tor  = (R: number, r: number, ts = 12, rs = 8) => new THREE.TorusGeometry(R, r, rs, ts);

  // ── Palm tree (curved trunk + fronds) ───────────────────────────────────────
  function addPalm(g: T.Group, x: number, z: number, rand: ReturnType<typeof seededRng>, h = 1.0) {
    const tg = new THREE.Group();
    tg.position.set(x, 0, z);
    const totalH = rand(6, 10) * h;
    const segs = 4;
    const segH = totalH / segs;
    const leanX = rand(-0.35, 0.35);
    const leanZ = rand(-0.35, 0.35);
    let px = 0, pz = 0, py = 0;
    for (let s = 0; s < segs; s++) {
      const frac = s / segs;
      const seg = new THREE.Mesh(cyl(0.18 - s * 0.03, 0.28 - s * 0.02, segH, 7), M.wood);
      seg.position.set(px + leanX * s * segH * 0.25, py + segH / 2, pz + leanZ * s * segH * 0.25);
      seg.rotation.z = leanX * 0.18 * frac;
      seg.rotation.x = leanZ * 0.18 * frac;
      seg.castShadow = true;
      tg.add(seg);
      px += leanX * s * segH * 0.25;
      pz += leanZ * s * segH * 0.25;
      py += segH;
    }
    const topX = px, topZ = pz;
    const frondCount = 7 + Math.round(rand(0, 3));
    for (let f = 0; f < frondCount; f++) {
      const fang = (f / frondCount) * Math.PI * 2 + rand(-0.2, 0.2);
      const flen = rand(3, 5);
      const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.55, flen, 1, 4), M.palm);
      frond.position.set(
        topX + Math.sin(fang) * flen * 0.42,
        py - 0.5 + rand(-0.3, 0.3),
        topZ + Math.cos(fang) * flen * 0.42,
      );
      frond.rotation.y = fang;
      frond.rotation.x = 0.45 + rand(0, 0.3);
      frond.castShadow = true;
      tg.add(frond);
    }
    // Coconuts
    for (let c = 0; c < 3; c++) {
      const cang = (c / 3) * Math.PI * 2;
      const coconut = new THREE.Mesh(sph(0.25, 6, 5), M.woodDk);
      coconut.position.set(topX + Math.sin(cang) * 0.5, py - 0.8, topZ + Math.cos(cang) * 0.5);
      coconut.castShadow = true;
      tg.add(coconut);
    }
    g.add(tg);
  }

  // ── Barrel ─────────────────────────────────────────────────────────────────
  function addBarrel(g: T.Group, x: number, y: number, z: number, rx = 0) {
    const bg = new THREE.Group();
    bg.position.set(x, y, z);
    bg.rotation.z = rx;
    const body = new THREE.Mesh(cyl(0.55, 0.5, 1.2, 10), M.barrel);
    body.castShadow = true; bg.add(body);
    for (const hy of [-0.35, 0, 0.35]) {
      const hoop = new THREE.Mesh(tor(0.56, 0.04, 12, 6), M.metalDk);
      hoop.position.y = hy; hoop.rotation.x = Math.PI / 2; bg.add(hoop);
    }
    const lid = new THREE.Mesh(cyl(0.52, 0.52, 0.08, 10), M.woodDk);
    lid.position.y = 0.64; bg.add(lid);
    g.add(bg);
  }

  // ── Crate ──────────────────────────────────────────────────────────────────
  function addCrate(g: T.Group, x: number, y: number, z: number, ry = 0) {
    const cg = new THREE.Group();
    cg.position.set(x, y, z); cg.rotation.y = ry;
    const body = new THREE.Mesh(box(1.2, 1.2, 1.2), M.wood);
    body.castShadow = true; cg.add(body);
    for (const [a] of [[-0.6, 0], [0.6, 0]] as [number, number][]) {
      const plank = new THREE.Mesh(box(0.08, 1.22, 1.22), M.woodDk);
      plank.position.x = a; cg.add(plank);
    }
    for (const [, b] of [[0, -0.6], [0, 0.6]] as [number, number][]) {
      const plank = new THREE.Mesh(box(1.24, 0.08, 1.22), M.woodDk);
      plank.position.y = b; cg.add(plank);
    }
    g.add(cg);
  }

  // ── Cannon ─────────────────────────────────────────────────────────────────
  function addCannon(g: T.Group, x: number, y: number, z: number, ry = 0) {
    const cg = new THREE.Group();
    cg.position.set(x, y, z); cg.rotation.y = ry;
    const barrel = new THREE.Mesh(cyl(0.22, 0.28, 1.8, 10), M.metal);
    barrel.rotation.z = Math.PI / 2; barrel.position.x = 0.7;
    barrel.castShadow = true; cg.add(barrel);
    const mouth = new THREE.Mesh(cyl(0.24, 0.22, 0.15, 10), M.metalDk);
    mouth.rotation.z = Math.PI / 2; mouth.position.x = 1.6; cg.add(mouth);
    const wheel1 = new THREE.Mesh(tor(0.35, 0.08, 10, 6), M.woodDk);
    wheel1.position.set(0, -0.15, 0.45); wheel1.rotation.x = Math.PI / 2; cg.add(wheel1);
    const wheel2 = wheel1.clone(); wheel2.position.z = -0.45; cg.add(wheel2);
    const axle = new THREE.Mesh(cyl(0.06, 0.06, 1.0, 6), M.woodDk);
    axle.rotation.x = Math.PI / 2; axle.position.y = -0.15; cg.add(axle);
    g.add(cg);
  }

  // ── Dock post ───────────────────────────────────────────────────────────────
  function addPost(g: T.Group, x: number, z: number, h = 2.5) {
    const post = new THREE.Mesh(cyl(0.12, 0.15, h, 6), M.woodDk);
    post.position.set(x, h / 2, z); post.castShadow = true; g.add(post);
    const cap = new THREE.Mesh(sph(0.18, 6, 5), M.woodL);
    cap.position.set(x, h, z); g.add(cap);
  }

  // ── Island base (shared by all) ─────────────────────────────────────────────
  function buildBase(
    g: T.Group, r: number, type: IslandDef["type"],
    rand: ReturnType<typeof seededRng>,
  ) {
    const isRocky = type === "rocks" || type === "volcano";
    const isGreen = type === "jungle" || type === "ruins";

    // Underwater rock skirt
    const skirt = add(g, cyl(r * 1.0, r * 1.22, 5, 20), M.rockDk, false);
    skirt.position.y = -3.2;

    // Outer beach disc
    const beach = add(g, cyl(r * 0.98, r * 1.06, 2.2, 24), M.sand, false);
    beach.position.y = -0.9;
    beach.receiveShadow = true;

    // Sand detail ring (slightly lighter band near shore)
    const shoreRing = add(g, cyl(r * 1.0, r * 0.98, 0.4, 24), M.sandW, false);
    shoreRing.position.y = 0.1;
    shoreRing.receiveShadow = true;

    // Inner terrain mound
    const moundMat = isRocky ? M.rockMd : (isGreen ? M.grassD : M.sandDk);
    const mound = add(g, cyl(r * 0.52, r * 0.88, 4.5, 18), moundMat);
    mound.position.y = 1.4;

    // Peak cap
    if (!isRocky) {
      const peakMat = isGreen ? M.grassD : M.rockMd;
      const peak = add(g, cyl(r * 0.18, r * 0.48, 3.0, 14), peakMat);
      peak.position.y = 4.5;
    }

    // Shoreline boulders (irregular, slightly submerged to fully above)
    const bCount = Math.round(rand(10, 16));
    for (let i = 0; i < bCount; i++) {
      const ang = (i / bCount) * Math.PI * 2 + rand(-0.25, 0.25);
      const dist = r * rand(0.84, 0.99);
      const bh = rand(0.6, 2.2);
      const bw = rand(0.8, 1.8);
      const boulder = new THREE.Mesh(sph(1, 7, 6), i % 3 === 0 ? M.rockDk : M.rock);
      boulder.scale.set(bw, bh * 0.65, bw * rand(0.7, 1.4));
      boulder.position.set(Math.cos(ang) * dist, bh * 0.2 - 0.5, Math.sin(ang) * dist);
      boulder.rotation.y = rand(0, Math.PI);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      g.add(boulder);
    }

    // Mid-beach scattered rocks
    for (let i = 0; i < 22; i++) {
      const ang = rand(0, Math.PI * 2);
      const dist = r * rand(0.52, 0.92);
      const s = rand(0.15, 0.55);
      const peb = new THREE.Mesh(sph(s, 5, 4), i % 4 === 0 ? M.rockMd : M.rockDk);
      peb.scale.set(1, 0.45, rand(0.6, 1.3));
      peb.position.set(Math.cos(ang) * dist, s * 0.15 - 0.4, Math.sin(ang) * dist);
      peb.receiveShadow = true;
      g.add(peb);
    }
  }

  // ── LIGHTHOUSE ───────────────────────────────────────────────────────────────
  function buildLighthouse(g: T.Group, r: number) {
    // Stone keeper's cottage
    const cottage = add(g, box(7, 5, 6), M.stoneL);
    cottage.position.set(-4.5, 5, 0);
    const cRoof = add(g, new THREE.ConeGeometry(5.5, 3.5, 4), M.roof);
    cRoof.position.set(-4.5, 9, 0); cRoof.rotation.y = Math.PI / 4;
    // Cottage chimney
    const chimney = add(g, cyl(0.4, 0.5, 3, 6), M.stoneDk);
    chimney.position.set(-3, 11, 1.5);
    // Cottage door
    const door = add(g, box(1.4, 2.8, 0.15), M.woodDk);
    door.position.set(-4.5, 3.9, 3.08);
    // Cottage window
    const win = add(g, box(1.4, 1.2, 0.12), M.glass, false);
    win.position.set(-6.5, 5.5, 3.08);

    // Stone wall surround
    const wallSegs = 12;
    const wallR = r * 0.55;
    for (let i = 0; i < wallSegs; i++) {
      const a = (i / wallSegs) * Math.PI * 2;
      const wallSeg = add(g, box(2.8, 2.2, 0.6), M.stone);
      wallSeg.position.set(Math.cos(a) * wallR, 3.1, Math.sin(a) * wallR);
      wallSeg.rotation.y = a;
      // Merlons on top
      if (i % 2 === 0) {
        const merlon = add(g, box(1.0, 0.9, 0.7), M.stoneDk);
        merlon.position.set(Math.cos(a) * wallR, 4.55, Math.sin(a) * wallR);
        merlon.rotation.y = a;
      }
    }

    // Steps up to tower
    for (let s = 0; s < 5; s++) {
      const step = add(g, box(1.8, 0.35, 0.6), M.stoneDk);
      step.position.set(s * 0.4, 1.5 + s * 0.35, -6 + s * 0.6);
    }

    // Tower base platform
    const base = add(g, cyl(4.2, 4.8, 2.5, 12), M.stone);
    base.position.y = 3.25;

    // Tower body — 3 white/red bands
    const towerH = 28;
    const bands = 5;
    for (let b = 0; b < bands; b++) {
      const bh = towerH / bands;
      const radius = 3.4 - b * 0.28;
      const bandMat = b % 2 === 0 ? M.white : M.red;
      const band = add(g, cyl(radius - 0.28, radius, bh, 14), bandMat);
      band.position.y = 5 + b * bh + bh / 2;
    }

    // Gallery walkway (at top of tower)
    const gallery = add(g, cyl(4.5, 4.5, 0.25, 16), M.stoneDk);
    gallery.position.y = 5 + towerH + 0.12;
    const railing = add(g, tor(4.3, 0.1, 16, 8), M.metal);
    railing.rotation.x = Math.PI / 2;
    railing.position.y = 5 + towerH + 0.5;
    // Railing posts
    for (let p = 0; p < 12; p++) {
      const pa = (p / 12) * Math.PI * 2;
      const post = add(g, cyl(0.06, 0.06, 0.55, 5), M.metalDk);
      post.position.set(Math.cos(pa) * 4.3, 5 + towerH + 0.25, Math.sin(pa) * 4.3);
    }

    // Lantern room
    const lanternY = 5 + towerH + 1.2;
    const lanternGlass = add(g, cyl(2.8, 2.8, 3.5, 12), M.glass, false);
    lanternGlass.position.y = lanternY;
    // Lantern frame bars
    for (let f = 0; f < 8; f++) {
      const fa = (f / 8) * Math.PI * 2;
      const bar = add(g, box(0.1, 3.6, 0.1), M.metalDk);
      bar.position.set(Math.cos(fa) * 2.8, lanternY, Math.sin(fa) * 2.8);
    }
    // Lantern light source (glowing center)
    const lightCore = add(g, sph(0.9, 8, 6), M.lantern, false);
    lightCore.position.y = lanternY;
    const lhPt = new THREE.PointLight(0xffffaa, 8, 320);
    lhPt.position.set(0, lanternY, 0); g.add(lhPt);

    // Dome
    const dome = add(g, cone(3.2, 3.5, 12), M.redDk);
    dome.position.y = lanternY + 2.2;

    // Flag pole and flag on dome
    const pole = add(g, cyl(0.1, 0.1, 4, 5), M.metalDk);
    pole.position.y = lanternY + 5;
    const flag = new THREE.Mesh(box(2.5, 1.4, 0.04), new THREE.MeshBasicMaterial({ color: 0xdd2211, side: THREE.DoubleSide }));
    flag.position.set(1.25, lanternY + 7, 0); g.add(flag);

    // SpotLight sweeping
    const spot = new THREE.SpotLight(0xffffcc, 12, 400, Math.PI / 10, 0.4);
    spot.position.set(0, lanternY + 1, 0);
    spot.target.position.set(80, 0, 0);
    g.add(spot); g.add(spot.target);
  }

  // ── FORT ────────────────────────────────────────────────────────────────────
  function buildFort(g: T.Group, r: number) {
    const wallH = 10, wallR = r * 0.52, bastionR = r * 0.62;

    // Interior courtyard ground
    const yard = add(g, cyl(wallR * 0.92, wallR * 0.92, 0.4, 18), M.stoneDk, false);
    yard.position.y = 2.4; yard.receiveShadow = true;

    // Wall segments between bastions
    const bCount = 5;
    for (let i = 0; i < bCount; i++) {
      const a0 = (i / bCount) * Math.PI * 2;
      const a1 = ((i + 1) / bCount) * Math.PI * 2;
      const aMid = (a0 + a1) / 2;
      const wLen = 2 * wallR * Math.sin(Math.PI / bCount) * 0.95;

      const wall = add(g, box(wLen, wallH, 2.8), M.stone);
      wall.position.set(Math.cos(aMid) * wallR * 0.92, wallH / 2 + 2, Math.sin(aMid) * wallR * 0.92);
      wall.rotation.y = aMid + Math.PI / 2;

      // Merlons along top
      const merlonCount = Math.floor(wLen / 2.5);
      for (let m = 0; m < merlonCount; m++) {
        const mFrac = (m + 0.5) / merlonCount - 0.5;
        const merlon = add(g, box(1.2, 1.8, 3.0), M.stoneDk);
        merlon.position.set(
          Math.cos(aMid) * wallR * 0.92 + Math.cos(a0 + Math.PI / 2) * mFrac * wLen,
          wallH + 1.0 + 2,
          Math.sin(aMid) * wallR * 0.92 + Math.sin(a0 + Math.PI / 2) * mFrac * wLen,
        );
        merlon.rotation.y = aMid + Math.PI / 2;
      }

      // Arched gateway on one segment
      if (i === 0) {
        const gate = add(g, box(4.5, 6.5, 3.2), M.stoneDk);
        gate.position.set(
          Math.cos(aMid) * wallR * 0.92,
          5.25 + 2,
          Math.sin(aMid) * wallR * 0.92,
        );
        gate.rotation.y = aMid + Math.PI / 2;
        // Keystone
        const arch = add(g, box(4.2, 0.6, 3.4), M.stoneL);
        arch.position.set(Math.cos(aMid) * wallR * 0.92, 9.5 + 2, Math.sin(aMid) * wallR * 0.92);
        arch.rotation.y = aMid + Math.PI / 2;
      }
    }

    // Bastions (pentagonal towers at corners)
    for (let i = 0; i < bCount; i++) {
      const a = (i / bCount) * Math.PI * 2;
      const bx = Math.cos(a) * bastionR;
      const bz = Math.sin(a) * bastionR;
      const bastion = add(g, cyl(5.5, 6.5, wallH + 4, 6), M.stoneDk);
      bastion.position.set(bx, (wallH + 4) / 2 + 2, bz);
      // Bastion cap
      const bCap = add(g, cyl(5.5, 5.5, 0.6, 6), M.rockMd);
      bCap.position.set(bx, wallH + 4 + 2.3, bz);
      // Merlons on bastion top
      for (let m = 0; m < 6; m++) {
        const ma = (m / 6) * Math.PI * 2;
        const merlon = add(g, box(1.4, 1.8, 1.4), M.stone);
        merlon.position.set(bx + Math.cos(ma) * 5.2, wallH + 5.2 + 2, bz + Math.sin(ma) * 5.2);
      }
      // Cannon on each bastion
      addCannon(g, bx + Math.cos(a) * 3, wallH + 4.2 + 2, bz + Math.sin(a) * 3, a);
    }

    // Central keep
    const keepH = wallH + 14;
    const keep = add(g, cyl(6.5, 7.5, keepH, 10), M.stone);
    keep.position.y = keepH / 2 + 2;
    const keepCap = add(g, cyl(6.5, 6.5, 0.8, 10), M.rockMd);
    keepCap.position.y = keepH + 2.4;
    for (let m = 0; m < 10; m++) {
      const ma = (m / 10) * Math.PI * 2;
      const merlon = add(g, box(1.5, 2.2, 1.5), M.stoneDk);
      merlon.position.set(Math.cos(ma) * 6.2, keepH + 3.5 + 2, Math.sin(ma) * 6.2);
    }

    // Flag on keep
    const pole = add(g, cyl(0.18, 0.18, 9, 5), M.metalDk);
    pole.position.y = keepH + 7 + 2;
    const flag = new THREE.Mesh(box(4.5, 2.8, 0.05), new THREE.MeshBasicMaterial({ color: 0x1a3a9a, side: THREE.DoubleSide }));
    flag.position.set(2.25, keepH + 10.4 + 2, 0); g.add(flag);
    // Skull on flag
    const skull = new THREE.Mesh(sph(0.6, 7, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    skull.position.set(1.8, keepH + 10.4 + 2, 0.1); g.add(skull);

    // Interior buildings (barracks)
    for (let b = 0; b < 3; b++) {
      const ba = (b / 3) * Math.PI * 2 + 0.5;
      const bldg = add(g, box(6, 4.5, 4), M.build);
      bldg.position.set(Math.cos(ba) * wallR * 0.48, 4.25, Math.sin(ba) * wallR * 0.48);
      bldg.rotation.y = ba;
      const bRoof = add(g, new THREE.ConeGeometry(4.5, 2.5, 4), M.roofDk);
      bRoof.position.set(Math.cos(ba) * wallR * 0.48, 7.5, Math.sin(ba) * wallR * 0.48);
      bRoof.rotation.y = ba + Math.PI / 4;
    }

    // Stacked barrels near wall
    addBarrel(g, wallR * 0.35, 3, 5); addBarrel(g, wallR * 0.35 + 1.2, 3, 5);
    addBarrel(g, wallR * 0.35 + 0.6, 4.15, 5);
    addCrate(g, -wallR * 0.3, 3.6, 4, 0.4);
  }

  // ── RUINS ────────────────────────────────────────────────────────────────────
  function buildRuins(g: T.Group, r: number, rand: ReturnType<typeof seededRng>) {
    // Mossy grass ground
    const ground = add(g, cyl(r * 0.7, r * 0.7, 0.3, 18), M.grassD, false);
    ground.position.y = 0.85; ground.receiveShadow = true;
    const mossPatches = 5;
    for (let i = 0; i < mossPatches; i++) {
      const a = rand(0, Math.PI * 2), d = rand(1, r * 0.55);
      const patch = add(g, cyl(rand(1.5, 3.5), rand(1.5, 3.5), 0.18, 10), M.mossSt, false);
      patch.position.set(Math.cos(a) * d, 0.95, Math.sin(a) * d);
    }

    // Stone tile floor (partial)
    const tileR = r * 0.45;
    const tileGrid = 5;
    for (let tx = -tileGrid; tx <= tileGrid; tx++) {
      for (let tz = -tileGrid; tz <= tileGrid; tz++) {
        if (tx * tx + tz * tz > tileGrid * tileGrid * 0.7) continue;
        if (rand(0, 1) < 0.3) continue;
        const tile = add(g, box(1.6, 0.18, 1.6), rand(0, 1) < 0.3 ? M.mossSt : M.stone, false);
        tile.position.set(tx * 1.7 + rand(-0.15, 0.15), 0.9 + rand(-0.08, 0.08), tz * 1.7 + rand(-0.15, 0.15));
        tile.rotation.y = rand(-0.1, 0.1);
      }
    }

    // Ring of columns (some standing, some broken, some fallen)
    const colCount = 10;
    const colR = r * 0.38;
    for (let i = 0; i < colCount; i++) {
      const ang = (i / colCount) * Math.PI * 2 + rand(-0.1, 0.1);
      const cx = Math.cos(ang) * colR + rand(-1, 1);
      const cz = Math.sin(ang) * colR + rand(-1, 1);
      const ch = rand(5, 14);
      const state = rand(0, 1);

      if (state < 0.55) {
        // Standing column with capital
        const shaft = add(g, cyl(0.85, 1.0, ch, 10), M.stoneL);
        shaft.position.set(cx, ch / 2 + 1.0, cz);
        // Fluting grooves (dark bands)
        for (let f = 0; f < 3; f++) {
          const flute = add(g, cyl(1.02, 1.02, 0.18, 10), M.stone, false);
          flute.position.set(cx, 3 + f * (ch / 3), cz);
        }
        if (rand(0, 1) > 0.4) {
          const capital = add(g, box(2.8, 0.7, 2.8), M.stone);
          capital.position.set(cx, ch + 1.35, cz);
          capital.rotation.y = rand(0, Math.PI);
          // Lintel between some columns
          if (i < colCount - 1 && rand(0, 1) > 0.6) {
            const nextAng = ((i + 1) / colCount) * Math.PI * 2;
            const nx = Math.cos(nextAng) * colR;
            const nz = Math.sin(nextAng) * colR;
            const dx = nx - cx, dz = nz - cz;
            const lintelLen = Math.sqrt(dx * dx + dz * dz);
            const lintel = add(g, box(lintelLen * 1.1, 0.6, 1.8), M.stoneDk);
            lintel.position.set((cx + nx) / 2, ch + 1.7, (cz + nz) / 2);
            lintel.rotation.y = Math.atan2(dz, dx);
          }
        }
      } else if (state < 0.8) {
        // Broken half column
        const bh = ch * rand(0.3, 0.6);
        const shaft = add(g, cyl(0.85, 1.0, bh, 10), M.stoneL);
        shaft.position.set(cx, bh / 2 + 1.0, cz);
        // Broken top (jagged cylinder cap)
        const shatter = add(g, cone(0.9, rand(0.5, 1.5), 8), M.stone);
        shatter.position.set(cx, bh + 1.5, cz);
      } else {
        // Fallen column (horizontal)
        const shaft = add(g, cyl(0.85, 1.0, ch, 10), M.stoneL);
        const fallAng = rand(0, Math.PI * 2);
        shaft.position.set(cx + Math.cos(fallAng) * ch * 0.3, 1.2, cz + Math.sin(fallAng) * ch * 0.3);
        shaft.rotation.z = Math.PI / 2;
        shaft.rotation.y = fallAng;
        // Break it into 2 pieces
        const piece2 = add(g, cyl(0.85, 1.0, ch * 0.45, 10), M.stoneL);
        piece2.position.set(cx + Math.cos(fallAng) * ch * 0.6 + rand(-0.5, 0.5), 1.0, cz + Math.sin(fallAng) * ch * 0.6 + rand(-0.5, 0.5));
        piece2.rotation.z = Math.PI / 2 + rand(-0.2, 0.2);
        piece2.rotation.y = fallAng + rand(-0.3, 0.3);
      }
    }

    // Scattered rubble
    for (let i = 0; i < 14; i++) {
      const ang = rand(0, Math.PI * 2);
      const dist = rand(1, r * 0.62);
      const slab = add(g, box(rand(1.5, 3.5), rand(0.25, 0.7), rand(0.8, 2.2)), M.stone);
      slab.position.set(Math.cos(ang) * dist, 1.15, Math.sin(ang) * dist);
      slab.rotation.y = rand(0, Math.PI);
      slab.rotation.x = rand(-0.25, 0.25);
    }

    // Overgrown palm trees in the ruins
    const palmCount = Math.round(rand(2, 4));
    for (let p = 0; p < palmCount; p++) {
      const pa = rand(0, Math.PI * 2);
      const pd = rand(r * 0.15, r * 0.5);
      addPalm(g, Math.cos(pa) * pd, Math.sin(pa) * pd, rand, 0.8);
    }
  }

  // ── JUNGLE ──────────────────────────────────────────────────────────────────
  function buildJungle(g: T.Group, r: number, rand: ReturnType<typeof seededRng>) {
    // Rich ground cover
    const ground = add(g, cyl(r * 0.75, r * 0.75, 0.4, 20), M.grassD, false);
    ground.position.y = 0.9; ground.receiveShadow = true;

    // Undergrowth layer (low dense spheres)
    for (let i = 0; i < 30; i++) {
      const a = rand(0, Math.PI * 2), d = rand(1, r * 0.7);
      const s = rand(0.8, 2.2);
      const shrub = add(g, sph(s, 7, 5), rand(0, 1) < 0.5 ? M.leafDk : M.grass, true);
      shrub.scale.y = 0.55;
      shrub.position.set(Math.cos(a) * d, s * 0.4 + 0.8, Math.sin(a) * d);
    }

    // Fern-like low plants (flat cones)
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2), d = rand(0.5, r * 0.65);
      const fern = add(g, cone(rand(0.8, 1.6), rand(0.5, 1.0), 6), M.leafDk);
      fern.position.set(Math.cos(a) * d, 1.1, Math.sin(a) * d);
      fern.rotation.y = rand(0, Math.PI);
    }

    // Dense canopy trees (tall trunks + layered crowns)
    const treeMats = [M.leaf, M.leafL, M.leafDk];
    const treeCount = Math.round(rand(18, 26));
    for (let i = 0; i < treeCount; i++) {
      const a = rand(0, Math.PI * 2), d = rand(1.5, r * 0.72);
      const tg = new THREE.Group();
      tg.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);

      const th = rand(5, 12);
      const trunk = add(tg, cyl(0.2, 0.38, th, 7), M.woodDk);
      trunk.position.y = th / 2 + 0.9;

      // 2-4 crown layers
      const crowns = Math.round(rand(2, 4));
      for (let c = 0; c < crowns; c++) {
        const cR = rand(2.5, 5) - c * 0.8;
        const cH = rand(2.5, 4.5);
        const crown = add(tg, cone(cR, cH, 9), treeMats[Math.floor(rand(0, 3))]);
        crown.position.y = th + 0.9 + c * (cH * 0.6);
      }
      g.add(tg);
    }

    // Palm trees leaning toward edges
    const palmCount = Math.round(rand(6, 10));
    for (let p = 0; p < palmCount; p++) {
      const pa = rand(0, Math.PI * 2);
      const pd = rand(r * 0.35, r * 0.72);
      addPalm(g, Math.cos(pa) * pd, Math.sin(pa) * pd, rand, 1.1);
    }

    // Hidden ancient ruins in jungle
    const ruinAng = rand(0, Math.PI * 2);
    const ruinDist = rand(r * 0.1, r * 0.25);
    const rx = Math.cos(ruinAng) * ruinDist, rz = Math.sin(ruinAng) * ruinDist;
    for (let i = 0; i < 4; i++) {
      const stone = add(g, box(rand(2, 4), rand(0.5, 1.5), rand(1.5, 3.5)), M.mossSt);
      stone.position.set(rx + rand(-4, 4), 1.2, rz + rand(-4, 4));
      stone.rotation.y = rand(0, Math.PI);
      stone.rotation.x = rand(-0.2, 0.2);
    }
    const pillar = add(g, cyl(0.6, 0.8, rand(3, 6), 8), M.mossSt);
    pillar.position.set(rx, rand(3, 6) / 2 + 1, rz);

    // Tropical flowers (small colored spheres near ground)
    const flowerCols = [0xff4444, 0xff8822, 0xffdd22, 0x44ffaa, 0xff44cc];
    for (let f = 0; f < 15; f++) {
      const fa = rand(0, Math.PI * 2), fd = rand(0.5, r * 0.6);
      const flower = add(g, sph(0.22, 5, 4),
        new THREE.MeshStandardMaterial({ color: flowerCols[Math.floor(rand(0, 5))], roughness: 0.7, emissive: new THREE.Color(flowerCols[Math.floor(rand(0, 5))]), emissiveIntensity: 0.1 }), false);
      flower.position.set(Math.cos(fa) * fd, 1.1, Math.sin(fa) * fd);
    }
  }

  // ── PORT ────────────────────────────────────────────────────────────────────
  function buildPort(g: T.Group, r: number, rand: ReturnType<typeof seededRng>) {
    // Packed dirt/cobble ground
    const ground = add(g, cyl(r * 0.72, r * 0.72, 0.35, 18), M.sandDk, false);
    ground.position.y = 0.88; ground.receiveShadow = true;

    // Main dock (L-shape planks)
    const dockMain = add(g, box(20, 0.55, 5), M.wood);
    dockMain.position.set(0, 0.98, -r * 0.75);
    const dockArm = add(g, box(5, 0.55, 8), M.wood);
    dockArm.position.set(7, 0.98, -r * 0.75 - 6.5);
    // Dock planks texture via darker strips
    for (let p = -9; p <= 9; p += 2) {
      const plank = add(g, box(0.25, 0.6, 5.2), M.woodDk, false);
      plank.position.set(p, 0.99, -r * 0.75);
    }
    // Dock posts and cross-beams
    for (const [px, pz] of [[-9, -r * 0.75 - 2], [0, -r * 0.75 - 2], [9, -r * 0.75 - 2], [7, -r * 0.75 - 10], [7, -r * 0.75 - 4]] as [number, number][]) {
      addPost(g, px, pz, 3.2);
    }
    // Cross-beams under dock
    for (let p = -9; p <= 9; p += 6) {
      const beam = add(g, box(0.18, 0.18, 5.5), M.woodDk);
      beam.position.set(p, -0.5, -r * 0.75);
    }

    // Dock lamp posts
    for (const [lx, lz] of [[-9, -r * 0.75], [9, -r * 0.75]] as [number, number][]) {
      const lp = add(g, cyl(0.1, 0.1, 4.5, 6), M.metalDk);
      lp.position.set(lx, 2.9, lz);
      const arm = add(g, box(1.2, 0.1, 0.1), M.metalDk, false);
      arm.position.set(lx + 0.6, 4.8, lz);
      const lantern = add(g, sph(0.35, 7, 6), M.lantern, false);
      lantern.position.set(lx + 1.1, 4.7, lz);
      const pt = new THREE.PointLight(0xffaa44, 3.5, 55);
      pt.position.set(lx + 1.1, 4.7, lz); g.add(pt);
    }

    // Buildings (3 distinct)
    // Tavern
    const tavern = add(g, box(9, 7, 7), M.build);
    tavern.position.set(-8, 5.5, 0);
    const tRoof = add(g, new THREE.ConeGeometry(7, 4.5, 4), M.roof);
    tRoof.position.set(-8, 10.5, 0); tRoof.rotation.y = Math.PI / 4;
    const tSign = add(g, box(3.5, 1.0, 0.1), M.woodDk, false);
    tSign.position.set(-8, 9.2, 3.55);
    const tDoor = add(g, box(1.8, 3.5, 0.12), M.woodDk);
    tDoor.position.set(-8, 3.75, 3.56);
    for (const wx of [-10.5, -5.5]) {
      const win = add(g, box(1.6, 1.5, 0.12), M.glass, false);
      win.position.set(wx, 5.5, 3.56);
    }

    // Warehouse
    const wh = add(g, box(11, 8, 7), M.buildDk);
    wh.position.set(6, 6, 5);
    const whRoof = add(g, new THREE.CylinderGeometry(0.1, 7, 5, 4), M.roofDk);
    whRoof.position.set(6, 11.5, 5); whRoof.rotation.y = Math.PI / 4;
    const whDoor = add(g, box(3.5, 5, 0.12), M.woodDk);
    whDoor.position.set(6, 4.5, 1.56);

    // Small hut
    const hut = add(g, box(5, 4.5, 4.5), M.stoneL);
    hut.position.set(-11, 4.25, -10);
    const hutRoof = add(g, new THREE.ConeGeometry(4, 3, 4), M.roof);
    hutRoof.position.set(-11, 7.8, -10); hutRoof.rotation.y = Math.PI / 4;

    // Well
    const wellRing = add(g, cyl(1.2, 1.2, 1.4, 12), M.stone);
    wellRing.position.set(0, 2.1, 4);
    const wellWater = add(g, cyl(0.9, 0.9, 0.3, 10), M.water, false);
    wellWater.position.set(0, 1.35, 4);
    const wellFrame = add(g, box(0.12, 2.2, 2.6), M.woodDk);
    wellFrame.position.set(0, 3.3, 4);
    const wellRoll = add(g, cyl(0.22, 0.22, 2.4, 7), M.woodL);
    wellRoll.rotation.x = Math.PI / 2; wellRoll.position.set(0, 3.6, 4);

    // Stacked cargo on dock
    addBarrel(g, 5, 1.5, -r * 0.75 + 2);
    addBarrel(g, 3.5, 1.5, -r * 0.75 + 2);
    addBarrel(g, 4.25, 2.65, -r * 0.75 + 2);
    addCrate(g, 1, 1.6, -r * 0.75 + 1, 0.3);
    addCrate(g, -1, 1.6, -r * 0.75 + 1.5, -0.2);

    // Anchor on dock
    const anchor = add(g, tor(0.6, 0.1, 12, 8), M.metalDk);
    anchor.rotation.x = Math.PI / 2; anchor.position.set(-6, 1.55, -r * 0.75 + 1.5);
    const anchorShank = add(g, cyl(0.08, 0.08, 1.8, 6), M.metalDk);
    anchorShank.position.set(-6, 2.2, -r * 0.75 + 1.5);

    // Palm trees around port
    addPalm(g, r * 0.35, r * 0.3, rand, 0.9);
    addPalm(g, -r * 0.45, r * 0.1, rand, 0.85);
  }

  // ── ROCKS (sea stacks) ───────────────────────────────────────────────────────
  function buildRocksIsland(g: T.Group, r: number, rand: ReturnType<typeof seededRng>) {
    // Dramatic sea stacks
    const stackCount = Math.round(rand(5, 9));
    for (let i = 0; i < stackCount; i++) {
      const ang = (i / stackCount) * Math.PI * 2 + rand(-0.3, 0.3);
      const dist = rand(r * 0.12, r * 0.72);
      const sh = rand(12, 40);
      const sw = rand(2, 6);
      const tilt = rand(-0.12, 0.12);

      const stack = add(g, cyl(sw * 0.35, sw * rand(0.7, 1.3), sh, 7), i % 3 === 0 ? M.rockDk : M.rockMd);
      stack.position.set(Math.cos(ang) * dist, sh / 2 + 2, Math.sin(ang) * dist);
      stack.rotation.z = tilt; stack.rotation.x = rand(-0.06, 0.06);

      // Layered sedimentary bands
      const bands = Math.round(rand(2, 5));
      for (let b = 0; b < bands; b++) {
        const band = add(g, cyl(sw * 0.38, sw * 0.42, 0.4, 7), b % 2 === 0 ? M.rockLt : M.rockMd, false);
        band.position.set(Math.cos(ang) * dist, 3 + b * (sh / bands), Math.sin(ang) * dist);
        band.rotation.z = tilt;
      }

      // Flat cap on some stacks
      if (rand(0, 1) > 0.5) {
        const cap = add(g, cyl(sw * 0.55, sw * 0.38, 0.8, 7), M.rock);
        cap.position.set(Math.cos(ang) * dist, sh + 2.4, Math.sin(ang) * dist);
        // Seabird nest
        if (rand(0, 1) > 0.6) {
          const nest = add(g, tor(sw * 0.2, 0.18, 8, 5), M.woodDk, false);
          nest.rotation.x = Math.PI / 2;
          nest.position.set(Math.cos(ang) * dist, sh + 2.9, Math.sin(ang) * dist);
        }
      }
    }

    // Natural arch
    const archX = rand(-r * 0.3, r * 0.3), archZ = rand(-r * 0.3, r * 0.3);
    const archH = rand(10, 16), archW = rand(6, 10);
    const leftPillar = add(g, cyl(rand(2.0, 3.0), rand(2.5, 3.5), archH, 7), M.rockDk);
    leftPillar.position.set(archX - archW / 2, archH / 2 + 2, archZ);
    const rightPillar = add(g, cyl(rand(2.0, 3.0), rand(2.5, 3.5), archH, 7), M.rockDk);
    rightPillar.position.set(archX + archW / 2, archH / 2 + 2, archZ);
    const archBridge = add(g, box(archW + 3, rand(2.5, 4.5), rand(2.5, 4)), M.rock);
    archBridge.position.set(archX, archH + 2 + 1.5, archZ);
    archBridge.rotation.y = rand(-0.2, 0.2);

    // Sea foam ring at waterline
    const foamRing = add(g, tor(r * 0.55, 0.4, 24, 4), new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.98, transparent: true, opacity: 0.55 }), false);
    foamRing.rotation.x = Math.PI / 2; foamRing.position.y = 0.4;

    // Seaweed tufts at base
    for (let i = 0; i < 12; i++) {
      const a = rand(0, Math.PI * 2), d = rand(r * 0.2, r * 0.7);
      const sw = add(g, cone(rand(0.4, 0.9), rand(1.5, 3.5), 5), new THREE.MeshStandardMaterial({ color: 0x1a5a2a, roughness: 0.95, side: THREE.DoubleSide }));
      sw.position.set(Math.cos(a) * d, 1.0, Math.sin(a) * d);
      sw.rotation.y = rand(0, Math.PI);
    }
  }

  // ── Main loop ────────────────────────────────────────────────────────────────
  for (const isl of islands) {
    const g = new THREE.Group();
    g.position.set(isl.x, 0, isl.z);

    if (isl.glbOnly) { scene.add(g); continue; }

    const rand = seededRng(Math.round(isl.x * 100 + isl.z * 13 + isl.radius * 7));
    const r = isl.radius;

    buildBase(g, r, isl.type, rand);

    switch (isl.type) {
      case "lighthouse": buildLighthouse(g, r); break;
      case "fort":       buildFort(g, r); break;
      case "ruins":      buildRuins(g, r, rand); break;
      case "jungle":     buildJungle(g, r, rand); break;
      case "port":       buildPort(g, r, rand); break;
      case "rocks":
      case "volcano":    buildRocksIsland(g, r, rand); break;
    }

    scene.add(g);
  }
}
