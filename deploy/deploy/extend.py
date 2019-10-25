
import boto3


def extend_cloudfront_config(config, dist_config):
    # Refer to share lambda for requests to /_gen_shareable_image
    dist_config['CacheBehaviors']['Quantity'] += 1
    dist_config['CacheBehaviors']['Items'].append({
        'PathPattern': '/_gen_shareable_image',
        'TargetOriginId': 'root',
        'ViewerProtocolPolicy': 'https-only',
        'AllowedMethods': {
            'Quantity': 7,
            # NOTE Have to give all these, given if just want POST
            'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
            # Just triggering lambda, don't need to cache anything (but this is required)
            'CachedMethods': {'Quantity': 2, 'Items': ['GET', 'HEAD']},
        },
        'LambdaFunctionAssociations': {
            'Quantity': 1,
            'Items': [{
                'LambdaFunctionARN': config['lambdas']['share'],
                'EventType': 'origin-request',  # viewer-request would be better but 1 MB code limit
                'IncludeBody': True,
            }],
        },
        # Not actually caching anything, just triggering a lambda
        'MinTTL': 0,
        'DefaultTTL': 0,
        'MaxTTL': 0,
        # Required to be specified
        'Compress': False,
        'SmoothStreaming': False,
        'FieldLevelEncryptionId': '',
        'ForwardedValues': {
            'QueryString': False,
            'Cookies': {'Forward': 'none'},
            'Headers': {'Quantity': 0, 'Items': []},
            'QueryStringCacheKeys': {'Quantity': 0, 'Items': []},
        },
        'TrustedSigners': {
            'Enabled': False,
            'Quantity': 0,
        },
    })
