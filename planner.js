/**
 * EveryRupee — planner.js
 * AI-driven financial planner logic
 * Rule-based simulation (placeholder for real AI API integration)
 */

'use strict';

/* ══════════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════════ */
const state = {
  currentStep: 1,
  totalSteps: 5,
  userData: {
    monthlyIncome: 0,
    fixedExpenses: 0,
    existingInvestments: 0,
    debt: 0,
    goals: [],
    riskProfile: 'moderate',
    name: ''
  },
  results: null
};

/* ══════════════════════════════════════════════════════════════
   STEP MANAGEMENT
══════════════════════════════════════════════════════════════ */
function goToStep(n) {
  if (n < 1 || n > state.totalSteps) return;

  // Collect data from current step before moving
  collectStepData(state.currentStep);

  // Validate before advancing
  if (n > state.currentStep && !validateStep(state.currentStep)) return;

  state.currentStep = n;
  renderStep();
}

function nextStep() { goToStep(state.currentStep + 1); }
function prevStep() { goToStep(state.currentStep - 1); }

function renderStep() {
  const n = state.currentStep;

  // Update panels
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`step-${n}`);
  if (panel) panel.classList.add('active');

  // Update indicators
  document.querySelectorAll('.step-indicator__dot').forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i + 1 < n) dot.classList.add('completed');
    if (i + 1 === n) dot.classList.add('active');
  });
  document.querySelectorAll('.step-indicator__line').forEach((line, i) => {
    line.classList.toggle('completed', i + 1 < n);
  });

  // Progress bar
  const pct = ((n - 1) / (state.totalSteps - 1)) * 100;
  const fill = document.querySelector('.wizard-progress .progress-bar__fill');
  if (fill) fill.style.width = pct + '%';

  // Update encouragement
  updateEncouragement(n);

  // Step 5 → generate results
  if (n === state.totalSteps) {
    setTimeout(generateResults, 200);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function collectStepData(step) {
  switch (step) {
    case 1:
      state.userData.name = val('input-name') || 'Friend';
      state.userData.monthlyIncome = numVal('input-income');
      break;
    case 2:
      state.userData.fixedExpenses = numVal('input-expenses');
      state.userData.existingInvestments = numVal('input-investments');
      break;
    case 3:
      state.userData.debt = numVal('input-debt');
      break;
    case 4:
      state.userData.goals = Array.from(
        document.querySelectorAll('.goal-option.selected')
      ).map(el => el.dataset.goal);
      break;
    case 5:
      // Risk collected via radio
      break;
  }
}

function validateStep(step) {
  let valid = true;
  switch (step) {
    case 1:
      if (!numVal('input-income') || numVal('input-income') < 1000) {
        showToast('Please enter a valid monthly income', '⚠️');
        valid = false;
      }
      break;
    case 2:
      if (numVal('input-expenses') < 0) { valid = false; }
      break;
  }
  return valid;
}

/* ══════════════════════════════════════════════════════════════
   AI LOGIC — Rule-based financial intelligence
   FUTURE: Replace these functions with real AI API calls 
══════════════════════════════════════════════════════════════ */

function assessRiskProfile() {
  const selected = document.querySelector('.risk-option.selected');
  return selected ? selected.dataset.risk : 'moderate';
}

function calculateDisposableIncome() {
  const { monthlyIncome, fixedExpenses, debt } = state.userData;
  const debtEMI = debt * 0.02; // approx 2% of total debt as monthly EMI
  return Math.max(0, monthlyIncome - fixedExpenses - debtEMI);
}

function generateAssetAllocation() {
  const risk = state.userData.riskProfile;
  const allocations = {
    conservative: [
      { name: 'Fixed Deposits / Debt Funds', pct: 40, color: '#276645' },
      { name: 'PPF / EPF',                   pct: 30, color: '#3d9668' },
      { name: 'Large-Cap Equity',            pct: 20, color: '#c49a2b' },
      { name: 'Gold ETF',                    pct: 10, color: '#e8c86a' }
    ],
    moderate: [
      { name: 'Equity Mutual Funds',         pct: 45, color: '#276645' },
      { name: 'PPF / Debt Funds',            pct: 25, color: '#3d9668' },
      { name: 'US Index / International',    pct: 15, color: '#c49a2b' },
      { name: 'Gold ETF',                    pct: 10, color: '#e8c86a' },
      { name: 'Emergency Fund',              pct:  5, color: '#6ab891' }
    ],
    aggressive: [
      { name: 'Direct Equity / Mid-cap',     pct: 50, color: '#276645' },
      { name: 'Small-cap Mutual Funds',      pct: 20, color: '#3d9668' },
      { name: 'International Equity',        pct: 15, color: '#c49a2b' },
      { name: 'REIT / InvITs',               pct: 10, color: '#e8c86a' },
      { name: 'Crypto (max 5%)',             pct:  5, color: '#9b7519' }
    ]
  };
  return allocations[risk] || allocations.moderate;
}

function recommendInvestmentInstruments() {
  const risk = state.userData.riskProfile;
  const all = {
    conservative: ['ppf', 'fd', 'elss'],
    moderate:     ['mf_equity', 'ppf', 'us_index', 'gold'],
    aggressive:   ['direct_equity', 'smallcap', 'us_index', 'reit']
  };
  return (all[risk] || all.moderate).map(id => INVESTMENT_DATA[id]).filter(Boolean);
}

function projectLongTermReturns(disposable) {
  const risk = state.userData.riskProfile;
  const rateMap = { conservative: 0.08, moderate: 0.12, aggressive: 0.16 };
  const rate = rateMap[risk] || 0.12;
  const monthly = disposable * 0.7; // invest 70% of disposable

  const years = [5, 10, 15, 20, 25];
  return years.map(y => {
    const months = y * 12;
    const corpus = monthly * ((Math.pow(1 + rate / 12, months) - 1) / (rate / 12));
    const invested = monthly * months;
    return { year: y, corpus: Math.round(corpus), invested: Math.round(invested) };
  });
}

/* ══════════════════════════════════════════════════════════════
   INVESTMENT DATA LIBRARY
══════════════════════════════════════════════════════════════ */
const INVESTMENT_DATA = {
  ppf: {
    id: 'ppf',
    icon: '🏦',
    name: 'Public Provident Fund (PPF)',
    shortDesc: 'Government-backed long-term savings',
    returnRange: '7.1% p.a.',
    returnLabel: 'Guaranteed',
    allocationLabel: 'Core Safety',
    lockIn: '15 years',
    liquidity: 'Partial after 7 years',
    taxImplications: 'EEE — fully tax-free',
    docs: ['Aadhaar / PAN', 'Passport-size photo', 'Bank account details'],
    steps: [
      'Visit your nearest SBI / India Post branch or use net banking',
      'Fill PPF account opening form or apply online',
      'Submit KYC documents (Aadhaar + PAN)',
      'Deposit a minimum of ₹500. Maximum ₹1.5L per year',
      'Get your PPF passbook and note your account number'
    ],
    risks: 'Very low — sovereign guarantee. Interest rate revised quarterly.',
    whoAvoid: 'Those who may need money before 15 years. Not for aggressive wealth creation.',
    scamFlags: [
      'No "PPF agents" exist — never pay commission to open an account',
      'PPF cannot give returns above ~7–8%. Any higher claim is fake',
      'Only open through scheduled banks or India Post — avoid third-party apps'
    ]
  },
  fd: {
    id: 'fd',
    icon: '🏧',
    name: 'Fixed Deposits (FDs)',
    shortDesc: 'Guaranteed returns from bank deposits',
    returnRange: '6.5–7.5% p.a.',
    returnLabel: 'Guaranteed',
    allocationLabel: 'Low Risk',
    lockIn: '7 days to 10 years',
    liquidity: 'Premature withdrawal allowed (penalty)',
    taxImplications: 'Interest taxed as per income slab',
    docs: ['PAN Card', 'Aadhaar', 'Bank account'],
    steps: [
      'Log into your bank\'s net banking portal',
      'Go to "Deposits" → "Open Fixed Deposit"',
      'Enter amount, tenure, and choose interest payout frequency',
      'Confirm and note the FD receipt number',
      'For Tax-Saving FD: specify 5-year lock-in to claim 80C deduction'
    ],
    risks: 'Low. Risk of bank failure covered by DICGC up to ₹5 lakh.',
    whoAvoid: 'People in 30% tax slab (better alternatives like debt funds exist).',
    scamFlags: [
      'Never share OTPs with anyone claiming to be from your bank',
      'Interest rates above 8–9% from unknown NBFCs are high-risk',
      'Official FDs don\'t need agents or referral fees'
    ]
  },
  elss: {
    id: 'elss',
    icon: '📊',
    name: 'ELSS Mutual Funds',
    shortDesc: 'Tax-saving equity funds with 3-yr lock-in',
    returnRange: '12–15% p.a.',
    returnLabel: 'Historical avg.',
    allocationLabel: 'Tax + Growth',
    lockIn: '3 years (shortest under 80C)',
    liquidity: 'After 3 years, fully liquid',
    taxImplications: 'Save up to ₹46,800 tax. LTCG taxed at 10% above ₹1L gain',
    docs: ['PAN', 'Aadhaar', 'Bank account', 'Cancelled cheque'],
    steps: [
      'Complete KYC on Zerodha, Groww, Paytm Money, or MF Utility',
      'Search for top ELSS funds (Mirae Asset Tax Saver, Axis Long Term Equity)',
      'Invest lump sum or start SIP (min ₹500/month)',
      'Keep investment proof for tax filing',
      'After 3 years, choose to redeem or continue'
    ],
    risks: 'Market-linked — can fall 30–40% in bear markets. Long-term view needed.',
    whoAvoid: 'Those who cannot stay invested for minimum 3 years.',
    scamFlags: [
      'No ELSS fund guarantees fixed returns',
      'Avoid "assured return" ELSS schemes — they don\'t exist',
      'Invest only through SEBI-registered platforms or AMCs directly'
    ]
  },
  mf_equity: {
    id: 'mf_equity',
    icon: '📈',
    name: 'Equity Mutual Funds (SIP)',
    shortDesc: 'Diversified market exposure via monthly SIP',
    returnRange: '12–18% p.a.',
    returnLabel: 'Long-term avg.',
    allocationLabel: 'Core Growth',
    lockIn: 'None (open-ended)',
    liquidity: 'T+3 redemption',
    taxImplications: 'LTCG 10% (>1L), STCG 15% if held <1 year',
    docs: ['PAN', 'Aadhaar', 'Bank account', 'Photo'],
    steps: [
      'Open a free account on Zerodha Coin, Groww, or Kuvera',
      'Complete Video KYC (takes ~10 minutes)',
      'Choose funds based on category: Large Cap / Flexi Cap / Mid Cap',
      'Set up a monthly SIP (Systematic Investment Plan) — even ₹500 works',
      'Review portfolio annually; avoid switching funds every few months'
    ],
    risks: 'Market risk — NAV fluctuates daily. Best held 5–10+ years.',
    whoAvoid: 'Those needing money in less than 3 years for specific goals.',
    scamFlags: [
      'No mutual fund can "double money in 1 year" legally',
      'Cold calls selling MFs often involve mis-selling — always verify SEBI registration',
      'Never invest in mutual funds via WhatsApp groups or Telegram bots'
    ]
  },
  us_index: {
    id: 'us_index',
    icon: '🌐',
    name: 'US / International Index Funds',
    shortDesc: 'Global diversification via S&P 500 index',
    returnRange: '14–18% p.a.',
    returnLabel: 'USD returns + forex gain',
    allocationLabel: 'Global Hedge',
    lockIn: 'None',
    liquidity: 'T+3 redemption',
    taxImplications: 'Taxed as debt fund: 20% with indexation after 3 years',
    docs: ['PAN', 'Aadhaar', 'Bank account'],
    steps: [
      'Open account on Kuvera, Groww, or Zerodha Coin',
      'Search for "Motilal Oswal S&P 500 Index Fund" or "PPFAS Flexi Cap"',
      'Start with minimum ₹500 SIP',
      'Note currency risk: INR weakening boosts returns in ₹',
      'Hold for 5+ years for best results'
    ],
    risks: 'Currency risk + US market risk. RBI may impose limits on fresh investments.',
    whoAvoid: 'Those with short investment horizon or averse to currency fluctuation.',
    scamFlags: [
      'No US fund offers guaranteed NRI-level returns in India',
      'Beware of offshore funds not registered with SEBI',
      'Avoid platforms that aren\'t listed on AMFI / SEBI website'
    ]
  },
  gold: {
    id: 'gold',
    icon: '🥇',
    name: 'Gold ETF / Sovereign Gold Bonds',
    shortDesc: 'Digital gold without storage risk',
    returnRange: '8–10% p.a.',
    returnLabel: 'Historical 10yr',
    allocationLabel: 'Inflation Hedge',
    lockIn: 'SGBs: 8 years (exit after 5)',
    liquidity: 'Gold ETF: T+2; SGB: listed on exchange',
    taxImplications: 'SGB: Capital gain tax-free at maturity. ETF: LTCG after 3 years',
    docs: ['Demat account', 'PAN', 'Aadhaar'],
    steps: [
      'Open a demat account with Zerodha / Groww / Angel One',
      'Search "Gold ETF" on the platform (HDFC Gold ETF, Nippon Gold ETF)',
      'Buy in units (1 unit ≈ 1 gram equivalent)',
      'For SGB: apply during RBI issue windows via bank or Zerodha',
      'SGB also gives 2.5% annual interest (bonus!)'
    ],
    risks: 'Gold is volatile short-term. No cash flow or dividends from physical-linked ETFs.',
    whoAvoid: 'Those seeking regular income or short-term trading.',
    scamFlags: [
      'Physical gold buying doesn\'t apply here — Gold ETF is electronic only',
      'Never buy "digital gold" from unregulated platforms; use SEBI-registered brokers',
      'Multi-level marketing "gold schemes" are typically fraudulent'
    ]
  },
  direct_equity: {
    id: 'direct_equity',
    icon: '💹',
    name: 'Direct Stocks (Equity)',
    shortDesc: 'Own shares of listed companies directly',
    returnRange: '15–25%+ p.a.',
    returnLabel: 'Skill-dependent',
    allocationLabel: 'High Alpha',
    lockIn: 'None',
    liquidity: 'T+2 settlement',
    taxImplications: 'STCG 15% (<1yr), LTCG 10% (>1yr, above ₹1L gain)',
    docs: ['Demat account', 'PAN', 'Aadhaar', 'Bank account'],
    steps: [
      'Open a demat + trading account (Zerodha, Angel One, Upstox)',
      'Complete in-person verification or video KYC',
      'Fund the account and start with blue-chip companies (Nifty 50)',
      'Research companies: check quarterly results, debt, P/E ratio',
      'Place buy orders; hold for 1+ years for LTCG benefit'
    ],
    risks: 'High. Stocks can fall 50–80%. Requires research and emotional discipline.',
    whoAvoid: 'Absolute beginners without financial literacy. Start with MFs first.',
    scamFlags: [
      'Never follow "hot tips" on Telegram / WhatsApp — SEBI calls this unauthorized advice',
      'Pump-and-dump schemes target penny stocks — avoid unresearched small caps',
      'No SEBI-registered advisor will ask for a cut of your profits'
    ]
  },
  smallcap: {
    id: 'smallcap',
    icon: '🚀',
    name: 'Small-Cap Mutual Funds',
    shortDesc: 'High growth potential with higher volatility',
    returnRange: '16–22% p.a.',
    returnLabel: 'Long-term avg.',
    allocationLabel: 'High Growth',
    lockIn: 'None (open-ended)',
    liquidity: 'T+3 redemption',
    taxImplications: 'LTCG 10% (>1yr, above ₹1L), STCG 15%',
    docs: ['PAN', 'Aadhaar', 'Bank account'],
    steps: [
      'Open account on Groww, Zerodha Coin, or directly on AMC website',
      'Choose funds: Nippon India Small Cap, SBI Small Cap, Quant Small Cap',
      'Start SIP for at least ₹1,000/month',
      'Commit to a minimum 7–10 year horizon',
      'Don\'t check NAV every day — volatility is normal'
    ],
    risks: 'Very high volatility. Can fall 60–70% in bear markets. Must hold 7+ years.',
    whoAvoid: 'Anyone with investment horizon under 5 years or low risk tolerance.',
    scamFlags: [
      'Small-cap "guaranteed return" schemes are always fraud',
      'Avoid advisor-pushed schemes with high commissions (check TER)',
      'Invest only through SEBI-regulated platforms'
    ]
  },
  reit: {
    id: 'reit',
    icon: '🏗️',
    name: 'REITs & InvITs',
    shortDesc: 'Real estate & infrastructure income trusts',
    returnRange: '8–12% p.a.',
    returnLabel: 'Dividend + growth',
    allocationLabel: 'Income',
    lockIn: 'None (exchange listed)',
    liquidity: 'T+2 on NSE/BSE',
    taxImplications: 'Distributions taxed as per type: interest/dividend/capital gain',
    docs: ['Demat account', 'PAN'],
    steps: [
      'Open a demat account with Zerodha or Angel One',
      'Search "REITs" on NSE: Embassy REIT, Mindspace REIT, Nexus Select Trust',
      'Buy units like shares (minimum 1 unit ≈ ₹200–400)',
      'Receive quarterly distributions (rental income equivalent)',
      'Hold for 3+ years for meaningful returns'
    ],
    risks: 'Lower than equity but market-linked. Interest rate sensitive.',
    whoAvoid: 'Those seeking very high growth. Better for income-seekers.',
    scamFlags: [
      'Only 4–5 listed REITs in India — anything else is unregulated',
      'Fractional real estate apps without SEBI registration carry high risk',
      'Never invest in unlisted "property bonds" without due diligence'
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   GENERATE RESULTS
══════════════════════════════════════════════════════════════ */
function generateResults() {
  state.userData.riskProfile = assessRiskProfile();
  const disposable = calculateDisposableIncome();
  const allocation = generateAssetAllocation();
  const instruments = recommendInvestmentInstruments();
  const projections = projectLongTermReturns(disposable);

  state.results = { disposable, allocation, instruments, projections };

  renderDashboard();
}

function renderDashboard() {
  const { userData, results } = state;
  if (!results) return;

  const { disposable, allocation, instruments, projections } = results;
  const investable = Math.round(disposable * 0.7);

  // Show dashboard, hide wizard
  document.querySelector('.wizard').style.display = 'none';
  const dash = document.querySelector('.dashboard');
  dash.classList.add('active');

  // Header personalization
  document.getElementById('dash-name').textContent = userData.name || 'Friend';
  document.getElementById('dash-income').textContent = formatINR(userData.monthlyIncome);
  document.getElementById('dash-risk').textContent = capitalize(userData.riskProfile);

  // Stat cards
  document.getElementById('stat-disposable').textContent = formatINR(disposable);
  document.getElementById('stat-investable').textContent = formatINR(investable);
  document.getElementById('stat-corpus-10yr').textContent =
    formatINR(projections[1]?.corpus || 0);

  // Pie chart
  renderPieChart(allocation);

  // Projection chart
  renderProjectionChart(projections, investable);

  // Investment cards
  renderInvestmentCards(instruments, allocation);

  // Animate reveal
  setTimeout(() => {
    document.querySelectorAll('.dashboard .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  }, 100);
}

function renderPieChart(allocation) {
  const canvas = document.getElementById('pie-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 200; canvas.height = 200;
  const cx = 100, cy = 100, r = 90, gap = 0.03;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, 200, 200);

  allocation.forEach(seg => {
    const sliceAngle = (seg.pct / 100) * (2 * Math.PI) - gap;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sliceAngle + gap;
  });

  // Center hole (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#0d2b1e';
  ctx.font = 'bold 13px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Asset', cx, cy - 6);
  ctx.fillText('Mix', cx, cy + 12);

  // Legend
  const legend = document.getElementById('pie-legend');
  if (legend) {
    legend.innerHTML = allocation.map(seg => `
      <div class="pie-legend-item">
        <div class="pie-legend-dot" style="background:${seg.color}"></div>
        <span class="pie-legend-label">${seg.name}</span>
        <span class="pie-legend-pct">${seg.pct}%</span>
      </div>
    `).join('');
  }
}

function renderProjectionChart(projections, monthly) {
  const container = document.getElementById('proj-bars');
  if (!container) return;

  const maxVal = projections[projections.length - 1]?.corpus || 1;

  container.innerHTML = projections.map(p => {
    const corpusPct = (p.corpus / maxVal) * 100;
    const investedPct = (p.invested / maxVal) * 100;
    return `
      <div class="proj-bar-group">
        <div style="position:relative; flex:1; display:flex; flex-direction:column; justify-content:flex-end; gap:2px; width:100%; min-width:40px;">
          <div class="proj-bar proj-bar--returns" style="height:${corpusPct}%">
            <span class="proj-bar-tip">${shortINR(p.corpus)}</span>
          </div>
        </div>
        <div class="proj-bar-year">${p.year}Y</div>
      </div>
    `;
  }).join('');
}

function renderInvestmentCards(instruments, allocation) {
  const container = document.getElementById('investment-cards');
  if (!container) return;

  container.innerHTML = instruments.map(inv => {
    const alloc = allocation.find(a => a.name.toLowerCase().includes(inv.name.toLowerCase().split(' ')[0]));
    const allocPct = alloc ? alloc.pct : '—';

    const detailItems = [
      { label: 'Lock-In',     value: inv.lockIn },
      { label: 'Liquidity',   value: inv.liquidity },
      { label: 'Tax',         value: inv.taxImplications }
    ];

    const docList = inv.docs.map(d => `<li>• ${d}</li>`).join('');
    const stepList = inv.steps.map((s, i) => `
      <div class="inv-step">
        <div class="inv-step__num">${i + 1}</div>
        <div class="inv-step__text">${s}</div>
      </div>
    `).join('');
    const scamList = inv.scamFlags.map(f => `<div class="scam-flag-item">${f}</div>`).join('');

    return `
      <div class="inv-card" id="inv-${inv.id}">
        <div class="inv-card__header" onclick="toggleInvCard('${inv.id}')">
          <div class="inv-card__header-left">
            <div class="inv-card__icon">${inv.icon}</div>
            <div>
              <div class="inv-card__name">${inv.name}</div>
              <div class="inv-card__allocation">${inv.allocationLabel} · ${allocPct}% of portfolio</div>
            </div>
          </div>
          <div class="inv-card__return">
            <div class="inv-card__return-value">${inv.returnRange}</div>
            <div class="inv-card__return-label">${inv.returnLabel}</div>
          </div>
          <svg class="inv-card__chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
        <div class="inv-card__body">
          <div class="inv-card__detail">
            <div class="inv-detail-grid">
              ${detailItems.map(item => `
                <div class="inv-detail-item">
                  <div class="inv-detail-item__label">${item.label}</div>
                  <div class="inv-detail-item__value">${item.value}</div>
                </div>
              `).join('')}
            </div>

            <div class="inv-steps">
              <div class="inv-steps__title">📋 How to Invest</div>
              ${stepList}
            </div>

            <div class="inv-steps" style="margin-top:16px;">
              <div class="inv-steps__title">📂 Documents Required</div>
              <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
                <ul style="list-style:none;">${docList}</ul>
              </div>
            </div>

            <div class="inv-steps" style="margin-top:16px;">
              <div class="inv-steps__title">⚖️ Risks & Who Should Avoid</div>
              <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.7;">
                <strong>Risks:</strong> ${inv.risks}<br><br>
                <strong>Avoid if:</strong> ${inv.whoAvoid}
              </div>
            </div>

            <div class="scam-flags">
              <div class="scam-flags__title">🚨 Scam Red Flags</div>
              ${scamList}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleInvCard(id) {
  const card = document.getElementById(`inv-${id}`);
  if (!card) return;
  card.classList.toggle('open');
}

/* ══════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════ */
const ENCOURAGEMENTS = [
  { emoji: '🌱', text: 'Great start! Knowing your income is the first step to financial freedom.' },
  { emoji: '📊', text: 'You\'re doing amazing! Understanding your expenses unlocks your potential.' },
  { emoji: '🎯', text: 'Almost there! Clear goals turn dreams into action plans.' },
  { emoji: '💪', text: 'Incredible — 80% done! Your risk profile will personalize everything.' },
  { emoji: '✨', text: 'Generating your personalized financial blueprint…' }
];

function updateEncouragement(step) {
  const enc = document.querySelector('.encouragement');
  if (!enc) return;
  const data = ENCOURAGEMENTS[step - 1];
  if (!data) return;
  enc.innerHTML = `<span>${data.emoji}</span><span>${data.text}</span>`;
}

function showToast(message, icon = '✅') {
  let toast = document.getElementById('er-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'er-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function numVal(id) {
  return parseFloat(val(id)) || 0;
}
function formatINR(n) {
  if (isNaN(n)) return '—';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function shortINR(n) {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + 'L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════ */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════════════════════════
   EDUCATION PAGE
══════════════════════════════════════════════════════════════ */
function initEducation() {
  // Tab switching
  document.querySelectorAll('.edu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.edu-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.edu-tab-content').forEach(c => {
        c.style.display = c.dataset.tabContent === target ? 'block' : 'none';
      });
    });
  });

  // Topic modal
  document.querySelectorAll('.topic-card').forEach(card => {
    card.addEventListener('click', () => {
      const topicId = card.dataset.topic;
      openTopicModal(topicId);
    });
  });

  // Modal close
  const overlay = document.querySelector('.topic-modal__overlay');
  const closeBtn = document.querySelector('.topic-modal__close');
  if (overlay) overlay.addEventListener('click', closeTopicModal);
  if (closeBtn) closeBtn.addEventListener('click', closeTopicModal);

  // FAQ accordion
  document.querySelectorAll('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

function openTopicModal(topicId) {
  const modal = document.getElementById('topic-modal');
  if (!modal) return;

  // Load topic data
  const data = TOPIC_DATA[topicId];
  if (!data) return;

  document.getElementById('modal-eyebrow').textContent = data.category;
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-tag').innerHTML = `<span class="badge badge-green">${data.tag}</span>`;
  document.getElementById('modal-body').innerHTML = buildTopicContent(data);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Re-init FAQ and toggle inside modal
  modal.querySelectorAll('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
  modal.querySelectorAll('.toggle-switch input').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const container = toggle.closest('.topic-modal__content');
      container.classList.toggle('eli18-active', toggle.checked);
    });
  });
}

function closeTopicModal() {
  const modal = document.getElementById('topic-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function buildTopicContent(data) {
  return `
    <div class="eli18-toggle">
      <label class="toggle-switch">
        <input type="checkbox">
        <div class="toggle-slider"></div>
      </label>
      <div>
        <div class="eli18-toggle-label">Explain Like I'm 18</div>
        <div class="eli18-toggle-desc">Switch to simple language mode</div>
      </div>
    </div>

    <div class="topic-section">
      <div class="topic-section__title">📖 What is it?</div>
      <div class="content-expert"><p>${data.expertExplanation}</p></div>
      <div class="content-beginner"><p>${data.beginnerExplanation}</p></div>
    </div>

    <div class="real-example">
      <div class="real-example__title">💡 Real-World Example</div>
      <p>${data.realExample}</p>
    </div>

    <div class="fraud-warning" style="margin-bottom:24px;">
      <div class="fraud-warning__title">🛡️ Fraud Protection Tips</div>
      <p>${data.fraudTips}</p>
    </div>

    <div class="topic-section">
      <div class="topic-section__title">❓ Frequently Asked Questions</div>
      <div>
        ${data.faqs.map(f => `
          <div class="faq-item">
            <button class="faq-item__q">
              ${f.q}
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="faq-item__a">${f.a}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* Education topic library */
const TOPIC_DATA = {
  debit: {
    category: 'Online Banking',
    title: 'Debit Cards',
    tag: 'Everyday Banking',
    expertExplanation: 'A debit card is linked directly to your savings or current bank account. When you make a purchase, funds are immediately deducted from your account balance. They operate on payment networks like Visa, Mastercard, or RuPay. They do not offer credit and carry no interest obligation.',
    beginnerExplanation: 'A debit card is like a plastic key to your piggy bank. When you swipe it at a store or ATM, the money comes directly out of your bank account. You can only spend what you actually have.',
    realExample: 'Riya goes to Big Bazaar and pays ₹1,200 using her SBI debit card. The amount is instantly deducted from her ₹15,000 savings account balance. She now has ₹13,800.',
    fraudTips: 'Never share your 4-digit PIN with anyone, including bank staff. Cover the keypad when entering your PIN at ATMs. Report lost/stolen cards immediately by calling 1800 111 109 (SBI helpline). Enable SMS alerts for every transaction. Avoid using debit cards on suspicious websites — use credit cards or UPI for online shopping instead.',
    faqs: [
      { q: 'What\'s the difference between a debit card and credit card?', a: 'Debit cards use your own money (from your bank account). Credit cards use the bank\'s money — you pay it back later, sometimes with interest.' },
      { q: 'What should I do if I see an unauthorized transaction?', a: 'Call your bank immediately (their 24/7 helpline is on the back of the card). Block your card via net banking or the mobile app. File a complaint within 3 days for zero liability coverage.' },
      { q: 'Can I use my debit card internationally?', a: 'Yes, if it has a Visa/Mastercard logo. Enable international transactions via net banking first. Note that foreign currency conversion fees (2–3.5%) apply.' }
    ]
  },
  credit: {
    category: 'Online Banking',
    title: 'Credit Cards',
    tag: 'Borrow & Repay',
    expertExplanation: 'A credit card provides a revolving line of credit issued by a bank or NBFC. Purchases are made against a credit limit; the outstanding balance is due at month end. Unpaid balances attract interest typically ranging 36–42% annually. Credit cards offer purchase protection, reward points, and improve credit score when used responsibly.',
    beginnerExplanation: 'A credit card lets you borrow money from the bank to buy things now and pay later. The bank sets a limit (e.g. ₹50,000). If you pay the full amount by month end, it\'s free! But if you pay less, the bank charges very high interest — up to 3.5% per month.',
    realExample: 'Amit buys a ₹30,000 laptop during a sale using his HDFC credit card with 10% cashback, saving ₹3,000. He pays the full bill before the due date, paying zero interest. The cashback gets credited next month.',
    fraudTips: 'Never give your card number, CVV, or OTP to anyone — banks never ask for these. Enable transaction alerts via SMS. If you receive a "card blocked" call asking for details, hang up immediately and call your bank\'s official number. Watch out for card skimming devices at petrol pumps and ATMs.',
    faqs: [
      { q: 'What is a minimum payment and is it safe to only pay that?', a: 'Minimum payment (usually 5% of outstanding) only avoids late fees but the remaining balance attracts 3–3.5% monthly interest, which compounds quickly. Always pay in full if possible.' },
      { q: 'How does credit score relate to credit cards?', a: 'Using your credit card and paying on time builds your CIBIL score (300–900). A score above 750 helps you get better loan rates. Maxing out your card or missing payments drops your score.' },
      { q: 'Which credit card should I get first?', a: 'Start with a secured credit card or an entry-level card from your own bank (where you have a savings account). Cards like SBI SimplyCLICK or HDFC MoneyBack are good starters.' }
    ]
  },
  netbanking: {
    category: 'Online Banking',
    title: 'Net Banking',
    tag: 'Digital Finance',
    expertExplanation: 'Internet banking (net banking) is a secure digital platform provided by banks that allows customers to perform financial transactions, account management, and service requests via a browser or mobile app. Authentication uses multi-factor methods including login credentials and OTP verification.',
    beginnerExplanation: 'Net banking is your bank on your laptop or phone. You can check your balance, transfer money, pay bills, and open FDs — all from home, without visiting a branch. You need a login ID and password, and the bank sends a secret code (OTP) to your phone for every transaction.',
    realExample: 'Priya forgot to pay her electricity bill. Instead of going to the office, she opens her ICICI net banking app, goes to "Pay Bills," selects BESCOM, enters her account number, and pays ₹1,450 in under 2 minutes.',
    fraudTips: 'Never access net banking on public Wi-Fi. Always type your bank\'s URL directly — never click links from emails or SMS. Official bank websites have "https" and a lock icon. Banks will NEVER send you an email asking you to "verify your account" by clicking a link — these are phishing attacks.',
    faqs: [
      { q: 'What is NEFT, RTGS, and IMPS?', a: 'NEFT: Transfers in batches, takes 30 min–2 hours. RTGS: For large transfers (above ₹2L), instant. IMPS: Instant 24/7 transfer, even on holidays. UPI: Simplest instant transfer using a VPA (virtual payment address).' },
      { q: 'What should I do if I transfer money to the wrong account?', a: 'Call your bank immediately. They can raise a dispute. If the recipient\'s bank cooperates, money may be returned within 7 days. Act fast — there\'s no guarantee after 48 hours.' },
      { q: 'Is net banking safe?', a: 'Yes, if you follow basic precautions: use strong passwords, enable 2FA, never share OTPs, and log out after every session. Banks use 256-bit encryption.' }
    ]
  },
  upi: {
    category: 'Online Banking',
    title: 'UPI Payments',
    tag: 'India\'s Superpower',
    expertExplanation: 'Unified Payments Interface (UPI) is a real-time interbank payment system developed by NPCI. It enables peer-to-peer and merchant transactions using virtual payment addresses (VPAs). Transactions settle in real-time 24/7/365. Daily limits: ₹1 lakh per transaction (up to ₹2L for some use cases).',
    beginnerExplanation: 'UPI is a magical way to send and receive money using just a phone number or a simple ID like "yourname@okicici". You link your bank account to apps like GPay, PhonePe, or Paytm. Scanning a QR code or entering a UPI ID sends money instantly — free of charge!',
    realExample: 'Rohan is at a local sabzi vendor who has a GPay QR code. He scans it, enters ₹85, puts in his 4-digit UPI PIN, and the vendor gets the money in 3 seconds. No cash. No change. No hassle.',
    fraudTips: 'You NEVER need to enter your PIN to RECEIVE money — this is the #1 UPI scam. Scammers send "collect requests" pretending to send you money, but you actually pay them. Never scan QR codes sent by strangers promising cashback. Screen share scams: never install remote access apps while talking to someone about UPI issues.',
    faqs: [
      { q: 'What is the difference between UPI PIN and mPIN?', a: 'UPI PIN is a 4 or 6-digit code set by you to authorize UPI transactions. mPIN is for mobile banking apps. Both are different and must be kept secret.' },
      { q: 'Can I reverse a UPI payment made to the wrong person?', a: 'UPI payments cannot be automatically reversed. You need to contact your bank and file a dispute through your UPI app\'s "Help" section. Recovery isn\'t guaranteed.' },
      { q: 'Is UPI safe for large payments?', a: 'Yes, UPI is NPCI-regulated and uses bank-level encryption. For large amounts, double-check the UPI ID before confirming. Some banks also have cooling periods for new payees.' }
    ]
  },
  cheques: {
    category: 'Offline Banking',
    title: 'Cheques',
    tag: 'Paper Payments',
    expertExplanation: 'A cheque is a negotiable instrument directing a drawee bank to pay a specified sum to the payee. It contains MICR code, account number, IFSC, and signature. Cheques clear through the CTS (Cheque Truncation System), typically in 1 business day. Bounced cheques attract legal penalties under Section 138 of the Negotiable Instruments Act.',
    beginnerExplanation: 'A cheque is like a written promise. You write on a special paper from your bank: "Please pay ₹10,000 to Rahul from my account." You sign it. Rahul takes it to his bank, and within a day, the money moves from your account to his.',
    realExample: 'Sunita is paying her landlord ₹15,000 as rent. She writes a crossed cheque (two parallel lines at the top-left corner, meaning it can only be deposited, not encashed directly), hands it to her landlord, and the money transfers safely.',
    fraudTips: 'Never sign blank cheques — fill in the amount, payee name, and date first. Write "A/C Payee Only" on cheques for added security. Keep your cheque book locked. If a cheque goes missing, request your bank to "stop payment" immediately. Altered cheques (tampered amounts/dates) are illegal.',
    faqs: [
      { q: 'What does "cheque bouncing" mean?', a: 'When you issue a cheque but don\'t have enough balance, the cheque "bounces." This is a criminal offence under Section 138 NI Act — you can be fined up to twice the cheque amount and even imprisoned for up to 2 years.' },
      { q: 'What is a post-dated cheque?', a: 'A cheque dated in the future. Banks cannot encash it before that date. Often used for EMI payments. Valid for 3 months from the date written on it.' },
      { q: 'How long is a cheque valid?', a: 'Cheques are valid for 3 months from the date written. After that, they become "stale" and banks will not accept them.' }
    ]
  },
  loans: {
    category: 'Offline Banking',
    title: 'Bank Loans',
    tag: 'Borrow Responsibly',
    expertExplanation: 'A loan is a financial instrument where a lender disburses a principal amount to a borrower, who repays it with interest over an agreed tenure. Key types: Home Loan (10–30 years), Personal Loan (1–5 years), Vehicle Loan, Education Loan. Interest can be fixed or floating (linked to MCLR or RBI repo rate).',
    beginnerExplanation: 'A loan is when the bank lends you money that you don\'t have right now — like to buy a house or pay for college. You pay it back slowly every month (called EMI), along with extra money (interest) as the bank\'s "fee" for lending.',
    realExample: 'Vikram takes a ₹10 lakh personal loan at 12% for 5 years. His monthly EMI is ₹22,244. Over 5 years, he pays ₹13.35 lakh total — ₹3.35 lakh as interest to the bank.',
    fraudTips: 'Guaranteed loan approvals without credit check are always scams. Never pay "processing fees" upfront to unknown agents — real fees are deducted from the loan amount. Avoid private moneylenders who charge 5–10% monthly interest. Always get a loan sanction letter from the bank directly. Check the lender\'s RBI registration.',
    faqs: [
      { q: 'What is CIBIL score and why does it matter for loans?', a: 'CIBIL score (300–900) measures your creditworthiness. Scores above 750 get best loan rates. Missing EMIs, high credit card usage, and multiple loan applications reduce your score.' },
      { q: 'Should I take a loan to invest?', a: 'Generally no — especially for market investments. If your loan interest (12–18%) exceeds expected investment returns, you lose money. Only exception: home loans, where you gain an asset and tax benefits.' },
      { q: 'What happens if I can\'t repay my loan EMI?', a: 'After 90 days of missed EMIs, the loan becomes NPA (Non-Performing Asset). The bank can legally recover assets (for secured loans), and your CIBIL score drops severely. Contact your bank proactively if you face difficulties.' }
    ]
  },
  emi: {
    category: 'Offline Banking',
    title: 'EMI Structure',
    tag: 'Pay Over Time',
    expertExplanation: 'An Equated Monthly Installment (EMI) is a fixed monthly repayment consisting of principal and interest components. In the early tenure, interest dominates; principal repayment accelerates in later months (amortization effect). Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1). Part-prepayment can significantly reduce total interest outgo.',
    beginnerExplanation: 'EMI means "Equal Monthly Installment." If you borrow ₹1 lakh for a phone, instead of paying everything at once, you pay ₹5,000 every month for 2 years. The total you pay back is more than ₹1 lakh because the bank charges interest — that\'s the cost of spreading payments.',
    realExample: 'Anjali buys a ₹60,000 washing machine on "No Cost EMI" for 12 months — ₹5,000/month. There\'s no visible interest, but the product price is usually inflated upfront. True no-cost EMI exists only if the bank/brand subsidizes it.',
    fraudTips: '"No Cost EMI" is often a marketing term — check if the original price has been inflated. Avoid EMI schemes from unregulated finance apps (many charge hidden fees). Read the loan agreement before signing any EMI documents — especially foreclosure charges. Never pay an EMI agent in cash; always transfer to the official bank account.',
    faqs: [
      { q: 'What happens if I miss an EMI?', a: 'A late fee is charged (usually ₹500–1,000 + 2–3% penalty). It also negatively impacts your CIBIL score. If you miss 3+ EMIs, legal recovery proceedings can begin for secured loans.' },
      { q: 'Is it better to prepay a loan or invest the extra money?', a: 'Compare your loan interest rate vs. expected investment return. If loan rate (e.g., 8.5% home loan) < expected returns (e.g., 12% equity MF), investing makes mathematical sense. But prepayment gives psychological peace.' },
      { q: 'What is a floating rate EMI?', a: 'Floating EMIs change when RBI changes repo rates. If RBI raises rates, your EMI increases. Fixed EMIs stay constant regardless of rate changes but are typically higher to compensate.' }
    ]
  },
  docs: {
    category: 'Offline Banking',
    title: 'Bank Documentation',
    tag: 'Essential Paperwork',
    expertExplanation: 'Banking KYC (Know Your Customer) documentation includes identity proof, address proof, and income proof. The RBI-mandated e-KYC process uses Aadhaar-based OTP verification. For loan applications, additional documents like ITR, salary slips, and bank statements (6 months) are required. Original documents are never permanently kept by banks.',
    beginnerExplanation: 'Banks need to verify who you are (so they don\'t give your money to the wrong person). They ask for ID proof (Aadhaar, PAN) and address proof. This process is called KYC. You only need to do it once per bank, and it\'s usually free.',
    realExample: 'Meera wants to open a savings account at Axis Bank. She brings her Aadhaar card and PAN card, fills a form with her basic details, gets photographed, and her account is activated in 30 minutes. She also gets an app for net banking.',
    fraudTips: 'Never share your Aadhaar OTP with anyone — not even "bank officers" calling you. Banks don\'t ask for passwords or PINs to verify your KYC. Watch out for fake "KYC update" SMS links — these steal your information. Aadhaar biometric lock (on UIDAI website) prevents misuse of your Aadhaar for unauthorized transactions.',
    faqs: [
      { q: 'What is the difference between KYC and e-KYC?', a: 'KYC = physical document submission at the branch. e-KYC = digital verification using your Aadhaar and OTP — can be done from home. Both are equally valid.' },
      { q: 'What documents do I need to open a basic savings account?', a: 'Aadhaar card (identity + address proof), PAN card, 2 passport photos, and an initial deposit (some banks have zero balance accounts like Jan Dhan Yojana).' },
      { q: 'Can my bank account be frozen if KYC is not updated?', a: 'Yes. RBI mandates periodic KYC updates. If overdue, accounts can be restricted for outward transactions. Contact your bank to update via app, video call, or branch visit.' }
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   NAV SCROLL EFFECT
══════════════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.querySelector('.er-nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ══════════════════════════════════════════════════════════════
   PLANNER INIT
══════════════════════════════════════════════════════════════ */
function initPlanner() {
  // Risk option selection
  document.querySelectorAll('.risk-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.risk-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.userData.riskProfile = opt.dataset.risk;
    });
  });

  // Goal options
  document.querySelectorAll('.goal-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.classList.toggle('selected');
    });
  });

  // Income display
  const incomeInput = document.getElementById('input-income');
  const incomeDisplay = document.getElementById('income-display');
  if (incomeInput && incomeDisplay) {
    incomeInput.addEventListener('input', () => {
      const v = parseFloat(incomeInput.value);
      incomeDisplay.textContent = v ? formatINR(v) + '/month' : '';
    });
  }

  // Initial render
  renderStep();
}

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();

  if (document.querySelector('.wizard')) initPlanner();
  if (document.querySelector('.edu-tabs')) initEducation();
});

// Expose to HTML onclick
window.nextStep = nextStep;
window.prevStep = prevStep;
window.goToStep = goToStep;
window.toggleInvCard = toggleInvCard;
window.openTopicModal = openTopicModal;
window.closeTopicModal = closeTopicModal;