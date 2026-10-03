import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AvatarConfig, AvatarGender } from "@/lib/avatar";
import { contrastColor, garmentPattern, numberTexture } from "@/lib/avatar3d/patterns";

export type BlinkHumanOptions = {
  config: AvatarConfig;
  height?: number;
};

type Dims = {
  bodyHeight: number;
  torsoW: number;
  torsoD: number;
  torsoBottom: number;
  torsoTop: number;
  torsoZ: number;
  hipW: number;
  hipD: number;
  shortsTop: number;
  shortsBottom: number;
  legX: number;
  sockTop: number;
  sockBottom: number;
  sockR: number;
  footW: number;
  footH: number;
  footL: number;
  footY: number;
  footZ: number;
  shoulderX: number;
  shoulderY: number;
  headY: number;
  headR: number;
};

const DIMS: Record<AvatarGender, Dims> = {
  male: {
    bodyHeight: 1.88,
    torsoW: 0.48,
    torsoD: 0.31,
    torsoBottom: 1.04,
    torsoTop: 1.55,
    torsoZ: -0.02,
    hipW: 0.42,
    hipD: 0.3,
    shortsTop: 1.1,
    shortsBottom: 0.72,
    legX: 0.115,
    sockTop: 0.55,
    sockBottom: 0.18,
    sockR: 0.08,
    footW: 0.16,
    footH: 0.1,
    footL: 0.3,
    footY: 0.05,
    footZ: 0.02,
    shoulderX: 0.23,
    shoulderY: 1.44,
    headY: 1.75,
    headR: 0.125,
  },
  female: {
    bodyHeight: 1.82,
    torsoW: 0.4,
    torsoD: 0.28,
    torsoBottom: 1.03,
    torsoTop: 1.53,
    torsoZ: 0,
    hipW: 0.4,
    hipD: 0.28,
    shortsTop: 1.11,
    shortsBottom: 0.73,
    legX: 0.105,
    sockTop: 0.55,
    sockBottom: 0.17,
    sockR: 0.075,
    footW: 0.14,
    footH: 0.1,
    footL: 0.29,
    footY: 0.04,
    footZ: 0.02,
    shoulderX: 0.19,
    shoulderY: 1.42,
    headY: 1.7,
    headR: 0.118,
  },
};

const BODY_PART_NAMES = new Set(["Chest", "Neck", "Arms", "Hands", "Legs", "Feet"]);
const UNDERWEAR_NAMES = new Set(["Underwear", "Bra"]);

const modelCache = new Map<AvatarGender, Promise<THREE.Group>>();

function loadBlinkModel(gender: AvatarGender): Promise<THREE.Group> {
  const cached = modelCache.get(gender);
  if (cached) return cached;

  const url = gender === "female" ? "/models/human-female.glb" : "/models/human-male.glb";
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), undefined, (error) => reject(error));
  });
  modelCache.set(gender, promise);
  return promise;
}

function makeMaterial(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.85,
    metalness: 0.02,
    flatShading: true,
    ...extra,
  });
}

function prism(
  material: THREE.Material,
  widthTop: number,
  widthBottom: number,
  height: number,
  depthRatio = 1,
  sides = 12,
) {
  const geometry = new THREE.CylinderGeometry(widthTop / 2, widthBottom / 2, height, sides, 1);
  geometry.rotateY(Math.PI / sides);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.z = depthRatio;
  return mesh;
}

function box(material: THREE.Material, w: number, h: number, d: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function rotateBoneToWorld(bone: THREE.Object3D, axis: THREE.Vector3, angle: number) {
  const parent = bone.parent;
  if (!parent) return;

  bone.updateWorldMatrix(true, false);
  const parentWorld = new THREE.Quaternion();
  parent.getWorldQuaternion(parentWorld);
  const currentWorld = new THREE.Quaternion();
  bone.getWorldQuaternion(currentWorld);

  const delta = new THREE.Quaternion().setFromAxisAngle(axis, angle);
  const targetWorld = delta.multiply(currentWorld);
  const targetLocal = parentWorld.invert().multiply(targetWorld);
  bone.quaternion.copy(targetLocal);
  bone.updateMatrixWorld(true);
}

function poseArmsDown(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  const axis = new THREE.Vector3(0, 0, 1);
  const right = model.getObjectByName("Shoulder_R");
  const left = model.getObjectByName("Shoulder_L");
  if (right) rotateBoneToWorld(right, axis, 1.18);
  if (left) rotateBoneToWorld(left, axis, -1.18);
}

export class BlinkHuman {
  readonly object3D = new THREE.Group();

  private readonly root = new THREE.Group();
  private readonly overlay = new THREE.Group();
  private readonly skinMat: THREE.MeshStandardMaterial;
  private readonly hairMat: THREE.MeshStandardMaterial;
  private readonly shirtMat: THREE.MeshStandardMaterial;
  private readonly hoodieMat: THREE.MeshStandardMaterial;
  private readonly pantsMat: THREE.MeshStandardMaterial;
  private readonly shoeMat: THREE.MeshStandardMaterial;
  private readonly sockMat: THREE.MeshStandardMaterial;
  private readonly eyeWhiteMat: THREE.MeshStandardMaterial;
  private readonly eyePupilMat: THREE.MeshStandardMaterial;
  private readonly mouthMat: THREE.MeshStandardMaterial;
  private readonly logoMesh: THREE.Mesh;
  private readonly numberMesh: THREE.Mesh;
  private body: THREE.Object3D | null = null;
  private logoSrc: string | null = null;
  private logoTexture: THREE.Texture | null = null;
  private logoToken = 0;
  private cfg: AvatarConfig;
  private height: number;
  private disposed = false;

  constructor({ config, height = 2 }: BlinkHumanOptions) {
    this.cfg = config;
    this.height = height;

    this.skinMat = makeMaterial(config.skin);
    this.hairMat = makeMaterial(config.hairColor);
    this.shirtMat = makeMaterial(config.jersey);
    this.hoodieMat = makeMaterial(config.hoodie === "none" ? "#111827" : config.hoodie);
    this.pantsMat = makeMaterial(config.shorts);
    this.shoeMat = makeMaterial(config.boots);
    this.sockMat = makeMaterial(config.socks);
    this.eyeWhiteMat = makeMaterial("#f8fafc", { side: THREE.FrontSide });
    this.eyePupilMat = makeMaterial("#1f2937", { side: THREE.FrontSide });
    this.mouthMat = makeMaterial("#7c2d12", { side: THREE.FrontSide });

    this.logoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.2),
      new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide }),
    );
    this.logoMesh.visible = false;
    this.overlay.add(this.logoMesh);

    this.numberMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.28),
      new THREE.MeshBasicMaterial({ transparent: true, side: THREE.FrontSide }),
    );
    this.numberMesh.rotation.y = Math.PI;
    this.numberMesh.visible = false;
    this.overlay.add(this.numberMesh);

    this.root.add(this.overlay);
    this.object3D.add(this.root);
    this.applyScale();
    this.rebuildOverlay();
    this.loadBody();
  }

  setConfig(config: AvatarConfig) {
    const genderChanged = config.gender !== this.cfg.gender;
    this.cfg = config;
    this.applyScale();
    this.rebuildOverlay();
    if (genderChanged) {
      this.loadBody();
    } else {
      this.recolorBody();
    }
  }

  dispose() {
    this.disposed = true;
    this.clearOverlay();
    this.clearBody();
    this.skinMat.dispose();
    this.hairMat.dispose();
    this.shirtMat.dispose();
    this.hoodieMat.dispose();
    this.pantsMat.dispose();
    this.shoeMat.dispose();
    this.sockMat.dispose();
    this.eyeWhiteMat.dispose();
    this.eyePupilMat.dispose();
    this.mouthMat.dispose();
    this.logoToken += 1;
    this.logoTexture?.dispose();
    this.logoTexture = null;
    this.logoMesh.geometry.dispose();
    (this.logoMesh.material as THREE.Material).dispose();
    this.numberMesh.geometry.dispose();
    (this.numberMesh.material as THREE.Material).dispose();
  }

  private get dims() {
    return DIMS[this.cfg.gender];
  }

  private applyScale() {
    this.root.scale.setScalar(this.height / this.dims.bodyHeight);
  }

  private clearOverlay() {
    this.overlay.children.slice().forEach((child) => {
      if (child === this.logoMesh || child === this.numberMesh) return;
      this.overlay.remove(child);
      child.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
    });
  }

  private clearBody() {
    if (!this.body) return;
    this.root.remove(this.body);
    this.body.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        const material = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material.dispose();
      }
    });
    this.body = null;
  }

  private async loadBody() {
    const gender = this.cfg.gender;
    this.clearBody();
    try {
      const source = await loadBlinkModel(gender);
      if (this.disposed || this.cfg.gender !== gender) return;

      const model = skeletonClone(source);
      const clonedMaterials: THREE.MeshStandardMaterial[] = [];
      model.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (mesh.name === "Eyes") {
          mesh.visible = false;
          return;
        }
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        const cloned = (mesh.material as THREE.MeshStandardMaterial).clone();
        cloned.roughness = 0.85;
        cloned.metalness = 0.02;
        mesh.material = cloned;
        clonedMaterials.push(cloned);
      });

      if (this.disposed || this.cfg.gender !== gender) {
        clonedMaterials.forEach((material) => material.dispose());
        return;
      }

      this.body = model;
      this.recolorBody();
      poseArmsDown(model);
      this.root.add(model);
    } catch (error) {
      console.error("blink-human: error cargando el cuerpo Blink", error);
    }
  }

  private recolorBody() {
    if (!this.body) return;
    this.body.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (BODY_PART_NAMES.has(mesh.name)) {
        material.color.set(this.cfg.skin);
      } else if (UNDERWEAR_NAMES.has(mesh.name)) {
        material.color.set(this.cfg.shorts);
      }
    });
  }

  private rebuildOverlay() {
    this.clearOverlay();

    this.skinMat.color.set(this.cfg.skin);
    this.hairMat.color.set(this.cfg.hairColor);
    this.shirtMat.color.set(this.cfg.jersey);
    this.pantsMat.color.set(this.cfg.shorts);
    this.shoeMat.color.set(this.cfg.boots);
    this.sockMat.color.set(this.cfg.socks);
    this.shirtMat.map = garmentPattern(this.cfg.jerseyPattern);
    this.shirtMat.needsUpdate = true;
    this.pantsMat.map = garmentPattern(this.cfg.shortsPattern);
    this.pantsMat.needsUpdate = true;

    const hasHoodie = this.cfg.hoodie !== "none";
    this.hoodieMat.color.set(hasHoodie ? this.cfg.hoodie : "#111827");
    this.hoodieMat.map = garmentPattern(this.cfg.hoodiePattern);
    this.hoodieMat.needsUpdate = true;

    this.buildHead();
    this.buildJersey(hasHoodie);
    this.buildShorts();
    this.buildFeet();
    this.buildHair();
    this.buildHeadwear();
    this.updateLogo(hasHoodie);
    this.updateNumber(hasHoodie);
    this.recolorBody();

    this.overlay.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
  }

  private buildHead() {
    const { headY, headR } = this.dims;
    const head = new THREE.Group();
    head.position.y = headY;

    const skull = new THREE.Mesh(new THREE.SphereGeometry(headR, 18, 14), this.skinMat);
    skull.scale.set(1, 1.14, 0.98);
    head.add(skull);

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.82, 16, 12), this.skinMat);
    jaw.scale.set(0.92, 0.6, 0.86);
    jaw.position.set(0, -headR * 0.36, headR * 0.08);
    head.add(jaw);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.42, headR * 0.48, headR * 0.8, 12), this.skinMat);
    neck.position.y = -headR * 1.05;
    head.add(neck);

    for (const side of [-1, 1] as const) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.28, 10, 8), this.skinMat);
      ear.scale.set(0.45, 1, 0.7);
      ear.position.set(side * (headR - 0.006), 0, 0);
      head.add(ear);
    }

    const nose = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.26, 12, 10), this.skinMat);
    nose.scale.set(0.65, 1.15, 1);
    nose.position.set(0, -headR * 0.08, headR + 0.006);
    head.add(nose);

    const eyeX = headR * 0.44;
    const eyeY = headR * 0.28;
    const eyeZ = headR + 0.002;
    const eyeSize = this.cfg.eyes === "round" ? headR * 0.28 : headR * 0.22;

    if (this.cfg.eyes === "closed") {
      for (const side of [-1, 1] as const) {
        const lid = box(this.eyePupilMat, headR * 0.42, 0.013, 0.012);
        lid.position.set(side * eyeX, eyeY, eyeZ);
        head.add(lid);
      }
    } else {
      for (const side of [-1, 1] as const) {
        const white = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 12, 10), this.eyeWhiteMat);
        white.scale.set(1, 1.15, 0.4);
        white.position.set(side * eyeX, eyeY, eyeZ - 0.004);
        head.add(white);

        const iris = new THREE.Mesh(new THREE.SphereGeometry(eyeSize * 0.52, 10, 8), this.eyePupilMat);
        iris.scale.set(1, 1.1, 0.8);
        iris.position.set(side * eyeX, eyeY - 0.002, eyeZ + 0.008);
        head.add(iris);

        const brow = box(this.hairMat, headR * 0.42, 0.012, 0.02);
        brow.position.set(side * eyeX, eyeY + headR * 0.3, eyeZ - 0.01);
        brow.rotation.z = side * -0.12;
        head.add(brow);
      }
    }

    const wide = this.cfg.mouth === "laugh" || this.cfg.mouth === "grin";
    const thin = this.cfg.mouth === "neutral";
    const mouth = box(this.mouthMat, wide ? headR * 0.6 : headR * 0.44, thin ? 0.008 : 0.015, 0.012);
    mouth.position.set(0, -headR * 0.62, eyeZ);
    head.add(mouth);

    this.overlay.add(head);
  }

  private buildJersey(hasHoodie: boolean) {
    const d = this.dims;
    const jerseyMat = hasHoodie ? this.hoodieMat : this.shirtMat;
    const bottom = hasHoodie ? d.torsoBottom - 0.02 : d.torsoBottom;
    const top = hasHoodie ? d.torsoTop + 0.01 : d.torsoTop;
    const width = hasHoodie ? d.torsoW + 0.05 : d.torsoW;
    const depth = hasHoodie ? d.torsoD + 0.04 : d.torsoD;

    const torso = prism(jerseyMat, width, taper(width), top - bottom, depth / width);
    torso.position.set(0, (top + bottom) / 2, d.torsoZ);
    this.overlay.add(torso);

    const collar = prism(jerseyMat, 0.17, 0.21, 0.05, 1);
    collar.position.set(0, top - 0.01, d.torsoZ - 0.02);
    this.overlay.add(collar);

    for (const side of [-1, 1] as const) {
      const sleeve = prism(jerseyMat, d.torsoW * 0.32, d.torsoW * 0.27, 0.26);
      sleeve.position.set(side * (d.shoulderX + 0.01), d.shoulderY - 0.13, d.torsoZ);
      sleeve.rotation.z = side * 0.2;
      this.overlay.add(sleeve);
    }

    if (hasHoodie) {
      const hood = box(this.hoodieMat, d.torsoW * 0.62, 0.19, 0.17);
      hood.position.set(0, d.torsoTop + 0.005, d.torsoZ - 0.13);
      this.overlay.add(hood);
    }
  }

  private buildShorts() {
    const d = this.dims;
    const pelvis = prism(this.pantsMat, d.hipW, d.hipW * 1.02, d.shortsTop - d.shortsBottom + 0.06, d.hipD / d.hipW);
    pelvis.position.set(0, (d.shortsTop + d.shortsBottom) / 2, 0);
    this.overlay.add(pelvis);

    for (const side of [-1, 1] as const) {
      const leg = prism(this.pantsMat, d.hipW * 0.52, d.hipW * 0.46, 0.26, 0.95);
      leg.position.set(side * d.legX, d.shortsBottom - 0.03, 0);
      this.overlay.add(leg);
    }
  }

  private buildFeet() {
    const d = this.dims;
    for (const side of [-1, 1] as const) {
      const sock = prism(this.sockMat, d.sockR * 1.7, d.sockR * 1.35, d.sockTop - d.sockBottom, d.sockR * 2 / (d.sockR * 1.7));
      sock.position.set(side * d.legX, (d.sockTop + d.sockBottom) / 2, 0);
      this.overlay.add(sock);

      const shoe = box(this.shoeMat, d.footW, d.footH, d.footL);
      shoe.position.set(side * d.legX, d.footY, d.footZ);
      this.overlay.add(shoe);
    }
  }

  private buildHair() {
    if (this.cfg.hair === "none") return;

    const { headY, headR } = this.dims;
    const hair = new THREE.Group();
    hair.position.y = headY;

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(headR + 0.018, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      this.hairMat,
    );
    cap.position.y = 0.005;
    hair.add(cap);

    const back = box(this.hairMat, headR * 1.9, headR * 1.2, headR * 0.5);
    back.position.set(0, -headR * 0.2, -headR * 0.72);
    hair.add(back);

    const style = this.cfg.hair;
    const top = headR * 1.02;

    if (style === "fringe" || style === "bun" || style === "ponytail" || style === "long" || style === "short") {
      const bangs = box(this.hairMat, headR * 1.85, headR * 0.5, 0.045);
      bangs.position.set(0, top - 0.01, headR * 0.86);
      hair.add(bangs);
    }

    if (style === "spiky") {
      for (let i = 0; i < 5; i += 1) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(headR * 0.24, headR * 0.8, 5), this.hairMat);
        spike.position.set((i - 2) * headR * 0.4, top + headR * 0.5, 0);
        spike.rotation.z = (i - 2) * -0.12;
        hair.add(spike);
      }
    }

    if (style === "side") {
      const swoop = box(this.hairMat, headR * 1.1, headR * 0.5, headR * 2);
      swoop.position.set(-headR * 0.3, top - 0.01, 0);
      swoop.rotation.z = 0.18;
      hair.add(swoop);
    }

    if (style === "afro") {
      const afro = new THREE.Mesh(new THREE.IcosahedronGeometry(headR * 1.5, 1), this.hairMat);
      afro.position.y = headR * 0.7;
      hair.add(afro);
    }

    if (style === "curly") {
      const spots: Array<[number, number, number]> = [
        [-0.8, 0.75, 0.2],
        [-0.35, 1.05, -0.4],
        [0.35, 1.05, 0.4],
        [0.8, 0.75, -0.2],
        [0, 0.95, 0.75],
        [-0.85, -0.1, -0.6],
        [0.85, -0.1, -0.5],
      ];
      for (const [sx, sy, sz] of spots) {
        const curl = new THREE.Mesh(new THREE.IcosahedronGeometry(headR * 0.44, 1), this.hairMat);
        curl.position.set(sx * headR, sy * headR, sz * headR);
        hair.add(curl);
      }
    }

    if (style === "long") {
      for (const side of [-1, 1] as const) {
        const panel = box(this.hairMat, headR * 0.45, headR * 2.6, headR * 1.3);
        panel.position.set(side * headR * 0.92, -headR * 0.5, -headR * 0.1);
        hair.add(panel);
      }
    }

    if (style === "bun") {
      const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(headR * 0.55, 1), this.hairMat);
      bun.position.set(0, top + headR * 0.55, -headR * 0.25);
      hair.add(bun);
    }

    if (style === "ponytail") {
      const tail = box(this.hairMat, headR * 0.55, headR * 2.1, headR * 0.55);
      tail.position.set(0, -headR * 0.3, -headR * 1.15);
      tail.rotation.x = 0.3;
      hair.add(tail);
    }

    this.overlay.add(hair);
  }

  private buildHeadwear() {
    const style = this.cfg.accessory;
    if (style === "none") return;

    const { headY, headR } = this.dims;
    const head = new THREE.Group();
    head.position.y = headY;

    if (style === "cap") {
      const crown = box(this.shirtMat, headR * 2.25, headR * 0.8, headR * 2.25);
      crown.position.set(0, headR * 0.72, 0);
      head.add(crown);

      const brim = box(this.shirtMat, headR * 1.9, 0.02, headR * 1.1);
      brim.position.set(0, headR * 0.6, headR * 1.35);
      head.add(brim);
      this.overlay.add(head);
      return;
    }

    if (style === "beanie") {
      const cap = box(this.hairMat, headR * 2.35, headR * 1.15, headR * 2.35);
      cap.position.set(0, headR * 0.82, 0);
      head.add(cap);

      const fold = box(this.hairMat, headR * 2.5, headR * 0.4, headR * 2.5);
      fold.position.set(0, headR * 0.42, 0);
      head.add(fold);
      this.overlay.add(head);
      return;
    }

    if (style === "headband") {
      const band = box(this.sockMat, headR * 2.3, headR * 0.32, headR * 2.3);
      band.position.set(0, headR * 0.42, 0);
      head.add(band);
      this.overlay.add(head);
    }
  }

  private updateLogo(hasHoodie: boolean) {
    const d = this.dims;
    const frontZ = (hasHoodie ? d.torsoD + 0.04 : d.torsoD) / 2 + 0.012;
    const frontY = (d.torsoTop + d.torsoBottom) / 2 + 0.06;
    this.logoMesh.position.set(0, frontY, frontZ + d.torsoZ);
    const src = this.cfg.shieldUrl;
    if (src === this.logoSrc) {
      this.logoMesh.visible = Boolean(src);
      return;
    }
    this.logoSrc = src;
    const token = ++this.logoToken;
    if (!src) {
      this.logoMesh.visible = false;
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      src,
      (texture) => {
        if (token !== this.logoToken) {
          texture.dispose();
          return;
        }
        this.logoTexture?.dispose();
        this.logoTexture = texture;
        const material = this.logoMesh.material as THREE.MeshBasicMaterial;
        material.map = texture;
        material.needsUpdate = true;
        this.logoMesh.visible = true;
      },
      undefined,
      () => {
        if (token === this.logoToken) this.logoMesh.visible = false;
      },
    );
  }

  private updateNumber(hasHoodie: boolean) {
    const d = this.dims;
    const material = this.numberMesh.material as THREE.MeshBasicMaterial;
    if (!this.cfg.numberBack) {
      this.numberMesh.visible = false;
      return;
    }
    const backZ = -((hasHoodie ? d.torsoD + 0.04 : d.torsoD) / 2 + 0.012) + d.torsoZ;
    const backY = (d.torsoTop + d.torsoBottom) / 2 + 0.04;
    const garment = hasHoodie ? this.cfg.hoodie : this.cfg.jersey;
    material.map = numberTexture(this.cfg.number, contrastColor(garment));
    material.needsUpdate = true;
    this.numberMesh.position.set(0, backY, backZ);
    this.numberMesh.visible = true;
  }
}

function taper(width: number) {
  return width * 0.78;
}

export function createBlinkHuman(options: BlinkHumanOptions): BlinkHuman {
  return new BlinkHuman(options);
}
