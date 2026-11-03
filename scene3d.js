/* ─────────────────────────────────────────────────────────
   深蓝档案 · 3D formation sandbox
   Procedural low-poly reconstruction, built from public photos.
   ───────────────────────────────────────────────────────── */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const WORLD_SCALE = 0.18;
const MAP_BOUNDS = { minX: 45, maxX: 955, minY: 50, maxY: 572 };
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const GROUND_HIT = new THREE.Vector3();
const SHIP_SPECS = {
  "ship-carrier-ski": { L: 34, B: 8.2, H: 1.9 },
  "ship-carrier-cat": { L: 34, B: 8.2, H: 1.9 },
  "ship-055": { L: 18, B: 2.55, H: 1.3 },
  "ship-052d": { L: 15.7, B: 2.15, H: 1.15 },
  "ship-054a": { L: 13.4, B: 1.8, H: 1.0 },
  "ship-054b": { L: 14.7, B: 1.9, H: 1.05 },
  "ship-901": { L: 24, B: 3.7, H: 1.45 },
  "ship-075": { L: 23.7, B: 4.5, H: 2.0 },
  "ship-071": { L: 21, B: 3.15, H: 1.7 },
  "sub-093": { L: 11, B: 1.25, H: 0.9 },
  "sub-094": { L: 13.5, B: 1.4, H: 1.0 }
};

const state = {
  ready: false,
  active: false,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  canvas: null,
  labelsEl: null,
  container: null,
  shipsData: null,
  formations: null,
  onSelect: null,
  onMove: null,
  drag: null,
  shipGroups: {},
  hitboxes: [],
  activeIds: new Set(),
  selectedId: null,
  formationKey: null,
  cameraGoal: null,
  selectionRing: null,
  selectionBeacon: null,
  headingIndicator: null,
  sky: null,
  labels: new Map(),
  clock: null,
  ocean: null,
  autoRotate: true,
  quality: true,
  width: 0,
  height: 0,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  pointerDown: null,
  reduction: false
};

const MAT = {};
let sceneRoot = null;

/* ── texture helpers ─────────────────────────────────── */
function canvasTexture(canvas, srgb = true) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = state.renderer ? Math.min(8, state.renderer.capabilities.getMaxAnisotropy()) : 4;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function deckTexture(cat, number, kind = "carrier") {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 320;
  const ctx = c.getContext("2d");
  ctx.fillStyle = kind === "carrier" ? "#596b6e" : "#4b5e62";
  ctx.fillRect(0, 0, c.width, c.height);

  // surface grain
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(x, y, Math.random() * 18 + 3, 1);
  }

  // deck edge
  ctx.strokeStyle = "rgba(15,27,31,.9)";
  ctx.lineWidth = 18;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.strokeStyle = "rgba(194,214,216,.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, c.width - 40, c.height - 40);

  ctx.save();
  ctx.translate(0, 0);

  // landing strip
  ctx.strokeStyle = "rgba(238,216,164,.72)";
  ctx.lineWidth = 5;
  ctx.setLineDash([30, 20]);
  ctx.beginPath();
  ctx.moveTo(60, 172);
  ctx.lineTo(720, 278);
  ctx.stroke();
  ctx.strokeStyle = "rgba(232,210,157,.26)";
  ctx.beginPath();
  ctx.moveTo(66, 196);
  ctx.lineTo(734, 294);
  ctx.stroke();

  // runway centreline
  ctx.setLineDash([38, 24]);
  ctx.strokeStyle = "rgba(238,247,246,.62)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(170, 190);
  ctx.lineTo(940, 166);
  ctx.stroke();
  ctx.setLineDash([]);

  // elevators
  ctx.strokeStyle = "rgba(213,229,229,.34)";
  ctx.lineWidth = 3;
  ctx.strokeRect(150, 40, 100, 42);
  ctx.strokeRect(430, 34, 86, 34);
  ctx.strokeRect(780, 256, 86, 34);

  // catapult tracks
  if (cat) {
    ctx.strokeStyle = "rgba(238,210,151,.72)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(610, 104 + i * 44);
      ctx.lineTo(956, 128 + i * 32);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(111,227,232,.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(976, 80);
    ctx.lineTo(1006, 110);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(238,210,151,.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(992, 160, 170, Math.PI * .68, Math.PI * 1.3);
    ctx.stroke();
  }

  // tie-down dots
  ctx.fillStyle = "rgba(220,236,236,.4)";
  for (let x = 100; x < 960; x += 38) {
    for (let y = 46; y < 288; y += 38) {
      if (x > 390 && x < 570 && y > 206) continue;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // hull number
  if (number) {
    ctx.fillStyle = "rgba(236,244,243,.92)";
    ctx.font = "700 72px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(number, 878, 96);
    ctx.fillStyle = "rgba(236,244,243,.34)";
    ctx.font = "600 18px monospace";
    ctx.fillText("PLAN", 878, 122);
  }

  if (kind !== "carrier") {
    ctx.strokeStyle = "rgba(232,210,157,.4)";
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 16]);
    ctx.beginPath();
    ctx.moveTo(110, 160);
    ctx.lineTo(820, 160);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
  return canvasTexture(c);
}

function hullTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#8d9c9e";
  ctx.fillRect(0, 0, 512, 512);

  // large tonal patches
  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = `rgba(${Math.random() > .5 ? "30,45,49" : "205,216,215"},${Math.random() * .035})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 30 + Math.random() * 100, 20 + Math.random() * 90);
  }

  // panel seams
  ctx.strokeStyle = "rgba(35,51,55,.42)";
  ctx.lineWidth = 1;
  for (let x = 28; x < 512; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 64; y < 512; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(225,235,233,.16)";
  ctx.lineWidth = 2;
  for (let x = 30; x < 512; x += 88) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // rivet rows
  ctx.fillStyle = "rgba(30,44,47,.35)";
  for (let x = 40; x < 512; x += 44) {
    for (let y = 30; y < 512; y += 28) ctx.fillRect(x, y, 2, 2);
  }

  // rust streaks near the waterline
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 512;
    const y = 380 + Math.random() * 70;
    const g = ctx.createLinearGradient(x, y, x, y + 30 + Math.random() * 90);
    g.addColorStop(0, "rgba(117,72,43,.35)");
    g.addColorStop(1, "rgba(117,72,43,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = .6 + Math.random() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - .5) * 7, y + 30 + Math.random() * 90);
    ctx.stroke();
  }

  return canvasTexture(c);
}

function hullBumpTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#7d7d7d";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = 90 + Math.random() * 80;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  ctx.strokeStyle = "#5a5a5a";
  ctx.lineWidth = 1;
  for (let x = 14; x < 256; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 32; y < 256; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  return canvasTexture(c, false);
}

function hullNumberTexture(number) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 160);
  ctx.font = "700 112px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(24,37,41,.55)";
  ctx.strokeText(number, 128, 84);
  ctx.fillStyle = "rgba(232,241,239,.9)";
  ctx.fillText(number, 128, 84);
  return canvasTexture(c);
}

function vlsTexture(cols = 8, rows = 4) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1c292e";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "rgba(160,190,194,.35)";
  ctx.lineWidth = 1;
  const cw = c.width / cols;
  const ch = c.height / rows;
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cw, 0);
    ctx.lineTo(x * cw, c.height);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * ch);
    ctx.lineTo(c.width, y * ch);
    ctx.stroke();
  }
  return canvasTexture(c);
}

function wakeTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.filter = "blur(12px)";
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "rgba(210,244,245,.42)");
  grad.addColorStop(.32, "rgba(150,220,228,.18)");
  grad.addColorStop(.72, "rgba(110,190,200,.06)");
  grad.addColorStop(1, "rgba(100,180,190,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(128, 12);
  ctx.bezierCurveTo(176, 120, 196, 280, 214, 500);
  ctx.lineTo(42, 500);
  ctx.bezierCurveTo(60, 280, 80, 120, 128, 12);
  ctx.closePath();
  ctx.fill();
  ctx.filter = "blur(4px)";
  ctx.strokeStyle = "rgba(225,250,250,.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(104 + i * 12, 80);
    ctx.bezierCurveTo(110 + i * 20, 190, 72 + i * 26, 340, 50 + i * 34, 470);
    ctx.stroke();
  }
  return canvasTexture(c);
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
  grad.addColorStop(0, "rgba(0,0,0,.58)");
  grad.addColorStop(.55, "rgba(0,0,0,.28)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(c, false);
}

function foamTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, "rgba(235,255,255,.85)");
  grad.addColorStop(.35, "rgba(190,240,245,.38)");
  grad.addColorStop(1, "rgba(150,220,230,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return canvasTexture(c);
}

let TEX = null;

/* ── geometry helpers ────────────────────────────────── */
function hullGeometry(L, B, H) {
  const s = new THREE.Shape();
  s.moveTo(-L / 2, -B / 2);
  s.lineTo(L * 0.08, -B * 0.52);
  s.lineTo(L * 0.33, -B * 0.32);
  s.lineTo(L * 0.5, 0);
  s.lineTo(L * 0.33, B * 0.32);
  s.lineTo(L * 0.08, B * 0.52);
  s.lineTo(-L / 2, B * 0.5);
  s.lineTo(-L * 0.46, B * 0.32);
  s.lineTo(-L * 0.46, -B * 0.32);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: H,
    bevelEnabled: true,
    bevelSize: 0.12,
    bevelThickness: 0.1,
    bevelSegments: 2,
    steps: 1
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function carrierDeckShape(L, B) {
  const s = new THREE.Shape();
  s.moveTo(-L * 0.5, B * 0.33);
  s.lineTo(-L * 0.38, B * 0.55);
  s.lineTo(L * 0.1, B * 0.47);
  s.lineTo(L * 0.34, B * 0.3);
  s.lineTo(L * 0.5, 0);
  s.lineTo(L * 0.37, -B * 0.25);
  s.lineTo(L * 0.1, -B * 0.4);
  s.lineTo(-L * 0.3, -B * 0.4);
  s.lineTo(-L * 0.5, -B * 0.33);
  s.closePath();
  return s;
}

function lhdDeckShape(L, B) {
  const s = new THREE.Shape();
  s.moveTo(-L * 0.5, B * 0.42);
  s.lineTo(L * 0.42, B * 0.4);
  s.lineTo(L * 0.5, 0);
  s.lineTo(L * 0.42, -B * 0.4);
  s.lineTo(-L * 0.5, -B * 0.42);
  s.closePath();
  return s;
}

function box(w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function cylinder(r1, r2, h, x, y, z, mat, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

function deckOutline(shape, y, color = 0xa9bec1, opacity = 0.42) {
  const pts = shape.getPoints(80).map(p => new THREE.Vector3(p.x, y, -p.y));
  pts.push(pts[0].clone());
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthWrite: false
  }));
}

function addDeckTop(group, shape, y, texture) {
  const geo = new THREE.ShapeGeometry(shape, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xdce5e3,
    roughness: 0.8,
    metalness: 0.14,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    side: THREE.DoubleSide
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y;
  m.receiveShadow = false;
  group.add(m);
  return m;
}

function addHullEdges(group, mesh, color = 0x9bc7cc, opacity = 0.17) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 26),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
  );
  group.add(edges);
}

function addLine(group, points, y, color, opacity = .6, dashed = false) {
  const geo = new THREE.BufferGeometry().setFromPoints(
    points.map(([x, z]) => new THREE.Vector3(x, y, z))
  );
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: .7, gapSize: .5, depthWrite: false, depthTest: false })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false });
  const line = new THREE.Line(geo, mat);
  line.renderOrder = 6;
  if (dashed) line.computeLineDistances();
  group.add(line);
}

function addDeckNumber(group, number, L, B, y) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(244,250,248,.95)";
  ctx.font = "700 96px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, 128, 68);
  const tex = canvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.7),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(L * .34, y, -B * .16);
  mesh.renderOrder = 8;
  group.add(mesh);
}

function addDeckStrips(group, L, B, y, cat) {
  const white = new THREE.MeshBasicMaterial({ color: 0xf3f8f6, transparent: true, opacity: .82, depthTest: false, depthWrite: false });
  const gold = new THREE.MeshBasicMaterial({ color: 0xf2d79f, transparent: true, opacity: .86, depthTest: false, depthWrite: false });
  // broken runway centreline
  for (let i = 0; i < 7; i++) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.55, .022, .16), white);
    dash.position.set(-L * .3 + i * 2.45, y, 0);
    dash.renderOrder = 7;
    group.add(dash);
  }
  // angled landing strip
  const landing = new THREE.Mesh(
    new THREE.PlaneGeometry(L * .5, .95),
    new THREE.MeshBasicMaterial({ color: 0x13262b, transparent: true, opacity: .7, depthTest: false, depthWrite: false, side: THREE.DoubleSide })
  );
  landing.rotation.x = -Math.PI / 2;
  landing.rotation.z = -.17;
  landing.position.set(-L * .05, y - .008, B * .04);
  landing.renderOrder = 5;
  group.add(landing);
  [-.47, .47].forEach(offset => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(L * .5, .018, .12), gold);
    edge.position.set(-L * .05, y + .006, B * .04 + offset);
    edge.rotation.y = -.17;
    edge.renderOrder = 7;
    group.add(edge);
  });
  if (cat) {
    [-B * .18, 0, B * .18].forEach(z => {
      const track = new THREE.Mesh(new THREE.BoxGeometry(7.2, .015, .08), gold);
      track.position.set(L * .27, y + .01, z);
      track.rotation.y = z * .006;
      track.renderOrder = 7;
      group.add(track);
    });
  } else {
    const rampEdge = new THREE.Mesh(new THREE.BoxGeometry(3.2, .015, .08), gold);
    rampEdge.position.set(L * .42, y + .08, -B * .2);
    rampEdge.rotation.z = .18;
    rampEdge.renderOrder = 7;
    group.add(rampEdge);
  }
}

function addHullNumber(group, ship, L, B, height = 1.1) {
  const match = ship.code.match(/(\d+)$/);
  if (!match) return;
  const number = match[1].replace(/^0+/, "") || match[1];
  const texture = hullNumberTexture(number);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    roughness: .5,
    metalness: .1,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), mat);
  plane.position.set(L * .28, height, B * .44);
  plane.renderOrder = 6;
  group.add(plane);
}

function addDeckRail(group, shape, y) {
  const pts = shape.getPoints(64).map(p => new THREE.Vector3(p.x, y, -p.y));
  pts.push(pts[0].clone());
  const rail = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xb6c9ca, transparent: true, opacity: .34, depthWrite: false })
  );
  rail.renderOrder = 5;
  group.add(rail);

  const posts = [];
  for (let i = 0; i < pts.length - 1; i += 3) {
    const p = pts[i];
    posts.push(p.x, y, p.z, p.x, y - .3, p.z);
  }
  const postLine = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(posts, 3)),
    new THREE.LineBasicMaterial({ color: 0xb6c9ca, transparent: true, opacity: .22, depthWrite: false })
  );
  postLine.renderOrder = 5;
  group.add(postLine);
}

function addEscortRails(group, L, B, H) {
  const mat = new THREE.LineBasicMaterial({ color: 0xa9bdbe, transparent: true, opacity: .25, depthWrite: false });
  [-1, 1].forEach(side => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-L * .34, H + .26, side * B * .42),
        new THREE.Vector3(L * .36, H + .26, side * B * .42)
      ]),
      mat
    );
    line.renderOrder = 5;
    group.add(line);
  });
}

function addAntenna(group, x, y, z, height, mat = MAT.mast) {
  const mast = cylinder(.025, .04, height, x, y + height / 2, z, mat, 5);
  group.add(mast);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 6), MAT.navRed);
  tip.position.set(x, y + height, z);
  group.add(tip);
}

function addDeckDetails(group, L, B, y) {
  const crewMats = [
    new THREE.MeshBasicMaterial({ color: 0xe6c56f }),
    new THREE.MeshBasicMaterial({ color: 0xdbe7e5 }),
    new THREE.MeshBasicMaterial({ color: 0x7fc2c8 })
  ];
  const positions = [
    [-L * .18, B * .15], [-L * .12, B * .2], [-L * .05, B * .25],
    [L * .02, B * .22], [L * .1, B * .16], [L * .16, B * .08],
    [-L * .03, -B * .16], [L * .08, -B * .2]
  ];
  positions.forEach(([x, z], index) => {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .16, 2, 5), crewMats[index % crewMats.length]);
    body.position.set(x, y + .12, z);
    group.add(body);
  });
  // deck tractors
  const tractorMat = new THREE.MeshStandardMaterial({ color: 0xc9aa61, roughness: .55, metalness: .15 });
  [[-L * .06, -B * .1], [L * .12, B * .03]].forEach(([x, z]) => {
    const tractor = new THREE.Group();
    tractor.add(box(.55, .18, .3, 0, .09, 0, tractorMat));
    tractor.add(box(.22, .16, .24, .12, .2, 0, MAT.glass));
    tractor.position.set(x, y + .04, z);
    group.add(tractor);
  });
}

function addCarrierMarkings(group, L, B, y, cat) {
  addLine(group, [[-L * .4, 0], [L * .44, 0]], y, 0xe8f2f0, .48, true);
  addLine(group, [[-L * .43, B * .28], [L * .03, -B * .32]], y, 0xe7cf9d, .58, true);
  addLine(group, [[-L * .41, B * .19], [L * .02, -B * .39]], y, 0xe7cf9d, .32, true);
  addLine(group, [[-L * .39, B * .28], [-L * .39, B * .4]], y, 0xe8f2f0, .35);
  addLine(group, [[L * .18, B * .28], [L * .18, B * .4]], y, 0xe8f2f0, .35);
  if (cat) {
    [-B * .18, 0, B * .18].forEach(z => {
      addLine(group, [[L * .06, z], [L * .42, z * .72]], y, 0xf1d9a5, .6, true);
    });
  } else {
    addLine(group, [[L * .31, -B * .23], [L * .46, 0], [L * .31, B * .23]], y, 0xd0b681, .6);
  }
  // elevators
  addLine(group, [[-L * .36, -B * .28], [-L * .24, -B * .28], [-L * .24, -B * .42], [-L * .36, -B * .42], [-L * .36, -B * .28]], y, 0xc7d8da, .3);
  addLine(group, [[L * .03, -B * .32], [L * .16, -B * .32], [L * .16, -B * .42], [L * .03, -B * .42], [L * .03, -B * .32]], y, 0xc7d8da, .3);
}

/* ── models ──────────────────────────────────────────── */
function addShadow(group, L, B, opacity = .42) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(L * 1.02, B * 1.55),
    new THREE.MeshBasicMaterial({ map: TEX.shadow, transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  m.renderOrder = 1;
  group.add(m);
}

function addWake(group, L, B, opacity = .32) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(L * 0.96, B * 1.8),
    new THREE.MeshBasicMaterial({
      map: TEX.wake,
      transparent: true,
      opacity: Math.min(.72, opacity + .2),
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(-L * 0.66, 0.92, 0);
  m.renderOrder = 4;
  group.add(m);
  group.userData.wake = m;

  const wakeLineMat = new THREE.LineBasicMaterial({
    color: 0xc4edf0, transparent: true, opacity: .28,
    depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
  });
  group.userData.wakeLines = [];
  [-1, 1].forEach(side => {
    const pts = [
      new THREE.Vector3(-L * .43, 1.02, side * B * .2),
      new THREE.Vector3(-L * .78, 1.02, side * B * .48),
      new THREE.Vector3(-L * 1.18, 1.02, side * B * .72)
    ];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wakeLineMat);
    line.renderOrder = 5;
    group.add(line);
    group.userData.wakeLines.push(line);
  });

  const foam = new THREE.Mesh(
    new THREE.CircleGeometry(B * 0.42, 20),
    new THREE.MeshBasicMaterial({
      map: TEX.foam,
      transparent: true,
      opacity: .28,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(L * 0.53, 0.92, 0);
  foam.renderOrder = 5;
  group.add(foam);
  group.userData.bowFoam = foam;
}

function addLandingStrip(group, L, B, y) {
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(L * .54, B * .21),
    new THREE.MeshBasicMaterial({ color: 0x1d2e33, transparent: true, opacity: .66, depthWrite: false, side: THREE.DoubleSide })
  );
  strip.rotation.x = -Math.PI / 2;
  strip.rotation.z = -.17;
  strip.position.set(-L * .04, y, B * .04);
  strip.renderOrder = 3;
  group.add(strip);
}

function createAircraft(scale = 1, heli = false) {
  const g = new THREE.Group();
  if (heli) {
    const body = box(1.25, .28, .34, 0, .15, 0, MAT.white);
    body.geometry = new THREE.CapsuleGeometry(.16, .9, 3, 6);
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const rotor = new THREE.Mesh(new THREE.CircleGeometry(.95, 20), MAT.rotor);
    rotor.rotation.x = -Math.PI / 2;
    rotor.position.y = .48;
    g.add(rotor);
    g.add(box(.08, .42, .08, 0, .28, 0, MAT.dark));
    g.add(box(.05, .05, 1.1, 0, .45, 0, MAT.dark));
  } else {
    g.add(box(1.45, .18, .26, .02, .18, 0, MAT.white));
    const wing = new THREE.Mesh(new THREE.BoxGeometry(.42, .045, 1.55), MAT.white);
    wing.position.set(-.06, .18, 0);
    g.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(.28, .04, .62), MAT.white);
    tail.position.set(-.58, .2, 0);
    g.add(tail);
    g.add(box(.13, .34, .04, -.06, .31, 0, MAT.white));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.11, .35, 6), MAT.white);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(.86, .18, 0);
    g.add(nose);
  }
  g.scale.setScalar(scale);
  return g;
}

function createCarrier(ship) {
  const spec = SHIP_SPECS[ship.art] || SHIP_SPECS["ship-carrier-ski"];
  const { L, B } = spec;
  const cat = ship.art === "ship-carrier-cat";
  const number = (ship.code.match(/\d+/) || ["18"])[0];
  const g = new THREE.Group();
  const hull = new THREE.Mesh(hullGeometry(L, B, 1.9), MAT.hull);
  g.add(hull);
  addHullEdges(g, hull);
  const waterline = box(L * .7, .09, B + .02, 0, .36, 0, MAT.red);
  g.add(waterline);

  const shape = carrierDeckShape(L, B);
  const deckBase = new THREE.ExtrudeGeometry(shape, {
    depth: .34, bevelEnabled: true, bevelSize: .12, bevelThickness: .06, bevelSegments: 2
  });
  deckBase.rotateX(-Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckBase, MAT.deckSide);
  deckMesh.position.y = 1.88;
  g.add(deckMesh);

  addDeckTop(g, shape, 2.26, deckTexture(cat, number));
  g.add(deckOutline(shape, 2.27));
  addLandingStrip(g, L, B, 2.29);
  addDeckStrips(g, L, B, 2.31, cat);
  addDeckNumber(g, number, L, B, 2.34);
  addCarrierMarkings(g, L, B, 2.52, cat);

  // island
  const island = new THREE.Group();
  island.position.set(-L * 0.04, 2.3, B * 0.33);
  island.add(box(3.5, 1.35, 1.15, 0, .68, 0, MAT.hullDark));
  island.add(box(2.8, .62, 1.0, -.05, 1.55, 0, MAT.hull));
  island.add(box(2.0, .4, .84, .15, 1.95, 0, MAT.hullDark));
  island.add(box(1.6, .18, .7, .05, 2.1, 0, MAT.glass));
  island.add(cylinder(.06, .1, 2.7, -.15, 3.3, 0, MAT.mast, 6));
  island.add(box(1.1, .12, .55, -.15, 4.25, 0, MAT.radar));
  island.add(box(.15, .95, .12, .5, 2.5, 0, MAT.mast));
  island.add(box(.9, .06, .06, .5, 2.95, 0, MAT.glass));
  g.add(island);

  // aircraft
  const planePositions = cat
    ? [[-10, -2.5], [-6.5, -2.7], [-2.8, -2.7], [7.8, -2.0], [10.8, -1.7], [-11.2, 2.1]]
    : [[-11, -2.4], [-7.4, -2.5], [-3.8, -2.5], [7.5, -2.0], [10.5, -1.6]];
  planePositions.forEach(([x, z], index) => {
    const a = createAircraft(1.32, false);
    a.position.set(x, 2.33, z);
    a.rotation.y = index % 2 ? .12 : -.06;
    g.add(a);
  });

  if (!cat) {
    // ski-jump ramp profile
    const ramp = new THREE.Shape();
    ramp.moveTo(0, 0);
    ramp.quadraticCurveTo(2.6, .12, 4.3, 1.5);
    ramp.lineTo(4.3, 1.72);
    ramp.lineTo(0, .35);
    ramp.closePath();
    const rampGeo = new THREE.ExtrudeGeometry(ramp, { depth: B * 0.7, bevelEnabled: false });
    rampGeo.translate(0, 0, -B * 0.35);
    const rampMesh = new THREE.Mesh(rampGeo, MAT.deckSide);
    rampMesh.position.set(L / 2 - 4.25, 2.24, 0);
    g.add(rampMesh);
    const edgeGeo = new THREE.EdgesGeometry(rampGeo);
    const edges = new THREE.LineSegments(edgeGeo, MAT.edge);
    edges.position.copy(rampMesh.position);
    g.add(edges);
  } else {
    // flat bow edge marks
    g.add(box(2.4, .05, 4.8, L * .4, 2.3, 0, MAT.gold));
  }

  addHullNumber(g, ship, L, B, 1.2);
  addDeckRail(g, shape, 2.62);
  addDeckDetails(g, L, B, 2.33);
  addAntenna(g, -2.1, 3.1, B * .33, 1.6);
  addAntenna(g, 1.9, 3.0, B * .33, 1.1);

  // hull seams / scuppers
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x46575a, roughness: .8, metalness: .1 });
  [-.55, .15, .75].forEach(y => {
    const seam = box(L * .62, .035, .025, 0, 1.0 + y * .45, B * .505, seamMat);
    g.add(seam);
  });

  // hangar openings and deck edge lights
  const hangarMat = new THREE.MeshStandardMaterial({ color: 0x17272c, roughness: .9, metalness: .05 });
  [[-7, 3.8], [-1.5, 3.2]].forEach(([x, width]) => {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.35), hangarMat);
    door.position.set(x, 1.25, B * .505);
    door.renderOrder = 6;
    g.add(door);
  });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xd9c28d });
  for (let i = 0; i < 8; i++) {
    const p = shape.getPoint(i / 8);
    const light = new THREE.Mesh(new THREE.SphereGeometry(.055, 5, 5), lightMat);
    light.position.set(p.x, 2.58, -p.y);
    g.add(light);
  }

  // nav lights
  const red = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 6), MAT.navRed);
  red.position.set(L * .34, 2.45, -B * .28);
  g.add(red);
  const green = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 6), MAT.navGreen);
  green.position.set(L * .34, 2.45, B * .28);
  g.add(green);

  addShadow(g, L, B, .12);
  addWake(g, L, B, .44);
  return { group: g, L, B, hitHeight: 8 };
}

function createEscort(ship) {
  const cfg = SHIP_SPECS[ship.art] || SHIP_SPECS["ship-055"];
  const { L, B, H } = cfg;
  const g = new THREE.Group();
  const hull = new THREE.Mesh(hullGeometry(L, B, H), MAT.hull);
  g.add(hull);
  addHullEdges(g, hull);
  g.add(box(L * .84, .09, B + .035, 0, .32, 0, MAT.red));

  // deck edge
  g.add(box(L * .7, .08, B * .9, 0, H + .02, 0, MAT.deckSide));

  // main deckhouse
  const d1 = L * (ship.art === "ship-901" ? .28 : .31);
  g.add(box(d1, H * .95, B * .76, -L * .02, H + H * .48, 0, MAT.hullDark));
  g.add(box(d1 * .72, H * .55, B * .61, L * .06, H + H * 1.02, 0, MAT.hull));
  g.add(box(d1 * .5, H * .3, B * .42, L * .11, H + H * 1.42, 0, MAT.hullDark));
  g.add(box(d1 * .6, .1, B * .45, L * .06, H + H * 1.2, 0, MAT.glass));
  g.add(box(d1 * .44, .07, B * .34, L * .1, H + H * 1.58, 0, MAT.glass));

  const mastX = L * .03;
  g.add(cylinder(.055, .09, H * 2.5, mastX, H + H * 2.4, 0, MAT.mast, 6));
  g.add(box(.95, .08, .42, mastX, H + H * 2.95, 0, MAT.radar));

  // VLS
  const vlsW = L * .18;
  const vls = new THREE.Mesh(
    new THREE.PlaneGeometry(vlsW, B * .5),
    new THREE.MeshStandardMaterial({ map: TEX.vls, roughness: .8, metalness: .2 })
  );
  vls.rotation.x = -Math.PI / 2;
  vls.position.set(L * .24, H + .035, 0);
  g.add(vls);

  // gun
  const gun = new THREE.Group();
  gun.position.set(L * .4, H + .16, 0);
  const turret = box(.72, .32, .62, 0, .15, 0, MAT.hullDark);
  turret.geometry = new THREE.CylinderGeometry(.36, .45, .28, 8);
  gun.add(turret);
  const barrel = cylinder(.035, .05, 1.25, .55, .17, 0, MAT.mast, 6);
  barrel.rotation.z = Math.PI / 2;
  gun.add(barrel);
  g.add(gun);

  // CIWS
  g.add(box(.38, .26, .34, -L * .24, H + .2, 0, MAT.hullDark));
  // helipad
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(B * .24, B * .31, 24),
    new THREE.MeshBasicMaterial({ color: 0xc9dbdc, transparent: true, opacity: .5, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(-L * .32, H + .04, 0);
  g.add(pad);

  addHullNumber(g, ship, L, B, H * .82);
  addEscortRails(g, L, B, H);
  addAntenna(g, L * .02, H + H * 2.85, 0, .8);
  addAntenna(g, -L * .12, H + H * 1.25, 0, 1.0);

  // nav lights
  const red = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 6), MAT.navRed);
  red.position.set(L * .3, H + .1, -B * .42);
  g.add(red);
  const green = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 6), MAT.navGreen);
  green.position.set(L * .3, H + .1, B * .42);
  g.add(green);

  addShadow(g, L, B, .1);
  addWake(g, L, B, .4);
  return { group: g, L, B, hitHeight: 5 };
}

function create901(ship) {
  const cfg = SHIP_SPECS["ship-901"];
  const { L, B, H } = cfg;
  const g = new THREE.Group();
  const hull = new THREE.Mesh(hullGeometry(L, B, H), MAT.hull);
  g.add(hull);
  addHullEdges(g, hull);
  g.add(box(L * .82, .08, B + .035, 0, .34, 0, MAT.red));
  g.add(box(L * .8, .07, B * .9, 0, H + .02, 0, MAT.deckSide));

  // forward and aft deckhouses
  g.add(box(L * .19, H * 1.25, B * .74, L * .12, H + H * .62, 0, MAT.hullDark));
  g.add(box(L * .13, H * .65, B * .52, L * .17, H + H * 1.45, 0, MAT.hull));
  g.add(box(L * .14, .1, B * .42, L * .17, H + H * 1.68, 0, MAT.glass));
  g.add(cylinder(.06, .1, H * 2.8, L * .12, H + H * 2.5, 0, MAT.mast, 6));
  g.add(box(1.1, .1, .5, L * .12, H + H * 3.1, 0, MAT.radar));

  g.add(box(L * .2, H * 1.05, B * .8, -L * .2, H + H * .52, 0, MAT.hullDark));
  g.add(box(L * .12, H * .58, B * .55, -L * .22, H + H * 1.25, 0, MAT.hull));
  g.add(cylinder(.05, .09, H * 2.2, -L * .22, H + H * 2.1, 0, MAT.mast, 6));
  g.add(box(.8, .08, .38, -L * .22, H + H * 2.55, 0, MAT.radar));

  // cranes / kingposts
  [-L * .05, L * .32].forEach(x => {
    const post = cylinder(.07, .09, H * 1.7, x, H + H * .85, 0, MAT.gold, 6);
    g.add(post);
    const boom = box(3.1, .09, .09, x + 1.25, H + H * 1.6, 0, MAT.gold);
    boom.rotation.z = -.16;
    g.add(boom);
  });

  // side replenishment stations
  [-1, 1].forEach(side => {
    g.add(box(1.6, .16, .16, -L * .05, H + .38, side * (B * .5), MAT.gold));
  });

  // helipad
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(B * .27, B * .33, 28),
    new THREE.MeshBasicMaterial({ color: 0xd5e5e5, transparent: true, opacity: .55, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(-L * .4, H + .04, 0);
  g.add(pad);

  addHullNumber(g, ship, L, B, 1.0);
  addEscortRails(g, L, B, H);

  addShadow(g, L, B, .12);
  addWake(g, L, B, .46);
  return { group: g, L, B, hitHeight: 6 };
}

function createLHD(ship) {
  const cfg = SHIP_SPECS["ship-075"];
  const { L, B } = cfg;
  const g = new THREE.Group();
  const hull = new THREE.Mesh(hullGeometry(L, B, 2.1), MAT.hull);
  g.add(hull);
  addHullEdges(g, hull);
  g.add(box(L * .82, .1, B + .04, 0, .4, 0, MAT.red));
  const shape = lhdDeckShape(L, B);
  const deckBase = new THREE.ExtrudeGeometry(shape, {
    depth: .35, bevelEnabled: true, bevelSize: .1, bevelThickness: .06, bevelSegments: 2
  });
  deckBase.rotateX(-Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckBase, MAT.deckSide);
  deckMesh.position.y = 2.05;
  g.add(deckMesh);
  addDeckTop(g, shape, 2.42, deckTexture(false, "31", "lhd"));
  g.add(deckOutline(shape, 2.43));
  addLine(g, [[-L * .4, 0], [L * .42, 0]], 2.7, 0xe8f2f0, .42, true);

  // island to starboard
  const island = new THREE.Group();
  island.position.set(-L * .1, 2.45, B * .32);
  island.add(box(3.0, 1.3, 1.15, 0, .65, 0, MAT.hullDark));
  island.add(box(2.3, .55, .9, -.05, 1.5, 0, MAT.hull));
  island.add(box(1.7, .3, .7, .05, 1.9, 0, MAT.hullDark));
  island.add(box(1.1, .12, .5, .05, 2.05, 0, MAT.glass));
  island.add(cylinder(.05, .08, 1.9, -.1, 2.95, 0, MAT.mast, 6));
  g.add(island);

  [[-8, 0], [-3, 0], [2.5, 0]].forEach(([x, z]) => {
    const h = createAircraft(1.25, true);
    h.position.set(x, 2.48, z);
    g.add(h);
  });

  addHullNumber(g, ship, L, B, 1.45);
  addDeckRail(g, shape, 2.78);
  addAntenna(g, -2.4, 3.3, B * .32, 1.4);

  addShadow(g, L, B, .12);
  addWake(g, L, B, .46);
  return { group: g, L, B, hitHeight: 7 };
}

function create071(ship) {
  const cfg = SHIP_SPECS["ship-071"];
  const { L, B, H } = cfg;
  const g = new THREE.Group();
  const hull = new THREE.Mesh(hullGeometry(L, B, H), MAT.hull);
  g.add(hull);
  addHullEdges(g, hull);
  g.add(box(L * .82, .08, B + .03, 0, .32, 0, MAT.red));
  g.add(box(L * .78, .07, B * .9, 0, H + .02, 0, MAT.deckSide));

  // forward superstructure
  g.add(box(L * .28, H * 1.2, B * .8, L * .12, H + H * .6, 0, MAT.hullDark));
  g.add(box(L * .2, H * .6, B * .6, L * .16, H + H * 1.42, 0, MAT.hull));
  g.add(box(L * .16, .1, B * .48, L * .16, H + H * 1.65, 0, MAT.glass));
  g.add(cylinder(.06, .09, H * 2.3, L * .12, H + H * 2.2, 0, MAT.mast, 6));
  g.add(box(.9, .08, .4, L * .12, H + H * 2.65, 0, MAT.radar));

  // aft deckhouse / well deck edge
  g.add(box(L * .24, H * .8, B * .72, -L * .22, H + H * .4, 0, MAT.hullDark));
  g.add(box(L * .12, .08, B * .5, -L * .3, H + .03, 0, MAT.deckSide));

  // helipad
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(B * .25, B * .32, 28),
    new THREE.MeshBasicMaterial({ color: 0xd5e5e5, transparent: true, opacity: .55, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(-L * .36, H + .04, 0);
  g.add(pad);

  const h = createAircraft(1.2, true);
  h.position.set(-L * .36, H + .1, 0);
  g.add(h);

  addHullNumber(g, ship, L, B, 1.0);
  addEscortRails(g, L, B, H);

  addShadow(g, L, B, .1);
  addWake(g, L, B, .4);
  return { group: g, L, B, hitHeight: 6 };
}

function createSub(ship) {
  const cfg = SHIP_SPECS[ship.art];
  const { L, B } = cfg;
  const g = new THREE.Group();
  const r = B * .5;
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .8, L, 16), MAT.subHull);
  hull.rotation.z = Math.PI / 2;
  hull.position.y = r * .82;
  g.add(hull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(r, 2.0, 16), MAT.subHull);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(L / 2 + .85, r * .82, 0);
  g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(r * .8, 2.2, 12), MAT.subHull);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-L / 2 - .95, r * .82, 0);
  g.add(tail);
  // sail
  const sail = box(2.6, 1.35, .8, .3, r * 1.7 + .62, 0, MAT.subHull);
  g.add(sail);
  g.add(box(1.8, .22, .55, .3, r * 1.7 + 1.33, 0, MAT.glass));
  // masts / periscopes
  g.add(cylinder(.035, .045, 1.6, .1, r * 1.7 + 2.0, 0, MAT.mast, 6));
  g.add(cylinder(.03, .04, 1.15, -.45, r * 1.7 + 1.8, 0, MAT.mast, 6));
  // dive planes
  g.add(box(2.0, .08, 3.1, L * .27, r * .82, 0, MAT.subHull));
  g.add(box(1.4, .07, 2.2, -L * .32, r * .82, 0, MAT.subHull));
  // cyan ID strip
  const strip = box(L * .38, .04, .04, 0, r * 1.34, r * .98, MAT.cyan);
  g.add(strip);
  const strip2 = strip.clone();
  strip2.position.z = -r * .98;
  g.add(strip2);

  addShadow(g, L, B * 1.4, .08);
  addWake(g, L, B * 2.2, .3);
  return { group: g, L, B: B * 1.5, hitHeight: 4 };
}

function buildShip(ship) {
  if (ship.art === "ship-carrier-ski" || ship.art === "ship-carrier-cat") return createCarrier(ship);
  if (ship.art === "ship-075") return createLHD(ship);
  if (ship.art === "ship-071") return create071(ship);
  if (ship.art === "ship-901") return create901(ship);
  if (ship.art === "sub-093" || ship.art === "sub-094") return createSub(ship);
  return createEscort(ship);
}

/* ── scene ───────────────────────────────────────────── */
function createSky() {
  const geo = new THREE.SphereGeometry(720, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x02070d) },
      uHorizon: { value: new THREE.Color(0x0b2a33) },
      uGlow: { value: new THREE.Color(0x2f5d61) }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uGlow;
      varying vec3 vWorld;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = dir.y;
        vec3 col = mix(uHorizon, uTop, smoothstep(-0.08, 0.62, h));
        float horizon = exp(-pow((h - 0.015) * 9.0, 2.0));
        col += uGlow * horizon * 0.25;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  return new THREE.Mesh(geo, mat);
}

function createOcean() {
  const geo = new THREE.PlaneGeometry(1800, 1800, 150, 150);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x08252f) },
      uMid: { value: new THREE.Color(0x124a56) },
      uLight: { value: new THREE.Color(0x62a7ae) }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      varying float vWave;
      varying vec3 vNormal;
      void main() {
        vec3 p = position;
        float wave = sin(p.x * .045 + uTime * .55) * .35
             + cos(p.z * .055 + uTime * .42) * .28
             + sin((p.x + p.z) * .018 + uTime * .22) * .22;
        p.y += wave;
        float dx = cos(p.x * .045 + uTime * .55) * .045 * .35
                 + cos((p.x + p.z) * .018 + uTime * .22) * .018 * .22;
        float dz = -sin(p.z * .055 + uTime * .42) * .055 * .28
                 + cos((p.x + p.z) * .018 + uTime * .22) * .018 * .22;
        vNormal = normalize(vec3(-dx, 1.0, -dz));
        vWave = wave;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uMid;
      uniform vec3 uLight;
      varying vec3 vWorld;
      varying float vWave;
      varying vec3 vNormal;
      void main() {
        float d = distance(vWorld.xz, cameraPosition.xz);
        vec3 col = mix(uMid, uDeep, smoothstep(25.0, 320.0, d));
        float band = smoothstep(.72, 1.0, sin(vWorld.x * .09 + vWorld.z * .055 + uTime * .55) * .5 + .5);
        col += uLight * band * .06;
        col += uLight * max(vWave, 0.0) * .09;
        col -= uDeep * max(-vWave, 0.0) * .06;
        float gridX = smoothstep(.48, .5, abs(fract((vWorld.x + uTime * 5.0) / 22.0) - .5));
        float gridZ = smoothstep(.48, .5, abs(fract((vWorld.z - uTime * 1.4) / 22.0) - .5));
        float grid = max(gridX, gridZ);
        col += vec3(.12, .42, .46) * grid * .045;
        float crest = smoothstep(.25, .95, vWave);
        col += uLight * crest * .055;
        float streak = smoothstep(.82, 1.0, sin(vWorld.x * .18 + vWorld.z * .07 - uTime * 1.6) * .5 + .5);
        col += vec3(.4, .62, .64) * streak * .05;
        float glint = pow(max(sin(vWorld.x * .025 + vWorld.z * .036 + uTime * .4), 0.0), 32.0);
        col += vec3(.55, .45, .28) * glint * .018;
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(cameraPosition - vWorld);
        vec3 sunDir = normalize(vec3(-.5, .12, -.84));
        float spec = pow(max(dot(normal, normalize(viewDir + sunDir)), 0.0), 80.0);
        col += vec3(1.0, .8, .52) * spec * .34;
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
        col = mix(col, vec3(.11, .26, .32), clamp(fresnel * .6, 0.0, .38));
        float fog = smoothstep(180.0, 800.0, d);
        col = mix(col, vec3(.025, .07, .085), fog);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;
  return mesh;
}

function buildScene() {
  const scene = state.scene;
  const sky = createSky();
  state.sky = sky;
  scene.add(sky);

  const env = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(state.renderer);
  state.scene.environment = pmrem.fromScene(env, 0.04).texture;
  state.scene.environmentIntensity = 0.34;

  const hemi = new THREE.HemisphereLight(0x83c4cf, 0x03080b, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2c2, 3.0);
  sun.position.set(-90, 70, -110);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x4fa4b4, 1.1);
  fill.position.set(90, 40, 80);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x274e57, .45));

  state.ocean = createOcean();
  scene.add(state.ocean);

  // faint tactical range rings
  const rings = new THREE.Group();
  [24, 46, 70].forEach(radius => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, .065, Math.sin(a) * radius));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x6fe3e8, transparent: true, opacity: .09, depthWrite: false })
    );
    rings.add(line);
  });
  scene.add(rings);

  // selection ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.06, 64),
    new THREE.MeshBasicMaterial({
      color: 0x5cd5df, transparent: true, opacity: .22,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .2;
  ring.visible = false;
  state.scene.add(ring);
  state.selectionRing = ring;

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(.035, .035, 9, 6),
    new THREE.MeshBasicMaterial({
      color: 0x6fe3e8, transparent: true, opacity: .15,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  beacon.position.y = 4.5;
  beacon.visible = false;
  state.scene.add(beacon);
  state.selectionBeacon = beacon;

  const heading = new THREE.Group();
  const headingGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 4.5, 0),
    new THREE.Vector3(11, 4.5, 0)
  ]);
  const headingLine = new THREE.Line(headingGeo, new THREE.LineBasicMaterial({
    color: 0xc7a76a, transparent: true, opacity: .58, depthTest: false, depthWrite: false
  }));
  headingLine.renderOrder = 9;
  heading.add(headingLine);
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(.38, 1.1, 6),
    new THREE.MeshBasicMaterial({ color: 0xe0c488, transparent: true, opacity: .72, depthTest: false, depthWrite: false })
  );
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(11.6, 4.5, 0);
  arrow.renderOrder = 9;
  heading.add(arrow);
  heading.visible = false;
  state.scene.add(heading);
  state.headingIndicator = heading;

  // ships
  Object.entries(state.shipsData).forEach(([id, ship]) => {
    const built = buildShip(ship);
    const group = built.group;
    if (state.quality) {
      group.traverse(object => {
        if (!object.isMesh) return;
        const transparent = object.material && object.material.transparent;
        object.castShadow = !transparent;
        object.receiveShadow = !transparent;
      });
    }
    group.userData = {
      ...group.userData,
      id,
      length: built.L,
      beam: built.B,
      hitHeight: built.hitHeight,
      phase: Math.random() * Math.PI * 2,
      target: new THREE.Vector3(),
      targetRot: 0,
      spawn: 0
    };
    group.visible = false;
    state.scene.add(group);
    state.shipGroups[id] = group;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(built.L * 1.05, built.hitHeight, built.B * 1.8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.y = built.hitHeight * .45;
    hit.userData.shipId = id;
    hit.castShadow = false;
    hit.receiveShadow = false;
    group.add(hit);
    state.hitboxes.push(hit);
  });
}

/* ── formation and camera ────────────────────────────── */
function worldPos(entry) {
  return new THREE.Vector3(
    (entry.x - 500) * WORLD_SCALE,
    0,
    (entry.y - 310) * WORLD_SCALE
  );
}

function fitCamera(points, immediate = false) {
  if (!state.camera || !state.controls) return;
  const box = new THREE.Box3().setFromPoints(points);
  const center = box.getCenter(new THREE.Vector3());
  center.y = 4.0;
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z, 54);
  const aspectBoost = state.camera.aspect < 1 ? 1.22 : 1;
  const dual = points.length > 10;
  const dist = Math.min(270, Math.max(78, span * (dual ? 1.06 : 1.02) + 14)) * aspectBoost;
  const elevation = dual ? .48 : .36;
  const goal = new THREE.Vector3(
    center.x + dist * .38,
    dist * elevation,
    center.z + dist * .92
  );
  if (immediate) {
    state.camera.position.copy(goal);
    state.controls.target.copy(center);
    state.controls.update();
    state.cameraGoal = null;
  } else {
    state.cameraGoal = {
      pos: goal,
      target: center.clone(),
      start: performance.now(),
      duration: 1100
    };
  }
}

function cameraPointsFor(key) {
  const f = state.formations[key];
  if (!f) return [new THREE.Vector3()];
  return f.ships.map(s => worldPos(s));
}

export function setShipPosition(id, mapX, mapY) {
  if (!state.ready) return;
  const group = state.shipGroups[id];
  if (!group) return;
  const x = clampMap(mapX, MAP_BOUNDS.minX, MAP_BOUNDS.maxX);
  const y = clampMap(mapY, MAP_BOUNDS.minY, MAP_BOUNDS.maxY);
  const wx = (x - 500) * WORLD_SCALE;
  const wz = (y - 310) * WORLD_SCALE;
  group.userData.target.set(wx, 0, wz);
  group.position.x = wx;
  group.position.z = wz;
  updateSelection(false);
}

export function setShipRotation(id, degrees) {
  if (!state.ready) return;
  const group = state.shipGroups[id];
  if (!group) return;
  group.userData.targetRot = -THREE.MathUtils.degToRad(Number(degrees) || 0);
}

export function setFormation(key) {
  if (!state.ready || !state.formations[key]) return;
  const f = state.formations[key];
  state.drag = null;
  if (state.controls) state.controls.enabled = true;
  state.formationKey = key;
  state.activeIds = new Set(f.ships.map(s => s.id));
  const points = [];

  f.ships.forEach(entry => {
    const group = state.shipGroups[entry.id];
    if (!group) return;
    const target = worldPos(entry);
    group.userData.target.copy(target);
    group.userData.targetRot = -THREE.MathUtils.degToRad(entry.rot || 0);
    const fresh = !group.visible;
    if (fresh) {
      group.visible = true;
      group.position.copy(target);
      group.position.y = 0;
      group.rotation.y = group.userData.targetRot;
      group.scale.setScalar(.7);
      group.userData.spawn = performance.now();
    }
    points.push(target);
  });

  Object.entries(state.shipGroups).forEach(([id, group]) => {
    if (!state.activeIds.has(id)) group.visible = false;
  });

  state.selectedId = f.primary;
  updateSelection(true);
  syncLabels();
  fitCamera(points, !state.cameraGoal);
}

export function setSelected(id) {
  if (!state.ready) return;
  state.selectedId = id;
  updateSelection(false);
  syncLabels();
}

function updateSelection(immediate) {
  if (!state.ready || !state.selectedId) return;
  const group = state.shipGroups[state.selectedId];
  if (!group || !group.visible) {
    state.selectionRing.visible = false;
    state.selectionBeacon.visible = false;
    if (state.headingIndicator) state.headingIndicator.visible = false;
    return;
  }
  state.selectionRing.visible = true;
  state.selectionBeacon.visible = true;
  if (state.headingIndicator) {
    state.headingIndicator.visible = true;
    state.headingIndicator.position.set(group.position.x, 0, group.position.z);
    state.headingIndicator.rotation.y = group.rotation.y;
  }
  state.selectionRing.position.set(group.position.x, .2, group.position.z);
  state.selectionBeacon.position.set(group.position.x, 4.5, group.position.z);
  const ringScale = Math.max(2.6, (group.userData.length || 12) * .31);
  state.selectionRing.userData.baseScale = ringScale;
  state.selectionRing.scale.setScalar(ringScale);
}

export function resetCamera() {
  if (!state.ready) return;
  fitCamera(cameraPointsFor(state.formationKey), false);
}

export function setAutoRotate(on) {
  state.autoRotate = !!on;
  if (state.controls) state.controls.autoRotate = state.autoRotate;
}

export function setActive(on) {
  state.active = !!on;
  if (!on && state.drag) {
    state.drag = null;
    if (state.controls) state.controls.enabled = true;
  }
  if (on && state.ready) {
    resize();
    state.controls.autoRotate = state.autoRotate;
  }
}

/* ── labels ──────────────────────────────────────────── */
const LABEL_HEIGHT = 11;

function makeLabel(id, ship) {
  const el = document.createElement("div");
  el.className = "sandbox-label" + (ship.art.startsWith("ship-carrier") ? " sandbox-label--carrier" : "");
  el.innerHTML = `<strong>${ship.name}</strong><span>${ship.code} · ${ship.roleShort}</span><i></i>`;
  state.labelsEl.appendChild(el);
  return el;
}

function syncLabels() {
  if (!state.ready || !state.labelsEl) return;
  const f = state.formations[state.formationKey];
  if (!f) return;
  const wanted = new Set(
    f.ships.map(e => e.id).filter(id => id === "liaoning" || id === "shandong" || id === "fujian")
  );
  if (state.selectedId) wanted.add(state.selectedId);

  state.labels.forEach((el, id) => {
    if (!wanted.has(id)) {
      el.remove();
      state.labels.delete(id);
    }
  });
  wanted.forEach(id => {
    if (!state.labels.has(id)) {
      const ship = state.shipsData[id];
      if (ship) state.labels.set(id, makeLabel(id, ship));
    }
  });
}

function updateLabels() {
  if (!state.labelsEl) return;
  const w = state.width;
  const h = state.height;
  state.labels.forEach((el, id) => {
    const group = state.shipGroups[id];
    if (!group || !group.visible) {
      el.style.opacity = "0";
      return;
    }
    const lift = state.formationKey === "dual"
      ? (id === "shandong" ? 8 : id === "fujian" ? 26 : LABEL_HEIGHT)
      : LABEL_HEIGHT;
    const pos = new THREE.Vector3(0, lift, 0);
    group.localToWorld(pos);
    pos.project(state.camera);
    if (pos.z > 1 || Math.abs(pos.x) > 1.1 || Math.abs(pos.y) > 1.1) {
      el.style.opacity = "0";
      return;
    }
    const x = (pos.x * .5 + .5) * w;
    const y = (-pos.y * .5 + .5) * h;
    el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
    el.style.opacity = "1";
  });
}

/* ── interaction ─────────────────────────────────────── */
function pointerPick(event) {
  const rect = state.canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hits = state.raycaster.intersectObjects(state.hitboxes, false);
  for (const hit of hits) {
    const id = hit.object.userData.shipId;
    const group = state.shipGroups[id];
    if (group && group.visible && state.activeIds.has(id)) return id;
  }
  return null;
}

function pointerWorld(event) {
  const rect = state.canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hit = state.raycaster.ray.intersectPlane(GROUND_PLANE, GROUND_HIT);
  return hit ? GROUND_HIT.clone() : null;
}

function clampMap(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finishPointer(event, cancelled) {
  const drag = state.drag;
  if (drag) {
    const group = state.shipGroups[drag.id];
    state.drag = null;
    state.controls.enabled = true;
    state.controls.autoRotate = state.autoRotate;
    state.canvas.style.cursor = "grab";
    try { state.canvas.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
    if (group) {
      if (cancelled) {
        group.position.x = drag.startX;
        group.position.z = drag.startZ;
        group.userData.target.x = drag.startX;
        group.userData.target.z = drag.startZ;
      } else if (drag.moved) {
        const mapX = clampMap(group.position.x / WORLD_SCALE + 500, MAP_BOUNDS.minX, MAP_BOUNDS.maxX);
        const mapY = clampMap(group.position.z / WORLD_SCALE + 310, MAP_BOUNDS.minY, MAP_BOUNDS.maxY);
        group.position.x = (mapX - 500) * WORLD_SCALE;
        group.position.z = (mapY - 310) * WORLD_SCALE;
        group.userData.target.set(group.position.x, 0, group.position.z);
        if (state.onMove) state.onMove(drag.id, mapX, mapY);
      } else {
        group.position.x = drag.startX;
        group.position.z = drag.startZ;
        group.userData.target.x = drag.startX;
        group.userData.target.z = drag.startZ;
      }
    }
    state.pointerDown = null;
    updateSelection(false);
    return;
  }

  const down = state.pointerDown;
  state.pointerDown = null;
  if (!down || cancelled) return;
  if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 7) return;
  const id = pointerPick(event);
  if (id && state.onSelect) state.onSelect(id);
}

function bindPointer() {
  const canvas = state.canvas;

  canvas.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const id = pointerPick(event);
    state.pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
    state.cameraGoal = null;
    if (id) {
      const group = state.shipGroups[id];
      const hit = pointerWorld(event);
      state.drag = {
        id,
        moved: false,
        startX: group ? group.position.x : 0,
        startZ: group ? group.position.z : 0,
        offset: hit && group
          ? new THREE.Vector3(group.position.x - hit.x, 0, group.position.z - hit.z)
          : new THREE.Vector3()
      };
      state.controls.enabled = false;
      state.controls.autoRotate = false;
      canvas.style.cursor = "grabbing";
      if (state.onSelect) state.onSelect(id);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    try { canvas.setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
  }, true);

  canvas.addEventListener("pointermove", event => {
    if (state.drag) {
      const group = state.shipGroups[state.drag.id];
      if (!group) return;
      if (!state.drag.moved) {
        if (Math.hypot(event.clientX - state.pointerDown.x, event.clientY - state.pointerDown.y) <= 3) return;
        state.drag.moved = true;
      }
      const hit = pointerWorld(event);
      if (!hit) return;
      const mapX = clampMap((hit.x + state.drag.offset.x) / WORLD_SCALE + 500, MAP_BOUNDS.minX, MAP_BOUNDS.maxX);
      const mapY = clampMap((hit.z + state.drag.offset.z) / WORLD_SCALE + 310, MAP_BOUNDS.minY, MAP_BOUNDS.maxY);
      group.position.x = (mapX - 500) * WORLD_SCALE;
      group.position.z = (mapY - 310) * WORLD_SCALE;
      group.userData.target.set(group.position.x, 0, group.position.z);
      event.preventDefault();
      return;
    }
    if (event.pointerType === "touch") return;
    const id = pointerPick(event);
    canvas.style.cursor = id ? "grab" : "grab";
  }, { passive: false });

  canvas.addEventListener("pointerup", event => finishPointer(event, false));
  canvas.addEventListener("pointercancel", event => finishPointer(event, true));
}

/* ── resize / loop ───────────────────────────────────── */
function resize() {
  if (!state.renderer || !state.canvas || !state.container) return;
  const rect = state.container.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (width === state.width && height === state.height) return;
  state.width = width;
  state.height = height;
  state.renderer.setSize(width, height, false);
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
}

function shortestAngle(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function animate() {
  requestAnimationFrame(animate);
  if (!state.ready || !state.active) return;
  const t = state.clock.getElapsedTime();
  const now = performance.now();

  if (state.ocean) state.ocean.material.uniforms.uTime.value = t;

  Object.values(state.shipGroups).forEach(group => {
    if (!group.visible) return;
    const { target, targetRot, phase, spawn } = group.userData;
    const k = .06;
    group.position.x += (target.x - group.position.x) * k;
    group.position.z += (target.z - group.position.z) * k;
    group.position.y = Math.sin(t * .72 + phase) * .13;
    group.rotation.x = Math.sin(t * .82 + phase) * .012;
    group.rotation.z = Math.cos(t * .67 + phase) * .017;
    group.rotation.y += shortestAngle(group.rotation.y, targetRot) * .06;
    if (group.userData.wake) {
      group.userData.wake.material.opacity = .5 + Math.sin(t * 1.4 + phase) * .07;
    }
    if (group.userData.wakeLines) {
      group.userData.wakeLines.forEach(line => {
        line.material.opacity = .24 + Math.sin(t * 1.6 + phase) * .06;
      });
    }
    if (group.userData.bowFoam) {
      const foam = group.userData.bowFoam;
      foam.scale.setScalar(1 + Math.sin(t * 2.5 + phase) * .13);
      foam.material.opacity = .2 + (Math.sin(t * 2.1 + phase) + 1) * .055;
    }
    if (spawn && now - spawn < 800) {
      const p = Math.min(1, (now - spawn) / 800);
      const eased = 1 - Math.pow(1 - p, 3);
      group.scale.setScalar(.7 + .3 * eased);
    } else if (spawn) {
      group.scale.setScalar(1);
      group.userData.spawn = 0;
    }
  });

  if (state.cameraGoal) {
    const p = Math.min(1, (now - state.cameraGoal.start) / state.cameraGoal.duration);
    const eased = 1 - Math.pow(1 - p, 3);
    state.camera.position.lerp(state.cameraGoal.pos, .055 + eased * .02);
    state.controls.target.lerp(state.cameraGoal.target, .055 + eased * .02);
    if (p >= 1) state.cameraGoal = null;
  }

  // selection follows the ship and breathes
  if (state.selectionRing.visible) {
    const g = state.shipGroups[state.selectedId];
    if (g) {
      state.selectionRing.position.x = g.position.x;
      state.selectionRing.position.z = g.position.z;
      state.selectionBeacon.position.x = g.position.x;
      state.selectionBeacon.position.z = g.position.z;
      const base = state.selectionRing.userData.baseScale || 4;
      const pulse = base * (1 + Math.sin(t * 2.4) * .07);
      state.selectionRing.scale.setScalar(pulse);
      state.selectionRing.rotation.z = t * .35;
      if (state.headingIndicator) {
        state.headingIndicator.position.set(g.position.x, 0, g.position.z);
        state.headingIndicator.rotation.y = g.rotation.y;
      }
    }
  }

  updateLabels();
  state.controls.update();
  state.renderer.render(state.scene, state.camera);
}

function loadEnvironment() {
  const loader = new RGBELoader();
  loader.load("./assets/hdri/sunset_sky_1k.hdr", texture => {
    if (!state.ready) return;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(state.renderer);
    const env = pmrem.fromEquirectangular(texture).texture;
    state.scene.environment = env;
    state.scene.environmentIntensity = .72;
    if (state.sky) state.sky.visible = true;
    pmrem.dispose();
  }, undefined, error => {
    console.warn("HDRI unavailable, keeping procedural sky", error);
  });
}

/* ── init ────────────────────────────────────────────── */
export function initSandbox(opts) {
  if (state.ready) return true;
  state.canvas = opts.canvas;
  state.container = opts.container;
  state.labelsEl = opts.labels;
  state.shipsData = opts.ships;
  state.formations = opts.formations;
  state.onSelect = opts.onSelect;
  state.onMove = opts.onMove;
  state.reduction = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    state.renderer = new THREE.WebGLRenderer({
      canvas: state.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.error("WebGL unavailable", error);
    return false;
  }

  state.quality = window.innerWidth >= 900 && !window.matchMedia("(pointer: coarse)").matches;
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.quality ? 1.75 : 1.4));
  state.renderer.setClearColor(0x041018, 1);
  state.renderer.shadowMap.enabled = state.quality;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.2;

  state.scene = new THREE.Scene();
  state.scene.fog = new THREE.FogExp2(0x051018, .0022);

  state.camera = new THREE.PerspectiveCamera(39, 1, .2, 1600);
  state.camera.position.set(110, 105, 190);

  state.controls = new OrbitControls(state.camera, state.canvas);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = .06;
  state.controls.enablePan = false;
  state.controls.minDistance = 22;
  state.controls.maxDistance = 480;
  state.controls.minPolarAngle = .18;
  state.controls.maxPolarAngle = Math.PI * .485;
  state.controls.autoRotate = !state.reduction;
  state.controls.autoRotateSpeed = .38;
  state.autoRotate = !state.reduction;
  state.controls.target.set(0, 2, 0);

  // materials
  const hullMap = hullTexture();
  const hullBump = hullBumpTexture();
  MAT.hull = new THREE.MeshStandardMaterial({
    color: 0x93a2a2, map: hullMap, bumpMap: hullBump, bumpScale: .035,
    roughness: .54, metalness: .24, envMapIntensity: 1.1
  });
  MAT.hullDark = new THREE.MeshStandardMaterial({
    color: 0x7d8c8e, map: hullMap, bumpMap: hullBump, bumpScale: .03,
    roughness: .58, metalness: .2, envMapIntensity: 1.0
  });
  MAT.deckSide = new THREE.MeshStandardMaterial({ color: 0x4a5c60, map: hullMap, roughness: .72, metalness: .12 });
  MAT.white = new THREE.MeshStandardMaterial({ color: 0xbfcbcb, roughness: .45, metalness: .08 });
  MAT.mast = new THREE.MeshStandardMaterial({ color: 0x879ca0, roughness: .45, metalness: .5 });
  MAT.radar = new THREE.MeshStandardMaterial({ color: 0x2a3d43, roughness: .4, metalness: .35 });
  MAT.glass = new THREE.MeshStandardMaterial({ color: 0x0a2027, emissive: 0x1a5864, emissiveIntensity: .5, roughness: .25, metalness: .3 });
  MAT.red = new THREE.MeshStandardMaterial({ color: 0x6e2b28, roughness: .7, metalness: .1 });
  MAT.gold = new THREE.MeshStandardMaterial({ color: 0xb89a60, roughness: .4, metalness: .55 });
  MAT.subHull = new THREE.MeshStandardMaterial({ color: 0x1b2c31, roughness: .6, metalness: .3 });
  MAT.cyan = new THREE.MeshBasicMaterial({ color: 0x6fe3e8 });
  MAT.navRed = new THREE.MeshBasicMaterial({ color: 0xff5a48 });
  MAT.navGreen = new THREE.MeshBasicMaterial({ color: 0x6bffa8 });
  MAT.rotor = new THREE.MeshBasicMaterial({ color: 0x9fb4b6, transparent: true, opacity: .25, side: THREE.DoubleSide });
  MAT.edge = new THREE.LineBasicMaterial({ color: 0xb5c9ca, transparent: true, opacity: .4 });
  TEX = {
    shadow: shadowTexture(),
    wake: wakeTexture(),
    foam: foamTexture(),
    vls: vlsTexture(8, 4)
  };

  buildScene();
  loadEnvironment();
  bindPointer();
  state.clock = new THREE.Clock();
  state.ready = true;
  state.active = true;

  const ro = new ResizeObserver(() => resize());
  ro.observe(state.container);
  resize();
  animate();
  return true;
}
