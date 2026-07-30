"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HomeWalk3D({ onArrive }: { onArrive: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const arriveRef = useRef(onArrive);
  useEffect(() => { arriveRef.current = onArrive; }, [onArrive]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ab8c2);
    scene.fog = new THREE.Fog(0x9ab8c2, 18, 68);
    const camera = new THREE.PerspectiveCamera(58, host.clientWidth / host.clientHeight, .1, 90);
    camera.position.set(0, 1.65, 7);
    camera.lookAt(0, 1.4, -12);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdcefff, 0x32413b, 1.7));
    const sun = new THREE.DirectionalLight(0xffdb9a, 2.2);
    sun.position.set(-8, 12, 7);
    sun.castShadow = true;
    scene.add(sun);

    const box = (size: number[], position: number[], color: number) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        new THREE.MeshStandardMaterial({ color, roughness: .86 }),
      );
      mesh.position.set(position[0], position[1], position[2]);
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    box([26, .12, 80], [0, -.08, -25], 0x50645b);
    box([5.5, .04, 80], [0, .01, -25], 0x58605e);
    for (let i = 0; i < 14; i++) box([.08, .02, 2.5], [0, .04, 3 - i * 5.5], 0xded39b);
    for (let i = 0; i < 9; i++) {
      const z = 2 - i * 7;
      const side = i % 2 ? -1 : 1;
      box([4.8, 3 + (i % 3), 4], [side * 7.5, 1.5 + (i % 3) / 2, z], [0x856d61,0xb09079,0x71857b][i % 3]);
      box([.16, 4.3, .16], [-side * 3.6, 2.1, z - 1], 0x29362f);
      const lamp = box([.35, .18, .35], [-side * 3.6, 4.25, z - 1], 0xffcc7a);
      (lamp.material as THREE.MeshStandardMaterial).emissive.setHex(0xffa83d);
      (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
    }
    const home = box([6.2, 4.1, 5], [0, 2.05, -60], 0xf2c6a5);
    box([1.4, 2.4, .2], [0, 1.2, -57.42], 0x3d5f58);
    const homeLight = new THREE.PointLight(0x249cff, 42, 17, 1.4);
    homeLight.position.set(0, 2.6, -55.8);
    scene.add(homeLight);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5.2, 2.4, 4),
      new THREE.MeshStandardMaterial({ color: 0x824b3b }),
    );
    roof.position.set(0, 5.1, -60);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);
    home.userData.home = true;

    const keys = new Set<string>();
    let looking = false, lastX = 0, yaw = 0, pitch = 0, frame = 0, previous = performance.now(), arrived = false;
    const keyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (["KeyW","KeyA","KeyS","KeyD"].includes(event.code)) {
        keys.add(event.code);
        event.preventDefault();
      }
    };
    const keyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const down = (event: PointerEvent) => {
      looking = event.button === 2 || event.pointerType === "touch";
      lastX = event.clientX;
      if (looking) renderer.domElement.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!looking) return;
      yaw -= (event.clientX - lastX) * .005;
      pitch = THREE.MathUtils.clamp(pitch + event.movementY * .003, -.3, .3);
      lastX = event.clientX;
    };
    const up = () => { looking = false; };
    const menu = (event: MouseEvent) => event.preventDefault();
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("contextmenu", menu);
    const forward = new THREE.Vector3(), right = new THREE.Vector3();
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const delta = Math.min((now - previous) / 1000, .05);
      previous = now;
      camera.rotation.order = "YXZ";
      camera.rotation.y += (yaw - camera.rotation.y) * .09;
      camera.rotation.x += (pitch - camera.rotation.x) * .09;
      forward.set(-Math.sin(camera.rotation.y), 0, -Math.cos(camera.rotation.y));
      right.set(Math.cos(camera.rotation.y), 0, -Math.sin(camera.rotation.y));
      const speed = 4.2 * delta;
      if (keys.has("KeyW")) camera.position.addScaledVector(forward, speed);
      if (keys.has("KeyS")) camera.position.addScaledVector(forward, -speed);
      if (keys.has("KeyA")) camera.position.addScaledVector(right, -speed);
      if (keys.has("KeyD")) camera.position.addScaledVector(right, speed);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -2.5, 2.5);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -57.2, 8);
      if (!arrived && camera.position.z < -55) {
        arrived = true;
        arriveRef.current();
      }
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(draw);
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);

  return <div className="home-walk-3d" ref={mount} />;
}
