import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const state = {
  shape: 'bottle',
  importedModel: null,
  importedModelData: null,
  useImported: false,
  name: 'Orange Soda',
  tagline: 'Zestiest Drink Around!',
  bgColor: '#ff6600',
  textColor: '#ffffff',
  fontBrand: 'Arial Black',
  fontTagline: 'Arial Black',
  brandFontScale: 1.0,
  taglineFontScale: 1.0,
  brandX: 50,
  brandY: 38,
  taglineX: 50,
  taglineY: 55,
  showNutrition: false,
  nutritionX: 50,
  nutritionY: 0,
  nutritionW: 70,
  nutritionTextSize: 1.0,
  showIngredients: false,
  ingredients: '',
  nutrition: {
    servingSize: '12 oz',
    servingsPerContainer: '1',
    calories: '150',
    totalFat: '0g',
    sodium: '35mg',
    totalCarb: '39g',
    sugars: '39g',
    protein: '0g',
  },
  images: [],
};

const container = document.getElementById('viewport');
const brandInput = document.getElementById('brand-name');
const taglineInput = document.getElementById('tagline');
const bgPicker = document.getElementById('bg-color');
const textPicker = document.getElementById('text-color');
const fontBrandSelect = document.getElementById('font-brand');
const fontTaglineSelect = document.getElementById('font-tagline');
const brandSizeRange = document.getElementById('brand-size');
const taglineSizeRange = document.getElementById('tagline-size');
const brandSizeVal = document.getElementById('brand-size-val');
const taglineSizeVal = document.getElementById('tagline-size-val');
const brandXRange = document.getElementById('brand-x');
const brandYRange = document.getElementById('brand-y');
const taglineXRange = document.getElementById('tagline-x');
const taglineYRange = document.getElementById('tagline-y');
const brandXVal = document.getElementById('brand-x-val');
const brandYVal = document.getElementById('brand-y-val');
const taglineXVal = document.getElementById('tagline-x-val');
const taglineYVal = document.getElementById('tagline-y-val');
const templateGrid = document.getElementById('template-grid');
const exportBtn = document.getElementById('export-btn');
const exportModelBtn = document.getElementById('export-model-btn');
const saveBtn = document.getElementById('save-btn');
const loadInput = document.getElementById('load-input');
const importInput = document.getElementById('import-glb');
const resetBtn = document.getElementById('reset-shape-btn');
const addImageBtn = document.getElementById('add-image-btn');
const imageList = document.getElementById('image-list');
const nutritionToggle = document.getElementById('nutrition-toggle');
const nutritionXRange = document.getElementById('nutrition-x');
const nutritionYRange = document.getElementById('nutrition-y');
const nutritionWRange = document.getElementById('nutrition-w');
const nutritionTextRange = document.getElementById('nutrition-text-size');
const nutritionXVal = document.getElementById('nutrition-x-val');
const nutritionYVal = document.getElementById('nutrition-y-val');
const nutritionWVal = document.getElementById('nutrition-w-val');
const nutritionTextVal = document.getElementById('nutrition-text-val');
const ingrToggle = document.getElementById('ingr-toggle');
const ingrText = document.getElementById('ingr-text');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12121f);

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(4.5, 3, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 14;
controls.target.set(0, 1.8, 0);

const hemi = new THREE.HemisphereLight(0x8888ff, 0x444422, 0.5);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffeedd, 1.8);
key.position.set(5, 8, 6);
key.castShadow = true;
key.shadow.mapSize.width = 1024;
key.shadow.mapSize.height = 1024;
scene.add(key);

const fill = new THREE.DirectionalLight(0x4488ff, 0.5);
fill.position.set(-4, 2, 3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.4);
rim.position.set(-3, 1, -6);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.MeshStandardMaterial({ color: 0x12121f, roughness: 0.9, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(1.5, 2.8, 64),
  new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -0.01;
scene.add(ring);

let mesh = null;
let cachedBottle = null;
let cachedCan = null;
let modelsLoaded = false;

function prepareModel(scene, targetH) {
  const box = new THREE.Box3().setFromObject(scene);
  const s = targetH / box.getSize(new THREE.Vector3()).y;
  scene.scale.set(s, s, s);
  scene.updateMatrixWorld(true);
  const nb = new THREE.Box3().setFromObject(scene);
  const nc = nb.getCenter(new THREE.Vector3());
  scene.position.set(-nc.x, -nb.min.y, -nc.z);
}

async function loadModels() {
  const loader = new GLTFLoader();
  try {
    const [br, cr] = await Promise.all([
      loader.loadAsync('models/coca-cola_bottle.glb'),
      loader.loadAsync('models/cool-ayyd_soda_can.glb'),
    ]);
    cachedBottle = br.scene;
    cachedCan = cr.scene;
    prepareModel(cachedBottle, 3.2);
    prepareModel(cachedCan, 3.5);
    modelsLoaded = true;
  } catch (e) {
    console.warn('Model load failed, using procedural fallback:', e);
  }
}

function applyLabel(scene, shape) {
  const tex = generateTexture(shape);
  if (shape === 'can') {
    tex.center.set(0.5, 0.5);
    tex.rotation = -Math.PI / 2;
  }
  scene.traverse((child) => {
    if (child.isMesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (m.map) {
          const old = m.map;
          m.map = tex;
          m.needsUpdate = true;
          if (old !== tex) old.dispose();
        }
      }
    }
  });
}

function disposeCurrent() {
  if (mesh) {
    scene.remove(mesh);
    mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      }
    });
    mesh = null;
  }
}

function createBottlePoints() {
  const raw = [
    [0.001, 0], [0.50, 0], [0.80, 0], [0.80, 0.04],
    [0.86, 0.12], [0.88, 0.25], [0.88, 0.45],
    [0.86, 0.65], [0.84, 0.85], [0.85, 1.05],
    [0.88, 1.25], [0.90, 1.50], [0.89, 1.70],
    [0.85, 1.85], [0.75, 2.00], [0.58, 2.12],
    [0.40, 2.22], [0.27, 2.32], [0.23, 2.42],
    [0.22, 2.60], [0.22, 2.80], [0.22, 2.95],
    [0.24, 3.02], [0.27, 3.06], [0.28, 3.08],
    [0.001, 3.15],
  ];
  const pts = raw.map(p => new THREE.Vector3(p[0], p[1], 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  return curve.getPoints(60).map(p => new THREE.Vector2(p.x, p.y));
}

function buildBottle() {
  if (cachedBottle) {
    const scene = cachedBottle.clone();
    applyLabel(scene, 'bottle');
    scene.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    return scene;
  }
  const geo = new THREE.LatheGeometry(createBottlePoints(), 64);
  const tex = generateTexture('bottle');
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex, roughness: 0.2, metalness: 0,
    clearcoat: 0.25, clearcoatRoughness: 0.2, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0;
  m.castShadow = true;
  return m;
}

function buildCan() {
  if (cachedCan) {
    const scene = cachedCan.clone();
    applyLabel(scene, 'can');
    scene.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    return scene;
  }
  const halfH = 1.75;
  const geo = new THREE.CylinderGeometry(0.95, 0.89, halfH * 2, 64);
  const tex = generateTexture('can');
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex, roughness: 0.25, metalness: 0.4, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xc0c0c0, metalness: 0.85, roughness: 0.12,
  });
  const topCap = new THREE.Mesh(new THREE.CircleGeometry(0.86, 56), capMat);
  topCap.rotation.x = -Math.PI / 2;
  topCap.position.y = halfH;
  m.add(topCap);
  const botCap = new THREE.Mesh(new THREE.CircleGeometry(0.85, 56), capMat);
  botCap.rotation.x = Math.PI / 2;
  botCap.position.y = -halfH;
  m.add(botCap);
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xd0d0d0, metalness: 0.9, roughness: 0.08,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.04, 20, 64), rimMat);
  rim.position.y = halfH - 0.02;
  rim.rotation.x = Math.PI / 2;
  m.add(rim);
  const ridgeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8c8c8, metalness: 0.8, roughness: 0.15,
  });
  for (let i = 0; i < 3; i++) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.015, 12, 64), ridgeMat);
    ridge.position.y = halfH - 0.12 - i * 0.04;
    ridge.rotation.x = Math.PI / 2;
    m.add(ridge);
  }
  const botRimMat = new THREE.MeshPhysicalMaterial({
    color: 0xb0b0b0, metalness: 0.7, roughness: 0.3,
  });
  const botRim = new THREE.Mesh(new THREE.TorusGeometry(0.90, 0.025, 16, 56), botRimMat);
  botRim.position.y = -halfH + 0.02;
  botRim.rotation.x = Math.PI / 2;
  m.add(botRim);
  m.position.y = halfH;
  m.castShadow = true;
  return m;
}

function generateTexture(shape) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 1024;

  let lx = 0, ly = 20, lw = 1024, lh = 1024 - ly * 2;

  if (shape === 'can') {
    lx = 30;
    lw = 1024 - lx * 2;
    ly = 0;
    lh = 1024;
  }

  if (shape === 'bottle' || shape === 'imported') {
    const glassColor = '#5c3a1e';
    ctx.fillStyle = glassColor;
    ctx.fillRect(0, 0, 1024, ly);
  } else {
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(0, 0, lx, 1024);
  }

  drawLabel(ctx, lx, ly, lw, lh);

  if (shape === 'bottle' || shape === 'imported') {
    const glassColor = '#5c3a1e';
    ctx.fillStyle = glassColor;
    ctx.fillRect(0, ly + lh, 1024, 1024 - ly - lh);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, ly, 1024, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, 1024, 2);
  } else {
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(lx + lw, 0, 1024 - lx - lw, 1024);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 0, 1024, 2);
    ctx.fillRect(0, 1024 - 2, 1024, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, lx, 2);
    ctx.fillRect(lx + lw, 1024 - 2, 1024 - lx - lw, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function drawLabel(ctx, lx, ly, lw, lh) {
  const p = 12;

  ctx.fillStyle = state.bgColor;
  ctx.fillRect(lx, ly, lw, lh);

  const margin = lw * 0.08;
  const mid = ly + lh * 0.5;

  let fs = Math.min(lw * 0.14, lh * 0.22) * state.brandFontScale;
  let bx = lx + lw * state.brandX / 100;
  let by = ly + lh * state.brandY / 100;
  ctx.font = `900 ${fs}px "${state.fontBrand}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = state.textColor;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText(state.name, bx, by);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillText(state.name, bx, by);

  if (state.tagline) {
    let tf = Math.min(lw * 0.05, lh * 0.08) * state.taglineFontScale;
    let tx = lx + lw * state.taglineX / 100;
    let ty = ly + lh * state.taglineY / 100;
    ctx.font = `500 ${tf}px "${state.fontTagline}", sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.globalAlpha = 0.8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline, tx, ty);
    ctx.globalAlpha = 1;
  }

  let cursorY = mid + lh * 0.15;

  if (state.showNutrition) {
    const n = state.nutrition;
    const nx = lx + lw * state.nutritionX / 100;
    const ny = ly + lh * state.nutritionY / 100;
    const nw = lw * state.nutritionW / 100;
    const nh = (ly + lh) - ny;
    const ts = state.nutritionTextSize;
    const fps = Math.min(nw * 0.06, nh * 0.04) * ts;

    ctx.fillStyle = '#fff';
    ctx.fillRect(nx, ny, nw, nh);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(nx, ny, nw, nh);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let row = ny + 4;
    ctx.font = `bold ${fps * 1.4}px Arial, sans-serif`;
    ctx.fillText('Nutrition Facts', nx + 4, row);
    row += fps * 1.8;
    ctx.font = `${fps}px Arial, sans-serif`;
    ctx.fillText(`Serving Size ${n.servingSize}`, nx + 4, row);
    row += fps * 1.3;
    ctx.fillText(`Servings ${n.servingsPerContainer}`, nx + 4, row);
    row += fps * 0.5;
    ctx.fillRect(nx, row, nw, 1.5);
    row += fps * 0.5;
    ctx.font = `bold ${fps * 1.3}px Arial, sans-serif`;
    ctx.fillText(`Calories ${n.calories}`, nx + 4, row);
    row += fps * 1.5;
    ctx.fillRect(nx, row, nw, 1);
    row += fps * 0.3;
    ctx.font = `${fps}px Arial, sans-serif`;
    const drawRow = (label, val) => {
      ctx.fillStyle = '#000';
      ctx.fillText(`${label} ${val}`, nx + 4, row);
      row += fps * 1.2;
    };
    drawRow('Total Fat', n.totalFat);
    drawRow('Sodium', n.sodium);
    drawRow('Total Carb', n.totalCarb);
    drawRow('Sugars', n.sugars);
    drawRow('Protein', n.protein);
  }

  if (state.showIngredients && state.ingredients) {
    const ix2 = lx + margin;
    const iw2 = lw - margin * 2;
    ctx.fillStyle = state.textColor;
    ctx.font = '7px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const words = state.ingredients.split(/\s+/);
    let line = '';
    const maxW = iw2 - 4;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, ix2, cursorY);
        cursorY += 9;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, ix2, cursorY);
  }

  for (const img of state.images) {
    if (!img.visible || !img.img) continue;
    const size = Math.min(lw * 0.35, lh * 0.18) * img.scale * 3;
    const aspect = img.img.width / img.img.height;
    const iw = aspect >= 1 ? size : size * aspect;
    const ih = aspect >= 1 ? size / aspect : size;
    const ix = lx + lw * img.x / 100 - iw / 2;
    const iy = ly + lh * img.y / 100 - ih / 2;
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, ix - 2, iy - 2, iw + 4, ih + 4, 4, false, true);
    ctx.clip();
    ctx.drawImage(img.img, ix, iy, iw, ih);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function buildImported() {
  if (!state.importedModel) return null;
  const scene = state.importedModel.clone();
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const targetH = 3.2;
  const s = targetH / size.y;
  scene.scale.set(s, s, s);
  scene.updateMatrixWorld(true);
  const nb = new THREE.Box3().setFromObject(scene);
  const nc = nb.getCenter(new THREE.Vector3());
  scene.position.set(-nc.x, -nb.min.y, -nc.z);
  const tex = generateTexture(state.shape);
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (m.map) {
          const old = m.map;
          m.map = tex;
          m.needsUpdate = true;
          if (old !== tex) old.dispose();
        }
      }
    }
  });
  return scene;
}

function updateScene() {
  disposeCurrent();
  if (state.useImported && state.importedModel) {
    mesh = buildImported();
    controls.target.set(0, 1.65, 0);
  } else if (state.shape === 'bottle') {
    mesh = buildBottle();
    controls.target.set(0, 1.65, 0);
  } else {
    mesh = buildCan();
    controls.target.set(0, 1.75, 0);
  }
  scene.add(mesh);
}

function exportPNG() {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  const slug = state.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'label';
  link.download = `orange-soda-${state.shape}-${slug}.png`;
  link.href = renderer.domElement.toDataURL('image/png');
  link.click();
}

function exportModel() {
  if (!mesh) return;
  const exporter = new GLTFExporter();
  const slug = state.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'label';
  exporter.parse(mesh, (glb) => {
    const blob = new Blob([glb], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.download = `orange-soda-${state.shape}-${slug}.glb`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, (err) => {
    console.error('GLB export error:', err);
  }, { binary: true });
}

function saveProject() {
  const data = {
    version: 1,
    state: {
      shape: state.shape,
      name: state.name,
      tagline: state.tagline,
      bgColor: state.bgColor,
      textColor: state.textColor,
      fontBrand: state.fontBrand,
      fontTagline: state.fontTagline,
      brandFontScale: state.brandFontScale,
      taglineFontScale: state.taglineFontScale,
      brandX: state.brandX,
      brandY: state.brandY,
      taglineX: state.taglineX,
      taglineY: state.taglineY,
      showNutrition: state.showNutrition,
      nutritionX: state.nutritionX,
      nutritionY: state.nutritionY,
      nutritionW: state.nutritionW,
      nutritionTextSize: state.nutritionTextSize,
      showIngredients: state.showIngredients,
      ingredients: state.ingredients,
      useImported: state.useImported,
    },
    nutrition: { ...state.nutrition },
    images: state.images.map(img => ({
      id: img.id,
      dataUrl: img.dataUrl,
      x: img.x,
      y: img.y,
      scale: img.scale,
      visible: img.visible,
    })),
    importedModelData: state.importedModelData,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const slug = state.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'project';
  link.download = `orange-soda-${slug}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

async function loadProject(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    alert('Invalid project file');
    return;
  }
  if (!data.version || !data.state) {
    alert('Invalid project file');
    return;
  }
  const s = data.state;
  state.shape = s.shape || 'bottle';
  state.name = s.name || 'Orange Soda';
  state.tagline = s.tagline || '';
  state.bgColor = s.bgColor || '#ff6600';
  state.textColor = s.textColor || '#ffffff';
  state.fontBrand = s.fontBrand || 'Arial Black';
  state.fontTagline = s.fontTagline || 'Arial Black';
  state.brandFontScale = s.brandFontScale ?? 1.0;
  state.taglineFontScale = s.taglineFontScale ?? 1.0;
  state.brandX = s.brandX ?? 50;
  state.brandY = s.brandY ?? 38;
  state.taglineX = s.taglineX ?? 50;
  state.taglineY = s.taglineY ?? 55;
  state.showNutrition = s.showNutrition ?? false;
  state.nutritionX = s.nutritionX ?? 50;
  state.nutritionY = s.nutritionY ?? 0;
  state.nutritionW = s.nutritionW ?? 70;
  state.nutritionTextSize = s.nutritionTextSize ?? 1.0;
  state.showIngredients = s.showIngredients ?? false;
  state.ingredients = s.ingredients || '';
  state.useImported = s.useImported ?? false;
  state.images = [];
  state.importedModelData = data.importedModelData || null;

  if (data.nutrition) {
    Object.assign(state.nutrition, data.nutrition);
  }

  // restore images
  state.images = [];
  if (data.images) {
    for (const imgData of data.images) {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imgData.dataUrl;
      });
      state.images.push({
        id: imgData.id,
        img,
        dataUrl: imgData.dataUrl,
        x: imgData.x ?? 50,
        y: imgData.y ?? 50,
        scale: imgData.scale ?? 0.5,
        visible: imgData.visible ?? true,
      });
    }
  }

  // restore imported model
  state.importedModel = null;
  if (state.importedModelData) {
    try {
      const byteStr = atob(state.importedModelData);
      const buf = new ArrayBuffer(byteStr.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < byteStr.length; i++) view[i] = byteStr.charCodeAt(i);
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.parse(buf, '', resolve, reject);
      });
      state.importedModel = gltf.scene;
    } catch (e) {
      console.warn('Could not restore imported model:', e);
      state.useImported = false;
    }
  }

  // sync UI fields
  brandInput.value = state.name;
  taglineInput.value = state.tagline;
  bgPicker.value = state.bgColor;
  textPicker.value = state.textColor;
  fontBrandSelect.value = state.fontBrand;
  fontTaglineSelect.value = state.fontTagline;
  brandSizeRange.value = state.brandFontScale;
  taglineSizeRange.value = state.taglineFontScale;
  brandXRange.value = state.brandX;
  brandYRange.value = state.brandY;
  taglineXRange.value = state.taglineX;
  taglineYRange.value = state.taglineY;
  nutritionToggle.checked = state.showNutrition;
  nutritionXRange.value = state.nutritionX;
  nutritionYRange.value = state.nutritionY;
  nutritionWRange.value = state.nutritionW;
  nutritionTextRange.value = state.nutritionTextSize;
  ingrToggle.checked = state.showIngredients;
  ingrText.value = state.ingredients;

  renderImageList();

  document.querySelectorAll('.nf-input').forEach((el) => {
    const f = el.dataset.field;
    if (f && state.nutrition[f] !== undefined) el.value = state.nutrition[f];
  });

  const shapeBtns = document.querySelectorAll('.shape-btn');
  shapeBtns.forEach((b) => b.classList.toggle('active', b.dataset.shape === state.shape));

  // trigger update to rebuild scene
  const updateEvent = new Event('input');
  brandInput.dispatchEvent(updateEvent);
}

function renderImageList() {
  imageList.innerHTML = '';
  state.images.forEach((img, i) => {
    const item = document.createElement('div');
    item.className = 'image-item';
    item.dataset.id = img.id;

    const header = document.createElement('div');
    header.className = 'image-item-header';

    const thumb = document.createElement('img');
    thumb.className = 'image-item-thumb';
    thumb.src = img.dataUrl;

    const label = document.createElement('span');
    label.className = 'image-item-label';
    label.textContent = `Image ${i + 1}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'image-item-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      state.images = state.images.filter((im) => im.id !== img.id);
      renderImageList();
      updateScene();
    });

    header.appendChild(thumb);
    header.appendChild(label);
    header.appendChild(removeBtn);

    const controls = document.createElement('div');
    controls.className = 'image-item-controls';

    const xField = document.createElement('div');
    xField.className = 'field';
    const xVal = document.createElement('span');
    xVal.textContent = img.x;
    xField.innerHTML = `<label>X</label>`;
    xField.appendChild(xVal);
    const xRange = document.createElement('input');
    xRange.type = 'range';
    xRange.min = 0;
    xRange.max = 100;
    xRange.value = img.x;
    xRange.addEventListener('input', () => {
      img.x = parseInt(xRange.value);
      xVal.textContent = img.x;
      updateScene();
    });
    xField.appendChild(xRange);

    const yField = document.createElement('div');
    yField.className = 'field';
    const yVal = document.createElement('span');
    yVal.textContent = img.y;
    yField.innerHTML = `<label>Y</label>`;
    yField.appendChild(yVal);
    const yRange = document.createElement('input');
    yRange.type = 'range';
    yRange.min = 0;
    yRange.max = 100;
    yRange.value = img.y;
    yRange.addEventListener('input', () => {
      img.y = parseInt(yRange.value);
      yVal.textContent = img.y;
      updateScene();
    });
    yField.appendChild(yRange);

    const sField = document.createElement('div');
    sField.className = 'field';
    const sVal = document.createElement('span');
    sVal.textContent = img.scale.toFixed(2);
    sField.innerHTML = `<label>Size</label>`;
    sField.appendChild(sVal);
    const sRange = document.createElement('input');
    sRange.type = 'range';
    sRange.min = 0.1;
    sRange.max = 2;
    sRange.step = 0.05;
    sRange.value = img.scale;
    sRange.addEventListener('input', () => {
      img.scale = parseFloat(sRange.value);
      sVal.textContent = img.scale.toFixed(2);
      updateScene();
    });
    sField.appendChild(sRange);

    const vField = document.createElement('div');
    vField.className = 'field';
    const vLabel = document.createElement('label');
    const vCheck = document.createElement('input');
    vCheck.type = 'checkbox';
    vCheck.checked = img.visible;
    vCheck.addEventListener('change', () => {
      img.visible = vCheck.checked;
      updateScene();
    });
    vLabel.appendChild(vCheck);
    vLabel.appendChild(document.createTextNode(' Visible'));
    vField.appendChild(vLabel);

    controls.appendChild(xField);
    controls.appendChild(yField);
    controls.appendChild(sField);
    controls.appendChild(vField);

    item.appendChild(header);
    item.appendChild(controls);
    imageList.appendChild(item);
  });
}

function setupUI() {
  const shapeBtns = document.querySelectorAll('.shape-btn');
  shapeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.shape = btn.dataset.shape;
      updateScene();
    });
  });

  const update = () => {
    state.name = brandInput.value || 'Orange Soda';
    state.tagline = taglineInput.value || '';
    state.bgColor = bgPicker.value;
    state.textColor = textPicker.value;
    state.fontBrand = fontBrandSelect.value;
    state.fontTagline = fontTaglineSelect.value;
    state.brandFontScale = parseFloat(brandSizeRange.value);
    state.taglineFontScale = parseFloat(taglineSizeRange.value);
    state.brandX = parseInt(brandXRange.value);
    state.brandY = parseInt(brandYRange.value);
    state.taglineX = parseInt(taglineXRange.value);
    state.taglineY = parseInt(taglineYRange.value);
    if (brandSizeVal) brandSizeVal.textContent = state.brandFontScale.toFixed(1);
    if (taglineSizeVal) taglineSizeVal.textContent = state.taglineFontScale.toFixed(1);
    if (brandXVal) brandXVal.textContent = state.brandX;
    if (brandYVal) brandYVal.textContent = state.brandY;
    if (taglineXVal) taglineXVal.textContent = state.taglineX;
    if (taglineYVal) taglineYVal.textContent = state.taglineY;
    state.nutritionX = parseInt(nutritionXRange.value);
    state.nutritionY = parseInt(nutritionYRange.value);
    state.nutritionW = parseInt(nutritionWRange.value);
    state.nutritionTextSize = parseFloat(nutritionTextRange.value);
    if (nutritionXVal) nutritionXVal.textContent = state.nutritionX;
    if (nutritionYVal) nutritionYVal.textContent = state.nutritionY;
    if (nutritionWVal) nutritionWVal.textContent = state.nutritionW;
    if (nutritionTextVal) nutritionTextVal.textContent = state.nutritionTextSize.toFixed(1);
    updateScene();
  };

  brandInput.addEventListener('input', update);
  taglineInput.addEventListener('input', update);
  bgPicker.addEventListener('input', update);
  textPicker.addEventListener('input', update);
  fontBrandSelect.addEventListener('change', update);
  fontTaglineSelect.addEventListener('change', update);
  brandSizeRange.addEventListener('input', update);
  taglineSizeRange.addEventListener('input', update);
  brandXRange.addEventListener('input', update);
  brandYRange.addEventListener('input', update);
  taglineXRange.addEventListener('input', update);
  taglineYRange.addEventListener('input', update);
  nutritionXRange.addEventListener('input', update);
  nutritionYRange.addEventListener('input', update);
  nutritionWRange.addEventListener('input', update);
  nutritionTextRange.addEventListener('input', update);

  exportBtn.addEventListener('click', exportPNG);
  if (exportModelBtn) exportModelBtn.addEventListener('click', exportModel);
  if (saveBtn) saveBtn.addEventListener('click', saveProject);
  if (loadInput) {
    loadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      loadProject(file).then(() => {
        loadInput.value = '';
      });
    });
  }

  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (fe) => {
        const bytes = new Uint8Array(fe.target.result);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        state.importedModelData = btoa(binary);
        const loader = new GLTFLoader();
        loader.loadAsync(url).then((gltf) => {
          URL.revokeObjectURL(url);
          state.importedModel = gltf.scene;
          state.useImported = true;
          state.shape = 'imported';
          updateScene();
        }).catch((err) => {
          URL.revokeObjectURL(url);
          console.error('Import error:', err);
          alert('Failed to import model');
        });
      };
      reader.readAsArrayBuffer(file);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.useImported = false;
      state.importedModel = null;
      state.shape = 'bottle';
      document.querySelectorAll('.shape-btn').forEach((b) => b.classList.toggle('active', b.dataset.shape === 'bottle'));
      updateScene();
      if (importInput) importInput.value = '';
    });
  }

  addImageBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = () => {
          state.images.push({
            id: Date.now() + Math.random(),
            img,
            dataUrl,
            x: 50,
            y: 50,
            scale: 0.5,
            visible: true,
          });
          renderImageList();
          updateScene();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });

  if (nutritionToggle) {
    nutritionToggle.addEventListener('change', () => {
      state.showNutrition = nutritionToggle.checked;
      updateScene();
    });
  }

  document.querySelectorAll('.nf-input').forEach((el) => {
    el.addEventListener('input', () => {
      state.nutrition[el.dataset.field] = el.value;
      updateScene();
    });
  });

  if (ingrToggle) {
    ingrToggle.addEventListener('change', () => {
      state.showIngredients = ingrToggle.checked;
      updateScene();
    });
  }

  if (ingrText) {
    ingrText.addEventListener('input', () => {
      state.ingredients = ingrText.value;
      updateScene();
    });
  }

  for (const t of templates) {
    const card = document.createElement('button');
    card.className = 'template-card';
    card.style.setProperty('--bg', t.bgColor);
    card.style.setProperty('--accent', t.accentColor);

    const preview = document.createElement('span');
    preview.className = 'template-preview';
    preview.style.background = `linear-gradient(135deg, ${t.bgColor}, ${t.accentColor})`;

    const name = document.createElement('span');
    name.className = 'template-name';
    name.textContent = t.name;

    card.appendChild(preview);
    card.appendChild(name);

    card.addEventListener('click', () => {
      brandInput.value = t.name;
      taglineInput.value = t.tagline;
      bgPicker.value = t.bgColor;
      textPicker.value = t.textColor;

      const targetShape = t.defaultShape || 'bottle';
      shapeBtns.forEach((b) => b.classList.toggle('active', b.dataset.shape === targetShape));
      state.shape = targetShape;
      state.name = t.name;
      state.tagline = t.tagline;
      state.bgColor = t.bgColor;
      state.textColor = t.textColor;

      updateScene();
    });

    templateGrid.appendChild(card);
  }
}

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function init() {
  await loadModels();
  setupUI();
  updateScene();
  animate();
  onResize();
}

init();
