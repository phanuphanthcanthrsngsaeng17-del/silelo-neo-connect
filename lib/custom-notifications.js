const crypto = require('crypto');

const MAX_PER_USER = 50;
const MAX_TITLE = 120;
const MAX_MESSAGE = 500;
const notificationsByUser = new Map();
const LEVELS = new Set(['info', 'success', 'warning', 'error']);

function userKey(user) {
  return String(user && (user.u || user.id || user.email) || '').trim().slice(0, 160);
}

function cleanText(value, max) {
  return String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function listNotifications(user, includeRead = false) {
  const key = userKey(user);
  const list = notificationsByUser.get(key) || [];
  return (includeRead ? list : list.filter((item) => !item.read)).map((item) => ({ ...item }));
}

function createNotification(user, input) {
  const key = userKey(user);
  if (!key) throw new Error('authenticated user required');
  const title = cleanText(input && input.title, MAX_TITLE);
  const message = cleanText(input && input.message, MAX_MESSAGE);
  const level = LEVELS.has(input && input.level) ? input.level : 'info';
  if (!title || !message) throw new Error('title and message are required');
  const item = { id: crypto.randomUUID(), title, message, level, read: false, createdAt: new Date().toISOString() };
  const next = [item, ...(notificationsByUser.get(key) || [])].slice(0, MAX_PER_USER);
  notificationsByUser.set(key, next);
  return { ...item };
}

function markNotificationRead(user, id) {
  const key = userKey(user);
  const list = notificationsByUser.get(key) || [];
  const item = list.find((entry) => entry.id === String(id || ''));
  if (!item) return null;
  item.read = true;
  return { ...item };
}

function deleteNotification(user, id) {
  const key = userKey(user);
  const list = notificationsByUser.get(key) || [];
  const next = list.filter((entry) => entry.id !== String(id || ''));
  if (next.length === list.length) return false;
  notificationsByUser.set(key, next);
  return true;
}

function clearNotifications(user) {
  notificationsByUser.delete(userKey(user));
}

module.exports = { MAX_PER_USER, LEVELS, listNotifications, createNotification, markNotificationRead, deleteNotification, clearNotifications };
