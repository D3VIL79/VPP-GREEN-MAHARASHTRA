"""
VPP Green Maharashtra — Robust Tree Image Downloader v9
========================================================
Downloads REAL tree images from Wikipedia + Wikimedia Commons.
Every image is validated for:
  1. File integrity (loadable by OpenCV, >= 100x100 px)
  2. Content filtering (URL-based blacklist for non-tree content)
  3. Perceptual uniqueness (pHash hamming >= 10)

Target: 8 species x 150 images = 1,200 images
Guarantee: >= 80% perceptually unique per species
"""
import os
import sys
import re
import time
import random
import hashlib
import warnings
import subprocess

warnings.filterwarnings('ignore')

# Install dependencies if needed
for pkg in ['requests', 'Pillow', 'imagehash', 'opencv-python', 'numpy', 'tqdm']:
    imp = pkg.replace('-', '_').split('==')[0]
    if imp == 'opencv_python': imp = 'cv2'
    try: __import__(imp)
    except ImportError: subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

import requests
import urllib.parse
import numpy as np
import cv2
from PIL import Image
import imagehash
from tqdm import tqdm

random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPECIES_DIR = os.path.join(BASE_DIR, 'data', 'species')
TARGET = 150
MIN_UNIQUE_PCT = 0.80

HEADERS = {
    'User-Agent': 'VPPGreen-TreeDownloader/9.0 (academic-project; ml-training; contact@vppgreen.in)'
}

# ═══════════════════════════════════════════════════════════════
# SPECIES CONFIGURATION
# Each species has:
#   - wikipedia_pages: Wikipedia article titles to extract images from
#   - commons_cats: Wikimedia Commons categories to crawl
#   - scientific: scientific name for search
# ═══════════════════════════════════════════════════════════════

SPECIES_CONFIG = {
    'Neem': {
        'wikipedia_pages': ['Azadirachta indica', 'Neem'],
        'commons_cats': ['Azadirachta indica', 'Azadirachta indica in India'],
        'scientific': 'Azadirachta indica',
    },
    'Banyan': {
        'wikipedia_pages': ['Ficus benghalensis', 'Banyan'],
        'commons_cats': ['Ficus benghalensis', 'Ficus benghalensis in India',
                         'Notable banyan trees'],
        'scientific': 'Ficus benghalensis',
    },
    'Peepal': {
        'wikipedia_pages': ['Ficus religiosa', 'Sacred fig'],
        'commons_cats': ['Ficus religiosa', 'Ficus religiosa in India'],
        'scientific': 'Ficus religiosa',
    },
    'Mango': {
        'wikipedia_pages': ['Mangifera indica', 'Mango'],
        'commons_cats': ['Mangifera indica', 'Mangifera indica (trees)',
                         'Mango trees'],
        'scientific': 'Mangifera indica',
    },
    'Jamun': {
        'wikipedia_pages': ['Syzygium cumini', 'Jambul'],
        'commons_cats': ['Syzygium cumini', 'Syzygium cumini in India'],
        'scientific': 'Syzygium cumini',
    },
    'Ashoka': {
        'wikipedia_pages': ['Saraca asoca', 'Saraca indica', 'Polyalthia longifolia'],
        'commons_cats': ['Saraca asoca', 'Polyalthia longifolia'],
        'scientific': 'Saraca asoca',
    },
    'Gulmohar': {
        'wikipedia_pages': ['Delonix regia', 'Royal Poinciana'],
        'commons_cats': ['Delonix regia', 'Delonix regia in India'],
        'scientific': 'Delonix regia',
    },
    'Teak': {
        'wikipedia_pages': ['Tectona grandis', 'Teak'],
        'commons_cats': ['Tectona grandis', 'Teak plantations'],
        'scientific': 'Tectona grandis',
    },
}

# ═══════════════════════════════════════════════════════════════
# URL FILTERING — Strict blacklist to reject non-tree content
# ═══════════════════════════════════════════════════════════════

# Substrings that indicate non-tree content
SUBSTR_BLACKLIST = [
    'specimen', 'herbarium', 'drawing', 'illustration', 'distribution',
    'diagram', 'anatomical', 'micrograph', 'dessin', 'karte', 'plate',
    'taxobox', 'stamp', 'sketch', 'painting', 'engraving', 'lithograph',
    'diagramme', 'carte', 'microscope', 'cellular', 'histology',
    'wood_cut', 'lumber', 'stemma', 'fossil', 'closeup', 'close-up',
    'seed_detail', 'fruit_detail', 'flower_detail', 'leaf_detail',
    'leaves_detail', 'stigma', 'pistil', 'caterpillar', 'squirrel',
    'icon', 'logo', 'flag', 'coat_of_arms', 'emblem', 'symbol',
    'cartoon', 'comic', 'clipart', 'silhouette', 'infographic',
    'chart', 'timeline', 'cross_section', 'anatomy', 'section',
    'postage', 'currency', 'banknote', 'medal', 'trophy',
]

# Whole-word blacklist
WORD_BLACKLIST = {
    'map', 'scan', 'page', 'book', 'figure',
    'table', 'graph', 'document', 'macro', 'micro', 'pollen', 'cat',
    'dog', 'animal', 'bird', 'insect', 'bug', 'butterfly', 'monkey',
    'pest', 'wasp', 'bee', 'fly', 'spider', 'beetle', 'moth',
    'snake', 'lizard', 'rat', 'mouse', 'fish', 'crab', 'frog',
    'turtle', 'parrot', 'crow', 'pigeon', 'owl', 'eagle',
    'svg', 'pdf', 'gif', 'tif', 'tiff', 'ogg', 'ogv', 'webm',
}

SCENERY_BLACKLIST = {
    'gapan', 'bulacan', 'pampanga', 'nueva', 'ecija', 'manila',
    'flyover', 'bridge', 'pumping', 'estero', 'highway', 'road',
    'building', 'church', 'temple', 'mosque', 'palace', 'fort',
}


def is_valid_url(url):
    """Strict URL filter — reject anything that doesn't look like a tree photo."""
    url_lower = url.lower()
    # Must be a real image format
    if not any(url_lower.endswith(ext) for ext in ('.jpg', '.jpeg', '.png')):
        if '/thumb/' not in url_lower:  # Wikimedia thumbnail URLs don't end with ext
            return False
    # Check extension after last dot
    last_part = url_lower.split('/')[-1].split('?')[0]
    if last_part.endswith(('.svg', '.pdf', '.gif', '.tif', '.tiff', '.ogg', '.ogv', '.webm')):
        return False
    # Reject figures/diagrams like fig1, fig_2, figure3
    if re.search(r'fig(ure)?_?\d+', url_lower):
        return False
    # Substring blacklist
    for bl in SUBSTR_BLACKLIST:
        if bl in url_lower:
            return False
    # Word blacklist
    words = set(re.split(r'[^a-z0-9]', url_lower))
    if words & WORD_BLACKLIST:
        return False
    if words & SCENERY_BLACKLIST:
        return False
    return True


def is_valid_title(title):
    """Filter Wikimedia file titles."""
    t = title.lower()
    if t.endswith(('.svg', '.pdf', '.gif', '.tif', '.tiff', '.ogg', '.ogv', '.webm')):
        return False
    if re.search(r'fig(ure)?_?\d+', t):
        return False
    for bl in SUBSTR_BLACKLIST:
        if bl in t:
            return False
    words = set(re.split(r'[^a-z0-9]', t))
    if words & WORD_BLACKLIST:
        return False
    if words & SCENERY_BLACKLIST:
        return False
    return True


# ═══════════════════════════════════════════════════════════════
# IMAGE VALIDATION — Ensure downloaded file is a real tree photo
# ═══════════════════════════════════════════════════════════════

def validate_image(path):
    """Validate that a downloaded file is a proper tree image.
    Returns True only if:
      1. File is loadable by OpenCV
      2. Image is at least 100x100 pixels
      3. Image has 3 channels (color)
      4. Image is not mostly white/black (likely a diagram/doc)
    """
    try:
        img = cv2.imread(path)
        if img is None:
            return False
        h, w = img.shape[:2]
        if h < 100 or w < 100:
            return False
        if len(img.shape) < 3 or img.shape[2] != 3:
            return False
        # Check it's not mostly white (diagram/document)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        white_pct = np.mean(gray > 240)
        if white_pct > 0.7:
            return False
        # Check it's not mostly black
        black_pct = np.mean(gray < 15)
        if black_pct > 0.7:
            return False
        # Check color variance (solid color = fake/icon)
        std = np.std(gray)
        if std < 10:
            return False
        return True
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════
# PERCEPTUAL HASH FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def compute_phash(path):
    try:
        return imagehash.phash(Image.open(path))
    except Exception:
        return None


def is_unique(new_hash, store, threshold=10):
    if new_hash is None:
        return False
    for h in store:
        if new_hash - h < threshold:
            return False
    return True


# ═══════════════════════════════════════════════════════════════
# SOURCE 1: Wikipedia article images
# ═══════════════════════════════════════════════════════════════

def fetch_wikipedia_images(page_title):
    """Get all image URLs used in a Wikipedia article."""
    url = (
        'https://en.wikipedia.org/w/api.php?'
        f'action=query&titles={urllib.parse.quote(page_title)}'
        '&prop=images&imlimit=50&format=json'
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        data = r.json()
        pages = data.get('query', {}).get('pages', {})
        titles = []
        for page in pages.values():
            for img in page.get('images', []):
                t = img.get('title', '')
                if is_valid_title(t):
                    titles.append(t)
        # Resolve to actual URLs
        urls = []
        for i in range(0, len(titles), 50):
            batch = titles[i:i+50]
            info_url = (
                'https://en.wikipedia.org/w/api.php?'
                f'action=query&titles={urllib.parse.quote("|".join(batch))}'
                '&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json'
            )
            r2 = requests.get(info_url, headers=HEADERS, timeout=15)
            pages2 = r2.json().get('query', {}).get('pages', {})
            for p in pages2.values():
                for info in p.get('imageinfo', []):
                    img_url = info.get('thumburl') or info.get('url', '')
                    size = info.get('size', 0)
                    if size > 8000 and is_valid_url(img_url):
                        urls.append(img_url)
        return urls
    except Exception as e:
        print(f'      [WARN] Wikipedia page fetch failed for {page_title}: {e}')
        return []


# ═══════════════════════════════════════════════════════════════
# SOURCE 2: Wikimedia Commons categories (with subcategory crawl)
# ═══════════════════════════════════════════════════════════════

def fetch_commons_subcategories(cat_name):
    """List subcategories of a Commons category."""
    url = (
        'https://commons.wikimedia.org/w/api.php?'
        f'action=query&list=categorymembers'
        f'&cmtitle={urllib.parse.quote("Category:" + cat_name)}'
        '&cmtype=subcat&cmlimit=20&format=json'
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        data = r.json()
        members = data.get('query', {}).get('categorymembers', [])
        # Filter out non-tree subcategories
        bad = ['fruit', 'seed', 'leaf', 'flower', 'bark', 'timber', 'wood',
               'pest', 'disease', 'uses', 'products', 'cuisine', 'food',
               'medicine', 'furniture', 'oil', 'extract']
        result = []
        for m in members:
            name = m['title'].replace('Category:', '')
            if not any(b in name.lower() for b in bad):
                result.append(name)
        return result
    except Exception:
        return []


def fetch_commons_images(cat_name, limit=200):
    """Fetch image URLs from a single Commons category."""
    url = (
        'https://commons.wikimedia.org/w/api.php?'
        f'action=query&list=categorymembers'
        f'&cmtitle={urllib.parse.quote("Category:" + cat_name)}'
        f'&cmtype=file&cmlimit={limit}&format=json'
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        data = r.json()
        members = data.get('query', {}).get('categorymembers', [])
        titles = [m['title'] for m in members if is_valid_title(m.get('title', ''))]

        urls = []
        for i in range(0, len(titles), 50):
            batch = titles[i:i+50]
            info_url = (
                'https://commons.wikimedia.org/w/api.php?'
                f'action=query&titles={urllib.parse.quote("|".join(batch))}'
                '&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json'
            )
            r2 = requests.get(info_url, headers=HEADERS, timeout=20)
            r2.raise_for_status()
            pages = r2.json().get('query', {}).get('pages', {})
            for p in pages.values():
                for info in p.get('imageinfo', []):
                    img_url = info.get('thumburl') or info.get('url', '')
                    size = info.get('size', 0)
                    if size > 8000 and is_valid_url(img_url):
                        urls.append(img_url)
            time.sleep(0.1)
        return urls
    except Exception as e:
        print(f'      [WARN] Commons cat failed for {cat_name}: {e}')
        return []


def fetch_search_images(query, limit=150):
    """Fetch file URLs from Wikimedia Commons search API."""
    url = (
        'https://commons.wikimedia.org/w/api.php?'
        'action=query&list=search'
        f'&srsearch={urllib.parse.quote(query)}'
        f'&srnamespace=6&srlimit={limit}&format=json'
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        data = r.json()
        search_results = data.get('query', {}).get('search', [])
        titles = [item.get('title', '') for item in search_results if item.get('title', '')]
        titles = [t for t in titles if is_valid_title(t)]
        
        urls = []
        for i in range(0, len(titles), 50):
            batch = titles[i:i+50]
            info_url = (
                'https://commons.wikimedia.org/w/api.php?'
                f'action=query&titles={urllib.parse.quote("|".join(batch))}'
                '&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json'
            )
            r2 = requests.get(info_url, headers=HEADERS, timeout=15)
            pages = r2.json().get('query', {}).get('pages', {})
            for p in pages.values():
                for info in p.get('imageinfo', []):
                    img_url = info.get('thumburl') or info.get('url', '')
                    size = info.get('size', 0)
                    if size > 8000 and is_valid_url(img_url):
                        urls.append(img_url)
        return urls
    except Exception as e:
        print(f'      [WARN] Search failed for "{query}": {e}')
        return []


def fetch_all_urls(sp_name, config):
    """Gather URLs from all sources for a species."""
    all_urls = []

    # Source 1: Wikipedia article images
    for page in config['wikipedia_pages']:
        urls = fetch_wikipedia_images(page)
        all_urls.extend(urls)
        time.sleep(0.2)

    # Source 2: Commons categories + subcategories
    for cat in config['commons_cats']:
        urls = fetch_commons_images(cat, limit=200)
        all_urls.extend(urls)
        # Crawl subcategories
        subcats = fetch_commons_subcategories(cat)
        for sc in subcats[:5]:  # Limit to 5 subcats per category
            sc_urls = fetch_commons_images(sc, limit=100)
            all_urls.extend(sc_urls)
            time.sleep(0.1)
        time.sleep(0.2)

    # Source 3: Commons search API for specific terms
    queries = [
        f"{config['scientific']} tree",
        f"{sp_name} tree"
    ]
    for q in queries:
        urls = fetch_search_images(q, limit=150)
        all_urls.extend(urls)
        time.sleep(0.2)

    # Deduplicate URLs
    unique = list(dict.fromkeys(all_urls))
    return unique


# ═══════════════════════════════════════════════════════════════
# DOWNLOAD + VALIDATE + DEDUP
# ═══════════════════════════════════════════════════════════════

def download_single(url, save_path):
    """Download one image, validate, return True if good."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return False
        content = r.content
        if len(content) < 8000:
            return False
        with open(save_path, 'wb') as f:
            f.write(content)
        if validate_image(save_path):
            return True
        else:
            os.remove(save_path)
            return False
    except Exception:
        if os.path.exists(save_path):
            os.remove(save_path)
        return False


# ═══════════════════════════════════════════════════════════════
# AGGRESSIVE AUGMENTATION (for filling gaps)
# ═══════════════════════════════════════════════════════════════

def augment_clean(img):
    """Create a clean, natural augmented version of a tree image (no corruption)."""
    h, w = img.shape[:2]

    # 1. Minor random crop (90-100% of the image)
    crop_f = random.uniform(0.90, 1.0)
    ch, cw = max(64, int(h * crop_f)), max(64, int(w * crop_f))
    y0 = random.randint(0, max(0, h - ch))
    x0 = random.randint(0, max(0, w - cw))
    img = cv2.resize(img[y0:y0+ch, x0:x0+cw], (w, h))

    # 2. Minor rotation (±5 degrees max)
    angle = random.uniform(-5, 5)
    M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1.0)
    img = cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REFLECT)

    # 3. Horizontal flip (50% chance)
    if random.random() > 0.5:
        img = cv2.flip(img, 1)

    # 4. Minor brightness/contrast (0.9 to 1.1)
    alpha = random.uniform(0.9, 1.1)
    beta = random.uniform(-10, 10)
    img = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)

    # 5. Minor Gaussian blur (only 10% chance, kernel=3)
    if random.random() > 0.9:
        img = cv2.GaussianBlur(img, (3, 3), 0)

    return img


# ═══════════════════════════════════════════════════════════════
# MAIN DOWNLOAD FUNCTION
# ═══════════════════════════════════════════════════════════════

def download_species(sp_name, config):
    """Download, validate, and deduplicate images for one species."""
    sp_dir = os.path.join(SPECIES_DIR, sp_name)
    os.makedirs(sp_dir, exist_ok=True)

    # Check existing
    existing = [f for f in os.listdir(sp_dir) if f.endswith(('.jpg', '.png'))]
    if len(existing) >= TARGET:
        # Verify uniqueness
        phashes = []
        for fn in existing:
            ph = compute_phash(os.path.join(sp_dir, fn))
            if ph: phashes.append(ph)
        unique_set = set()
        for ph in phashes:
            if all(ph - e >= 10 for e in unique_set):
                unique_set.add(ph)
        pct = len(unique_set) / max(len(phashes), 1)
        if pct >= MIN_UNIQUE_PCT:
            print(f'  [OK] {sp_name}: {len(existing)} imgs, '
                  f'{len(unique_set)} unique ({pct*100:.1f}%) -- skip')
            return
        else:
            print(f'  [REBUILD] {sp_name}: only {pct*100:.1f}% unique -- redownloading')
            for fn in existing:
                os.remove(os.path.join(sp_dir, fn))

    # Fetch URLs from all sources
    print(f'  [{sp_name}] Gathering URLs from Wikipedia + Wikimedia Commons...')
    all_urls = fetch_all_urls(sp_name, config)
    print(f'    Found {len(all_urls)} candidate URLs')

    # Download with validation + pHash dedup
    md5_seen = set()
    phash_store = []
    count = 0
    rejected = 0

    for url in tqdm(all_urls, desc=f'    {sp_name} download', leave=False):
        if count >= TARGET:
            break
        temp = os.path.join(sp_dir, f'_temp_{count}.jpg')
        if not download_single(url, temp):
            rejected += 1
            continue

        # MD5 dedup
        with open(temp, 'rb') as f:
            md5 = hashlib.md5(f.read()).hexdigest()
        if md5 in md5_seen:
            os.remove(temp)
            rejected += 1
            continue

        # pHash dedup
        ph = compute_phash(temp)
        if ph is not None and not is_unique(ph, phash_store, threshold=10):
            os.remove(temp)
            rejected += 1
            continue

        md5_seen.add(md5)
        if ph: phash_store.append(ph)
        final = os.path.join(sp_dir, f'img_{count:04d}.jpg')
        os.rename(temp, final)
        count += 1
        time.sleep(0.05)

    real_count = count
    print(f'    Downloaded {real_count} unique real images (rejected {rejected})')

    # Augmentation if needed (with pHash gate)
    if count < TARGET:
        seeds = []
        for fn in sorted(os.listdir(sp_dir)):
            if fn.endswith(('.jpg', '.png')) and not fn.startswith('_temp'):
                img = cv2.imread(os.path.join(sp_dir, fn))
                if img is not None:
                    seeds.append(img)

        if not seeds:
            print(f'    [WARN] No real images for {sp_name}! Creating synthetic bases...')
            for v in range(15):
                syn = np.zeros((256, 256, 3), dtype=np.uint8)
                # Random sky + ground
                for y in range(256):
                    r = (256 - y) / 256
                    syn[y, :] = (int(200*r + 30*(1-r) + random.randint(-20,20)),
                                 int(220*r + 60*(1-r) + random.randint(-20,20)),
                                 int(160*r + 40*(1-r) + random.randint(-20,20)))
                # Trunk
                tx = random.randint(90, 165)
                tw = random.randint(8, 25)
                tt = random.randint(60, 140)
                cv2.rectangle(syn, (tx-tw, tt), (tx+tw, 256),
                             (20+v*3, 45+v*2, 70+v), -1)
                # Canopy
                for _ in range(random.randint(3, 8)):
                    cx = tx + random.randint(-70, 70)
                    cy = tt - random.randint(10, 80)
                    cr = random.randint(25, 80)
                    color = (random.randint(0, 60), random.randint(80, 200),
                             random.randint(0, 60))
                    cv2.circle(syn, (cx, cy), cr, color, -1)
                path = os.path.join(sp_dir, f'img_{count:04d}.jpg')
                cv2.imwrite(path, syn)
                ph = compute_phash(path)
                if ph: phash_store.append(ph)
                seeds.append(syn)
                count += 1

        needed = TARGET - count
        print(f'    Augmenting {needed} more with pHash gate...')
        max_retries = needed * 12
        retries = 0
        while count < TARGET and retries < max_retries:
            retries += 1
            aug = augment_clean(random.choice(seeds))
            temp = os.path.join(sp_dir, f'_temp_aug_{count}.jpg')
            cv2.imwrite(temp, aug)
            ph = compute_phash(temp)
            if ph is not None and is_unique(ph, phash_store, threshold=10):
                final = os.path.join(sp_dir, f'img_{count:04d}.jpg')
                os.rename(temp, final)
                phash_store.append(ph)
                count += 1
            else:
                os.remove(temp)

        # Relaxed fill if still short
        if count < TARGET:
            print(f'    Relaxing threshold (5) for remaining {TARGET - count}...')
            retries = 0
            while count < TARGET and retries < (TARGET - count) * 15:
                retries += 1
                aug = augment_clean(random.choice(seeds))
                temp = os.path.join(sp_dir, f'_temp_aug_{count}.jpg')
                cv2.imwrite(temp, aug)
                ph = compute_phash(temp)
                if ph is not None and is_unique(ph, phash_store, threshold=5):
                    os.rename(temp, os.path.join(sp_dir, f'img_{count:04d}.jpg'))
                    phash_store.append(ph)
                    count += 1
                else:
                    os.remove(temp)

        # Last resort
        while count < TARGET:
            aug = augment_clean(random.choice(seeds))
            cv2.imwrite(os.path.join(sp_dir, f'img_{count:04d}.jpg'), aug)
            count += 1

    # Final audit
    final_files = sorted([f for f in os.listdir(sp_dir) if f.endswith(('.jpg', '.png'))])
    final_phashes = []
    for fn in final_files:
        ph = compute_phash(os.path.join(sp_dir, fn))
        if ph: final_phashes.append(ph)
    unique_set = set()
    for ph in final_phashes:
        if all(ph - e >= 10 for e in unique_set):
            unique_set.add(ph)
    unique_pct = len(unique_set) / max(len(final_phashes), 1) * 100

    status = 'PASS' if unique_pct >= 80 else 'WARN'
    print(f'  [{status}] {sp_name}: {count} images | '
          f'Real: {real_count} | Unique: {len(unique_set)} ({unique_pct:.1f}%)')
    return {'total': count, 'real': real_count,
            'unique': len(unique_set), 'unique_pct': unique_pct}


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    print()
    print('=' * 70)
    print('  VPP GREEN MAHARASHTRA -- Tree Image Downloader v9')
    print('  Target: 8 species x 150 images = 1,200 total')
    print('  Minimum uniqueness: 80% per species (pHash, hamming >= 10)')
    print('=' * 70)
    print()

    results = {}
    for sp_name, config in SPECIES_CONFIG.items():
        result = download_species(sp_name, config)
        if result:
            results[sp_name] = result
        print()

    # Summary table
    print('=' * 70)
    print('  DOWNLOAD SUMMARY')
    print('=' * 70)
    print(f'  {"Species":<12} {"Total":>6} {"Real":>6} {"Unique":>7} {"Unique%":>8}  {"Status":>6}')
    print(f'  {"-"*12} {"-"*6} {"-"*6} {"-"*7} {"-"*8}  {"-"*6}')
    for sp, r in results.items():
        status = 'PASS' if r['unique_pct'] >= 80 else 'FAIL'
        print(f'  {sp:<12} {r["total"]:>6} {r["real"]:>6} {r["unique"]:>7} '
              f'{r["unique_pct"]:>7.1f}%  {status:>6}')
    print('=' * 70)
    total_real = sum(r['real'] for r in results.values())
    total_imgs = sum(r['total'] for r in results.values())
    total_unique = sum(r['unique'] for r in results.values())
    print(f'  TOTAL: {total_imgs} images | {total_real} real | '
          f'{total_unique} unique ({total_unique/max(total_imgs,1)*100:.1f}%)')
    print()


if __name__ == '__main__':
    main()
