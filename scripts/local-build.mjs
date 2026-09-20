// Локальная сборка: сайт в корне (basePath пустой), адрес http://localhost:4173
// --draft — подсветить в тексте данные, которые нужно уточнить у клиента ({{УТОЧНИТЬ: …}})
import { spawnSync } from 'child_process';
const env = { ...process.env, SITE_BASE: '', SITE_URL: 'http://localhost:4173' };
if (process.argv.includes('--draft')) env.DRAFT = '1';
const r = spawnSync('node', ['build/build.mjs'], { stdio: 'inherit', env });
process.exit(r.status ?? 1);
