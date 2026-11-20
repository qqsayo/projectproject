'use client';

import { Download, Minus, Plus, RotateCcw, RotateCw, ScanLine } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { heroPose } from '@/lib/hero-motion';
import { constructionMotion, constructionTurn, constructionViewDistance, isDoubleTap, layerOffset, motionWindow } from '@/lib/explode-motion';
import { constructionFrame, makeConstructionLayers, modelInsole } from '@/lib/jordan-parts';
import {
  ACESFilmicToneMapping, AmbientLight, Box3, Color, DirectionalLight, Group,
  MathUtils, Mesh, PCFShadowMap, PerspectiveCamera, Raycaster, Scene, Texture, Vector2, Vector3, WebGLRenderer,
  type Material,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const finishes = ['Midnight', 'Beach', 'Street'];
const swatches = ['#33353d', '#b7a590', '#aa765e'];
type Stage = { rotate: (radians: number) => void; zoom: (delta: number) => void; reset: () => void; finish: (index: number) => void; toggle: () => void; download: () => boolean; present: () => void };

const entryAspect = 1.45;
const entrySlope = Math.tan(MathUtils.degToRad(16));
const entryDistance = 2.50;

function makeOrbit(yaw = 0, pitch = 0, zoom = 1) {
  const initial = { yaw, pitch, zoom };
  return { initial, current: { ...initial }, target: { ...initial } };
}

function stepOrbit(orbit: ReturnType<typeof makeOrbit>, rate: number) {
  const { current, target } = orbit;
  current.yaw = MathUtils.lerp(current.yaw, target.yaw, rate);
  current.pitch = MathUtils.lerp(current.pitch, target.pitch, rate);
  current.zoom = MathUtils.lerp(current.zoom, target.zoom, rate);
  return Math.abs(current.yaw - target.yaw) + Math.abs(current.pitch - target.pitch) + Math.abs(current.zoom - target.zoom) > .002;
}

type HeroScroll = {
  timeline: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLDivElement | null>;
};

export default function Viewer({ hero, active = true }: { hero?: HeroScroll; active?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [finish, setFinish] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const visible = useRef(active);

  useLayoutEffect(() => {
    visible.current = active;
    if (active) stage.current?.present();
  }, [active]);

  useEffect(() => {
    const target = container.current!;
    let renderer: WebGLRenderer;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: hero ? 'high-performance' : 'low-power' });
      if (!gl) throw new Error('WebGL 2 unavailable');
      renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
    } catch {
      queueMicrotask(() => setStatus('error'));
      return;
    }

    let closed = false;
    let contextLost = false;
    let modelReady = false;
    let hasPresented = false;
    let loadFailed = false;
    let frame = 0;
    const materials = new Set<Material>();
    const textures = new Set<Texture>();
    const trackedMeshes: Mesh[] = [];
    const look = new Group();
    const fitPoints: Vector3[] = [];
    let layers: ReturnType<typeof makeConstructionLayers> = [];
    const companion = new Group();
    const companionOrigin = new Vector3();
    const retreatVector = new Vector3(-.075, -.012, -.16);
    const companionMaterials = new Map<Material, Material>();
    let insole: Mesh | undefined;
    let spread = 0;
    let speed = 0;
    let transition: { from: number; speed: number; to: number; started: number } | undefined;
    const projectedCorner = new Vector3();
    const pivotOffset = new Vector3();
    let construction: ReturnType<typeof constructionFrame> | undefined;
    const scene = new Scene();
    scene.add(look, new AmbientLight('#f6f3ed', hero ? 1.3 : 2));
    const light = new DirectionalLight('#ffffff', hero ? 2.55 : 3);
    light.position.set(-3, 4, 5);
    scene.add(light);
    const rim = new DirectionalLight(hero ? '#f4e8db' : '#d8e5ff', 1.8);
    rim.position.set(3, 1, -4);
    scene.add(rim);
    if (hero) {
      light.castShadow = true;
      light.shadow.mapSize.set(1536, 1536);
      Object.assign(light.shadow.camera, { left: -2.1, right: 2.1, top: 2.1, bottom: -2.1, near: 4, far: 10 });
      light.shadow.normalBias = .012;
      light.shadow.bias = -.00012;
      light.shadow.radius = 2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;
      const fill = new DirectionalLight('#eff4ff', 1.15);
      fill.position.set(4, 2, 2);
      scene.add(fill);
    }

    const assembledOrbit = makeOrbit(hero ? 0 : -.14, hero ? 0 : .20);
    const explodedOrbit = makeOrbit(0, 0, 1.12);
    const activeOrbit = () => constructionVisible ? explodedOrbit : assembledOrbit;
    const constructionYaw = heroPose(0).yaw + constructionTurn;
    let constructionVisible = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const timeline = hero?.timeline.current;
    const stickyStage = hero?.stage.current;
    const camera = new PerspectiveCamera(32, 1, .1, 30);
    renderer.setPixelRatio(hero ? Math.min(2.5, Math.max(1.5, devicePixelRatio)) : Math.min(devicePixelRatio, 1.6));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = hero ? 1.04 : 1.23;
    const glViewportLimit = renderer.getContext().MAX_VIEWPORT_DIMS;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    target.appendChild(canvas);

    function render(now: number, initial = false) {
      frame = 0;
      if (!visible.current || contextLost) return;
      const rate = reduced.matches ? 1 : .24;
      if (transition) {
        const state = constructionMotion(transition.from, transition.speed, transition.to, now - transition.started);
        spread = reduced.matches ? transition.to : state.position;
        speed = reduced.matches ? 0 : state.speed;
        if (reduced.matches || state.settled) transition = undefined;
      }
      const assembledMoving = stepOrbit(assembledOrbit, rate);
      const explodedMoving = stepOrbit(explodedOrbit, rate);
      const assembled = assembledOrbit.current;
      const opened = explodedOrbit.current;
      let distance = Math.max(3.05, 3.05 / Math.max(.48, camera.aspect)) / assembled.zoom;
      if (timeline && stickyStage) {
        const rect = timeline.getBoundingClientRect();
        if (!initial && (rect.bottom <= 0 || rect.top >= innerHeight)) return;
        const stickyTop = Number.parseFloat(getComputedStyle(stickyStage).top);
        const span = Math.max(1, rect.height - stickyStage.offsetHeight);
        const pose = heroPose(!initial && Number.isFinite(stickyTop) ? (stickyTop - rect.top) / span : 0, reduced.matches);
        stickyStage.dataset.chapter = String(pose.chapter);
        stickyStage.style.setProperty('--hero-progress', String(pose.progress));
        const reveal = motionWindow(spread, .02, .94);
        const rotation = MathUtils.clamp(pose.pitch + MathUtils.lerp(assembled.pitch, opened.pitch, reveal), -1.36, 1.36);
        const assembledYaw = pose.yaw + assembled.yaw;
        const yawDelta = constructionYaw + opened.yaw - assembledYaw;
        const viewYaw = assembledYaw + Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta)) * reveal;
        look.rotation.set(rotation, viewYaw, pose.roll, 'YXZ');
        look.position.set(0, pose.y * (1 - reveal), 0);
        if (construction) {
          pivotOffset.copy(construction.center).applyQuaternion(look.quaternion);
          look.position.addScaledVector(pivotOffset, -reveal);
        }
        distance = entryDistance / MathUtils.lerp(pose.zoom, 1, reveal);
        const retreat = motionWindow(spread, 0, .76);
        const otherOpacity = 1 - motionWindow(spread, .14, .75);
        companion.position.copy(companionOrigin).addScaledVector(retreatVector, retreat);
        companion.scale.setScalar(1 - .24 * retreat);
        companion.visible = otherOpacity > 0;
        for (const material of companionMaterials.values()) {
          material.opacity = otherOpacity;
          material.depthWrite = otherOpacity === 1;
        }
        const separation = motionWindow(spread, .17, .97);
        if (insole) {
          const material = insole.material as Material;
          material.opacity = motionWindow(spread, .32, .65);
          material.depthWrite = material.opacity === 1;
          insole.visible = material.opacity > 0;
          insole.castShadow = material.opacity === 1;
        }
        if (construction) {
          for (const layer of layers) {
            const travel = layerOffset(separation, layer.delay);
            layer.group.position.lerpVectors(layer.start, layer.destination, travel);
            layer.group.position.z = MathUtils.lerp(layer.start.z, layer.destination.z, travel * (1.18 - .18 * travel));
            const tiltProgress = motionWindow(travel, .84, 1);
            const [x, y, z] = layer.tilt;
            layer.group.rotation.set(x * tiltProgress, y * tiltProgress, z * tiltProgress);
          }
          const field = Math.tan(MathUtils.degToRad(camera.fov / 2)) * .96;
          // Fit the whole orbit once so rotating the construction cannot push the camera.
          const detailDistance = constructionViewDistance(construction.radius, field, camera.aspect);
          if (reveal < 1) {
            look.updateMatrix();
            for (const corner of fitPoints) {
              const point = projectedCorner.copy(corner).applyMatrix4(look.matrix);
              distance = Math.max(distance, point.z + Math.max(Math.abs(point.x) / camera.aspect, Math.abs(point.y)) / field);
            }
          }
          distance = MathUtils.lerp(distance, detailDistance, reveal);
        }
        distance /= MathUtils.lerp(assembled.zoom, opened.zoom, reveal);
      } else {
        look.rotation.set(assembled.pitch, assembled.yaw, -.055, 'YXZ');
      }
      camera.position.set(0, hero ? 0 : .18, distance);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      if (modelReady && !hasPresented) {
        hasPresented = true;
        setStatus('ready');
      }
      if (transition || assembledMoving || explodedMoving) schedule();
    }

    function schedule() {
      if (!frame && !closed && !contextLost && visible.current) frame = requestAnimationFrame(render);
    }

    let canvasWidth = 0;
    let canvasHeight = 0;
    function sizeCanvas() {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return false;
      if (width === canvasWidth && height === canvasHeight) return true;
      canvasWidth = width;
      canvasHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (hero) camera.fov = 2 * MathUtils.radToDeg(Math.atan(entrySlope * Math.max(1, entryAspect / camera.aspect)));
      camera.updateProjectionMatrix();
      return true;
    }
    const resize = new ResizeObserver(() => {
      if (sizeCanvas()) schedule();
    });
    resize.observe(target);
    if (hero) {
      window.addEventListener('scroll', schedule, { passive: true });
      reduced.addEventListener('change', schedule);
    }
    function loseContext() {
      contextLost = true;
      hasPresented = false;
      cancelAnimationFrame(frame);
      frame = 0;
      if (stickyStage) delete stickyStage.dataset.exploded;
      setStatus('error');
    }
    function restoreContext() {
      contextLost = false;
      if (stickyStage && modelReady) stickyStage.dataset.exploded = String(constructionVisible);
      setStatus(loadFailed ? 'error' : 'loading');
      schedule();
    }
    canvas.addEventListener('webglcontextlost', loseContext);
    canvas.addEventListener('webglcontextrestored', restoreContext);

    function trackMaterial(material: Material) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (!(value instanceof Texture)) continue;
        if (hero) value.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.add(value);
      }
    }

    function disposeAssets() {
      trackedMeshes.forEach(mesh => mesh.geometry.dispose());
      textures.forEach(texture => {
        if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close();
        texture.dispose();
      });
      materials.forEach(material => material.dispose());
    }

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const request = new AbortController();
    async function load() {
      try {
        const response = await fetch(hero ? '/media/jordan-engineered.glb' : '/media/study.glb', { signal: request.signal });
        if (!response.ok) throw new Error('Could not load the sneaker study');
        const result = await loader.parseAsync(await response.arrayBuffer(), '/media/');
        result.scene.traverse(node => {
          if (!(node instanceof Mesh)) return;
          trackedMeshes.push(node);
          [node.material].flat().forEach(trackMaterial);
        });
        const variantMaterials = hero ? [] : await Promise.all(finishes.map(async (_, index) => {
          const material: Material = await result.parser.getDependency('material', index);
          trackMaterial(material);
          return material;
        }));
        if (closed) { disposeAssets(); return; }

        const bounds = new Box3().setFromObject(result.scene);
        const size = bounds.getSize(new Vector3());
        const center = bounds.getCenter(new Vector3());
        if (hero) {
          result.scene.updateMatrixWorld(true);
          const companionBounds = new Box3();
          for (const mesh of trackedMeshes) {
            if (mesh.name.startsWith('L_')) companionBounds.expandByObject(mesh);
          }
          companionBounds.getCenter(companionOrigin);
          companion.position.copy(companionOrigin);
          result.scene.add(companion);
          const sole = trackedMeshes.find(mesh => mesh.name === 'R_sole');
          if (sole) {
            insole = modelInsole(sole);
            result.scene.add(insole);
            trackedMeshes.push(insole);
            [insole.material].flat().forEach(trackMaterial);
          }
          for (const mesh of trackedMeshes) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (!mesh.name.startsWith('L_')) continue;
            companion.attach(mesh);
            const fade = (material: Material) => {
              let copy = companionMaterials.get(material);
              if (!copy) {
                copy = material.clone();
                copy.transparent = true;
                copy.forceSinglePass = true;
                companionMaterials.set(material, copy);
                trackMaterial(copy);
              }
              return copy;
            };
            mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fade) : fade(mesh.material);
            mesh.castShadow = false;
          }
          const anchors: unknown = result.scene.userData.fitAnchors;
          if (Array.isArray(anchors) && anchors.length >= 12 && anchors.length % 3 === 0 &&
              anchors.every(value => typeof value === 'number' && Number.isFinite(value))) {
            for (let i = 0; i < anchors.length; i += 3) {
              fitPoints.push(new Vector3(anchors[i], anchors[i + 1], anchors[i + 2]).sub(center));
            }
          } else {
            bounds.translate(center.clone().negate());
            for (const x of [bounds.min.x, bounds.max.x]) {
              for (const y of [bounds.min.y, bounds.max.y]) {
                for (const z of [bounds.min.z, bounds.max.z]) {
                  fitPoints.push(new Vector3(x, y, z));
                }
              }
            }
          }
        }
        const scale = (hero ? 1.65 : 1.45) / Math.max(size.x, size.y, size.z);
        fitPoints.forEach(corner => corner.multiplyScalar(scale));
        result.scene.scale.setScalar(scale);
        result.scene.position.copy(center.multiplyScalar(-scale));
        if (hero) layers = makeConstructionLayers(trackedMeshes, result.scene);
        if (layers.length) {
          result.scene.updateMatrixWorld(true);
          construction = constructionFrame(layers, result.scene);
        }
        look.add(result.scene);
        if (hero && !contextLost) {
          await renderer.compileAsync(scene, camera);
          if (closed) return;
        }
        stage.current = {
          present: () => {
            if (!hero || !sizeCanvas()) return;
            if (frame) cancelAnimationFrame(frame);
            for (const orbit of [assembledOrbit, explodedOrbit]) {
              Object.assign(orbit.current, orbit.initial);
              Object.assign(orbit.target, orbit.initial);
            }
            constructionVisible = false;
            spread = 0;
            speed = 0;
            transition = undefined;
            if (stickyStage) stickyStage.dataset.exploded = 'false';
            setExploded(false);
            setExportMessage('');
            render(performance.now(), true);
          },
          toggle: () => {
            if (!layers.length || contextLost) return;
            const to = constructionVisible ? 0 : 1;
            constructionVisible = to === 1;
            if (stickyStage) stickyStage.dataset.exploded = String(constructionVisible);
            setExploded(constructionVisible);
            setExportMessage('');
            if (!transition) speed = 0;
            transition = { from: spread, speed, to, started: performance.now() };
            schedule();
          },
          download: () => {
            if (!hero || contextLost) return false;
            const gl = renderer.getContext();
            const [maxWidth, maxHeight] = gl.getParameter(glViewportLimit);
            if (maxWidth < 3840 || maxHeight < 2160) return false;

            const size = renderer.getSize(new Vector2());
            const pixelRatio = renderer.getPixelRatio();
            const exportCamera = camera.clone();
            const format = 3840 / 2160;
            exportCamera.aspect = format;
            exportCamera.position.z *= Math.max(1, camera.aspect / format);
            exportCamera.updateProjectionMatrix();
            scene.background = new Color('#f6f0e9');
            try {
              renderer.setPixelRatio(1);
              renderer.setSize(3840, 2160, false);
              renderer.render(scene, exportCamera);
              if (gl.isContextLost() || gl.drawingBufferWidth !== 3840 || gl.drawingBufferHeight !== 2160) return false;
              canvas.toBlob(blob => {
                if (closed) return;
                if (!blob) {
                  setExportMessage('Could not save the 4K image.');
                  return;
                }
                const anchor = document.createElement('a');
                const url = URL.createObjectURL(blob);
                anchor.href = url;
                anchor.download = 'project-1-air-jordan-4k.png';
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 30000);
                setExportMessage('4K download started.');
              }, 'image/png');
              return true;
            } catch {
              return false;
            } finally {
              scene.background = null;
              renderer.setPixelRatio(pixelRatio);
              renderer.setSize(size.x, size.y, false);
              schedule();
            }
          },
          rotate: radians => { activeOrbit().target.yaw += radians; schedule(); },
          zoom: delta => {
            const { target } = activeOrbit();
            target.zoom = MathUtils.clamp(target.zoom + delta, .72, hero ? 1.36 : 1.75);
            schedule();
          },
          reset: () => {
            const orbit = activeOrbit();
            Object.assign(orbit.target, orbit.initial);
            schedule();
          },
          finish: index => {
            trackedMeshes.forEach(mesh => { mesh.material = variantMaterials[index]; });
            schedule();
          },
        };
        if (!hero) stage.current.finish(0);
        modelReady = true;
        if (sizeCanvas()) schedule();
      } catch {
        loadFailed = true;
        if (!closed) setStatus('error');
      }
    }
    void load();

    let pointer: { id: number; x: number; y: number; moved: number; canceled: boolean; orbit: ReturnType<typeof makeOrbit> } | undefined;
    let tap: { time: number; x: number; y: number } | undefined;
    let lastGestureDragged = false;
    let touchEndedAt = -Infinity;
    const ray = new Raycaster();
    const screen = new Vector2();
    function toggleAt(x: number, y: number) {
      const rect = target.getBoundingClientRect();
      if (!hero || !stage.current || !rect.width || !rect.height) return;
      ray.setFromCamera(screen.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), camera);
      if (ray.intersectObjects(trackedMeshes, false).some(hit => hit.object.visible && hit.object.parent?.visible) || spread > .95) stage.current.toggle();
    }
    const doubleClick = (event: MouseEvent) => {
      if (!lastGestureDragged && performance.now() - touchEndedAt > 450 && (event as PointerEvent).pointerType !== 'touch') toggleAt(event.clientX, event.clientY);
    };
    const end = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      lastGestureDragged = pointer.canceled || pointer.moved > 8;
      if (lastGestureDragged) tap = undefined;
      if (event.pointerType === 'touch') touchEndedAt = performance.now();
      if (hero && event.pointerType === 'touch' && !lastGestureDragged) {
        const current = { time: event.timeStamp, x: event.clientX, y: event.clientY };
        if (isDoubleTap(tap, current)) {
          toggleAt(current.x, current.y);
          tap = undefined;
        } else {
          tap = current;
        }
      }
    };
    const start = (event: PointerEvent) => {
      if (!stage.current || event.button !== 0) return;
      if (pointer) {
        pointer.canceled = true;
        tap = undefined;
        return;
      }
      target.setPointerCapture(event.pointerId);
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0, canceled: false, orbit: activeOrbit() };
      target.dataset.drag = 'true';
    };
    const move = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      pointer.moved += Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
      const { target } = pointer.orbit;
      target.yaw += (event.clientX - pointer.x) * .012;
      target.pitch = MathUtils.clamp(target.pitch + (event.clientY - pointer.y) * .009, -1.2, 1.2);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      schedule();
    };
    const stop = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      pointer = undefined;
      delete target.dataset.drag;
    };
    const cancel = (event: PointerEvent) => {
      tap = undefined;
      lastGestureDragged = true;
      stop(event);
    };
    target.addEventListener('pointercancel', cancel);
    target.addEventListener('pointerdown', start);
    target.addEventListener('pointermove', move);
    target.addEventListener('lostpointercapture', stop);
    if (hero) {
      target.addEventListener('dblclick', doubleClick);
      target.addEventListener('pointerup', end);
    }

    return () => {
      closed = true;
      request.abort();
      stage.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      if (hero) {
        window.removeEventListener('scroll', schedule);
        reduced.removeEventListener('change', schedule);
      }
      target.removeEventListener('pointerdown', start);
      target.removeEventListener('pointercancel', cancel);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('lostpointercapture', stop);
      target.removeEventListener('dblclick', doubleClick);
      target.removeEventListener('pointerup', end);
      if (stickyStage) delete stickyStage.dataset.exploded;
      delete target.dataset.drag;
      canvas.removeEventListener('webglcontextlost', loseContext);
      canvas.removeEventListener('webglcontextrestored', restoreContext);
      canvas.remove();
      disposeAssets();
      light.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [hero]);

  return <div className={hero ? "viewer-inner hero-viewer" : "viewer-inner"} data-viewer={status}>
    <div className="viewer-canvas" ref={container} {...(hero && status === 'ready' ? {
      role: 'button',
      tabIndex: 0,
      'aria-label': 'Exploded view',
      'aria-pressed': exploded,
      onClick: (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.detail === 0) stage.current?.toggle();
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!event.repeat) stage.current?.toggle();
      },
    } : {})} />
    {status !== 'ready' && <p className="viewer-status" role="status">{status === 'loading' ? 'Loading the 3D study…' : '3D unavailable · Showing model preview'}</p>}
    <div className="viewer-controls" hidden={status !== 'ready'}>
      {!hero && <div className="viewer-finishes" role="group" aria-label="3D finishes">
        {finishes.map((name, i) => <button type="button" key={name} style={{ '--swatch': swatches[i] } as React.CSSProperties} className="swatch" aria-label={name} aria-pressed={finish === i} title={name} onClick={() => { setFinish(i); stage.current?.finish(i); }} />)}
      </div>}
      <div className="viewer-toolbar" role="group" aria-label="3D controls">
        {hero && <button type="button" className="icon-button export-button" aria-label="Save 4K image" title="Save 4K PNG" onClick={() => {
          setExportMessage('');
          if (!stage.current?.download()) setExportMessage('4K export is unavailable on this device.');
        }}><Download size={17} /></button>}
        <button type="button" className="icon-button" aria-label="Rotate left" onClick={() => stage.current?.rotate(-Math.PI / 8)}><RotateCcw size={17} /></button>
        <button type="button" className="icon-button" aria-label="Rotate right" onClick={() => stage.current?.rotate(Math.PI / 8)}><RotateCw size={17} /></button>
        <button type="button" className="icon-button" aria-label="Zoom out" onClick={() => stage.current?.zoom(-.15)}><Minus size={17} /></button>
        <button type="button" className="icon-button" aria-label="Zoom in" onClick={() => stage.current?.zoom(.15)}><Plus size={17} /></button>
        <button type="button" className="icon-button" aria-label="Reset view" onClick={() => stage.current?.reset()}><ScanLine size={17} /></button>
      </div>
    </div>
    {status === 'ready' && <span className="viewer-hint micro" role={hero ? "status" : undefined}>{hero ? (exportMessage || (exploded ? "Double-click / tap to assemble" : "Drag to rotate · Double-click / tap for parts")) : "Drag to rotate / " + finishes[finish]}</span>}
  </div>;
}











