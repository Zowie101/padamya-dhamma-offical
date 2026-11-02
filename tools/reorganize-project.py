"""One-time, reversible migration of the original flat Sacred Form project."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
backup = ROOT / 'tools/backups/structure-20261101.json'
if (ROOT / 'assets/js/app.js').exists() and (ROOT / 'assets/vendor').exists() and (ROOT / 'assets/products').exists():
    raise SystemExit('Already organized; no files changed.')

files = {p.name: ('assets/css/' if p.suffix == '.css' else 'assets/js/') + p.name
         for p in ROOT.iterdir() if p.is_file() and p.suffix in {'.css', '.js', '.mjs'}}
docs = {p.name: 'docs/' + p.name for p in ROOT.glob('*.md') if p.name != 'README.md'}
folders = {name: 'assets/' + name for name in ['fonts', 'icons', 'images', 'locales', 'models', 'vendor']}
folders.update({f'buddha_{n}': f'assets/products/buddha_{n}' for n in range(1, 7)})
moves = {**files, **docs, **folders}
if backup.exists():
    saved = json.loads(backup.read_text(encoding='utf-8'))
    moves = saved['moves']
    files = {old: new for old, new in moves.items() if new.startswith(('assets/css/', 'assets/js/'))}
    docs = {old: new for old, new in moves.items() if new.startswith('docs/')}
for old, new in moves.items():
    source, target = ROOT / old, ROOT / new
    assert source.exists() != target.exists(), (old, new)
    assert source.resolve().is_relative_to(ROOT) and target.resolve().is_relative_to(ROOT)

sources = [p for p in ROOT.rglob('*') if p.is_file() and p.suffix in {'.html', '.css', '.js', '.mjs', '.cjs', '.py', '.md', '.json'}
           and not any(x in p.relative_to(ROOT).parts for x in ['vendor', 'wireframes', 'preview', 'ar-build', 'backups'])
           and p != Path(__file__).resolve()]
if backup.exists():
    originals = saved['text']
else:
    originals = {p.relative_to(ROOT).as_posix(): p.read_text(encoding='utf-8-sig') for p in sources}
    backup.parent.mkdir(parents=True, exist_ok=True)
    backup.write_text(json.dumps({'moves': moves, 'text': originals}, ensure_ascii=False), encoding='utf-8')

def rewrite(old, text):
    suffix = Path(old).suffix
    # References to moved scripts/styles in root documents, test imports and docs.
    for name, target in files.items():
        text = text.replace('../' + name, '../' + target) if old.startswith('tests/') else text
        if suffix == '.html':
            text = re.sub(r'((?:src|href)=[\"\'])(?:\./)?' + re.escape(name) + r'(?=[?\"\'])', lambda m: m[1] + target, text)
        if suffix == '.md':
            text = re.sub(r'(?<![\w/.-])' + re.escape(name) + r'(?![\w.-])', target, text)
    # Relative module imports stay together, while vendor modules live beside js/.
    if old in files and suffix in {'.js', '.mjs'}:
        text = text.replace('./vendor/', '../vendor/')
    for folder, target in folders.items():
        # ../ paths in test sources are relative to the test folder.
        if old.startswith('tests/'):
            text = text.replace('../' + folder + '/', '../' + target + '/')
        # CSS urls resolve from assets/css; ordinary JS/HTML asset URLs resolve
        # from root-level storefront pages. Avoid already-rewritten paths.
        replacement = '../' + target.removeprefix('assets/') if suffix == '.css' else target
        text = re.sub(r'(?<![\w/.-])' + re.escape(folder) + '/', replacement + '/', text)
    if old == 'language.js':
        text = text.replace("new URL('assets/locales/", "new URL('../locales/")
    if suffix == '.md':
        for name, target in docs.items():
            if old == 'README.md':
                text = text.replace('(' + name + ')', '(' + target + ')')
    return text

rewritten = {old: rewrite(old, text) for old, text in originals.items()}
for old, new in moves.items():
    target = ROOT / new
    target.parent.mkdir(parents=True, exist_ok=True)
    if (ROOT / old).exists():
        (ROOT / old).rename(target)
for old, text in rewritten.items():
    destination = ROOT / files.get(old, docs.get(old, old))
    # Reports nested in moved asset folders.
    for folder, target in folders.items():
        if old.startswith(folder + '/'):
            destination = ROOT / (target + old[len(folder):])
            break
    destination.write_text(text, encoding='utf-8')
print(f'Organized {len(files)} scripts/styles, {len(folders)} asset folders, {len(docs)} guides; updated {len(rewritten)} text files.')
