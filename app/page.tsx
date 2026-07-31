"use client";

import { useEffect, useRef, useState } from "react";
import { NeonCorridor } from "./SchoolScene3D";

type Phase = "intro" | "playing" | "won" | "caught";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [distance, setDistance] = useState(0);
  const [danger, setDanger] = useState(22);
  const [best, setBest] = useState<number | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("glass-run-best");
    if (saved) setBest(Number(saved));
  }, []);

  async function start() {
    const Orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try { await Orientation.requestPermission?.(); } catch { /* 좌우 버튼으로 계속 플레이 가능 */ }
    startedAt.current = performance.now();
    setDistance(0);
    setDanger(22);
    setPhase("playing");
  }

  function finish() {
    const time = (performance.now() - startedAt.current) / 1000;
    setPhase("won");
    setBest((old) => {
      const next = old === null || time < old ? time : old;
      localStorage.setItem("glass-run-best", String(next));
      return next;
    });
    navigator.vibrate?.([80, 40, 160]);
  }

  const sendKey = (code: string, down: boolean) =>
    window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code }));

  return (
    <main className={`game-shell ${phase}`}>
      {phase !== "intro" && (
        <NeonCorridor active={phase === "playing"} onProgress={setDistance} onDanger={setDanger}
          onEscape={finish} onCaught={() => setPhase("caught")} />
      )}
      {phase === "playing" && (
        <>
          <header className="hud">
            <div className="brand"><i /> GLASS RUN <span>01</span></div>
            <div className="distance"><small>EXIT</small><b>{Math.max(0, 200 - distance)}m</b></div>
          </header>
          <aside className="objective"><span>목표</span> 투명 유리문까지 달려라</aside>
          <div className="threat"><span>추격자 거리</span><i><b style={{ width: `${danger}%` }} /></i></div>
          <div className="touch-controls" aria-label="모바일 이동 조작">
            {([["ArrowLeft", "←", "LEFT"], ["ArrowRight", "→", "RIGHT"]] as const).map(([code, icon, label]) => (
              <button key={code} aria-label={`${label} 이동`}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); sendKey(code, true); }}
                onPointerUp={() => sendKey(code, false)} onPointerCancel={() => sendKey(code, false)}>
                {icon}<small>{label}</small>
              </button>
            ))}
          </div>
          <p className="desktop-hint">PC 우클릭 드래그 · 모바일 기울이기로 조향</p>
          <div className="vignette" />
        </>
      )}
      {phase === "intro" && (
        <section className="intro-card">
          <div className="logo"><i /> GLASS RUN <span>01</span></div>
          <p className="eyebrow">MOBILE CHASE EXPERIENCE</p>
          <h1>유리 복도<br /><em>추격전</em></h1>
          <p className="summary">색색의 기둥 사이를 가르고, 유리벽을 피해<br />복도 끝 투명문까지 살아서 도착하세요.</p>
          <button className="start-button" onClick={start}><span>도망치기</span><b>달리기 시작 →</b></button>
          <div className="how"><span><b>01</b> 마우스·기울기 조향</span><span><b>02</b> 유리벽 회피</span><span><b>03</b> 투명문 탈출</span></div>
          {best !== null && <p className="best">BEST RECORD · {best.toFixed(1)}s</p>}
        </section>
      )}
      {(phase === "won" || phase === "caught") && (
        <section className="result">
          <p>{phase === "won" ? "ESCAPE COMPLETE" : "SIGNAL LOST"}</p>
          <h2>{phase === "won" ? <>문이<br /><em>열렸다</em></> : <>잡히고<br /><em>말았다</em></>}</h2>
          <span>{phase === "won" ? "차가운 새벽 공기가 폐로 밀려든다." : "조금만 더 빨리, 조금만 더 옆으로."}</span>
          {best !== null && phase === "won" && <strong>BEST · {best.toFixed(1)} SEC</strong>}
          <button onClick={start}>다시 달리기 <b>↻</b></button>
        </section>
      )}
    </main>
  );
}
