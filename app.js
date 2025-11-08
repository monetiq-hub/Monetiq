const USERS_KEY = "monetiq_users";
const SESSION_KEY = "monetiq_session";

function $(id) { return document.getElementById(id); }
function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; } }
function setUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
function setSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function setText(id, text) { const el = $(id); if (el) el.textContent = text; }

function ensureModalMount() {
  let bg = $("modal-bg");
  let box = $("modal-content");
  if (!bg) {
    bg = document.createElement("div");
    bg.id = "modal-bg";
    bg.className = "modal-bg";
    bg.setAttribute("aria-hidden", "true");
    document.body.appendChild(bg);
  }
  if (!box) {
    box = document.createElement("div");
    box.id = "modal-content";
    box.className = "modal-content";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "modal-title");
    bg.appendChild(box);
  }
  return { bg, box };
}

function showModal(html) {
  const { bg, box } = ensureModalMount();
  box.innerHTML = `<button class="modal-close-x" aria-label="Close" id="modal-x">×</button>${html}`;
  bg.classList.add("active");
  bg.style.display = "flex";
  bg.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const x = $("modal-x");
  if (x) x.onclick = closeModal;
  const focusable = box.querySelector("button, [href], input, select, textarea");
  if (focusable && focusable.focus) focusable.focus();
}

function closeModal() {
  const bg = $("modal-bg");
  const box = $("modal-content");
  if (bg) { bg.classList.remove("active"); bg.style.display = "none"; bg.setAttribute("aria-hidden", "true"); }
  if (box) box.innerHTML = "";
  document.body.style.overflow = "";
}

function wireModalCloseEvents() {
  const bg = $("modal-bg");
  if (!bg || bg.dataset.wired === "1") return;
  bg.dataset.wired = "1";
  bg.addEventListener("click", (e) => { if (e.target === bg) closeModal(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

function onReady(fn) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
  else fn();
}

function initSignup() {
  const form = $("signupForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = $("signup-username")?.value.trim() || "";
    const password = $("signup-password")?.value || "";
    const errorDiv = $("signup-error");
    let users = getUsers();
    if (!username || !password) { if (errorDiv) errorDiv.textContent = "Enter username and password."; return; }
    if (users.find((u) => u.username === username)) { if (errorDiv) errorDiv.textContent = "Username exists."; return; }
    const newUser = {
      username, password, currentBalance: 0, savingsBalance: 0, savingsGoal: 0,
      xp: 0, level: 1, weeklyLimit: 0, weeklySpending: 0, lastWeekStart: null,
      badges: { saver: 1, leveler: 1, goalCrusher: 1, megaSaver: 1 },
      transactions: [], goalsAchieved: 0, totalSaved: 0
    };
    users.push(newUser);
    setUsers(users);
    setSession({ username });
    window.location.href = "index.html";
  });
}

function initLogin() {
  const form = $("loginForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = $("login-username")?.value.trim() || "";
    const password = $("login-password")?.value || "";
    const errorDiv = $("login-error");
    const users = getUsers();
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) { if (errorDiv) errorDiv.textContent = "Invalid credentials."; return; }
    setSession({ username });
    window.location.href = "index.html";
  });
}

function initDashboard() {
  const session = getSession();
  const dashboardPresent = $("add-income-btn") || $("transfer-to-savings-btn") || $("logout-btn");
  if (!dashboardPresent) return;
  if (!session) { window.location.href = "login.html"; return; }

  let users = getUsers();
  let user = users.find((u) => u.username === session.username);
  if (!user) {
    user = {
      username: session.username, password: "", currentBalance: 0, savingsBalance: 0, savingsGoal: 0,
      xp: 0, level: 1, weeklyLimit: 0, weeklySpending: 0, lastWeekStart: null,
      badges: { saver: 1, leveler: 1, goalCrusher: 1, megaSaver: 1 },
      transactions: [], goalsAchieved: 0, totalSaved: 0
    };
    users.push(user);
    setUsers(users);
  }

  const LEVELS = [
    0, 10, 35, 80, 150, 250, 385, 560, 780, 1050, 1375, 1760, 2210, 2730, 3330,
    4000, 4750, 5600, 6550, 7600, 8750, 10000, 11385, 12880, 14500, 16250,
    18150, 20200, 22410, 24780, 27310, 30000
  ];

  const TITLES = [
    { min: 0, max: 4, name: "Rookie Saver" },
    { min: 5, max: 7, name: "Budget Apprentice" },
    { min: 8, max: 10, name: "Smart Spender" },
    { min: 11, max: 13, name: "Goal Setter" },
    { min: 14, max: 16, name: "Finance Pro" },
    { min: 17, max: 19, name: "Saving Strategist" },
    { min: 20, max: 22, name: "Money Master" },
    { min: 23, max: 25, name: "Wealth Wizard" },
    { min: 26, max: 28, name: "Cash Commander" },
    { min: 29, max: Infinity, name: "Monetiq Master 👑" }
  ];

  const BADGE_CONFIG = [
    { key: "saver", label: " Piggy Bank Pro", icon: "🐷", thresholds: [100, 500, 1000, 2500, 5000, 10000] },
    { key: "leveler", label: " XP Climber", icon: "⛰️", thresholds: [2, 4, 7, 10, 15, 20] },
    { key: "goalCrusher", label: " Goal Crusher", icon: "🏆", thresholds: [1, 3, 5, 10, 20, 50] },
    { key: "megaSaver", label: " Mega Saver", icon: "💰", thresholds: [1000, 5000, 10000, 20000, 50000, 100000] }
  ];

  function saveUser() {
    const list = getUsers();
    const idx = list.findIndex((u) => u.username === user.username);
    if (idx >= 0) { list[idx] = user; setUsers(list); }
  }

  function getLevel(xp) {
    if (typeof xp !== "number" || xp < 0) return 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) { if (xp >= LEVELS[i]) return i + 1; }
    return 1;
  }

  function getTitle(level) {
    for (const t of TITLES) { if (level >= t.min && level <= t.max) return t.name; }
    return TITLES[TITLES.length - 1].name;
  }

  function getBadgeLevel(badgeKey, value) {
    const badge = BADGE_CONFIG.find((b) => b.key === badgeKey);
    if (!badge) return 1;
    let lvl = 1;
    for (let i = 0; i < badge.thresholds.length; i++) { if (value >= badge.thresholds[i]) lvl = i + 2; }
    return lvl;
  }

  function addBadgeXP(badgeKey, value) {
    user.badges[badgeKey] = getBadgeLevel(badgeKey, value);
    saveUser();
    renderStats();
  }

  function addXP(amount) {
    const prevLevel = user.level;
    user.xp = Math.max(0, (user.xp || 0) + amount);
    const newLevel = getLevel(user.xp);
    const leveledUp = newLevel > prevLevel;
    user.level = newLevel;
    if (leveledUp) {
      user.badges.leveler = Math.max(user.badges.leveler || 1, getBadgeLevel("leveler", user.level));
      showModal(
        `<h2 id="modal-title">Level Up!</h2>
         <p>Congrats! You reached level ${newLevel}!</p>
         <div class="modal-actions"><button class="btn btn-secondary" id="level-ok">Close</button></div>`
      );
      const ok = $("level-ok");
      if (ok) ok.onclick = closeModal;
    }
    saveUser();
    renderStats();
    return { leveledUp, newLevel };
  }

  function getStartOfWeek(d = new Date()) {
    const nd = new Date(d);
    const day = nd.getDay();
    nd.setHours(0, 0, 0, 0);
    nd.setDate(nd.getDate() - day);
    return nd;
  }

  function ensureWeekWindow() {
    const nowStart = getStartOfWeek(new Date());
    const stored = user.lastWeekStart ? new Date(user.lastWeekStart) : null;
    if (!stored || stored < nowStart || stored.toDateString() !== nowStart.toDateString()) {
      user.lastWeekStart = nowStart.toDateString();
      user.weeklySpending = 0;
      saveUser();
    }
  }

  function renderBalances() {
    setText("current-balance", `AED ${Number(user.currentBalance).toFixed(2)}`);
    setText("savings-balance", `AED ${Number(user.savingsBalance).toFixed(2)}`);
    let percent = 0;
    if (user.savingsGoal > 0) {
      percent = Math.round((user.savingsBalance / user.savingsGoal) * 100);
      if (!isFinite(percent) || percent < 0) percent = 0;
      if (percent > 100) percent = 100;
    }
    setText("savings-goal-label", `${percent}% Achieved`);
    const bar = $("savings-progress-bar");
    if (bar) bar.style.width = percent + "%";
    setText("savings-goal-progress-label", `${Number(user.savingsBalance).toFixed(2)} / ${Number(user.savingsGoal).toFixed(2)} AED`);
  }

  function renderWeeklyChallenge() {
    ensureWeekWindow();
    setText("weekly-limit-label", user.weeklyLimit > 0 ? `AED ${Number(user.weeklyLimit).toFixed(2)}` : "Not Set");
    setText("weekly-spending-label", `AED ${Number(user.weeklySpending).toFixed(2)}`);
    if ($("weekly-savings-goal-label")) setText("weekly-savings-goal-label", user.weeklyLimit > 0 ? `AED ${Number(user.weeklyLimit).toFixed(2)}` : "Not Set");
    if ($("weekly-savings-label")) setText("weekly-savings-label", `AED ${Number(user.weeklySpending).toFixed(2)}`);
  }

  function renderStats() {
    user.level = getLevel(user.xp || 0);
    setText("user-level", user.level);
    const title = getTitle(user.level);
    setText("user-title", title);
    const dup = $("user-title-dup");
    if (dup) dup.textContent = title;
    const nextXP = LEVELS[user.level] || LEVELS[LEVELS.length - 1] + 1000;
    const prevXP = LEVELS[user.level - 1] || 0;
    const progress = Math.min(100, Math.max(0, Math.round(((user.xp - prevXP) / (nextXP - prevXP)) * 100)));
    const lvlBar = $("level-progress-bar");
    if (lvlBar) lvlBar.style.width = progress + "%";
    setText("xp-label", `${user.xp} / ${nextXP} XP`);
    const badgesUl = $("badges-list");
    if (badgesUl) {
      badgesUl.innerHTML = [
        { key: "saver", label: " Piggy Bank Pro", icon: "🐷" },
        { key: "leveler", label: " XP Climber", icon: "⛰️" },
        { key: "goalCrusher", label: " Goal Crusher", icon: "🏆" },
        { key: "megaSaver", label: " Mega Saver", icon: "💰" }
      ].map(b => `<span class="badge">${b.icon} ${b.label} <span class="badge-level">Lv.${user.badges[b.key] || 1}</span></span>`).join("");
    }
    renderWeeklyChallenge();
  }

  const logoutBtn = $("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => { clearSession(); window.location.href = "login.html"; });

  const addIncomeBtn = $("add-income-btn");
  if (addIncomeBtn) {
    addIncomeBtn.onclick = function () {
      showModal(
        `<h2 id="modal-title">Add Income</h2>
         <form id="income-form">
           <input type="number" step="0.01" min="0.01" placeholder="Amount (AED)" required />
           <div class="modal-actions">
             <button type="button" class="btn btn-outline" id="income-cancel">Cancel</button>
             <button type="submit" class="btn btn-secondary">Add</button>
           </div>
         </form>
         <div id="income-error" style="color: var(--danger); margin-top: .5em;"></div>`
      );
      const form = $("income-form");
      const cancel = $("income-cancel");
      if (cancel) cancel.onclick = closeModal;
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          const amt = parseFloat(this.querySelector("input")?.value);
          const err = $("income-error");
          if (!isFinite(amt) || amt <= 0) { if (err) err.textContent = "Enter a valid amount."; return; }
          user.currentBalance += amt;
          user.transactions.push({ type: "income", amount: amt, date: new Date().toISOString() });
          saveUser();
          renderBalances();
          closeModal();
          addXP(Math.floor(amt / 4));
        };
      }
    };
  }

  const addExpenseBtn = $("add-expense-btn");
  if (addExpenseBtn) {
    addExpenseBtn.onclick = function () {
      showModal(
        `<h2 id="modal-title">Add Expense</h2>
         <form id="expense-form">
           <input type="number" step="0.01" min="0.01" placeholder="Amount (AED)" required />
           <div class="modal-actions">
             <button type="button" class="btn btn-outline" id="expense-cancel">Cancel</button>
             <button type="submit" class="btn btn-danger">Add</button>
           </div>
         </form>
         <div id="expense-error" style="color: var(--danger); margin-top: .5em;"></div>`
      );
      const form = $("expense-form");
      const cancel = $("expense-cancel");
      if (cancel) cancel.onclick = closeModal;
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          const amt = parseFloat(this.querySelector("input")?.value);
          const err = $("expense-error");
          if (!isFinite(amt) || amt <= 0) { if (err) err.textContent = "Enter a valid amount."; return; }
          if (amt > user.currentBalance) { if (err) err.textContent = "Not enough balance to cover this expense!"; return; }
          ensureWeekWindow();
          user.currentBalance -= amt;
          user.transactions.push({ type: "expense", amount: amt, date: new Date().toISOString() });
          user.weeklySpending += amt;
          saveUser();
          renderBalances();
          renderStats();
          closeModal();

          if (user.weeklyLimit > 0 && user.weeklySpending > user.weeklyLimit) {
            addXP(-100);
            user.weeklySpending = 0;
            user.lastWeekStart = getStartOfWeek(new Date()).toDateString();
            saveUser();
            showModal(
              `<h2 id="modal-title">Weekly Limit Exceeded</h2>
               <p>You went over your weekly limit. 100 XP deducted and challenge reset.</p>
               <div class="modal-actions"><button class="btn btn-secondary" id="limit-ok">Close</button></div>`
            );
            const ok = $("limit-ok");
            if (ok) ok.onclick = closeModal;
          } else if (user.weeklyLimit > 0 && user.weeklySpending <= user.weeklyLimit) {
            addXP(10);
          }

          if (amt > 200) {
            addXP(-10);
            showModal(
              `<h2 id="modal-title">Expense Added</h2>
               <p>That was a big spend.</p>
               <div class="modal-actions"><button class="btn btn-secondary" id="big-ok">Close</button></div>`
            );
            const ok = $("big-ok");
            if (ok) ok.onclick = closeModal;
          } else {
            addXP(5);
          }
        };
      }
    };
  }

  const setGoalBtn = $("set-saving-goal-btn");
  if (setGoalBtn) {
    setGoalBtn.onclick = function () {
      showModal(
        `<h2 id="modal-title">Set Savings Goal</h2>
         <form id="goal-form">
           <input type="number" step="0.01" min="100" max="1000000" placeholder="Goal Amount (AED)" required />
           <div class="modal-actions">
             <button type="button" class="btn btn-outline" id="goal-cancel">Cancel</button>
             <button type="submit" class="btn btn-secondary">Set Goal</button>
           </div>
         </form>
         <div id="goal-error" style="color: var(--danger); margin-top: .5em;"></div>`
      );
      const form = $("goal-form");
      const cancel = $("goal-cancel");
      if (cancel) cancel.onclick = closeModal;
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          const amt = parseFloat(this.querySelector("input")?.value);
          const err = $("goal-error");
          if (!isFinite(amt) || amt <= 0) { if (err) err.textContent = "Enter a valid amount."; return; }
          if (amt < 100) { if (err) err.textContent = "Goal must be at least AED 100."; return; }
          if (amt > 1000000) { if (err) err.textContent = "Goal is unrealistically high."; return; }
          if (amt < user.savingsBalance) { if (err) err.textContent = "Goal is already achieved."; return; }
          user.savingsGoal = amt;
          saveUser();
          renderBalances();
          closeModal();
        };
      }
    };
  }

  const historyBtn = $("transaction-history-btn");
  if (historyBtn) {
    historyBtn.onclick = function () {
      let html = `<h2 id="modal-title">Transaction History</h2><ul style="max-height:250px;overflow:auto;padding-left:0;list-style:none">`;
      if (!user.transactions.length) html += `<li>No transactions yet.</li>`;
      else html += user.transactions.slice().reverse().map(t => {
        const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "→";
        return `<li style="margin:6px 0">${sign}AED ${t.amount.toFixed(2)} <span style="color:#6ed0e0;font-size:.95em;">${new Date(t.date).toLocaleString()}</span></li>`;
      }).join("");
      html += `</ul><div class="modal-actions"><button class="btn btn-secondary" id="hist-ok">Close</button></div>`;
      showModal(html);
      const ok = $("hist-ok");
      if (ok) ok.onclick = closeModal;
    };
  }

  function openTransferToSavingsModal() {
    showModal(
      `<h2 id="modal-title">Transfer to Savings</h2>
       <form id="save-form">
         <input type="number" step="0.01" min="0.01" max="${Number(user.currentBalance).toFixed(2)}" placeholder="Amount (AED)" required />
         <div class="modal-actions">
           <button type="button" class="btn btn-outline" id="save-cancel">Cancel</button>
           <button type="submit" class="btn btn-secondary">Save</button>
         </div>
       </form>
       <div id="save-error" style="color: var(--danger); margin-top: .5em;"></div>`
    );
    const form = $("save-form");
    const cancel = $("save-cancel");
    if (cancel) cancel.onclick = closeModal;
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        const amt = parseFloat(this.querySelector("input")?.value);
        const err = $("save-error");
        if (!isFinite(amt) || amt <= 0) { if (err) err.textContent = "Enter a valid amount."; return; }
        if (amt > user.currentBalance) { if (err) err.textContent = "Cannot save more than your current balance."; return; }

        user.currentBalance -= amt;
        user.savingsBalance += amt;
        user.totalSaved += amt;
        user.transactions.push({ type: "save", amount: amt, date: new Date().toISOString() });
        addBadgeXP("megaSaver", user.totalSaved);
        saveUser();
        renderBalances();
        closeModal();

        const xpReward = Math.max(20, Math.floor(user.savingsGoal > 0 ? (amt / user.savingsGoal) * 100 : 20));
        addXP(xpReward);

        if (user.savingsGoal > 0 && user.savingsBalance >= user.savingsGoal) {
          const bonusXP = Math.max(1, Math.floor(user.savingsGoal / 10));
          addXP(bonusXP);
          addBadgeXP("saver", user.savingsBalance);
          user.goalsAchieved += 1;
          addBadgeXP("goalCrusher", user.goalsAchieved);
          saveUser();
          showModal(
            `<h2 id="modal-title">Goal Achieved!</h2>
             <p>You completed your savings goal and earned ${bonusXP} bonus XP!</p>
             <div class="modal-actions"><button class="btn btn-secondary" id="goal-ok">Close</button></div>`
          );
          const ok = $("goal-ok");
          if (ok) ok.onclick = closeModal;
          user.savingsGoal = 0;
          const bar = $("savings-progress-bar");
          if (bar) bar.style.width = "0%";
          saveUser();
          renderBalances();
          renderStats();
        }
      };
    }
  }

  const savingsBalanceEl = $("savings-balance");
  if (savingsBalanceEl) savingsBalanceEl.onclick = openTransferToSavingsModal;
  const transferBtn = $("transfer-to-savings-btn");
  if (transferBtn) transferBtn.onclick = openTransferToSavingsModal;

  const setWeeklyLimitBtn = $("set-weekly-limit-btn");
  if (setWeeklyLimitBtn) {
    setWeeklyLimitBtn.onclick = function () {
      showModal(
        `<h2 id="modal-title">Set Weekly Spending Limit</h2>
         <form id="weekly-limit-form">
           <input type="number" step="0.01" min="1" max="200" placeholder="Weekly Limit (AED)" required />
           <div class="modal-actions">
             <button type="button" class="btn btn-outline" id="wl-cancel">Cancel</button>
             <button type="submit" class="btn btn-secondary">Set Limit</button>
           </div>
         </form>
         <div id="weekly-limit-error" style="color: var(--danger); margin-top: .5em;"></div>`
      );
      const form = $("weekly-limit-form");
      const cancel = $("wl-cancel");
      if (cancel) cancel.onclick = closeModal;
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          const limit = parseFloat(this.querySelector("input")?.value);
          const err = $("weekly-limit-error");
          if (!isFinite(limit) || limit <= 0) { if (err) err.textContent = "Enter a valid amount."; return; }
          if (limit > user.currentBalance * 0.25) { if (err) err.textContent = "Weekly limit cannot exceed 25% of your income."; return; }
          user.weeklyLimit = limit;
          user.weeklySpending = 0;
          user.lastWeekStart = getStartOfWeek(new Date()).toDateString();
          saveUser();
          renderStats();
          closeModal();
        };
      }
    };
  }

  ensureWeekWindow();
  renderBalances();
  renderStats();
  wireModalCloseEvents();
}

onReady(() => {
  wireModalCloseEvents();
  initSignup();
  initLogin();
  initDashboard();
});
