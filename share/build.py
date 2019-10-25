""" Build a lambda package ready for deployment """

import os
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_LZMA


# Operate from project root
os.chdir(Path(__file__).absolute().parent.parent)


# Init the archive
archive = ZipFile(Path('share/function.zip'), 'w', ZIP_LZMA)


# Helper for writing files and ensuring permissions correct (lambda requires very permissive)
def add_to_zip(name, path=None, data=None):
    if data is None:
        data = Path(path).read_bytes()
    info = ZipInfo(name)
    info.external_attr = 0o777 << 16  # Write permissions in correct part of attributes
    archive.writestr(info, data)


# Add puzzle images
for image in Path('static/_assets/optional/puzzles').iterdir():
    add_to_zip(f'puzzles/{image.name}', image)


# Add Bible version data
# NOTE Removes chapter titles to significantly reduce size of bundle
for version in Path('static/_assets/optional/versions').iterdir():
    data = json.loads(version.read_text())
    del data['chapter_titles']
    add_to_zip(f'versions/{version.name}', data=json.dumps(data))


# Add required packages
# NOTE packages.zip was generated via `pip install --target container pillow cairosvg`
#   Some meta data dirs excluded to reduce bundle size
with ZipFile('share/packages.zip') as package:
    for name in package.namelist():
        add_to_zip(name, data=package.read(name))


# Add app config
add_to_zip('app_config.json', 'src/app_config.json')


# Add all files in static dir
for file in Path('share/static').iterdir():
    add_to_zip(file.name, file)
