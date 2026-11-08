import { isIP } from 'node:net';

/**
 * Value for Express's `trust proxy` setting.
 * - `false`: trust no proxy; `req.ip` is the socket address (the default).
 * - number: trust that many hops from the right of X-Forwarded-For.
 * - string: comma-separated proxy IPs/CIDRs or Express's named ranges.
 */
export type TrustProxySetting = false | number | string;

/**
 * Upper bound on the hop count. A real proxy chain is a few hops; a large count trusts the
 * whole X-Forwarded-For chain, which is as spoofable as `true`.
 */
export const MAX_TRUST_PROXY_HOPS = 10;

const NAMED_RANGES = new Set(['loopback', 'linklocal', 'uniquelocal']);

const PREFIX = 'TRUST_PROXY must be a hop count or a list of proxy IPs/CIDRs';

const invalid = (raw: string, detail: string) => new Error(`${PREFIX}; got "${raw}" (${detail})`);

const trustsEveryone = (raw: string) =>
  new Error(`${PREFIX}; "${raw}" trusts any client-supplied X-Forwarded-For and is not allowed`);

/** `everyone` marks an entry rejected because it would trust every address. */
const checkEntry = (entry: string): { ok: true } | { ok: false; everyone: boolean } => {
  if (NAMED_RANGES.has(entry)) return { ok: true };

  const slash = entry.indexOf('/');
  if (slash === -1) return isIP(entry) !== 0 ? { ok: true } : { ok: false, everyone: false };

  const ip = entry.slice(0, slash);
  const prefix = entry.slice(slash + 1);
  const version = isIP(ip);
  if (version === 0 || !/^\d{1,3}$/.test(prefix)) return { ok: false, everyone: false };

  const bits = Number(prefix);
  if (bits > (version === 4 ? 32 : 128)) return { ok: false, everyone: false };
  // A /0 range (0.0.0.0/0, ::/0) matches every address: the same as `true`.
  if (bits === 0) return { ok: false, everyone: true };
  return { ok: true };
};

/**
 * Parses the TRUST_PROXY env value. Never returns `true` or an equivalent (a /0 range or a
 * huge hop count): trusting every hop lets any client spoof X-Forwarded-For and pick its own
 * `req.ip`, which defeats per-IP rate limits.
 */
export const parseTrustProxy = (raw: string | undefined): TrustProxySetting => {
  const value = (raw ?? '').trim();
  const lower = value.toLowerCase();

  if (value === '' || lower === 'false') return false;

  if (/^\d+$/.test(value)) {
    const hops = Number(value);
    if (hops === 0) return false;
    if (hops > MAX_TRUST_PROXY_HOPS) {
      throw invalid(
        value,
        `hop count must be at most ${MAX_TRUST_PROXY_HOPS}; a larger count trusts the whole X-Forwarded-For chain, like "true"`
      );
    }
    return hops;
  }

  if (lower === 'true' || value === '*') throw trustsEveryone(value);

  const entries = value.split(',').map((entry) => entry.trim());
  for (const entry of entries) {
    const result = checkEntry(entry);
    if (result.ok) continue;
    if (result.everyone) throw trustsEveryone(entry);
    throw invalid(value, `"${entry}" is not an IP, CIDR, loopback, linklocal or uniquelocal`);
  }
  return entries.join(',');
};
