/* ================================================================
   EveryRupee · Planner Analysis JS
   Handles: CSV parse, dashboard, editable table, AI insights, sim
================================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────────
let allTransactions = [];
let filteredRows     = [];
let categoryChart    = null;
let trendChart       = null;

// ── Color palette (matches EveryRupee tokens) ────────────────────
const PALETTE = {
  green:  '#1C3829',
  gold:   '#C9973B',
  muted:  '#6B7280',
  bg:     '#F0EDE4',
  chartColors: [
    '#1C3829','#C9973B','#2D9E6B','#E05252',
    '#5B8DEF','#9B59B6','#F39C12','#1ABC9C'
  ]
};

// ── Drag & Drop ──────────────────────────────────────────────────
const dropZone = document.getElementById('dropZone');
const csvInput  = document.getElementById('csvInput');

dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

csvInput.addEventListener('change', () => {
  if (csvInput.files[0]) handleFile(csvInput.files[0]);
});

function handleFile(file) {
  if (!file.name.endsWith('.csv')) {
    showStatus('uploadStatus', 'error', 'Please upload a .csv file');
    return;
  }
  document.getElementById('fileName').textContent = `📄  ${file.name}  (${(file.size/1024).toFixed(1)} KB)`;
  const fi = document.getElementById('fileInfo');
  fi.style.display = 'flex';
  showStatus('uploadStatus', 'success', 'File ready');

  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

// ── CSV Parser ────────────────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return;

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g,''));

  // Try to identify columns flexibly
  const idx = {
    date:   findCol(headers, ['date','txn date','transaction date','value date']),
    desc:   findCol(headers, ['description','narration','particulars','remarks','txn details']),
    debit:  findCol(headers, ['debit','withdrawal','dr','amount(dr)','debit amount']),
    credit: findCol(headers, ['credit','deposit','cr','amount(cr)','credit amount']),
    bal:    findCol(headers, ['balance','closing balance','available balance']),
  };

  allTransactions = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const desc   = idx.desc  >= 0 ? clean(cols[idx.desc])   : '';
    const debit  = idx.debit >= 0 ? parseAmount(cols[idx.debit])  : 0;
    const credit = idx.credit>= 0 ? parseAmount(cols[idx.credit]) : 0;
    const bal    = idx.bal   >= 0 ? parseAmount(cols[idx.bal])    : 0;
    const date   = idx.date  >= 0 ? clean(cols[idx.date])    : `Row ${i}`;

    allTransactions.push({
      id: i,
      date,
      desc,
      debit,
      credit,
      balance: bal,
      category: autoCategory(desc),
    });
  }

  // If no matching columns found, try generic fallback (col 0=date,1=desc,2=debit,3=credit,4=bal)
  if (allTransactions.length === 0) {
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      allTransactions.push({
        id: i,
        date:     clean(cols[0]) || '',
        desc:     clean(cols[1]) || '',
        debit:    parseAmount(cols[2]),
        credit:   parseAmount(cols[3]),
        balance:  parseAmount(cols[4]),
        category: autoCategory(clean(cols[1]) || ''),
      });
    }
  }

  filteredRows = [...allTransactions];
  showStatus('uploadStatus', 'success', `${allTransactions.length} transactions parsed`);
}

function findCol(headers, candidates) {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

function splitCSVLine(line) {
  const result = []; let cur = ''; let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function clean(s) {
  return (s || '').replace(/['"]/g,'').trim();
}

function parseAmount(s) {
  if (!s) return 0;
  const n = parseFloat(clean(s).replace(/[,₹\s]/g,''));
  return isNaN(n) ? 0 : n;
}

// ── Auto-categorisation ──────────────────────────────────────────
const CAT_RULES = [
  { cat:'Food',      keys:['zomato','swiggy','dominos','pizza','restaurant','cafe','food','eat','hotel','mcd','kfc','uber eats'] },
  { cat:'Travel',    keys:['uber','ola','rapido','irctc','airline','flight','bus','train','metro','cab','taxi','travel','petrol','fuel'] },
  { cat:'Shopping',  keys:['amazon','flipkart','myntra','ajio','nykaa','meesho','shop','store','mart','mall','bigbasket','grocer','blinkit','zepto'] },
  { cat:'Utilities', keys:['electricity','water','gas','broadband','airtel','jio','vi','vodafone','bsnl','recharge','bill','emi','loan','insurance'] },
  { cat:'Health',    keys:['pharmacy','medical','hospital','clinic','doctor','health','apollo','1mg','netmeds','lab'] },
];

function autoCategory(desc) {
  const d = desc.toLowerCase();
  for (const rule of CAT_RULES) {
    if (rule.keys.some(k => d.includes(k))) return rule.cat;
  }
  return 'Other';
}

function catTag(cat) {
  const map = { Food:'tag-food', Travel:'tag-travel', Shopping:'tag-shopping', Utilities:'tag-util', Health:'tag-health', Other:'tag-other' };
  return `<span class="tag ${map[cat]||'tag-other'}">${cat}</span>`;
}

// ── ANALYSE ──────────────────────────────────────────────────────
function analyseCSV() {
  if (allTransactions.length === 0) {
    showStatus('uploadStatus', 'error', 'No data parsed yet');
    return;
  }
  renderDashboard();
  renderTable();
  ['dashboardCard','tableCard','taxCard','investCard','simCard'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('section-hidden');
    el.style.animation = 'none';
    el.getBoundingClientRect(); // reflow
    el.style.animation = 'fadeUp 0.4s ease forwards';
  });
  injectFadeAnim();
  setTimeout(() => document.getElementById('dashboardCard').scrollIntoView({behavior:'smooth', block:'start'}), 100);
}

function injectFadeAnim() {
  if (document.getElementById('er-anim')) return;
  const s = document.createElement('style');
  s.id = 'er-anim';
  s.textContent = `@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`;
  document.head.appendChild(s);
}

// ── DASHBOARD ────────────────────────────────────────────────────
function renderDashboard() {
  const totalDebit  = allTransactions.reduce((s,t) => s + t.debit,  0);
  const totalCredit = allTransactions.reduce((s,t) => s + t.credit, 0);
  const savings     = totalCredit - totalDebit;
  const savingsRate = totalCredit > 0 ? ((savings / totalCredit)*100).toFixed(1) : 0;
  const txCount     = allTransactions.length;

  const metrics = [
    { label:'Total Spend',    value:`₹${fmt(totalDebit)}`,  delta: '', cls: '' },
    { label:'Total Income',   value:`₹${fmt(totalCredit)}`, delta: '', cls: '' },
    { label:'Net Savings',    value:`₹${fmt(Math.abs(savings))}`, delta: savings >= 0 ? '▲ surplus' : '▼ deficit', cls: savings >= 0 ? 'up' : 'down', gold: savings >= 0 },
    { label:'Savings Rate',   value:`${savingsRate}%`, delta:'of income saved', cls:'', gold:true },
    { label:'Transactions',   value:`${txCount}`, delta:'entries analysed', cls:'' },
  ];

  const grid = document.getElementById('metricsGrid');
  grid.innerHTML = metrics.map(m => `
    <div class="metric-card">
      <div class="metric-label">${m.label}</div>
      <div class="metric-value${m.gold?' gold':''}">${m.value}</div>
      ${m.delta ? `<div class="metric-delta ${m.cls}">${m.delta}</div>` : ''}
    </div>
  `).join('');

  renderCharts(totalDebit, totalCredit);
}

function renderCharts(totalDebit, totalCredit) {
  // Category breakdown
  const catTotals = {};
  allTransactions.forEach(t => {
    if (t.debit > 0) catTotals[t.category] = (catTotals[t.category]||0) + t.debit;
  });

  const catLabels = Object.keys(catTotals);
  const catData   = catLabels.map(c => catTotals[c]);

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets:[{ data: catData, backgroundColor: PALETTE.chartColors, borderWidth: 0 }]
    },
    options: {
      responsive:true, maintainAspectRatio:true,
      plugins:{
        legend:{ position:'bottom', labels:{ color:PALETTE.green, font:{family:'DM Sans', size:11}, padding:12 } }
      }
    }
  });

  // Monthly trend (group by month)
  const monthly = {};
  allTransactions.forEach(t => {
    const m = t.date.substring(0,7) || 'Unknown';
    if (!monthly[m]) monthly[m] = {debit:0, credit:0};
    monthly[m].debit  += t.debit;
    monthly[m].credit += t.credit;
  });

  const months  = Object.keys(monthly).sort();
  const debits  = months.map(m => monthly[m].debit);
  const credits = months.map(m => monthly[m].credit);

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(document.getElementById('trendChart'), {
    type:'bar',
    data:{
      labels: months,
      datasets:[
        { label:'Spend',  data:debits,  backgroundColor: PALETTE.gold,  borderRadius:6 },
        { label:'Income', data:credits, backgroundColor: PALETTE.green, borderRadius:6 },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:true,
      plugins:{ legend:{ labels:{ color:PALETTE.green, font:{family:'DM Sans', size:11} } } },
      scales:{
        x:{ ticks:{color:PALETTE.muted, font:{family:'DM Sans',size:10}}, grid:{display:false} },
        y:{ ticks:{color:PALETTE.muted, font:{family:'DM Sans',size:10}, callback:v=>'₹'+fmt(v)}, grid:{color:'rgba(0,0,0,0.04)'} }
      }
    }
  });
}

// ── TABLE ─────────────────────────────────────────────────────────
function renderTable(rows) {
  rows = rows || filteredRows;
  const tbody = document.getElementById('txBody');
  tbody.innerHTML = rows.map((t,i) => `
    <tr data-id="${t.id}">
      <td style="color:var(--text-muted);font-size:0.75rem;">${i+1}</td>
      <td><input type="text" value="${escHtml(t.date)}" onchange="updateTx(${t.id},'date',this.value)"/></td>
      <td><input type="text" value="${escHtml(t.desc)}" onchange="updateTx(${t.id},'desc',this.value)" style="min-width:200px;"/></td>
      <td>
        <select onchange="updateTx(${t.id},'category',this.value)" style="border:1px solid transparent;background:transparent;font-family:'DM Sans',sans-serif;font-size:0.82rem;cursor:pointer;padding:4px 6px;border-radius:6px;transition:all .2s;">
          ${['Food','Travel','Shopping','Utilities','Health','Other'].map(c =>
            `<option${c===t.category?' selected':''}>${c}</option>`
          ).join('')}
        </select>
      </td>
      <td><span class="amount-debit">${t.debit > 0 ? '−₹'+fmt(t.debit) : '—'}</span></td>
      <td><span class="amount-credit">${t.credit > 0 ? '+₹'+fmt(t.credit) : '—'}</span></td>
      <td>${t.balance > 0 ? '₹'+fmt(t.balance) : '—'}</td>
    </tr>
  `).join('');
}

function updateTx(id, field, val) {
  const tx = allTransactions.find(t => t.id === id);
  if (!tx) return;
  tx[field] = field === 'debit' || field === 'credit' || field === 'balance' ? parseFloat(val)||0 : val;
  filteredRows = [...allTransactions];
  filterTable();
  renderDashboard(); // re-compute metrics
}

function filterTable() {
  const q   = (document.getElementById('searchInput').value || '').toLowerCase();
  const cat = document.getElementById('catFilter').value;
  filteredRows = allTransactions.filter(t => {
    const matchQ   = !q || t.desc.toLowerCase().includes(q) || t.date.toLowerCase().includes(q);
    const matchCat = !cat || t.category === cat;
    return matchQ && matchCat;
  });
  renderTable(filteredRows);
}

function exportEdited() {
  const header = 'Date,Description,Category,Debit,Credit,Balance\n';
  const body = allTransactions.map(t =>
    `"${t.date}","${t.desc}","${t.category}",${t.debit},${t.credit},${t.balance}`
  ).join('\n');
  downloadBlob(header+body, 'everyrupee-edited.csv', 'text/csv');
}

// ── AI INSIGHTS ───────────────────────────────────────────────────
async function fetchAIInsights(type) {
  const btnId   = type === 'tax' ? 'taxBtn' : 'investBtn';
  const btn     = document.getElementById(btnId);
  btn.disabled  = true;
  btn.innerHTML = `<span class="dot pulse"></span> Thinking…`;

  const summary = buildSummary();

  try {
    const endpoint = type === 'tax' ? '/api/tax-insights' : '/api/investment-suggestions';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary }),
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();

    if (type === 'tax') {
      // This is where the magic happens
      renderDeductionAlerts(data); 
      // You can still keep your old render function below it if you want
    }

  } catch (err) {
    // Graceful fallback with canned AI-style response
    console.warn('Backend unavailable, using client fallback:', err.message);
    if (type === 'tax') renderTaxInsights(buildFallbackTax(summary));
    else               renderInvestSuggestions(buildFallbackInvest(summary));
  } finally {
    btn.disabled = false;
    btn.innerHTML = type === 'tax'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> Regenerate'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> Refresh';
  }
}

function buildSummary() {
  const totalDebit  = allTransactions.reduce((s,t) => s+t.debit, 0);
  const totalCredit = allTransactions.reduce((s,t) => s+t.credit, 0);
  const catTotals   = {};
  allTransactions.forEach(t => {
    if (t.debit>0) catTotals[t.category] = (catTotals[t.category]||0)+t.debit;
  });
  return { totalDebit, totalCredit, categories: catTotals, count: allTransactions.length };
}

function renderTaxInsights(data) {
  const container = document.getElementById('taxInsights');
  const insights  = data.insights || [];
  if (!insights.length) { container.innerHTML = '<p>No insights generated.</p>'; return; }
  container.innerHTML = insights.map((ins, i) => `
    <div class="insight-block ${i%2===1?'green-border':''}">
      <div class="insight-label ${i%2===1?'green':''}">${ins.title}</div>
      <div class="insight-text">${ins.body}</div>
    </div>
  `).join('');
}

function renderInvestSuggestions(data) {
  const container = document.getElementById('investSuggestions');
  const recs = data.recommendations || [];
  if (!recs.length) { container.innerHTML = '<p>No suggestions generated.</p>'; return; }
  container.innerHTML = recs.map((r,i) => `
    <div class="rec-block">
      <div class="rec-number">${i+1}</div>
      <div class="rec-content">
        <div class="rec-title">${r.title}</div>
        <div class="rec-desc">${r.description}</div>
      </div>
    </div>
  `).join('');
}

// Fallback responses (when backend is not running)
function buildFallbackTax(summary) {
  const { totalDebit, totalCredit, categories } = summary;
  const savingsRate = totalCredit > 0 ? ((totalCredit-totalDebit)/totalCredit*100).toFixed(1) : 0;
  const foodSpend   = categories['Food']      || 0;
  const utilSpend   = categories['Utilities'] || 0;
  return {
    insights: [
      {
        title: '80C Deduction Opportunity',
        body: `Your current savings rate is ~${savingsRate}%. You can invest up to ₹1.5L in ELSS/PPF/NSC under Section 80C to reduce taxable income significantly.`
      },
      {
        title: 'HRA & LTA Claims',
        body: `If you pay rent, ensure you're claiming HRA exemption. Retain travel bills for LTA (Leave Travel Allowance) — these are common missed deductions.`
      },
      {
        title: 'Section 80D – Health Insurance',
        body: `₹${fmt(utilSpend)} in utilities detected. If health insurance premiums are included, you can claim up to ₹25,000 (₹50,000 for senior parents) under Section 80D.`
      },
      {
        title: 'Interest Income Reporting',
        body: `Don't forget to report savings account interest under "Income from Other Sources" — but the first ₹10,000 is exempt under Section 80TTA.`
      },
    ]
  };
}

function buildFallbackInvest(summary) {
  const { totalDebit, totalCredit, categories } = summary;
  const surplus = totalCredit - totalDebit;
  const shopSpend = categories['Shopping'] || 0;
  return {
    recommendations: [
      {
        title: 'Start a SIP in Index Funds',
        description: `With a monthly surplus of ₹${fmt(Math.max(0,surplus))}, even a ₹500/month SIP in a Nifty 50 index fund can compound significantly over 10 years. Low cost, market-linked returns.`
      },
      {
        title: 'Build a 3-Month Emergency Fund',
        description: `Keep 3× your monthly spend (~₹${fmt(totalDebit*3)}) in a high-yield savings account or liquid mutual fund before investing aggressively.`
      },
      {
        title: 'Reduce Discretionary Shopping',
        description: `You spent ₹${fmt(shopSpend)} on shopping. Redirecting even 30% (~₹${fmt(shopSpend*0.3)}) monthly to a recurring deposit can build ₹${fmt(shopSpend*0.3*12)} in a year.`
      },
      {
        title: 'Consider NPS for Additional Tax + Retirement Benefit',
        description: `National Pension Scheme offers an extra ₹50,000 deduction under Section 80CCD(1B) beyond the 80C limit — great for salaried individuals looking to boost retirement corpus.`
      },
      {
        title: 'Explore Debt Mutual Funds for Idle Cash',
        description: `Any idle savings beyond your emergency fund can earn better post-tax returns in short-duration debt funds compared to a regular savings account.`
      },
    ]
  };
}

// ── SIMULATION ────────────────────────────────────────────────────
function updateSim() {
  const rate       = parseFloat(document.getElementById('savingsRate').value);
  const monthly    = parseFloat(document.getElementById('monthlyInvest').value) || 0;
  const retRate    = parseFloat(document.getElementById('returnRate').value) / 100 / 12;
  const years      = parseFloat(document.getElementById('timeHorizon').value);
  const reduceSpend= parseFloat(document.getElementById('reduceSpend').value) || 0;

  document.getElementById('savingsRateVal').textContent  = rate;
  document.getElementById('returnRateVal').textContent   = document.getElementById('returnRate').value;
  document.getElementById('timeHorizonVal').textContent  = years;

  const effectiveMonthly = monthly + reduceSpend;
  const n = years * 12;
  const corpus = retRate > 0
    ? effectiveMonthly * ((Math.pow(1+retRate, n) - 1) / retRate) * (1+retRate)
    : effectiveMonthly * n;
  const invested = effectiveMonthly * n;
  const interest = corpus - invested;

  document.getElementById('simCorpus').textContent   = '₹'+fmt(corpus);
  document.getElementById('simGain').textContent     = '+₹'+fmt(interest);
  document.getElementById('simInvested').textContent = '₹'+fmt(invested);
  document.getElementById('simInterest').textContent = '₹'+fmt(interest);
  document.getElementById('simFreed').textContent    = '₹'+fmt(reduceSpend);
  document.getElementById('simEffective').textContent= '₹'+fmt(effectiveMonthly);
}

// ── RECONCILIATION ENGINE (PREMIUM) ──────────────────────────────
let reconFiles = { ais: false, bank: false };

function handleReconUpload(inputId, textId) {
  const input = document.getElementById(inputId);
  const textDisplay = document.getElementById(textId);
  const runBtn = document.getElementById('runReconBtn');
  
  if (input && input.files && input.files[0]) {
    // Show truncated file name
    const fileName = input.files[0].name;
    if (textDisplay) {
      textDisplay.innerText = fileName.length > 20 ? fileName.substring(0, 18) + '...' : fileName;
      textDisplay.style.color = 'var(--green-deep)';
      textDisplay.style.fontWeight = '600';
    }
    
    // Update state
    if (inputId === 'aisInput') reconFiles.ais = true;
    if (inputId === 'bankPdfInput') reconFiles.bank = true;

    // Enable button only if both are uploaded
    if (reconFiles.ais && reconFiles.bank && runBtn) {
      runBtn.disabled = false;
    }
  }
}

async function runReconciliation() {
  const btn = document.getElementById('runReconBtn');
  const resultsArea = document.getElementById('reconResults');
  const riskFill = document.getElementById('riskFill');
  const riskText = document.getElementById('riskScoreText');
  
  const aisFile = document.getElementById('aisInput').files[0];
  const bankFile = document.getElementById('bankPdfInput').files[0];

  // 1. Loading State
  btn.innerHTML = `<span class="dot pulse" style="background:#fff;"></span> Analyzing...`;
  btn.disabled = true;
  if (resultsArea) resultsArea.classList.add('section-hidden');
  if (riskFill) riskFill.style.width = '0%';

  // 2. Prepare files for upload
  const formData = new FormData();
  formData.append('aisPdf', aisFile);
  formData.append('bankPdf', bankFile);

  try {
    // 3. Call your new backend endpoint
    const res = await fetch('http://localhost:5001/api/reconcile', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();

    // 4. Update the Risk Dashboard
    riskText.innerText = data.riskScore;
    if (data.riskScore === 'Low') {
      riskText.style.color = '#2D9E6B';
      riskFill.style.background = 'linear-gradient(90deg, #D1FAE5, #2D9E6B)';
    } else if (data.riskScore === 'High') {
      riskText.style.color = '#E05252';
      riskFill.style.background = 'linear-gradient(90deg, #FEE2E2, #E05252)';
    } else {
      riskText.style.color = '#D97706';
      riskFill.style.background = 'linear-gradient(90deg, #F5E8CE, #D97706)';
    }

    // 5. Build the dynamic Discrepancy Cards
    const list = document.querySelector('.discrepancy-list');
    list.innerHTML = data.discrepancies.map(d => `
      <div class="discrepancy-card ${d.type}">
        <div class="disc-icon">
          ${d.type === 'warning' 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`}
        </div>
        <div class="disc-content">
          <div class="disc-title">${d.title}</div>
          <div class="disc-text">${d.text}</div>
          ${d.action ? `<div class="disc-action">${d.action}</div>` : ''}
        </div>
      </div>
    `).join('');

    // 6. Reveal the results smoothly
    resultsArea.classList.remove('section-hidden');
    resultsArea.classList.add('animate-results');
    
    // Animate the bar slightly after render
    setTimeout(() => {
      riskFill.style.width = `${data.riskPercentage}%`;
    }, 100);

  } catch (err) {
    console.error(err);
    alert("Analysis failed. Check server console for Gemini API errors.");
  } finally {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Analysis Complete`;
    btn.disabled = false;
  }
}

// ── HELPERS ───────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1e7) return (n/1e7).toFixed(2)+'Cr';
  if (n >= 1e5) return (n/1e5).toFixed(2)+'L';
  return Number(n.toFixed(0)).toLocaleString('en-IN');
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showStatus(containerId, type, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const icon = type==='success' ? '●' : type==='loading' ? '●' : '✕';
  el.innerHTML = `<span class="status-pill ${type}"><span class="dot${type==='loading'?' pulse':''}"></span>${msg}</span>`;
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], {type: mimeType});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── INIT ─────────────────────────────────────────────────────────
updateSim(); // prime simulation display

function renderDeductionAlerts(data) {
  const container = document.getElementById('taxInsights');
  
  // Clear the "Click Generate" placeholder
  container.innerHTML = ''; 

  // Create a high-impact 'Detective' card
  const detectiveCard = document.createElement('div');
  detectiveCard.className = 'insight-block green-border';
  detectiveCard.style.gridColumn = '1 / -1'; // Spans full width
  
  detectiveCard.innerHTML = `
    <div class="insight-label green">🕵️ Deduction Detective found ${data.detected_deductions.length} items</div>
    <div class="insight-text">
      <ul id="deductionList">
        ${data.detected_deductions.map(item => `
          <li>
            Found <strong>₹${item.amount}</strong> paid to <em>${item.source}</em>. 
            Claim this under <strong>${item.category}</strong> to save tax.
          </li>
        `).join('')}
      </ul>
    </div>
  `;
  
  container.appendChild(detectiveCard);
}