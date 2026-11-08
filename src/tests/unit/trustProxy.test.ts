import fs from 'fs';
import path from 'path';
import { parseTrustProxy } from '../../config/trustProxy';

describe('parseTrustProxy (AC-1)', () => {
  it.each([undefined, '', '  ', '0', 'false', 'FALSE'])('returns false for %p', (raw) => {
    expect(parseTrustProxy(raw)).toBe(false);
  });

  it('returns a hop count for digits', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy(' 2 ')).toBe(2);
  });

  it('returns a normalised list of IPs/CIDRs and named ranges', () => {
    expect(parseTrustProxy('10.0.0.0/8, 127.0.0.1')).toBe('10.0.0.0/8,127.0.0.1');
    expect(parseTrustProxy('loopback')).toBe('loopback');
    expect(parseTrustProxy('linklocal, uniquelocal')).toBe('linklocal,uniquelocal');
    expect(parseTrustProxy('::1, fd00::/8, 10.0.0.0/32, ::/0')).toBe('::1,fd00::/8,10.0.0.0/32,::/0');
  });

  it.each([
    'true',
    'TRUE',
    '*',
    '-1',
    '1.5',
    'abc',
    '10.0.0.0/33',
    '::1/129',
    '10.0.0.0/8,bogus',
    '10.0.0.1,',
    '10.0.0.0/',
    '10.0.0.0/-1',
    '10.0.0.0/255.0.0.0',
  ])('throws an Error naming TRUST_PROXY for %p', (raw) => {
    expect(() => parseTrustProxy(raw)).toThrow(Error);
    expect(() => parseTrustProxy(raw)).toThrow(/TRUST_PROXY/);
  });

  it('explains why true is not allowed', () => {
    expect(() => parseTrustProxy('true')).toThrow(/not allowed/);
  });
});

describe('README proxy section (AC-6)', () => {
  const readme = fs.readFileSync(path.resolve(__dirname, '../../../README.md'), 'utf8');
  const start = readme.indexOf('## Running behind a proxy (Render)');
  const rest = readme.slice(start + 1);
  const nextH2 = rest.search(/^## /m);
  const section = start === -1 ? '' : readme.slice(start, nextH2 === -1 ? undefined : start + 1 + nextH2);

  it('has the section heading', () => {
    expect(readme).toMatch(/^## Running behind a proxy \(Render\)\r?$/m);
  });

  it.each(['TRUST_PROXY', 'LOG_CLIENT_IP', 'req.ip', 'req.ips', 'X-Forwarded-For'])('mentions %s', (term) => {
    expect(section).toContain(term);
  });

  it('says not to use true', () => {
    expect(section).toMatch(/never use `true`/i);
  });
});
