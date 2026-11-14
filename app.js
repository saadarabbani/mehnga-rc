// ===== ROUTER =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  const nav = document.getElementById('nav-' + name);
  if (nav) nav.classList.add('active');
  if (name === 'map') initFullMap();
}

// ===== TOAST =====
function showToast(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.innerHTML = '';
  c.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

// ===== SPLASH =====
const splashMessages = ['INITIALIZING SYSTEMS...', 'LOADING AI MODULES...', 'CONNECTING TO UNIT-01...', 'CALIBRATING SENSORS...', 'READY'];
let si = 0;
function cycleSplash() {
  const el = document.getElementById('splashStatus');
  if (el && si < splashMessages.length) {
    el.textContent = splashMessages[si++];
    if (si < splashMessages.length) setTimeout(cycleSplash, 500);
  }
}
setTimeout(cycleSplash, 400);
setTimeout(() => { showPage('page-login'); initLoginParticles(); }, 2600);

// ===== LOGIN =====
function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) { showToast('❌ Please fill in all fields'); return; }
  showToast('✅ Logging in...');
  setTimeout(() => { showPage('page-app'); initApp(); }, 800);
}
function doDemo() {
  showToast('🎮 Entering demo mode...');
  setTimeout(() => { showPage('page-app'); initApp(); }, 600);
}
function doLogout() {
  showPage('page-login');
  showToast('👋 Logged out successfully');
}

// ===== LOGIN PARTICLES =====
function initLoginParticles() {
  const canvas = document.getElementById('loginCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const particles = Array.from({length: 60}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    o: Math.random() * 0.5 + 0.1
  }));
  function animParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,229,200,${p.o})`;
      ctx.fill();
    });
    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,229,200,${0.1 * (1 - dist/100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    if (document.getElementById('page-login').classList.contains('active')) requestAnimationFrame(animParticles);
  }
  animParticles();
}

// ===== APP INIT =====
function initApp() {
  startClock();
  initCameraCanvas();
  initNavMap();
  startUptimeTimer();
  startTelemetry();
  showTab('cockpit');
}

// ===== CLOCK =====
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const el = document.getElementById('cameraTime');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ===== UPTIME TIMER =====
let uptimeSeconds = 5077; // 01:24:37
function startUptimeTimer() {
  setInterval(() => {
    uptimeSeconds++;
    const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2,'0');
    const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2,'0');
    const s = String(uptimeSeconds % 60).padStart(2,'0');
    const str = `${h}:${m}:${s}`;
    const el1 = document.getElementById('sc-uptime');
    const el2 = document.getElementById('sc-uptime2');
    if (el1) el1.textContent = str;
    if (el2) el2.textContent = str;
  }, 1000);
}

// ===== CAMERA CANVAS (Dashboard) =====
let camAnimFrame;
function initCameraCanvas() {
  const canvas = document.getElementById('cameraCanvas');
  if (!canvas) return;
  function resize() { canvas.width = canvas.offsetWidth; }
  resize();
  window.addEventListener('resize', resize);
  drawCamera(canvas);
}

function drawCamera(canvas) {
  const ctx = canvas.getContext('2d');
  let t = 0;
  function frame() {
    const W = canvas.width, H = canvas.height || 190;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    // Night Vision Mode Toggle
    if (nvMode) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#001a00'); bg.addColorStop(1, '#004d00');
      ctx.fillStyle = bg;
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#050D1A'); bg.addColorStop(1, '#020810');
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, W, H);

    // Grid floor
    ctx.strokeStyle = 'rgba(0,229,200,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < W; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    // Window light shaft
    if (!nvMode) {
      const shaft = ctx.createLinearGradient(W * 0.6, 0, W * 0.8, H);
      shaft.addColorStop(0, 'rgba(255,240,200,0.04)');
      shaft.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = shaft;
      ctx.beginPath();
      ctx.moveTo(W * 0.6, 0); ctx.lineTo(W * 0.8, 0); ctx.lineTo(W * 0.9, H); ctx.lineTo(W * 0.5, H);
      ctx.closePath(); ctx.fill();
    }

    // Sofa (left)
    ctx.fillStyle = nvMode ? '#00cc00' : '#1a2d4a';
    ctx.beginPath(); ctx.roundRect(W * 0.02, H * 0.55, W * 0.3, H * 0.3, 6); ctx.fill();
    ctx.fillStyle = nvMode ? '#00e600' : '#1e3555';
    ctx.beginPath(); ctx.roundRect(W * 0.02, H * 0.5, W * 0.07, H * 0.38, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W * 0.25, H * 0.5, W * 0.07, H * 0.38, 4); ctx.fill();
    ctx.fillStyle = nvMode ? '#00ff00' : '#243a5e';
    ctx.beginPath(); ctx.roundRect(W * 0.04, H * 0.42, W * 0.26, H * 0.1, 4); ctx.fill();

    // Table (right-center)
    ctx.fillStyle = nvMode ? '#00aa00' : '#3a2a1a';
    ctx.fillRect(W * 0.45, H * 0.6, W * 0.18, H * 0.06);
    ctx.fillRect(W * 0.46, H * 0.66, W * 0.02, H * 0.18);
    ctx.fillRect(W * 0.59, H * 0.66, W * 0.02, H * 0.18);

    // Plant (far right)
    ctx.fillStyle = nvMode ? '#009900' : '#1a3020';
    ctx.beginPath(); ctx.ellipse(W * 0.82, H * 0.65, W * 0.04, H * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = nvMode ? '#006600' : '#0f1f14';
    ctx.fillRect(W * 0.80, H * 0.7, W * 0.04, H * 0.15);

    // Bounding Boxes (Object Detection)
    if (nvMode || t % 100 > 20) {
      ctx.strokeStyle = '#00E5C8'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      // Sofa box
      ctx.strokeRect(W * 0.01, H * 0.41, W * 0.32, H * 0.45);
      ctx.fillStyle = 'rgba(0,229,200,0.8)'; ctx.fillRect(W * 0.01, H * 0.41 - 12, 50, 12);
      ctx.fillStyle = '#000'; ctx.font = '8px Inter'; ctx.fillText('SOFA 98%', W * 0.01 + 2, H * 0.41 - 3);

      // Table box
      ctx.strokeStyle = '#0096FF';
      ctx.strokeRect(W * 0.44, H * 0.59, W * 0.2, H * 0.26);
      ctx.fillStyle = 'rgba(0,150,255,0.8)'; ctx.fillRect(W * 0.44, H * 0.59 - 12, 55, 12);
      ctx.fillStyle = '#000'; ctx.fillText('TABLE 85%', W * 0.44 + 2, H * 0.59 - 3);
      ctx.setLineDash([]);
    }

    // Robot glow ring at bottom center
    const glow = ctx.createRadialGradient(W/2, H, 0, W/2, H, 60);
    glow.addColorStop(0, `rgba(0,229,200,${0.25 + 0.1 * Math.sin(t * 0.05)})`);
    glow.addColorStop(0.5, `rgba(0,150,255,0.1)`);
    glow.addColorStop(1, 'rgba(0,229,200,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Scan line
    const scanY = (H + 40) * ((t * 1.5 % (H + 80)) / (H + 80)) - 20;
    const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
    const scanColor = nvMode ? 'rgba(0,255,0,' : 'rgba(0,229,200,';
    scanGrad.addColorStop(0, scanColor + '0)');
    scanGrad.addColorStop(0.5, scanColor + '0.25)');
    scanGrad.addColorStop(1, scanColor + '0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 2, W, 4);

    // HUD corners
    const cs = 14; // corner size
    ctx.strokeStyle = 'rgba(0,229,200,0.8)';
    ctx.lineWidth = 2;
    const corners = [[8,8],[W-8,8],[8,H-8],[W-8,H-8]];
    const dirs = [[1,1],[-1,1],[1,-1],[-1,-1]];
    corners.forEach(([x,y], i) => {
      const [dx,dy] = dirs[i];
      ctx.beginPath(); ctx.moveTo(x, y + dy*cs); ctx.lineTo(x, y); ctx.lineTo(x + dx*cs, y); ctx.stroke();
    });

    t++;
    requestAnimationFrame(frame);
  }
  frame();
}

// ===== NAV MAP CANVAS (Dashboard) =====
let mapRobotX = 0.5, mapRobotY = 0.5;
let mapRobotT = 0;
function initNavMap() {
  const canvas = document.getElementById('navMapCanvas');
  if (!canvas) return;
  function resize() { canvas.width = canvas.offsetWidth; }
  resize();
  window.addEventListener('resize', resize);
  drawNavMap(canvas);
}

function drawNavMap(canvas) {
  const ctx = canvas.getContext('2d');
  let t = 0;
  // Robot path waypoints (normalized)
  const path = [[0.5,0.7],[0.3,0.7],[0.3,0.45],[0.55,0.45],[0.55,0.25],[0.75,0.25],[0.75,0.65],[0.6,0.65]];
  let pathIdx = 0, pathT = 0;

  function lerp(a,b,t){ return a + (b-a)*t; }
  function drawMap() {
    const W = canvas.width, H = canvas.height || 160;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#050D1A';
    ctx.fillRect(0, 0, W, H);

    // Rooms
    function room(x,y,w,h,label,color='#0B1929') {
      ctx.fillStyle = color;
      ctx.strokeStyle = '#1E3A5F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x*W, y*H, w*W, h*H, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a6080';
      ctx.font = `bold ${Math.round(W*0.02)+7}px Inter`;
      ctx.textAlign = 'center';
      ctx.fillText(label, (x+w/2)*W, (y+h/2)*H+4);
    }
    room(0.05,0.05,0.4,0.35,'Living Room','#0d1f35');
    room(0.55,0.05,0.4,0.35,'Kitchen','#0d1f35');
    room(0.05,0.5,0.4,0.35,'Bedroom','#0d1f35');
    room(0.55,0.5,0.4,0.35,'Study','#0d1f35');

    // Dock
    ctx.fillStyle = 'rgba(123,47,255,0.3)';
    ctx.strokeStyle = '#7B2FFF';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(0.7*W, 0.7*H, 0.2*W, 0.2*H, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7B2FFF'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
    ctx.fillText('DOCK', 0.8*W, 0.82*H);

    // Cleaned area overlay
    ctx.fillStyle = 'rgba(0,229,200,0.07)';
    ctx.beginPath(); ctx.roundRect(0.07*W, 0.07*H, 0.36*W, 0.31*H, 3); ctx.fill();

    // Path trail
    ctx.strokeStyle = 'rgba(0,229,200,0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    path.forEach(([px,py], i) => {
      if (i===0) ctx.moveTo(px*W, py*H); else ctx.lineTo(px*W, py*H);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Obstacles
    [[0.38,0.58],[0.62,0.18]].forEach(([ox,oy]) => {
      ctx.fillStyle = 'rgba(255,74,107,0.3)';
      ctx.strokeStyle = '#FF4A6B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox*W, (oy-0.05)*H);
      ctx.lineTo((ox+0.04)*W, (oy+0.04)*H);
      ctx.lineTo((ox-0.04)*W, (oy+0.04)*H);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });

    // Robot position — animate along path
    pathT += 0.005;
    if (pathT >= 1) { pathT = 0; pathIdx = (pathIdx + 1) % path.length; }
    const nextIdx = (pathIdx + 1) % path.length;
    const rx = lerp(path[pathIdx][0], path[nextIdx][0], pathT) * W;
    const ry = lerp(path[pathIdx][1], path[nextIdx][1], pathT) * H;

    // Robot glow
    const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, 12);
    rg.addColorStop(0, 'rgba(0,150,255,0.5)');
    rg.addColorStop(1, 'rgba(0,150,255,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, ry, 12, 0, Math.PI*2); ctx.fill();
    // Robot dot
    ctx.fillStyle = '#0096FF';
    ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI*2); ctx.stroke();

    // LiDAR Sweep
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(t * 0.05);
    const sweep = ctx.createConicGradient(0, 0, 0);
    sweep.addColorStop(0, 'rgba(0,229,200,0)');
    sweep.addColorStop(0.1, 'rgba(0,229,200,0.3)');
    sweep.addColorStop(0.12, 'rgba(0,229,200,0.8)'); // Leading edge
    sweep.addColorStop(0.13, 'rgba(0,229,200,0)');
    sweep.addColorStop(1, 'rgba(0,229,200,0)');
    ctx.fillStyle = sweep;
    ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    t++;
    requestAnimationFrame(drawMap);
  }
  drawMap();
}

// Night Vision State
let nvMode = false;
function toggleNightVision() {
  nvMode = !nvMode;
  const btn = document.getElementById('nvBtn');
  if (nvMode) {
    btn.style.background = 'rgba(0,229,200,0.2)';
    btn.style.color = 'var(--teal)';
    btn.style.borderColor = 'var(--teal)';
  } else {
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}

// ===== FULL MAP CANVAS =====
let fullMapScale = 1.0;
function initFullMap() {
  const canvas = document.getElementById('mapFullCanvas');
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || window.innerWidth;
  canvas.height = canvas.offsetHeight || window.innerHeight - 120;
  drawFullMap(canvas);
}

function drawFullMap(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0, '#050D1A'); bg.addColorStop(1, '#020810');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Grid
  ctx.strokeStyle = 'rgba(30,58,95,0.5)'; ctx.lineWidth = 0.5;
  for (let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for (let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const s = fullMapScale;
  const ox = W * 0.1, oy = H * 0.1;
  const mw = W * 0.8 * s, mh = H * 0.8 * s;

  function room(x,y,w,h,label) {
    ctx.fillStyle = '#0B1929'; ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(ox+x*mw, oy+y*mh, w*mw, h*mh, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a6080'; ctx.font = `bold 13px Inter`; ctx.textAlign = 'center';
    ctx.fillText(label, ox+(x+w/2)*mw, oy+(y+h/2)*mh+5);
  }

  room(0,0,0.45,0.45,'Living Room');
  room(0.5,0,0.5,0.45,'Kitchen / Dining');
  room(0,0.5,0.45,0.5,'Master Bedroom');
  room(0.5,0.5,0.3,0.5,'Study Room');
  room(0.8,0.5,0.2,0.3,'Bathroom');
  room(0.8,0.8,0.2,0.2,'Dock Station');

  // Cleaned area
  ctx.fillStyle = 'rgba(0,229,200,0.08)';
  ctx.beginPath(); ctx.roundRect(ox, oy, 0.45*mw, 0.45*mh, 4); ctx.fill();
  ctx.fillStyle = 'rgba(0,229,200,0.08)';
  ctx.beginPath(); ctx.roundRect(ox, oy+0.5*mh, 0.45*mw, 0.5*mh, 4); ctx.fill();

  // Obstacles
  [[0.42,0.55],[0.58,0.2],[0.75,0.48]].forEach(([px,py]) => {
    const tx = ox+px*mw, ty = oy+py*mh;
    ctx.fillStyle='rgba(255,74,107,0.2)'; ctx.strokeStyle='#FF4A6B'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(tx,ty-10); ctx.lineTo(tx+8,ty+8); ctx.lineTo(tx-8,ty+8); ctx.closePath();
    ctx.fill(); ctx.stroke();
  });

  // Robot
  const robX = ox + 0.25*mw, robY = oy + 0.3*mh;
  const rg = ctx.createRadialGradient(robX,robY,0,robX,robY,20);
  rg.addColorStop(0,'rgba(0,150,255,0.4)'); rg.addColorStop(1,'rgba(0,150,255,0)');
  ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(robX,robY,20,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0096FF'; ctx.beginPath(); ctx.arc(robX,robY,8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(robX,robY,8,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font='bold 8px Inter'; ctx.textAlign='center'; ctx.fillText('R',robX,robY+3);
}

function mapZoom(dir) {
  fullMapScale = Math.max(0.5, Math.min(2.5, fullMapScale + dir * 0.2));
  initFullMap();
  showToast(`🔍 Zoom ${Math.round(fullMapScale*100)}%`);
}

// ===== SUPER COCKPIT =====
let scAnimFrame;
let scUptimeStart = Date.now() - 5077000;

function openSuperCockpit() {
  showPage('page-super');
  initSCCamera();
  initSCMinimap();
}
function closeSuperCockpit() {
  if (scAnimFrame) cancelAnimationFrame(scAnimFrame);
  showPage('page-app');
}

function initSCCamera() {
  const canvas = document.getElementById('scCameraCanvas');
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = canvas.offsetHeight || 300;

  const ctx = canvas.getContext('2d');
  let t = 0;
  const arDots = Array.from({length:14}, (_, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    return { nx: 0.35 + col * 0.15 + (row % 2) * 0.07, ny: 0.55 - row * 0.09 };
  });

  function drawSCCamera() {
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    if (W !== canvas.width || H !== canvas.height) { canvas.width = W; canvas.height = H; }
    ctx.clearRect(0, 0, W, H);

    // No background fill or room rendering because we have the CSS background image!

    // HUD corners
    const cs = 20;
    ctx.strokeStyle = 'rgba(0,229,200,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, 20 + cs); ctx.lineTo(20, 20); ctx.lineTo(20 + cs, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 20, 20 + cs); ctx.lineTo(W - 20, 20); ctx.lineTo(W - 20 - cs, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, H - 20 - cs); ctx.lineTo(20, H - 20); ctx.lineTo(20 + cs, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 20, H - 20 - cs); ctx.lineTo(W - 20, H - 20); ctx.lineTo(W - 20 - cs, H - 20); ctx.stroke();

    // Crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(W/2, H/2, 18, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2 - 25, H/2); ctx.lineTo(W/2 - 10, H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2 + 10, H/2); ctx.lineTo(W/2 + 25, H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2, H/2 - 25); ctx.lineTo(W/2, H/2 - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2, H/2 + 10); ctx.lineTo(W/2, H/2 + 25); ctx.stroke();

    // AR Path dots (perspective projection)
    arDots.forEach((dot, i) => {
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.06 - i * 0.4);
      const size = 4 + (1 - dot.ny + 0.55) * 6;
      const sx = dot.nx * W;
      const sy = dot.ny * H;
      const gd = ctx.createRadialGradient(sx, sy, 0, sx, sy, size);
      gd.addColorStop(0, `rgba(0,255,136,${0.9 * pulse})`);
      gd.addColorStop(1, `rgba(0,255,136,0)`);
      ctx.fillStyle = gd;
      ctx.beginPath(); ctx.arc(sx, sy, size * 1.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(0,255,136,${pulse})`;
      ctx.beginPath(); ctx.arc(sx, sy, size * 0.4, 0, Math.PI*2); ctx.fill();
    });

    // Removed robot glow

    // Scan line
    const scanY = (H + 60) * ((t * 1.2 % (H + 80)) / (H + 80)) - 20;
    const sg = ctx.createLinearGradient(0, scanY-3, 0, scanY+3);
    sg.addColorStop(0,'rgba(0,229,200,0)'); sg.addColorStop(0.5,'rgba(0,229,200,0.12)'); sg.addColorStop(1,'rgba(0,229,200,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,scanY-3,W,6);

    // Artificial Horizon (Pitch/Roll)
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.sin(t * 0.02) * 0.05); // Simulated roll
    const pitchOffset = Math.sin(t * 0.015) * 10; // Simulated pitch
    ctx.strokeStyle = 'rgba(0,229,200,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 10]);
    // Pitch lines
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const py = pitchOffset + i * 30;
      const pw = 40 - Math.abs(i) * 10;
      ctx.beginPath(); ctx.moveTo(-pw, py); ctx.lineTo(-10, py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, py); ctx.lineTo(pw, py); ctx.stroke();
      ctx.fillStyle = 'rgba(0,229,200,0.6)';
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(Math.abs(i * 10), pw + 5, py + 3);
      ctx.fillText(Math.abs(i * 10), -pw - 15, py + 3);
    }
    // Horizon line
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-60, pitchOffset); ctx.lineTo(-20, pitchOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, pitchOffset); ctx.lineTo(60, pitchOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, pitchOffset); ctx.lineTo(0, pitchOffset + 10); ctx.stroke();
    ctx.restore();

    // Vignette
    const vig = ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,W*0.8);
    vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.7)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

    t++;
    scAnimFrame = requestAnimationFrame(drawSCCamera);
  }
  drawSCCamera();
}

function initSCMinimap() {
  const canvas = document.getElementById('scMinimapCanvas');
  if (!canvas) return;
  canvas.width = 175; canvas.height = 155;
  const ctx = canvas.getContext('2d');
  let rt = 0;
  const pathPts = [[0.5,0.65],[0.3,0.65],[0.3,0.35],[0.55,0.35],[0.55,0.2],[0.72,0.2],[0.72,0.6]];
  let pi=0,pt=0;
  function lerp(a,b,t){return a+(b-a)*t;}
  function draw() {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#050D1A'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(30,58,95,0.5)'; ctx.lineWidth=0.5;
    for(let x=0;x<W;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // Rooms
    [[0.05,0.05,0.42,0.38,'LR'],[0.52,0.05,0.42,0.38,'Kit'],
     [0.05,0.52,0.42,0.38,'Bed'],[0.52,0.52,0.3,0.38,'Std']].forEach(([x,y,w,h,l])=>{
      ctx.fillStyle='#0B1929'; ctx.strokeStyle='#1E3A5F'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(x*W,y*H,w*W,h*H,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#3a6080'; ctx.font='7px Inter'; ctx.textAlign='center';
      ctx.fillText(l,(x+w/2)*W,(y+h/2)*H+3);
    });
    // Dock
    ctx.fillStyle='rgba(123,47,255,0.3)'; ctx.strokeStyle='#7B2FFF'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(0.82*W,0.52*H,0.12*W,0.12*H,2); ctx.fill(); ctx.stroke();

    // Cleaned
    ctx.fillStyle='rgba(0,229,200,0.07)';
    ctx.beginPath(); ctx.roundRect(0.07*W,0.07*H,0.38*W,0.34*H,2); ctx.fill();

    // Path
    ctx.strokeStyle='rgba(0,229,200,0.2)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
    ctx.beginPath();
    pathPts.forEach(([x,y],i)=>{ if(i===0)ctx.moveTo(x*W,y*H);else ctx.lineTo(x*W,y*H);});
    ctx.stroke(); ctx.setLineDash([]);

    // Obstacles
    [[0.4,0.5],[0.65,0.18]].forEach(([ox,oy])=>{
      ctx.fillStyle='rgba(255,74,107,0.3)'; ctx.strokeStyle='#FF4A6B'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox*W,(oy-0.04)*H); ctx.lineTo((ox+0.03)*W,(oy+0.04)*H); ctx.lineTo((ox-0.03)*W,(oy+0.04)*H); ctx.closePath(); ctx.fill(); ctx.stroke();
    });

    // Robot animate
    pt += 0.006;
    if(pt>=1){pt=0;pi=(pi+1)%pathPts.length;}
    const ni=(pi+1)%pathPts.length;
    const rx=lerp(pathPts[pi][0],pathPts[ni][0],pt)*W;
    const ry=lerp(pathPts[pi][1],pathPts[ni][1],pt)*H;
    const rg2=ctx.createRadialGradient(rx,ry,0,rx,ry,10);
    rg2.addColorStop(0,'rgba(0,150,255,0.5)'); rg2.addColorStop(1,'rgba(0,150,255,0)');
    ctx.fillStyle=rg2; ctx.beginPath(); ctx.arc(rx,ry,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0096FF'; ctx.beginPath(); ctx.arc(rx,ry,4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(rx,ry,4,0,Math.PI*2); ctx.stroke();

    // Border
    ctx.strokeStyle='rgba(0,229,200,0.4)'; ctx.lineWidth=1;
    ctx.strokeRect(0,0,W,H);

    rt++;
    if(document.getElementById('page-super').classList.contains('active')) requestAnimationFrame(draw);
  }
  draw();
}

// ===== JOYSTICK CONTROLS =====
let activeJoystick = null;
function startJoystick(e, side) {
  e.preventDefault();
  activeJoystick = { side, startX: e.clientX, startY: e.clientY };
  document.addEventListener('mousemove', moveJoystick);
  document.addEventListener('mouseup', stopJoystick);
}
function startJoystickTouch(e, side) {
  e.preventDefault();
  const t = e.touches[0];
  activeJoystick = { side, startX: t.clientX, startY: t.clientY };
  document.addEventListener('touchmove', moveTouchJoystick, {passive:false});
  document.addEventListener('touchend', stopJoystick);
}
function moveJoystick(e) {
  if (!activeJoystick) return;
  const dx = Math.max(-30, Math.min(30, e.clientX - activeJoystick.startX));
  const dy = Math.max(-30, Math.min(30, e.clientY - activeJoystick.startY));
  setKnob(activeJoystick.side, dx, dy);
}
function moveTouchJoystick(e) {
  if (!activeJoystick) return;
  e.preventDefault();
  const t = e.touches[0];
  const dx = Math.max(-30, Math.min(30, t.clientX - activeJoystick.startX));
  const dy = Math.max(-30, Math.min(30, t.clientY - activeJoystick.startY));
  setKnob(activeJoystick.side, dx, dy);
}
function stopJoystick() {
  if (activeJoystick) {
    setKnob(activeJoystick.side, 0, 0);
    activeJoystick = null;
  }
  document.removeEventListener('mousemove', moveJoystick);
  document.removeEventListener('mouseup', stopJoystick);
  document.removeEventListener('touchmove', moveTouchJoystick);
  document.removeEventListener('touchend', stopJoystick);
}
function setKnob(side, dx, dy) {
  const knob = document.getElementById('knob' + (side === 'left' ? 'Left' : 'Right'));
  if (knob) { knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; }
}

// Step a speed slider with the −/+ buttons and update its % label
function stepSlider(id, dir) {
  const s = document.getElementById(id);
  if (dir > 0) s.stepUp(); else s.stepDown();
  s.dispatchEvent(new Event('input'));
}

// ===== FILTER CHIPS =====
function filterChip(el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

// ===== TOOLBAR TOGGLES =====
let micOn = true, spkOn = true, recOn = false;
function toggleMic() {
  micOn = !micOn;
  const btn = document.getElementById('micBtn');
  const led = document.getElementById('micLed');
  const stat = document.getElementById('micStat');
  if (micOn) { btn.classList.add('tb-active'); led.style.background='var(--green)'; led.style.boxShadow='0 0 6px var(--green)'; stat.textContent='ON'; }
  else { btn.classList.remove('tb-active'); led.style.background='#333'; led.style.boxShadow='none'; stat.textContent='OFF'; }
  showToast(`🎤 Mic: ${micOn ? 'ON' : 'OFF'}`);
}
function toggleSpk() {
  spkOn = !spkOn;
  const btn = document.getElementById('spkBtn');
  const led = document.getElementById('spkLed');
  const stat = document.getElementById('spkStat');
  if (spkOn) { btn.classList.add('tb-active'); led.style.background='var(--green)'; led.style.boxShadow='0 0 6px var(--green)'; stat.textContent='ON'; }
  else { btn.classList.remove('tb-active'); led.style.background='#333'; led.style.boxShadow='none'; stat.textContent='OFF'; }
  showToast(`🔊 Speaker: ${spkOn ? 'ON' : 'OFF'}`);
}
function toggleRec() {
  recOn = !recOn;
  document.getElementById('recIcon').textContent = recOn ? '⏹️' : '🔴';
  document.getElementById('recLabel').textContent = recOn ? 'STOP' : 'REC';
  showToast(recOn ? '🔴 Recording started...' : '⏹️ Recording stopped');
}
function updateGrip(v) {
  showToast(`🤖 Gripper: ${v}% ${v < 50 ? '(Open)' : '(Closing)'}`);
}

// ===== COMMANDS =====
function sendCmd(cmd) {
  showToast(`📡 Sending: ${cmd}...`);
}

// ===== RESIZE HANDLER =====
window.addEventListener('resize', () => {
  const camCanvas = document.getElementById('cameraCanvas');
  if (camCanvas) camCanvas.width = camCanvas.offsetWidth;
  const navCanvas = document.getElementById('navMapCanvas');
  if (navCanvas) navCanvas.width = navCanvas.offsetWidth;
});

// ===== LIVE TELEMETRY SIMULATION =====
let telemetry = {
  battery: 82, speed: 0.52, temp: 42,
  latency: 36, obstacleD: 1.2, waterTank: 65,
  signalStr: 4
};

function startTelemetry() {
  setInterval(() => {
    // Slowly drain battery
    if (Math.random() < 0.03) {
      telemetry.battery = Math.max(10, telemetry.battery - 1);
      updateTelemetryUI();
    }
    // Fluctuate speed
    telemetry.speed = Math.max(0, Math.min(1.2,
      telemetry.speed + (Math.random() - 0.5) * 0.04));
    // Fluctuate temp
    telemetry.temp = Math.max(35, Math.min(65,
      telemetry.temp + (Math.random() - 0.5) * 0.5));
    // Fluctuate latency
    telemetry.latency = Math.max(12, Math.min(120,
      telemetry.latency + (Math.random() - 0.5) * 4));
    // Fluctuate obstacle distance
    telemetry.obstacleD = Math.max(0.3, Math.min(3.0,
      telemetry.obstacleD + (Math.random() - 0.5) * 0.1));
    updateTelemetryUI();
  }, 1500);
}

function updateTelemetryUI() {
  const b = telemetry.battery;
  const bColor = b > 50 ? '#00E87A' : b > 20 ? '#FFD166' : '#FF4A6B';
  const speed = telemetry.speed.toFixed(2);
  const temp = Math.round(telemetry.temp);
  const lat = Math.round(telemetry.latency);
  const obs = telemetry.obstacleD.toFixed(1);

  // Dashboard stat cards
  const statCards = document.querySelectorAll('.stat-card');
  if (statCards[0]) {
    statCards[0].querySelector('.stat-value').innerHTML = `<span style="color:${bColor}">${b}<span class="stat-unit" style="font-size:13px">%</span></span>`;
    statCards[0].querySelector('.stat-bar-fill').style.cssText = `width:${b}%;background:${bColor}`;
    statCards[0].querySelector('.stat-sub').textContent = `${Math.round(b * 0.51)} min remaining`;
  }
  if (statCards[1]) {
    statCards[1].querySelector('.stat-value').innerHTML = `<span style="color:#00E5C8">${speed}<span class="stat-unit" style="font-size:11px">m/s</span></span>`;
    statCards[1].querySelector('.stat-bar-fill').style.width = `${speed * 80}%`;
  }
  if (statCards[2]) {
    const tColor = temp < 50 ? '#FFD166' : '#FF4A6B';
    statCards[2].querySelector('.stat-value').innerHTML = `<span style="color:${tColor}">${temp}<span class="stat-unit" style="font-size:11px">°C</span></span>`;
    statCards[2].querySelector('.stat-bar-fill').style.cssText = `width:${(temp-30)*2}%;background:${tColor}`;
  }

  // Super Cockpit stats
  const scBattFill = document.querySelector('.sc-batt-fill');
  if (scBattFill) scBattFill.style.width = `${b}%`;
  const scBattVal = document.querySelector('.sc-battery .sc-stat-val');
  if (scBattVal) { scBattVal.textContent = `${b}%`; scBattVal.style.color = bColor; }

  const scLatEl = document.querySelector('.sc-stat .sc-stat-val');
  if (scLatEl) scLatEl.textContent = `${lat}ms`;

  // SC status tiles
  const tiles = document.querySelectorAll('.sc-tile');
  if (tiles[0]) tiles[0].querySelector('.sc-tile-val').textContent = `${obs}m`;

  // SC info panel
  const scInfoVals = document.querySelectorAll('.sc-info-val');
  if (scInfoVals[0]) scInfoVals[0].innerHTML = `<span style="color:#00E5C8">${speed}<span style="font-size:9px;color:#5080A0"> m/s</span></span>`;
  if (scInfoVals[1]) scInfoVals[1].innerHTML = `<span style="color:${bColor}">${b}<span style="font-size:9px;color:#5080A0">%</span></span>`;
  if (scInfoVals[2]) scInfoVals[2].innerHTML = `<span style="color:${temp<50?'#FFD166':'#FF4A6B'}">${temp}<span style="font-size:9px;color:#5080A0">°C</span></span>`;

  // Battery warning
  if (b === 20) showToast('🔋 Battery low! 20% — please dock soon');
  if (b === 10) showToast('⚠️ CRITICAL battery! Return to dock NOW!');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('page-super').classList.contains('active')) {
      closeSuperCockpit();
    }
    closeModal();
  }
  if (e.key === 'Enter' && document.getElementById('page-login').classList.contains('active')) {
    doDemo();
  }
  if (e.key === 'e' || e.key === 'E') {
    if (document.getElementById('page-super').classList.contains('active')) {
      showToast('🛑 EMERGENCY STOP Activated!');
    }
  }
  if (e.key === 'm' || e.key === 'M') {
    if (document.getElementById('page-super').classList.contains('active')) {
      toggleMic();
    }
  }
});

// ===== MODAL SYSTEM =====
function openModal(html) {
  let overlay = document.getElementById('modalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
      z-index:9000;display:flex;align-items:center;justify-content:center;
      animation:fadeIn .2s ease;
    `;
    overlay.addEventListener('click', (e) => { if(e.target===overlay) closeModal(); });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="background:#0B1929;border:1px solid #1E3A5F;border-radius:16px;padding:28px 24px;max-width:340px;width:90%;position:relative;animation:slideUp .25s ease">
      <button onclick="closeModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#5080A0;font-size:18px;cursor:pointer">✕</button>
      ${html}
    </div>`;
  overlay.style.display = 'flex';
}
function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Override the info setting
function showConnectionInfo() {
  openModal(`
    <div style="margin-bottom:16px">
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px">Connection Details</div>
      <div style="font-size:11px;color:#5080A0;letter-spacing:1px">UNIT-01 · LIVE</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${[
        ['Robot IP','192.168.1.42','#00E5C8'],
        ['Protocol','WebSocket · wss://','#0096FF'],
        ['Latency',Math.round(telemetry.latency)+'ms','#00E87A'],
        ['Signal','4G · -67 dBm','#00E87A'],
        ['Data TX','2.4 Mbps','#7B2FFF'],
        ['Data RX','6.1 Mbps','#7B2FFF'],
        ['Session','01:24:37','#FFD166'],
        ['Firmware','v3.2.1-stable','#A0C0E0'],
      ].map(([k,v,c]) => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1E3A5F">
          <span style="font-size:11px;color:#5080A0">${k}</span>
          <span style="font-size:11px;font-weight:600;color:${c};font-family:monospace">${v}</span>
        </div>
      `).join('')}
    </div>
    <button onclick="closeModal()" style="width:100%;margin-top:16px;padding:10px;background:linear-gradient(135deg,#00E5C8,#0096FF);border:none;border-radius:8px;color:#050D1A;font-weight:700;cursor:pointer">Close</button>
  `);
}

// Override profile settings click
function showRobotSettings() {
  openModal(`
    <div style="margin-bottom:16px">
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px">Robot Configuration</div>
      <div style="font-size:11px;color:#5080A0">UNIT-01 Settings</div>
    </div>
    ${[
      ['Max Speed', '1.2 m/s'],['Cleaning Mode','Eco'],['Return on Low Battery','20%'],
      ['Schedule Auto-Start','Enabled'],['Face Recognition','Enabled'],['Night Mode','Disabled'],
    ].map(([k,v]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #1E3A5F">
        <span style="font-size:13px;color:#A0C0E0">${k}</span>
        <span style="font-size:12px;font-weight:600;color:#00E5C8;background:rgba(0,229,200,0.1);padding:2px 8px;border-radius:4px">${v}</span>
      </div>
    `).join('')}
    <button onclick="closeModal()" style="width:100%;margin-top:16px;padding:10px;background:linear-gradient(135deg,#00E5C8,#0096FF);border:none;border-radius:8px;color:#050D1A;font-weight:700;cursor:pointer">Close</button>
  `);
}

// Add CSS animations for modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
`;
document.head.appendChild(modalStyle);
