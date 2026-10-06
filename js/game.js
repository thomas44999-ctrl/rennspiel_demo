'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // ------------------------------------------------------------ Einstellungen

  const ROAD_W = 450;
  const LANE_W = 150;
  const LANES = 3;
  const STARS_PER_WORLD = 10;
  const VEHICLES = ['race', 'fire', 'tractor', 'bus'];

  const WORLDS = [
    { // Wiese
      ground: '#7cc95a', ground2: '#74c052', road: '#5f6670',
      decor: ['tree', 'tree', 'flower', 'flower', 'flower', 'bush'],
      obstacles: ['cone', 'crate', 'hay'],
    },
    { // Strand
      ground: '#f4dc95', ground2: '#efd488', road: '#666b75', sea: true,
      decor: ['palm', 'palm', 'shell', 'shell', 'umbrella'],
      obstacles: ['castle', 'ball', 'crab'],
    },
    { // Schnee
      ground: '#eef5fb', ground2: '#e3eef8', road: '#76828f', snow: true,
      decor: ['pine', 'pine', 'pine', 'snowrock'],
      obstacles: ['snowman', 'ice', 'cone'],
    },
  ];

  // Tempo bleibt bewusst niedrig und steigt pro Welt nur leicht an.
  const baseSpeed = () => Math.min(250 + trophies * 30, 400);
  const gapTime = () => Math.max(1.35, 1.9 - trophies * 0.1);

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const easeOutBack = (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);

  // ------------------------------------------------------------------ Zustand

  let W = 960;
  let H = 720;
  let scale = 1;
  let dpr = 1;
  let roadX = (W - ROAD_W) / 2;

  let mode = 'menu'; // menu | play | celebrate | pause
  let pausedFrom = 'play';
  let selected = clamp(parseInt(store.get('flitzi-vehicle', '0'), 10) || 0, 0, VEHICLES.length - 1);
  let world = 0;
  let trophies = 0;
  let stars = 0;
  let time = 0;
  let scroll = 0;
  let speedFactor = 1;
  const player = { lane: 1, pos: 1, tilt: 0, wobble: 0, invuln: 0, honk: 0, honkCool: 0, puff: 0 };
  let obstacles = [];
  let pickups = [];
  let flyers = [];
  let particles = [];
  let decor = [];
  let distRow = 0;
  let nextGap = 0;
  let distDecor = 0;
  let celebrateT = 0;
  let switched = false;
  let flash = 0;
  let shake = 0;
  let hintT = 99;
  let buttons = [];
  let audioReady = false;

  const laneX = (l) => roadX + LANE_W * (l + 0.5);
  const playerY = () => H - 135;
  const slotPos = (i) => ({ x: 45 + i * 46, y: 46 });
  const seaWidth = () => Math.min(170, roadX * 0.45);

  // ------------------------------------------------------------- Landschaft

  function spawnDecor(y, atTop) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const max = side < 0 && WORLDS[world].sea ? roadX - seaWidth() - 40 : roadX - 30;
    if (max < 50) return;
    const item = {
      kind: pick(WORLDS[world].decor),
      side,
      d: rand(50, max),
      y,
      s: rand(0.8, 1.15),
      flip: Math.random() < 0.5,
      col: pick(['#ff6f91', '#ffd54f', '#ba68c8', '#4fc3f7', '#ffffff', '#ff8a65']),
    };
    if (atTop) decor.unshift(item); else decor.push(item);
  }

  function fillDecor() {
    decor = [];
    for (let y = -60; y < H + 60; y += 55) spawnDecor(y + rand(-20, 20), false);
    decor.sort((a, b) => a.y - b.y);
  }

  const decorX = (o) => (o.side < 0 ? roadX - o.d : roadX + ROAD_W + o.d);

  // --------------------------------------------------------------- Spielfluss

  function mkObstacle(lane, y, kind) {
    return { lane, y, kind, hit: false, ox: 0, vx: 0, rot: 0, vr: 0, life: 1 };
  }

  function mkStar(lane, y) {
    return { lane, y, phase: rand(0, 6), got: false };
  }

  // Jede Reihe lässt mindestens eine Spur frei, damit immer ein Ausweg da ist.
  function spawnRow() {
    const y = -90;
    const kinds = WORLDS[world].obstacles;
    const lanes = shuffle([0, 1, 2]);
    const r = Math.random();
    const doubleChance = trophies >= 1 ? 0.25 : 0;
    if (r < 0.22) {
      for (let i = 0; i < 3; i++) pickups.push(mkStar(lanes[0], y - i * 110));
    } else if (r < 0.22 + doubleChance) {
      obstacles.push(mkObstacle(lanes[0], y, pick(kinds)));
      obstacles.push(mkObstacle(lanes[1], y, pick(kinds)));
      pickups.push(mkStar(lanes[2], y));
    } else {
      obstacles.push(mkObstacle(lanes[0], y, pick(kinds)));
      if (Math.random() < 0.8) pickups.push(mkStar(lanes[1], y - (Math.random() < 0.5 ? 0 : 70)));
    }
  }

  function resetRun() {
    world = 0;
    trophies = 0;
    stars = 0;
    speedFactor = 1;
    obstacles = [];
    pickups = [];
    flyers = [];
    particles = [];
    player.lane = 1;
    player.pos = 1;
    player.tilt = 0;
    player.wobble = 0;
    player.invuln = 0;
    distRow = 0;
    nextGap = baseSpeed() * 1.6; // kurze Eingewöhnung ohne Hindernisse
    fillDecor();
  }

  function startGame() {
    resetRun();
    store.set('flitzi-vehicle', String(selected));
    hintT = 0;
    mode = 'play';
    Sound.start();
    Sound.horn(VEHICLES[selected]);
  }

  function goHome() {
    resetRun();
    mode = 'menu';
    if (audioReady) Sound.startMusic();
  }

  function pauseGame() {
    if (mode !== 'play' && mode !== 'celebrate') return;
    pausedFrom = mode;
    mode = 'pause';
    Sound.stopMusic();
    Sound.pause();
  }

  function resumeGame() {
    if (mode !== 'pause') return;
    mode = pausedFrom;
    Sound.select();
    if (audioReady) Sound.startMusic();
  }

  function selectVehicle(i) {
    selected = (i + VEHICLES.length) % VEHICLES.length;
    store.set('flitzi-vehicle', String(selected));
    Sound.horn(VEHICLES[selected]);
  }

  function steer(dir) {
    const next = clamp(player.lane + dir, 0, LANES - 1);
    if (next === player.lane) {
      player.tilt = dir * 0.12; // kleines "Nein"-Wackeln am Straßenrand
      return;
    }
    player.lane = next;
    Sound.whoosh();
    if (hintT < 5) hintT = 5;
  }

  function honk() {
    if (player.honkCool > 0) return;
    player.honk = 0.7;
    player.honkCool = 0.6;
    Sound.horn(VEHICLES[selected]);
  }

  function bump(o, px) {
    o.hit = true;
    o.life = 0.9;
    const ox = laneX(o.lane);
    const dir = Math.abs(ox - px) < 5 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(ox - px);
    o.vx = dir * rand(380, 520);
    o.vr = dir * rand(6, 10);
    speedFactor = 0.35;
    player.invuln = 1.3;
    player.wobble = 1;
    shake = 0.35;
    Sound.bump();
    burst((ox + px) / 2, o.y + 20, 12, ['#ffffff', '#ffd54f', '#ff8a65']);
  }

  function collect(p) {
    p.got = true;
    Sound.star();
    const x = laneX(p.lane);
    burst(x, p.y, 10, ['#fff59d', '#ffd54f', '#ffffff']);
    const slot = Math.min(STARS_PER_WORLD - 1, stars + flyers.length);
    flyers.push({ sx: x, sy: p.y, slot, t: 0, done: false });
  }

  function land() {
    if (mode !== 'play') return;
    stars = Math.min(STARS_PER_WORLD, stars + 1);
    const s = slotPos(stars - 1);
    burst(s.x, s.y, 8, ['#fff59d', '#ffffff']);
    Sound.ding();
    if (stars >= STARS_PER_WORLD) startCelebrate();
  }

  function startCelebrate() {
    mode = 'celebrate';
    celebrateT = 0;
    switched = false;
    trophies++;
    obstacles.forEach((o) => { if (!o.hit) burst(laneX(o.lane), o.y, 10, ['#ffffff', '#e0e0e0']); });
    pickups.forEach((p) => burst(laneX(p.lane), p.y, 6, ['#fff59d']));
    obstacles = [];
    pickups = [];
    flyers = [];
    Sound.fanfare();
    confetti(170);
  }

  // ---------------------------------------------------------------- Partikel

  function burst(x, y, n, colors) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(120, 320);
      particles.push({
        kind: Math.random() < 0.4 ? 'spark' : 'dot',
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3,
        life: rand(0.4, 0.7), max: 0.7, size: rand(4, 8), color: pick(colors), rot: rand(0, 6), vr: rand(-6, 6),
      });
    }
  }

  function confetti(n) {
    const colors = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#ab47bc', '#ff7043', '#ffffff'];
    for (let i = 0; i < n; i++) {
      particles.push({
        kind: 'confetti',
        x: rand(0, W), y: rand(-H * 0.7, -10), vx: rand(-40, 40), vy: rand(130, 260),
        life: 4.2, max: 4.2, size: rand(7, 12), color: pick(colors), rot: rand(0, 6), vr: rand(-8, 8),
      });
    }
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      if (p.drag) {
        p.vx -= p.vx * p.drag * dt;
        p.vy -= p.vy * p.drag * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += (p.vr || 0) * dt;
    }
    particles = particles.filter((p) => p.life > 0 && p.y < H + 60);
  }

  // ----------------------------------------------------------------- Update

  function update(dt) {
    time += dt;
    flash = Math.max(0, flash - dt * 1.8);
    shake = Math.max(0, shake - dt);
    if (mode === 'pause') return;
    updateParticles(dt);

    let spd = 110;
    if (mode !== 'menu') {
      speedFactor = Math.min(1, speedFactor + dt * 0.45);
      spd = baseSpeed() * speedFactor * (mode === 'celebrate' ? 0.65 : 1);
    }
    scroll += spd * dt;

    distDecor += spd * dt;
    while (distDecor >= 55) {
      distDecor -= 55;
      spawnDecor(-70, true);
    }
    for (const o of decor) o.y += spd * dt;
    decor = decor.filter((o) => o.y < H + 90);

    if (mode === 'menu') return;

    hintT += dt;
    const prev = player.pos;
    player.pos += (player.lane - player.pos) * Math.min(1, dt * 11);
    const vel = (player.pos - prev) / dt;
    player.tilt += (clamp(vel * 0.12, -0.35, 0.35) - player.tilt) * Math.min(1, dt * 12);
    player.wobble = Math.max(0, player.wobble - dt * 1.1);
    player.invuln = Math.max(0, player.invuln - dt);
    player.honk = Math.max(0, player.honk - dt);
    player.honkCool = Math.max(0, player.honkCool - dt);

    const px = laneX(player.pos);
    const py = playerY();

    player.puff -= dt;
    if (player.puff <= 0) {
      const tractor = VEHICLES[selected] === 'tractor';
      player.puff = tractor ? 0.14 : 0.09;
      particles.push({
        kind: 'puff',
        x: px + (tractor ? 9 : rand(-8, 8)), y: py + (tractor ? -28 : 66),
        vx: rand(-15, 15), vy: spd * (tractor ? 0.55 : 0.75),
        life: 0.6, max: 0.6, size: tractor ? 9 : rand(5, 8),
        color: tractor ? 'rgba(90,90,90,0.55)' : 'rgba(255,255,255,0.7)',
      });
    }

    if (mode === 'play') {
      distRow += spd * dt;
      if (distRow >= nextGap) {
        distRow = 0;
        nextGap = baseSpeed() * gapTime() * rand(0.9, 1.2);
        spawnRow();
      }
    }

    for (const o of obstacles) {
      if (!o.hit) {
        o.y += spd * dt;
        if (player.invuln <= 0 && Math.abs(laneX(o.lane) - px) < 58 && Math.abs(o.y - py) < 78) bump(o, px);
      } else {
        o.ox += o.vx * dt;
        o.y += spd * 0.5 * dt;
        o.rot += o.vr * dt;
        o.life -= dt;
      }
    }
    obstacles = obstacles.filter((o) => o.y < H + 100 && (!o.hit || o.life > 0));

    for (const p of pickups) {
      p.y += spd * dt;
      if (!p.got && Math.abs(laneX(p.lane) - px) < 62 && Math.abs(p.y - py) < 82) collect(p);
    }
    pickups = pickups.filter((p) => !p.got && p.y < H + 60);

    for (const f of flyers) {
      f.t += dt * 1.6;
      if (f.t >= 1 && !f.done) {
        f.done = true;
        land();
      }
    }
    flyers = flyers.filter((f) => !f.done);

    if (mode === 'celebrate') {
      celebrateT += dt;
      if (celebrateT > 2.8 && !switched) {
        switched = true;
        flash = 1;
        world = (world + 1) % WORLDS.length;
        stars = 0;
        fillDecor();
      }
      if (celebrateT > 3.6) {
        mode = 'play';
        distRow = 0;
        nextGap = baseSpeed() * 1.2;
      }
    }
  }

  // ----------------------------------------------------------------- Zeichnen

  function drawGround() {
    const w = WORLDS[world];
    ctx.fillStyle = w.ground;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    const band = 70;
    const off = scroll % (band * 2);
    ctx.fillStyle = w.ground2;
    for (let y = off - band * 2; y < H + band; y += band * 2) ctx.fillRect(-40, y, W + 80, band);

    if (w.sea) {
      const sw = seaWidth();
      ctx.fillStyle = '#4fc3f7';
      ctx.fillRect(-40, -40, sw + 40, H + 80);
      ctx.beginPath();
      ctx.moveTo(-40, -40);
      for (let y = -40; y <= H + 40; y += 10) ctx.lineTo(sw + Math.sin((y - scroll) * 0.035 + time * 2) * 7, y);
      ctx.lineTo(-40, H + 40);
      ctx.closePath();
      ctx.fillStyle = '#e1f5fe';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-40, -40);
      for (let y = -40; y <= H + 40; y += 10) ctx.lineTo(sw - 10 + Math.sin((y - scroll) * 0.035 + time * 2) * 7, y);
      ctx.lineTo(-40, H + 40);
      ctx.closePath();
      ctx.fillStyle = '#4fc3f7';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const woff = (scroll * 0.6) % 90;
      for (let y = woff - 90; y < H + 40; y += 90) {
        for (let x = 20; x < sw - 40; x += 60) {
          const yy = y + (x % 120 === 20 ? 0 : 45);
          ctx.beginPath();
          ctx.arc(x, yy, 9, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
      }
    }
  }

  function drawDecor() {
    for (const o of decor) Art.decor(ctx, o.kind, decorX(o), o.y, o.s, o.flip, o.col, time);
  }

  function drawRoad() {
    const w = WORLDS[world];
    ctx.fillStyle = w.road;
    ctx.fillRect(roadX, -40, ROAD_W, H + 80);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(roadX + 10, -40, ROAD_W - 20, H + 80);

    const ch = 36;
    const coff = scroll % (ch * 2);
    for (let k = -2; coff + k * ch < H + 40; k++) {
      const y = coff + k * ch;
      ctx.fillStyle = (k & 1) ? '#ffffff' : '#e53935';
      ctx.fillRect(roadX - 16, y, 16, ch);
      ctx.fillRect(roadX + ROAD_W, y, 16, ch);
    }

    const doff = scroll % 100;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let y = doff - 100; y < H + 40; y += 100) {
      for (let i = 1; i < LANES; i++) Art.box(ctx, roadX + LANE_W * i - 4, y, 8, 50, 4, 'rgba(255,255,255,0.85)');
    }
  }

  function drawPlayer() {
    const px = laneX(player.pos);
    const py = playerY() + Math.sin(time * 18) * 1.2;
    const rot = player.tilt + Math.sin(time * 28) * 0.25 * player.wobble;
    if (player.honk > 0) {
      const k = 1 - player.honk / 0.7;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = clamp(1 - k - i * 0.15, 0, 1);
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(px, py - 70, 18 + i * 14 + k * 30, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
      }
    }
    Art.vehicle(ctx, VEHICLES[selected], px, py, 1, rot, time, player.honk);
  }

  function drawParticles(confettiOnly) {
    for (const p of particles) {
      if ((p.kind === 'confetti') !== confettiOnly) continue;
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = p.kind === 'confetti' ? Math.min(1, p.life) : a;
      if (p.kind === 'puff') {
        Art.dot(ctx, p.x, p.y, p.size * (1 + (1 - a) * 1.5), p.color);
      } else if (p.kind === 'spark') {
        Art.star(ctx, p.x, p.y, p.size * 1.4, p.rot, false);
      } else if (p.kind === 'confetti') {
        ctx.translate(p.x + Math.sin(time * 3 + p.rot) * 12, p.y);
        ctx.rotate(p.rot);
        ctx.scale(Math.cos(p.rot * 1.7), 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      } else {
        Art.dot(ctx, p.x, p.y, p.size, p.color);
      }
      ctx.restore();
    }
  }

  function drawSnowfall() {
    if (!WORLDS[world].snow) return;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 197) % W) + Math.sin(time * 1.3 + i) * 18;
      const y = (i * 131 + time * (50 + (i % 5) * 12)) % (H + 20) - 10;
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function addButton(x, y, r, fn) {
    buttons.push({ x, y, r, fn });
  }

  function drawHud() {
    Art.panel(ctx, 16, 14, 46 * STARS_PER_WORLD + 12, 64);
    for (let i = 0; i < STARS_PER_WORLD; i++) {
      const s = slotPos(i);
      if (i < stars) Art.star(ctx, s.x, s.y, 19, 0, false);
      else Art.starSlot(ctx, s.x, s.y, 19);
    }
    const shown = Math.min(trophies, 10);
    if (shown > 0) {
      Art.panel(ctx, 16, 86, shown * 40 + 14, 50);
      for (let i = 0; i < shown; i++) Art.trophy(ctx, 43 + i * 40, 109, 0.36);
    }

    Art.iconButton(ctx, Sound.isMuted() ? 'mute' : 'sound', W - 52, 48, 32);
    addButton(W - 52, 48, 36, () => Sound.toggleMute());
    Art.iconButton(ctx, 'pause', W - 130, 48, 32);
    addButton(W - 130, 48, 36, pauseGame);
  }

  function drawFlyers() {
    for (const f of flyers) {
      const target = slotPos(f.slot);
      const t = clamp(f.t, 0, 1);
      const e = t * t * (3 - 2 * t);
      const x = f.sx + (target.x - f.sx) * e;
      const y = f.sy + (target.y - f.sy) * e - Math.sin(Math.PI * t) * 120;
      Art.star(ctx, x, y, 26 - 7 * e, t * 6, true);
    }
  }

  function drawPickups() {
    for (const p of pickups) {
      const s = 1 + Math.sin(time * 5 + p.phase) * 0.08;
      Art.star(ctx, laneX(p.lane), p.y, 28 * s, Math.sin(time * 2 + p.phase) * 0.25, true);
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      if (o.hit) continue;
      Art.obstacle(ctx, o.kind, laneX(o.lane), o.y, 1, 0, time + o.lane);
    }
  }

  function drawHitObstacles() {
    for (const o of obstacles) {
      if (!o.hit) continue;
      const a = clamp(o.life / 0.9, 0, 1);
      Art.obstacle(ctx, o.kind, laneX(o.lane) + o.ox, o.y, 1 + (1 - a) * 0.3, o.rot, time, a);
    }
  }

  function drawHint() {
    const a = clamp(6 - hintT, 0, 1);
    if (a <= 0 || mode !== 'play') return;
    const px = laneX(player.pos);
    const py = playerY();
    const b = Math.abs(Math.sin(time * 5)) * 14;
    ctx.save();
    ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(time * 6));
    Art.keycap(ctx, px - 120 - b, py, 74, 70, 'left');
    Art.keycap(ctx, px + 120 + b, py, 74, 70, 'right');
    ctx.restore();
  }

  function drawMenu() {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2;

    Art.flag(ctx, cx - 95, H * 0.07, 190, 110, time);

    const rowY = H * 0.5;
    const spacing = Math.min(190, (W - 200) / VEHICLES.length);
    for (let i = 0; i < VEHICLES.length; i++) {
      const x = cx + (i - (VEHICLES.length - 1) / 2) * spacing;
      const sel = i === selected;
      if (sel) Art.sunburst(ctx, x, rowY, Math.min(118, spacing * 0.75), time * 0.6);
      const pr = Math.min(72, spacing * 0.46);
      const k = pr / 72;
      Art.dot(ctx, x, rowY + 6, pr, 'rgba(0,0,0,0.18)');
      Art.dot(ctx, x, rowY, pr, sel ? '#fff8e1' : 'rgba(255,255,255,0.8)', sel ? '#ffb300' : Art.INK, sel ? 6 : 3);
      const s = (sel ? 1.08 + Math.sin(time * 6) * 0.04 : 0.8) * k;
      const bob = sel ? -Math.abs(Math.sin(time * 4)) * 8 : 0;
      Art.vehicle(ctx, VEHICLES[i], x, rowY + bob, s, sel ? Math.sin(time * 3) * 0.08 : 0, time, sel ? 1 : 0);
      addButton(x, rowY, Math.min(76, spacing * 0.5), () => {
        if (selected === i) startGame();
        else selectVehicle(i);
      });
    }

    const ax = Math.min(spacing * 2 + 40, cx - 60);
    Art.keycap(ctx, cx - ax, rowY, 70, 66, 'left');
    addButton(cx - ax, rowY, 40, () => selectVehicle(selected - 1));
    Art.keycap(ctx, cx + ax, rowY, 70, 66, 'right');
    addButton(cx + ax, rowY, 40, () => selectVehicle(selected + 1));

    const py = H * 0.8;
    const pr = 62 + Math.sin(time * 4) * 4;
    Art.playButton(ctx, cx, py, pr);
    addButton(cx, py, 70, startGame);
    Art.keycap(ctx, cx + 160, py, 150, 52, 'space');
    addButton(cx + 160, py, 60, startGame);

    Art.iconButton(ctx, Sound.isMuted() ? 'mute' : 'sound', W - 52, 48, 32);
    addButton(W - 52, 48, 36, () => Sound.toggleMute());
  }

  function drawCelebration() {
    if (mode !== 'celebrate' && !(mode === 'pause' && pausedFrom === 'celebrate')) return;
    const t = celebrateT;
    const a = clamp((3.1 - t) * 2, 0, 1);
    const s = easeOutBack(clamp(t / 0.6, 0, 1)) * 1.7;
    ctx.save();
    ctx.globalAlpha = a;
    Art.sunburst(ctx, W / 2, H * 0.4, 220 * Math.max(0.1, s / 1.7), time * 0.8, 'rgba(255,241,118,0.5)');
    Art.trophy(ctx, W / 2, H * 0.4 + Math.sin(time * 4) * 6, s);
    ctx.restore();
  }

  function drawPause() {
    buttons = [];
    ctx.fillStyle = 'rgba(25,20,45,0.55)';
    ctx.fillRect(0, 0, W, H);
    const pr = 84 + Math.sin(time * 4) * 4;
    Art.playButton(ctx, W / 2, H / 2 - 30, pr);
    addButton(W / 2, H / 2 - 30, 90, resumeGame);
    Art.iconButton(ctx, 'home', W / 2, H / 2 + 120, 40, '#ffe082');
    addButton(W / 2, H / 2 + 120, 44, goHome);
    Art.iconButton(ctx, Sound.isMuted() ? 'mute' : 'sound', W - 52, 48, 32);
    addButton(W - 52, 48, 36, () => Sound.toggleMute());
  }

  function render() {
    buttons = [];
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.save();
    if (shake > 0) {
      const m = shake * 14;
      ctx.translate(rand(-m, m), rand(-m, m));
    }
    drawGround();
    drawDecor();
    drawRoad();
    if (mode !== 'menu') {
      drawPickups();
      drawObstacles();
      drawPlayer();
      drawHitObstacles();
      drawParticles(false);
    }
    drawSnowfall();
    ctx.restore();

    if (mode === 'menu') drawMenu();
    else {
      drawHud();
      drawHint();
      drawFlyers();
    }
    drawParticles(true);
    drawCelebration();
    if (mode === 'pause') drawPause();
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------------------------------------------------------------- Eingaben

  function wakeAudio() {
    Sound.init();
    if (!audioReady) {
      audioReady = true;
      if (mode !== 'pause') Sound.startMusic();
    }
  }

  const LEFT = ['ArrowLeft', 'KeyA'];
  const RIGHT = ['ArrowRight', 'KeyD'];
  const ACTION = ['Space', 'Enter', 'NumpadEnter'];

  window.addEventListener('keydown', (e) => {
    const k = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
    wakeAudio();
    if (k === 'KeyM') {
      Sound.toggleMute();
      return;
    }
    if (mode === 'menu') {
      if (e.repeat) return;
      if (LEFT.includes(k)) selectVehicle(selected - 1);
      else if (RIGHT.includes(k)) selectVehicle(selected + 1);
      else if (ACTION.includes(k)) startGame();
    } else if (mode === 'play' || mode === 'celebrate') {
      if (k === 'KeyP' || k === 'Escape') {
        pauseGame();
        return;
      }
      if (e.repeat) return;
      if (LEFT.includes(k)) steer(-1);
      else if (RIGHT.includes(k)) steer(1);
      else if (ACTION.includes(k)) honk();
    } else if (mode === 'pause') {
      if (e.repeat) return;
      if (k === 'KeyP' || k === 'Escape' || ACTION.includes(k)) resumeGame();
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    wakeAudio();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / scale;
    const y = (e.clientY - r.top) / scale;
    for (let i = buttons.length - 1; i >= 0; i--) {
      const b = buttons[i];
      if (Math.hypot(x - b.x, y - b.y) <= b.r) {
        b.fn();
        return;
      }
    }
    if (mode === 'play' || mode === 'celebrate') steer(x < laneX(player.pos) ? -1 : 1);
  });

  window.addEventListener('blur', pauseGame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  // ------------------------------------------------------------- Fenstergröße

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    // Mindestens 960x720 logische Pixel, der Rest wird mit Landschaft aufgefüllt.
    scale = Math.min(cw / 960, ch / 720);
    W = cw / scale;
    H = ch / scale;
    roadX = (W - ROAD_W) / 2;
  }

  window.addEventListener('resize', () => {
    resize();
    fillDecor();
  });

  // -------------------------------------------------------------------- Start

  resize();
  resetRun();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Kleine Testschnittstelle für automatisierte Prüfungen.
  window.__flitzi = {
    get state() { return { mode, world, trophies, stars, lane: player.lane, obstacles: obstacles.length, pickups: pickups.length }; },
    giveStars(n) { for (let i = 0; i < n; i++) { stars = Math.min(STARS_PER_WORLD - 1, stars + 1); } },
    spawnObstacleAhead() { obstacles.push(mkObstacle(player.lane, playerY() - 200, WORLDS[world].obstacles[0])); },
    spawnStarAhead() { pickups.push(mkStar(player.lane, playerY() - 200)); },
  };
})();
