from setuptools import setup, find_packages

VERSION = '0.1'

setup(
    name='betcoin-api',
    version=VERSION,
    packages=find_packages(),
    install_requires=[
        'Flask==0.12.2',
        'requests==2.18.4',
    ],
)
