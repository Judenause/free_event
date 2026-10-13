"""Validate event data before publishing. Standard library only."""
import json
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

DATA = Path(__file__).resolve().parents[1] / 'data/events.json'

def timestamp(value):
    if not isinstance(value, str):
        raise ValueError('Timestamp must be a string')
    result = datetime.fromisoformat(value)
    if result.tzinfo is None:
        raise ValueError('Timestamp must include timezone')
    return result

def validate(data):
    if not isinstance(data, dict) or not isinstance(data.get('events'), list):
        raise ValueError('Expected object with events array')
    if data.get('updated_at') is not None:
        timestamp(data['updated_at'])
    ids = set()
    for e in data['events']:
        for key in ('id', 'title', 'genre', 'region', 'venue', 'description'):
            if not isinstance(e.get(key), str) or not e[key].strip():
                raise ValueError(f'Missing text: {key}')
        if e['id'] in ids:
            raise ValueError(f'Duplicate id: {e["id"]}')
        ids.add(e['id'])
        for key in ('starts_at', 'deadline', 'discovered_at', 'checked_at'):
            timestamp(e.get(key))
        if timestamp(e['deadline']) > timestamp(e['starts_at']):
            raise ValueError('Deadline must not be after event start')
        if type(e.get('tickets_per_person')) is not int or e['tickets_per_person'] < 1:
            raise ValueError('tickets_per_person must be a positive integer')
        value = e.get('value_for_two')
        if value is not None and (type(value) is not int or value < 0):
            raise ValueError('value_for_two must be null or nonnegative integer KRW')
        if not isinstance(e.get('sources'), list) or not e['sources']:
            raise ValueError('At least one verified application source required')
        for source in e['sources']:
            url = urlparse(source.get('url', ''))
            if url.scheme != 'https' or not url.netloc or url.username or url.password:
                raise ValueError('Source must be an HTTPS URL without credentials')
            if not isinstance(source.get('name'), str) or not source['name'].strip():
                raise ValueError('Source name required')
    return data

if __name__ == '__main__':
    data = validate(json.loads(DATA.read_text(encoding='utf-8')))
    print(f'Validated {len(data["events"])} events')
