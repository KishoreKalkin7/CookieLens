// background.js — CookieLens FINAL VERSION

const GROQ_KEY = 'Your Grok API Key'; // paste your Groq key here

// ─── FETCH PRIVACY POLICY TEXT ────────────────────────────────────────────

async function fetchPolicyText(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    return text;

  } catch (err) {
    console.log('Could not fetch policy:', err);
    return null;
  }
}

// ─── ANALYSE WITH GROQ AI ─────────────────────────────────────────────────

async function analyseWithClaude(policyText) {

  const prompt = `You are a privacy policy analyst.
Analyse this privacy policy and respond ONLY with valid JSON.
No explanation, no markdown, just the JSON object.

Return this exact structure:
{
  "score": (number 1-10, where 10 is most invasive),
  "verdict": ("GREEN", "AMBER", or "RED"),
  "summary": (2 sentence plain English summary),
  "collected": (array of max 4 data types collected),
  "shared_with": (array of max 3 third party types),
  "dpdp_concern": (one sentence about India DPDP Act relevance)
}

Privacy policy text:
${policyText}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data));

    if (data.error) {
      console.log('Groq error:', data.error.message);
      return null;
    }

    const text = data.choices[0].message.content;
    console.log('Raw text from Groq:', text);

    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);

  } catch (err) {
    console.log('Fetch failed:', err.message);
    return null;
  }
}

// ─── MESSAGE LISTENER ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'PAGE_SCANNED' && message.privacyLink) {

    chrome.storage.local.set({ scanResult: { status: 'loading' } });

    (async () => {

      // Cache check — skip API if already analysed this URL
      const cacheKey = 'cache_' + btoa(message.url).slice(0, 20);
      const cached = await chrome.storage.local.get(cacheKey);

      if (cached[cacheKey]) {
        console.log('Using cached result for', message.url);
        chrome.storage.local.set({ scanResult: cached[cacheKey] });
        return;
      }

      // Fetch policy text
      const policyText = await fetchPolicyText(message.privacyLink);

      if (!policyText) {
        chrome.storage.local.set({ scanResult: { status: 'error' } });
        return;
      }

      // Analyse with Groq
      const analysis = await analyseWithClaude(policyText);

      if (!analysis) {
        chrome.storage.local.set({ scanResult: { status: 'error' } });
        return;
      }

      // Save result to storage
      chrome.storage.local.set({
        scanResult: {
          status: 'done',
          url: message.url,
          ...analysis
        }
      });

      console.log('Analysis complete:', analysis);

      // Save to cache so next visit is instant
      chrome.storage.local.set({
        [cacheKey]: { status: 'done', url: message.url, ...analysis }
      });

      // Set badge on extension icon
      const badgeColors = {
        GREEN: '#1D9E75',
        AMBER: '#E6931A',
        RED:   '#E63E1A'
      };

      const tabId = sender.tab.id;

      chrome.action.setBadgeText({
        text: analysis.score.toString(),
        tabId
      });

      chrome.action.setBadgeBackgroundColor({
        color: badgeColors[analysis.verdict] || '#888',
        tabId
      });

    })();
  }

  return true; // keeps message channel open for async
});