
import json
import html
from base64 import urlsafe_b64encode, b64decode
from pathlib import Path
from hashlib import sha256

import boto3

from i18n import get_strings
from share_image import ShareImage


APP_CONFIG = json.loads(Path('app_config.json').read_text())


class BadRequest(Exception):
    """ Raised when there is an issue with the data provided by the client """


def gen_404_response(reason):
    return {
        'status': '400',
        'statusDescription': 'Bad Request',
        'headers': {
            'content-type': [{'key': 'Content-Type', 'value': 'application/json; charset=utf-8'}],
        },
        'body': json.dumps({'reason': reason}),
    }


def handler(event, context):
    try:
        return generate_image(event, context)
    except BadRequest as exc:
        return gen_404_response(exc.args[0])


def validate(container, key, required, classinfo, valid_values=None, length=None):
    """ Validate the given value """

    # Confirm key exists
    if key not in container:
        raise BadRequest(f"'{key}' not given")

    # Deal with null case
    value = container[key]
    if value is None:
        if required:
            raise BadRequest(f"'{key}' cannot be null")
        return

    # Ensure correct type
    if not isinstance(value, classinfo):
        raise BadRequest(f"'{key}' is wrong type")

    # Do length check
    if length is not None:
        if len(value) != length:
            raise BadRequest(f"'{key}' must have length {length}")

    # Do value check
    if valid_values:
        if value not in valid_values:
            raise BadRequest(f"'{key}' has invalid value")


def generate_image(event, context):

    # Get input
    request = event['Records'][0]['cf']['request']
    json_body = b64decode(request['body']['data'])
    data = json.loads(json_body)

    # Ensure base item is a dict
    if not isinstance(data, dict):
        raise BadRequest(f"Base item must be an object")

    # Get valid values
    valid_puzzles = [p.stem for p in Path('puzzles').iterdir()]
    valid_versions = [p.stem for p in Path('versions').iterdir()]
    valid_books = json.loads(Path('versions/NIV.json').read_text())['book_names'].keys()

    # Validate input
    expected = {
        # WARN Since puzzle_id and bible_version are used in paths they must not contain ../../ etc
        'puzzle_id': (True, str, valid_puzzles),
        'chapters': (True, str, None, 1189),
        'recent_book': (False, str, valid_books),
        'current_book': (False, str, valid_books),
        'bible_version': (True, str, valid_versions),
        'locale': (True, str),
    }
    for key, args in expected.items():
        validate(data, key, *args)

    # Don't allow extra keys
    for key in set(data.keys()) - set(expected.keys()):
        raise BadRequest(f"'{key}' is not allowed")

    # Generate hash from input
    # Using hash so can generate client-side too and avoid running this if image premade
    # Same input results in same id, so attacker can't generate a same id for different input
    # NOTE Using SHA-256 as has browser support
    # NOTE base64 encoding to reduce ascii length
    urlsafe_hash = urlsafe_b64encode(sha256(json_body).digest()).decode()

    # Convert chapter digits to array of bools
    # NOTE Chapters is expected as a str of 1/0 simply to significantly reduce request size
    chapters = [c == '1' for c in data['chapters']]

    # Generate image
    image, width, height = ShareImage(data['puzzle_id'], chapters, data['recent_book'],
        data['current_book'], data['bible_version'], data['locale']).generate()

    # Determine if staging env or production via custom header
    # NOTE With this type of task, safer to default to production (so works) than staging
    staging = request['origin']['custom']['customHeaders']['x-env'][0]['value'] == 'staging'
    domain = 'next.track.bible' if staging else 'track.bible'
    bucket_name = 'next-track-bible-share' if staging else 'track-bible-share'

    # Generate html
    # NOTE Strips newlines and indentation
    i18n = get_strings(data['locale'])
    page = Path('image_display.html').read_text().replace('\n', '').replace('    ', '').format(
        hash=urlsafe_hash,
        width=width,
        height=height,
        title=html.escape(i18n['page_title']),
        description=html.escape(i18n['page_description']),
        button=html.escape(i18n['page_button']),
        bg_color=APP_CONFIG['theme']['primary'],
        domain=domain,
        bucket=bucket_name,
    )

    # Save to S3
    # NOTE Assumes bucket has same name as function
    bucket = boto3.resource('s3').Bucket(bucket_name)
    bucket.put_object(Key=f'{urlsafe_hash}.jpg', Body=image, ContentType='image/jpeg')
    bucket.put_object(Key=f'{urlsafe_hash}', Body=page.encode(), ContentType='text/html')

    # Return success response with the hash
    return {
        'status': '200',
        'statusDescription': 'OK',
        'headers': {
            'content-type': [{'key': 'Content-Type', 'value': 'application/json; charset=utf-8'}],
        },
        'body': json.dumps({'hash': urlsafe_hash}),
    }
