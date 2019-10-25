
import sys
import json
import logging
from time import sleep
from uuid import uuid4
from copy import deepcopy
from pathlib import Path

import boto3
from ruamel.yaml import YAML

from deploy import extend


logger = logging.getLogger(__name__)


class DeployError(Exception):
    pass


def assertion(statement_result, *args_for_error):
    if not statement_result:
        raise AssertionError(*args_for_error)


def dict_nested_update(base, update):
    """ An implementation of dict update that supports nested dicts """

    # Traverse through update's items (may only be a few)
    for key, new_val in update.items():
        # See if recursion necessary
        if isinstance(base.get(key), dict) and isinstance(new_val, dict):
            # Merge sub-dicts
            dict_nested_update(base[key], update[key])
        else:
            # Not-mergable, so replace directly
            base[key] = deepcopy(new_val)  # new_val may be a nested dict!


def generate_bucket_policy(bucket_name, assets_dir):
    """ Return a bucket policy that gives public read access

    ListBucket permission is also (only) given to items under the assets dir so that
        s3 returns 404 rather than 403 for missing items. Important for CloudFront setup.

    """
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*",
            },
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:ListBucket",
                # NOTE ListBucket is a bucket-level perm; must filter at Condition level
                "Resource": f"arn:aws:s3:::{bucket_name}",
                "Condition": {
                    "StringLike": {
                        "s3:prefix": f"{assets_dir}/*",
                    },
                },
            },
        ],
    })


def generate_cloudfront_config(config, allowed_domains):
    """ Return a CloudFront distribution config """

    # Extract required config
    domains = config['domains']
    bucket = config['bucket']
    logs_bucket = config['logs_bucket']
    cert = config['cert']

    # Keep for long time as will auto invalidate after updating
    # NOTE Does not affect browser caching
    min_ttl = 60 * 60 * 24 * 1  # 1 day

    return {
        'Enabled': True,
        'HttpVersion': 'http2',  # Also includes http1
        'IsIPV6Enabled': True,  # NOTE Additional DNS record required to support this
        'PriceClass': 'PriceClass_All',  # Regions to use
        'Comment': 'Auto-configured',
        'DefaultRootObject': 'index.html',
        'Aliases': {
            'Quantity': len(allowed_domains),
            'Items': tuple(allowed_domains),
        },
        'Origins': {
            'Quantity': 1,
            'Items': [{
                'Id': 'root',
                'DomainName': f'{bucket}.s3.amazonaws.com',
                'OriginPath': '',
                'CustomOriginConfig': {
                    'OriginProtocolPolicy': 'https-only',
                    'OriginSslProtocols': {
                        'Quantity': 1,
                        'Items': ['TLSv1.2'],  # Highest s3 supports (doesn't affect clients)
                    },
                    'HTTPPort': 80,  # Required (default value)
                    'HTTPSPort': 443,  # Required (default value)
                    'OriginReadTimeout': 30,  # Required (default value)
                    'OriginKeepaliveTimeout': 5,  # Required (default value)
                },
                'CustomHeaders': {
                    'Quantity': 1,
                    'Items': [
                        {
                            'HeaderName': 'x-env',
                            'HeaderValue': 'production' if config['production'] else 'staging',
                        },
                    ],
                },
            }],
        },
        'CustomErrorResponses': {
            # Bucket should be configured so that missing assets return 404s but all other
            #   missing items return 403s that are here given the index page instead
            # NOTE Since routing happens client-side, must assume response should be 200
            #   But can still display "Not found" visibly to the actual user when no route
            # NOTE Returning 200 for missing assets can be hard to debug / confuse browsers
            'Quantity': 1,
            'Items': [{
                'ErrorCode': 403,
                'ResponseCode': '200',
                'ResponsePagePath': '/index.html',
                'ErrorCachingMinTTL': min_ttl,
            }],
        },
        'Logging': {
            'Enabled': logs_bucket is not None,
            'Bucket': f'{logs_bucket}.s3.amazonaws.com' if logs_bucket else '',
            'Prefix': f'{domains[0]}/',
            'IncludeCookies': False,
        },
        'ViewerCertificate': {
            'ACMCertificateArn': cert,
            'SSLSupportMethod': 'sni-only',
            'MinimumProtocolVersion': 'TLSv1.2_2018',  # Similar browser support to 1.1 anyway
        },
        'DefaultCacheBehavior': {
            'TargetOriginId': 'root',
            'ViewerProtocolPolicy': 'redirect-to-https',
            'MinTTL': min_ttl,
            # Don't forward REQUEST cookies/queries/headers (for performance)
            'ForwardedValues': {
                'QueryString': False,
                'Cookies': {
                    'Forward': 'none',
                },
            },
            'Compress': True,  # TODO Will this still mean s3->cf is uncompressed and .'. slow?
            # Standard but required
            'AllowedMethods': {
                'Quantity': 2,
                'Items': ['HEAD', 'GET'],
                'CachedMethods': {
                    'Quantity': 2,
                    'Items': ['HEAD', 'GET'],
                },
            },
            'TrustedSigners': {
                'Enabled': False,
                'Quantity': 0,
            },
        },
        'CacheBehaviors': {
            # Defined to make extending easier
            'Quantity': 0,
            'Items': [],
        },
    }


def configure_aws(config_path):
    """ Configure AWS services to host a static single-page site

    Re-run safe

    Uses domain name to identify existing services
        Create services and provide ids manually beforehand to avoid overwritting existing
        Or use a separate domain name to test new configurations and avoid overwritting

    User-set config
        domains -- List of domains that will resolve to the CF dist; primary domain listed first
        assets_dir -- Name of site's assets dir so can return 404s for it rather than index.html
        logs_bucket -- S3 bucket name for CF logs (None to disable logging)

    Auto-set config
        zones -- Route53 zone ids for given domain names
        bucket -- S3 bucket name (no dots allowed so that HTTPS works between S3 and CF)
        cert -- ACM certificate ARN
        dist -- CloudFront distribution ID

    """

    # Access to AWS services
    route53 = boto3.client('route53')
    acm = boto3.client('acm', region_name='us-east-1')  # WARN Must be this region to work with CF
    cloudfront = boto3.client('cloudfront')
    Bucket = boto3.resource('s3').Bucket  # NOTE 'resource' higher level than 'client'

    # Load/create config
    yaml = YAML()
    config = yaml.load(config_path) if config_path.exists() else {}

    # Ensure all user-set config exists
    if 'subdomains' not in config:
        msg = "Are given domains subdomains? (will share their parent's Route53 zone) "
        config['subdomains'] = input(msg) == 'y'
    if 'domains' not in config:
        msg = "Additional domain names (space-separated, www already included): "
        additional = input(msg).strip()
        additional = additional.split() if additional else []
        config['domains'] = [Path.cwd().name, *additional]
        config['zones'] = {}
    if 'assets_dir' not in config:
        config['assets_dir'] = input("Assets dirname (default '_assets'): ") or '_assets'
    if 'logs_bucket' not in config:
        config['logs_bucket'] = input("Logs bucket (default None): ") or None

    # Confirm and save config
    print()
    yaml.dump(config, sys.stdout)
    print()
    if input("Is above config correct? ") != 'y':
        sys.exit("Configure aborted")
    yaml.dump(config, config_path)

    # Determine allowed domains (for ACM and CF)
    allowed_domains = []
    for domain in config['domains']:
        allowed_domains.append(domain)
        allowed_domains.append('*.' + domain)

    # Ensure hosted zones exist for all domains
    logger.info("Checking Route53 hosted zones")
    domains_without_zone = set(config['domains']) - set(config['zones'])
    if domains_without_zone:

        # Use zones for main domains if subdomains
        zone_domains = {d: d for d in config['domains']}
        if config['subdomains']:
            zone_domains = {d: d.partition('.')[2] for d in config['domains']}

        # Get all available zones
        list_response = route53.list_hosted_zones()
        assertion(not list_response['IsTruncated'], "Pagination support required")
        # NOTE Route53 returns domains with single trailing dot
        discovered_zones = {z['Name'].strip('.'): z['Id'] for z in list_response['HostedZones']}

        # Assign zone for all domains without one
        for domain in domains_without_zone:
            zone_domain = zone_domains[domain]

            # See if one already exists
            if zone_domain in discovered_zones:
                logger.info("Zone discovered for " + zone_domain)
                config['zones'][domain] = discovered_zones[zone_domain]
            else:
                # Need to create a new zone
                logger.info("Creating new zone for " + zone_domain)
                resp = route53.create_hosted_zone(Name=zone_domain, CallerReference=str(uuid4()))
                config['zones'][domain] = resp['HostedZone']['Id']
                nameservers = resp['DelegationSet']['NameServers']
                logger.info(f"Set {zone_domain} nameservers to: " + ' '.join(nameservers))

            # Save config change
            yaml.dump(config, config_path)

    # Ensure TLS certificate exists
    logger.info("Checking TLS cert")
    if 'cert' not in config:
        # Get cert ARN if already exists
        list_response = acm.list_certificates()
        assertion('NextToken' not in list_response, "Pagination support required")
        for cert in list_response['CertificateSummaryList']:
            if cert['DomainName'] == config['domains'][0]:
                logger.info("Discovered existing cert")
                config['cert'] = cert['CertificateArn']
                break
        # Create new cert if needed
        if 'cert' not in config:
            logger.info("Creating new TLS cert")
            resp = acm.request_certificate(DomainName=allowed_domains[0], ValidationMethod='DNS',
                SubjectAlternativeNames=allowed_domains[1:])
            sleep(5)  # Slight delay needed before `describe_certificate`
            config['cert'] = resp['CertificateArn']
        yaml.dump(config, config_path)

    # Set DNS records for cert (for validation AND auto-renewal)
    resp = acm.describe_certificate(CertificateArn=config['cert'])
    for data in resp['Certificate']['DomainValidationOptions']:
        # NOTE Validation record for www is same as for root (if same cert), so can just do one
        domain = data['DomainName']
        if domain in config['domains']:
            logger.info("Setting validation DNS record for " + domain)
            zone = config['zones'][domain]
            route53.change_resource_record_sets(HostedZoneId=zone, ChangeBatch={'Changes': [{
                'Action': 'UPSERT',
                'ResourceRecordSet': {
                    'Name': data['ResourceRecord']['Name'],
                    'Type': 'CNAME',
                    'ResourceRecords': [{'Value': data['ResourceRecord']['Value']}],
                    'TTL': 300,  # Required
                },
        }]})

    # Ensure TLS cert has been validated
    logger.info("Waiting for cert to be validated (make sure you set nameservers in registrar)")
    acm.get_waiter('certificate_validated').wait(CertificateArn=config['cert'])

    # Determine bucket name from main domain
    # WARN Must not include dots so HTTPS can work between S3 and CF
    if 'bucket' not in config:
        # NOTE If bucket name taken, should manually set a new one and re-run
        config['bucket'] = config['domains'][0].replace('.', '-')
        yaml.dump(config, config_path)

    # Ensure bucket exists
    logger.info(f"Checking bucket {config['bucket']} exists")
    bucket = Bucket(config['bucket'])
    bucket.load()
    if not bucket.creation_date:
        logger.info(f"Creating bucket {bucket.name}")
        # NOTE Using cheapest region as CF will distribute anyway (apparently defaults to us-east-1)
        bucket.create(CreateBucketConfiguration={'LocationConstraint': 'us-west-2'})
        bucket.wait_until_exists()

    # Grant public read access
    logger.info("Setting bucket access policy")
    bucket.Policy().put(Policy=generate_bucket_policy(bucket.name, config['assets_dir']))

    # Website feature is not needed for single page apps
    logger.info("Removing any website config for bucket")
    bucket.Website().delete()

    # Discover distribution if one exists (checks primary domain only)
    logger.info("Checking dist exists")
    if 'dist' not in config:
        list_response = cloudfront.list_distributions()
        assertion(not list_response.get('IsTruncated'), "Pagination support required")
        for dist in list_response['DistributionList']['Items']:
            if config['domains'][0] in dist['Aliases']['Items']:
                logger.info("Discovered existing dist")
                config['dist'] = dist['Id']
                yaml.dump(config, config_path)
                break

    # Generate CF config
    dist_config = generate_cloudfront_config(config, allowed_domains)
    extend.extend_cloudfront_config(config, dist_config)

    # Either create or update CF dist
    dist_already_exists = 'dist' in config
    dist_domain = None
    if not dist_already_exists:

        # Need to create a new distribution
        logger.info("Creating a new CloudFront distribution")
        dist_config['CallerReference'] = str(uuid4())  # NOTE Must not be set when just updating
        resp = cloudfront.create_distribution(DistributionConfig=dist_config)
        dist_domain = resp['Distribution']['DomainName']
        config['dist'] = resp['Distribution']['Id']
        yaml.dump(config, config_path)

        # Wait for CF to deploy as can't set DNS until exists
        logger.info("Waiting for CF to deploy")
        cloudfront.get_waiter('distribution_deployed').wait(Id=config['dist'])
    else:
        # Update an existing distribution

        # Get the existing config
        dist = cloudfront.get_distribution_config(Id=config['dist'])
        prod_dist_config = dist['DistributionConfig']

        # Update with generated values
        dict_nested_update(prod_dist_config, dist_config)

        # Update the distribution
        logger.info("Updating existing CF dist")
        # NOTE ETag required to confirm have updated from latest version and not a prev one
        resp = cloudfront.update_distribution(Id=config['dist'], DistributionConfig=prod_dist_config,
            IfMatch=dist['ETag'])
        dist_domain = resp['Distribution']['DomainName']

    # Ensure DNS records set
    logger.info("Checking DNS records")
    change_request_ids = {}
    for domain, zone in config['zones'].items():
        changes = []
        for record_domain in (domain, 'www.' + domain):
            for a in ('A', 'AAAA'):
                changes.append({
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': record_domain,
                        'Type': a,
                        'AliasTarget': {
                            'HostedZoneId': 'Z2FDTNDATAQYW2',  # NOTE A constant for all CF dists
                            'DNSName': dist_domain,
                            'EvaluateTargetHealth': False,  # Required
                        },
                    },
                })
        logger.info("Updating DNS records for " + domain)
        resp = route53.change_resource_record_sets(HostedZoneId=zone,
            ChangeBatch={'Changes': changes})
        change_request_ids[domain] = resp['ChangeInfo']['Id']

    # Wait for DNS records to be applied
    logger.info("Waiting for Route53 to apply changes")
    waiter = route53.get_waiter('resource_record_sets_changed')
    for domain, request_id in change_request_ids.items():
        logger.info("Waiting on " + domain)
        waiter.wait(Id=request_id)

    # Wait for dist if didn't wait for it earlier
    # NOTE Avoiding waiting till end if possible as takes longest out of everything
    if dist_already_exists:
        logger.info("Waiting for CF to deploy")
        cloudfront.get_waiter('distribution_deployed').wait(Id=config['dist'])

    # Check if cert will auto-renew
    resp = acm.describe_certificate(CertificateArn=config['cert'])
    if resp['Certificate']['RenewalEligibility'] == 'ELIGIBLE':
        logger.info("Cert will auto-renew")
    else:
        logger.warning("Cert will not auto-renew! (resolve manually)")

    # Done
    logger.info("All done!")
