/**
 * Shared Utilities — used across multiple layers.
 */

/** Validates if a string is a proper UUID v4. */
function isValidUuid(uuid) {
  if (!uuid) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

module.exports = { isValidUuid };
