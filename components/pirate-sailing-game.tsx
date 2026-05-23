import { useEffect, useRef, useState } from "react";
import type * as T from "three";
import { buildProceduralIslands } from "./game/build-islands";
import {
  ISLAND_GLB, ISLANDS, RAIN_COUNT, SHIPS, WEATHER_PRESETS, WORLD_R,
  type TimeOfDay, type Weather,
} from "./game/config";
import { GameUI } from "./game/GameUI";

interface PirateSailingGameProps {
  /** true (default) = full interactive game with all UI.
   *  false = silent background mode — ship auto-pilots, no controls shown. */
  playMode?: boolean;
  /** Called when the user taps "Back" — used by home page to exit play mode. */
  onExitPlay?: () => void;
}

export function PirateSailingGame({ playMode = true, onExitPlay }: PirateSailingGameProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const helmImgRef    = useRef<HTMLImageElement>(null);
  const touchKeysRef  = useRef(new Set<string>());
  const playModeRef   = useRef(playMode);
  const helmDragRef   = useRef({ active: false, prevX: 0, delta: 0, startX: 0, startY: 0, curX: 0, curY: 0, isTouch: false });
  const canvasDragRef = useRef({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
  const swapShipRef   = useRef<((idx: number) => Promise<void>) | null>(null);
  const shipStatsRef  = useRef({ maxSpeed: 0, accel: 0, turnSpeed: 0 });
  const shipPosRef    = useRef({ x: 0, z: 0, angle: 0 });
  const todRef        = useRef<TimeOfDay>("day");
  const wxRef         = useRef<Weather>("calm");

  const [todUI,      setTodUI]      = useState<TimeOfDay>("day");
  const [wxUI,       setWxUI]       = useState<Weather>("calm");
  const [nearIsland, setNearIsland] = useState<string | null>(null);
  const [heading,    setHeading]    = useState(0);
  const [speedPct,   setSpeedPct]   = useState(0);
  const [loaded,     setLoaded]     = useState(false);
  const [errMsg,     setErrMsg]     = useState<string | null>(null);
  const [swapping,   setSwapping]   = useState(false);
  const [canvasJoystick, setCanvasJoystick] = useState<{ cx: number; cy: number; x: number; y: number } | null>(null);
  const [shipIdx, setShipIdx] = useState(() => {
    if (typeof window === "undefined") return 0;
    const s = parseInt(localStorage.getItem("shipIdx") ?? "0", 10);
    return s >= 0 && s < SHIPS.length ? s : 0;
  });

  const initialShipIdx = (() => {
    if (typeof window === "undefined") return 0;
    const s = parseInt(localStorage.getItem("shipIdx") ?? "0", 10);
    return s >= 0 && s < SHIPS.length ? s : 0;
  })();
  shipStatsRef.current = {
    maxSpeed:  SHIPS[initialShipIdx].maxSpeed,
    accel:     SHIPS[initialShipIdx].accel,
    turnSpeed: SHIPS[initialShipIdx].turnSpeed,
  };

  const setTimeOfDay = (v: TimeOfDay) => { todRef.current = v; setTodUI(v); };
  const setWeather   = (v: Weather)   => { wxRef.current  = v; setWxUI(v); };

  const pressKey   = (k: string) => touchKeysRef.current.add(k);
  const releaseKey = (k: string) => touchKeysRef.current.delete(k);

  const onShipPrev = () => {
    const next = (shipIdx - 1 + SHIPS.length) % SHIPS.length;
    setShipIdx(next);
    localStorage.setItem("shipIdx", String(next));
    swapShipRef.current?.(next);
  };
  const onShipNext = () => {
    const next = (shipIdx + 1) % SHIPS.length;
    setShipIdx(next);
    localStorage.setItem("shipIdx", String(next));
    swapShipRef.current?.(next);
  };

  useEffect(() => {
    playModeRef.current = playMode;
    if (!playMode) touchKeysRef.current.clear();
  }, [playMode]);

  // ── Helm drag handlers ──────────────────────────────────────────────────────
  const onHelmPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!playModeRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const isTouch = e.pointerType === "touch";
    helmDragRef.current = { active: true, prevX: e.clientX, delta: 0, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY, isTouch };
  };
  const onHelmPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const drag = helmDragRef.current;
    if (!drag.active) return;
    if (drag.isTouch) {
      drag.curX = e.clientX; drag.curY = e.clientY;
    } else {
      drag.delta += (e.clientX - drag.prevX) * 2;
      drag.prevX = e.clientX;
    }
  };
  const onHelmPointerUp = () => {
    helmDragRef.current.active = false;
    helmDragRef.current.delta = 0;
    touchKeysRef.current.delete("ArrowUp");
    touchKeysRef.current.delete("ArrowDown");
  };

  // ── Three.js setup ──────────────────────────────────────────────────────────
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

        // ── Renderer ─────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 1.5 });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        mount.appendChild(renderer.domElement);

        // ── Scene / camera ───────────────────────────────────────────────────
        const scene  = new THREE.Scene();
        scene.fog    = new THREE.FogExp2(0xa8c8e8, 0.0018);
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1400);
        camera.position.set(0, 30, -50);

        // ── Sky sphere ────────────────────────────────────────────────────────
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
        const SUN_SET_POS = new THREE.Vector3(350, 40, -400);
        const MOON_POS    = new THREE.Vector3(-320, 260, -420);

        // ── Sun / moon / stars ────────────────────────────────────────────────
        const sunMat     = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 1.0 });
        const sunMesh    = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 32), sunMat);
        sunMesh.position.copy(SUN_DAY_POS); scene.add(sunMesh);
        const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.06, depthWrite: false });
        const sunGlow    = new THREE.Mesh(new THREE.SphereGeometry(52, 16, 16), sunGlowMat);
        sunGlow.position.copy(SUN_DAY_POS); scene.add(sunGlow);

        const moonMat  = new THREE.MeshBasicMaterial({ color: 0xd8e8ff, transparent: true, opacity: 0.0 });
        const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(22, 32, 32), moonMat);
        moonMesh.position.copy(MOON_POS); scene.add(moonMesh);
        const HALO_BASE = [0.07, 0.03, 0.012];
        const moonHalos: T.Mesh[] = [];
        for (const [r, o] of [[38, HALO_BASE[0]], [60, HALO_BASE[1]], [95, HALO_BASE[2]]] as [number, number][]) {
          const h = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), new THREE.MeshBasicMaterial({ color: 0x8899cc, transparent: true, opacity: o * 0, depthWrite: false }));
          h.position.copy(MOON_POS); scene.add(h); moonHalos.push(h);
        }

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

        // ── Lights ────────────────────────────────────────────────────────────
        const ambLight = new THREE.AmbientLight(0xffd090, 1.2);
        scene.add(ambLight);
        const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
        dirLight.position.copy(SUN_DAY_POS);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        dirLight.shadow.camera.near = 1; dirLight.shadow.camera.far = 700;
        dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -180;
        dirLight.shadow.camera.right = dirLight.shadow.camera.top   =  180;
        scene.add(dirLight);

        // ── Water ─────────────────────────────────────────────────────────────
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

        // ── GLB loader + cache ────────────────────────────────────────────────
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/gltf/");
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        const gltfCache = new Map<string, T.Group>();
        const loadWithCache = async (path: string): Promise<T.Group> => {
          if (!gltfCache.has(path)) {
            const g = await gltfLoader.loadAsync(path);
            gltfCache.set(path, g.scene as T.Group);
          }
          return gltfCache.get(path)!.clone(true) as T.Group;
        };

        // ── Player ship ───────────────────────────────────────────────────────
        const fitShipModel = (model: T.Object3D) => {
          const box         = new THREE.Box3().setFromObject(model);
          const size        = box.getSize(new THREE.Vector3());
          const center      = box.getCenter(new THREE.Vector3());
          const scaleFactor = 24 / Math.max(size.x, size.y, size.z);
          model.scale.setScalar(scaleFactor);
          model.position.set(-scaleFactor * center.x, -2 - scaleFactor * box.min.y, -scaleFactor * center.z);
          let flag: T.Mesh | null = null;
          model.traverse((child) => {
            if (!(child as T.Mesh).isMesh) return;
            const m = child as T.Mesh;
            m.castShadow = true; m.receiveShadow = true;
            if (!flag && m.position.y > size.y * scaleFactor * 0.7) flag = m;
          });
          return flag;
        };

        const initialScene = await loadWithCache(SHIPS[initialShipIdx].path);
        if (!alive) return;

        let shipModel = initialScene;
        shipModel.rotation.y = SHIPS[initialShipIdx].rotY;
        let flagMesh: T.Mesh | null = fitShipModel(shipModel);

        const ship = new THREE.Group();
        ship.add(shipModel); ship.position.set(0, 0.2, 0); scene.add(ship);

        swapShipRef.current = async (idx: number) => {
          setSwapping(true);
          try {
            const s = SHIPS[idx];
            const newScene = await loadWithCache(s.path);
            if (!alive) return;
            ship.remove(shipModel);
            shipModel = newScene;
            shipModel.rotation.y = s.rotY;
            flagMesh = fitShipModel(shipModel);
            ship.add(shipModel);
            shipStatsRef.current = { maxSpeed: s.maxSpeed, accel: s.accel, turnSpeed: s.turnSpeed };
          } finally {
            setSwapping(false);
          }
        };

        // ── Islands (procedural geometry) ─────────────────────────────────────
        buildProceduralIslands(scene, ISLANDS, THREE);

        // ── DEBUG: island radius rings ────────────────────────────────────────
        const SEG = 64;
        const radiusMat = new THREE.LineBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.9, depthTest: false });
        const threshMat = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6, depthTest: false });
        for (const isl of ISLANDS) {
          const makeRing = (r: number, mat: T.LineBasicMaterial) => {
            const pts: T.Vector3[] = [];
            for (let i = 0; i <= SEG; i++) {
              const a = (i / SEG) * Math.PI * 2;
              pts.push(new THREE.Vector3(isl.x + Math.cos(a) * r, 6, isl.z + Math.sin(a) * r));
            }
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
            line.renderOrder = 999;
            return line;
          };
          scene.add(makeRing(isl.radius, radiusMat));
          scene.add(makeRing(isl.radius + 6, threshMat));
        }
        // ── END DEBUG ─────────────────────────────────────────────────────────

        // ── Rain ──────────────────────────────────────────────────────────────
        const rainPosArr = new Float32Array(RAIN_COUNT * 6);
        for (let i = 0; i < RAIN_COUNT; i++) {
          const rx = (Math.random() - 0.5) * 180, rz = (Math.random() - 0.5) * 180, ry = 40 + Math.random() * 60;
          rainPosArr[i*6] = rx; rainPosArr[i*6+1] = ry;     rainPosArr[i*6+2] = rz;
          rainPosArr[i*6+3] = rx; rainPosArr[i*6+4] = ry-5; rainPosArr[i*6+5] = rz;
        }
        const rainGeo   = new THREE.BufferGeometry();
        rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPosArr, 3));
        const rainMat   = new THREE.LineBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.0, depthWrite: false });
        const rainLines = new THREE.LineSegments(rainGeo, rainMat);
        const rainGroup = new THREE.Group();
        rainGroup.add(rainLines); scene.add(rainGroup);

        // ── Island GLB models ─────────────────────────────────────────────────
        const islandFillLights: T.PointLight[] = [];
        for (const isl of ISLANDS) {
          const def = ISLAND_GLB[isl.name];
          if (!def) continue;
          loadWithCache(def.path).then((model) => {
            if (!alive) return;
            const box    = new THREE.Box3().setFromObject(model);
            const size   = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const sf     = (isl.radius * def.scale) / Math.max(size.x, size.z);
            model.scale.setScalar(sf);
            model.position.set(-sf * center.x, -sf * box.min.y, -sf * center.z);
            model.rotation.y = def.rotY;
            const cx = isl.x, cz = isl.z, cr = isl.radius;
            model.traverse((child) => {
              const m = child as T.Mesh;
              if (!m.isMesh) return;
              m.castShadow = true; m.receiveShadow = true;
              if (def.smooth) m.geometry.computeVertexNormals();
              if (def.circular) {
                const applyClip = (mat: T.Material) => {
                  const c = (mat as T.MeshStandardMaterial).clone();
                  c.onBeforeCompile = (shader) => {
                    shader.uniforms.uCenter = { value: new THREE.Vector2(cx, cz) };
                    shader.uniforms.uRadius = { value: cr };
                    shader.vertexShader = 'varying vec3 vWPos;\n' + shader.vertexShader.replace(
                      '#include <worldpos_vertex>',
                      '#include <worldpos_vertex>\nvWPos = worldPosition.xyz;'
                    );
                    shader.fragmentShader = 'varying vec3 vWPos;\nuniform vec2 uCenter;\nuniform float uRadius;\n' + shader.fragmentShader.replace(
                      '#include <dithering_fragment>',
                      'if(length(vWPos.xz - uCenter) > uRadius) discard;\n#include <dithering_fragment>'
                    );
                  };
                  c.needsUpdate = true;
                  return c;
                };
                m.material = Array.isArray(m.material)
                  ? m.material.map(applyClip)
                  : applyClip(m.material);
              }
            });
            const g = new THREE.Group();
            g.position.set(isl.x, def.yOffset ?? 0, isl.z);
            g.add(model);
            const fillLight = new THREE.PointLight(0xfff0d0, 0, isl.radius * 4);
            fillLight.position.set(0, Math.max(30, isl.radius * 0.6), 0);
            g.add(fillLight);
            islandFillLights.push(fillLight);
            scene.add(g);
          }).catch(() => {});
        }

        // ── Time-of-day presets ───────────────────────────────────────────────
        const C = (h: number) => new THREE.Color(h);
        const TP = {
          day: {
            skyTop: C(0x0a3d8f), skyMid: C(0x5ba3d9), skyHoriz: C(0xe8c87a),
            fogColor: C(0xa8c8e8), fogDensity: 0.0018,
            ambColor: C(0xffd090), ambInt: 1.2,
            dirColor: C(0xfff5e0), dirInt: 2.5,
            waterColor: C(0x006994), waveDistBase: 2.5, waveSpeedBase: 0.4,
            exposure: 1.0, starOpacity: 0.0, sunOpacity: 1.0, moonOpacity: 0.0, moonGlow: 0.0,
          },
          sunset: {
            skyTop: C(0x1a0a2e), skyMid: C(0x8b2a10), skyHoriz: C(0xff6030),
            fogColor: C(0xff7040), fogDensity: 0.0022,
            ambColor: C(0xff8040), ambInt: 0.9,
            dirColor: C(0xff6020), dirInt: 1.8,
            waterColor: C(0x1a0810), waveDistBase: 3.0, waveSpeedBase: 0.5,
            exposure: 0.8, starOpacity: 0.15, sunOpacity: 1.0, moonOpacity: 0.0, moonGlow: 0.0,
          },
          night: {
            skyTop: C(0x000208), skyMid: C(0x020a28), skyHoriz: C(0x061235),
            fogColor: C(0x020812), fogDensity: 0.003,
            ambColor: C(0x1a2848), ambInt: 0.7,
            dirColor: C(0xb0c4ee), dirInt: 1.0,
            waterColor: C(0x001830), waveDistBase: 2.8, waveSpeedBase: 0.45,
            exposure: 0.4, starOpacity: 0.88, sunOpacity: 0.0, moonOpacity: 1.0, moonGlow: 1.0,
          },
        };

        // ── Lerp state ────────────────────────────────────────────────────────
        const cur = {
          skyTop: C(0x0a3d8f), skyMid: C(0x5ba3d9), skyHoriz: C(0xe8c87a),
          fogColor: C(0xa8c8e8), fogDensity: 0.0018,
          ambColor: C(0xffd090), ambInt: 1.2,
          dirColor: C(0xfff5e0), dirInt: 2.5, dirPos: SUN_DAY_POS.clone(),
          waterColor: C(0x006994), waveDist: 2.5, waveSpeed: 0.4,
          exposure: 1.0, starOp: 0.0, sunOp: 1.0, sunPos: SUN_DAY_POS.clone(),
          moonOp: 0.0, moonGlow: 0.0, rockMult: 1.0, rainOp: 0.0,
        };

        // ── Physics state ─────────────────────────────────────────────────────
        const savedPos = (() => {
          try {
            const raw = localStorage.getItem("shipPos");
            if (!raw) return null;
            const p = JSON.parse(raw) as { x: number; z: number; angle: number };
            if (p.x**2 + p.z**2 > WORLD_R**2) return null;
            for (const isl of ISLANDS) {
              const dx = p.x - isl.x, dz = p.z - isl.z;
              if (dx*dx + dz*dz < (isl.radius + 8)**2) return null;
            }
            return p;
          } catch { return null; }
        })();
        if (savedPos) { ship.position.x = savedPos.x; ship.position.z = savedPos.z; }
        let shipAngle  = savedPos?.angle ?? 0.4;
        let shipSpeed  = 0;
        let helmAngle  = 0;
        let lastPosSave = 0;
        let uiFrame    = 0;
        const camPos   = new THREE.Vector3(0, 30, 0);

        // ── Keyboard ──────────────────────────────────────────────────────────
        const keys = new Set<string>();
        const onKeyDown = (e: KeyboardEvent) => {
          if (!playModeRef.current) return;
          keys.add(e.key);
          if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
        };
        const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup",   onKeyUp);

        const clock = new THREE.Clock();
        let elapsed = 0;
        let animId  = 0;

        // ── Tick loop ─────────────────────────────────────────────────────────
        const tick = () => {
          animId = requestAnimationFrame(tick);
          const dt = Math.min(clock.getDelta(), 0.05);
          elapsed += dt;

          // Lerp environment presets
          const todT = TP[todRef.current];
          const wxT  = WEATHER_PRESETS[wxRef.current];
          const lf   = 0.018;
          cur.skyTop.lerp(todT.skyTop, lf); cur.skyMid.lerp(todT.skyMid, lf); cur.skyHoriz.lerp(todT.skyHoriz, lf);
          cur.fogColor.lerp(todT.fogColor, lf);
          cur.fogDensity += (todT.fogDensity * wxT.fogMult - cur.fogDensity) * lf;
          cur.ambColor.lerp(todT.ambColor, lf); cur.ambInt += (todT.ambInt - cur.ambInt) * lf;
          cur.dirColor.lerp(todT.dirColor, lf); cur.dirInt += (todT.dirInt - cur.dirInt) * lf;
          cur.waterColor.lerp(todT.waterColor, lf);
          cur.waveDist  += (todT.waveDistBase  * wxT.distMult  - cur.waveDist)  * lf;
          cur.waveSpeed += (todT.waveSpeedBase * wxT.speedMult - cur.waveSpeed) * lf;
          cur.exposure  += (todT.exposure   - cur.exposure)  * lf;
          cur.starOp    += (todT.starOpacity - cur.starOp)   * lf;
          cur.sunOp     += (todT.sunOpacity  - cur.sunOp)    * lf;
          cur.moonOp    += (todT.moonOpacity - cur.moonOp)   * lf;
          cur.moonGlow  += (todT.moonGlow    - cur.moonGlow) * lf;
          cur.rockMult  += (wxT.rockMult     - cur.rockMult) * lf;
          cur.rainOp    += ((wxT.rain ? 0.55 : 0.0) - cur.rainOp) * lf;

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
          starMat.opacity = Math.max(0, cur.starOp + (cur.starOp > 0.01 ? Math.sin(elapsed * 2.2) * 0.05 * cur.starOp : 0));
          sunMat.opacity = cur.sunOp; sunGlowMat.opacity = cur.sunOp * 0.06;
          moonMat.opacity = cur.moonOp;
          moonHalos.forEach((h, i) => { (h.material as T.MeshBasicMaterial).opacity = cur.moonGlow * HALO_BASE[i]; });

          // Rain
          rainGroup.position.copy(ship.position);
          rainMat.opacity = cur.rainOp;
          rainLines.visible = cur.rainOp > 0.01;
          if (rainLines.visible) {
            const rp  = rainGeo.attributes.position as T.BufferAttribute;
            const arr = rp.array as Float32Array;
            const fall = 55 * dt;
            for (let i = 0; i < RAIN_COUNT; i++) {
              const base = i * 6;
              arr[base + 1] -= fall; arr[base + 4] -= fall;
              if (arr[base + 4] < -10) {
                const rx = (Math.random() - 0.5) * 180, rz = (Math.random() - 0.5) * 180, ry = 40 + Math.random() * 60;
                arr[base] = rx; arr[base+1] = ry; arr[base+2] = rz;
                arr[base+3] = rx; arr[base+4] = ry-5; arr[base+5] = rz;
              }
            }
            rp.needsUpdate = true;
          }

          // Ship movement
          const prevX = ship.position.x, prevZ = ship.position.z;

          if (playModeRef.current) {
            const drag       = helmDragRef.current;
            const canvasDrag = canvasDragRef.current;

            if (drag.active && drag.isTouch) {
              const yOff = drag.curY - drag.startY;
              const tk = touchKeysRef.current;
              if (yOff < -12) { tk.add("ArrowUp"); tk.delete("ArrowDown"); }
              else if (yOff > 12) { tk.add("ArrowDown"); tk.delete("ArrowUp"); }
              else { tk.delete("ArrowUp"); tk.delete("ArrowDown"); }
            } else if (canvasDrag.active) {
              const yOff = canvasDrag.curY - canvasDrag.startY;
              const tk = touchKeysRef.current;
              if (yOff < -15) { tk.add("ArrowUp"); tk.delete("ArrowDown"); }
              else if (yOff > 15) { tk.add("ArrowDown"); tk.delete("ArrowUp"); }
              else { tk.delete("ArrowUp"); tk.delete("ArrowDown"); }
            }

            const tk   = touchKeysRef.current;
            const fwd  = keys.has("ArrowUp")    || keys.has("w") || keys.has("W") || tk.has("ArrowUp");
            const back = keys.has("ArrowDown")  || keys.has("s") || keys.has("S") || tk.has("ArrowDown");
            const left = keys.has("ArrowLeft")  || keys.has("a") || keys.has("A") || tk.has("ArrowLeft");
            const rgt  = keys.has("ArrowRight") || tk.has("ArrowRight");

            const { maxSpeed, accel, turnSpeed } = shipStatsRef.current;
            if (fwd)       shipSpeed = Math.min(shipSpeed + accel, maxSpeed);
            else if (back) shipSpeed = Math.max(shipSpeed - accel * 2, -maxSpeed * 0.25);
            else           shipSpeed *= 0.984;

            const turn = turnSpeed * (Math.min(Math.abs(shipSpeed) / maxSpeed, 1) * 0.8 + 0.2);
            if (left) shipAngle += turn;
            if (rgt)  shipAngle -= turn;

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
          } else {
            // Auto-pilot
            shipAngle += Math.sin(elapsed * 0.07) * 0.0004;
            const dist2 = Math.sqrt(ship.position.x**2 + ship.position.z**2);
            if (dist2 > WORLD_R * 0.82) {
              const toCenter = Math.atan2(-ship.position.x, -ship.position.z);
              const diff = ((toCenter - shipAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
              shipAngle += diff * 0.008;
            }
            shipSpeed += (shipStatsRef.current.maxSpeed * 0.2 - shipSpeed) * 0.008;
          }

          ship.position.x += Math.sin(shipAngle) * shipSpeed * dt;
          ship.position.z += Math.cos(shipAngle) * shipSpeed * dt;
          ship.rotation.y  = shipAngle;

          // Boundary
          if (ship.position.x**2 + ship.position.z**2 > WORLD_R**2) {
            shipAngle = Math.atan2(ship.position.x, ship.position.z) + Math.PI;
            ship.position.x = prevX; ship.position.z = prevZ; shipSpeed *= 0.2;
          }

          // Island collisions — push-out so spawning inside still ejects correctly
          for (const isl of ISLANDS) {
            const dx = ship.position.x - isl.x, dz = ship.position.z - isl.z;
            const thresh = isl.radius + 6;
            const dist2 = dx*dx + dz*dz;
            if (dist2 < thresh*thresh) {
              const dist = Math.sqrt(dist2) || 0.001;
              ship.position.x = isl.x + dx / dist * thresh;
              ship.position.z = isl.z + dz / dist * thresh;
              shipSpeed *= -0.35;
            }
          }

          // Nearest island for UI label
          let closestName: string | null = null, closestDist2 = Infinity;
          for (const isl of ISLANDS) {
            const d2 = (ship.position.x - isl.x)**2 + (ship.position.z - isl.z)**2;
            if (d2 < closestDist2) { closestDist2 = d2; closestName = isl.name; }
          }

          shipPosRef.current = { x: ship.position.x, z: ship.position.z, angle: shipAngle };
          if (elapsed - lastPosSave > 5) {
            lastPosSave = elapsed;
            try { localStorage.setItem("shipPos", JSON.stringify(shipPosRef.current)); } catch {}
          }

          // Island fill lights — off in daylight, bright at night
          const fillInt = Math.max(0, (2.0 - cur.dirInt) * 2.0);
          for (const l of islandFillLights) l.intensity = fillInt;

          uiFrame++;
          if (playModeRef.current && uiFrame % 6 === 0) {
            setNearIsland(closestDist2 < 14400 ? closestName : null);
            setHeading(Math.round(((shipAngle * 180 / Math.PI) % 360 + 360) % 360));
            setSpeedPct(Math.round(Math.abs(shipSpeed) / shipStatsRef.current.maxSpeed * 100));
          }

          // Bob & rock
          {
            const rock  = cur.rockMult;
            const heave = Math.sin(elapsed*0.45)*0.55 + Math.sin(elapsed*0.73)*0.20 + Math.sin(elapsed*1.15)*0.08;
            ship.position.y = 0.2 + heave * Math.min(rock * 0.65, 2.2);
            shipModel.rotation.z = (Math.sin(elapsed*0.50)*0.055 + Math.sin(elapsed*0.27)*0.038 + Math.sin(elapsed*1.10)*0.020 + Math.sin(elapsed*1.90)*0.009) * rock;
            shipModel.rotation.x = (Math.sin(elapsed*0.40)*0.028 + Math.sin(elapsed*0.82)*0.012) * rock;
            ship.rotation.y = shipAngle + Math.sin(elapsed*0.33)*0.012 * rock;
          }
          if (flagMesh) flagMesh.rotation.y = Math.sin(elapsed * 3.5) * 0.5 * Math.max(0.6, cur.rockMult);

          // Camera
          const camH = 28 + shipSpeed * 0.35, camD = 52 + shipSpeed * 0.6;
          camPos.x += (ship.position.x - Math.sin(shipAngle) * camD - camPos.x) * 0.055;
          camPos.y += (camH - camPos.y) * 0.055;
          camPos.z += (ship.position.z - Math.cos(shipAngle) * camD - camPos.z) * 0.055;
          camera.position.copy(camPos);
          camera.lookAt(ship.position.x, ship.position.y + 5, ship.position.z);

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
        const onBeforeUnload = () => {
          try { localStorage.setItem("shipPos", JSON.stringify(shipPosRef.current)); } catch {}
        };
        window.addEventListener("beforeunload", onBeforeUnload);

        // Canvas drag / joystick
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
          touchKeysRef.current.delete("ArrowUp");
          touchKeysRef.current.delete("ArrowDown");
          setCanvasJoystick(null);
        };
        renderer.domElement.addEventListener("pointerdown",   onCanvasDown);
        renderer.domElement.addEventListener("pointermove",   onCanvasMove);
        renderer.domElement.addEventListener("pointerup",     onCanvasUp);
        renderer.domElement.addEventListener("pointercancel", onCanvasUp);

        if (alive) setLoaded(true);

        disposeAll = () => {
          cancelAnimationFrame(animId);
          window.removeEventListener("keydown",       onKeyDown);
          window.removeEventListener("keyup",         onKeyUp);
          window.removeEventListener("resize",        onResize);
          window.removeEventListener("beforeunload",  onBeforeUnload);
          renderer.domElement.removeEventListener("pointerdown",   onCanvasDown);
          renderer.domElement.removeEventListener("pointermove",   onCanvasMove);
          renderer.domElement.removeEventListener("pointerup",     onCanvasUp);
          renderer.domElement.removeEventListener("pointercancel", onCanvasUp);
          gltfCache.forEach((group) => {
            group.traverse((child) => {
              const m = child as T.Mesh;
              if (!m.isMesh) return;
              m.geometry?.dispose();
              if (Array.isArray(m.material)) (m.material as T.Material[]).forEach(mat => mat.dispose());
              else (m.material as T.Material)?.dispose();
            });
          });
          gltfCache.clear();
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

  return (
    <GameUI
      mountRef={mountRef}
      helmImgRef={helmImgRef}
      playMode={playMode}
      onExitPlay={onExitPlay}
      loaded={loaded}
      errMsg={errMsg}
      canvasJoystick={canvasJoystick}
      todUI={todUI}
      wxUI={wxUI}
      onSetTimeOfDay={setTimeOfDay}
      onSetWeather={setWeather}
      shipIdx={shipIdx}
      swapping={swapping}
      onShipPrev={onShipPrev}
      onShipNext={onShipNext}
      nearIsland={nearIsland}
      heading={heading}
      speedPct={speedPct}
      pressKey={pressKey}
      releaseKey={releaseKey}
      onHelmPointerDown={onHelmPointerDown}
      onHelmPointerMove={onHelmPointerMove}
      onHelmPointerUp={onHelmPointerUp}
    />
  );
}
