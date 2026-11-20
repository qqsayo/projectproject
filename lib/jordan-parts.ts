import { Box3, CanvasTexture, Euler, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Quaternion, RepeatWrapping, Shape, Sphere, Vector3, type Object3D } from 'three';
import { constructionArcDepth, constructionLayer, constructionLifts } from './explode-motion';

function partCorners(mesh: Mesh, root: Object3D) {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox!;
  const points: Vector3[] = [];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        points.push(root.worldToLocal(mesh.localToWorld(new Vector3(x, y, z))));
      }
    }
  }
  return points;
}

const clearanceNormals = [-.24, 0, .24].flatMap(x => (
  [-.72, -.48, -.24, 0, .24, .48, .72].map(z => new Vector3(x, 1, z).normalize())
));

function clearanceRanges(meshes: readonly Mesh[], root: Object3D, pivot: Vector3, rotations: readonly Quaternion[]) {
  const vertices: number[] = [];
  const point = new Vector3();
  const worldToRoot = root.matrixWorld.clone().invert();
  for (const mesh of meshes) {
    const positions = mesh.geometry.getAttribute('position');
    const matrix = worldToRoot.clone().multiply(mesh.matrixWorld);
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(matrix).sub(pivot);
      vertices.push(point.x, point.y, point.z);
    }
  }
  const inverseRotations = rotations.map(rotation => rotation.clone().invert());
  return clearanceNormals.map(normal => {
    let min = Infinity;
    let max = -Infinity;
    for (const inverse of inverseRotations) {
      const { x, y, z } = point.copy(normal).applyQuaternion(inverse);
      for (let i = 0; i < vertices.length; i += 3) {
        const projection = vertices[i] * x + vertices[i + 1] * y + vertices[i + 2] * z;
        if (projection < min) min = projection;
        if (projection > max) max = projection;
      }
    }
    return { min, max };
  });
}

export function makeConstructionLayers(meshes: readonly Mesh[], root: Object3D) {
  type Parts = { definition: NonNullable<ReturnType<typeof constructionLayer>>; meshes: Mesh[]; points: Vector3[] };
  const levels = new Map<number, Parts>();
  for (const mesh of meshes) {
    const definition = constructionLayer(mesh.name);
    if (!definition) continue;
    const level = levels.get(definition.level) ?? { definition, meshes: [], points: [] };
    level.meshes.push(mesh);
    level.points.push(...partCorners(mesh, root));
    levels.set(definition.level, level);
  }
  const ordered = [...levels.values()].sort((a, b) => a.definition.level - b.definition.level);
  if (!ordered.length) return [];
  const center = new Box3().setFromPoints(ordered[0].points).getCenter(new Vector3());
  const posed = ordered.map(({ definition, meshes, points }) => {
    const pivot = new Box3().setFromPoints(points).getCenter(new Vector3());
    pivot.setX(center.x).setZ(center.z);
    const group = new Group();
    group.position.copy(pivot);
    root.add(group);
    for (const mesh of meshes) group.attach(mesh);

    // Account for the full tilt when opening the clearance between layers.
    const [x, y, z] = definition.tilt;
    const rotations = Array.from({ length: 9 }, (_, step) => (
      new Quaternion().setFromEuler(new Euler(x * step / 8, y * step / 8, z * step / 8))
    ));
    const sweep = rotations.flatMap(rotation => points.map(point => point.clone().sub(pivot).applyQuaternion(rotation)));
    const ranges = clearanceRanges(meshes, root, pivot, rotations);
    return { group, start: pivot, ...definition, sweep, ranges, depth: constructionArcDepth(definition.level) };
  });
  const anchor = (posed.find(layer => layer.level === constructionLayer('R_upper')?.level) ?? posed[0]).start;
  const lifts = constructionLifts(
    posed.map(layer => layer.ranges.map(({ min, max }, axis) => {
      const depthProjection = clearanceNormals[axis].z * layer.depth;
      return { min: min + depthProjection, max: max + depthProjection };
    })),
    clearanceNormals.map(normal => normal.y),
    .0045,
  );
  return posed.map((layer, index) => ({
    ...layer, destination: new Vector3(anchor.x, anchor.y + lifts[index], anchor.z + layer.depth),
  }));
}

export function constructionFrame(layers: ReturnType<typeof makeConstructionLayers>, root: Object3D) {
  const anchors = layers.flatMap(layer => layer.sweep.map(point => (
    root.localToWorld(point.clone().add(layer.destination))
  )));
  const center = new Box3().setFromPoints(anchors).getCenter(new Vector3());
  const radius = anchors.reduce((max, point) => Math.max(max, point.distanceTo(center)), 0);
  return new Sphere(center, radius);
}

export function modelInsole(sole: Mesh) {
  const bounds = new Box3().setFromObject(sole);
  const center = bounds.getCenter(new Vector3());
  const positions = sole.geometry.getAttribute('position');
  const vertices = Array.from({ length: positions.count }, (_, index) => (
    new Vector3().fromBufferAttribute(positions, index).applyMatrix4(sole.matrixWorld)
  ));
  const length = bounds.max.z - bounds.min.z;
  const outer: [number, number][] = [];
  const inner: [number, number][] = [];
  for (let i = 0; i <= 32; i++) {
    const z = bounds.min.z + length * i / 32;
    const crossSection = vertices.filter(vertex => Math.abs(vertex.z - z) < length / 48);
    if (!crossSection.length) continue;
    const min = Math.min(...crossSection.map(vertex => vertex.x));
    const max = Math.max(...crossSection.map(vertex => vertex.x));
    const along = -(center.z + (z - center.z) * .92);
    outer.push([center.x + (max - center.x) * .81, along]);
    inner.push([center.x + (min - center.x) * .81, along]);
  }
  const outline = [...outer, ...inner.reverse()];
  const shape = new Shape();
  shape.moveTo(...outline[0]);
  for (const point of outline.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: .0026, bevelThickness: .0012, bevelSize: .0011, bevelSegments: 3, steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bounds.max.y - .006, 0);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#666';
    context.fillRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 4) {
      for (let x = 0; x < 32; x += 4) {
        const horizontal = (x + y) % 8 === 0;
        context.fillStyle = '#a8a8a8';
        context.fillRect(x, y, horizontal ? 4 : 2, horizontal ? 2 : 4);
      }
    }
  }
  const weave = new CanvasTexture(canvas);
  weave.wrapS = weave.wrapT = RepeatWrapping;
  weave.repeat.set(42, 42);
  const mesh = new Mesh(geometry, new MeshStandardMaterial({
    color: '#817763', roughness: .94, bumpMap: weave, bumpScale: .021, transparent: true,
  }));
  mesh.name = 'R_insole';
  mesh.visible = false;
  return mesh;
}

