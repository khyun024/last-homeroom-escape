"use client";

import { useEffect, useRef, useState } from "react";
import { SchoolScene3D } from "./SchoolScene3D";
import { HomeWalk3D } from "./HomeWalk3D";

const rooms = [
  { icon: "▦", label: "교실" },
  { icon: "⌁", label: "복도" },
  { icon: "◒", label: "과학실" },
  { icon: "♨", label: "가정실" },
  { icon: "◉", label: "미술실" },
  { icon: "!", label: "마지막 복도" },
];

const puzzles = [
  {
    eyebrow: "MISSION 01 · 3학년 2반",
    title: "어둠 속 시간표",
    text: "정전된 교실. 책상 위 낡은 휴대폰만 희미하게 빛난다.",
  },
  {
    eyebrow: "MISSION 02 · 중앙 복도",
    title: "깜빡이는 긴 복도",
    text: "불규칙하게 꺼지는 전등을 따라 복도 끝 과학실 문까지 걸어가자.",
  },
  {
    eyebrow: "MISSION 03 · 과학 준비실",
    title: "잠든 실험 장치",
    text: "경보 장치에 ‘충격 감지 시 재부팅’이라는 메모가 붙어 있다.",
  },
  {
    eyebrow: "MISSION 04 · 가정실",
    title: "멈춰버린 레시피",
    text: "조리대에 세 가지 재료와 찢어진 조리 순서가 놓여 있다.",
  },
  {
    eyebrow: "MISSION 05 · 미술실",
    title: "푸른 그림의 비밀",
    text: "색이 빠진 그림들 사이에서 유독 푸른 캔버스만 빛난다.",
  },
  {
    eyebrow: "FINAL · 끝없는 복도",
    title: "뒤돌아보지 마",
    text: "발소리가 가까워진다. 파란 불빛이 가리키는 길로 달려라.",
  },
];

function MobileControls({ jump = false, interact = true }: { jump?: boolean; interact?: boolean }) {
  const control = (code: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      window.dispatchEvent(new KeyboardEvent("keydown", { code }));
    },
    onPointerUp: () => window.dispatchEvent(new KeyboardEvent("keyup", { code })),
    onPointerCancel: () => window.dispatchEvent(new KeyboardEvent("keyup", { code })),
    onPointerLeave: () => window.dispatchEvent(new KeyboardEvent("keyup", { code })),
  });
  return (
    <div className="mobile-controls" aria-label="모바일 이동 조작">
      <div className="mobile-dpad">
        <button {...control("KeyW")} aria-label="앞으로 이동">▲</button>
        <button {...control("KeyA")} aria-label="왼쪽 이동">◀</button>
        <button {...control("KeyS")} aria-label="뒤로 이동">▼</button>
        <button {...control("KeyD")} aria-label="오른쪽 이동">▶</button>
      </div>
      {interact && <button className="mobile-interact" onPointerDown={(event) => {
        event.preventDefault();
        window.dispatchEvent(new Event("mobile-interact"));
      }}>조사</button>}
      {jump && <button className="mobile-jump" {...control("Space")}>점프</button>}
    </div>
  );
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [solved, setSolved] = useState<boolean[]>([false, false, false, false, false, false]);
  const [toast, setToast] = useState("");
  const [code, setCode] = useState("");
  const [hold, setHold] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [shake, setShake] = useState(0);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [chalkTaps, setChalkTaps] = useState(0);
  const [deskOpen, setDeskOpen] = useState(false);
  const [hallLight, setHallLight] = useState(false);
  const [knocks, setKnocks] = useState(0);
  const [lockerTaps, setLockerTaps] = useState(0);
  const [recipe, setRecipe] = useState<string[]>([]);
  const [chaseTurn, setChaseTurn] = useState(0);
  const [chaseReady, setChaseReady] = useState(false);
  const [chaseFinished, setChaseFinished] = useState(false);
  const [arrivedHome, setArrivedHome] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const chaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [secrets, setSecrets] = useState<string[]>([]);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const scienceDone = useRef(false);

  useEffect(() => {
    setNotes(localStorage.getItem("last-homeroom-notes") ?? "");
  }, []);

  useEffect(() => {
    localStorage.setItem("last-homeroom-notes", notes);
  }, [notes]);

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
      if (step === 2 && force > 28) completeScience();
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

  function findSecret(id: string, message: string) {
    setSecrets((old) => old.includes(id) ? old : [...old, id]);
    feedback(message);
  }

  function tapChalkboard() {
    const next = chalkTaps + 1;
    setChalkTaps(next);
    if (next === 3) findSecret("chalk", "분필 가루 아래에서 낙서를 찾았다: ‘빛은 오른쪽에서’");
  }

  function knockDoor() {
    const next = knocks + 1;
    setKnocks(next);
    navigator.vibrate?.(50);
    if (next === 4) {
      findSecret("door", "안에서 네 번의 노크가 돌아왔다. 비밀 배지를 획득했다!");
      setKnocks(0);
    }
  }

  function interactWithCorridor(object: string) {
    if (object === "endDoorFar") {
      feedback("너무 멀다. 깜빡이는 전등을 따라 복도 끝까지 걸어가자.");
    }
    if (object === "endDoor") {
      solve(1, "복도 끝문에서 복도 번호 7을 찾았다. 과학실로 이동한다!");
      setTimeout(() => setStep(2), 650);
    }
  }

  function interactWithClassroom(object: string) {
    if (object === "blackboard") tapChalkboard();
    if (object === "window") {
      setCurtainOpen((open) => !open);
      if (!curtainOpen) findSecret("curtain", "창가에 비친 달빛이 책상 아래를 가리킨다!");
    }
    if (object === "studentDesk") {
      setDeskOpen((open) => !open);
      feedback(deskOpen ? "책상 서랍을 닫았다." : "서랍 안쪽에 ‘첫 숫자는 짝수’라고 적혀 있다.");
    }
    if (object === "teacherDesk") feedback("교탁 밑에서 찢어진 시간표를 찾았다. 수요일 네 번째 칸이 동그라미 쳐져 있다.");
    if (object === "podium") feedback("교탁 위 분필통에서 작은 열쇠가 달그락거린다.");
    if (object === "cabinet") feedback("수납장은 잠겨 있다. 열쇠 구멍에 ‘3-2’가 새겨져 있다.");
    if (object === "door") feedback("교실 문은 잠겨 있다. 복도 쪽에서 네 번의 노크 소리가 난다.");
    if (object === "clock") feedback("시계는 4시 07분에 멈춰 있다. 우연일까?");
    if (object === "lockedLocker") feedback("굳게 잠겨 있다. 손잡이마다 서로 다른 긁힌 자국이 보인다.");
    if (object === "backLocker") {
      const next = lockerTaps + 1;
      setLockerTaps(next);
      navigator.vibrate?.(60);
      if (next < 3) feedback(`주황색 사물함 안에서 소리가 난다. ${next} / 3`);
      if (next === 3) {
        findSecret("locker", "사물함 문이 열렸다. 안쪽 시간표에서 숫자 4를 발견했다!");
        solve(0, "교실 뒤 사물함에서 첫 암호 조각 4를 찾았다!");
      }
    }
  }

  function solve(index: number, message: string) {
    setSolved((old) => old.map((value, i) => (i === index ? true : value)));
    feedback(message);
  }

  function completeScience() {
    if (scienceDone.current) return;
    scienceDone.current = true;
    setSolved((old) => old.map((value, i) => i === 2 || i === 3 ? true : value));
    feedback("실험 장치에 과학실 번호 2가 나타났다. 비밀 통로가 미술실로 이어진다!");
    setTimeout(() => setStep(4), 750);
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
    if (code === "4722") {
      solve(4, "철컥— 출입문이 열렸다!");
      navigator.vibrate?.([100, 50, 100, 50, 300]);
    } else feedback("경고음이 울렸다. 모은 숫자의 순서를 확인하자.");
  }

  function addIngredient(ingredient: string) {
    const next = [...recipe, ingredient];
    setRecipe(next);
    navigator.vibrate?.(35);
    if (next.length === 3) {
      if (next.join("-") === "우유-밀가루-달걀") solve(3, "오븐이 작동하며 문에 숫자 9가 나타났다!");
      else {
        feedback("조리 순서가 틀렸다. 차가운 것부터, 가루, 마지막은 달걀이다.");
        setRecipe([]);
      }
    }
  }

  function startChaseMusic() {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioCtx.current ?? new AudioContextClass();
    audioCtx.current = ctx;
    ctx.resume();
    if (chaseTimer.current) clearInterval(chaseTimer.current);
    let beat = 0;
    chaseTimer.current = setInterval(() => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = beat++ % 4 === 3 ? "sawtooth" : "square";
      oscillator.frequency.value = beat % 4 === 0 ? 72 : 104;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
    }, 220);
  }

  function choosePath(direction: "left" | "right") {
    if (!chaseReady) return;
    const correct: Array<"left" | "right"> = ["left", "right", "left", "right", "left", "right"];
    if (direction !== correct[chaseTurn]) {
      feedback("막다른 길이다! 뒤에서 발소리가 훨씬 가까워졌다.");
      navigator.vibrate?.([180, 70, 180]);
      return;
    }
    const next = chaseTurn + 1;
    setChaseTurn(next);
    setChaseReady(false);
    feedback(next < 6 ? "파란 불빛을 따라 긴 복도를 달린다!" : "현관문이 보인다. 마지막 전력 질주!");
    if (next === 6) {
      if (chaseTimer.current) clearInterval(chaseTimer.current);
      setTimeout(() => {
        setChaseFinished(true);
        feedback("추격자를 따돌렸다! 현관문에 네 자리 암호를 입력하자.");
      }, 900);
    }
  }

  function submitExitCode() {
    if (code === "4722") {
      solve(5, "철컥— 현관문이 열렸다. 이제 집으로 돌아가자!");
      navigator.vibrate?.([80, 50, 80, 50, 260]);
    } else {
      feedback("암호가 틀렸다. 교실과 특별실에서 얻은 숫자를 순서대로 확인하자.");
      setCode("");
    }
  }

  const progress = solved.filter(Boolean).length;

  if (!started) {
    return (
      <main className="landing">
        <div className="noise" />
        <div className="school-mark">SCHOOL<br />NIGHT</div>
        <section className="hero">
          <p className="kicker">MOBILE ESCAPE · EPISODE 01</p>
          <h1>마지막<br /><em>종례</em></h1>
          <p className="intro">눈을 뜨니 학교는 텅 비어 있었다.<br />교실과 복도에 숨은 단서를 찾아 탈출하자.</p>
          <button className="primary start" onClick={() => { setStarted(true); requestSensors(); }}>
            <span>탈출 시작</span><b>→</b>
          </button>
          <div className="qr-access">
            <img src="./qr-code.png" alt="마지막 종례 게임 접속 QR 코드" />
            <div>
              <b>휴대폰으로 플레이</b>
              <span>카메라로 QR 코드를 스캔하세요</span>
            </div>
          </div>
          <p className="sensor-note">◉ 소리와 진동을 켜면 더 몰입할 수 있어요</p>
        </section>
        <div className="hallway"><span /><span /><span /><span /></div>
      </main>
    );
  }

  if (solved[5] && !arrivedHome) {
    return (
      <main className="home-walk">
        <HomeWalk3D onArrive={() => setArrivedHome(true)} />
        <div className="home-walk-hud">
          <small>ESCAPED · 06:07 AM</small>
          <b>집까지 직접 걸어가세요</b>
          <span><strong>W A S D</strong> 이동 · 우클릭+드래그 시점</span>
        </div>
        <div className="home-marker">⌂ 파란 불빛의 집</div>
        <MobileControls interact={false} />
      </main>
    );
  }

  if (solved[5] && arrivedHome) {
    return (
      <main className="ending">
        <div className="sun" />
        <div className="home-journey" aria-hidden="true">
          <div className="school-away">학교</div>
          <div className="road-home"><i /><i /><i /></div>
          <div className="my-home"><b>⌂</b><span>HOME</span></div>
        </div>
        <section>
          <p className="kicker">THE WAY HOME · 06:12 AM</p>
          <h1>집으로<br /><em>귀가</em></h1>
          <p>학교 정문을 빠져나오자 추격자의 발소리가 멎었다.<br />푸른 새벽길 끝, 따뜻한 집의 불빛이 보인다.</p>
          <div className="result-card">
            <span>완료한 스테이지</span><b>6 / 6</b>
            <span>숨은 기믹</span><b>{secrets.length} / 4</b>
          </div>
          <button className="primary" onClick={() => location.reload()}>다시 도전하기 <b>↻</b></button>
        </section>
      </main>
    );
  }

  return (
    <main className="game explore-mode">
      <header>
        <div className="brand">마지막 종례 <span>· NIGHT 01</span></div>
        <div className="timer infinite"><small>탐색 시간</small><b>∞</b></div>
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

        {step === 0 && (
          <div className="world-scene three-world" aria-label="탐색 가능한 3D 교실">
            <SchoolScene3D mode="classroom" lightOn={curtainOpen} onInteract={interactWithClassroom} />
            <div className="three-actions">
              <button onClick={() => {
                setCurtainOpen(!curtainOpen);
                if (!curtainOpen) findSecret("curtain", "커튼 뒤 달빛이 책상 아래를 가리킨다!");
              }}>◫ 커튼</button>
              <button className={chalkTaps >= 3 ? "found" : ""} onClick={tapChalkboard}>▰ 칠판 {chalkTaps}/3</button>
              <button onClick={() => { setDeskOpen(!deskOpen); feedback(deskOpen ? "서랍을 닫았다." : "서랍 안에서 낡은 건전지를 찾았다."); }}>▱ 서랍</button>
            </div>
            <div className="scene-label"><b>3D 교실</b><span>드래그하고 물건을 조사하세요</span></div>
          </div>
        )}

        {step === 1 && (
          <div className="world-scene three-world" aria-label="탐색 가능한 3D 복도">
            <SchoolScene3D mode="corridor" lightOn={hallLight} onInteract={interactWithCorridor} />
            <div className="three-actions">
              <button onClick={() => {
                setHallLight(!hallLight);
                feedback(!hallLight ? "비상등이 켜져 복도 끝이 보인다." : "다시 어둠이 내려앉았다.");
              }}>☼ 비상등</button>
              <button onClick={knockDoor}>▯ 3-1 문 {knocks}/4</button>
              <button onClick={() => feedback("과학실 문틈에서 차가운 바람이 새어 나온다.")}>▯ 과학실</button>
            </div>
            <div className="scene-label"><b>3D 복도</b><span>드래그하고 문을 조사하세요</span></div>
          </div>
        )}

        {step >= 2 && (
          <div className={`world-scene three-world ${step === 5 ? "chase-world" : ""}`} aria-label={`${rooms[step].label} 3D 스테이지`}>
            <SchoolScene3D
              mode={step === 2 ? "science" : step === 3 ? "home" : step === 4 ? "art" : "chase"}
              lightOn={step === 5}
              chaseTurn={chaseTurn}
              chasePaused={step === 5 && chaseReady}
              onReachBranch={step === 5 ? () => {
                setChaseReady(true);
                feedback("갈림길이다! 파란 불빛이 켜진 통로를 선택하자.");
              } : undefined}
            />
            <div className="stage-title">
              <small>STAGE {step + 1} / 6</small>
              <b>{puzzles[step].title}</b>
              <span>{puzzles[step].text}</span>
            </div>

            {step === 2 && (
              <div className="stage-gimmick">
                <p>충격 감도 <b>{Math.min(99, shake)}</b></p>
                <button onClick={() => {
                  const next = shake + 11;
                  setShake(next);
                  navigator.vibrate?.(70);
                  if (next >= 30) completeScience();
                }}>⚡ 실험 장치 흔들기</button>
              </div>
            )}

            {step === 3 && (
              <div className="stage-gimmick recipe-gimmick">
                <p>조리 순서 <b>{recipe.length} / 3</b></p>
                <div>
                  <button onClick={() => addIngredient("밀가루")}>밀가루</button>
                  <button onClick={() => addIngredient("달걀")}>달걀</button>
                  <button onClick={() => addIngredient("우유")}>우유</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="stage-gimmick art-gimmick">
                <p>그림 속 출구의 색을 고르세요</p>
                <div>
                  <button className="paint red" onClick={() => feedback("붉은 물감 아래에는 아무것도 없다.")}>빨강</button>
                  <button className="paint blue" onClick={() => solve(4, "푸른 그림 뒤에서 마지막 복도 열쇠와 미술실 번호 2를 찾았다!")}>파랑</button>
                  <button className="paint yellow" onClick={() => feedback("노란 그림이 잠시 흔들렸지만 열리지 않는다.")}>노랑</button>
                </div>
              </div>
            )}

            {step === 5 && (
              <>
                <div className="speed-lines" />
                <div className="chase-warning"><i />추격 중 · 갈림길 {Math.min(chaseTurn + 1, 6)} / 6</div>
                <div className="pursuer">검은 형체가 따라온다 · SPACE 장애물 넘기</div>
                {!chaseFinished && <div className="branch-choice">
                  <p>{chaseReady ? "파란 불빛이 있는 길을 선택하세요" : "다음 갈림길까지 달리는 중…"}</p>
                  {chaseReady ? <>
                    <button className={chaseTurn % 2 === 0 ? "blue-path" : ""} onClick={() => choosePath("left")}>← 왼쪽</button>
                    <button className={chaseTurn % 2 === 1 ? "blue-path" : ""} onClick={() => choosePath("right")}>오른쪽 →</button>
                  </> : <div className="running-line"><i /></div>}
                </div>}
                {chaseFinished && (
                  <div className="exit-code">
                    <small>EXIT LOCK · 모은 번호를 입력하세요</small>
                    <div>{code.padEnd(4, "·").split("").map((number, index) => <span key={index}>{number}</span>)}</div>
                    <section>
                      {[1,2,3,4,5,6,7,8,9].map((number) => <button key={number} onClick={() => code.length < 4 && setCode(code + number)}>{number}</button>)}
                      <button onClick={() => setCode("")}>C</button>
                      <button onClick={() => code.length < 4 && setCode(code + "0")}>0</button>
                      <button className="unlock" onClick={submitExitCode}>열기</button>
                    </section>
                  </div>
                )}
              </>
            )}

            <div className="scene-label"><b>{rooms[step].label}</b><span>클릭/터치 조사 · 드래그 시점</span></div>
          </div>
        )}

        {step >= 2 && <div className="puzzle-card">
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
        </div>}

        {solved[step] && step < 5 && (
          <button className="primary next" onClick={() => {
            const next = step + 1;
            setStep(next);
            if (next === 5) startChaseMusic();
          }}>다음 장소로 이동 <b>→</b></button>
        )}
      </section>

      {step >= 2 && <footer><span>스테이지 {progress} / 6 · 비밀 {secrets.length} / 4</span><i><b style={{ width: `${progress * (100 / 6)}%` }} /></i><button onClick={requestSensors}>센서 설정</button></footer>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      <button className="notepad-toggle" onClick={() => setNotesOpen((open) => !open)}>
        {notesOpen ? "× 닫기" : "▤ 메모장"}
      </button>
      {notesOpen && (
        <aside className="notepad">
          <header>
            <b>탈출 메모</b>
            <small>발견한 번호와 힌트를 적어두세요</small>
          </header>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={"교실: 4\n복도: 7\n과학실: ..."}
            aria-label="탈출 메모 입력"
          />
          <div>
            <span>자동 저장됨</span>
            <button onClick={() => setNotes("")}>모두 지우기</button>
          </div>
        </aside>
      )}
      <MobileControls jump={step === 5} />
    </main>
  );
}
