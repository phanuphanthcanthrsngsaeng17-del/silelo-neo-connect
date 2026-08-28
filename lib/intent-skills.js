const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'skills', 'intent-library', 'registry.json');
let registryCache = null;

function loadRegistry() {
  if (!registryCache) {
    const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    if (!parsed || parsed.total !== 500 || !Array.isArray(parsed.skills)) throw new Error('Invalid intent skill registry');
    registryCache = parsed;
  }
  return registryCache;
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function suggestIntentSkills(command, mode = 'understand', limit = 6) {
  const safeMode = mode === 'execute' ? 'execute' : 'understand';
  const safeLimit = Math.max(1, Math.min(12, Number(limit) || 6));
  const query = normalize(command);
  return loadRegistry().skills
    .filter((skill) => skill.mode === safeMode)
    .map((skill) => {
      const score = (skill.intents || []).reduce((total, intent) => total + (query.includes(normalize(intent)) ? 2 : 0), 0)
        + (query.includes(normalize(skill.categoryTitle)) ? 1 : 0);
      return { skill, score };
    })
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
    .slice(0, safeLimit)
    .map(({ skill }) => ({ id: skill.id, mode: skill.mode, category: skill.category, title: skill.title, description: skill.description, path: skill.path }));
}

function intentSnapshot(command, mode = 'understand', limit = 6) {
  const normalizedCommand = String(command || '').trim();
  return {
    command: normalizedCommand,
    mode: mode === 'execute' ? 'execute' : 'understand',
    skills: suggestIntentSkills(normalizedCommand, mode, limit),
    needsConfirmation: mode === 'execute',
    executionPolicy: 'allowlist-only; no arbitrary shell, file, network, or credential access',
  };
}

function registryStats() {
  const registry = loadRegistry();
  return { total: registry.total, understand: registry.modes.understand, execute: registry.modes.execute, categories: new Set(registry.skills.map((skill) => skill.category)).size };
}

module.exports = { loadRegistry, suggestIntentSkills, intentSnapshot, registryStats };
