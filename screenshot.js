const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Wait for the server to render the page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Take screenshot
  await page.screenshot({ path: 'frontend-snapshot.png', fullPage: true });

  await browser.close();
  
  console.log('Screenshot saved to frontend-snapshot.png');
})();
