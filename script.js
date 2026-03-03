/* =========================
   Helpers
========================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

/* =========================
   Loading Screen
========================= */
window.addEventListener("load", () => {
  setTimeout(() => $("#loading").classList.add("hide"), 900);
});

/* =========================
   Mobile Nav
========================= */
const navToggle = $("#navToggle");
const mobileNav = $("#mobileNav");
if (navToggle) {
  navToggle.addEventListener("click", () => {
    mobileNav.style.display = (mobileNav.style.display === "block") ? "none" : "block";
  });
}
$$(".mobile-nav a").forEach(a => a.addEventListener("click", () => mobileNav.style.display = "none"));

/* =========================
   Scroll Progress Bar
========================= */
const scrollBar = $("#scrollBar");
function updateScrollBar(){
  const h = document.documentElement;
  const scrolled = h.scrollTop;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (scrolled / max) * 100 : 0;
  scrollBar.style.width = `${pct}%`;
}
window.addEventListener("scroll", updateScrollBar, {passive:true});
updateScrollBar();

/* =========================
   Cursor Glow
========================= */
const glow = $("#cursorGlow");
window.addEventListener("mousemove", (e) => {
  glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
}, {passive:true});

/* =========================
   Particle Canvas (commit nodes + lines)
========================= */
const canvas = $("#particles");
const ctx = canvas.getContext("2d");
let W=0, H=0, dpr=1;
let nodes = [];
const NODE_COUNT = 55;

function resizeCanvas(){
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function rand(a,b){ return a + Math.random()*(b-a); }

function initNodes(){
  nodes = Array.from({length:NODE_COUNT}, () => ({
    x: rand(0,W),
    y: rand(0,H),
    vx: rand(-0.25,0.25),
    vy: rand(-0.2,0.2),
    r: rand(1.2,2.8),
    kind: Math.random() < 0.15 ? "branch" : "commit"
  }));
}
function drawParticles(){
  ctx.clearRect(0,0,W,H);

  // faint wash
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(0,0,W,H);

  // lines
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const a = nodes[i], b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 140){
        const alpha = (1 - dist/140) * 0.18;
        ctx.strokeStyle = `rgba(120,255,190,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.stroke();
      }
    }
  }

  // nodes
  for(const n of nodes){
    const isBranch = n.kind === "branch";
    ctx.fillStyle = isBranch ? "rgba(255,186,90,0.9)" : "rgba(120,255,190,0.85)";
    ctx.beginPath();
    ctx.arc(n.x,n.y, isBranch ? n.r+0.8 : n.r, 0, Math.PI*2);
    ctx.fill();

    // glow
    ctx.fillStyle = isBranch ? "rgba(255,186,90,0.12)" : "rgba(120,255,190,0.12)";
    ctx.beginPath();
    ctx.arc(n.x,n.y, (isBranch ? n.r : n.r)*5.5, 0, Math.PI*2);
    ctx.fill();

    n.x += n.vx; n.y += n.vy;
    if(n.x < -20) n.x = W + 20;
    if(n.x > W + 20) n.x = -20;
    if(n.y < -20) n.y = H + 20;
    if(n.y > H + 20) n.y = -20;
  }

  requestAnimationFrame(drawParticles);
}
resizeCanvas(); initNodes(); drawParticles();
window.addEventListener("resize", () => { resizeCanvas(); initNodes(); });

/* =========================
   Hero Terminal Typewriter
========================= */
const heroTerminal = $("#heroTerminal");
const heroLines = [
  "$ git init",
  "$ git add .",
  '$ git commit -m "feat: start version control"',
  "$ git branch -M main",
  "$ git remote add origin https://github.com/you/repo.git",
  "$ git push -u origin main",
];
let hl = 0, hc = 0;
let heroRendered = [];

function typeHero(){
  const line = heroLines[hl] || "";
  if(!heroRendered[hl]) heroRendered[hl] = "";

  if(hc < line.length){
    heroRendered[hl] = line.slice(0, hc+1);
    hc++;
  } else {
    // next line
    if(hl < heroLines.length - 1){
      hl++; hc = 0;
      heroRendered.push("");
    } else {
      // loop
      setTimeout(() => {
        hl = 0; hc = 0; heroRendered = [""];
      }, 1000);
    }
  }

  heroTerminal.textContent = heroRendered.join("\n") + "\n" + " ".repeat(0);
  setTimeout(typeHero, 18);
}
typeHero();

/* =========================
   Stat Counters (on view)
========================= */
const counters = $$("[data-counter]");
const obs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      animateCounter(entry.target);
      obs.unobserve(entry.target);
    }
  });
}, {threshold:0.25});

counters.forEach(el => obs.observe(el));

function animateCounter(el){
  const target = Number(el.getAttribute("data-counter") || "0");
  const suffix = el.getAttribute("data-suffix") || "";
  const start = performance.now();
  const dur = 900;

  function tick(now){
    const t = clamp((now - start)/dur, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(eased * target);
    el.textContent = `${val}${suffix}`;
    if(t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* =========================
   Git Operations Tabs
========================= */
const opData = {
  init: {
    title: "Initialize a repository",
    desc: "Diagram: A folder becomes a Git repo with a hidden .git directory storing history and metadata.",
    code: `git init
git status`
  },
  commit: {
    title: "Stage and commit changes",
    desc: "Diagram: Working Directory → Staging Area → Commit (snapshot).",
    code: `git add .
git commit -m "feat: add homepage layout"`
  },
  pushpull: {
    title: "Sync with GitHub (remote)",
    desc: "Diagram: Local repo pushes commits to origin; pulls bring remote commits back locally.",
    code: `git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main

# later
git pull`
  },
  branch: {
    title: "Create and switch branches",
    desc: "Diagram: main stays stable while feature branch diverges with new commits.",
    code: `git checkout -b feature/login
git branch
git switch main`
  },
  merge: {
    title: "Merge a feature branch",
    desc: "Diagram: feature branch commits combine back into main (fast-forward or merge commit).",
    code: `git switch main
git merge feature/login`
  }
};

let activeTab = "init";
const tabs = $$(".tab");
const opTitle = $("#opTitle");
const opDesc = $("#opDesc");
const opCode = $("#opCode");
const copyBtn = $("#copyBtn");
const tryBtn = $("#tryBtn");

function renderOps(){
  opTitle.textContent = opData[activeTab].title;
  opDesc.textContent = opData[activeTab].desc;
  opCode.textContent = opData[activeTab].code;
}
renderOps();

tabs.forEach(t => {
  t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    activeTab = t.getAttribute("data-tab");
    renderOps();
  });
});

copyBtn.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(opData[activeTab].code);
    copyBtn.textContent = "Copied";
    setTimeout(() => copyBtn.textContent = "Copy", 800);
  }catch{
    copyBtn.textContent = "Copy failed";
    setTimeout(() => copyBtn.textContent = "Copy", 900);
  }
});

/* Try-it Modal */
const modal = $("#modal");
const modalCmd = $("#modalCmd");
const modalClose = $("#modalClose");

function openModal(cmd){
  modalCmd.textContent = cmd;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}
tryBtn.addEventListener("click", () => {
  const firstLine = opData[activeTab].code.split("\n")[0].trim();
  openModal(firstLine);
});
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if(e.target === modal) closeModal(); });

/* =========================
   Workflow Visualizer (SVG)
========================= */
const wfSvg = $("#wfSvg");
const wfStep = $("#wfStep");
const wfLabel = $("#wfLabel");
const wfTip = $("#wfTip");
const wfHover = $("#wfHover");
const wfPlay = $("#wfPlay");
const wfNext = $("#wfNext");

const wfSteps = [
  {
    label: "Start on main",
    tip: "main has initial commits.",
    main: [1,2],
    feature: [],
    merged: false
  },
  {
    label: "Create feature branch",
    tip: "feature/login branches off main.",
    main: [1,2],
    feature: [2],
    merged: false
  },
  {
    label: "Commit on feature",
    tip: "new commits appear on feature branch.",
    main: [1,2],
    feature: [2,3,4],
    merged: false
  },
  {
    label: "Merge back to main",
    tip: "feature commits become part of main.",
    main: [1,2,3,4],
    feature: [2,3,4],
    merged: true
  },
];

let wfIndex = 0;
let wfPlaying = false;
let wfTimer = null;

function commitX(n){ return 140 + (n-1)*90; }
const mainY = 130;
const featureY = 70;

function renderWorkflow(){
  const s = wfSteps[wfIndex];
  wfStep.textContent = String(wfIndex+1);
  wfLabel.textContent = s.label;
  wfTip.textContent = s.tip;

  wfSvg.innerHTML = `
    <path d="M110 ${mainY} H590" stroke="oklch(var(--blue))" stroke-width="3" opacity="0.9"></path>
    <path d="M${commitX(2)} ${mainY} C ${commitX(2)+30} ${mainY}, ${commitX(2)+30} ${featureY}, ${commitX(2)+70} ${featureY} H560"
          stroke="oklch(var(--orange))" stroke-width="3" opacity="0.9"></path>
    ${s.merged ? `
      <path d="M560 ${featureY} C 590 ${featureY}, 590 ${mainY}, 560 ${mainY}"
            stroke="oklch(var(--orange))" stroke-width="3" opacity="0.65"></path>` : ""}

    <text x="110" y="160" fill="oklch(var(--muted))" font-size="12" font-family="JetBrains Mono">main</text>
    <text x="430" y="55" fill="oklch(var(--muted))" font-size="12" font-family="JetBrains Mono">feature/login</text>
  `;

  // main commits
  s.main.forEach(n => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = `
      <circle cx="${commitX(n)}" cy="${mainY}" r="9" fill="oklch(var(--blue))"></circle>
      <circle cx="${commitX(n)}" cy="${mainY}" r="22" fill="oklch(var(--blue) / 0.12)"></circle>
    `;
    g.addEventListener("mouseenter", () => wfHover.textContent = `hover: main commit ${n}`);
    g.addEventListener("mouseleave", () => wfHover.textContent = "hover a commit");
    wfSvg.appendChild(g);
  });

  // feature commits
  s.feature.forEach(n => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = `
      <circle cx="${commitX(n)+40}" cy="${featureY}" r="9" fill="oklch(var(--orange))"></circle>
      <circle cx="${commitX(n)+40}" cy="${featureY}" r="22" fill="oklch(var(--orange) / 0.12)"></circle>
    `;
    g.addEventListener("mouseenter", () => wfHover.textContent = `hover: feature commit ${n}`);
    g.addEventListener("mouseleave", () => wfHover.textContent = "hover a commit");
    wfSvg.appendChild(g);
  });
}
renderWorkflow();

wfNext.addEventListener("click", () => {
  wfIndex = (wfIndex + 1) % wfSteps.length;
  renderWorkflow();
});

wfPlay.addEventListener("click", () => {
  wfPlaying = !wfPlaying;
  wfPlay.textContent = wfPlaying ? "Pause" : "Play";
  if(wfPlaying){
    wfTimer = setInterval(() => {
      wfIndex = (wfIndex + 1) % wfSteps.length;
      renderWorkflow();
    }, 1600);
  } else {
    clearInterval(wfTimer);
  }
});

/* =========================
   Setup Guide Timeline
========================= */
const setupSteps = [
  { title: "Install Git", desc: "Download and install Git for your OS.", code: "" },
  { title: "Configure your identity", desc: "Set your name and email for commits.",
    code: `git config --global user.name "Your Name"
git config --global user.email "you@example.com"` },
  { title: "Create a GitHub repo", desc: "On GitHub, create a new repository (skip README if you already have a project).", code: "" },
  { title: "Connect remote origin", desc: "Link your local repo to GitHub.",
    code: `git remote add origin https://github.com/<you>/<repo>.git` },
  { title: "Push to GitHub", desc: "Upload your commit history to the remote.",
    code: `git branch -M main
git push -u origin main` },
  { title: "Open a Pull Request", desc: "Create a feature branch, push it, and open a PR for review.",
    code: `git checkout -b feature/ui
git push -u origin feature/ui` },
];

const setupList = $("#setupList");
const setupProgress = $("#setupProgress");
const setupNum = $("#setupNum");
const setupTitle = $("#setupTitle");
const setupDesc = $("#setupDesc");
const setupCodeWrap = $("#setupCodeWrap");
const setupCode = $("#setupCode");
const setupPrev = $("#setupPrev");
const setupNext = $("#setupNext");

let setupIndex = 0;

function renderSetupList(){
  setupList.innerHTML = "";
  setupSteps.forEach((s,i) => {
    const btn = document.createElement("button");
    btn.className = "setup-item";
    btn.setAttribute("data-ocid", `setup-step-${i+1}`);
    btn.textContent = String(i+1).padStart(2,"0") + " — " + s.title;
    btn.addEventListener("click", () => { setupIndex=i; renderSetup(); });
    setupList.appendChild(btn);
  });
}
function renderSetup(){
  $$(".setup-item").forEach((el,i) => el.classList.toggle("active", i===setupIndex));
  setupNum.textContent = String(setupIndex+1);
  setupTitle.textContent = setupSteps[setupIndex].title;
  setupDesc.textContent = setupSteps[setupIndex].desc;

  const pct = ((setupIndex+1) / setupSteps.length) * 100;
  setupProgress.style.width = pct + "%";

  const c = setupSteps[setupIndex].code;
  if(c){
    setupCodeWrap.style.display = "block";
    setupCode.textContent = c;
    setupCode.setAttribute("data-ocid", `setup-code-${setupIndex+1}`);
  } else {
    setupCodeWrap.style.display = "none";
    setupCode.textContent = "";
  }
}
renderSetupList();
renderSetup();

setupPrev.addEventListener("click", () => { setupIndex = Math.max(0, setupIndex-1); renderSetup(); });
setupNext.addEventListener("click", () => { setupIndex = Math.min(setupSteps.length-1, setupIndex+1); renderSetup(); });

/* =========================
   Cheatsheet Search/Filter
========================= */
const cheatItems = [
  { cat:"Setup", cmd:"git config --global user.name", desc:"Set username", details:"Use same identity across machines." },
  { cat:"Setup", cmd:"git config --global user.email", desc:"Set email", details:"Match GitHub email for attribution." },

  { cat:"Basic", cmd:"git status", desc:"Show changes", details:"Working tree + staging state." },
  { cat:"Basic", cmd:"git add .", desc:"Stage all changes", details:"Stages files for next commit." },
  { cat:"Basic", cmd:'git commit -m "msg"', desc:"Create a commit", details:"Keep messages meaningful." },

  { cat:"Branching", cmd:"git branch", desc:"List branches", details:"Add -a to see remotes." },
  { cat:"Branching", cmd:"git checkout -b feature/x", desc:"Create + switch branch", details:"Creates and checks out branch." },

  { cat:"Remote", cmd:"git remote -v", desc:"Show remotes", details:"View origin URLs." },
  { cat:"Remote", cmd:"git push -u origin main", desc:"Push + set upstream", details:"After this, git push is enough." },
  { cat:"Remote", cmd:"git pull", desc:"Fetch and merge", details:"Try pull --rebase for cleaner history." },

  { cat:"Undo", cmd:"git restore <file>", desc:"Discard local changes", details:"Restore from last commit/stage." },
  { cat:"Undo", cmd:"git reset --soft HEAD~1", desc:"Undo last commit keep changes", details:"Keeps changes staged." },
];

const cheatSearch = $("#cheatSearch");
const cheatFilters = $("#cheatFilters");
const cheatGrid = $("#cheatGrid");

const categories = ["All","Setup","Basic","Branching","Remote","Undo"];
let activeCat = "All";

function renderFilters(){
  cheatFilters.innerHTML = "";
  categories.forEach(c => {
    const b = document.createElement("button");
    b.className = "filter";
    b.textContent = c;
    b.setAttribute("data-ocid", `cheatsheet-filter-${c.toLowerCase()}`);
    b.addEventListener("click", () => {
      activeCat = c;
      $$(".filter").forEach(x => x.classList.toggle("active", x.textContent===activeCat));
      renderCheats();
    });
    cheatFilters.appendChild(b);
  });
  // default active
  cheatFilters.querySelectorAll(".filter")[0].classList.add("active");
}

function renderCheats(){
  const q = (cheatSearch.value || "").toLowerCase();
  const filtered = cheatItems.filter(it => {
    const matchCat = (activeCat==="All") || (it.cat===activeCat);
    const s = (it.cmd+" "+it.desc+" "+it.details).toLowerCase();
    const matchQ = s.includes(q);
    return matchCat && matchQ;
  });

  cheatGrid.innerHTML = "";
  filtered.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "cheat-card";
    card.setAttribute("data-ocid", `cheatsheet-card-${idx}`);
    card.innerHTML = `
      <p class="mono tiny accent-blue">${it.cat}</p>
      <div class="mono accent-green" style="margin-top:8px">${it.cmd}</div>
      <p class="muted small" style="margin-top:8px">${it.desc}</p>
      <div class="cheat-details muted tiny">${it.details}</div>
    `;
    cheatGrid.appendChild(card);
  });
}

renderFilters();
renderCheats();
cheatSearch.addEventListener("input", renderCheats);

/* =========================
   Mini Terminal (history, tab hints)
========================= */
const miniOut = $("#miniOut");
const miniInput = $("#miniInput");
const miniHint = $("#miniHint");

const history = [];
let histIndex = -1;

const responses = {
  help:
`Available commands:
  help
  clear
  git status
  git init
  git add .
  git commit -m "message"
  git log
  git branch
  git checkout -b feature/x
  git merge feature/x
  git push
  git pull`,
  "git status":
`On branch main
nothing to commit, working tree clean`,
  "git init":
`Initialized empty Git repository in ./demo/.git/`,
  "git add .":
`(staged) Added files to the index.`,
  "git log":
`commit a1c9f2d (HEAD -> main)
Author: you <you@example.com>
Date:   today

    feat: start version control`,
  "git branch":
`* main
  feature/login`,
  "git push":
`Counting objects: 8, done.
Writing objects: 100% (8/8), done.
To github.com:you/repo.git
 * [new branch] main -> main`,
  "git pull":
`Already up to date.`
};

function printLine(text, type="normal"){
  const div = document.createElement("div");
  div.className = "line";
  if(type==="cmd") div.innerHTML = `<span class="accent-green">$</span> ${escapeHtml(text)}`;
  else div.textContent = text;
  miniOut.appendChild(div);
  miniOut.scrollTop = miniOut.scrollHeight;
}

function escapeHtml(s){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function runCommand(raw){
  const cmd = raw.trim();
  if(!cmd) return;

  history.push(cmd);
  histIndex = history.length;

  printLine(cmd, "cmd");

  if(cmd === "clear"){
    miniOut.innerHTML = "";
    return;
  }

  // commit message generic parsing
  if(cmd.startsWith('git commit -m ')){
    printLine(`✔ created commit: ${cmd.slice(14).replaceAll('"','')}`);
    return;
  }

  // branch create parsing
  if(cmd.startsWith("git checkout -b ")){
    const name = cmd.replace("git checkout -b ","").trim();
    printLine(`Switched to a new branch '${name}'`);
    return;
  }

  // merge parsing
  if(cmd.startsWith("git merge ")){
    const name = cmd.replace("git merge ","").trim();
    printLine(`Merge made by the 'ort' strategy.\nMerged branch '${name}'.`);
    return;
  }

  if(responses[cmd]){
    printLine(responses[cmd]);
  } else if(cmd.startsWith("git ")){
    printLine(`git: '${cmd.slice(4)}' is not implemented in this demo.\nTry: help`);
  } else {
    printLine(`command not found: ${cmd}\nTry: help`);
  }
}

const hints = [
  "git status",
  "git init",
  "git add .",
  'git commit -m "feat: message"',
  "git log",
  "git branch",
  "git push",
  "git pull",
  "help",
  "clear"
];

miniInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    runCommand(miniInput.value);
    miniInput.value = "";
    miniHint.innerHTML = `Tip: press <span class="accent-blue">Tab</span> for hints • use ↑ ↓ for history`;
  }

  // history up/down
  if(e.key === "ArrowUp"){
    e.preventDefault();
    if(history.length === 0) return;
    histIndex = Math.max(0, histIndex - 1);
    miniInput.value = history[histIndex] || "";
  }
  if(e.key === "ArrowDown"){
    e.preventDefault();
    if(history.length === 0) return;
    histIndex = Math.min(history.length, histIndex + 1);
    miniInput.value = history[histIndex] || "";
  }

  // tab completion hints (simple)
  if(e.key === "Tab"){
    e.preventDefault();
    const cur = miniInput.value.trim().toLowerCase();
    const match = hints.find(h => h.toLowerCase().startsWith(cur));
    if(match){
      miniInput.value = match;
      miniHint.innerHTML = `Hint: <span class="accent-blue">${escapeHtml(match)}</span>`;
    } else {
      miniHint.textContent = "No hint found. Try: help";
    }
  }
});

// autofocus when section clicked
$("#terminal").addEventListener("click", () => miniInput.focus());

/* =========================
   Smooth anchor behavior
========================= */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if(!id || id === "#") return;
    const el = document.querySelector(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({behavior:"smooth", block:"start"});
    }
  });
});