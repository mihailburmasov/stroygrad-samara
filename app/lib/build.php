<?php
// Сборка сайта: data/*.json -> готовые HTML-страницы в корне сайта.
// Все страницы сначала собираются в памяти; если по дороге ошибка — на диск ничего не пишется, сайт остаётся прежним.
declare(strict_types=1);

final class Build
{
    public static array $pages = [];   // путь страницы => html
    public static array $sitemap = []; // [loc, priority]
}

function emit_page(string $pth, string $html, array $o = []): void
{
    Build::$pages[$pth] = $html;
    if ($o['sitemap'] ?? true) Build::$sitemap[] = ['loc' => abs_url($pth), 'priority' => $o['priority'] ?? '0.6'];
}

function page_file(string $pth): string
{
    return str_ends_with($pth, '/') ? ltrim($pth, '/') . 'index.html' : ltrim($pth, '/');
}

// Собирает все страницы. Возвращает [относительный путь файла => содержимое].
function render_site(): array
{
    Build::$pages = []; Build::$sitemap = [];
    load_site_data();
    validate_data();
    page_home(); page_services_hub();
    foreach (S::$services as $s) page_service($s);
    page_uk(); page_portfolio(); page_about(); page_contacts(); page_privacy(); page_consent(); page_not_found();

    $files = [];
    foreach (Build::$pages as $pth => $html) $files[page_file($pth)] = $html;
    $urls = implode("\n", array_map(fn($p) => "  <url><loc>{$p['loc']}</loc><lastmod>" . S::$buildDate . "</lastmod><priority>{$p['priority']}</priority></url>", Build::$sitemap));
    $files['sitemap.xml'] = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n$urls\n</urlset>\n";
    $files['robots.txt'] = "User-agent: *\nAllow: /\n\nSitemap: " . abs_url('/sitemap.xml') . "\n";
    return $files;
}

// Полная сборка с записью на диск. Возвращает краткий отчёт.
function build_site(): array
{
    return with_lock(function () {
        $t0 = microtime(true);
        $files = render_site();
        $out = rtrim(cfg('out_dir'), '/\\');
        ensure_dir($out);

        $pub = realpath(cfg('public_dir'));
        if ($pub && $pub !== realpath($out)) mirror_static($pub, $out, array_keys($files));

        $changed = 0;
        foreach ($files as $rel => $content) {
            $f = "$out/$rel";
            if (is_file($f) && file_get_contents($f) === $content) continue;
            write_file_atomic($f, $content);
            $changed++;
        }
        // Страницы, которые больше не собираются (удалённая услуга), убираем — они производные от данных
        $manifestFile = storage_path('build-manifest.json');
        $prev = is_file($manifestFile) ? read_json($manifestFile) : [];
        $removed = 0;
        foreach (array_diff($prev, array_keys($files)) as $rel) {
            $f = "$out/$rel";
            if (is_file($f)) { unlink($f); $removed++; }
            $dir = dirname($f);
            if ($dir !== $out && is_dir($dir) && count(scandir($dir)) === 2) rmdir($dir);
        }
        write_file_atomic($manifestFile, json_pretty(array_keys($files)));
        return ['pages' => count(Build::$pages), 'changed' => $changed, 'removed' => $removed, 'ms' => (int)round((microtime(true) - $t0) * 1000)];
    });
}

// Для работы на своём компьютере: статика из public копируется в out, лишнее удаляется.
function mirror_static(string $src, string $dst, array $generated): void
{
    $keep = array_flip($generated);
    $seen = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($src) + 1));
        $seen[$rel] = true;
        $to = "$dst/$rel";
        if (is_file($to) && filesize($to) === $f->getSize() && filemtime($to) >= $f->getMTime()) continue;
        ensure_dir(dirname($to));
        copy($f->getPathname(), $to);
    }
    if (!is_dir($dst)) return;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dst, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $f) {
        $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($dst) + 1));
        if ($f->isDir()) { if (count(scandir($f->getPathname())) === 2) rmdir($f->getPathname()); continue; }
        if (!isset($seen[$rel]) && !isset($keep[$rel])) unlink($f->getPathname());
    }
}
