require("dotenv").config();

console.log("== ENV CHECK ==");
console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "undefined") {
  console.log("Key starts with:", process.env.GEMINI_API_KEY.substring(0, 5) + "...");
} else {
  console.log("🚨 key is missing or undefined string!");
}
console.log("===============");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const path = require("path");

// ✅ Initialize the new PDF Extractor safely at the top level
const { PDFExtract } = require("pdf.js-extract");
const pdfExtract = new PDFExtract();

// ✅ FIX: ensure fetch works in all Node versions
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ==========================================
// 🚨 FAIL-SAFE: CHECK FOR API KEY 🚨
// ==========================================
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "undefined") {
  console.error("\n❌ ERROR: Gemini API Key is missing!");
  console.error("Make sure your file is named exactly '.env'");
  console.error("It must be in the same folder as server.js");
  console.error("Format:");
  console.error("GEMINI_API_KEY=your_key_here\n");
  process.exit(1);
} else {
  console.log("\n✅ SUCCESS: Gemini API Key found!");
}

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increased limit for JSON payloads
app.use(express.static("."));  // Serve HTML/JS from the same directory

// ==========================================
// INIT GEMINI & MULTER (CSV & PDF UPLOAD)
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow both CSV and PDF files
    if (!file.originalname.match(/\.(csv|pdf)$/i)) {
      return cb(new Error("Only CSV and PDF files are allowed"));
    }
    cb(null, true);
  },
});

async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

// ============================================================================
// ========================== ORIGINAL WEBSITE ROUTES =========================
// ============================================================================

// ── 1. YAHOO FINANCE PRICE ENDPOINT ──
app.get("/price/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase() + ".NS";
    console.log(`[PRICE API] Fetching quote for: ${symbol}`);

    // Level 2 Fix: Use yahoo-finance2 for reliability
    const quote = await yahooFinance.quote(symbol);
    const price = quote?.regularMarketPrice;

    if (!price) {
      console.warn(`[PRICE API] No price found for ${symbol}`);
      return res.status(404).json({ error: "Invalid symbol or no data" });
    }

    console.log(`[PRICE API] SUCCESS: ${symbol} = ₹${price}`);
    res.json({ price, isLive: true });
  } catch (err) {
    console.error(`[PRICE API ERROR] for ${req.params.symbol}:`, err.message || err);
    res.status(500).json({ 
      error: "Failed to fetch price", 
      details: err.message || "Internal server error" 
    });
  }
});

// ── 2. AI ASSISTANT ENDPOINT (MAIN DASHBOARD CHAT) ──
// app.post("/ai", async (req, res) => {
//   try {
//     const { message, context } = req.body;
//     if (!message) return res.status(400).json({ reply: "Message is required" });

//     const systemPrompt = `
// You are a friendly, intelligent, and human-like AI assistant integrated into an investment dashboard.
// You can handle normal chat and investment analysis.
// PORTFOLIO DATA: ${context && context.hasData ? JSON.stringify(context, null, 2) : "No portfolio data provided."}
// `;

//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       systemInstruction: systemPrompt,
//     });

//     const result = await model.generateContent(message);
//     const reply = result?.response?.text() || "No response generated";

//     res.json({ reply });
//   } catch (error) {
//     console.error("Gemini AI Error:", error.message, error);
//     res.status(500).json({ reply: "I'm having trouble connecting right now. Please try again." });
//   }
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
})

// ── 2. AI ASSISTANT ENDPOINT (MAIN DASHBOARD CHAT) ──
app.post("/ai", async (req, res) => {
  console.log("\n[POST /ai] 1. Route hit");
  try {
    const { message, context } = req.body;
    console.log("[POST /ai] 2. Payload received. Message size:", message ? message.length : "N/A");
    
    if (!message) {
      console.log("[POST /ai] ❌ Rejecting: missing message");
      return res.status(400).json({ reply: "Message is required" });
    }

    const systemPrompt = `
You are a friendly, intelligent, and human-like AI assistant integrated into an investment dashboard.
You can handle normal chat and investment analysis.
PORTFOLIO DATA: ${context && context.hasData ? JSON.stringify(context, null, 2) : "No portfolio data provided."}
`;

    console.log("[POST /ai] 3. Initialize model gemini-1.5-flash");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    console.log("[POST /ai] 4. Calling model.generateContent...");
    const result = await model.generateContent(message);
    
    console.log("[POST /ai] 5. Response received from Gemini");
    const reply = result?.response?.text() || "No response generated";

    console.log("[POST /ai] 6. Sending successful reply to frontend");
    res.json({ reply });
  } catch (error) {
    console.error("\n[POST /ai] ❌ SEVERE ERROR in /ai route:");
    console.error(error);
    res.status(500).json({ reply: "I'm having trouble connecting right now. Please try again." });
  }
});

// ============================================================================
// ========================== PLANNER ANALYSIS ROUTES =========================
// ============================================================================

// ── Route: CSV Upload + Parse ──
app.post("/api/upload-csv", upload.single("csv"), (req, res) => {
  try {
    const raw = req.file.buffer.toString("utf-8");
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

    const transactions = records.map((row, i) => {
      const keys = Object.keys(row).map((k) => k.toLowerCase());
      const get = (candidates) => {
        for (const c of candidates) {
          const k = keys.find((k) => k.includes(c));
          if (k) return row[Object.keys(row)[keys.indexOf(k)]] || "";
        }
        return "";
      };

      const debit = parseFloat((get(["debit", "withdrawal", "dr"]) || "0").replace(/[,₹]/g, "")) || 0;
      const credit = parseFloat((get(["credit", "deposit", "cr"]) || "0").replace(/[,₹]/g, "")) || 0;
      const bal = parseFloat((get(["balance"]) || "0").replace(/[,₹]/g, "")) || 0;
      const desc = get(["description", "narration", "particulars", "remarks"]);
      const date = get(["date", "txn date", "transaction date"]);

      return {
        id: i + 1, date, desc, debit, credit, balance: bal, category: autoCategory(desc),
      };
    });

    const summary = buildSummary(transactions);
    res.json({ transactions, summary });
  } catch (err) {
    console.error("CSV parse error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ── Route: Tax Insights ──
app.post("/api/tax-insights", async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) return res.status(400).json({ error: "summary required" });

    const prompt = buildTaxPrompt(summary);
    const raw = await callGemini(prompt);
    res.json(safeParse(raw, { insights: extractInsightsFromText(raw) }));
  } catch (err) {
    res.status(500).json({ error: "Gemini API error", details: err.message });
  }
});

// ── Route: Investment Suggestions ──
app.post("/api/investment-suggestions", async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) return res.status(400).json({ error: "summary required" });

    const prompt = buildInvestPrompt(summary);
    const raw = await callGemini(prompt);
    res.json(safeParse(raw, { recommendations: extractRecsFromText(raw) }));
  } catch (err) {
    res.status(500).json({ error: "Gemini API error", details: err.message });
  }
});

// ── Route: AIS vs Bank Reconciliation ──
app.post("/api/reconcile", upload.fields([
  { name: "aisPdf", maxCount: 1 },
  { name: "bankPdf", maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files['aisPdf'] || !req.files['bankPdf']) {
      return res.status(400).json({ error: "Both AIS and Bank PDFs are required." });
    }

    // 1. Extract raw data from both PDFs using the new library
    const aisRaw = await pdfExtract.extractBuffer(req.files['aisPdf'][0].buffer);
    const bankRaw = await pdfExtract.extractBuffer(req.files['bankPdf'][0].buffer);

    // 2. Helper function to stitch the text together from the PDF pages
    const extractText = (pdfData) => {
      if (!pdfData || !pdfData.pages) return "";
      return pdfData.pages
        .map(page => page.content.map(item => item.str).join(" "))
        .join("\n");
    };

    // 3. Format and limit the text for Gemini
    const aisText = extractText(aisRaw).substring(0, 15000);
    const bankText = extractText(bankRaw).substring(0, 15000);

    const prompt = `
You are an expert Indian Tax Auditor. Compare the following AIS document text and Bank Statement text.
Find discrepancies in interest, dividends, and high-value transactions.
Return EXACTLY this JSON structure — no markdown, no extra text:

{
  "riskScore": "Low" | "Medium" | "High",
  "riskPercentage": <number between 10 and 95>,
  "discrepancies": [
    {
      "title": "Short title",
      "text": "Detailed explanation of the mismatch or match",
      "type": "warning" | "success",
      "action": "Optional: Cause or action to take (omit if success)"
    }
  ]
}

--- AIS TEXT ---
${aisText}

--- BANK STATEMENT TEXT ---
${bankText}
    `;

//     // Use 1.5-flash strictly for this new feature so nothing else is affected
// const reconcileModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// const result = await reconcileModel.generateContent(prompt);
// const rawResponse = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

// FIX: Changed model from "gemini-2.5-flash" to "gemini-1.5-flash"
    const reconcileModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await reconcileModel.generateContent(prompt);
    const rawResponse = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();


    const parsed = safeParse(rawResponse, { riskScore: "High", riskPercentage: 90, discrepancies: [] });

    res.json(parsed);
  } catch (err) {
    console.error("Reconciliation error:", err);
    res.status(500).json({ error: "Failed to reconcile documents" });
  }
});

// ============================================================================
// ========================== PLANNER AI HELPER FUNCTIONS =====================
// ============================================================================

function buildTaxPrompt(summary) {
  const { totalDebit, totalCredit, categories, count } = summary;
  const savings = totalCredit - totalDebit;
  const catSummary = Object.entries(categories || {}).map(([k, v]) => `${k}: ₹${v.toFixed(0)}`).join(", ");

  return `
You are a certified Indian tax advisor. Analyse this spending summary and return EXACTLY this JSON structure:
{ "insights": [ { "title": "...", "body": "..." } ] }
Spend: ₹${totalDebit?.toFixed(0)||0}, Income: ₹${totalCredit?.toFixed(0)||0}, Savings: ₹${savings?.toFixed(0)||0}. Breakdown: ${catSummary}
`.trim();
}

function buildInvestPrompt(summary) {
  const { totalDebit, totalCredit, categories, count } = summary;
  const surplus = totalCredit - totalDebit;
  const catSummary = Object.entries(categories || {}).map(([k, v]) => `${k}: ₹${v.toFixed(0)}`).join(", ");

  return `
You are a certified Indian financial planner. Analyse this spending data and return EXACTLY this JSON structure:
{ "recommendations": [ { "title": "...", "description": "..." } ] }
Spend: ₹${totalDebit?.toFixed(0)||0}, Income: ₹${totalCredit?.toFixed(0)||0}, Surplus: ₹${surplus?.toFixed(0)||0}. Breakdown: ${catSummary}
`.trim();
}

function autoCategory(desc) {
  if (!desc) return "Other";
  const d = desc.toLowerCase();
  const rules = [
    { cat: "Food", keys: ["zomato", "swiggy", "dominos", "restaurant", "cafe", "food", "eat"] },
    { cat: "Travel", keys: ["uber", "ola", "rapido", "irctc", "airline", "flight", "bus", "train", "metro", "cab", "petrol", "fuel"] },
    { cat: "Shopping", keys: ["amazon", "flipkart", "myntra", "ajio", "nykaa", "shop", "mart", "mall", "bigbasket", "blinkit", "zepto"] },
    { cat: "Utilities", keys: ["electricity", "water", "gas", "broadband", "airtel", "jio", "vi", "recharge", "bill", "emi", "loan", "insurance"] },
    { cat: "Health", keys: ["pharmacy", "medical", "hospital", "clinic", "doctor", "health", "apollo", "1mg", "netmeds"] },
  ];
  for (const r of rules) {
    if (r.keys.some((k) => d.includes(k))) return r.cat;
  }
  return "Other";
}

function buildSummary(transactions) {
  const totalDebit = transactions.reduce((s, t) => s + t.debit, 0);
  const totalCredit = transactions.reduce((s, t) => s + t.credit, 0);
  const categories = {};
  transactions.forEach((t) => {
    if (t.debit > 0) categories[t.category] = (categories[t.category] || 0) + t.debit;
  });
  return { totalDebit, totalCredit, categories, count: transactions.length };
}

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function extractInsightsFromText(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const insights = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    insights.push({ title: lines[i].replace(/^[-*#\d.]+\s*/, ""), body: lines[i + 1] || "" });
  }
  return insights.length ? insights : [{ title: "Tax Analysis", body: text }];
}

function extractRecsFromText(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const recs = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    recs.push({ title: lines[i].replace(/^[-*#\d.]+\s*/, ""), description: lines[i + 1] || "" });
  }
  return recs.length ? recs : [{ title: "Investment Suggestion", description: text }];
}

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`\n🚀 EveryRupee Server running on http://localhost:${PORT}`);
  console.log(`📈 Price API: http://localhost:${PORT}/price/:symbol`);
  console.log(`🤖 Chat AI API: http://localhost:${PORT}/ai`);
  console.log(`📝 Planner APIs loaded (CSV Upload, Tax Insights, Investments)\n`);
});

module.exports = app;