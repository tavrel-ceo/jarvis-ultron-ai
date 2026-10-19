import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type LabObject = { id: number; name: string; shape: string };
type Props = {
  objects: LabObject[];
  selectedId: number;
  onSelect: (id: number) => void;
  rotation: { x: number; y: number };
  scale: number;
  onRotationChange: (v: { x: number; y: number }) => void;
  onScaleChange: (v: number) => void;
  onAdd: () => void;
  onRemove: () => void;
};
type Engine = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  root: THREE.Group;
  meshes: Map<number, THREE.Mesh>;
  grid: THREE.GridHelper;
  raf: number;
  resize: ResizeObserver;
  cleanup: () => void;
};

export default function ThreeLab({
  objects, selectedId, onSelect, rotation, scale, onRotationChange, onScaleChange, onAdd, onRemove,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const selectRef = useRef(onSelect);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [cameraMode, setCameraMode] = useState<"perspective" | "front" | "top" | "side">("perspective");
  const [notice, setNotice] = useState("");

  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      el.dataset.error = "webgl";
      const fallback = document.createElement("div");
      fallback.className = "webgl-fallback";
      fallback.textContent = "Renderização 3D indisponível neste dispositivo. Verifique o suporte a WebGL.";
      el.appendChild(fallback);
      return () => { fallback.remove(); };
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(Math.max(1, el.clientWidth), Math.max(1, el.clientHeight));
    el.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "Editor 3D interativo. Arraste para orbitar e use a roda para aproximar.");
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, Math.max(1, el.clientWidth) / Math.max(1, el.clientHeight), 0.1, 150);
    camera.position.set(0, 2.6, 7.5);
    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xc8baff, 0x171026, 2.2));
    const key = new THREE.PointLight(0x71e6ff, 32);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0xec55ff, 24);
    rim.position.set(-4, 1, -3);
    scene.add(rim);
    const grid = new THREE.GridHelper(14, 28, 0x7045a9, 0x2c1d4b);
    grid.position.y = -1.45;
    scene.add(grid);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.25, 0.008, 8, 120),
      new THREE.MeshBasicMaterial({ color: 0xa96cff, transparent: true, opacity: 0.55 }),
    );
    ring.rotation.x = Math.PI / 2.5;
    scene.add(ring);

    const meshes = new Map<number, THREE.Mesh>();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;
    let moved = false;
    let previousX = 0;
    let previousY = 0;
    let spherical = new THREE.Spherical().setFromVector3(camera.position);
    const onDown = (event: PointerEvent) => {
      dragging = true; moved = false; previousX = event.clientX; previousY = event.clientY;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - previousX, dy = event.clientY - previousY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      if (moved) {
        spherical.setFromVector3(camera.position);
        spherical.theta -= dx * 0.008;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + dy * 0.008, 0.18, Math.PI - 0.18);
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      }
      previousX = event.clientX; previousY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (!moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects([...meshes.values()])[0];
        if (hit && hit.object.userData.objectId !== undefined) selectRef.current(hit.object.userData.objectId as number);
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      spherical.setFromVector3(camera.position);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius + event.deltaY * 0.008, 3.2, 18);
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    const resize = new ResizeObserver(() => {
      if (!el.isConnected) return;
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    });
    resize.observe(el);
    const state: Engine = {
      renderer, camera, scene, root, meshes, grid, raf: 0, resize,
      cleanup: () => {
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointercancel", onUp);
        renderer.domElement.removeEventListener("wheel", onWheel);
      },
    };
    engine.current = state;
    const animate = () => { state.raf = requestAnimationFrame(animate); renderer.render(scene, camera); };
    state.raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(state.raf); resize.disconnect(); state.cleanup(); engine.current = null;
      for (const mesh of meshes.values()) { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); }
      grid.geometry.dispose(); (grid.material as THREE.Material).dispose();
      ring.geometry.dispose(); (ring.material as THREE.Material).dispose();
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const state = engine.current;
    if (!state) return;
    const live = new Set(objects.map((object) => object.id));
    for (const [id, mesh] of state.meshes) {
      if (!live.has(id)) {
        state.root.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); state.meshes.delete(id);
      }
    }
    objects.forEach((object, index) => {
      let mesh = state.meshes.get(object.id);
      if (!mesh) {
        const geometry = object.shape === "orb"
          ? new THREE.SphereGeometry(0.52, 32, 24)
          : new THREE.BoxGeometry(0.85, 0.85, 0.85);
        const material = new THREE.MeshStandardMaterial({
          color: 0x8e7bff, emissive: 0x20154d, metalness: 0.55, roughness: 0.24, transparent: true, opacity: 0.94,
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData.objectId = object.id;
        state.root.add(mesh); state.meshes.set(object.id, mesh);
      }
      const offset = exploded ? (index - (objects.length - 1) / 2) * 0.95 : 0;
      mesh.position.set(((index % 3) - 1) * 1.55 + offset, Math.floor(index / 3) * 1.25 - 0.35, Math.floor(index / 9) * -0.9);
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.color.set(object.id === selectedId ? 0xf38aff : 0x8e7bff);
      material.emissive.set(object.id === selectedId ? 0x7c1c83 : 0x20154d);
      material.wireframe = wireframe;
      mesh.scale.setScalar(object.id === selectedId ? 1.12 : 1);
    });
  }, [objects, selectedId, wireframe, exploded]);

  useEffect(() => {
    const state = engine.current;
    if (state) { state.root.rotation.set(rotation.x * Math.PI / 180, rotation.y * Math.PI / 180, 0); state.root.scale.setScalar(scale / 100); }
  }, [rotation, scale]);

  useEffect(() => { const state = engine.current; if (state) state.grid.visible = showGrid; }, [showGrid]);
  useEffect(() => {
    const state = engine.current;
    if (!state) return;
    const positions: Record<typeof cameraMode, [number, number, number]> = {
      perspective: [0, 2.6, 7.5], front: [0, 0, 8], top: [0, 8, 0.01], side: [8, 0, 0],
    };
    state.camera.position.set(...positions[cameraMode]);
    state.camera.lookAt(0, 0, 0);
  }, [cameraMode]);

  function exportScene() {
    const payload = {
      format: "aris-scene-v1",
      exportedAt: new Date().toISOString(),
      objects: objects.map((object) => ({
        ...object,
        selected: object.id === selectedId,
        sceneRotationDegrees: rotation,
        sceneScalePercent: scale,
      })),
      view: { cameraMode, wireframe, showGrid, exploded },
      note: "Descrição da cena da A.R.I.S.; não é um arquivo CAD/mesh interoperável.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "aris-scene.json"; anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Descrição da cena exportada em JSON.");
  }

  function resetCamera() { setCameraMode("perspective"); setNotice("Câmera recentralizada."); }

  return <div className="three-lab">
    <div className="lab-toolbar" role="toolbar" aria-label="Ferramentas do Laboratório 3D">
      <div className="lab-tool-group">
        <span className="lab-tool-label">CÂMERA</span>
        {(["perspective", "front", "top", "side"] as const).map((mode) => (
          <button key={mode} className={cameraMode === mode ? "selected" : ""} onClick={() => setCameraMode(mode)}>
            {{ perspective: "Livre", front: "Frente", top: "Topo", side: "Lateral" }[mode]}
          </button>
        ))}
      </div>
      <div className="lab-tool-group">
        <button className={showGrid ? "selected" : ""} onClick={() => setShowGrid((value) => !value)}>Grade</button>
        <button className={wireframe ? "selected" : ""} onClick={() => setWireframe((value) => !value)}>Aramado</button>
        <button className={exploded ? "selected" : ""} onClick={() => setExploded((value) => !value)}>Separar peças</button>
        <button onClick={exportScene}>Exportar cena</button>
      </div>
    </div>
    <div ref={host} className="three-canvas" aria-label="Cena 3D interativa" />
    <div className="lab-scene-label">MOTOR WEBGL • ARRASTE PARA ORBITAR • RODA PARA ZOOM</div>
    <div className="three-controls">
      <label>Rotação X <input type="range" min="-180" max="180" value={rotation.x} onChange={(event) => onRotationChange({ ...rotation, x: Number(event.target.value) })} /></label>
      <label>Rotação Y <input type="range" min="-180" max="180" value={rotation.y} onChange={(event) => onRotationChange({ ...rotation, y: Number(event.target.value) })} /></label>
      <label>Escala da cena <input type="range" min="25" max="200" value={scale} onChange={(event) => onScaleChange(Number(event.target.value))} /></label>
      <div className="three-actions">
        <button onClick={onAdd}>＋ Adicionar objeto</button>
        <button onClick={resetCamera}>Recentralizar câmera</button>
        <button onClick={onRemove} disabled={!selectedId || !objects.some((object) => object.id === selectedId)}>Remover selecionado</button>
      </div>
      <div className="lab-object-list">{objects.map((object) => (
        <button key={object.id} className={selectedId === object.id ? "selected" : ""} onClick={() => onSelect(object.id)}>
          {object.shape === "cube" ? "◇" : "◉"} {object.name}
        </button>
      ))}</div>
      {notice && <div className="lab-notice" role="status">{notice}</div>}
      <p className="lab-disclaimer">Exportação atual: descrição JSON da cena. Exportação de malhas CAD/GLB/OBJ ainda não está implementada.</p>
    </div>
  </div>;
}
