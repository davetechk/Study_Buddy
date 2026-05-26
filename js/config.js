// ============================================================================
//  config.js — Supabase connection + shared client
//  This is the ONLY place your project URL and anon key live.
// ============================================================================

const SUPABASE_URL = "https://dlifbespbzovkanmyzeq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaWZiZXNwYnpvdmthbm15emVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTUxOTMsImV4cCI6MjA5NTM3MTE5M30.G2QtRH4yMkJYlYJ8m5Ozl5xtoJv52jl00wAFCfo9SaA";

// The Supabase JS library is loaded from a CDN in each HTML file before this.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- tiny helpers shared everywhere ----
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function go(page) { window.location.href = page; }

// Require a logged-in visitor; redirect to login if not. Returns the user.
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { go("index.html"); return null; }
  return session.user;
}

// Friendly date like "12 May"
function niceDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch { return ""; }
}

// Toast / inline message helper
function flash(el, msg, kind = "error") {
  if (!el) return;
  el.textContent = msg;
  el.className = "flash flash--" + kind;
  el.style.display = msg ? "block" : "none";
}
