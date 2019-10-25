
from setuptools import setup, find_packages

setup(
    name='deploy',
    version='0.0.0',
    packages=find_packages(),
    console_scripts=['deploy = deploy.cli:main'],
)
