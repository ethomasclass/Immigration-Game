// Nav map (top right). North is up; the blue arrow is the player; the gold
// star is the current goal (it slides to the edge when the goal is far away).
// Drawn from each zone's map() data, so it needs no art.
const cv = document.getElementById('minimap');
const g = cv.getContext('2d');
const SIZE = 168;
cv.width = SIZE; cv.height = SIZE;

export class Minimap {
  constructor(game) { this.game = game; this.t = 0; }

  update(dt) {
    this.t += dt;
    if (this.t < 0.1) return;      // 10 fps is plenty
    this.t = 0;
    const zone = this.game.zone;
    const m = zone && zone.map && zone.map();
    cv.classList.toggle('hidden', !m);
    if (!m) return;
    const c = this.game.controls, b = m.bounds;
    const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    const sc = m.scale || Math.max(0.9, Math.min(7, 150 / span * 1.6));   // px per meter
    const X = (x) => SIZE / 2 + (x - c.pos.x) * sc, Z = (z) => SIZE / 2 + (z - c.pos.z) * sc;

    g.save();
    g.clearRect(0, 0, SIZE, SIZE);
    g.beginPath(); g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, 7); g.clip();
    g.fillStyle = m.ground || '#5a4434'; g.fillRect(0, 0, SIZE, SIZE);
    g.fillStyle = '#e8dcbc';
    for (const st of m.streets) g.fillRect(X(st.x0), Z(st.z0), (st.x1 - st.x0) * sc, (st.z1 - st.z0) * sc);
    if (m.parks) { g.fillStyle = '#7a9a5a'; for (const p of m.parks) g.fillRect(X(p.x0), Z(p.z0), (p.x1 - p.x0) * sc, (p.z1 - p.z0) * sc); }
    if (m.water) { g.fillStyle = '#3a5a6a'; for (const p of m.water) g.fillRect(X(p.x0), Z(p.z0), (p.x1 - p.x0) * sc, (p.z1 - p.z0) * sc); }
    if (m.lines) { g.strokeStyle = '#e8dcbc'; for (const l of m.lines) { g.lineWidth = l.w * sc; g.beginPath(); g.moveTo(X(l.x0), Z(l.z0)); g.lineTo(X(l.x1), Z(l.z1)); g.stroke(); } }
    g.setLineDash([4, 3]); g.strokeStyle = '#2a2a2a'; g.lineWidth = 2;
    for (const e of m.els || []) { g.beginPath(); g.moveTo(X(e.x), 0); g.lineTo(X(e.x), SIZE); g.stroke(); }
    g.setLineDash([]);
    g.fillStyle = '#8e2f25';
    for (const p of m.pois || []) { g.beginPath(); g.arc(X(p.x), Z(p.z), 2.5, 0, 7); g.fill(); }

    // goal marker
    const goal = this.game.currentGoal;
    if (goal && goal.at) {
      let gx = X(goal.at[0]), gz = Z(goal.at[1]);
      const dx = gx - SIZE / 2, dz = gz - SIZE / 2, d = Math.hypot(dx, dz), R = SIZE / 2 - 12;
      const far = d > R;
      if (far) { gx = SIZE / 2 + dx / d * R; gz = SIZE / 2 + dz / d * R; }
      const pulse = 1 + Math.sin(performance.now() / 250) * 0.15;
      g.fillStyle = '#f2c230'; g.strokeStyle = '#3a2a10'; g.lineWidth = 1.5;
      star(gx, gz, (far ? 6 : 8) * pulse);
    }
    // player arrow
    g.translate(SIZE / 2, SIZE / 2); g.rotate(-c.yaw);
    g.fillStyle = '#1d6fa0'; g.strokeStyle = '#fff'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3.5); g.lineTo(-6.5, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();
    // frame + N
    g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.beginPath(); g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, 7); g.stroke();
    g.fillStyle = '#c9a24a'; g.font = 'bold 12px Georgia'; g.textAlign = 'center'; g.fillText('N', SIZE / 2, 15);
  }
}

function star(x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke();
}
