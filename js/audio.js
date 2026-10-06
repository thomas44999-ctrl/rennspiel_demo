'use strict';

// Alle Klänge werden live mit der Web Audio API erzeugt, es gibt keine Audiodateien.
const Sound = (() => {
  let ac = null;
  let master, music, sfx, noiseBuf;
  let muted = false;
  try { muted = localStorage.getItem('flitzi-muted') === '1'; } catch (e) { /* egal */ }

  const VOLUME = 0.9;
  const STEP = 60 / 128 / 2; // Achtelnoten bei 128 BPM
  let musicOn = false;
  let timer = null;
  let nextTime = 0;
  let step = 0;

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(ac.destination);
      music = ac.createGain();
      music.gain.value = 0.16;
      music.connect(master);
      sfx = ac.createGain();
      sfx.gain.value = 0.55;
      sfx.connect(master);

      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  }

  function tone(o) {
    if (!ac) return;
    const t0 = o.at !== undefined ? o.at : ac.currentTime + (o.delay || 0);
    const dur = o.dur || 0.2;
    const attack = o.attack || 0.01;
    const vol = o.vol === undefined ? 0.4 : o.vol;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.slide || dur));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    if (o.hold) g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur * o.hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(o.dest || sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(o) {
    if (!ac) return;
    const t0 = o.at !== undefined ? o.at : ac.currentTime + (o.delay || 0);
    const dur = o.dur || 0.15;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ac.createBiquadFilter();
    filter.type = o.filter || 'bandpass';
    filter.frequency.setValueAtTime(o.freq || 1000, t0);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(o.dest || sfx);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // Fröhliche Schleife in C-Dur (Pentatonik-lastig), 32 Achtel lang.
  const MELODY = [
    72, 0, 76, 79, 81, 0, 79, 0, 76, 0, 72, 74, 76, 0, 0, 0,
    74, 0, 77, 81, 79, 0, 77, 0, 76, 74, 72, 74, 72, 0, 0, 0,
  ];
  const BASS = [48, 53, 55, 48, 50, 53, 55, 48];

  function schedule() {
    if (!ac) return;
    while (nextTime < ac.currentTime + 0.2) {
      const n = MELODY[step % MELODY.length];
      if (n) tone({ at: nextTime, freq: midi(n), type: 'triangle', dur: STEP * 1.6, vol: 0.5, dest: music });
      if (step % 4 === 0) {
        tone({ at: nextTime, freq: midi(BASS[(step / 4) % BASS.length]), type: 'sine', dur: STEP * 3.5, vol: 0.7, dest: music });
      }
      if (step % 2 === 1) noise({ at: nextTime, dur: 0.04, freq: 7000, filter: 'highpass', vol: 0.12, dest: music });
      nextTime += STEP;
      step++;
    }
  }

  function startMusic() {
    if (!ac || musicOn) return;
    musicOn = true;
    nextTime = ac.currentTime + 0.05;
    timer = setInterval(schedule, 50);
  }

  function stopMusic() {
    musicOn = false;
    if (timer) clearInterval(timer);
    timer = null;
  }

  const horns = {
    race() {
      tone({ freq: 80, to: 260, slide: 0.35, dur: 0.55, type: 'sawtooth', vol: 0.18 });
      tone({ freq: 120, to: 390, slide: 0.35, dur: 0.55, type: 'square', vol: 0.05 });
    },
    fire() {
      for (let i = 0; i < 4; i++) {
        tone({ freq: i % 2 ? 760 : 980, delay: i * 0.22, dur: 0.24, type: 'triangle', vol: 0.35, attack: 0.02, hold: 0.7 });
      }
    },
    tractor() {
      for (let i = 0; i < 6; i++) {
        tone({ freq: 70, delay: i * 0.11, dur: 0.09, type: 'square', vol: 0.22 });
        noise({ delay: i * 0.11, dur: 0.06, freq: 300, vol: 0.15 });
      }
    },
    bus() {
      [0, 0.32].forEach((d) => {
        tone({ freq: 330, delay: d, dur: 0.26, type: 'sawtooth', vol: 0.11, attack: 0.02, hold: 0.8 });
        tone({ freq: 415, delay: d, dur: 0.26, type: 'sawtooth', vol: 0.11, attack: 0.02, hold: 0.8 });
      });
    },
  };

  return {
    init,
    startMusic,
    stopMusic,
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('flitzi-muted', muted ? '1' : '0'); } catch (e) { /* egal */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ac.currentTime, 0.03);
      return muted;
    },
    star() {
      tone({ freq: 1319, dur: 0.1, vol: 0.3 });
      tone({ freq: 1976, delay: 0.07, dur: 0.22, vol: 0.3 });
    },
    ding() {
      tone({ freq: 2637, dur: 0.12, vol: 0.12 });
    },
    bump() {
      tone({ freq: 420, to: 90, dur: 0.4, type: 'triangle', vol: 0.6 });
      tone({ freq: 210, to: 60, dur: 0.35, vol: 0.5, delay: 0.02 });
      noise({ dur: 0.15, freq: 800, vol: 0.25 });
    },
    whoosh() {
      noise({ dur: 0.18, freq: 1400, to: 400, vol: 0.12 });
    },
    select() {
      tone({ freq: 660, to: 990, dur: 0.12, vol: 0.3 });
    },
    start() {
      [523, 659, 784].forEach((f, i) => tone({ freq: f, delay: i * 0.09, dur: 0.16, type: 'triangle', vol: 0.4 }));
    },
    pause() {
      tone({ freq: 784, dur: 0.12, type: 'triangle', vol: 0.35 });
      tone({ freq: 523, delay: 0.1, dur: 0.18, type: 'triangle', vol: 0.35 });
    },
    fanfare() {
      const notes = [[523, 0, 0.18], [659, 0.13, 0.18], [784, 0.26, 0.18], [1047, 0.39, 0.9]];
      notes.forEach(([f, d, len]) => {
        tone({ freq: f, delay: d, dur: len, type: 'triangle', vol: 0.45, hold: 0.6 });
        tone({ freq: f / 2, delay: d, dur: len, type: 'square', vol: 0.06, hold: 0.6 });
      });
      [784, 988, 1175].forEach((f) => tone({ freq: f, delay: 0.39, dur: 0.9, type: 'sine', vol: 0.12, hold: 0.6 }));
    },
    horn(kind) {
      (horns[kind] || horns.race)();
    },
  };
})();
