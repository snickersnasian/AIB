let reviews = [];
const statusEl = document.getElementById('status');
const reviewDisplay = document.getElementById('reviewDisplay');
const analyzeBtn = document.getElementById('analyzeBtn');
const hfTokenInput = document.getElementById('hfToken');
const iconEl = document.getElementById('icon');
const labelEl = document.getElementById('label');
const scoreEl = document.getElementById('score');
const errorMsgEl = document.getElementById('errorMsg');

function setStatus(text) {
  statusEl.textContent = text;
}

function setError(text) {
  if (!text) { errorMsgEl.style.display = 'none'; errorMsgEl.textContent = ''; return; }
  errorMsgEl.style.display = 'block';
  errorMsgEl.textContent = text;
}

function resetResultDisplay() {
  iconEl.className = 'iconCircle';
  iconEl.innerHTML = '<i class="fa-solid fa-question"></i>';
  labelEl.textContent = 'Sentiment: —';
  scoreEl.textContent = 'Confidence: —';
  setError('');
}

function displayReview(text) {
  reviewDisplay.textContent = text || '—';
}

function setResult(kind, conf) {
  const confStr = typeof conf === 'number' ? (conf*100).toFixed(1) + '%' : '—';
  scoreEl.textContent = `Confidence: ${confStr}`;
  if (kind === 'positive') {
    iconEl.className = 'iconCircle positive';
    iconEl.innerHTML = '<i class="fa-solid fa-thumbs-up"></i>';
    labelEl.textContent = 'Sentiment: Positive';
  } else if (kind === 'negative') {
    iconEl.className = 'iconCircle negative';
    iconEl.innerHTML = '<i class="fa-solid fa-thumbs-down"></i>';
    labelEl.textContent = 'Sentiment: Negative';
  } else {
    iconEl.className = 'iconCircle neutral';
    iconEl.innerHTML = '<i class="fa-solid fa-question"></i>';
    labelEl.textContent = 'Sentiment: Neutral';
  }
}

function chooseRandomReview() {
  if (!reviews || reviews.length === 0) return null;
  const idx = Math.floor(Math.random() * reviews.length);
  return reviews[idx];
}

async function analyzeReviewText(text) {
  const token = hfTokenInput.value.trim();
  const url = 'https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: text })
    });
    if (!resp.ok) {
      let errText = `API error: ${resp.status} ${resp.statusText}`;
      try { const body = await resp.json(); if (body && body.error) errText += ` — ${body.error}`; } catch(e){}
      throw new Error(errText);
    }
    const data = await resp.json();
    return data;
  } catch (err) {
    throw err;
  }
}

function interpretApiResponse(data) {
  if (!data) return { kind: 'neutral', score: null };
  let candidate = null;
  if (Array.isArray(data) && data.length > 0) {
    if (Array.isArray(data[0]) && data[0].length>0 && data[0][0].label) {
      candidate = data[0][0];
    } else if (data[0].label) {
      candidate = data[0];
    } else if (typeof data[0] === 'object' && Object.values(data[0]).every(v => Array.isArray(v))) {
      const inner = Object.values(data[0])[0];
      if (Array.isArray(inner) && inner[0] && inner[0].label) candidate = inner[0];
    }
  }
  if (!candidate) return { kind: 'neutral', score: null };
  const label = String(candidate.label || '').toUpperCase();
  const score = typeof candidate.score === 'number' ? candidate.score : parseFloat(candidate.score) || 0;
  if (label === 'POSITIVE' && score > 0.5) return { kind: 'positive', score };
  if (label === 'NEGATIVE' && score > 0.5) return { kind: 'negative', score };
  return { kind: 'neutral', score };
}

async function onAnalyzeClick() {
  resetResultDisplay();
  setError('');
  if (!reviews || reviews.length === 0) {
    setError('No reviews loaded.');
    return;
  }
  analyzeBtn.disabled = true;
  setStatus('Selecting random review…');
  const chosen = chooseRandomReview();
  displayReview(chosen || '—');
  setStatus('Analyzing review via Hugging Face Inference API…');
  try {
    const apiData = await analyzeReviewText(chosen || '');
    const interpreted = interpretApiResponse(apiData);
    setResult(interpreted.kind, interpreted.score);
    setStatus('Done.');
  } catch (err) {
    setError(err.message || String(err));
    setStatus('Error during analysis.');
  } finally {
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener('click', onAnalyzeClick);

async function loadTSV() {
  try {
    setStatus('Fetching reviews_test.tsv …');
    const resp = await fetch('reviews_test.tsv');
    if (!resp.ok) throw new Error(`Failed to fetch reviews_test.tsv (${resp.status})`);
    const text = await resp.text();
    setStatus('Parsing TSV with Papa Parse …');
    const parsed = Papa.parse(text, { header: true, delimiter: '\t', skipEmptyLines: true });
    const data = parsed && parsed.data ? parsed.data : [];
    const extracted = data.map(row => {
      if (row && typeof row === 'object') {
        if ('text' in row) return String(row['text']).trim();
        const keys = Object.keys(row);
        if (keys.length === 1) return String(row[keys[0]]).trim();
      }
      return '';
    }).filter(Boolean);
    reviews = extracted;
    if (reviews.length === 0) {
      setStatus('No reviews found in TSV.');
      displayReview('No reviews found in reviews_test.tsv (ensure a "text" column exists).');
    } else {
      setStatus(`Loaded ${reviews.length} reviews. Click "Analyze random review" to begin.`);
      displayReview('Ready — click "Analyze random review".');
    }
  } catch (err) {
    setStatus('Failed to load TSV.');
    setError(err.message || String(err));
    displayReview('Failed to load reviews_test.tsv');
  }
}

loadTSV();
