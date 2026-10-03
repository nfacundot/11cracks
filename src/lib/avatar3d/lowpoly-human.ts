import * as THREE from "three";
import type { AvatarConfig } from "@/lib/avatar";
import { contrastColor, garmentPattern, numberTexture } from "@/lib/avatar3d/patterns";

export type LowpolyHumanOptions = {
  config: AvatarConfig;
  height?: number;
};

function makeMaterial(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.78,
    metalness: 0.04,
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
  sides = 16,
) {
  const geometry = new THREE.CylinderGeometry(
    widthTop / 2,
    widthBottom / 2,
    height,
    sides,
    1,
  );
  geometry.rotateY(Math.PI / sides);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.z = depthRatio;
  return mesh;
}

function box(material: THREE.Material, w: number, h: number, d: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function jitterGeometry(mesh: THREE.Mesh, amount: number, rand: () => number) {
  const position = mesh.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!position) return;
  for (let i = 0; i < position.count; i += 1) {
    position.setXYZ(
      i,
      position.getX(i) + (rand() - 0.5) * amount,
      position.getY(i) + (rand() - 0.5) * amount,
      position.getZ(i) + (rand() - 0.5) * amount,
    );
  }
  position.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

const HEAD_W = 0.22;
const HEAD_H = 0.26;
const HEAD_D = 0.22;
const HEAD_CY = 1.83;
const NECK_TOP = 1.7;
const SHOULDER_Y = 1.58;
const HIP_Y = 0.98;

export class LowpolyHuman {
  readonly object3D = new THREE.Group();

  private readonly body = new THREE.Group();
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
  private logoSrc: string | null = null;
  private logoTexture: THREE.Texture | null = null;
  private logoToken = 0;
  private cfg: AvatarConfig;
  private readonly rng: () => number;
  private armL: THREE.Group | null = null;
  private armR: THREE.Group | null = null;
  private forearmL: THREE.Group | null = null;
  private forearmR: THREE.Group | null = null;
  private legL: THREE.Group | null = null;
  private legR: THREE.Group | null = null;
  private shinL: THREE.Group | null = null;
  private shinR: THREE.Group | null = null;
  private lying = false;

  constructor({ config, height = 2 }: LowpolyHumanOptions) {
    this.cfg = config;
    this.rng = seededRandom(Math.floor(Math.random() * 0xffffffff));
    this.object3D.add(this.body);
    this.object3D.scale.setScalar(height / 2);

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
      new THREE.PlaneGeometry(0.26, 0.26),
      new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide }),
    );
    this.logoMesh.position.set(0, 1.3, 0.118);
    this.logoMesh.visible = false;
    this.object3D.add(this.logoMesh);

    this.numberMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.3),
      new THREE.MeshBasicMaterial({ transparent: true, side: THREE.FrontSide }),
    );
    this.numberMesh.position.set(0, 1.3, -0.115);
    this.numberMesh.rotation.y = Math.PI;
    this.numberMesh.visible = false;
    this.object3D.add(this.numberMesh);

    this.rebuild();
  }

  setConfig(config: AvatarConfig) {
    this.cfg = config;
    this.rebuild();
  }

  setWalk(phase: number, amount: number) {
    if (this.lying) {
      this.lying = false;
      this.body.rotation.x = 0;
      this.body.position.set(0, 0, 0);
    }
    const s = Math.sin(phase) * amount;
    const c = Math.cos(phase) * amount;
    const sOpp = Math.sin(phase + Math.PI) * amount;
    const cOpp = Math.cos(phase + Math.PI) * amount;

    if (this.legR) this.legR.rotation.x = s;
    if (this.legL) this.legL.rotation.x = sOpp;
    if (this.armR) this.armR.rotation.x = sOpp * 0.85;
    if (this.armL) this.armL.rotation.x = s * 0.85;
    if (this.shinR) this.shinR.rotation.x = Math.max(0, -c) * 1.15;
    if (this.shinL) this.shinL.rotation.x = Math.max(0, -cOpp) * 1.15;
    if (this.forearmR) this.forearmR.rotation.x = -(0.25 * amount + Math.max(0, sOpp) * 0.85);
    if (this.forearmL) this.forearmL.rotation.x = -(0.25 * amount + Math.max(0, s) * 0.85);
  }

  sit() {
    if (this.legR) this.legR.rotation.x = -1.45;
    if (this.legL) this.legL.rotation.x = -1.45;
    if (this.shinR) this.shinR.rotation.x = 1.3;
    if (this.shinL) this.shinL.rotation.x = 1.3;
    if (this.armR) this.armR.rotation.x = -0.2;
    if (this.armL) this.armL.rotation.x = -0.2;
    if (this.forearmR) this.forearmR.rotation.x = -0.55;
    if (this.forearmL) this.forearmL.rotation.x = -0.55;
  }

  stand() {
    this.setWalk(0, 0);
  }

  lie(phase = 0) {
    this.lying = true;
    this.body.rotation.x = -Math.PI / 2 + Math.sin(phase) * 0.03;
    this.body.position.set(0, 0.6, 0);
    if (this.armL) this.armL.rotation.x = 0.28;
    if (this.armR) this.armR.rotation.x = 0.28;
    if (this.forearmL) this.forearmL.rotation.x = -0.4;
    if (this.forearmR) this.forearmR.rotation.x = -0.4;
    if (this.legL) this.legL.rotation.x = 0.06;
    if (this.legR) this.legR.rotation.x = -0.06;
    if (this.shinL) this.shinL.rotation.x = 0;
    if (this.shinR) this.shinR.rotation.x = 0;
  }

  perform(action: "brush" | "drink" | "eat" | "shower" | "toilet", phase = 0) {
    this.setWalk(0, 0);
    if (action === "toilet") {
      if (this.legR) this.legR.rotation.x = -1.45;
      if (this.legL) this.legL.rotation.x = -1.45;
      if (this.shinR) this.shinR.rotation.x = 1.3;
      if (this.shinL) this.shinL.rotation.x = 1.3;
      if (this.armR) this.armR.rotation.x = -0.3;
      if (this.armL) this.armL.rotation.x = -0.3;
      return;
    }
    if (action === "shower") {
      if (this.armR) this.armR.rotation.x = -2.2 + Math.sin(phase) * 0.3;
      if (this.armL) this.armL.rotation.x = -2.2 + Math.sin(phase + 1) * 0.3;
      if (this.forearmR) this.forearmR.rotation.x = -0.6;
      if (this.forearmL) this.forearmL.rotation.x = -0.6;
      return;
    }
    const base = action === "brush" ? -2 : action === "drink" ? -1.9 : -1.7;
    if (this.armR) this.armR.rotation.x = base + Math.sin(phase) * (action === "eat" ? 0.45 : 0.22);
    if (this.forearmR) this.forearmR.rotation.x = -1.25;
    if (this.armL) this.armL.rotation.x = -0.08;
  }

  dispose() {
    this.clear();
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
    this.object3D.remove(this.logoMesh);
    this.numberMesh.geometry.dispose();
    (this.numberMesh.material as THREE.Material).dispose();
    this.object3D.remove(this.numberMesh);
  }

  private clear() {
    this.body.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    this.body.clear();
  }

  private jitter(mesh: THREE.Mesh, amount: number) {
    jitterGeometry(mesh, amount, this.rng);
  }

  private rebuild() {
    this.clear();
    this.armL = null;
    this.armR = null;
    this.forearmL = null;
    this.forearmR = null;
    this.legL = null;
    this.legR = null;
    this.shinL = null;
    this.shinR = null;

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

    const female = this.cfg.gender === "female";
    const shoulderW = female ? 0.4 : 0.48;
    const chestD = 0.2;
    const waistW = female ? 0.27 : 0.31;
    const hipW = female ? 0.38 : 0.32;
    const legX = hipW / 4 + 0.015;

    this.buildTorso(shoulderW, waistW, chestD, hipW, female, hasHoodie);
    this.buildArms(shoulderW, female, hasHoodie);
    this.buildLegs(legX, female);
    this.buildHead();
    this.buildHair(female);
    this.logoMesh.position.z = hasHoodie ? 0.14 : 0.115;
    this.applyLogo(this.cfg.shieldUrl);
    this.applyNumber(hasHoodie);

    this.body.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
  }

  private applyNumber(hasHoodie: boolean) {
    const material = this.numberMesh.material as THREE.MeshBasicMaterial;
    if (!this.cfg.numberBack) {
      this.numberMesh.visible = false;
      return;
    }
    const garment = hasHoodie ? this.cfg.hoodie : this.cfg.jersey;
    material.map = numberTexture(this.cfg.number, contrastColor(garment));
    material.needsUpdate = true;
    this.numberMesh.position.z = hasHoodie ? -0.14 : -0.12;
    this.numberMesh.visible = true;
  }

  private buildTorso(shoulderW: number, waistW: number, chestD: number, hipW: number, female: boolean, hasHoodie: boolean) {
    const torso = prism(this.shirtMat, shoulderW, waistW, SHOULDER_Y - 1.0, chestD / shoulderW);
    this.jitter(torso, 0.018);
    torso.position.y = (SHOULDER_Y + 1.0) / 2;
    this.body.add(torso);

    if (hasHoodie) {
      const shew = shoulderW + 0.045;
      const shell = prism(this.hoodieMat, shew, waistW + 0.05, SHOULDER_Y - 1.0 + 0.02, (chestD + 0.045) / shew);
      this.jitter(shell, 0.02);
      shell.position.y = (SHOULDER_Y + 1.0) / 2;
      this.body.add(shell);

      const hood = box(this.hoodieMat, 0.27, 0.16, 0.15);
      this.jitter(hood, 0.02);
      hood.position.set(0, SHOULDER_Y - 0.01, -0.1);
      this.body.add(hood);
    }

    const collar = prism(this.shirtMat, 0.14, 0.18, 0.05, 1);
    this.jitter(collar, 0.015);
    collar.position.y = SHOULDER_Y + 0.01;
    this.body.add(collar);

    const pelvis = prism(this.pantsMat, hipW, hipW * 0.98, HIP_Y - 0.82, 0.62);
    this.jitter(pelvis, 0.018);
    pelvis.position.y = (HIP_Y + 0.82) / 2;
    this.body.add(pelvis);

    if (female) {
      const chest = box(this.shirtMat, shoulderW * 0.7, 0.1, chestD * 0.5);
      this.jitter(chest, 0.02);
      chest.position.set(0, SHOULDER_Y - 0.12, chestD * 0.34);
      this.body.add(chest);
    }
  }

  private buildArms(shoulderW: number, female: boolean, hasHoodie: boolean) {
    const armW = female ? 0.105 : 0.125;
    const shoulderX = shoulderW / 2 - armW / 2 + 0.01;

    for (const side of [-1, 1] as const) {
      const upper = new THREE.Group();
      upper.position.set(side * shoulderX, SHOULDER_Y - 0.02, 0);
      upper.rotation.z = side * 0.13;
      if (side === -1) this.armR = upper;
      else this.armL = upper;

      const sleeveW = hasHoodie ? armW + 0.025 : armW;
      const sleeve = prism(hasHoodie ? this.hoodieMat : this.shirtMat, sleeveW, sleeveW * 0.82, hasHoodie ? 0.34 : 0.3);
      this.jitter(sleeve, 0.014);
      sleeve.position.y = -0.15;
      upper.add(sleeve);

      const forearm = new THREE.Group();
      forearm.position.y = -0.3;
      forearm.rotation.z = side * -0.06;
      if (side === -1) this.forearmR = forearm;
      else this.forearmL = forearm;

      const lower = prism(this.skinMat, armW * 0.8, armW * 0.68, 0.3);
      this.jitter(lower, 0.014);
      lower.position.y = -0.15;
      forearm.add(lower);

      const hand = box(this.skinMat, armW * 0.85, 0.13, armW * 0.65);
      this.jitter(hand, 0.012);
      hand.position.y = -0.35;
      forearm.add(hand);

      upper.add(forearm);
      this.body.add(upper);
    }
  }

  private buildLegs(legX: number, female: boolean) {
    const thighW = female ? 0.16 : 0.175;
    const kneeW = 0.14;
    const ankleW = 0.12;

    for (const side of [-1, 1] as const) {
      const thigh = new THREE.Group();
      thigh.position.set(side * legX, HIP_Y, 0);
      thigh.rotation.z = side * 0.04;
      if (side === -1) this.legR = thigh;
      else this.legL = thigh;

      const thighMesh = prism(this.skinMat, thighW, kneeW, 0.44);
      this.jitter(thighMesh, 0.014);
      thighMesh.position.y = -0.22;
      thigh.add(thighMesh);

      const shortsLeg = prism(this.pantsMat, thighW + 0.04, thighW + 0.02, 0.2);
      this.jitter(shortsLeg, 0.016);
      shortsLeg.position.y = -0.1;
      thigh.add(shortsLeg);

      const shin = new THREE.Group();
      shin.position.y = -0.44;
      if (side === -1) this.shinR = shin;
      else this.shinL = shin;

      const shinMesh = prism(this.skinMat, kneeW, ankleW, 0.4);
      this.jitter(shinMesh, 0.014);
      shinMesh.position.y = -0.2;
      shin.add(shinMesh);

      const sock = prism(this.sockMat, ankleW + 0.015, ankleW + 0.01, 0.2);
      this.jitter(sock, 0.012);
      sock.position.y = -0.3;
      shin.add(sock);

      const shoe = box(this.shoeMat, ankleW + 0.05, 0.12, 0.28);
      shoe.position.set(0, -0.42, 0.05);
      shin.add(shoe);

      thigh.add(shin);
      this.body.add(thigh);
    }
  }

  private buildHead() {
    const head = new THREE.Group();
    head.position.y = HEAD_CY;

    const skullRadius = HEAD_W / 2;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(skullRadius, 18, 14), this.skinMat);
    skull.scale.set(1, HEAD_H / (skullRadius * 2), 0.96);
    this.jitter(skull, 0.008);
    head.add(skull);

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(skullRadius * 0.82, 16, 12), this.skinMat);
    jaw.scale.set(0.92, 0.62, 0.85);
    jaw.position.set(0, -skullRadius * 0.34, skullRadius * 0.06);
    this.jitter(jaw, 0.008);
    head.add(jaw);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, NECK_TOP - SHOULDER_Y + 0.04, 14), this.skinMat);
    neck.position.y = -HEAD_H / 2 - 0.03;
    head.add(neck);

    for (const side of [-1, 1] as const) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), this.skinMat);
      ear.scale.set(0.45, 1, 0.7);
      ear.position.set(side * (HEAD_W / 2 - 0.005), 0.005, 0);
      head.add(ear);
    }

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), this.skinMat);
    nose.scale.set(0.7, 1.25, 1);
    nose.position.set(0, -0.01, HEAD_D / 2 + 0.012);
    head.add(nose);

    this.buildEyes(head);
    this.buildMouth(head);
    this.buildHeadwear(head);

    this.body.add(head);
  }

  private buildHeadwear(head: THREE.Group) {
    const style = this.cfg.accessory;
    if (style === "none") return;

    const top = HEAD_H / 2;

    if (style === "cap") {
      const crown = box(this.shirtMat, HEAD_W + 0.05, 0.1, HEAD_D + 0.05);
      crown.position.set(0, top - 0.01, 0);
      head.add(crown);

      const brim = box(this.shirtMat, HEAD_W + 0.02, 0.025, 0.12);
      brim.position.set(0, top - 0.045, HEAD_D / 2 + 0.06);
      head.add(brim);

      const button = box(this.shirtMat, 0.03, 0.02, 0.03);
      button.position.set(0, top + 0.05, 0);
      head.add(button);
      return;
    }

    if (style === "beanie") {
      const cap = box(this.hairMat, HEAD_W + 0.055, 0.13, HEAD_D + 0.055);
      cap.position.set(0, top - 0.005, 0);
      head.add(cap);

      const fold = box(this.hairMat, HEAD_W + 0.065, 0.045, HEAD_D + 0.065);
      fold.position.set(0, top - 0.075, 0);
      head.add(fold);
      return;
    }

    if (style === "headband") {
      const band = box(this.sockMat, HEAD_W + 0.05, 0.035, HEAD_D + 0.05);
      band.position.set(0, top - 0.075, 0);
      head.add(band);
    }
  }

  private applyLogo(src: string | null) {
    if (src === this.logoSrc) {
      const material = this.logoMesh.material as THREE.MeshBasicMaterial;
      this.logoMesh.visible = Boolean(src) && material.map !== null;
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

  private buildEyes(head: THREE.Group) {
    const x = 0.055;
    const y = 0.035;
    const z = HEAD_D / 2 + 0.005;

    if (this.cfg.eyes === "closed") {
      for (const side of [-1, 1] as const) {
        const lid = box(this.eyePupilMat, 0.052, 0.013, 0.012);
        lid.position.set(side * x, y, z);
        head.add(lid);
      }
      return;
    }

    const size = this.cfg.eyes === "round" ? 0.034 : 0.028;
    for (const side of [-1, 1] as const) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 10), this.eyeWhiteMat);
      white.scale.set(1, 1.15, 0.4);
      white.position.set(side * x, y, z - 0.004);
      head.add(white);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(size * 0.52, 10, 8), this.eyePupilMat);
      iris.scale.set(1, 1.1, 0.8);
      iris.position.set(side * x, y - 0.002, z + 0.01);
      head.add(iris);

      const brow = box(this.hairMat, 0.052, 0.012, 0.02);
      brow.position.set(side * x, y + 0.035, z - 0.005);
      brow.rotation.z = side * -0.12;
      head.add(brow);
    }
  }

  private buildMouth(head: THREE.Group) {
    const z = HEAD_D / 2 + 0.005;
    const wide = this.cfg.mouth === "laugh" || this.cfg.mouth === "grin";
    const thin = this.cfg.mouth === "neutral";

    const mouth = box(this.mouthMat, wide ? 0.075 : 0.055, thin ? 0.008 : 0.016, 0.012);
    mouth.position.set(0, -0.075, z);
    head.add(mouth);
  }

  private buildHair(female: boolean) {
    if (this.cfg.hair === "none") return;

    const hair = new THREE.Group();
    hair.position.y = HEAD_CY;
    const r = HEAD_W / 2;
    const top = HEAD_H / 2;
    const style = this.cfg.hair;

    // Casquete superior con línea de nacimiento alta (deja ver la frente).
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(r + 0.016, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.3),
      this.hairMat,
    );
    cap.position.y = 0.006;
    cap.scale.set(1.03, 1.06, 1.03);
    hair.add(cap);

    // Nuca.
    const nape = box(this.hairMat, HEAD_W + 0.02, HEAD_H * 0.72, 0.06);
    nape.position.set(0, -0.02, -(r * 0.9));
    hair.add(nape);

    // Laterales y patillas.
    for (const side of [-1, 1] as const) {
      const panel = box(this.hairMat, 0.045, HEAD_H * 0.55, HEAD_D * 0.86);
      panel.position.set(side * (r + 0.004), -0.006, -0.012);
      hair.add(panel);

      const sideburn = box(this.hairMat, 0.03, 0.05, 0.03);
      sideburn.position.set(side * (r + 0.001), -0.055, 0.02);
      hair.add(sideburn);
    }

    if (style === "fringe") {
      const bangs = box(this.hairMat, HEAD_W * 0.98, 0.055, 0.05);
      bangs.position.set(0, 0.088, r + 0.012);
      hair.add(bangs);
    }

    if (style === "spiky") {
      for (let i = 0; i < 5; i += 1) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.1, 5), this.hairMat);
        spike.position.set((i - 2) * 0.045, top + 0.03, -0.01);
        spike.rotation.z = (i - 2) * -0.14;
        hair.add(spike);
      }
    }

    if (style === "side") {
      const swoop = box(this.hairMat, HEAD_W * 0.72, 0.06, r * 1.95);
      swoop.position.set(-HEAD_W * 0.16, 0.092, -0.005);
      swoop.rotation.z = 0.16;
      hair.add(swoop);
    }

    if (style === "afro") {
      const afro = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.55, 1), this.hairMat);
      afro.position.set(0, 0.035, -0.012);
      afro.scale.set(1, 0.96, 1);
      hair.add(afro);
    }

    if (style === "curly") {
      const positions: Array<[number, number, number]> = [
        [-0.095, 0.075, 0.02],
        [-0.045, 0.115, -0.045],
        [0.045, 0.115, -0.02],
        [0.095, 0.075, 0.02],
        [0, 0.12, 0.05],
        [-0.1, 0.02, -0.075],
        [0.1, 0.02, -0.05],
        [-0.075, 0.09, -0.085],
        [0.075, 0.09, -0.06],
      ];
      for (const [px, py, pz] of positions) {
        const curl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), this.hairMat);
        curl.position.set(px, py, pz);
        hair.add(curl);
      }
    }

    if (style === "long") {
      for (const side of [-1, 1] as const) {
        const panel = box(this.hairMat, 0.05, 0.34, 0.15);
        panel.position.set(side * r, -0.055, -0.02);
        hair.add(panel);
      }
      const backPanel = box(this.hairMat, HEAD_W * 0.9, 0.28, 0.06);
      backPanel.position.set(0, -0.08, -(r * 0.82));
      hair.add(backPanel);
    }

    if (style === "bun") {
      const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.062, 1), this.hairMat);
      bun.position.set(0, top + 0.045, -(r * 0.35));
      hair.add(bun);
    }

    if (style === "ponytail") {
      const tail = box(this.hairMat, 0.07, 0.28, 0.07);
      tail.position.set(0, -0.01, -(r + 0.06));
      tail.rotation.x = 0.32;
      hair.add(tail);
    }

    if (female && style === "short") {
      const bob = box(this.hairMat, HEAD_W + 0.03, 0.18, HEAD_D + 0.04);
      bob.position.set(0, -0.075, -0.015);
      hair.add(bob);
    }

    this.body.add(hair);
  }
}

/**
 * Fábrica modular: construye un humano low-poly volumétrico y devuelve el
 * THREE.Group listo para añadir a la escena. `instance.setConfig()` permite
 * recolorear/reconfigurar sin recrear la instancia.
 */
export function createLowPolyHuman(options: LowpolyHumanOptions): LowpolyHuman {
  return new LowpolyHuman(options);
}
