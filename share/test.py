
import os
import sys
import json
from shutil import rmtree
from pprint import pprint
from base64 import b64encode
from pathlib import Path
from zipfile import ZipFile
from subprocess import run
from unittest.mock import MagicMock, patch


# Determine some paths
share_dir = Path(__file__).absolute().parent
tmp_dir = share_dir / 'tmp_function'


# Build the function
run(f'python {share_dir}/build.py', shell=True, check=True)


# Extract built zip to tmp dir
ZipFile(share_dir / 'function.zip').extractall(tmp_dir)


# Change CWD to the extracted code as it expects
os.chdir(tmp_dir)


# Import endpoint from extracted code
sys.path.append(str(tmp_dir))
import endpoint


# Test data
data = b64encode(json.dumps({
    'puzzle_id': '023',
    'chapters': '1' * (1189 - 600) + '0' * 600,
    'recent_book': 'gen',
    'current_book': 'song',
    'bible_version': 'ESV',
    'locale': 'en',
}).encode())


# Prepare fake event
event = MagicMock()
# NOTE MagicMock returns same MagicMock child regardless of value of [key|index]
#   This means values are given for documentation only and it is the depth that really matters
#   A value set at a certain depth will be returned regardless of keys used to get there
# NOTE When mocking dict/list, must set return_value of parent's __getitem__ rather than item itself
body_depth = event['Records'][0]['cf']['request']['body']
# NOTE Avoids overriding that depth entirely as headers will also be used and should be left mocked
body_depth.__getitem__ = lambda self, k: data if k == 'data' else MagicMock()


# Fake put_object method that saves files for inspection rather than uploading to S3
def patched_put_object(**kwargs):
    (share_dir / kwargs['Key']).write_bytes(kwargs['Body'])


# Execute handler with boto3's put_object patched
with patch('endpoint.boto3') as boto3:
    boto3.resource('s3').Bucket('track-bible-shares').put_object = patched_put_object
    pprint(endpoint.handler(event, MagicMock()))


# Rm tmp dir
rmtree(tmp_dir)
