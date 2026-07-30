"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  mode: "classroom" | "corridor" | "science" | "home" | "art" | "chase";
  lightOn?: boolean;
  chaseTurn?: number;
  chasePaused?: boolean;
  onReachBranch?: () => void;
  onInteract?: (object: string) => void;
};

export function SchoolScene3D({ mode, lightOn = false, chaseTurn = 0, chasePaused = false, onReachBranch, onInteract }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const interactRef = useRef(onInteract);
  const reachBranchRef = useRef(onReachBranch);
  const chasePausedRef = useRef(chasePaused);
  useEffect(() => { interactRef.current = onInteract; }, [onInteract]);
  useEffect(() => { reachBranchRef.current = onReachBranch; }, [onReachBranch]);
  useEffect(() => { chasePausedRef.current = chasePaused; }, [chasePaused]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const scene = new THREE.Scene();
    const corridorMode = mode === "corridor" || mode === "chase";
    scene.background = new THREE.Color(corridorMode ? 0x090f0d : mode === "art" ? 0x17161b : 0x111b18);
    scene.fog = new THREE.FogExp2(scene.background, corridorMode ? 0.048 : 0.027);
    const camera = new THREE.PerspectiveCamera(57, host.clientWidth / host.clientHeight, 0.1, 70);
    camera.position.set(0, 1.65, corridorMode ? 7 : 4.8);
    camera.lookAt(0, 1.5, corridorMode ? -10 : -2.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const interactive: THREE.Object3D[] = [];
    const flickerMaterials: THREE.MeshStandardMaterial[] = [];
    const makeBox = (size: number[], pos: number[], color: number, action?: string) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
      );
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = mesh.receiveShadow = true;
      if (action) {
        mesh.userData.action = action;
        interactive.push(mesh);
      }
      scene.add(mesh);
      return mesh;
    };
    const ambient = new THREE.HemisphereLight(0xa7bdaf, 0x0c1210, lightOn ? 1.1 : 0.35);
    scene.add(ambient);
    const torch = new THREE.SpotLight(0xeaffb2, lightOn ? 60 : 30, 25, Math.PI / 5.5, 0.55);
    torch.position.copy(camera.position);
    torch.castShadow = true;
    scene.add(torch, torch.target);

    if (!corridorMode) {
      makeBox([12, .15, 14], [0, -.08, -1], 0x3b4540);
      makeBox([12, 5, .18], [0, 2.45, -7.8], 0x29342f);
      makeBox([12, 5, .18], [0, 2.45, 6.2], 0x252f2b);
      makeBox([.18, 5, 14], [-6, 2.45, -1], 0x26312d);
      makeBox([.18, 5, 14], [6, 2.45, -1], 0x26312d);
      makeBox([12, .15, 14], [0, 4.9, -1], 0x202a26);
      makeBox([6.4, 2.35, .12], [0, 2.45, -7.64], 0x806b4a);
      makeBox([6, 2, .15], [0, 2.45, -7.55], 0x153a30, "blackboard");
      makeBox([6.3, .12, .25], [0, 1.4, -7.5], 0x806b4a);
      makeBox([12, .18, .12], [0, 1.15, -7.65], 0x8a7655);
      const chalkLine = makeBox([2.3, .035, .025], [.4, 2.5, -7.45], 0xc9f14a);
      (chalkLine.material as THREE.MeshStandardMaterial).emissive.setHex(0x6b841f);
      (chalkLine.material as THREE.MeshStandardMaterial).emissiveIntensity = .7;
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
        const x = (col - 1) * 2.3, z = 2.3 - row * 2.3;
        makeBox([1.5, .15, .82], [x, 1.05, z], 0x76593a, row === 1 && col === 0 ? "studentDesk" : undefined);
        makeBox([1.25, 1, .1], [x, .78, z + .58], 0x493a29);
        makeBox([.08, 1, .08], [x - .58, .5, z], 0x171e1b);
        makeBox([.08, 1, .08], [x + .58, .5, z], 0x171e1b);
      }
      for (let i = 0; i < 3; i++) {
        const pane = makeBox([.08, 1.8, 1.8], [5.87, 2.45, -4.5 + i * 2.2], 0x77998c, i === 1 ? "window" : undefined);
        (pane.material as THREE.MeshStandardMaterial).emissive.setHex(lightOn ? 0x668d62 : 0x19302a);
        (pane.material as THREE.MeshStandardMaterial).emissiveIntensity = lightOn ? 1.6 : .5;
      }
      makeBox([1.6, 3.2, .2], [-4.4, 1.6, -7.62], 0x513b2b, "door");
      makeBox([2.5, .22, 1.15], [-2.7, 1.08, -5.2], 0x745538, "teacherDesk");
      makeBox([2.1, .9, .12], [-2.7, .62, -5.72], 0x4b3829);
      makeBox([.8, 1.25, .7], [2.4, .62, -6.4], 0x76593a, "podium");
      for (let i = 0; i < 4; i++) {
        makeBox([1.05, 1.15, .55], [4.8, .58 + (i > 1 ? 1.18 : 0), -6.8 + (i % 2) * .62], 0x46534d, "cabinet");
      }
      for (let i = 0; i < 3; i++) {
        const lamp = makeBox([2.1, .06, .48], [-3 + i * 3, 4.72, -1.2], 0xe4efc4);
        (lamp.material as THREE.MeshStandardMaterial).emissive.setHex(0xb9d86b);
        (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
      }
      const clock = new THREE.Mesh(
        new THREE.CylinderGeometry(.34, .34, .08, 24),
        new THREE.MeshStandardMaterial({ color: 0xe8e3d5 }),
      );
      clock.rotation.x = Math.PI / 2;
      clock.position.set(3.9, 3.8, -7.48);
      clock.userData.action = "clock";
      interactive.push(clock);
      scene.add(clock);
      if (mode === "classroom") for (let i = 0; i < 8; i++) {
        const x = -4.9 + i * 1.4;
        const locker = makeBox([1.2, 2.65, .58], [x, 1.34, 5.83], i === 5 ? 0x53645c : 0x394942, i === 5 ? "backLocker" : "lockedLocker");
        const slit = makeBox([.55, .06, .04], [x, 1.95, 5.52], i === 5 ? 0xff6b35 : 0x141c19);
        (slit.material as THREE.MeshStandardMaterial).emissive.setHex(i === 5 ? 0x8b240b : 0x000000);
        makeBox([.08, .22, .05], [x + .42, 1.2, 5.51], 0xc9f14a);
      }
      if (mode === "science") {
        for (let i = 0; i < 4; i++) {
          makeBox([2.1, .18, 1], [-3.3 + (i % 2) * 4.4, 1, -1 + Math.floor(i / 2) * 3], 0x586762, "labTable");
          const liquid = makeBox([.22, .55, .22], [-3 + (i % 2) * 4.4, 1.38, -1 + Math.floor(i / 2) * 3], i === 2 ? 0x49aef1 : 0xc9f14a, "beaker");
          (liquid.material as THREE.MeshStandardMaterial).emissive.setHex(i === 2 ? 0x126ca8 : 0x4e6810);
          (liquid.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        }
        makeBox([2.2, 1.4, .4], [3.8, 2, -7.35], 0x31443d, "scienceMachine");
      }
      if (mode === "home") {
        makeBox([4.6, .2, 1.4], [0, 1, -1.5], 0xede6d2, "kitchenTable");
        for (let i = 0; i < 4; i++) makeBox([.7, .38, .7], [-1.5 + i, 1.3, -1.5], [0xff6b35,0xc9f14a,0x49aef1,0xf0d5b5][i], "ingredient");
        makeBox([5.4, 1.1, .55], [0, .55, -7.25], 0x9caa9f, "oven");
        makeBox([1.2, 1.8, .6], [4.6, .9, -6.9], 0xd5ddd7, "fridge");
      }
      if (mode === "art") {
        for (let i = 0; i < 5; i++) {
          const canvas = makeBox([1.5, 1.8, .08], [-4 + i * 2, 2.25, -7.45], [0x2769a8,0xff6b35,0xd9d2b8,0x7e4aa8,0xc9f14a][i], "painting");
          (canvas.material as THREE.MeshStandardMaterial).emissiveIntensity = .25;
        }
        for (let i = 0; i < 3; i++) {
          makeBox([1.6, .08, 1.1], [-2.5 + i * 2.5, 1.45, -.5], 0x8a7655, "easel");
          makeBox([.08, 2.4, .08], [-2.5 + i * 2.5, .9, -.5], 0x473a2a);
        }
      }
    } else {
      makeBox([5.6, .15, 62], [0, -.08, -22], 0x39443f);
      makeBox([.18, 5, 62], [-2.9, 2.45, -22], 0x26312d);
      makeBox([.18, 5, 62], [2.9, 2.45, -22], 0x26312d);
      makeBox([5.6, .15, 62], [0, 4.8, -22], 0x17201d);
      for (let i = 0; i < 13; i++) {
        const z = 3 - i * 4.5;
        makeBox([.22, 3.2, 1.8], [-2.76, 1.58, z], i % 2 ? 0x3b4641 : 0x4a392c);
        makeBox([.22, 3.2, 1.8], [2.76, 1.58, z - 2], i % 2 ? 0x4a392c : 0x3b4641);
        const lamp = makeBox([1.2, .06, .42], [0, 4.65, z - 1.3], lightOn ? 0xdfff90 : 0x4c5b55);
        (lamp.material as THREE.MeshStandardMaterial).emissive.setHex(lightOn ? 0xc9f14a : 0x17211d);
        (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = lightOn ? 3 : .2;
        flickerMaterials.push(lamp.material as THREE.MeshStandardMaterial);
      }
      for (let i = 0; i < 6; i++) makeBox([.2, 1.5, .82], [-2.65, 1.1, .1 - i * .9], 0x374a42);
      const endDoor = makeBox([2.2, 3.7, .2], [0, 1.85, -51.8], 0x202d28, mode === "corridor" ? "endDoor" : undefined);
      endDoor.userData.label = "과학실";
      const exitLamp = makeBox([.8, .24, .08], [0, 3.65, -51.65], 0x249cff);
      (exitLamp.material as THREE.MeshStandardMaterial).emissive.setHex(0x249cff);
      (exitLamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 3;
      if (mode === "chase") {
        const blueSide = chaseTurn % 2 === 0 ? -1 : 1;
        for (let i = 0; i < 5; i++) {
          const guide = makeBox([.18, .18, .18], [blueSide * 2.45, 1.2, -2 - i * 4.2], 0x249cff);
          (guide.material as THREE.MeshStandardMaterial).emissive.setHex(0x249cff);
          (guide.material as THREE.MeshStandardMaterial).emissiveIntensity = 4;
        }
        const danger = new THREE.PointLight(0xff2e1f, 38, 12, 1.4);
        danger.position.set(0, 1.7, 5);
        scene.add(danger);
        for (let i = 0; i < 9; i++) {
          const z = -1 - i * 5.2;
          const side = i % 2 === 0 ? -1 : 1;
          const debris = makeBox([1.25, .55, .8], [side * 1.05, .28, z], i % 3 ? 0x45372b : 0x283a33);
          debris.rotation.z = side * .18;
          makeBox([.18, 2.2, .18], [-side * 2.55, 2.2, z - 1], 0x070b09);
          makeBox([.7, .12, .12], [-side * 2.2, 2.8, z - 1], 0x070b09);
        }
        [-12, -34].forEach((z) => {
          makeBox([1.65, 4.6, 1.2], [0, 2.3, z], 0x1b2622);
          makeBox([1.1, .16, 1.4], [-2.15, 3.65, z], blueSide === -1 ? 0x249cff : 0x36423d);
          makeBox([1.1, .16, 1.4], [2.15, 3.65, z], blueSide === 1 ? 0x249cff : 0x36423d);
        });

        const hunter = new THREE.Group();
        const shadowMaterial = new THREE.MeshStandardMaterial({ color: 0x020403, roughness: 1 });
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(.48, 1.4, 5, 10), shadowMaterial);
        body.position.y = 1.2;
        const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), shadowMaterial);
        head.position.y = 2.35;
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(.12, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xff3b21, emissive: 0xff2e19, emissiveIntensity: 5 }),
        );
        core.position.set(0, 2.32, -.38);
        hunter.add(body, head, core);
        scene.add(hunter);
        hunter.userData.isHunter = true;
      }
    }

    const points = new Float32Array(540);
    for (let i = 0; i < points.length; i += 3) {
      points[i] = (Math.random() - .5) * 11;
      points[i + 1] = Math.random() * 4.6;
      points[i + 2] = 5 - Math.random() * 28;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(points, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xc9f14a, size: .025, opacity: .4, transparent: true })));

    let looking = false, lastX = 0, lastY = 0, yaw = 0, pitch = 0, animation = 0, tick = 0;
    let branchTriggered = false;
    let downX = 0, downY = 0;
    let dragMoved = false;
    let previousTime = performance.now();
    const keys = new Set<string>();
    const down = (e: PointerEvent) => {
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      dragMoved = false;
      looking = e.button === 2 || e.pointerType === "touch";
      if (looking) renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!looking) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 14) dragMoved = true;
      yaw -= (e.clientX - lastX) * .005;
      pitch = THREE.MathUtils.clamp(pitch + (e.clientY - lastY) * .003, -.32, .32);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const investigate = (clientX?: number, clientY?: number) => {
      if (clientX == null || clientY == null) {
        pointer.set(0, 0);
      } else {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      }
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactive, false)[0];
      if (hit?.object.userData.action) {
        const action = hit.object.userData.action as string;
        if (action === "endDoor" && camera.position.distanceTo(hit.object.position) > 4.5) interactRef.current?.("endDoorFar");
        else interactRef.current?.(action);
      }
    };
    const up = (event: PointerEvent) => {
      looking = false;
    };
    const click = (event: MouseEvent) => {
      if (event.button === 0 && !dragMoved) investigate(event.clientX, event.clientY);
    };
    const mobileInteract = () => investigate();
    let jumpOffset = 0, jumpVelocity = 0;
    const keyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(event.code)) {
        keys.add(event.code);
        event.preventDefault();
        if (event.code === "Space" && mode === "chase" && jumpOffset <= .02) jumpVelocity = 4.8;
      }
    };
    const keyUp = (event: KeyboardEvent) => keys.delete(event.code);
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("click", click);
    window.addEventListener("mobile-interact", mobileInteract);
    const blockMenu = (event: MouseEvent) => event.preventDefault();
    renderer.domElement.addEventListener("contextmenu", blockMenu);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const draw = (now: number) => {
      animation = requestAnimationFrame(draw);
      const delta = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;
      tick += .012;
      if (corridorMode) {
        flickerMaterials.forEach((material, index) => {
          const pulse = Math.sin(tick * (16 + index * .7) + index * 2.1);
          const blackout = Math.sin(tick * 4.1 + index) > .93;
          material.emissiveIntensity = blackout ? .01 : (lightOn ? 2.5 : .2 + Math.max(0, pulse) * 1.9);
        });
        ambient.intensity = lightOn ? 1 : .18 + Math.max(0, Math.sin(tick * 18)) * .28;
      }
      camera.rotation.order = "YXZ";
      camera.rotation.y += (yaw - camera.rotation.y) * .08;
      camera.rotation.x += (pitch - camera.rotation.x) * .08;
      forward.set(-Math.sin(camera.rotation.y), 0, -Math.cos(camera.rotation.y));
      right.set(Math.cos(camera.rotation.y), 0, -Math.sin(camera.rotation.y));
      const speed = 3.2 * delta;
      if (keys.has("KeyW")) camera.position.addScaledVector(forward, speed);
      if (keys.has("KeyS")) camera.position.addScaledVector(forward, -speed);
      if (keys.has("KeyD")) camera.position.addScaledVector(right, speed);
      if (keys.has("KeyA")) camera.position.addScaledVector(right, -speed);
      if (!corridorMode) {
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.1, 5.1);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6.7, 5.8);
      } else {
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -2.35, 2.35);
        if (mode === "chase") {
          if (!chasePausedRef.current) camera.position.z -= delta * (3.9 + chaseTurn * .38);
          if (!branchTriggered && camera.position.z < -9.2) {
            branchTriggered = true;
            reachBranchRef.current?.();
          }
          if (camera.position.z < -47) camera.position.z = 5.5;
        } else camera.position.z = THREE.MathUtils.clamp(camera.position.z, -50.2, 6.2);
      }
      if (mode === "chase") {
        jumpVelocity -= 10.5 * delta;
        jumpOffset = Math.max(0, jumpOffset + jumpVelocity * delta);
        if (jumpOffset === 0) jumpVelocity = Math.max(0, jumpVelocity);
      }
      camera.position.y += (1.65 + jumpOffset + Math.sin(tick * (mode === "chase" ? 8 : 1)) * (mode === "chase" ? .035 : .016) - camera.position.y) * .16;
      torch.position.copy(camera.position);
      camera.getWorldDirection(direction);
      torch.target.position.copy(camera.position).add(direction.multiplyScalar(6));
      if (mode === "chase") {
        const hunter = scene.children.find((object) => object.userData.isHunter);
        if (hunter) {
          hunter.position.set(camera.position.x * .25, 0, camera.position.z + 5.5 + Math.sin(tick * 3) * .45);
          hunter.rotation.y = camera.rotation.y + Math.PI;
        }
      }
      renderer.render(scene, camera);
    };
    animation = requestAnimationFrame(draw);
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
      renderer.dispose();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("mobile-interact", mobileInteract);
      renderer.domElement.removeEventListener("click", click);
      renderer.domElement.removeEventListener("contextmenu", blockMenu);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      host.replaceChildren();
    };
  }, [mode, lightOn, chaseTurn]);

  return <div className="school-3d" ref={mount}><div className="drag-hint"><b>W A S D</b> 이동 · 클릭/터치 조사 · 드래그 시점</div></div>;
}
