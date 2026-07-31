"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { active:boolean; onProgress:(v:number)=>void; onDanger:(v:number)=>void; onEscape:()=>void; onCaught:()=>void };

export function NeonCorridor({ active, onProgress, onDanger, onEscape, onCaught }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const cb = useRef({ onProgress, onDanger, onEscape, onCaught });
  useEffect(() => { cb.current = { onProgress, onDanger, onEscape, onCaught }; });

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b12);
    scene.fog = new THREE.Fog(0x080b12, 16, 78);
    const camera = new THREE.PerspectiveCamera(65, host.clientWidth / host.clientHeight, .1, 120);
    camera.position.set(0, 1.55, 5);
    const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:"high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0x93bfff, 0x100b22, 1.35));
    const runnerLight = new THREE.PointLight(0x56d8ff, 35, 18);
    scene.add(runnerLight);

    const box = (size:[number,number,number], pos:[number,number,number], color:number, transparent=false) => {
      const material = new THREE.MeshPhysicalMaterial({ color, roughness:transparent?.08:.55, metalness:transparent?.05:.25,
        transparent, opacity:transparent?.28:1, transmission:transparent?.35:0, side:transparent?THREE.DoubleSide:THREE.FrontSide });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...pos); scene.add(mesh); return mesh;
    };
    box([10,.12,220],[0,-.06,-97],0x121727);
    box([10,.08,220],[0,5.1,-97],0x101321);
    box([.12,5.2,220],[-5,2.5,-97],0x4d7794,true);
    box([.12,5.2,220],[5,2.5,-97],0x4d7794,true);
    const colors=[0xff375f,0x4d7cff,0xffc928,0xb85cff,0x20df9f,0xff7538];
    for(let i=0;i<45;i++){
      const z=1-i*4.5, color=colors[i%colors.length];
      for(const side of [-1,1]){ const p=box([.58,4.7,.58],[side*4.35,2.3,z],color); p.material.emissive.setHex(color); p.material.emissiveIntensity=.7; }
      const strip=box([4.7,.045,.28],[0,4.88,z],0xbfeaff); strip.material.emissive.setHex(0x55cfff); strip.material.emissiveIntensity=3;
    }
    const obstacles:THREE.Mesh[]=[];
    const lanes=[-2.6,0,2.6];
    for(let i=0;i<31;i++){
      const lane=lanes[(i*7+1)%3], glass=box([2.2,3.5,.16],[lane,1.75,-10-i*5.7],0x80dfff,true);
      obstacles.push(glass);
      const edge=box([2.3,.06,.23],[lane,3.52,glass.position.z],0x7fe8ff); edge.material.emissive.setHex(0x48caff); edge.material.emissiveIntensity=2;
    }
    const leftDoor=box([2.18,4.1,.14],[-1.12,2.05,-198],0xc0efff,true);
    const rightDoor=box([2.18,4.1,.14],[1.12,2.05,-198],0xc0efff,true);
    const exitGlow=new THREE.PointLight(0xb4f7ff,120,25); exitGlow.position.set(0,2.2,-200); scene.add(exitGlow);
    const hunter=new THREE.Group(), dark=new THREE.MeshStandardMaterial({color:0x030305,roughness:1});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.25,5,10),dark); body.position.y=1.1;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),dark); head.position.y=2.1;
    const eyeMat=new THREE.MeshStandardMaterial({color:0xff1838,emissive:0xff001d,emissiveIntensity:6});
    for(const ex of [-.15,.15]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),eyeMat); eye.position.set(ex,2.14,-.38); hunter.add(eye); }
    hunter.add(body,head); scene.add(hunter);

    const keys=new Set<string>();
    const down=(e:KeyboardEvent)=>{ if(["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(e.code)) keys.add(e.code); };
    const up=(e:KeyboardEvent)=>keys.delete(e.code);
    window.addEventListener("keydown",down); window.addEventListener("keyup",up);
    let steering=0, rightDragging=false, lastPointerX=0;
    const pointerDown=(e:PointerEvent)=>{
      if(e.button!==2) return;
      rightDragging=true; lastPointerX=e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const pointerMove=(e:PointerEvent)=>{
      if(!rightDragging) return;
      steering=THREE.MathUtils.clamp(steering+(e.clientX-lastPointerX)*.008,-1,1);
      lastPointerX=e.clientX;
    };
    const pointerUp=(e:PointerEvent)=>{ if(e.button===2) rightDragging=false; };
    const contextMenu=(e:MouseEvent)=>e.preventDefault();
    const orientation=(e:DeviceOrientationEvent)=>{
      if(e.gamma==null||rightDragging) return;
      steering=THREE.MathUtils.clamp(e.gamma/28,-1,1);
    };
    renderer.domElement.addEventListener("pointerdown",pointerDown);
    renderer.domElement.addEventListener("pointermove",pointerMove);
    renderer.domElement.addEventListener("pointerup",pointerUp);
    renderer.domElement.addEventListener("pointercancel",pointerUp);
    renderer.domElement.addEventListener("contextmenu",contextMenu);
    window.addEventListener("deviceorientation",orientation);
    let z=5,x=0,threat=22,last=performance.now(),animation=0,ended=false;
    const clock=new THREE.Clock();
    const draw=(now:number)=>{
      animation=requestAnimationFrame(draw);
      const dt=Math.min((now-last)/1000,.05); last=now; const t=clock.getElapsedTime();
      if(active&&!ended){
        const buttonSteering=(keys.has("ArrowRight")||keys.has("KeyD")?1:0)-(keys.has("ArrowLeft")||keys.has("KeyA")?1:0);
        const horizontal=buttonSteering||steering;
        x=THREE.MathUtils.clamp(x+horizontal*dt*5.5,-3.45,3.45);
        const previousZ=z;
        z-=dt*7.6;
        let collision=false;
        for(const obstacle of obstacles) if(Math.abs(z-obstacle.position.z)<.72&&Math.abs(x-obstacle.position.x)<1.42) collision=true;
        if(collision) z=previousZ;
        threat+= (collision?42:-2.2)*dt; threat=THREE.MathUtils.clamp(threat,10,100);
        cb.current.onProgress(Math.min(200,Math.round(5-z))); cb.current.onDanger(threat);
        if(navigator.vibrate&&collision) navigator.vibrate(25);
        if(threat>=99){ ended=true; cb.current.onCaught(); }
        if(z<=-196){ ended=true; cb.current.onEscape(); }
      }
      camera.position.x+=(x-camera.position.x)*.13; camera.position.z=z; camera.position.y=1.58+Math.sin(t*12)*.035;
      camera.lookAt(camera.position.x+steering*7,1.6,z-13); runnerLight.position.set(camera.position.x,2.2,z-1);
      hunter.position.set(camera.position.x*.35,0,z+4.5-threat*.028); hunter.rotation.y=Math.PI;
      if(z<-188){ const opening=THREE.MathUtils.clamp((-188-z)/8,0,1); leftDoor.position.x=-1.12-opening*1.6; rightDoor.position.x=1.12+opening*1.6; }
      renderer.render(scene,camera);
    };
    animation=requestAnimationFrame(draw);
    const resize=()=>{ camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth,host.clientHeight); };
    const observer=new ResizeObserver(resize); observer.observe(host);
    return()=>{ cancelAnimationFrame(animation); observer.disconnect(); window.removeEventListener("keydown",down); window.removeEventListener("keyup",up);
      window.removeEventListener("deviceorientation",orientation); renderer.domElement.removeEventListener("pointerdown",pointerDown);
      renderer.domElement.removeEventListener("pointermove",pointerMove); renderer.domElement.removeEventListener("pointerup",pointerUp);
      renderer.domElement.removeEventListener("pointercancel",pointerUp); renderer.domElement.removeEventListener("contextmenu",contextMenu);
      scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}}); renderer.dispose(); host.replaceChildren(); };
  },[active]);
  return <div className="corridor-canvas" ref={mount} aria-label="색색의 기둥과 유리벽이 있는 3D 복도" />;
}
