""" Download puzzle images from unsplash """

from pathlib import Path

import requests


# Work out paths
project_dir = Path(__file__).absolute().parent.parent
urls_file = project_dir / 'scripts/unsplash_urls.txt'
images_dir = project_dir / 'static/_assets/optional/puzzles'

# Work out image width and height
# WARN Must sync any dimension changes with share lambda
size_multiplier = 30  # 30 results in 1230*870
width = 41 * size_multiplier
height = 29 * size_multiplier

# Get list of unsplash urls
unsplash_urls = []
for url in urls_file.read_text().splitlines():
    # Ignore empty lines
    if not url:
        continue
    # Proper image URLS start with following (different to display page versions)
    assert url.startswith('https://images.unsplash.com/photo-')
    # Add url without any query params
    unsplash_urls.append(url.partition('?')[0])

# Ensure no duplicates
if len(unsplash_urls) != len(set(unsplash_urls)):
    print("WARNING: Duplicates detected")

# Work out query params
# NOTE Using pjpg so image will load quick pixelated, and then properly later
params = f'?w={width}&h={height}&fit=crop&fm=pjpg&q=75&crop='

# Specify crop behaviour or default to center
# See https://docs.imgix.com/apis/url/size/crop
crop_mode = {
    0:  'edges',
    24: 'edges',
    50: 'bottom',
    58: 'edges',
    66: 'bottom',
    73: 'bottom',
    78: 'edges',
    81: 'top',
}

# Download the images
for num, url in enumerate(unsplash_urls):

    # Determine where to save image
    file = images_dir / f'{num:03}.jpg'
    if file.exists():
        print(f"Skipping existing {file}")
        continue
    print(f"Downloading for {file}")

    # Stream the request so not all loaded into memory
    request = requests.get(url + params + crop_mode.get(num, 'center'), stream=True)
    assert request.status_code == 200  # NOTE Only 200 responses have a body to download
    with file.open('wb') as opened_file:
        for chunk in request:
            opened_file.write(chunk)
