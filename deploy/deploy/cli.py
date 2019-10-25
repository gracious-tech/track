
import os
import sys
import logging
from pathlib import Path

from invoke import task, Collection, Program

from ._version import __version__
from .configure import configure_aws
from .sync import sync_code


CONFIG_PATH = Path('config.yaml')


# Show info logs by default
logging.basicConfig(level='INFO')


@task
def configure(inv):
    configure_aws(CONFIG_PATH)


@task
def sync(inv, version=None, dry_run=False):
    sync_code(inv.run, CONFIG_PATH, version, dry_run)


def main():
    # Set default region for AWS
    # NOTE Set to the cheapest as will distribute with CF anyway
    os.environ['AWS_DEFAULT_REGION'] = 'us-west-2'

    # Run program
    collection = Collection.from_module(sys.modules[__name__])
    Program(__version__, namespace=collection).run()


if __name__ == '__main__':
    main()
