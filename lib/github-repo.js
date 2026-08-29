'use strict';

const API = 'https://api.github.com';

function config() {
  return {
    token: String(process.env.GITHUB_TOKEN || '').trim(),
    owner: String(process.env.GITHUB_OWNER || 'phanuphanthcanthrsngsaeng17-del').trim(),
    repo: String(process.env.GITHUB_REPO || 'silelo-neo-connect').trim(),
  };
}

function headers() {
  const h = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SILELO-Neo-Connect-GitHub',
  };
  if (config().token) h.Authorization = `Bearer ${config().token}`;
  return h;
}

function pathPart(value, name) {
  const v = String(value || '').trim();
  if (!v || v.length > 200 || /[\r\n]/.test(v)) throw new Error(`invalid ${name}`);
  return v;
}

function repoInput(input = {}) {
  const c = config();
  return {
    owner: pathPart(input.owner || c.owner, 'owner'),
    repo: pathPart(input.repo || c.repo, 'repo'),
  };
}

async function githubFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(Number(options.timeoutMs) || 12000, 20000));
  try {
    const res = await fetch(API + path, { method: options.method || 'GET', headers: headers(), signal: controller.signal, body: options.body });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text.slice(0, 2000) }; }
    if (!res.ok) {
      const err = new Error(String(data.message || `GitHub HTTP ${res.status}`));
      err.status = res.status;
      throw err;
    }
    return { data, headers: res.headers };
  } finally { clearTimeout(timeout); }
}

function base(input) {
  const { owner, repo } = repoInput(input);
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

async function getRepo(input) { return (await githubFetch(base(input))).data; }
async function getTree(input) {
  const ref = encodeURIComponent(pathPart(input.ref || 'main', 'ref'));
  return (await githubFetch(`${base(input)}/git/trees/${ref}?recursive=1`)).data;
}
async function getFile(input) {
  const filePath = pathPart(input.path, 'path').replace(/^\/+/, '');
  const ref = encodeURIComponent(pathPart(input.ref || 'main', 'ref'));
  const result = await githubFetch(`${base(input)}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}?ref=${ref}`);
  const item = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!item) throw new Error('file not found');
  let content = null;
  if (item.encoding === 'base64' && item.content) content = Buffer.from(item.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { ...item, content };
}
async function listBranches(input) { return (await githubFetch(`${base(input)}/branches?per_page=100`)).data; }
async function compare(input) {
  const from = encodeURIComponent(pathPart(input.from || 'main', 'from'));
  const to = encodeURIComponent(pathPart(input.to || 'main', 'to'));
  return (await githubFetch(`${base(input)}/compare/${from}...${to}`)).data;
}
async function createBranch(input) {
  const branch = pathPart(input.branch, 'branch');
  const from = pathPart(input.from || 'main', 'from');
  const ref = (await githubFetch(`${base(input)}/git/ref/heads/${encodeURIComponent(from)}`)).data.object.sha;
  const result = await githubFetch(`${base(input)}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref }) });
  return result.data;
}
async function deleteBranch(input) {
  const branch = pathPart(input.branch, 'branch');
  return (await githubFetch(`${base(input)}/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'DELETE' })).data;
}
async function writeFile(input) {
  const filePath = pathPart(input.path, 'path').replace(/^\/+/, '');
  const branch = pathPart(input.ref || 'main', 'ref');
  const message = String(input.message || `Update ${filePath}`).trim().slice(0, 200);
  const content = String(input.content === undefined ? '' : input.content);
  if (content.length > 1000000) throw new Error('content too large');
  let sha;
  try { sha = (await getFile({ ...input, ref: branch, path: filePath })).sha; } catch (e) { if (e.status !== 404) throw e; }
  const payload = { message, content: Buffer.from(content, 'utf8').toString('base64'), branch };
  if (sha) payload.sha = sha;
  return (await githubFetch(`${base(input)}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', body: JSON.stringify(payload) })).data;
}

async function listCommits(input) {
  const ref = encodeURIComponent(pathPart(input.ref || 'main', 'ref'));
  return (await githubFetch(`${base(input)}/commits?sha=${ref}&per_page=20`)).data;
}

module.exports = { config, getRepo, getTree, getFile, listBranches, compare, listCommits, createBranch, deleteBranch, writeFile };
