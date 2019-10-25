
import sys
from uuid import uuid4
from typing import Iterable
from pathlib import Path

import boto3
from ruamel.yaml import YAML
from semantic_version import Version


def sync_code(run, config_path:Path, version:str, dry_run:bool) -> None:
    """ Sync files and functions with S3 and lambda """

    # Load config
    yaml = YAML()
    if not config_path.exists():
        sys.exit("Config file doesn't exist. Run `configure` first.")
    config = yaml.load(config_path)

    # Ensure user-set config present
    if 'releases' not in config:
        config['releases'] = input("Path to releases dir: ")
        yaml.dump(config, config_path)
    if 'production' not in config:
        msg = "Is this a production deployment? (rather than prerelease) "
        config['production'] = input(msg) == 'y'
        yaml.dump(config, config_path)

    # Determine version to deploy
    releases_dir = Path(config['releases'])
    valid_versions:Iterable = [Version(p.name) for p in releases_dir.iterdir()]
    if version:
        # Use the given version if exists
        version = Version(version)
        if version not in valid_versions:
            sys.exit("Specified version does not exist in: " + config['releases'])
    else:
        if config['production']:
            # Filter out prereleases and other special versions
            valid_versions = filter(lambda v: not v.prerelease and not v.build, valid_versions)
        # Select the latest version available
        version = max(valid_versions)

    # Sync files
    # WARN aws cli's sync is very basic (time and size only)
    #   May be md5 in future https://github.com/aws/aws-cli/issues/599
    files = releases_dir / str(version) / 'bucket'
    bucket = config['bucket']
    cmd = f"aws s3 sync --delete {files} s3://{bucket}"
    if dry_run:
        cmd += ' --dryrun'
    # Since new releases create new files, sync will always upload even if unchanged (due to time)
    # Testing by size only is very dangerous for changes like 0 -> 1 in code (never do)
    # However, testing by size only works well for images and will save uploading unchanged
    run(cmd + ' --exclude "*.jpg"')
    run(cmd + ' --size-only --exclude "*" --include "*.jpg"')

    # Invalidate all
    # NOTE Trying to work out which paths to invalidate is too risky as:
    #   1. Most changes will affect most files anyway (an asset change will likely affect index too)
    #   2. Whenever index changes, also need to somehow invalidate every route / error response
    #   3. Better for CF to ask origin one extra time than for an assets mismatch to occur
    #   4. CF asks origin once a day already anyway (see current min_ttl value)
    cloudfront = boto3.client('cloudfront')
    cloudfront.create_invalidation(DistributionId=config['dist'], InvalidationBatch={
        'CallerReference': str(uuid4()),
        'Paths': {
            'Quantity': 1,
            'Items': ['/*'],
        },
    })
