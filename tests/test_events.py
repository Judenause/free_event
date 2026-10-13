import copy
import sys
import unittest
from pathlib import Path
from datetime import datetime, timezone, timedelta
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))

class EventsTests(unittest.TestCase):
    def setUp(self):
        self.event = dict(id='one', title='공연', genre='연극', region='서울', venue='공연장', starts_at='2026-10-20T19:00:00+09:00', deadline='2026-10-13T23:59:59+09:00', tickets_per_person=2, value_for_two=None, discovered_at='2026-10-12T09:00:00+09:00', checked_at='2026-10-13T09:00:00+09:00', sources=[dict(name='공식', url='https://example.org/event')], description='무료 초대')

    def test_invalid_source_and_duplicate_rejected(self):
        from validate_events import validate
        validate(dict(updated_at=None, events=[self.event]))
        with self.assertRaises(ValueError):
            validate(dict(updated_at=None, events=[self.event, self.event]))
        bad = copy.deepcopy(self.event)
        bad['sources'][0]['url'] = 'javascript:alert(1)'
        with self.assertRaises(ValueError):
            validate(dict(updated_at=None, events=[bad]))

    def test_cleanup_preserves_deadline_day_and_removes_expired(self):
        from cleanup import clean
        now = datetime(2026, 10, 13, 12, tzinfo=timezone(timedelta(hours=9)))
        expired = copy.deepcopy(self.event)
        expired.update(id='old', deadline='2026-10-12T23:59:59+09:00')
        data = dict(updated_at=None, events=[expired, self.event])
        self.assertEqual([e['id'] for e in clean(data, now)['events']], ['one'])

if __name__ == '__main__':
    unittest.main()
