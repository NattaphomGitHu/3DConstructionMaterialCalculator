// --- SECURITY & PROTECTION (ANTI-COPY MEASURES) ---
// ป้องกันการคลิกขวา
document.addEventListener('contextmenu', event => event.preventDefault());

// ป้องกันปุ่มลัด (F12, Ctrl+U, Ctrl+Shift+I)
document.addEventListener('keydown', function(event) {
    if(event.keyCode == 123) { // F12
        event.preventDefault();
        return false;
    }
    if(event.ctrlKey && event.shiftKey && event.keyCode == 73){ // Ctrl+Shift+I
        event.preventDefault();
        return false;
    }
    if(event.ctrlKey && event.keyCode == 85) { // Ctrl+U
        event.preventDefault();
        return false;
    }
});

// --- ORIGINAL CODE START ---
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- GUI UTILS ---
window.toggleWindow = function(id) {
    const el = document.getElementById(id);
    if(el.style.display === 'flex' || el.style.display === 'block') {
        el.style.display = 'none';
    } else {
        el.style.display = 'flex';
        bringToFront(el);
    }
    updateTaskbar();
};

window.closeWindow = function(id) {
    document.getElementById(id).style.display = 'none';
    updateTaskbar();
};

window.minimizeWindow = function(id) {
    const el = document.getElementById(id);
    const content = el.querySelector('.window-content');
    if(content.style.display === 'none') {
        content.style.display = 'block';
        el.style.height = el.dataset.prevHeight || 'auto';
    } else {
        el.dataset.prevHeight = el.style.height;
        content.style.display = 'none';
        el.style.height = 'auto';
    }
};

function updateTaskbar() {
    const panels = ['panel-tools', 'panel-outliner', 'panel-calc', 'panel-mat-manager'];
    const btns = ['tb-tools', 'tb-outliner', 'tb-calc', 'tb-mat'];
    panels.forEach((pid, idx) => {
        const el = document.getElementById(pid);
        const btn = document.getElementById(btns[idx]);
        if(el.style.display === 'flex' || el.style.display === 'block') btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function bringToFront(el) {
    document.querySelectorAll('.window-panel').forEach(p => p.style.zIndex = 10);
    el.style.zIndex = 11;
}

function makeDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "-header");
    if (header) header.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToFront(elmnt);
    }
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

makeDraggable(document.getElementById("panel-tools"));
makeDraggable(document.getElementById("panel-outliner"));
makeDraggable(document.getElementById("panel-calc"));
makeDraggable(document.getElementById("panel-mat-manager"));


// --- MATERIAL DATABASE SYSTEM (FIXED HEIGHT) ---
let materialDB = {
    'brick':  { 
        id: 'brick', name: 'Red Brick (อิฐมอญ)', color: '#bf5b5b', 
        calcType: 'unit', unitW: 6.5, unitH: 4.0, unitL: 14, gap: 1.5,
        unitsPerSqm: 117, mortarPerSqm: 0.15, sandPerSqm: 0.04 
    },
    'block':  { 
        id: 'block', name: 'Concrete Block (อิฐบล็อก)', color: '#95a5a6', 
        calcType: 'unit', unitW: 7.0, unitH: 19.0, unitL: 39, gap: 1.0, 
        unitsPerSqm: 12.5, mortarPerSqm: 0.12, sandPerSqm: 0.03 
    },
    'light':  { 
        id: 'light', name: 'Lightweight (อิฐมวลเบา)', color: '#ecf0f1', 
        calcType: 'unit', unitW: 7.5, unitH: 20.0, unitL: 60, gap: 0.3,
        unitsPerSqm: 8.33, mortarPerSqm: 0.10, sandPerSqm: 0 
    },
    'rammed': { 
        id: 'rammed', name: 'Rammed Earth (กำแพงดิน)', color: '#795548', 
        calcType: 'volume', 
        unitsPerSqm: 0, mortarPerSqm: 0, sandPerSqm: 0 
    }
};

const domMatSelect = document.getElementById('mat-manager-select');
const domPropSelect = document.getElementById('prop-wall-type');
const domFilterContainer = document.getElementById('filter-container');

const inpId = document.getElementById('edt-mat-name'); 
const inpColor = document.getElementById('edt-mat-color');

// FIXED: Declare all inputs including H
const inpW = document.getElementById('edt-mat-w');
const inpH = document.getElementById('edt-mat-h');
const inpL = document.getElementById('edt-mat-l');
const inpGap = document.getElementById('edt-mat-gap');

const inpMortar = document.getElementById('edt-mat-mortar');
const inpSand = document.getElementById('edt-mat-sand');
const spanCalc = document.getElementById('edt-calc-preview');

function populateMaterialUI() {
    domMatSelect.innerHTML = '<option value="">-- Select to Edit --</option>';
    domPropSelect.innerHTML = '';
    domFilterContainer.innerHTML = '<button class="filter-btn active" onclick="filterView(\'all\')" id="flt-all">All</button>';

    for (let key in materialDB) {
        const mat = materialDB[key];
        
        const opt1 = document.createElement('option');
        opt1.value = key;
        opt1.textContent = mat.name;
        domMatSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = key;
        opt2.textContent = mat.name;
        domPropSelect.appendChild(opt2);

        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = mat.name.split(' ')[0]; 
        btn.style.color = mat.color;
        btn.onclick = () => window.filterView(key);
        domFilterContainer.appendChild(btn);
    }
}

// FIXED: New Calculation Formula (Length * Height)
function calcUnitsPreview() {
    const w = parseFloat(inpW.value) || 0;
    const h = parseFloat(inpH.value) || 0;
    const l = parseFloat(inpL.value) || 0;
    const gap = parseFloat(inpGap.value) || 0;

    if (h > 0 && l > 0) {
        // Area of one unit face (cm^2) = (L+Gap) * (H+Gap)
        const unitArea = (l + gap) * (h + gap);
        const units = 10000 / unitArea; 
        spanCalc.textContent = units.toFixed(2);
        return units;
    }
    spanCalc.textContent = "0";
    return 0;
}

// FIXED: Listen to H as well
[inpW, inpH, inpL, inpGap].forEach(el => el.addEventListener('input', calcUnitsPreview));

domMatSelect.addEventListener('change', () => {
    const key = domMatSelect.value;
    if(!key) return;
    const mat = materialDB[key];
    
    inpId.value = mat.name;
    inpColor.value = mat.color;
    
    if(mat.calcType === 'unit') {
        inpW.value = mat.unitW || 0;
        inpH.value = mat.unitH || 0; // Load H
        inpL.value = mat.unitL || 0;
        inpGap.value = mat.gap || 0;
        spanCalc.textContent = mat.unitsPerSqm.toFixed(2);
    } else {
        inpW.value = 0; inpH.value = 0; inpL.value = 0; inpGap.value = 0;
        spanCalc.textContent = "N/A (Volume Based)";
    }

    inpMortar.value = mat.mortarPerSqm;
    inpSand.value = mat.sandPerSqm;
    document.getElementById('btn-delete-mat').style.display = 'block';
});

document.getElementById('btn-create-new-mat').onclick = () => {
    domMatSelect.value = "";
    inpId.value = "New Material";
    inpColor.value = "#ffffff";
    inpW.value = 7;
    inpH.value = 4;
    inpL.value = 15;
    inpGap.value = 1.5;
    inpMortar.value = 0.1;
    inpSand.value = 0.05;
    calcUnitsPreview();
};

document.getElementById('btn-save-mat').onclick = () => {
    const name = inpId.value;
    if(!name) return alert("Name is required");

    let id = domMatSelect.value;
    if (!id) id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

    const units = parseFloat(spanCalc.textContent) || 0;
    
    const newMat = {
        id: id,
        name: name,
        color: inpColor.value,
        calcType: (units > 0) ? 'unit' : 'volume',
        unitW: parseFloat(inpW.value),
        unitH: parseFloat(inpH.value), // Save H
        unitL: parseFloat(inpL.value),
        gap: parseFloat(inpGap.value),
        unitsPerSqm: units,
        mortarPerSqm: parseFloat(inpMortar.value) || 0,
        sandPerSqm: parseFloat(inpSand.value) || 0
    };

    materialDB[id] = newMat;
    
    populateMaterialUI();
    domMatSelect.value = id; 
    
    objects.forEach(obj => {
        if(obj.userData.wallType === id) {
            obj.material.color.set(newMat.color);
        }
    });
    refreshObjectList();
    alert("Material Saved!");
};

document.getElementById('btn-delete-mat').onclick = () => {
    const id = domMatSelect.value;
    if(!id) return;
    if(confirm("Delete this material? Objects using it may break.")) {
        delete materialDB[id];
        populateMaterialUI();
        domMatSelect.value = "";
    }
};

populateMaterialUI();


// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; 
container.appendChild(labelRenderer.domElement);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 8, 10);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

let gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
scene.add(gridHelper);
scene.add(new THREE.AxesHelper(2));

const raycasterPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false }));
raycasterPlane.rotation.x = -Math.PI / 2; 
scene.add(raycasterPlane);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;

const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', (e) => {
    orbit.enabled = !e.value;
    if(e.value && selectedObject) {
        lastSafePosition.copy(selectedObject.position);
        lastSafeScale.copy(selectedObject.scale);
    }
    if (!e.value) updateBrickVisuals();
});
scene.add(transformControl);

let objects = [];
let selectedObject = null;
let isDrawMode = false;
let drawPoints = [];
let drawMarkers = [];
let drawLineRef = null;
let outlineHelper = null;
let currentDrawAxis = 'XZ'; 
let isCollisionEnabled = false;
let currentCalcMode = 'none'; 
const lastSafePosition = new THREE.Vector3();
const lastSafeScale = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- DIMENSION LABELS ---
const dimLabels = {
    x: createDimensionInput('x'),
    y: createDimensionInput('y'),
    z: createDimensionInput('z')
};

document.getElementById('chk-collision').addEventListener('change', (e) => isCollisionEnabled = e.target.checked);

document.getElementById('chk-show-bricks').addEventListener('change', (e) => {
    if (selectedObject) {
        // บันทึกสถานะลงในวัตถุ ว่าตัวนี้ต้องการโชว์อิฐหรือไม่
        selectedObject.userData.showBricks = e.target.checked;
        updateBrickVisuals(selectedObject);
    }
});

transformControl.addEventListener('change', () => {
    if (!selectedObject) return;
    if (isCollisionEnabled && transformControl.dragging) {
        const selectedBox = new THREE.Box3().setFromObject(selectedObject);
        let isColliding = false;
        for (let other of objects) {
            if (other === selectedObject || !other.visible) continue;
            const otherBox = new THREE.Box3().setFromObject(other);
            if (selectedBox.intersectsBox(otherBox)) { isColliding = true; break; }
        }
        if (isColliding) {
            selectedObject.position.copy(lastSafePosition);
            selectedObject.scale.copy(lastSafeScale);
        } else {
            lastSafePosition.copy(selectedObject.position);
            lastSafeScale.copy(selectedObject.scale);
        }
    }
    if(!transformControl.dragging) updateBrickVisuals();
    updatePosInputsFromObject();
    updateDimensionLabels();
    updateRealtimeCalc();
});

function createDimensionInput(axis) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = `dimension-input label-${axis}`;
    
    input.addEventListener('change', () => {
        if(!selectedObject) return;
        const newSize = parseFloat(input.value);
        if(!isNaN(newSize) && newSize > 0) resizeObject(selectedObject, axis, newSize);
    });
    input.addEventListener('pointerdown', (e) => e.stopPropagation()); 
    input.addEventListener('mousedown', (e) => e.stopPropagation()); 
    input.addEventListener('keydown', (e) => e.stopPropagation());

    const obj = new CSS2DObject(input);
    obj.visible = false;
    scene.add(obj);
    return { dom: input, obj: obj };
}

function updateDimensionLabels() {
    if (!selectedObject || !selectedObject.visible) {
        Object.values(dimLabels).forEach(l => l.obj.visible = false);
        return;
    }
    const box = new THREE.Box3().setFromObject(selectedObject);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    if(document.activeElement !== dimLabels.x.dom) dimLabels.x.dom.value = size.x.toFixed(2);
    if(document.activeElement !== dimLabels.y.dom) dimLabels.y.dom.value = size.y.toFixed(2);
    if(document.activeElement !== dimLabels.z.dom) dimLabels.z.dom.value = size.z.toFixed(2);

    dimLabels.x.obj.position.set(center.x, center.y - size.y/2 - 0.5, center.z + size.z/2);
    dimLabels.y.obj.position.set(center.x + size.x/2 + 0.5, center.y, center.z + size.z/2);
    dimLabels.z.obj.position.set(center.x - size.x/2, center.y - size.y/2 - 0.5, center.z);
    Object.values(dimLabels).forEach(l => l.obj.visible = true);
}

function resizeObject(obj, axis, targetSize) {
    const box = new THREE.Box3().setFromObject(obj);
    const currentSize = new THREE.Vector3();
    box.getSize(currentSize);
    if(axis === 'x' && currentSize.x > 0) obj.scale.x *= (targetSize / currentSize.x);
    if(axis === 'y' && currentSize.y > 0) obj.scale.y *= (targetSize / currentSize.y);
    if(axis === 'z' && currentSize.z > 0) obj.scale.z *= (targetSize / currentSize.z);
    updateDimensionLabels();
    updateRealtimeCalc();
    updateBrickVisuals();
}

// --- BRICK VISUALIZER ---
let brickInstanceMesh = null;
function updateBrickVisuals(targetObj) {
    const obj = targetObj || selectedObject;
    if (!obj) return;

    // 1. ลบ Brick Mesh ตัวเก่าทิ้งก่อน
    if (obj.userData.brickMesh) {
        scene.remove(obj.userData.brickMesh);
        if(obj.userData.brickMesh.geometry) obj.userData.brickMesh.geometry.dispose();
        obj.userData.brickMesh = null;
    }

    // 2. ถ้าไม่ได้เปิดโชว์อิฐ ให้กลับมาแสดงกำแพงทึบปกติ
    if (!obj.userData.showBricks) {
        obj.material.visible = true; // [แก้ไข] โชว์ผิว
        return;
    }

    // 3. ถ้าเปิดโชว์อิฐ: สั่งให้กำแพงทึบ "ล่องหน" แต่ "คลิกได้"
    obj.material.visible = false; // [แก้ไข] ซ่อนผิว แต่ตัววัตถุ (obj.visible) ยังเป็น true อยู่

    // ถ้าวัตถุหลักถูกปิดตาอยู่ (Eye off) ก็ไม่ต้องสร้างอิฐ
    if (obj.visible === false) return;

    const type = obj.userData.wallType;
    const matData = materialDB[type];
    
    if (!matData || matData.calcType === 'volume') {
        obj.material.visible = true; // [แก้ไข] Volume ให้โชว์ก้อนทึบ
        return;
    }

    // --- คำนวณตำแหน่งอิฐ (Code เดิม) ---
    obj.geometry.computeBoundingBox();
    const bbox = obj.geometry.boundingBox;
    const baseW = bbox.max.x - bbox.min.x; 
    const baseH = bbox.max.y - bbox.min.y; 
    const baseD = bbox.max.z - bbox.min.z; 

    const realW = baseW * obj.scale.x;
    const realH = baseH * obj.scale.y;
    const realD = baseD * obj.scale.z;

    const gap = (matData.gap || 1.0) / 100; 
    const uL = (matData.unitL || 20) / 100;     
    const uH = (matData.unitH || 10) / 100;     
    const uThick = (matData.unitW || 7.0) / 100; 

    const cols = Math.ceil(realW / (uL + gap));
    const rows = Math.ceil(realH / (uH + gap));
    let layers = Math.floor(realD / (uThick + gap));
    if (layers < 1) layers = 1;

    const count = cols * rows * layers; 
    if (count <= 0) return;

    const geometry = new THREE.BoxGeometry(uL, uH, uThick);
    const material = new THREE.MeshLambertMaterial({ color: matData.color });
    
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    
    const dummy = new THREE.Object3D();
    let index = 0;
    const startX = -(realW / 2) + (uL / 2);
    const startY = -(realH / 2) + (uH / 2);
    const totalStackThick = (layers * uThick) + ((layers - 1) * gap);
    const startZ = -(totalStackThick / 2) + (uThick / 2);

    for (let r = 0; r < rows; r++) {     
        for (let c = 0; c < cols; c++) { 
            let stagger = 0;
            if (r % 2 !== 0) stagger = uL / 2;
            const posX = startX + (c * (uL + gap)) - stagger;
            const posY = startY + (r * (uH + gap));

            if (posX < -(realW/2) - uL/2 || posX > (realW/2) + uL/2) continue;
            if (posY > (realH/2) + uH/2) continue;

            for (let l = 0; l < layers; l++) {
                const posZ = startZ + (l * (uThick + gap));
                dummy.position.set(posX, posY, posZ); 
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                mesh.setMatrixAt(index++, dummy.matrix);
            }
        }
    }

    mesh.position.copy(obj.position);
    mesh.quaternion.copy(obj.quaternion); 
    mesh.scale.set(1, 1, 1); 
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);
    obj.userData.brickMesh = mesh;
}

// --- OBJECT MANAGEMENT ---
function addMesh(mesh, name, type = 'brick') {
    mesh.userData.name = name || `Wall ${objects.length+1}`;
    mesh.userData.wallType = type;
    if (materialDB[type]) mesh.material.color.set(materialDB[type].color);
    scene.add(mesh);
    objects.push(mesh);
    refreshObjectList();
    selectObject(mesh);
}

function selectObject(obj) {
    if (selectedObject && selectedObject !== obj) {
        selectedObject.visible = true;
    }
    selectedObject = obj;
    updateSelectionOutline(obj); 
    
    // --- [แก้ไข] ประกาศตัวแปร propsPanel และ chkBricks ตรงนี้ ---
    const propsPanel = document.getElementById('properties-panel');
    const chkBricks = document.getElementById('chk-show-bricks'); 
    // --------------------------------------------------------

    if(obj) {
        if(!obj.visible && !obj.userData.showBricks) {
            transformControl.detach();
            updateDimensionLabels();
            propsPanel.style.display = 'none';
            return;
        }
        transformControl.attach(obj);
        lastSafePosition.copy(obj.position);
        lastSafeScale.copy(obj.scale);
        updateDimensionLabels();
        updatePosInputsFromObject();
        propsPanel.style.display = 'block';
        domPropSelect.value = obj.userData.wallType;

        // ตอนนี้ตัวแปร chkBricks รู้จักแล้ว จะไม่ error ครับ
        chkBricks.checked = (obj.userData.showBricks === true);
    } else {
        transformControl.detach();
        updateDimensionLabels();
        propsPanel.style.display = 'none';
        chkBricks.checked = false;
    }
    refreshObjectList();
    updateBrickVisuals();
}

function updateSelectionOutline(obj) {
    if (outlineHelper) {
        scene.remove(outlineHelper);
        if (outlineHelper.geometry) outlineHelper.geometry.dispose();
        outlineHelper = null;
    }
    if (!obj) return;
    const edges = new THREE.EdgesGeometry(obj.geometry); 
    const lineMat = new THREE.LineBasicMaterial({ 
        color: 0xffff00, depthTest: false, depthWrite: false, linewidth: 2
    });
    outlineHelper = new THREE.LineSegments(edges, lineMat);
    outlineHelper.renderOrder = 999;
    scene.add(outlineHelper);
}

domPropSelect.addEventListener('change', function() {
    if(selectedObject) {
        const newType = this.value;
        selectedObject.userData.wallType = newType;
        if(materialDB[newType]) selectedObject.material.color.set(materialDB[newType].color);
        refreshObjectList();
    }
});

document.getElementById('btn-calc-single').onclick = function() {
    if(selectedObject) calculateSingleMaterial(selectedObject);
}

function refreshObjectList() {
    const list = document.getElementById('object-list');
    list.innerHTML = '';
    objects.forEach(obj => {
        const li = document.createElement('li');
        if(selectedObject === obj) li.classList.add('selected');
        
        const typeName = materialDB[obj.userData.wallType] ? materialDB[obj.userData.wallType].name : "Unknown";
        const nameSpan = document.createElement('span');
        nameSpan.className = 'obj-name';
        nameSpan.textContent = `${obj.userData.name} (${typeName.split(' ')[0]})`;
        nameSpan.title = "Double click to rename";
        
        const startEdit = () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'obj-name-edit';
            input.value = obj.userData.name;
            input.onclick = (e) => e.stopPropagation(); 
            const saveName = () => {
                if(input.value.trim() !== "") obj.userData.name = input.value;
                refreshObjectList();
            };
            input.onblur = saveName;
            input.onkeydown = (k) => { if(k.key === 'Enter') saveName(); };
            nameSpan.style.display = 'none';
            li.insertBefore(input, iconsDiv);
            input.focus();
        };
        li.ondblclick = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.classList.contains('icon-btn')) return;
            selectObject(obj);
        };
        
        const iconsDiv = document.createElement('div');
        iconsDiv.className = 'list-icon-group';
        const createIcon = (text, cls, title, action) => {
            const btn = document.createElement('span');
            btn.className = `icon-btn ${cls}`;
            btn.textContent = text;
            btn.title = title;
            if(text === '❌') btn.style.color = '#e74c3c';
            btn.onclick = (e) => { e.stopPropagation(); action(e); };
            return btn;
        };

        iconsDiv.appendChild(createIcon('✎', 'icon-edit', 'Rename', startEdit));
        iconsDiv.appendChild(createIcon('🔢', 'icon-calc', 'Calculate', () => calculateSingleMaterial(obj)));

        const visIcon = obj.visible ? '👁️' : '🕶️'; 
        const visClass = obj.visible ? '' : 'off';
        
        iconsDiv.appendChild(createIcon(visIcon, `icon-vis ${visClass}`, 'Toggle Visibility', () => {
            // [แก้ไข] Toggle Visibility logic
            obj.visible = !obj.visible;
            
            // สั่งเปิด/ปิด อิฐลูกด้วย (ถ้ามี)
            if (obj.userData.brickMesh) {
                obj.userData.brickMesh.visible = obj.visible;
            }

            // ถ้าสั่งเปิดกลับมา แล้ววัตถุนี้ต้องโชว์อิฐ -> ต้องแน่ใจว่ากำแพงแม่ซ่อนผิว (material) อยู่
            if (obj.visible && obj.userData.showBricks) {
                    obj.material.visible = false;
            } else if (obj.visible && !obj.userData.showBricks) {
                    obj.material.visible = true;
            }

            if(!obj.visible && selectedObject === obj) selectObject(null);
            refreshObjectList();
        }));
        iconsDiv.appendChild(createIcon('❌', '', 'Delete', () => {
            // 1. เช็คก่อนว่ามีอิฐ (Brick Mesh) ค้างอยู่ไหม ถ้ามีให้ลบออกก่อน
            if (obj.userData.brickMesh) {
                    scene.remove(obj.userData.brickMesh);
                    if(obj.userData.brickMesh.geometry) obj.userData.brickMesh.geometry.dispose();
                    obj.userData.brickMesh = null;
            }

            // 2. ลบตัวกำแพงหลัก (ตัวแม่)
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose(); // คืนหน่วยความจำ

            // 3. อัปเดตรายการและตัวแปร
            objects = objects.filter(o => o !== obj);
            
            // ถ้าตัวที่ลบคือตัวที่เลือกอยู่ ให้ยกเลิกการเลือก
            if(selectedObject === obj) selectObject(null);
            
            refreshObjectList();
        }));

        li.appendChild(nameSpan);
        li.appendChild(iconsDiv);
        list.appendChild(li);
    });
}

window.filterView = function(type) {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(b => b.classList.remove('active'));
    objects.forEach(obj => {
        if(type === 'all') obj.visible = true;
        else obj.visible = (obj.userData.wallType === type);
    });
    if(selectedObject && !selectedObject.visible) selectObject(null);
    refreshObjectList();
};

// --- BLUEPRINT DRAWING ---
function setDrawPlane(axis) {
    currentDrawAxis = axis;
    document.getElementById('plane-top').style.background = (axis === 'XZ') ? '#d35400' : '#444';
    document.getElementById('plane-front').style.background = (axis === 'XY') ? '#d35400' : '#444';
    document.getElementById('plane-side').style.background = (axis === 'YZ') ? '#d35400' : '#444';

    scene.remove(gridHelper);
    if (axis === 'XZ') {
        raycasterPlane.rotation.set(-Math.PI/2, 0, 0);
        gridHelper = new THREE.GridHelper(20, 20);
        gridHelper.rotation.set(0,0,0);
    } else if (axis === 'XY') {
        raycasterPlane.rotation.set(0, 0, 0);
        gridHelper = new THREE.GridHelper(20, 20);
        gridHelper.rotation.set(-Math.PI/2, 0, 0);
    } else if (axis === 'YZ') {
        raycasterPlane.rotation.set(0, -Math.PI/2, 0);
        gridHelper = new THREE.GridHelper(20, 20);
        gridHelper.rotation.set(0, 0, -Math.PI/2);
    }
    scene.add(gridHelper);
    clearDrawCache();
}

function handleCanvasClick(event) {
    if (event.target.closest('.window-panel') || event.target.closest('#taskbar') || event.target.tagName === 'INPUT') return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (isDrawMode) {
        const intersects = raycaster.intersectObject(raycasterPlane);
        if (intersects.length > 0) {
            const pt = intersects[0].point;
            pt.x = Math.round(pt.x * 2) / 2;
            pt.y = Math.round(pt.y * 2) / 2;
            pt.z = Math.round(pt.z * 2) / 2;
            addDrawPoint(pt);
        }
    } else {
        if(transformControl.dragging) return;
        const visibleObjs = objects.filter(o => o.visible);
        const intersects = raycaster.intersectObjects(visibleObjs);
        if (intersects.length > 0) selectObject(intersects[0].object);
        else selectObject(null);
    }
}

function addDrawPoint(pt) {
    drawPoints.push(pt);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({color: 0xe67e22}));
    marker.position.copy(pt);
    scene.add(marker);
    drawMarkers.push(marker);
    if (drawPoints.length > 1) {
        if (drawLineRef) scene.remove(drawLineRef);
        const geo = new THREE.BufferGeometry().setFromPoints(drawPoints);
        drawLineRef = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe67e22 }));
        scene.add(drawLineRef);
    }
}

function finishExtrude() {
    if (drawPoints.length < 3) return;
    const shape = new THREE.Shape();
    if (currentDrawAxis === 'XZ') {
        shape.moveTo(drawPoints[0].x, drawPoints[0].z);
        for(let i=1; i<drawPoints.length; i++) shape.lineTo(drawPoints[i].x, drawPoints[i].z);
    } else if (currentDrawAxis === 'XY') {
        shape.moveTo(drawPoints[0].x, drawPoints[0].y);
        for(let i=1; i<drawPoints.length; i++) shape.lineTo(drawPoints[i].x, drawPoints[i].y);
    } else if (currentDrawAxis === 'YZ') {
        shape.moveTo(drawPoints[0].z, drawPoints[0].y);
        for(let i=1; i<drawPoints.length; i++) shape.lineTo(drawPoints[i].z, drawPoints[i].y);
    }

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }); 
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff }); 
    if (currentDrawAxis === 'XZ') geometry.rotateX(Math.PI / 2);
    else if (currentDrawAxis === 'YZ') geometry.rotateY(Math.PI / 2);

    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center); 
    addMesh(mesh, "Custom Wall", "brick"); 
    toggleDrawMode(false);
}

function clearDrawCache() {
    drawPoints = [];
    drawMarkers.forEach(m => scene.remove(m));
    drawMarkers = [];
    if(drawLineRef) scene.remove(drawLineRef);
    drawLineRef = null;
}

function toggleDrawMode(forceState) {
    isDrawMode = (typeof forceState === 'boolean') ? forceState : !isDrawMode;
    const btn = document.getElementById('btn-draw-mode');
    const panel = document.getElementById('plane-selector');
    if(isDrawMode) {
        btn.classList.add('active');
        panel.style.display = 'block';
        selectObject(null);
        setDrawPlane('XZ'); 
        document.body.style.cursor = 'crosshair';
    } else {
        btn.classList.remove('active');
        panel.style.display = 'none';
        clearDrawCache();
        scene.remove(gridHelper);
        gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
        scene.add(gridHelper);
        raycasterPlane.rotation.set(-Math.PI/2, 0, 0);
        document.body.style.cursor = 'default';
    }
}

// --- CALCULATION LOGIC ---
function getMaterialReportHTML(key, data, isSingle = false) {
        if(data.area === 0) return "";
    let detail = "";
    const area = data.area;
    const vol = data.vol;
    
    const mat = materialDB[key];
    if (!mat) return "";

    if (mat.calcType === 'volume') {
        const totalVol = vol * 1.3; 
        const part = totalVol / 6;
        detail = `
        <table>
            <tr><th>Material</th><th>Amount</th></tr>
            <tr><td>Soil</td><td>${(part*3).toFixed(2)} m³</td></tr>
            <tr><td>Sand</td><td>${(part*2).toFixed(2)} m³</td></tr>
            <tr><td>Cement</td><td>${(part*1 * 1440 / 50).toFixed(1)} Bags</td></tr>
        </table>`;
    } else {
        // Unit based WITH LAYERS
        const units = (data.count !== undefined) ? data.count : (area * mat.unitsPerSqm);
        const mortar = area * mat.mortarPerSqm;
        const sand = area * mat.sandPerSqm;
        const plasterCement = (area * 2) / 2.5;

        detail = `
        <table>
            <tr><th>Material</th><th>Qty</th></tr>
            <tr><td>Unit (${mat.name})</td><td>${Math.ceil(units)} pcs</td></tr>
            <tr><td>Cement (Mortar)</td><td>${Math.ceil(mortar)} Bags</td></tr>
            <tr><td>Sand (Mortar)</td><td>${sand.toFixed(2)} m³</td></tr>
            <tr style="color:#aaa;"><td>*Plaster Cement</td><td>${Math.ceil(plasterCement)} Bags</td></tr>
        </table>`;
    }
    const headerText = isSingle ? `Target: ${mat.name}` : mat.name;
    return `
        <div style="background:#333; padding:8px; border-radius:4px; margin-bottom:10px; border-left:4px solid ${mat.color}">
            <h3 style="margin-top:0;">${headerText}</h3>
            <div style="font-size:12px;">Area: ${area.toFixed(2)} m² | Vol: ${vol.toFixed(2)} m³</div>
            ${detail}
        </div>
    `;
}

let lastCalcUUID = null;

window.calculateSingleMaterial = function(obj) {
    if(!obj) return;
    const el = document.getElementById('panel-calc');
    
    // Toggle Logic
    const isOpen = el.style.display === 'flex';
    if (isOpen && currentCalcMode === 'single' && lastCalcUUID === obj.uuid) {
        window.closeWindow('panel-calc');
        lastCalcUUID = null; 
        return;
    }
    lastCalcUUID = obj.uuid;
    currentCalcMode = 'single';
    if(!isOpen) {
        el.style.display = 'flex';
        bringToFront(el);
        updateTaskbar();
    }
    
    const type = obj.userData.wallType;
    const mat = materialDB[type];

    // 1. คำนวณ Dimensions & Area
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);

    const area = Math.max(size.x, size.z) * size.y;
    const volume = area * Math.min(size.x, size.z);
    
    let layers = 1;
    let visualUnits = 0;   // นับจาก 3D
    let standardUnits = 0; // คำนวณจากสูตร
    
    let table3DHTML = "";

    // 2. Logic การคำนวณ
    if (mat && mat.calcType === 'unit') {
        const realW = Math.max(size.x, size.z); 
        const realH = size.y;                  
        const realD = Math.min(size.x, size.z); 
        
        const gap = (mat.gap || 1.0) / 100;
        const uL = (mat.unitL || 20) / 100;
        const uH = (mat.unitH || 10) / 100;
        const uThick = (mat.unitW || 7.0) / 100;

        const cols = Math.ceil(realW / (uL + gap));
        const rows = Math.ceil(realH / (uH + gap));
        
        layers = Math.floor(realD / (uThick + gap));
        if (layers < 1) layers = 1;

        // A. คำนวณแบบ Simulation (นับจาก 3D)
        let count = 0;
        const startX = -(realW / 2) + (uL / 2);
        const startY = -(realH / 2) + (uH / 2);

        for (let r = 0; r < rows; r++) {     
            for (let c = 0; c < cols; c++) { 
                let stagger = 0;
                if (r % 2 !== 0) stagger = uL / 2;

                const posX = startX + (c * (uL + gap)) - stagger;
                const posY = startY + (r * (uH + gap));

                if (posX < -(realW/2) - uL/2 || posX > (realW/2) + uL/2) continue;
                if (posY > (realH/2) + uH/2) continue;

                count++;
            }
        }
        visualUnits = count * layers;

        // B. คำนวณแบบ Standard (สูตรพื้นที่)
        standardUnits = (area * mat.unitsPerSqm) * layers;

        // สร้างตารางเปรียบเทียบ (สีฟ้า)
        table3DHTML = `
            <div style="margin-top:5px; margin-bottom:10px;">
                <h4 style="margin:5px 0; color:#3498db;">🧊 vs 📐 Calculation Check</h4>
                <table style="border:1px solid #3498db; margin-bottom:5px;">
                    <tr style="background:#2980b9; color:white;">
                        <th>Method</th>
                        <th>Count</th>
                        <th>Note</th>
                    </tr>
                    <tr>
                        <td><strong>3D Visual</strong></td>
                        <td style="font-weight:bold; color:#e67e22;">${visualUnits} pcs</td>
                        <td style="font-size:10px; color:#aaa;">Full bricks only</td>
                    </tr>
                    <tr>
                        <td><strong>3D Layer Stack</strong></td>
                        <td>${layers} Layer(s)</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td><strong>Standard Area</strong></td>
                        <td style="font-weight:bold; color:#2ecc71;">${Math.ceil(standardUnits)} pcs</td>
                        <td style="font-size:10px; color:#aaa;">Includes cuts/waste</td>
                    </tr>
                </table>
                <div style="font-size:10px; color:#aaa; font-style:italic; text-align:right;">*Standard is recommended for ordering.</div>
            </div>
        `;

    } else {
        table3DHTML = `<div style="font-size:11px; color:#aaa; margin-bottom:10px;">(Volume-based material)</div>`;
    }
    
    // 3. ส่งค่า Standard ไปแสดงในตารางหลัก (เพื่อคำนวณปูน/ทราย ให้สัมพันธ์กับปริมาณสั่งซื้อ)
    // เราใช้ standardUnits ในการแสดงผลหลัก เพราะเป็นค่าที่ปลอดภัยสำหรับการสั่งของ
    const data = { area: area, vol: volume, count: standardUnits };
    
    let html = `<div style="margin-bottom:5px; font-size:14px;"><strong>Target:</strong> ${obj.userData.name}</div>`;
    
    // แสดงตารางเปรียบเทียบก่อน
    html += table3DHTML;
    
    html += `<hr style="border-color:#444; margin:5px 0;">`;
    html += `<h4 style="margin:5px 0; color:#2ecc71;">📦 Ordering Info (Standard)</h4>`;

    // ตามด้วยตารางวัสดุปกติ (Standard Calc)
    html += getMaterialReportHTML(type, data, true);
    
    document.getElementById('calc-result-content').innerHTML = html;
};

function performCalcAll() {
    const summary = {};
    for(let key in materialDB) {
        summary[key] = { area: 0, vol: 0, count: 0 };
    }

    let totalObjects = 0;
    objects.forEach(obj => {
        if(!obj.visible) return; 
        totalObjects++;

        const type = obj.userData.wallType;
        if(!summary[type]) summary[type] = { area: 0, vol: 0, count: 0 };

        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);

        const area = Math.max(size.x, size.z) * size.y;
        const volume = area * Math.min(size.x, size.z);
        
        const mat = materialDB[type];
        let objUnits = 0;

        if (mat && mat.calcType === 'unit') {
            const wallThickness = Math.min(size.x, size.z);
            const blockThick = (mat.unitW || 7.0) / 100; 
            let layers = 1;
            if (blockThick > 0) {
                layers = Math.round(wallThickness / blockThick);
                if (layers < 1) layers = 1;
            }
            objUnits = (area * mat.unitsPerSqm) * layers;
        }
        summary[type].area += area;
        summary[type].vol += volume;
        summary[type].count += objUnits;
    });

    let html = `<div style="margin-bottom:10px;">Found <strong>${totalObjects}</strong> visible objects.</div>`;
    Object.keys(summary).forEach(key => {
        if (materialDB[key]) {
            html += getMaterialReportHTML(key, summary[key]);
        }
    });
    if(totalObjects === 0) html += "<p>No objects visible to calculate.</p>";
    document.getElementById('calc-result-content').innerHTML = html;
}

document.getElementById('btn-calc-all').onclick = () => {
    currentCalcMode = 'all';
    const el = document.getElementById('panel-calc');
    if(el.style.display === 'none') window.toggleWindow('panel-calc');
    performCalcAll();
};

function updateRealtimeCalc() {
    const panel = document.getElementById('panel-calc');
    if(panel.style.display === 'none') return;
    if (currentCalcMode === 'single' && selectedObject) calculateSingleMaterial(selectedObject);
    else if (currentCalcMode === 'all') performCalcAll();
}

// --- EVENTS ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', handleCanvasClick);

window.addEventListener('keydown', (e) => {
    if(document.activeElement.tagName === 'INPUT') return; 
    if(e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObject.userData.brickMesh) {
                    scene.remove(selectedObject.userData.brickMesh);
                    selectedObject.userData.brickMesh.geometry.dispose();
            }
            
        scene.remove(selectedObject);
        objects = objects.filter(o => o !== selectedObject);
        selectObject(null);
    }
    if(e.key.toLowerCase() === 't') transformControl.setMode('translate');
    if(e.key.toLowerCase() === 'r') transformControl.setMode('scale');
    if(e.key.toLowerCase() === 'e') transformControl.setMode('rotate');

    if(e.key === 'Escape' && isDrawMode) toggleDrawMode(false);
});

document.getElementById('btn-add-cube').onclick = () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.15), new THREE.MeshLambertMaterial());
    mesh.position.y = 1.25;
    addMesh(mesh, "Wall", "brick");
};

const inpPosX = document.getElementById('inp-pos-x');
const inpPosY = document.getElementById('inp-pos-y');
const inpPosZ = document.getElementById('inp-pos-z');

const inpRotX = document.getElementById('inp-rot-x');
const inpRotY = document.getElementById('inp-rot-y');
const inpRotZ = document.getElementById('inp-rot-z');

function updatePosInputsFromObject() {
    if (selectedObject) {
        // Update Position Inputs
        inpPosX.value = parseFloat(selectedObject.position.x.toFixed(2));
        inpPosY.value = parseFloat(selectedObject.position.y.toFixed(2));
        inpPosZ.value = parseFloat(selectedObject.position.z.toFixed(2));

        // Update Rotation Inputs (New)
        // แปลงจาก Radians เป็น Degrees เพื่อให้มนุษย์เข้าใจง่าย (คูณ 180/PI)
        inpRotX.value = (selectedObject.rotation.x * THREE.MathUtils.RAD2DEG).toFixed(1);
        inpRotY.value = (selectedObject.rotation.y * THREE.MathUtils.RAD2DEG).toFixed(1);
        inpRotZ.value = (selectedObject.rotation.z * THREE.MathUtils.RAD2DEG).toFixed(1);
    }
}

function applyPosFromInputs() {
    if (selectedObject) {
        const x = parseFloat(inpPosX.value);
        const y = parseFloat(inpPosY.value);
        const z = parseFloat(inpPosZ.value);
        if (!isNaN(x)) selectedObject.position.x = x;
        if (!isNaN(y)) selectedObject.position.y = y;
        if (!isNaN(z)) selectedObject.position.z = z;
        updateDimensionLabels(); 
        if(outlineHelper) outlineHelper.position.copy(selectedObject.position);
        lastSafePosition.copy(selectedObject.position);
    }
}

function applyRotFromInputs() {
    if (selectedObject) {
        const x = parseFloat(inpRotX.value);
        const y = parseFloat(inpRotY.value);
        const z = parseFloat(inpRotZ.value);

        // แปลงกลับจาก Degrees เป็น Radians (คูณ PI/180)
        if (!isNaN(x)) selectedObject.rotation.x = x * THREE.MathUtils.DEG2RAD;
        if (!isNaN(y)) selectedObject.rotation.y = y * THREE.MathUtils.DEG2RAD;
        if (!isNaN(z)) selectedObject.rotation.z = z * THREE.MathUtils.DEG2RAD;

        // อัปเดตกรอบเส้นและ Brick
        if(outlineHelper) {
            outlineHelper.quaternion.copy(selectedObject.quaternion);
            outlineHelper.position.copy(selectedObject.position); // กันพลาด
        }
        updateDimensionLabels();
        updateBrickVisuals(); // สั่งวาดอิฐใหม่ถ้ามีการหมุน
    }
}

[inpPosX, inpPosY, inpPosZ].forEach(inp => {
    inp.addEventListener('input', applyPosFromInputs); 
    inp.addEventListener('keydown', (e) => e.stopPropagation()); 
});

[inpRotX, inpRotY, inpRotZ].forEach(inp => {
    inp.addEventListener('input', applyRotFromInputs);
    inp.addEventListener('keydown', (e) => e.stopPropagation()); // ป้องกันปุ่มชนกับ shortcut
});

document.getElementById('btn-draw-mode').onclick = () => toggleDrawMode();
document.getElementById('btn-translate').onclick = () => transformControl.setMode('translate');
document.getElementById('btn-scale').onclick = () => transformControl.setMode('scale');
document.getElementById('btn-rotate').onclick = () => transformControl.setMode('rotate');

document.getElementById('plane-top').onclick = () => setDrawPlane('XZ');
document.getElementById('plane-front').onclick = () => setDrawPlane('XY');
document.getElementById('plane-side').onclick = () => setDrawPlane('YZ');
document.getElementById('btn-finish-draw').onclick = finishExtrude;

function animate() {
    requestAnimationFrame(animate);
    if (selectedObject && outlineHelper) {
        outlineHelper.position.copy(selectedObject.position);
        outlineHelper.quaternion.copy(selectedObject.quaternion);
        outlineHelper.scale.copy(selectedObject.scale);
    }
    orbit.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}
animate();