// content.js — runs on every webpage automatically

// Step 1: Wait for the page to fully load before we start reading it
window.addEventListener('load', () => {

  // Step 2: Get ALL the text visible on this page
  const pageText = document.body.innerText.toLowerCase();

  // Step 3: List of keywords that suggest a cookie banner exists
  const cookieKeywords = [
    'we use cookies',
    'this site uses cookies',
    'cookie policy',
    'accept cookies',
    'cookie consent',
    'privacy policy',
    'gdpr',
    'personal data'
  ];

  // Step 4: Check if ANY of those keywords appear on this page
  const hasCookieBanner = cookieKeywords.some(
    keyword => pageText.includes(keyword)
  );
  // Step 5: Try to find a privacy policy link on the page
  const allLinks = document.querySelectorAll('a');
  let privacyLink = null;

  allLinks.forEach(link => {
    const text = link.innerText.toLowerCase();
    const href = link.href.toLowerCase();
    if (text.includes('privacy') || href.includes('privacy')) {
      privacyLink = link.href;
    }
  });

  // Step 6: Send what we found to background.js
  chrome.runtime.sendMessage({
    type: 'PAGE_SCANNED',
    hasCookieBanner: hasCookieBanner,
    privacyLink: privacyLink,
    url: window.location.href
  });
});