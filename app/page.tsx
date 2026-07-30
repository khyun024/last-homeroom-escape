"use client";

import { useEffect, useRef, useState } from "react";

const rooms = [
  { icon: "▦", label: "교실" },
  { icon: "⌁", label: "복도" },
  { icon: "◒", label: "과학실" },
  { icon: "♬", label: "음악실" },
  { icon: "⌂", label: "현관" },
];

const puzzles = [
  {
    eyebrow: "MISSION 01 · 3학년 2반",
    title: "어둠 속 시간표",
    text: "정전된 교실. 책상 위 낡은 휴대폰만 희미하게 빛난다.",
  },
  {
    eyebrow: "MISSION 02 · 중앙 복도",
    title: "기울어진 사물함",
    text: "복도 끝 사물함 안에서 무언가 굴러다니는 소리가 난다.",
  },
  {
    eyebrow: "MISSION 03 · 과학 준비실",
    title: "잠든 실험 장치",
    text: "경보 장치에 ‘충격 감지 시 재부팅’이라는 메모가 붙어 있다.",
  },
  {
    eyebrow: "MISSION 04 · 음악실",
    title: "선생님의 마지막 음",
    text: "피아노 위 녹음기가 짧은 음을 반복하고 있다.",
  },
  {
    eyebrow: "FINAL · 1층 현관",
    title: "봉인된 출입문",
    text: "모은 네 자리 암호를 입력하면 현관문이 열린다.",
  },
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [solved, setSolved] = useState<boolean[]>([false, false, false, false, false]);
  const [time, setTime] = useState(12 * 60);
  const [toast, setToast] = useState("");
  const [code, setCode] = useState("");
  const [hold, setHold] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [shake, setShake] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!started || solved[4] || time <= 0) return;
    const timer = setInterval(() => setTime((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [started, solved, time]);

  useEffect(() => {
    const orientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0;
      setTilt(Math.round(gamma));
      if (step === 1 && Math.abs(gamma) > 28) solve(1, "사물함 속 쪽지를 찾았다! 암호 조각: 7");
    };
    const motion = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      setShake(Math.round(force));
      if (step === 2 && force > 28) solve(2, "장치가 재부팅됐다! 암호 조각: 2");
    };
    window.addEventListener("deviceorientation", orientation);
    window.addEventListener("devicemotion", motion);
    return () => {
      window.removeEventListener("deviceorientation", orientation);
      window.removeEventListener("devicemotion", motion);
    };
  }, [step]);

  function feedback(message: string) {
    setToast(message);
    navigator.vibrate?.([70, 50, 120]);
    setTimeout(() => setToast(""), 2600);
  }

  function solve(index: number, message: string) {
    setSolved((old) => old.map((value, i) => (i === index ? true : value)));
    feedback(message);
  }

  async function requestSensors() {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    const M = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      await D.requestPermission?.();
      await M.requestPermission?.();
      feedback("센서가 깨어났어요.");
    } catch {
      feedback("센서 권한 없이 대체 조작을 사용할 수 있어요.");
    }
  }

  function startHold() {
    if (solved[0]) return;
    let value = 0;
    holdTimer.current = setInterval(() => {
      value += 4;
      setHold(value);
      if (value >= 100) {
        stopHold();
        solve(0, "시간표 뒤 숫자가 드러났다! 암호 조각: 4");
      }
    }, 50);
  }

  function stopHold() {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    setHold((value) => (value >= 100 ? 100 : 0));
  }

  function playClue() {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioCtx.current ?? new AudioContextClass();
    audioCtx.current = ctx;
    [523, 659, 587].forEach((frequency, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.32);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.32 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.32 + 0.26);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(ctx.currentTime + i * 0.32);
      oscillator.stop(ctx.currentTime + i * 0.32 + 0.3);
    });
  }

  function submitMusic(answer: string) {
    if (answer === "도미레") solve(3, "멜로디가 맞았다! 암호 조각: 9");
    else feedback("음이 맞지 않는다. 다시 들어보자.");
  }

  function submitCode() {
    if (code === "4729") {
      solve(4, "철컥— 출입문이 열렸다!");
      navigator.vibrate?.([100, 50, 100, 50, 300]);
    } else feedback("경고음이 울렸다. 모은 숫자의 순서를 확인하자.");
  }

  const minutes = String(Math.floor(time / 60)).padStart(2, "0");
  const seconds = String(time % 60).padStart(2, "0");
  const progress = solved.filter(Boolean).length;

  if (!started) {
    return (
      <main className="landing">
        <div className="noise" />
        <div className="school-mark">SCHOOL<br />NIGHT</div>
        <section className="hero">
          <p className="kicker">MOBILE ESCAPE · EPISODE 01</p>
          <h1>마지막<br /><em>종례</em></h1>
          <p className="intro">눈을 뜨니 학교는 텅 비어 있었다.<br />12분 뒤 모든 출입문이 영원히 잠긴다.</p>
          <button className="primary start" onClick={() => { setStarted(true); requestSensors(); }}>
            <span>탈출 시작</span><b>→</b>
          </button>
          <p className="sensor-note">◉ 소리와 진동을 켜면 더 몰입할 수 있어요</p>
        </section>
        <div className="hallway"><span /><span /><span /><span /></div>
      </main>
    );
  }

  if (solved[4]) {
    return (
      <main className="ending">
        <div className="sun" />
        <section>
          <p className="kicker">ESCAPE COMPLETE</p>
          <h1>탈출<br /><em>성공</em></h1>
          <p>문이 열리고 새벽 공기가 밀려들었다.<br />남은 시간 <strong>{minutes}:{seconds}</strong></p>
          <div className="result-card">
            <span>해결한 단서</span><b>5 / 5</b>
            <span>등급</span><b>{time > 360 ? "S" : time > 180 ? "A" : "B"}</b>
          </div>
          <button className="primary" onClick={() => location.reload()}>다시 도전하기 <b>↻</b></button>
        </section>
      </main>
    );
  }

  return (
    <main className="game">
      <header>
        <div className="brand">마지막 종례 <span>· NIGHT 01</span></div>
        <div className={`timer ${time < 120 ? "danger" : ""}`}><small>남은 시간</small><b>{minutes}:{seconds}</b></div>
      </header>

      <nav className="map" aria-label="학교 진행도">
        {rooms.map((room, i) => (
          <button key={room.label} className={`${i === step ? "active" : ""} ${solved[i] ? "done" : ""}`}
            disabled={i > progress} onClick={() => setStep(i)}>
            <span>{solved[i] ? "✓" : room.icon}</span><small>{room.label}</small>
          </button>
        ))}
        <div className="map-line"><i style={{ width: `${(progress / 4) * 100}%` }} /></div>
      </nav>

      <section className="mission">
        <div className="mission-copy">
          <p className="eyebrow">{puzzles[step].eyebrow}</p>
          <h2>{puzzles[step].title}</h2>
          <p>{puzzles[step].text}</p>
        </div>

        <div className="puzzle-card">
          {step === 0 && (
            <>
              <div className="phone-light" style={{ "--light": `${hold}%` } as React.CSSProperties}>
                <div className="timetable">
                  <span>월</span><span>화</span><span>수</span>
                  <b>국어</b><b>과학</b><b>체육</b>
                  <b>수학</b><b>영어</b><b>음악</b>
                </div>
                <strong>4</strong>
              </div>
              <p className="instruction">화면을 길게 눌러 손전등을 밝히세요</p>
              <button className="action hold" onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold}>
                <i style={{ width: `${hold}%` }} /><span>●</span> 길게 누르기
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <div className="locker" style={{ transform: `rotate(${Math.max(-12, Math.min(12, tilt / 3))}deg)` }}>
                <div /><div /><div><span>7</span></div>
              </div>
              <p className="instruction">휴대폰을 옆으로 기울여 사물함을 여세요</p>
              <div className="meter"><i style={{ left: `${50 + Math.max(-45, Math.min(45, tilt))}%` }} /></div>
              <button className="text-action" onClick={() => solve(1, "사물함 속 쪽지를 찾았다! 암호 조각: 7")}>센서가 안 되나요? 탭해서 기울이기</button>
            </>
          )}
          {step === 2 && (
            <>
              <div className={`machine ${shake > 20 ? "jolt" : ""}`}><span>⚡</span><b>SYS / OFFLINE</b><i /></div>
              <p className="instruction">휴대폰을 힘차게 흔들어 장치를 깨우세요</p>
              <div className="shake-value">충격 감도 <b>{Math.min(99, shake)}</b></div>
              <button className="text-action" onClick={() => solve(2, "장치가 재부팅됐다! 암호 조각: 2")}>센서가 안 되나요? 탭해서 흔들기</button>
            </>
          )}
          {step === 3 && (
            <>
              <button className="recorder" onClick={playClue} aria-label="단서 음 재생"><span>▶</span><i /><b>단서 재생</b></button>
              <p className="instruction">들린 세 음을 순서대로 누르세요</p>
              <div className="keys">
                {["도미레", "미레도", "레도미"].map((answer) => (
                  <button key={answer} onClick={() => submitMusic(answer)}>{answer.split("").join(" · ")}</button>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div className="keypad-display">{code.padEnd(4, "·").split("").map((n, i) => <span key={i}>{n}</span>)}</div>
              <p className="instruction">교실부터 순서대로 모은 암호를 입력하세요</p>
              <div className="keypad">
                {[1,2,3,4,5,6,7,8,9].map((n) => <button key={n} onClick={() => code.length < 4 && setCode(code + n)}>{n}</button>)}
                <button onClick={() => setCode("")}>C</button><button onClick={() => setCode(code + "0")}>0</button><button className="enter" onClick={submitCode}>↵</button>
              </div>
            </>
          )}
        </div>

        {solved[step] && step < 4 && (
          <button className="primary next" onClick={() => setStep(step + 1)}>다음 장소로 이동 <b>→</b></button>
        )}
      </section>

      <footer><span>단서 {progress} / 5</span><i><b style={{ width: `${progress * 20}%` }} /></i><button onClick={requestSensors}>센서 설정</button></footer>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      {time === 0 && <div className="timeout"><h2>시간 초과</h2><p>학교의 모든 문이 잠겼다.</p><button onClick={() => location.reload()}>다시 도전</button></div>}
    </main>
  );
}
