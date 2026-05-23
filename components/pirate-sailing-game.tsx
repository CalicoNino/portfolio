import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type * as T from "three";

type TimeOfDay = "day" | "sunset" | "night";
type Weather   = "calm" | "windy" | "rainy";

interface PirateSailingGameProps {
  /** true (default) = full interactive game with all UI.
   *  false = silent background mode — ship auto-pilots, no controls shown. */
  playMode?: boolean;
  /** Called when the user taps "Back" — used by home page to exit play mode. */
  onExitPlay?: () => void;
}

interface IslandDef {
  name: string; x: number; z: number; radius: number;
  type: "volcano"|"lighthouse"|"fort"|"ruins"|"jungle"|"port"|"rocks";
  dockAngle: number; // radians; 0 = +z face, clockwise
}

const PIER_LEN = 18;

const ISLANDS: IslandDef[] = [
  // ── inner ring ────────────────────────────────────────────────────────────
  { name: "Isla del Diablo",  x: -220, z: -160, radius: 46, type: "volcano",    dockAngle:  0.9 },
  { name: "Puerto Refugio",   x:  200, z: -300, radius: 54, type: "port",        dockAngle: -0.5 },
  { name: "Isla Encantada",   x:  340, z:  110, radius: 40, type: "ruins",       dockAngle:  2.8 },
  { name: "Los Peñascos",     x: -370, z:  210, radius: 34, type: "rocks",       dockAngle:  1.2 },
  { name: "Fort Santiago",    x:  260, z:  -60, radius: 48, type: "fort",        dockAngle: -1.0 },
  { name: "Isla del Faro",    x: -130, z:  370, radius: 38, type: "lighthouse",  dockAngle: -0.3 },
  { name: "La Selva",         x:   60, z:  290, radius: 56, type: "jungle",      dockAngle:  3.5 },
  // ── outer ring ────────────────────────────────────────────────────────────
  { name: "Isla Negra",       x: -540, z: -100, radius: 52, type: "volcano",     dockAngle:  0.6 },
  { name: "Puerto del Sol",   x:  460, z:  360, radius: 60, type: "port",        dockAngle: -1.2 },
  { name: "Las Ruinas",       x: -260, z:  520, radius: 46, type: "ruins",       dockAngle:  1.6 },
  { name: "Isla Serpiente",   x:  540, z: -420, radius: 42, type: "rocks",       dockAngle:  2.2 },
  { name: "El Castillo",      x: -460, z: -400, radius: 54, type: "fort",        dockAngle: -0.8 },
  { name: "Faro del Norte",   x:  100, z: -580, radius: 42, type: "lighthouse",  dockAngle:  0.4 },
  { name: "La Jungla Verde",  x: -160, z:  630, radius: 62, type: "jungle",      dockAngle: -1.5 },
];

const SHIPS = [
  { name: "Nave",     path: "/3d/nave_new.glb",            maxSpeed: 22, accel: 0.28, turnSpeed: 0.021, desc: "Balanced"  },
  { name: "Marauder", path: "/3d/brown_marauder.glb",      maxSpeed: 16, accel: 0.18, turnSpeed: 0.013, desc: "Slow & sturdy" },
  { name: "Fantasy",  path: "/3d/fantasy_sailing_ship.glb", maxSpeed: 30, accel: 0.40, turnSpeed: 0.026, desc: "Swift"     },
  { name: "Pirate",   path: "/3d/pirate_ship.glb",         maxSpeed: 20, accel: 0.24, turnSpeed: 0.034, desc: "Agile"     },
];
const WORLD_R    = 720;
const RAIN_COUNT = 1800;

export function PirateSailingGame({ playMode = true, onExitPlay }: PirateSailingGameProps) {
  const mountRef     = useRef<HTMLDivElement>(null);
  const helmImgRef   = useRef<HTMLImageElement>(null);
  // Refs accessible both from the animation loop and from JSX pointer handlers
  const touchKeysRef  = useRef(new Set<string>());
  const playModeRef   = useRef(playMode);
  const helmDragRef   = useRef({ active: false, prevX: 0, delta: 0, startX: 0, startY: 0, curX: 0, curY: 0, isTouch: false });
  const canvasDragRef = useRef({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });

  const [todUI,      setTodUI]      = useState<TimeOfDay>("day");
  const [wxUI,       setWxUI]       = useState<Weather>("calm");
  const [nearIsland, setNearIsland] = useState<string | null>(null);
  const [heading,    setHeading]    = useState(0);
  const [speedPct,   setSpeedPct]   = useState(0);
  const [loaded,     setLoaded]     = useState(false);
  const [errMsg,     setErrMsg]     = useState<string | null>(null);
  const [canvasJoystick, setCanvasJoystick] = useState<{ cx: number; cy: number; x: number; y: number } | null>(null);
  const [shipIdx,    setShipIdx]    = useState(0);
  const [swapping,   setSwapping]   = useState(false);
  const [docked,     setDocked]     = useState(false);
  const swapShipRef  = useRef<((idx: number) => Promise<void>) | null>(null);
  const shipStatsRef = useRef({ maxSpeed: SHIPS[0].maxSpeed, accel: SHIPS[0].accel, turnSpeed: SHIPS[0].turnSpeed });
  const shipPosRef   = useRef({ x: 0, z: 0, angle: 0 });
  const dockedRef    = useRef(false);
  const dockedPosRef = useRef({ x: 0, z: 0, angle: 0 });
  const minimapRef   = useRef<HTMLCanvasElement>(null);

  const todRef = useRef<TimeOfDay>("day");
  const wxRef  = useRef<Weather>("calm");

  const setTimeOfDay = (v: TimeOfDay) => { todRef.current = v; setTodUI(v); };
  const setWeather   = (v: Weather)   => { wxRef.current  = v; setWxUI(v); };

  // Keep playModeRef current; clear touch inputs when exiting play mode
  useEffect(() => {
    playModeRef.current = playMode;
    if (!playMode) touchKeysRef.current.clear();
  }, [playMode]);

  // ── Touch button helpers (accessible from JSX without closure issues) ──────
  const pressKey   = (k: string) => touchKeysRef.current.add(k);
  const releaseKey = (k: string) => touchKeysRef.current.delete(k);

  // ── Helm drag helpers ────────────────────────────────────────────────────
  const onHelmPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!playModeRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const isTouch = e.pointerType === 'touch';
    helmDragRef.current = { active: true, prevX: e.clientX, delta: 0, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY, isTouch };
  };
  const onHelmPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const drag = helmDragRef.current;
    if (!drag.active) return;
    if (drag.isTouch) {
      drag.curX = e.clientX;
      drag.curY = e.clientY;
    } else {
      drag.delta += (e.clientX - drag.prevX) * 2; // 2 deg per pixel
      drag.prevX = e.clientX;
    }
  };
  const onHelmPointerUp = () => {
    helmDragRef.current.active = false;
    helmDragRef.current.delta = 0;
    touchKeysRef.current.delete('ArrowUp');
    touchKeysRef.current.delete('ArrowDown');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    let alive = true;
    let disposeAll: (() => void) | null = null;

    (async () => {
      try {
        const [THREE, { Water }, { GLTFLoader }, { DRACOLoader }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/objects/Water.js"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/loaders/DRACOLoader.js"),
        ]);
        if (!alive) return;

        // ── Renderer ───────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        mount.appendChild(renderer.domElement);

        // ── Scene ──────────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xa8c8e8, 0.0018);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1400);
        camera.position.set(0, 30, -50);

        // ── Sky sphere ─────────────────────────────────────────────────────
        const skyMat = new THREE.ShaderMaterial({
          side: THREE.BackSide,
          uniforms: {
            uTop:   { value: new THREE.Color(0x0a3d8f) },
            uMid:   { value: new THREE.Color(0x5ba3d9) },
            uHoriz: { value: new THREE.Color(0xe8c87a) },
          },
          vertexShader: `
            varying float vT;
            void main() {
              vT = clamp((position.y + 900.0) / 1800.0, 0.0, 1.0);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHoriz;
            varying float vT;
            void main() {
              vec3 c = vT > 0.5 ? mix(uMid, uTop, (vT-0.5)*2.0) : mix(uHoriz, uMid, vT*2.0);
              gl_FragColor = vec4(c, 1.0);
            }
          `,
        });
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat));

        const SUN_DAY_POS = new THREE.Vector3(400, 300, -200);
        const SUN_SET_POS = new THREE.Vector3(350, 40,  -400);
        const MOON_POS    = new THREE.Vector3(-320, 260, -420);

        // ── Sun ────────────────────────────────────────────────────────────
        const sunMat     = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 1.0 });
        const sunMesh    = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 32), sunMat);
        sunMesh.position.copy(SUN_DAY_POS); scene.add(sunMesh);
        const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.06, depthWrite: false });
        const sunGlow    = new THREE.Mesh(new THREE.SphereGeometry(52, 16, 16), sunGlowMat);
        sunGlow.position.copy(SUN_DAY_POS); scene.add(sunGlow);

        // ── Moon + halos ───────────────────────────────────────────────────
        const moonMat  = new THREE.MeshBasicMaterial({ color: 0xd8e8ff, transparent: true, opacity: 0.0 });
        const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(22, 32, 32), moonMat);
        moonMesh.position.copy(MOON_POS); scene.add(moonMesh);
        const HALO_BASE = [0.07, 0.03, 0.012];
        const moonHalos: T.Mesh[] = [];
        for (const [r, o] of [[38, HALO_BASE[0]], [60, HALO_BASE[1]], [95, HALO_BASE[2]]] as [number,number][]) {
          const h = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), new THREE.MeshBasicMaterial({ color: 0x8899cc, transparent: true, opacity: o * 0, depthWrite: false }));
          h.position.copy(MOON_POS); scene.add(h); moonHalos.push(h);
        }

        // ── Stars ─────────────────────────────────────────────────────────
        const starBuf = new Float32Array(2200 * 3);
        for (let i = 0; i < 2200; i++) {
          const phi = Math.acos(1 - 2 * Math.random()), theta = Math.random() * Math.PI * 2, r = 800;
          starBuf[i*3]   = r * Math.sin(phi) * Math.cos(theta);
          starBuf[i*3+1] = Math.abs(r * Math.cos(phi)) + 40;
          starBuf[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute("position", new THREE.BufferAttribute(starBuf, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true, transparent: true, opacity: 0.0 });
        scene.add(new THREE.Points(starGeo, starMat));

        // ── Lights ────────────────────────────────────────────────────────
        const ambLight = new THREE.AmbientLight(0xffd090, 1.2);
        scene.add(ambLight);
        const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
        dirLight.position.copy(SUN_DAY_POS);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        dirLight.shadow.camera.near = 1; dirLight.shadow.camera.far = 700;
        dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -180;
        dirLight.shadow.camera.right = dirLight.shadow.camera.top   =  180;
        scene.add(dirLight);

        // ── Water ─────────────────────────────────────────────────────────
        const waterNormals = new THREE.TextureLoader().load("/textures/waternormals.jpg", (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });
        const water = new Water(new THREE.PlaneGeometry(2400, 2400), {
          textureWidth: 512, textureHeight: 512, waterNormals,
          sunDirection: SUN_DAY_POS.clone().normalize(),
          sunColor: 0xffffff, waterColor: 0x006994, distortionScale: 2.5, fog: true,
        });
        water.rotation.x = -Math.PI / 2;
        scene.add(water);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wU = (water as any).material.uniforms;

        // ── GLB Ship ──────────────────────────────────────────────────────
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/gltf/");
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);
        const gltf = await gltfLoader.loadAsync(SHIPS[0].path);
        if (!alive) return;

        const fitShipModel = (model: T.Object3D) => {
          const box         = new THREE.Box3().setFromObject(model);
          const size        = box.getSize(new THREE.Vector3());
          const center      = box.getCenter(new THREE.Vector3());
          const scaleFactor = 24 / Math.max(size.x, size.y, size.z);
          model.scale.setScalar(scaleFactor);
          model.position.set(
            -scaleFactor * center.x,
            -2 - scaleFactor * box.min.y,
            -scaleFactor * center.z
          );
          let flag: T.Mesh | null = null;
          model.traverse((child) => {
            if (!(child as T.Mesh).isMesh) return;
            const m = child as T.Mesh;
            m.castShadow = true; m.receiveShadow = true;
            if (!flag && m.position.y > size.y * scaleFactor * 0.7) flag = m;
          });
          return flag;
        };

        let shipModel = gltf.scene;
        let flagMesh: T.Mesh | null = fitShipModel(shipModel);

        const ship = new THREE.Group();
        ship.add(shipModel); ship.position.set(0, 0.2, 0); scene.add(ship);

        swapShipRef.current = async (idx: number) => {
          setSwapping(true);
          try {
            const s = SHIPS[idx];
            const newGltf = await gltfLoader.loadAsync(s.path);
            if (!alive) return;
            ship.remove(shipModel);
            shipModel = newGltf.scene;
            flagMesh  = fitShipModel(shipModel);
            ship.add(shipModel);
            shipStatsRef.current = { maxSpeed: s.maxSpeed, accel: s.accel, turnSpeed: s.turnSpeed };
          } finally {
            setSwapping(false);
          }
        };

        // ── Islands ───────────────────────────────────────────────────────
        const rng      = (lo: number, hi: number) => lo + Math.random()*(hi-lo);
        const sandMat  = new THREE.MeshStandardMaterial({ color: 0xc8a87a, roughness: 0.9 });
        const rockMat  = new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 0.95 });
        const dRockMat = new THREE.MeshStandardMaterial({ color: 0x2a2820, roughness: 0.95 });
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.9 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 0.9 });
        const woodI    = new THREE.MeshStandardMaterial({ color: 0x6b4020, roughness: 0.85 });
        const buildMat = new THREE.MeshStandardMaterial({ color: 0xd4c090, roughness: 0.9 });
        const fortMat  = new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: 0.95 });

        for (const isl of ISLANDS) {
          const g = new THREE.Group();
          g.position.set(isl.x, 0, isl.z);
          const base = new THREE.Mesh(new THREE.CylinderGeometry(isl.radius*0.88, isl.radius*1.12, 3, 16), sandMat);
          base.position.y = -1.2; base.castShadow = true; base.receiveShadow = true; g.add(base);
          for (let i = 0; i < 9; i++) {
            const ang = (i/9)*Math.PI*2+rng(-0.3,0.3), dist = isl.radius*rng(0.65,0.90), rh = rng(1.5,5);
            const rock = new THREE.Mesh(new THREE.CylinderGeometry(rng(0.8,1.8),rng(1.5,3),rh,6), rockMat);
            rock.position.set(Math.cos(ang)*dist, rh/2, Math.sin(ang)*dist);
            rock.rotation.y = rng(0,Math.PI); rock.castShadow = true; g.add(rock);
          }
          if (isl.type === "volcano") {
            const cone = new THREE.Mesh(new THREE.CylinderGeometry(4, isl.radius*0.55, isl.radius*0.9, 14), dRockMat);
            cone.position.y = isl.radius*0.45; cone.castShadow = true; g.add(cone);
            const lava = new THREE.Mesh(new THREE.CircleGeometry(4,14), new THREE.MeshBasicMaterial({ color: 0xff4400 }));
            lava.rotation.x = -Math.PI/2; lava.position.y = isl.radius*0.9+0.3; g.add(lava);
            const lavaPt = new THREE.PointLight(0xff5500,4,100); lavaPt.position.y = isl.radius*0.9+4; g.add(lavaPt);
            for (let i=0;i<4;i++) {
              const s = new THREE.Mesh(new THREE.TorusGeometry(2+i,0.4,6,12), new THREE.MeshBasicMaterial({color:0x333333,transparent:true,opacity:0.3-i*0.06}));
              s.position.y = isl.radius*0.9+5+i*6; s.rotation.x = Math.PI/2; g.add(s);
            }
          } else if (isl.type === "lighthouse") {
            const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(3.5,4.5,3.5,12), stoneMat);
            lhBase.position.y = 2.8; lhBase.castShadow = true; g.add(lhBase);
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5,3.5,24,12), new THREE.MeshStandardMaterial({color:0xf5f0e8}));
            tower.position.y = 16; tower.castShadow = true; g.add(tower);
            const dome = new THREE.Mesh(new THREE.ConeGeometry(3.2,4,12), new THREE.MeshStandardMaterial({color:0xaa3322}));
            dome.position.y = 30; dome.castShadow = true; g.add(dome);
            const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2,2,3,12), new THREE.MeshBasicMaterial({color:0xffffaa,transparent:true,opacity:0.7}));
            lantern.position.y = 28; g.add(lantern);
            const lhPt = new THREE.PointLight(0xffffaa,6,280); lhPt.position.set(0,29,0); g.add(lhPt);
            for (let i=0;i<4;i++) {
              const s = new THREE.Mesh(new THREE.TorusGeometry(3,0.35,4,12), new THREE.MeshStandardMaterial({color:0xcc2211}));
              s.position.y = 7+i*5; s.rotation.x = Math.PI/2; g.add(s);
            }
          } else if (isl.type === "fort") {
            const wallH=10, wallR=17;
            for (let i=0;i<4;i++) {
              const ang=(i/4)*Math.PI*2;
              const wall = new THREE.Mesh(new THREE.BoxGeometry(wallR*0.82,wallH,1.8), fortMat);
              wall.position.set(Math.cos(ang)*wallR*0.5,wallH/2,Math.sin(ang)*wallR*0.5);
              wall.rotation.y = ang+Math.PI/2; wall.castShadow = true; g.add(wall);
            }
            for (let i=0;i<4;i++) {
              const ang=(i/4)*Math.PI*2+Math.PI/4;
              const t = new THREE.Mesh(new THREE.CylinderGeometry(3,3.5,wallH+4,8), fortMat);
              t.position.set(Math.cos(ang)*wallR*0.7,(wallH+4)/2,Math.sin(ang)*wallR*0.7);
              t.castShadow = true; g.add(t);
            }
            const keep = new THREE.Mesh(new THREE.CylinderGeometry(4,5,wallH+8,10), fortMat);
            keep.position.y = (wallH+8)/2; keep.castShadow = true; g.add(keep);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,6,6), woodI);
            pole.position.y = wallH+8+3; g.add(pole);
            const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.2), new THREE.MeshBasicMaterial({color:0x1a3a8a,side:THREE.DoubleSide}));
            flag.position.set(1.8,wallH+8+5.5,0); g.add(flag);
          } else if (isl.type === "ruins") {
            const ground = new THREE.Mesh(new THREE.CircleGeometry(isl.radius*0.65,14), grassMat);
            ground.rotation.x = -Math.PI/2; ground.position.y = 0.5; g.add(ground);
            for (let i=0;i<8;i++) {
              const ang=(i/8)*Math.PI*2, ch=rng(4,14);
              const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9,1.1,ch,8), stoneMat);
              col.position.set(Math.cos(ang)*isl.radius*rng(0.25,0.45),ch/2,Math.sin(ang)*isl.radius*rng(0.25,0.45));
              col.castShadow = true; g.add(col);
              if (Math.random()>0.45) {
                const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4,0.7,2.4), stoneMat);
                cap.position.set(col.position.x,ch+0.35,col.position.z); cap.rotation.y=rng(0,Math.PI); g.add(cap);
              }
            }
            for (let i=0;i<5;i++) {
              const slab = new THREE.Mesh(new THREE.BoxGeometry(rng(3,6),1,rng(1.5,3)), stoneMat);
              slab.position.set(rng(-12,12),0.5,rng(-12,12)); slab.rotation.y=rng(0,Math.PI); slab.rotation.x=rng(-0.3,0.3); slab.castShadow=true; g.add(slab);
            }
          } else if (isl.type === "jungle") {
            const ground = new THREE.Mesh(new THREE.CircleGeometry(isl.radius*0.72,16), grassMat);
            ground.rotation.x = -Math.PI/2; ground.position.y = 0.5; g.add(ground);
            const treeMat = new THREE.MeshStandardMaterial({color:0x1a4a0e,roughness:0.9});
            for (let i=0;i<28;i++) {
              const ang=rng(0,Math.PI*2), r=rng(2,isl.radius*0.72);
              const tg = new THREE.Group(); tg.position.set(Math.cos(ang)*r,0,Math.sin(ang)*r);
              const th=rng(3,8);
              const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.38,th,6), woodI);
              trunk.position.y=th/2; trunk.castShadow=true; tg.add(trunk);
              for (let j=0;j<3;j++) {
                const crown = new THREE.Mesh(new THREE.ConeGeometry(2.8-j*0.5,3.2,8), treeMat);
                crown.position.y=th+j*2.2; crown.castShadow=true; tg.add(crown);
              }
              g.add(tg);
            }
          } else if (isl.type === "port") {
            const ground = new THREE.Mesh(new THREE.CircleGeometry(isl.radius*0.68,14), new THREE.MeshStandardMaterial({color:0xc8b47a,roughness:0.9}));
            ground.rotation.x=-Math.PI/2; ground.position.y=0.5; g.add(ground);
            const roofMat = new THREE.MeshStandardMaterial({color:0xaa4422});
            for (let i=0;i<5;i++) {
              const bw=rng(5,9),bh=rng(5,10),bd=rng(4,7);
              const bld = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd), buildMat);
              bld.position.set(-14+i*7+rng(-1,1),bh/2,rng(-5,5)); bld.castShadow=true; g.add(bld);
              const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(bw,bd)*0.78,4,4), roofMat);
              roof.position.set(bld.position.x,bh+1.8,bld.position.z); roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
            }
            const dock = new THREE.Mesh(new THREE.BoxGeometry(22,0.6,6), woodI);
            dock.position.set(4,0.3,-22); dock.rotation.y=0.15; g.add(dock);
            for (const lx of [-9,9]) {
              const l = new THREE.Mesh(new THREE.SphereGeometry(0.5,8,8), new THREE.MeshBasicMaterial({color:0xffaa44}));
              l.position.set(lx,9,-20); g.add(l);
              const pt = new THREE.PointLight(0xffaa44,3,70); pt.position.set(lx,9,-20); g.add(pt);
            }
          } else {
            for (let i=0;i<8;i++) {
              const ang=(i/8)*Math.PI*2+rng(-0.3,0.3), r=rng(4,isl.radius*0.65), h=rng(10,30);
              const spire = new THREE.Mesh(new THREE.CylinderGeometry(rng(0.3,1.2),rng(2,4),h,6), dRockMat);
              spire.position.set(Math.cos(ang)*r,h/2,Math.sin(ang)*r); spire.rotation.y=rng(0,Math.PI); spire.castShadow=true; g.add(spire);
            }
          }

          // ── Dock pier (every island) ──────────────────────────────────────
          const da  = isl.dockAngle;
          const pCX = Math.sin(da) * (isl.radius * 1.05 + PIER_LEN / 2);
          const pCZ = Math.cos(da) * (isl.radius * 1.05 + PIER_LEN / 2);
          const pier = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, PIER_LEN), woodI);
          pier.position.set(pCX, 0.25, pCZ); pier.rotation.y = da; pier.castShadow = true; g.add(pier);
          for (let p = 0; p < 5; p++) {
            const t   = (p / 4) * PIER_LEN - PIER_LEN / 2;
            const plg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4.5, 6), woodI);
            plg.position.set(pCX + Math.sin(da)*t, -2, pCZ + Math.cos(da)*t); g.add(plg);
          }
          scene.add(g);
        }

        // ── Rain ──────────────────────────────────────────────────────────
        const rainPosArr = new Float32Array(RAIN_COUNT * 6);
        for (let i=0;i<RAIN_COUNT;i++) {
          const rx=(Math.random()-0.5)*180, rz=(Math.random()-0.5)*180, ry=40+Math.random()*60;
          rainPosArr[i*6]=rx; rainPosArr[i*6+1]=ry;   rainPosArr[i*6+2]=rz;
          rainPosArr[i*6+3]=rx; rainPosArr[i*6+4]=ry-5; rainPosArr[i*6+5]=rz;
        }
        const rainGeo   = new THREE.BufferGeometry();
        rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPosArr, 3));
        const rainMat   = new THREE.LineBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.0, depthWrite: false });
        const rainLines = new THREE.LineSegments(rainGeo, rainMat);
        const rainGroup = new THREE.Group();
        rainGroup.add(rainLines); scene.add(rainGroup);

        // ── Presets ────────────────────────────────────────────────────────
        const TP: Record<TimeOfDay, {
          skyTop:T.Color; skyMid:T.Color; skyHoriz:T.Color;
          fogColor:T.Color; fogDensity:number;
          ambColor:T.Color; ambInt:number;
          dirColor:T.Color; dirInt:number;
          waterColor:T.Color; waveDistBase:number; waveSpeedBase:number;
          exposure:number; starOpacity:number;
          sunOpacity:number; moonOpacity:number; moonGlow:number;
        }> = {
          day: {
            skyTop:new THREE.Color(0x0a3d8f), skyMid:new THREE.Color(0x5ba3d9), skyHoriz:new THREE.Color(0xe8c87a),
            fogColor:new THREE.Color(0xa8c8e8), fogDensity:0.0018,
            ambColor:new THREE.Color(0xffd090), ambInt:1.2,
            dirColor:new THREE.Color(0xfff5e0), dirInt:2.5,
            waterColor:new THREE.Color(0x006994), waveDistBase:2.5, waveSpeedBase:0.4,
            exposure:1.0, starOpacity:0.0, sunOpacity:1.0, moonOpacity:0.0, moonGlow:0.0,
          },
          sunset: {
            skyTop:new THREE.Color(0x1a0a2e), skyMid:new THREE.Color(0x8b2a10), skyHoriz:new THREE.Color(0xff6030),
            fogColor:new THREE.Color(0xff7040), fogDensity:0.0022,
            ambColor:new THREE.Color(0xff8040), ambInt:0.9,
            dirColor:new THREE.Color(0xff6020), dirInt:1.8,
            waterColor:new THREE.Color(0x1a0810), waveDistBase:3.0, waveSpeedBase:0.5,
            exposure:0.8, starOpacity:0.15, sunOpacity:1.0, moonOpacity:0.0, moonGlow:0.0,
          },
          night: {
            skyTop:new THREE.Color(0x000208), skyMid:new THREE.Color(0x020a28), skyHoriz:new THREE.Color(0x061235),
            fogColor:new THREE.Color(0x020812), fogDensity:0.003,
            ambColor:new THREE.Color(0x1a2848), ambInt:0.7,
            dirColor:new THREE.Color(0xb0c4ee), dirInt:1.0,
            waterColor:new THREE.Color(0x001830), waveDistBase:2.8, waveSpeedBase:0.45,
            exposure:0.4, starOpacity:0.88, sunOpacity:0.0, moonOpacity:1.0, moonGlow:1.0,
          },
        };
        const WP: Record<Weather, { distMult:number; speedMult:number; fogMult:number; rockMult:number; rain:boolean }> = {
          calm:  { distMult:1.0, speedMult:1.0, fogMult:1.0, rockMult:1.0, rain:false },
          windy: { distMult:1.5, speedMult:1.4, fogMult:1.2, rockMult:1.8, rain:false },
          rainy: { distMult:2.2, speedMult:1.8, fogMult:1.8, rockMult:3.0, rain:true  },
        };

        // ── Lerp state ─────────────────────────────────────────────────────
        const cur = {
          skyTop:new THREE.Color().copy(TP.day.skyTop), skyMid:new THREE.Color().copy(TP.day.skyMid),
          skyHoriz:new THREE.Color().copy(TP.day.skyHoriz), fogColor:new THREE.Color().copy(TP.day.fogColor),
          fogDensity:TP.day.fogDensity, ambColor:new THREE.Color().copy(TP.day.ambColor), ambInt:TP.day.ambInt,
          dirColor:new THREE.Color().copy(TP.day.dirColor), dirInt:TP.day.dirInt, dirPos:SUN_DAY_POS.clone(),
          waterColor:new THREE.Color().copy(TP.day.waterColor), waveDist:TP.day.waveDistBase, waveSpeed:TP.day.waveSpeedBase,
          exposure:TP.day.exposure, starOp:0.0, sunOp:1.0, sunPos:SUN_DAY_POS.clone(),
          moonOp:0.0, moonGlow:0.0, rockMult:1.0, rainOp:0.0,
        };

        // ── Physics state ──────────────────────────────────────────────────
        let shipAngle = 0.4;  // start pointing slightly to give autopilot direction
        let shipSpeed = 0;
        let helmAngle = 0;
        const camPos  = new THREE.Vector3(0, 30, 0);

        // ── Keyboard controls ─────────────────────────────────────────────
        const keys = new Set<string>();
        const onKeyDown = (e: KeyboardEvent) => {
          if (!playModeRef.current) return;
          if (e.key === 'd' || e.key === 'D') {
            if (dockedRef.current) {
              dockedRef.current = false; setDocked(false);
            } else {
              let nearest: IslandDef | null = null, nearestDist = Infinity;
              for (const isl of ISLANDS) {
                const d = Math.sqrt((ship.position.x-isl.x)**2 + (ship.position.z-isl.z)**2);
                if (d < nearestDist) { nearestDist = d; nearest = isl; }
              }
              if (nearest && nearestDist < nearest.radius + PIER_LEN + 22) {
                const da = nearest.dockAngle;
                dockedPosRef.current = {
                  x: nearest.x + Math.sin(da) * (nearest.radius * 1.05 + PIER_LEN + 6),
                  z: nearest.z + Math.cos(da) * (nearest.radius * 1.05 + PIER_LEN + 6),
                  angle: da + Math.PI,
                };
                ship.position.x = dockedPosRef.current.x;
                ship.position.z = dockedPosRef.current.z;
                ship.rotation.y = dockedPosRef.current.angle;
                shipSpeed = 0;
                dockedRef.current = true; setDocked(true);
              }
            }
            return;
          }
          keys.add(e.key);
          if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
        };
        const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup",   onKeyUp);

        const clock = new THREE.Clock();
        let elapsed = 0;
        let animId  = 0;

        const tick = () => {
          animId = requestAnimationFrame(tick);
          const dt = Math.min(clock.getDelta(), 0.05);
          elapsed += dt;

          // ── Lerp presets ────────────────────────────────────────────────
          const todT = TP[todRef.current];
          const wxT  = WP[wxRef.current];
          const lf   = 0.018;
          cur.skyTop.lerp(todT.skyTop, lf);
          cur.skyMid.lerp(todT.skyMid, lf);
          cur.skyHoriz.lerp(todT.skyHoriz, lf);
          cur.fogColor.lerp(todT.fogColor, lf);
          cur.fogDensity += (todT.fogDensity * wxT.fogMult - cur.fogDensity) * lf;
          cur.ambColor.lerp(todT.ambColor, lf);
          cur.ambInt     += (todT.ambInt    - cur.ambInt)    * lf;
          cur.dirColor.lerp(todT.dirColor, lf);
          cur.dirInt     += (todT.dirInt    - cur.dirInt)    * lf;
          cur.waterColor.lerp(todT.waterColor, lf);
          cur.waveDist   += (todT.waveDistBase  * wxT.distMult  - cur.waveDist)  * lf;
          cur.waveSpeed  += (todT.waveSpeedBase * wxT.speedMult - cur.waveSpeed) * lf;
          cur.exposure   += (todT.exposure   - cur.exposure)  * lf;
          cur.starOp     += (todT.starOpacity - cur.starOp)   * lf;
          cur.sunOp      += (todT.sunOpacity  - cur.sunOp)    * lf;
          cur.moonOp     += (todT.moonOpacity - cur.moonOp)   * lf;
          cur.moonGlow   += (todT.moonGlow    - cur.moonGlow) * lf;
          cur.rockMult   += (wxT.rockMult     - cur.rockMult) * lf;
          cur.rainOp     += ((wxT.rain ? 0.55 : 0.0) - cur.rainOp) * lf;

          cur.sunPos.lerp(todRef.current === "sunset" ? SUN_SET_POS : SUN_DAY_POS, lf);
          sunMesh.position.copy(cur.sunPos); sunGlow.position.copy(cur.sunPos);
          cur.dirPos.lerp(todRef.current === "night" ? MOON_POS : cur.sunPos, lf);
          dirLight.position.copy(cur.dirPos);

          skyMat.uniforms.uTop.value.copy(cur.skyTop);
          skyMat.uniforms.uMid.value.copy(cur.skyMid);
          skyMat.uniforms.uHoriz.value.copy(cur.skyHoriz);
          (scene.fog as T.FogExp2).color.copy(cur.fogColor);
          (scene.fog as T.FogExp2).density = cur.fogDensity;
          ambLight.color.copy(cur.ambColor); ambLight.intensity = cur.ambInt;
          dirLight.color.copy(cur.dirColor); dirLight.intensity = cur.dirInt;
          wU["waterColor"].value.copy(cur.waterColor);
          wU["distortionScale"].value = cur.waveDist;
          wU["sunDirection"].value.copy(cur.dirPos).normalize();
          renderer.toneMappingExposure = cur.exposure;
          starMat.opacity = Math.max(0, cur.starOp + (cur.starOp > 0.01 ? Math.sin(elapsed*2.2)*0.05*cur.starOp : 0));
          sunMat.opacity = cur.sunOp; sunGlowMat.opacity = cur.sunOp * 0.06;
          moonMat.opacity = cur.moonOp;
          moonHalos.forEach((h,i) => { (h.material as T.MeshBasicMaterial).opacity = cur.moonGlow * HALO_BASE[i]; });

          // ── Rain ────────────────────────────────────────────────────────
          rainGroup.position.copy(ship.position);
          rainMat.opacity = cur.rainOp;
          rainLines.visible = cur.rainOp > 0.01;
          if (rainLines.visible) {
            const rp = rainGeo.attributes.position as T.BufferAttribute;
            for (let i=0;i<RAIN_COUNT;i++) {
              const y1=rp.getY(i*2)-55*dt, y2=rp.getY(i*2+1)-55*dt;
              if (y2 < -10) {
                const rx=(Math.random()-0.5)*180, rz=(Math.random()-0.5)*180, ry=40+Math.random()*60;
                rp.setXYZ(i*2,rx,ry,rz); rp.setXYZ(i*2+1,rx,ry-5,rz);
              } else { rp.setY(i*2,y1); rp.setY(i*2+1,y2); }
            }
            rp.needsUpdate = true;
          }

          // ── Ship movement ────────────────────────────────────────────────
          const prevX = ship.position.x, prevZ = ship.position.z;

          if (playModeRef.current) {
            const drag       = helmDragRef.current;
            const canvasDrag = canvasDragRef.current;

            // Sync vertical joystick axis into virtual throttle keys (helm takes priority)
            if (drag.active && drag.isTouch) {
              const yOff = drag.curY - drag.startY;
              const tk = touchKeysRef.current;
              if (yOff < -12) { tk.add('ArrowUp');   tk.delete('ArrowDown'); }
              else if (yOff > 12) { tk.add('ArrowDown'); tk.delete('ArrowUp'); }
              else { tk.delete('ArrowUp'); tk.delete('ArrowDown'); }
            } else if (canvasDrag.active) {
              const yOff = canvasDrag.curY - canvasDrag.startY;
              const tk = touchKeysRef.current;
              if (yOff < -15) { tk.add('ArrowUp');   tk.delete('ArrowDown'); }
              else if (yOff > 15) { tk.add('ArrowDown'); tk.delete('ArrowUp'); }
              else { tk.delete('ArrowUp'); tk.delete('ArrowDown'); }
            }

            // Player-controlled
            const tk   = touchKeysRef.current;
            const fwd  = keys.has("ArrowUp")    || keys.has("w") || keys.has("W") || tk.has("ArrowUp");
            const back = keys.has("ArrowDown")  || keys.has("s") || keys.has("S") || tk.has("ArrowDown");
            const left = keys.has("ArrowLeft")  || keys.has("a") || keys.has("A") || tk.has("ArrowLeft");
            const rgt  = keys.has("ArrowRight") || tk.has("ArrowRight");

            if (dockedRef.current) {
              // Undock on any throttle / steer input
              if (fwd || back || left || rgt) { dockedRef.current = false; setDocked(false); }
              else {
                ship.position.x = dockedPosRef.current.x;
                ship.position.z = dockedPosRef.current.z;
                ship.rotation.y = dockedPosRef.current.angle;
                shipSpeed = 0;
              }
            } else {
              const { maxSpeed, accel, turnSpeed } = shipStatsRef.current;
              if (fwd)       shipSpeed = Math.min(shipSpeed + accel, maxSpeed);
              else if (back) shipSpeed = Math.max(shipSpeed - accel*2, -maxSpeed*0.25);
              else           shipSpeed *= 0.984;

              const turn = turnSpeed * (Math.min(Math.abs(shipSpeed)/maxSpeed, 1)*0.8 + 0.2);
              if (left) shipAngle += turn;
              if (rgt)  shipAngle -= turn;

              // Steering: helm drag > canvas drag > keys
              if (drag.active) {
                if (drag.isTouch) {
                  const xOff = drag.curX - drag.startX;
                  const steerRate = Math.max(-1, Math.min(1, xOff / 55));
                  if (Math.abs(xOff) > 8) shipAngle -= steerRate * turn;
                  helmAngle += (steerRate * 80 - helmAngle) * 0.2;
                } else {
                  if (drag.delta !== 0) {
                    const dragRate = Math.max(-1, Math.min(1, drag.delta / 30));
                    shipAngle -= dragRate * turn;
                  }
                  helmAngle += drag.delta;
                  drag.delta = 0;
                }
              } else if (canvasDrag.active) {
                const xOff = canvasDrag.curX - canvasDrag.startX;
                const steerRate = Math.max(-1, Math.min(1, xOff / 80));
                if (Math.abs(xOff) > 10) shipAngle -= steerRate * turn;
                helmAngle += (steerRate * 80 - helmAngle) * 0.2;
              } else {
                const helmTarget = rgt ? 90 : left ? -90 : 0;
                helmAngle += (helmTarget - helmAngle) * 0.12;
              }
              if (helmImgRef.current) helmImgRef.current.style.transform = `rotate(${helmAngle}deg)`;
            }
          } else {
            // Auto-pilot: gentle serpentine forward sailing
            shipAngle += Math.sin(elapsed * 0.07) * 0.0004;
            const dist2 = Math.sqrt(ship.position.x**2 + ship.position.z**2);
            if (dist2 > WORLD_R * 0.82) {
              const toCenter = Math.atan2(-ship.position.x, -ship.position.z);
              const diff = ((toCenter - shipAngle + Math.PI) % (Math.PI*2)) - Math.PI;
              shipAngle += diff * 0.008;
            }
            shipSpeed += (shipStatsRef.current.maxSpeed * 0.2 - shipSpeed) * 0.008;
          }

          if (!dockedRef.current) {
            ship.position.x += Math.sin(shipAngle) * shipSpeed * dt;
            ship.position.z += Math.cos(shipAngle) * shipSpeed * dt;
            ship.rotation.y  = shipAngle;

            // Boundary
            if (Math.sqrt(ship.position.x**2 + ship.position.z**2) > WORLD_R) {
              shipAngle = Math.atan2(ship.position.x, ship.position.z) + Math.PI;
              ship.position.x = prevX; ship.position.z = prevZ; shipSpeed *= 0.2;
            }

            // Island collisions
            for (const isl of ISLANDS) {
              const dx=ship.position.x-isl.x, dz=ship.position.z-isl.z;
              if (Math.sqrt(dx*dx+dz*dz) < isl.radius+6) {
                ship.position.x=prevX; ship.position.z=prevZ; shipSpeed*=-0.35;
              }
            }
          }

          // Nearest island for UI label / minimap
          let closestName: string|null = null, closestDist = Infinity;
          for (const isl of ISLANDS) {
            const d = Math.sqrt((ship.position.x-isl.x)**2 + (ship.position.z-isl.z)**2);
            if (d < closestDist) { closestDist=d; closestName=isl.name; }
          }

          shipPosRef.current = { x: ship.position.x, z: ship.position.z, angle: shipAngle };

          if (playModeRef.current) {
            setNearIsland(closestDist < 120 ? closestName : null);
            setHeading(Math.round(((shipAngle*180/Math.PI)%360+360)%360));
            setSpeedPct(Math.round(Math.abs(shipSpeed)/shipStatsRef.current.maxSpeed*100));
          }

          // Bob & rock — multi-frequency wave simulation
          if (!dockedRef.current) {
            const rock = cur.rockMult;
            // Heave: two overlapping swells for natural vertical motion
            const heave = Math.sin(elapsed*0.45)*0.55 + Math.sin(elapsed*0.73)*0.20 + Math.sin(elapsed*1.15)*0.08;
            ship.position.y = 0.2 + heave * Math.min(rock * 0.65, 2.2);
            // Roll (z): primary swell + cross-swell + chop
            shipModel.rotation.z = (
              Math.sin(elapsed*0.50)*0.055 +
              Math.sin(elapsed*0.27)*0.038 +
              Math.sin(elapsed*1.10)*0.020 +
              Math.sin(elapsed*1.90)*0.009
            ) * rock;
            // Pitch (x): fore-aft nodding, smaller than roll
            shipModel.rotation.x = (
              Math.sin(elapsed*0.40)*0.028 +
              Math.sin(elapsed*0.82)*0.012
            ) * rock;
            // Slight yaw drift for liveliness
            ship.rotation.y = shipAngle + Math.sin(elapsed*0.33)*0.012 * rock;
          } else {
            // Docked: gentle idle rock, no heave
            ship.position.y = 0.2 + Math.sin(elapsed*0.3)*0.06;
            shipModel.rotation.z = Math.sin(elapsed*0.35)*0.012;
            shipModel.rotation.x = Math.sin(elapsed*0.28)*0.005;
          }
          if (flagMesh) flagMesh.rotation.y = Math.sin(elapsed*3.5)*0.5 * Math.max(0.6, cur.rockMult);

          // Camera
          const camH=28+shipSpeed*0.35, camD=52+shipSpeed*0.6;
          camPos.x += (ship.position.x - Math.sin(shipAngle)*camD - camPos.x)*0.055;
          camPos.y += (camH - camPos.y)*0.055;
          camPos.z += (ship.position.z - Math.cos(shipAngle)*camD - camPos.z)*0.055;
          camera.position.copy(camPos);
          camera.lookAt(ship.position.x, ship.position.y+5, ship.position.z);

          wU["time"].value += dt * cur.waveSpeed;
          renderer.render(scene, camera);
        };
        tick();

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);

        // ── Canvas drag (joystick for ship) ──────────────────────────────────
        const onCanvasDown = (e: PointerEvent) => {
          if (!playModeRef.current) return;
          renderer.domElement.setPointerCapture(e.pointerId);
          canvasDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY };
          setCanvasJoystick({ cx: e.clientX, cy: e.clientY, x: e.clientX, y: e.clientY });
        };
        const onCanvasMove = (e: PointerEvent) => {
          const d = canvasDragRef.current;
          if (!d.active) return;
          d.curX = e.clientX; d.curY = e.clientY;
          setCanvasJoystick(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        };
        const onCanvasUp = () => {
          canvasDragRef.current.active = false;
          touchKeysRef.current.delete('ArrowUp');
          touchKeysRef.current.delete('ArrowDown');
          setCanvasJoystick(null);
        };
        renderer.domElement.addEventListener('pointerdown', onCanvasDown);
        renderer.domElement.addEventListener('pointermove', onCanvasMove);
        renderer.domElement.addEventListener('pointerup',   onCanvasUp);
        renderer.domElement.addEventListener('pointercancel', onCanvasUp);

        if (alive) setLoaded(true);

        disposeAll = () => {
          cancelAnimationFrame(animId);
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup",   onKeyUp);
          window.removeEventListener("resize",  onResize);
          renderer.domElement.removeEventListener('pointerdown',   onCanvasDown);
          renderer.domElement.removeEventListener('pointermove',   onCanvasMove);
          renderer.domElement.removeEventListener('pointerup',     onCanvasUp);
          renderer.domElement.removeEventListener('pointercancel', onCanvasUp);
          renderer.dispose();
          if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };

      } catch (err) {
        console.error("[PirateSailingGame] setup error:", err);
        if (alive) setErrMsg(String(err));
      }
    })();

    return () => { alive = false; disposeAll?.(); };
  }, []);

  // ── Mini-map canvas loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const R = W / 2;
    const scale = (R - 6) / WORLD_R;
    const TYPE_COLOR: Record<IslandDef['type'], string> = {
      volcano:'#ff6622', port:'#ffcc44', lighthouse:'#eeeeff',
      fort:'#aa88ee', ruins:'#cc9966', jungle:'#44bb44', rocks:'#888888',
    };
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, W);
      ctx.save();
      ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI*2); ctx.clip();
      ctx.fillStyle = 'rgba(0,12,35,0.88)'; ctx.fillRect(0,0,W,W);
      // world ring
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(R, R, WORLD_R*scale, 0, Math.PI*2); ctx.stroke();
      // islands
      for (const isl of ISLANDS) {
        const mx = R + isl.x*scale, my = R + isl.z*scale;
        const mr = Math.max(3, isl.radius*scale*0.55);
        ctx.fillStyle = TYPE_COLOR[isl.type];
        ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // dock key hint dot
      const { x, z, angle } = shipPosRef.current;
      // nearby island dock indicator
      for (const isl of ISLANDS) {
        const d = Math.sqrt((x-isl.x)**2 + (z-isl.z)**2);
        if (d < isl.radius + PIER_LEN + 22) {
          const mx = R + isl.x*scale, my = R + isl.z*scale;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(mx, my, Math.max(3, isl.radius*scale*0.55)+3, 0, Math.PI*2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      // ship triangle
      const sx = R + x*scale, sy = R + z*scale;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
      ctx.fillStyle = dockedRef.current ? '#44ffcc' : '#ffffff';
      ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(-3,4); ctx.lineTo(3,4); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.restore();
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [loaded]);

  const StatBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] font-mono text-white/30 w-5">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-400/50 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );

  // ── Touch button renderer ──────────────────────────────────────────────────
  const TBtn = ({
    k, children, className,
  }: { k: string; children: React.ReactNode; className?: string }) => (
    <button
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pressKey(k); }}
      onPointerUp={() => releaseKey(k)}
      onPointerLeave={() => releaseKey(k)}
      onPointerCancel={() => releaseKey(k)}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 text-white text-2xl active:bg-white/20 select-none touch-none cursor-pointer ${className ?? ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`fixed inset-0 overflow-hidden select-none ${playMode ? "bg-black" : ""}`}>
      <div ref={mountRef} className="w-full h-full" />

      {/* ── Canvas joystick visual ── */}
      {canvasJoystick && playMode && loaded && (() => {
        const dx = canvasJoystick.x - canvasJoystick.cx;
        const dy = canvasJoystick.y - canvasJoystick.cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const MAX = 60;
        const clampedX = canvasJoystick.cx + dx / Math.max(dist, MAX) * Math.min(dist, MAX);
        const clampedY = canvasJoystick.cy + dy / Math.max(dist, MAX) * Math.min(dist, MAX);
        return (
          <svg className="fixed inset-0 pointer-events-none z-40" width="100%" height="100%">
            <circle cx={canvasJoystick.cx} cy={canvasJoystick.cy} r={MAX} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <line x1={canvasJoystick.cx} y1={canvasJoystick.cy} x2={clampedX} y2={clampedY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx={clampedX} cy={clampedY} r={18} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          </svg>
        );
      })()}

      {/* ── Play-mode UI ── */}
      {playMode && (
        <>
          {/* Back / exit */}
          {onExitPlay ? (
            <button
              onClick={onExitPlay}
              className="fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/55 backdrop-blur-md border border-white/15 text-white/70 text-sm font-mono hover:border-white/40 hover:text-white transition-all duration-200 cursor-pointer"
            >
              ← Portfolio
            </button>
          ) : (
            <Link
              to="/"
              className="fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/55 backdrop-blur-md border border-white/15 text-white/70 text-sm font-mono hover:border-white/40 hover:text-white transition-all duration-200 cursor-pointer"
            >
              ← Portfolio
            </Link>
          )}

          {/* Settings panel */}
          {loaded && (
            <div className="fixed top-16 left-5 z-50 flex flex-col gap-2">
              <div className="flex gap-0.5 bg-black/55 backdrop-blur-md border border-white/15 rounded-lg p-1.5">
                {([["day","☀️"],["sunset","🌅"],["night","🌙"]] as [TimeOfDay,string][]).map(([v,e]) => (
                  <button key={v} onClick={() => setTimeOfDay(v)} title={v}
                    className={`text-base px-2 py-1 rounded cursor-pointer transition-all duration-200 ${todUI===v?"bg-white/20":"opacity-35 hover:opacity-65"}`}
                  >{e}</button>
                ))}
              </div>
              <div className="flex gap-0.5 bg-black/55 backdrop-blur-md border border-white/15 rounded-lg p-1.5">
                {([["calm","🌊"],["windy","💨"],["rainy","🌧️"]] as [Weather,string][]).map(([v,e]) => (
                  <button key={v} onClick={() => setWeather(v)} title={v}
                    className={`text-base px-2 py-1 rounded cursor-pointer transition-all duration-200 ${wxUI===v?"bg-white/20":"opacity-35 hover:opacity-65"}`}
                  >{e}</button>
                ))}
              </div>
              {/* Ship selector */}
              {/* Ship selector */}
              <div className="flex flex-col gap-1 bg-black/55 backdrop-blur-md border border-white/15 rounded-lg p-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const next = (shipIdx - 1 + SHIPS.length) % SHIPS.length;
                      setShipIdx(next);
                      swapShipRef.current?.(next);
                    }}
                    disabled={swapping}
                    className="text-white/60 hover:text-white px-1.5 py-1 rounded cursor-pointer transition-all duration-200 disabled:opacity-30"
                  >‹</button>
                  <span className={`text-[11px] font-mono flex-1 text-center transition-opacity duration-200 ${swapping ? "text-white/30 animate-pulse" : "text-white/80"}`}>
                    {swapping ? "loading…" : SHIPS[shipIdx].name}
                  </span>
                  <button
                    onClick={() => {
                      const next = (shipIdx + 1) % SHIPS.length;
                      setShipIdx(next);
                      swapShipRef.current?.(next);
                    }}
                    disabled={swapping}
                    className="text-white/60 hover:text-white px-1.5 py-1 rounded cursor-pointer transition-all duration-200 disabled:opacity-30"
                  >›</button>
                </div>
                {!swapping && (() => {
                  const s = SHIPS[shipIdx];
                  const maxS = Math.max(...SHIPS.map(x => x.maxSpeed));
                  const maxT = Math.max(...SHIPS.map(x => x.turnSpeed));
                  return (
                    <div className="flex flex-col gap-0.5 px-1 pb-0.5">
                      <span className="text-[9px] font-mono text-white/35 text-center">{s.desc}</span>
                      <StatBar label="spd" value={s.maxSpeed / maxS} />
                      <StatBar label="hdl" value={s.turnSpeed / maxT} />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Compass + mini map */}
          {loaded && (
            <div className="fixed top-5 right-5 z-50 flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
                <span className="absolute top-1    left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/40">N</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/25">S</span>
                <span className="absolute left-1   top-1/2  -translate-y-1/2 text-[8px] font-mono text-white/25">W</span>
                <span className="absolute right-1  top-1/2  -translate-y-1/2 text-[8px] font-mono text-white/25">E</span>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform:`rotate(${heading}deg)` }}>
                  <div className="relative w-0.5 h-12 flex flex-col items-center">
                    <div className="w-0.5 flex-1 bg-red-400 rounded-full" />
                    <div className="w-0.5 flex-1 bg-white/35 rounded-full" />
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/45 bg-black/45 px-2 py-0.5 rounded">{heading}°</span>
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400/60 rounded-full transition-all duration-100" style={{ width:`${speedPct}%` }} />
              </div>
              <span className="text-[9px] font-mono text-white/30">{speedPct}%</span>
              {/* Mini map */}
              <div className="relative mt-1">
                <canvas
                  ref={minimapRef}
                  width={140} height={140}
                  className="rounded-full border border-white/15 opacity-80"
                />
                {docked && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                    <span className="text-[8px] font-mono text-emerald-400/80 bg-black/50 px-1.5 rounded">DOCKED</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Island label / dock prompt */}
          {nearIsland && loaded && !docked && (
            <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 text-white/80 text-sm font-mono pointer-events-none">
              🏝️ {nearIsland} <span className="text-white/35 text-xs ml-2">D to dock</span>
            </div>
          )}
          {docked && loaded && (
            <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-lg bg-black/65 backdrop-blur-md border border-emerald-400/30 text-emerald-300/90 text-sm font-mono pointer-events-none">
              ⚓ Docked at {nearIsland} <span className="text-white/35 text-xs ml-2">D or move to leave</span>
            </div>
          )}

          {/* Desktop keyboard hint — hidden on small screens */}
          {loaded && (
            <div className="fixed bottom-5 right-5 z-50 hidden md:flex flex-col gap-1 items-end text-[10px] font-mono text-white/25 pointer-events-none">
              <span><span className="text-white/40">↑ W</span> Throttle</span>
              <span><span className="text-white/40">← → / drag helm</span> Steer</span>
              <span><span className="text-white/40">↓ S</span> Brake</span>
              <span><span className="text-white/40">D</span> Dock / undock</span>
            </div>
          )}

          {/* Loading / error overlay */}
          {!loaded && (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4">
              {errMsg ? (
                <>
                  <span className="text-red-400 font-mono text-sm">Failed to initialize</span>
                  <pre className="text-red-300/60 text-xs max-w-lg text-center whitespace-pre-wrap px-4">{errMsg}</pre>
                  {onExitPlay
                    ? <button onClick={onExitPlay} className="mt-4 text-white/50 font-mono text-xs underline">← go back</button>
                    : <Link to="/" className="mt-4 text-white/50 font-mono text-xs underline">← go back</Link>
                  }
                </>
              ) : (
                <>
                  <span className="text-4xl">🏴‍☠️</span>
                  <span className="text-white/50 font-mono text-sm tracking-widest animate-pulse">SETTING SAIL…</span>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Helm + mobile throttle — always mounted so ref attaches regardless of playMode */}
      <div
        className="fixed bottom-8 left-0 right-0 z-50 flex items-end justify-center gap-6 px-8"
        style={{ opacity: playMode && loaded ? 1 : 0, transition:"opacity 0.6s", pointerEvents: playMode && loaded ? "auto" : "none" }}
      >
        {/* Helm wheel */}
        <div className="flex flex-col items-center gap-1.5">
          <img
            ref={helmImgRef}
            src="/helm_white.png"
            alt="helm"
            className="w-24 h-24 will-change-transform cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ opacity:0.7, filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}
            draggable={false}
            onPointerDown={onHelmPointerDown}
            onPointerMove={onHelmPointerMove}
            onPointerUp={onHelmPointerUp}
            onPointerCancel={onHelmPointerUp}
          />
          <span className="text-[10px] font-mono text-white/30 tracking-widest pointer-events-none">
            {playMode && loaded ? (speedPct > 2 ? "SAILING" : "ANCHORED") : ""}
          </span>
          <span className="md:hidden text-[9px] font-mono text-white/20 pointer-events-none">
            {playMode && loaded ? "drag ↕ throttle  ↔ steer" : ""}
          </span>
        </div>

      </div>
    </div>
  );
}
