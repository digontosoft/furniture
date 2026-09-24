# Unzips Tiles.zip, shrinks every PNG to <=800px WebP and writes scripts/_out/manifest.json.
# Run:  python scripts/optimize.py   (needs: pip install pillow)
import os, re, json, zipfile
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = f'{ROOT}/_src/Tiles'
OUT = f'{ROOT}/_out'
if not os.path.isdir(SRC):
    zipfile.ZipFile(f'{ROOT}/../Tiles.zip').extractall(f'{ROOT}/_src')
os.makedirs(OUT, exist_ok=True)
manifest = []


def add(section, folder, category=None, sku=False):
    files = sorted(f for f in os.listdir(f'{SRC}/{folder}') if f.lower().endswith('.png'))
    for i, f in enumerate(files):
        stem = os.path.splitext(f)[0].strip()
        slug = re.sub(r'[^a-z0-9]+', '-', f'{section}-{category or ""}-{stem}'.lower()).strip('-')
        im = Image.open(f'{SRC}/{folder}/{f}').convert('RGBA')
        im.thumbnail((800, 800))
        im.save(f'{OUT}/{slug}.webp', 'WEBP', quality=82, method=6)
        manifest.append(dict(section=section, category=category, name=stem, sku=stem if sku else None, file=f'{slug}.webp', sort_order=i))


add('stock_collection', 'Stock/Stock Cabinetry Doory Style and Colors')
for cat in ['Base', 'Wall', 'Tall', 'Vanity', 'Trim, Panels, Molding']:
    add('stock_item', f'Stock/Stock Cabinetry Items/{cat}', category=cat, sku=True)
add('door_profile', 'Custom/Door Style and Color')
for sp in ['Alder', 'Birch', 'Maple', 'Oak', 'Walnut', 'White Oak']:
    add('stain', f'Custom/Wood Species/{sp}', category=sp)
for p in ['Paint Grade Maple and MDF Lacquers', 'Textured Melamine']:
    add('paint', f'Custom/Wood Species/{p}', category=p)
json.dump(manifest, open(f'{OUT}/manifest.json', 'w'), indent=1)
print(len(manifest), 'images ->', OUT)
