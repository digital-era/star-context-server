const express = require('express');
const cors = require('cors');
const axios = require('axios');

const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const { YoutubeTranscript }
= require('youtube-transcript');

const puppeteer = require('puppeteer-extra');

const StealthPlugin =
require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();

app.use(cors());

const PORT =
process.env.PORT || 3000;

app.get('/', (req, res) => {
res.send('Star Context Parser Running');
});

// ─────────────────────────────
// Readability
// ─────────────────────────────

app.get('/readability', async (req, res) => {

try {

```
const url = req.query.url;

const response =
  await axios.get(url);

const dom = new JSDOM(response.data, {
  url
});

const reader =
  new Readability(
    dom.window.document
  );

const article = reader.parse();

res.json({
  title: article?.title || '',
  content: article?.textContent || ''
});
```

} catch (e) {

```
res.status(500).json({
  error: e.message
});
```

}
});

// ─────────────────────────────
// YouTube Transcript
// ─────────────────────────────

app.get('/youtube', async (req, res) => {

try {

```
const url = req.query.url;

const transcript =
  await YoutubeTranscript.fetchTranscript(url);

const text =
  transcript
    .map(t => t.text)
    .join(' ');

res.json({
  title: 'YouTube Transcript',
  transcript: text
});
```

} catch (e) {

```
res.status(500).json({
  error: e.message
});
```

}
});

// ─────────────────────────────
// WeChat Puppeteer
// ─────────────────────────────

app.get('/wechat', async (req, res) => {

let browser;

try {

```
const url = req.query.url;

browser =
  await puppeteer.launch({

    headless: 'new',

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

const page =
  await browser.newPage();

await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
);

await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 60000
});

await page.waitForTimeout(3000);

const content =
  await page.evaluate(() => {

    return {
      title: document.title,
      content: document.body.innerText
    };
  });

await browser.close();

res.json(content);
```

} catch (e) {

```
if (browser) {
  await browser.close();
}

res.status(500).json({
  error: e.message
});
```

}
});

app.listen(PORT, () => {

console.log(
`Server running on ${PORT}`
);
});
