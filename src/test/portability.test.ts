import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allowLocalDemo } from '../../scripts/demo-policy';

const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);

describe('portabilità', () => {
  it('la demo non si attiva in build o fuori da loopback', () => {
    expect(allowLocalDemo('build', 'production', '1', 'localhost')).toBe(false);
    expect(allowLocalDemo('serve', 'production', '1', 'localhost')).toBe(false);
    expect(allowLocalDemo('serve', 'development', 'true', 'localhost')).toBe(false);
    expect(allowLocalDemo('serve', 'development', '1', 'example.org')).toBe(false);
    expect(allowLocalDemo('serve', 'development', '1', '127.0.0.1')).toBe(true);
  });
  it('nessun segreto privilegiato nei file versionati', () => {
    const pattern = /(sb_secret_[A-Za-z0-9]|sk_live_|-----BEGIN [A-Z ]*PRIVATE KEY|SERVICE_ROLE_KEY\s*[=:]\s*['"]?eyJ)/;
    const hits = tracked.filter((f) => existsSync(f) && f !== 'src/test/portability.test.ts' && !/\.(png|jpg|jpeg|webp|ico|lock)$/.test(f) && pattern.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
  it('.env.example contiene solo segnaposto', () => {
    const lines = readFileSync('.env.example', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l));
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l.split('=')[1]).toMatch(/<[^>]+>/);
  });
  it('script supportati presenti e lockfile versionato', () => {
    const s = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
    for (const k of ['dev', 'demo', 'build', 'test', 'lint']) expect(s[k]).toBeTruthy();
    expect(tracked).toContain('bun.lock');
  });
  it('nessun media personale o esportazione database versionati', () => {
    const bad = tracked.filter((f) => /\.(csv|dump|sqlite)$/.test(f) || (/\.(jpe?g|png|heic|mp4|mov)$/i.test(f) && !/^(public\/|src\/demo\/assets\/|src\/assets\/)/.test(f)));
    expect(bad).toEqual([]);
  });
});
