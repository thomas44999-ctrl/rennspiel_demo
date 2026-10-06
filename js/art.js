'use strict';

// Sämtliche Grafiken werden mit Canvas-Formen gezeichnet, es gibt keine Bilddateien.
const Art = (() => {
  const TAU = Math.PI * 2;
  const INK = '#2d2a32';

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function box(c, x, y, w, h, r, fill, stroke, lw) {
    rr(c, x, y, w, h, r);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.lineWidth = lw || 3;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  function dot(c, x, y, r, fill, stroke, lw) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.lineWidth = lw || 3;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  function oval(c, x, y, rx, ry, fill, stroke) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.lineWidth = 3;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  function line(c, x1, y1, x2, y2, color, w) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.stroke();
  }

  function poly(c, pts, fill, stroke) {
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.lineWidth = 3;
      c.lineJoin = 'round';
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  // ---------------------------------------------------------------- Fahrzeuge
  // Alle Fahrzeuge sind von oben gesehen, Fahrtrichtung nach oben, Mittelpunkt 0/0.

  function wheel(c, x, y, w, h) {
    box(c, x, y, w, h, 4, '#26232a');
    c.fillStyle = 'rgba(255,255,255,0.18)';
    for (let yy = y + 4; yy < y + h - 3; yy += 7) c.fillRect(x + 2, yy, w - 4, 2);
  }

  function raceCar(c) {
    const body = '#2f80ed';
    const dark = '#1c5fbf';
    wheel(c, -37, -48, 14, 26);
    wheel(c, 23, -48, 14, 26);
    wheel(c, -39, 14, 16, 32);
    wheel(c, 23, 14, 16, 32);
    box(c, -36, -66, 72, 11, 5, dark, INK);
    box(c, -38, 50, 76, 13, 5, dark, INK);
    c.beginPath();
    c.moveTo(0, -64);
    c.bezierCurveTo(16, -64, 20, -32, 22, -12);
    c.lineTo(30, 4);
    c.lineTo(30, 40);
    c.quadraticCurveTo(30, 54, 16, 54);
    c.lineTo(-16, 54);
    c.quadraticCurveTo(-30, 54, -30, 40);
    c.lineTo(-30, 4);
    c.lineTo(-22, -12);
    c.bezierCurveTo(-20, -32, -16, -64, 0, -64);
    c.closePath();
    c.fillStyle = body;
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.stroke();
    box(c, -5, -58, 10, 44, 4, '#fff');
    box(c, -5, 34, 10, 16, 4, '#fff');
    dot(c, 0, 12, 17, '#1d1b22');
    dot(c, 0, 14, 11, '#ffd54f', INK);
    box(c, -7, 4, 14, 6, 3, '#4fc3f7');
  }

  function fireTruck(c, t, honk) {
    const red = '#e53935';
    const dark = '#b71c1c';
    [-48, -6, 34].forEach((y) => {
      wheel(c, -38, y, 10, 24);
      wheel(c, 28, y, 10, 24);
    });
    box(c, -32, -70, 64, 140, 10, red, INK);
    box(c, -32, -70, 64, 42, 10, dark, INK);
    box(c, -25, -65, 50, 13, 4, '#9be7ff', INK);
    // Blaulicht
    const on = Math.sin(t * (honk > 0 ? 16 : 6)) > 0;
    [[-12, on], [12, !on]].forEach(([x, lit]) => {
      if (lit) {
        const g = c.createRadialGradient(x, -42, 2, x, -42, 26);
        g.addColorStop(0, 'rgba(64,196,255,0.8)');
        g.addColorStop(1, 'rgba(64,196,255,0)');
        c.fillStyle = g;
        c.fillRect(x - 26, -68, 52, 52);
      }
      dot(c, x, -42, 7, lit ? '#80d8ff' : '#1565c0', INK);
    });
    // Leiter
    line(c, -13, -20, -13, 62, '#78909c', 8);
    line(c, 13, -20, 13, 62, '#78909c', 8);
    for (let y = -14; y <= 58; y += 11) line(c, -13, y, 13, y, '#cfd8dc', 4);
    line(c, -13, -20, -13, 62, '#eceff1', 4);
    line(c, 13, -20, 13, 62, '#eceff1', 4);
  }

  function tractor(c, t) {
    const green = '#43a047';
    const dark = '#2e7d32';
    wheel(c, -46, 6, 20, 48);
    wheel(c, 26, 6, 20, 48);
    wheel(c, -32, -54, 12, 24);
    wheel(c, 20, -54, 12, 24);
    box(c, -17, -64, 34, 66, 9, green, INK);
    c.fillStyle = dark;
    for (let i = 0; i < 4; i++) c.fillRect(-10, -59 + i * 6, 20, 3);
    box(c, -28, -6, 56, 60, 9, green, INK);
    box(c, -24, -2, 48, 46, 7, '#fdd835', INK);
    box(c, -16, 6, 32, 6, 3, 'rgba(255,255,255,0.5)');
    const puff = Math.sin(t * 10) * 1.5;
    dot(c, 9, -28, 5 + puff * 0.3, '#424242', INK);
  }

  function bus(c) {
    const yellow = '#fbc02d';
    const dark = '#f9a825';
    [-50, 36].forEach((y) => {
      wheel(c, -38, y, 10, 26);
      wheel(c, 28, y, 10, 26);
    });
    box(c, -32, -72, 64, 144, 12, yellow, INK);
    box(c, -26, -67, 52, 13, 4, '#9be7ff', INK);
    for (let i = 0; i < 5; i++) {
      box(c, -30, -44 + i * 21, 6, 15, 2, '#90caf9');
      box(c, 24, -44 + i * 21, 6, 15, 2, '#90caf9');
    }
    box(c, -19, -42, 38, 102, 8, dark);
    box(c, -10, -28, 20, 16, 3, '#fff59d', INK);
    box(c, -10, 18, 20, 16, 3, '#fff59d', INK);
    box(c, -24, 62, 48, 6, 3, '#e65100');
  }

  const VEHICLE_DRAW = { race: raceCar, fire: fireTruck, tractor, bus };

  function vehicle(c, kind, x, y, s, rot, t, honk) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.scale(s, s);
    oval(c, 5, 8, 36, 70, 'rgba(0,0,0,0.2)');
    (VEHICLE_DRAW[kind] || raceCar)(c, t || 0, honk || 0);
    c.restore();
  }

  // --------------------------------------------------------------- Hindernisse

  function shadow(c, y, rx) {
    oval(c, 4, y, rx, rx * 0.28, 'rgba(0,0,0,0.22)');
  }

  const OBSTACLES = {
    cone(c) {
      shadow(c, 28, 34);
      box(c, -30, 16, 60, 12, 4, '#e8590c', INK);
      poly(c, [0, -38, 23, 18, -23, 18], '#ff7a1a', INK);
      const w = (y) => 23 * (y + 38) / 56;
      [[-16, -6], [2, 10]].forEach(([a, b]) => {
        poly(c, [-w(a) + 1, a, w(a) - 1, a, w(b) - 1, b, -w(b) + 1, b], '#fff');
      });
    },
    crate(c) {
      shadow(c, 32, 36);
      box(c, -32, -32, 64, 64, 6, '#d08c45', INK);
      box(c, -23, -23, 46, 46, 3, '#b5733a');
      c.save();
      rr(c, -23, -23, 46, 46, 3);
      c.clip();
      line(c, -30, 30, 30, -30, '#d08c45', 10);
      c.restore();
      line(c, -23, 23, 23, -23, INK, 2);
    },
    hay(c) {
      shadow(c, 26, 38);
      box(c, -38, -26, 76, 52, 16, '#f2c94c', INK);
      for (let y = -14; y <= 14; y += 9) line(c, -28, y, 28, y + 2, '#c9a227', 3);
      line(c, -16, -25, -16, 25, '#a1662f', 4);
      line(c, 16, -25, 16, 25, '#a1662f', 4);
    },
    castle(c) {
      shadow(c, 30, 40);
      box(c, -36, -6, 72, 34, 4, '#e6c27a', INK);
      box(c, -36, -30, 22, 30, 3, '#e6c27a', INK);
      box(c, 14, -30, 22, 30, 3, '#e6c27a', INK);
      [-36, -24, 14, 26].forEach((x) => box(c, x, -38, 10, 10, 2, '#e6c27a', INK));
      c.beginPath();
      c.arc(0, 28, 10, Math.PI, 0);
      c.fillStyle = '#8d6e63';
      c.fill();
      line(c, 0, -6, 0, -46, INK, 3);
      poly(c, [0, -46, 20, -40, 0, -32], '#e53935', INK);
    },
    ball(c, t) {
      shadow(c, 30, 30);
      const cols = ['#e53935', '#ffffff', '#1e88e5', '#ffffff', '#fdd835', '#ffffff'];
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, 30, i * TAU / 6 + t, (i + 1) * TAU / 6 + t);
        c.closePath();
        c.fillStyle = cols[i];
        c.fill();
      }
      dot(c, 0, 0, 30, 'rgba(0,0,0,0)', INK);
      dot(c, 0, 0, 7, '#fff', INK, 2);
      oval(c, -11, -13, 8, 5, 'rgba(255,255,255,0.7)');
    },
    crab(c, t) {
      shadow(c, 24, 34);
      for (let i = 0; i < 3; i++) {
        const k = Math.sin(t * 8 + i) * 3;
        line(c, -22, 4 + i * 7, -38, 10 + i * 9 + k, '#c62828', 4);
        line(c, 22, 4 + i * 7, 38, 10 + i * 9 - k, '#c62828', 4);
      }
      line(c, -20, -6, -32, -20, '#c62828', 5);
      line(c, 20, -6, 32, -20, '#c62828', 5);
      [-1, 1].forEach((s) => {
        dot(c, 34 * s, -24, 11, '#ef5350', INK);
        poly(c, [34 * s, -24, 44 * s, -36, 26 * s, -36], '#fff8e1');
      });
      oval(c, 0, 4, 30, 20, '#ef5350', INK);
      line(c, -8, -12, -10, -28, INK, 3);
      line(c, 8, -12, 10, -28, INK, 3);
      dot(c, -10, -30, 6, '#fff', INK, 2);
      dot(c, 10, -30, 6, '#fff', INK, 2);
      dot(c, -10, -30, 2.5, INK);
      dot(c, 10, -30, 2.5, INK);
      c.beginPath();
      c.arc(0, 6, 9, 0.2, Math.PI - 0.2);
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.stroke();
    },
    snowman(c) {
      shadow(c, 36, 30);
      dot(c, 0, 14, 24, '#ffffff', INK);
      dot(c, 0, -16, 17, '#ffffff', INK);
      dot(c, 0, 6, 3, INK);
      dot(c, 0, 18, 3, INK);
      dot(c, -6, -20, 2.5, INK);
      dot(c, 6, -20, 2.5, INK);
      poly(c, [0, -15, 14, -12, 0, -10], '#ff7a1a', INK);
      box(c, -16, -34, 32, 6, 2, INK);
      box(c, -10, -50, 20, 18, 3, INK);
      box(c, -10, -38, 20, 4, 1, '#e53935');
    },
    ice(c) {
      shadow(c, 32, 34);
      box(c, -30, -30, 60, 60, 8, '#b3e5fc', '#4f83a8');
      box(c, -22, -22, 22, 8, 3, 'rgba(255,255,255,0.85)');
      box(c, -22, -10, 8, 18, 3, 'rgba(255,255,255,0.6)');
      line(c, 6, 10, 20, 20, 'rgba(79,131,168,0.6)', 2);
      line(c, 12, -6, 22, 2, 'rgba(79,131,168,0.6)', 2);
    },
  };

  function obstacle(c, kind, x, y, s, rot, t, alpha) {
    c.save();
    c.globalAlpha = alpha === undefined ? 1 : alpha;
    c.translate(x, y);
    c.rotate(rot || 0);
    c.scale(s, s);
    (OBSTACLES[kind] || OBSTACLES.cone)(c, t || 0);
    c.restore();
  }

  // ------------------------------------------------------------------- Sterne

  function starPath(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 ? r * 0.48 : r;
      c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    c.closePath();
  }

  function star(c, x, y, r, rot, glow) {
    c.save();
    c.translate(x, y);
    if (glow) {
      const g = c.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.9);
      g.addColorStop(0, 'rgba(255,241,118,0.75)');
      g.addColorStop(1, 'rgba(255,241,118,0)');
      c.fillStyle = g;
      c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
    }
    c.rotate(rot || 0);
    starPath(c, r);
    c.fillStyle = '#ffd54f';
    c.fill();
    c.lineWidth = Math.max(2, r * 0.12);
    c.lineJoin = 'round';
    c.strokeStyle = '#e09b00';
    c.stroke();
    starPath(c, r * 0.45);
    c.translate(-r * 0.12, -r * 0.12);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fill();
    c.restore();
  }

  function starSlot(c, x, y, r) {
    c.save();
    c.translate(x, y);
    starPath(c, r);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fill();
    c.lineWidth = 2.5;
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(45,42,50,0.35)';
    c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- Landschaft
  // Deko am Straßenrand ist in Seitenansicht gezeichnet (Bilderbuch-Stil).

  const DECOR = {
    tree(c) {
      oval(c, 0, 32, 28, 8, 'rgba(0,0,0,0.18)');
      box(c, -6, 0, 12, 32, 3, '#8d5a2b', INK);
      dot(c, -16, -6, 18, '#43a047', INK);
      dot(c, 16, -8, 18, '#43a047', INK);
      dot(c, 0, -20, 26, '#43a047', INK);
      dot(c, -16, -6, 15, '#43a047');
      dot(c, 16, -8, 15, '#43a047');
      dot(c, -7, -28, 9, '#66bb6a');
      dot(c, 10, -10, 4, '#e53935');
      dot(c, -12, -16, 4, '#e53935');
    },
    flower(c, col) {
      line(c, 0, 0, 0, 16, '#388e3c', 3);
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5;
        dot(c, Math.cos(a) * 7, Math.sin(a) * 7 - 2, 6, col);
      }
      dot(c, 0, -2, 4.5, '#ffd54f');
    },
    bush(c) {
      oval(c, 0, 14, 30, 7, 'rgba(0,0,0,0.15)');
      dot(c, -14, 4, 13, '#2e7d32', INK);
      dot(c, 14, 4, 13, '#2e7d32', INK);
      dot(c, 0, -4, 16, '#2e7d32', INK);
      dot(c, -14, 4, 10, '#2e7d32');
      dot(c, 14, 4, 10, '#2e7d32');
      dot(c, -4, -9, 6, '#43a047');
    },
    palm(c, col, t) {
      oval(c, 0, 44, 30, 8, 'rgba(0,0,0,0.15)');
      for (let i = 0; i < 6; i++) box(c, -6 + i * 1.2, 40 - i * 13, 13, 14, 4, i % 2 ? '#a1662f' : '#8d5a2b', INK, 2);
      const sway = Math.sin(t * 1.5) * 0.05;
      c.save();
      c.translate(4, -34);
      c.rotate(sway);
      [-2.6, -2.0, -1.2, -0.5, 0.2].forEach((a) => {
        c.save();
        c.rotate(a + Math.PI / 2);
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(14, -18, 0, -42);
        c.quadraticCurveTo(-8, -18, 0, 0);
        c.fillStyle = '#43a047';
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = INK;
        c.stroke();
        c.restore();
      });
      dot(c, -4, 4, 5, '#6d4c41', INK, 2);
      dot(c, 5, 5, 5, '#6d4c41', INK, 2);
      c.restore();
    },
    shell(c, col) {
      c.beginPath();
      c.moveTo(0, 8);
      c.arc(0, 8, 13, Math.PI, 0);
      c.closePath();
      c.fillStyle = '#ffccbc';
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = '#d7826b';
      c.stroke();
      for (let i = 1; i < 5; i++) {
        const a = Math.PI + i * Math.PI / 5;
        line(c, 0, 8, Math.cos(a) * 12, 8 + Math.sin(a) * 12, '#d7826b', 1.5);
      }
    },
    umbrella(c, col) {
      box(c, -26, 12, 52, 26, 4, col, INK, 2);
      box(c, -26, 20, 52, 6, 0, 'rgba(255,255,255,0.7)');
      line(c, 0, -26, 0, 22, '#6d4c41', 3);
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(0, -28);
        c.arc(0, -10, 30, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6);
        c.closePath();
        c.fillStyle = i % 2 ? '#ffffff' : '#e53935';
        c.fill();
      }
      c.beginPath();
      c.arc(0, -10, 30, Math.PI, 0);
      c.lineWidth = 2;
      c.strokeStyle = INK;
      c.stroke();
    },
    pine(c) {
      oval(c, 0, 40, 26, 7, 'rgba(0,0,0,0.12)');
      box(c, -5, 26, 10, 14, 2, '#6d4c41', INK, 2);
      [[28, 30, 0], [22, 8, 1], [16, -12, 2]].forEach(([w, y]) => {
        poly(c, [-w, y, w, y, 0, y - 30], '#2e7d32', INK);
        poly(c, [-w * 0.4, y - 18, w * 0.4, y - 18, 0, y - 30], '#ffffff');
      });
    },
    snowrock(c) {
      oval(c, 0, 14, 26, 7, 'rgba(0,0,0,0.12)');
      poly(c, [-24, 14, -18, -6, -4, -14, 14, -10, 24, 14], '#90a4ae', INK);
      poly(c, [-17, -4, -4, -12, 13, -8, 8, -2, -4, -4], '#ffffff');
    },
  };

  function decor(c, kind, x, y, s, flip, col, t) {
    c.save();
    c.translate(x, y);
    c.scale(flip ? -s : s, s);
    (DECOR[kind] || DECOR.bush)(c, col, t || 0);
    c.restore();
  }

  // ------------------------------------------------------------ Belohnungen

  function trophy(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    oval(c, 0, 44, 34, 8, 'rgba(0,0,0,0.2)');
    c.beginPath();
    c.arc(-32, -22, 14, Math.PI * 0.5, Math.PI * 1.5);
    c.moveTo(32, -36);
    c.arc(32, -22, 14, -Math.PI * 0.5, Math.PI * 0.5);
    c.lineWidth = 12;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 7;
    c.strokeStyle = '#ffca28';
    c.stroke();
    c.beginPath();
    c.moveTo(-34, -44);
    c.lineTo(34, -44);
    c.quadraticCurveTo(34, 12, 0, 16);
    c.quadraticCurveTo(-34, 12, -34, -44);
    c.closePath();
    c.fillStyle = '#ffca28';
    c.fill();
    c.lineWidth = 3.5;
    c.strokeStyle = INK;
    c.stroke();
    box(c, -7, 14, 14, 16, 2, '#ffb300', INK);
    box(c, -26, 28, 52, 14, 4, '#8d6e63', INK);
    oval(c, -16, -30, 6, 11, 'rgba(255,255,255,0.55)');
    star(c, 6, -18, 13, 0, false);
    c.restore();
  }

  function flag(c, x, y, w, h, t) {
    const cols = 7;
    const rows = 5;
    const cw = w / cols;
    const chh = h / rows;
    const off = (i) => Math.sin(t * 4 - i * 0.8) * 7 * (i / cols);
    line(c, x, y - 10, x, y + h + 70, '#6d4c41', 8);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x1 = x + i * cw;
        const x2 = x1 + cw;
        const y1 = y + j * chh;
        poly(c, [x1, y1 + off(i), x2, y1 + off(i + 1), x2, y1 + chh + off(i + 1), x1, y1 + chh + off(i)],
          (i + j) % 2 ? '#2d2a32' : '#ffffff');
      }
    }
    c.beginPath();
    c.moveTo(x, y + off(0));
    for (let i = 1; i <= cols; i++) c.lineTo(x + i * cw, y + off(i));
    for (let i = cols; i >= 0; i--) c.lineTo(x + i * cw, y + h + off(i));
    c.closePath();
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.stroke();
    dot(c, x, y - 12, 7, '#ffd54f', INK);
  }

  function sunburst(c, x, y, r, t, color) {
    c.save();
    c.translate(x, y);
    c.rotate(t);
    c.fillStyle = color || 'rgba(255,235,59,0.45)';
    for (let i = 0; i < 12; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, r, i * TAU / 12, i * TAU / 12 + TAU / 24);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  // ------------------------------------------------------------------- Knöpfe

  function roundButton(c, x, y, r, fill) {
    dot(c, x, y + 4, r, 'rgba(0,0,0,0.25)');
    dot(c, x, y, r, fill, INK, 3.5);
  }

  function icon(c, kind, x, y, r) {
    c.save();
    c.translate(x, y);
    const s = r / 30;
    c.scale(s, s);
    switch (kind) {
      case 'pause':
        box(c, -12, -14, 8, 28, 3, INK);
        box(c, 4, -14, 8, 28, 3, INK);
        break;
      case 'play':
        poly(c, [-9, -16, 16, 0, -9, 16], INK);
        break;
      case 'home':
        poly(c, [-17, -2, 0, -17, 17, -2], INK);
        box(c, -12, -4, 24, 18, 2, INK);
        box(c, -4, 4, 8, 10, 1, '#ffffff');
        break;
      case 'sound':
      case 'mute':
        poly(c, [-18, -6, -10, -6, 0, -15, 0, 15, -10, 6, -18, 6], INK);
        if (kind === 'sound') {
          c.lineWidth = 3.5;
          c.lineCap = 'round';
          c.strokeStyle = INK;
          [8, 15].forEach((rad) => {
            c.beginPath();
            c.arc(0, 0, rad, -0.8, 0.8);
            c.stroke();
          });
        } else {
          line(c, 6, -8, 18, 8, '#e53935', 4.5);
          line(c, 18, -8, 6, 8, '#e53935', 4.5);
        }
        break;
      default:
        break;
    }
    c.restore();
  }

  function iconButton(c, kind, x, y, r, fill) {
    roundButton(c, x, y, r, fill || '#ffffff');
    icon(c, kind, x, y, r);
  }

  function playButton(c, x, y, r) {
    dot(c, x, y + 6, r, 'rgba(0,0,0,0.25)');
    dot(c, x, y, r, '#43c463', INK, 5);
    dot(c, x, y - r * 0.08, r * 0.82, '#5bd67a');
    poly(c, [x - r * 0.3, y - r * 0.42, x + r * 0.48, y, x - r * 0.3, y + r * 0.42], '#ffffff', INK);
  }

  // Tastatur-Tasten als Hinweis für Kinder, die noch nicht lesen können.
  function keycap(c, x, y, w, h, kind) {
    box(c, x - w / 2, y - h / 2 + 6, w, h, 10, '#9e9e9e', INK);
    box(c, x - w / 2, y - h / 2, w, h, 10, '#fafafa', INK);
    box(c, x - w / 2 + 6, y - h / 2 + 5, w - 12, h - 16, 7, '#ffffff');
    const a = Math.min(w, h) * 0.22;
    if (kind === 'left') poly(c, [x + a * 0.8, y - a - 3, x - a, y - 3, x + a * 0.8, y + a - 3], INK);
    if (kind === 'right') poly(c, [x - a * 0.8, y - a - 3, x + a, y - 3, x - a * 0.8, y + a - 3], INK);
    if (kind === 'space') {
      c.beginPath();
      c.moveTo(x - w * 0.28, y - 12);
      c.lineTo(x - w * 0.28, y + 2);
      c.lineTo(x + w * 0.28, y + 2);
      c.lineTo(x + w * 0.28, y - 12);
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.strokeStyle = INK;
      c.stroke();
    }
  }

  function panel(c, x, y, w, h) {
    box(c, x, y + 4, w, h, 18, 'rgba(0,0,0,0.18)');
    box(c, x, y, w, h, 18, 'rgba(255,255,255,0.88)', INK);
  }

  return {
    INK, box, dot, oval, line, poly,
    vehicle, obstacle, star, starSlot, decor, trophy, flag, sunburst,
    iconButton, playButton, keycap, panel,
  };
})();
