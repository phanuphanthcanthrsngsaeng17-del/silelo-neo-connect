/* neo-connect-abilities.js

Exports a single function: module.exports = function(app, requireAuth) { ... }
Registers the following POST endpoints (all protected with requireAuth):
- /api/send-email
- /api/github
- /api/sheets
- /api/summarize
- /api/translate

Uses nodemailer, googleapis, and fetch (global). Summarize/translate attempt to use OpenAI if OPENAI_API_KEY is provided, otherwise fallbacks are used.
*/

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { Buffer } = require('buffer');

// Try to use global fetch (Node 18+). If not available, attempts to require('node-fetch')
let fetchFn = globalThis.fetch;
try {
  if (!fetchFn) {
    // require node-fetch dynamically
    // Note: this may fail in some environments where node-fetch v3 is ESM-only.
    // Many runtimes provide global fetch (Node 18+). If not available, GitHub/Sheets features may fail.
    // Keep this as best-effort.
    fetchFn = require('node-fetch');
  }
} catch (e) {
  fetchFn = globalThis.fetch; // might still be undefined
}

module.exports = function(app, requireAuth) {
  // Helper: send 500 on error with message
  const handleError = (res, err) => {
    console.error(err);
    const msg = err && err.message ? err.message : String(err);
    return res.status(500).json({ error: msg });
  };

  // 1) POST /api/send-email
  app.post('/api/send-email', requireAuth, async (req, res) => {
    try {
      const { to, subject, text, html } = req.body || {};
      if (!to || !subject || (!text && !html)) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, text/html' });
      }

      const user = process.env.GMAIL_USER;
      const pass = process.env.GMAIL_APP_PASSWORD;
      if (!user || !pass) {
        return res.status(500).json({ error: 'GMAIL_USER or GMAIL_APP_PASSWORD not configured in environment' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });

      const mailOptions = {
        from: user,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      return res.json({ ok: true, info });
    } catch (err) {
      return handleError(res, err);
    }
  });

  // 2) POST /api/github
  // body: { action, path, content, message, title, body }
  // actions: getFile, createFile, updateFile, createIssue
  app.post('/api/github', requireAuth, async (req, res) => {
    try {
      const { action } = req.body || {};
      const token = process.env.GITHUB_TOKEN;
      const owner = process.env.GITHUB_OWNER;
      const repo = process.env.GITHUB_REPO;

      if (!token || !owner || !repo) {
        return res.status(500).json({ error: 'GITHUB_TOKEN, GITHUB_OWNER or GITHUB_REPO not configured' });
      }
      if (!action) return res.status(400).json({ error: 'Missing action in body' });

      const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
      const headers = {
        Authorization: `token ${token}`,
        'User-Agent': 'neo-connect-abilities',
        Accept: 'application/vnd.github.v3+json',
      };

      if (action === 'getFile') {
        const { path } = req.body;
        if (!path) return res.status(400).json({ error: 'Missing path for getFile' });
        const url = `${apiBase}/contents/${encodeURIComponent(path)}`;
        const r = await fetchFn(url, { headers });
        if (!r.ok) {
          const text = await r.text();
          return res.status(r.status).json({ error: text });
        }
        const data = await r.json();
        // GitHub returns content base64
        return res.json({ ok: true, data });
      }

      if (action === 'createFile' || action === 'updateFile') {
        const { path, content, message } = req.body;
        if (!path || content == null || !message) return res.status(400).json({ error: 'Missing path/content/message for createFile/updateFile' });

        let sha;
        if (action === 'updateFile') {
          // Need to fetch current file to get sha
          const getUrl = `${apiBase}/contents/${encodeURIComponent(path)}`;
          const getRes = await fetchFn(getUrl, { headers });
          if (!getRes.ok) {
            const txt = await getRes.text();
            return res.status(getRes.status).json({ error: txt });
          }
          const getData = await getRes.json();
          sha = getData.sha;
        }

        const putUrl = `${apiBase}/contents/${encodeURIComponent(path)}`;
        const body = {
          message,
          content: Buffer.from(content, 'utf8').toString('base64'),
        };
        if (sha) body.sha = sha;

        const r = await fetchFn(putUrl, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok) {
          return res.status(r.status).json({ error: data });
        }
        return res.json({ ok: true, data });
      }

      if (action === 'createIssue') {
        const { title, body: issueBody } = req.body;
        if (!title) return res.status(400).json({ error: 'Missing title for createIssue' });
        const url = `${apiBase}/issues`;
        const r = await fetchFn(url, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body: issueBody }),
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json({ error: data });
        return res.json({ ok: true, data });
      }

      return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
      return handleError(res, err);
    }
  });

  // 3) POST /api/sheets
  // body: { action: 'read'|'append', range, values }
  app.post('/api/sheets', requireAuth, async (req, res) => {
    try {
      const { action, range, values } = req.body || {};
      const sheetId = process.env.SHEET_ID;
      const svcJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!sheetId || !svcJson) return res.status(500).json({ error: 'SHEET_ID or GOOGLE_SERVICE_ACCOUNT_JSON not configured' });

      const key = JSON.parse(svcJson);
      const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const client = await auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: client });

      if (action === 'read') {
        if (!range) return res.status(400).json({ error: 'Missing range for read' });
        const r = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
        return res.json({ ok: true, data: r.data });
      }

      if (action === 'append') {
        if (!range || !Array.isArray(values)) return res.status(400).json({ error: 'Missing range or values (array) for append' });
        const r = await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: { values },
        });
        return res.json({ ok: true, data: r.data });
      }

      return res.status(400).json({ error: 'Unknown action for sheets' });
    } catch (err) {
      return handleError(res, err);
    }
  });

  // 4) POST /api/summarize
  // body: { text }
  app.post('/api/summarize', requireAuth, async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text) return res.status(400).json({ error: 'Missing text' });

      // If OPENAI_API_KEY is set, use OpenAI Chat Completions for summarization
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey && fetchFn) {
        const payload = {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that summarizes text concisely.' },
            { role: 'user', content: `Summarize the following text in a concise paragraph:\n\n${text}` },
          ],
          max_tokens: 200,
          temperature: 0.3,
        };

        const r = await fetchFn('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json({ error: data });
        const summary = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content.trim() : null;
        return res.json({ ok: true, summary });
      }

      // Fallback: simple heuristic summary (first 300 chars or first 3 sentences)
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const summary = sentences.slice(0, 3).join(' ').slice(0, 300);
      return res.json({ ok: true, summary });
    } catch (err) {
      return handleError(res, err);
    }
  });

  // 5) POST /api/translate
  // body: { text, targetLang }
  app.post('/api/translate', requireAuth, async (req, res) => {
    try {
      const { text, targetLang } = req.body || {};
      if (!text || !targetLang) return res.status(400).json({ error: 'Missing text or targetLang' });

      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey && fetchFn) {
        const prompt = `Translate the following text to ${targetLang}. Keep meaning intact and return only the translation.\n\n${text}`;
        const payload = {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful translator.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1000,
          temperature: 0.0,
        };
        const r = await fetchFn('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json({ error: data });
        const translated = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content.trim() : null;
        return res.json({ ok: true, translated });
      }

      // Fallback: use LibreTranslate public API as a free option
      if (fetchFn) {
        const r = await fetchFn('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' }),
        });
        if (r.ok) {
          const data = await r.json();
          return res.json({ ok: true, translated: data.translatedText });
        }
      }

      // Last resort: return original text with note
      return res.json({ ok: true, translated: text, note: 'No translation provider configured; returned original text' });
    } catch (err) {
      return handleError(res, err);
    }
  });
};
