export type TimeOfDay = "day" | "sunset" | "night";
export type Weather   = "calm" | "windy" | "rainy";

export interface IslandDef {
  name: string; x: number; z: number; radius: number;
  type: "volcano"|"lighthouse"|"fort"|"ruins"|"jungle"|"port"|"rocks";
  glbOnly?: boolean;
}

export const WORLD_R    = 720;
export const RAIN_COUNT = 1800;

export const SHIPS = [
  { name: "Nave",        path: "/3d/nave_new.glb",                maxSpeed: 22, accel: 0.28, turnSpeed: 0.021, desc: "Balanced",      rotY: 0            },
  { name: "Marauder",    path: "/3d/brown_marauder.glb",          maxSpeed: 16, accel: 0.18, turnSpeed: 0.013, desc: "Slow & sturdy",  rotY: 0            },
  { name: "Corsair",     path: "/3d/The crimson corsair.glb",     maxSpeed: 28, accel: 0.36, turnSpeed: 0.030, desc: "Fast & fierce",  rotY: 0            },
  { name: "Fantasy",     path: "/3d/fantasy_sailing_ship.glb",    maxSpeed: 30, accel: 0.40, turnSpeed: 0.026, desc: "Swift",          rotY: 0            },
  { name: "Rogue",       path: "/3d/pirate.glb",                  maxSpeed: 21, accel: 0.25, turnSpeed: 0.029, desc: "Classic pirate", rotY: 0            },
  { name: "Freebooter",  path: "/3d/pirate_ii.glb",               maxSpeed: 23, accel: 0.27, turnSpeed: 0.025, desc: "Well-rounded",   rotY: 0            },
  { name: "Buccaneer",   path: "/3d/pirate_ii_variant_b.glb",     maxSpeed: 25, accel: 0.32, turnSpeed: 0.022, desc: "Battle-ready",   rotY: 0            },
  { name: "Specter",     path: "/3d/pirate_ship_lowpoly.glb",     maxSpeed: 27, accel: 0.38, turnSpeed: 0.033, desc: "Light & quick",  rotY: Math.PI / 2  },
  { name: "Sloop",       path: "/3d/pirate_ship_low_poly.glb",    maxSpeed: 26, accel: 0.35, turnSpeed: 0.036, desc: "Nimble sloop",   rotY: 0            },
  { name: "Black Raven", path: "/3d/black_raven_pirate_ship.glb", maxSpeed: 17, accel: 0.19, turnSpeed: 0.016, desc: "Dark & heavy",   rotY: Math.PI / 2  },
];

export const ISLANDS: IslandDef[] = [
  // ── inner ring ──────────────────────────────────────────────────────────────
  { name: "Puerto Fuego",     x:  200, z: -300, radius: 22, type: "port"                       },
  { name: "Isla Encantada",   x:  340, z:  110, radius: 40, type: "ruins"                      },
  { name: "Los Peñascos",     x: -370, z:  210, radius: 34, type: "rocks",       glbOnly: true },
  { name: "Fort Santiago",    x:  260, z:  -60, radius: 160, type: "fort"                      },
  { name: "Isla del Faro",    x: -130, z:  370, radius: 38, type: "lighthouse"                 },
  { name: "La Selva",         x:   60, z:  290, radius: 56, type: "jungle"                     },
  // ── outer ring ──────────────────────────────────────────────────────────────
  { name: "Las Ruinas",       x: -260, z:  520, radius: 22, type: "ruins"                      },
  { name: "Isla Serpiente",   x:  540, z: -420, radius: 42, type: "rocks"                      },
  { name: "El Castillo",      x: -460, z: -400, radius: 54, type: "fort"                       },
  { name: "El Galeón",        x:  320, z: -380, radius: 20, type: "rocks",       glbOnly: true },
  { name: "Faro del Norte",   x:  100, z: -580, radius: 42, type: "lighthouse"                 },
  { name: "La Jungla Verde",  x: -160, z:  630, radius: 62, type: "jungle"                     },
];

export const ISLAND_GLB: Record<string, { path: string; rotY: number; scale: number; yOffset?: number; smooth?: boolean; circular?: boolean }> = {
  "Fort Santiago":    { path: "/3d/fortress_island.glb",                rotY: 1.5,           scale: 2.0, yOffset:  -8 },
  "Puerto Fuego":     { path: "/3d/issum_the_town_on_capital_isle.glb", rotY: 0,             scale: 1.0, yOffset:  -8 },
  "Los Peñascos":     { path: "/3d/low_poly_island.glb",                rotY: 0,             scale: 2.0, yOffset:  -8, smooth: true, circular: true },
  "La Selva":         { path: "/3d/low_poly_medieval_island.glb",       rotY: 0,             scale: 2.0, yOffset:  -8 },
  "Isla del Faro":    { path: "/3d/the_mill.glb",                       rotY: 0,             scale: 0.5               },
  "El Galeón":        { path: "/3d/pirate_ship_rigged.glb",             rotY: Math.PI * 0.3, scale: 1.2               },
};

export const WEATHER_PRESETS = {
  calm:  { distMult: 1.0, speedMult: 1.0, fogMult: 1.0, rockMult: 1.0, rain: false },
  windy: { distMult: 1.5, speedMult: 1.4, fogMult: 1.2, rockMult: 1.8, rain: false },
  rainy: { distMult: 2.2, speedMult: 1.8, fogMult: 1.8, rockMult: 3.0, rain: true  },
} as const;
