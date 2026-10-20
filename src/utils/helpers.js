export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function displayPrice(price) {
  return formatPrice(Math.round(price * 1.4));
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  const cleaned = phone.replace(/\s/g, '');
  if (!/^[6-9]\d{9}$/.test(cleaned)) return false;
  // Reject all-same-digit numbers (e.g. 9999999999, 8888888888)
  if (/^(\d)\1{9}$/.test(cleaned)) return false;
  return true;
}

export function validatePincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

export function validateRequired(value) {
  return value && value.trim().length > 0;
}

export function validateCardNumber(number) {
  return /^\d{16}$/.test(number.replace(/\s/g, ''));
}

export function validateExpiry(expiry) {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
}

export function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

// Levenshtein edit distance between two strings
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Max allowed typos based on word length
function maxTypos(len) {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  return 2;
}

// Check if a product matches the search query (exact substring OR fuzzy per-word)
export function fuzzyMatch(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  // Fast path: exact substring
  if (t.includes(q)) return true;
  // Per-word fuzzy: every query word must match at least one text word
  const queryWords = q.split(/\s+/);
  const textWords = t.split(/\s+/);
  return queryWords.every(qw =>
    textWords.some(tw => {
      if (tw.includes(qw) || qw.includes(tw)) return true;
      const allowed = maxTypos(qw.length);
      return allowed > 0 && editDistance(qw, tw) <= allowed;
    })
  );
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function simulateAsync(data, delay = 800) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

export function validatePAN(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase());
}

export function validateGST(gst) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.toUpperCase());
}

export function validateCIN(cin) {
  if (!cin) return true;
  return /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin.toUpperCase());
}

export function validateURL(url) {
  if (!url) return true;
  try { new URL(url); return true; } catch { return false; }
}
