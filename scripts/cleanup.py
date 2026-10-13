"""Remove closed applications; preserve the source verification timestamp."""
import json
from datetime import datetime, timezone, timedelta
from validate_events import DATA, timestamp, validate

def clean(data, now):
    validate(data)
    return {**data, 'events': [e for e in data['events'] if timestamp(e['deadline']) >= now and timestamp(e['starts_at']) >= now]}

if __name__ == '__main__':
    original = json.loads(DATA.read_text(encoding='utf-8'))
    result = clean(original, datetime.now(timezone(timedelta(hours=9))))
    if result != original:
        temporary = DATA.with_suffix('.tmp')
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        temporary.replace(DATA)
    print(f'Removed {len(original["events"]) - len(result["events"])} expired events')
