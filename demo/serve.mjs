/**
 * Lance la demonstration avant/apres.
 *
 *   node demo/serve.mjs
 *
 * Prepare les deux bundles a comparer puis sert la page. Le navigateur s'ouvre
 * tout seul ; Ctrl+C pour arreter.
 *
 * Les bundles ne sont pas versionnes : ils sont regeneres a chaque lancement
 * depuis le tag de production et depuis le build courant, ce qui garantit que
 * la comparaison porte sur l'etat reel du depot.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startDevServer } from '@web/dev-server';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const PORT = 8000;

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', ...opts });
}

console.log('Preparation des deux versions a comparer...\n');

// AVANT — l'artefact tel qu'il tourne en production, extrait du tag.
try {
  const before = run('git', ['show', 'v2.0.13-prod:dist/angular-vs-repeat.min.js'], {
    maxBuffer: 10 * 1024 * 1024,
  });
  writeFileSync(join(here, 'vs-repeat-before.js'), before);
  console.log(`  avant : v2.0.13-prod  (${(before.length / 1024).toFixed(1)} K)`);
} catch (err) {
  console.error('  Impossible de lire le tag v2.0.13-prod :', err.message);
  process.exit(1);
}

// APRES — le build courant du depot.
const built = join(root, 'dist', 'angular-vs-repeat.min.js');
if (!existsSync(built)) {
  console.log('  dist/ absent, construction...');
  run('npm', ['run', 'build'], { shell: true, stdio: 'ignore' });
}
const after = run('node', ['-e', 'process.stdout.write(require("fs").readFileSync("dist/angular-vs-repeat.min.js","utf8"))'], {
  maxBuffer: 10 * 1024 * 1024,
});
writeFileSync(join(here, 'vs-repeat-after.js'), after);
console.log(`  apres : build courant (${(after.length / 1024).toFixed(1)} K)\n`);

// Le port peut etre occupe (un serveur laisse ouvert, un autre projet). Le
// serveur de dev signale l'erreur de facon asynchrone, donc un try/catch
// autour de son demarrage ne l'attrape pas : on cherche un port libre avant.
async function findFreePort(start, tries = 10) {
  const net = await import('node:net');
  for (let p = start; p < start + tries; p++) {
    const free = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once('error', () => resolve(false));
      probe.once('listening', () => probe.close(() => resolve(true)));
      probe.listen(p);
    });
    if (free) return p;
  }
  return null;
}

const port = await findFreePort(PORT);
if (!port) {
  console.error(`Aucun port libre entre ${PORT} et ${PORT + 9}.`);
  process.exit(1);
}

const server = await startDevServer({
  config: { rootDir: root, port, nodeResolve: true, open: '/demo/index.html' },
  readCliArgs: false,
  readFileConfig: false,
  logStartMessage: false,
});

console.log(`Demo disponible sur http://localhost:${port}/demo/index.html`);
console.log('Ctrl+C pour arreter.\n');

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
