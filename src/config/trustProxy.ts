import { isIP } from 'node:net';

/**
 * Value for Express's `trust proxy` setting.
 * - `false`: trust no proxy; `req.ip` is the socket address (the default).
 * - number: trust that many hops from the right of X-Forwarded-For.
 * - string: comma-separated proxy IPs/CIDRs or Express's named ranges.
 */
export type TrustProxySetting = false | number | string;

const NAMED_RANGES = new Set(['loopback', 'linklocal', 'uniquelocal']);

const invalid = (raw: string, detail: string) =>
  new Error(
    `TRUST_PROXY must be a hop count or a list of proxy IPs/CIDRs; got "${raw}" (${detail})`
  );

const isValidEntry = (entry: string): boolean => {
  if (NAMED_RANGES.has(entry)) return true;

  const slash = entry.indexOf('/');
  if (slash === -1) return isIP(entry) !== 0;

  const ip = entry.slice(0, slash);
  const prefix = entry.slice(slash + 1);
  const version = isIP(ip);
  if (version === 0 || !/^\d{1,3}$/.test(prefix)) return false;

  const bits = Number(prefix);
  return version === 4 ? bits <= 32 : bits <= 128;
};

/**
 * Parses the TRUST_PROXY env value. Never returns `true`: trusting every hop lets any
 * client spoof X-Forwarded-For and pick its own `req.ip`, which defeats per-IP rate limits.
 */
export const parseTrustProxy = (raw: string | undefined): TrustProxySetting => {
  const value = (raw ?? '').trim();
  const lower = value.toLowerCase();

  if (value === '' || value === '0' || lower === 'false') return false;

  if (/^\d+$/.test(value)) {
    const hops = Number(value);
    if (!Number.isSafeInteger(hops)) throw invalid(value, 'hop count is too large');
    return hops;
  }

  if (lower === 'true' || value === '*') {
    throw new Error(
      `TRUST_PROXY must be a hop count or a list of proxy IPs/CIDRs; "${value}" trusts any client-supplied X-Forwarded-For and is not allowed`
    );
  }

  const entries = value.split(',').map((entry) => entry.trim());
  for (const entry of entries) {
    if (!isValidEntry(entry)) {
      throw invalid(value, `"${entry}" is not an IP, CIDR, loopback, linklocal or uniquelocal`);
    }
  }
  return entries.join(',');
};
