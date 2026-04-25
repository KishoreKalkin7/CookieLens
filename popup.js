// popup.js — reads from storage and renders the UI

function render(result) {
  const content = document.getElementById('content');

  // No scan yet
  if (!result || !result.status) {
    content.innerHTML = `
      <div class="state-box">
        <div class="icon">🍪</div>
        <div class="state-title">No scan yet</div>
        Visit any website and CookieLens will automatically analyse its privacy policy.
      </div>`;
    return;
  }

  // Loading
  if (result.status === 'loading') {
    content.innerHTML = `
      <div class="state-box">
        <div class="icon">⏳</div>
        <div class="state-title">Analysing...</div>
        Reading the privacy policy and calculating your risk score.
      </div>`;
    return;
  }

  // Error
  if (result.status === 'error') {
    content.innerHTML = `
      <div class="state-box">
        <div class="icon">⚠️</div>
        <div class="state-title">Could not analyse</div>
        No privacy policy link found on this page, or the page blocked access.
      </div>`;
    return;
  }

  // Done — show the full result
  const verdict = result.verdict || 'AMBER';
  const score = result.score || '?';
  const verdictLabel = verdict === 'GREEN' ? '✅ Low Risk' : verdict === 'AMBER' ? '⚠️ Medium Risk' : '🔴 High Risk';

  content.innerHTML = `
    <div class="score-section ${verdict}">
      <div class="score-circle">
        <div class="score-number">${score}</div>
        <div class="score-label">/ 10</div>
      </div>
      <div class="score-info">
        <div class="verdict">${verdictLabel}</div>
        <div class="summary">${result.summary || ''}</div>
      </div>
    </div>

    <div class="info-block">
      <div class="block-title">Data collected</div>
      <div class="tag-row">
        ${(result.collected || []).map(item => `<span class="tag">${item}</span>`).join('')}
      </div>
    </div>

    <div class="info-block">
      <div class="block-title">Shared with</div>
      <div class="tag-row">
        ${(result.shared_with || []).map(item => `<span class="tag">${item}</span>`).join('')}
      </div>
    </div>

    <div class="info-block">
      <div class="dpdp-badge">🇮🇳 DPDP Act 2023</div>
      <div class="dpdp-text">${result.dpdp_concern || ''}</div>
    </div>

    <div class="url-text">${result.url || ''}</div>
  `;
}

// Read the latest scan result from storage and render it
chrome.storage.local.get('scanResult', (data) => {
  render(data.scanResult);
});