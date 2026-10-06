function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value) {
  if (!value || typeof value !== 'string') return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function isValidDateString(value) {
  if (!value || typeof value !== 'string') return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function parsePositiveInt(value, fallback = null) {
  const parsed = typeof value === 'number' ? value : (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseDisplayOrder(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    return 0;
  }
  return parsed;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

module.exports = {
  isNonEmptyString,
  isValidUrl,
  isValidDateString,
  parsePositiveInt,
  parseDisplayOrder,
  normalizeText,
};
