# 무료공연 레이더

서울·경기 무료 공연·영화 시사회 초대 목록을 보여주는 빌드 없는 정적 사이트. 검색, 장르·지역 필터, 최근 24시간 신규, 오늘 마감, 1인 2매, 마감/공연일/2매 가치/신규순 정렬, 브라우저 응모완료 저장을 제공합니다.

초기 데이터는 비어 있습니다. 이전 대화에 언급된 ZIP과 실제 이벤트 8건은 제공되지 않아 옮기지 않았습니다. 허구의 이벤트를 실제 정보처럼 표시하지 않습니다.

## GitHub Pages 설정

1. 저장소 Settings → Pages → Build and deployment → Source에서 **GitHub Actions**를 선택합니다.
2. Actions → Daily refresh and Pages deploy → Run workflow에서 main으로 실행합니다.
3. 배포 성공 후 주소는 https://Judenause.github.io/free_event/ 입니다. 사용자 도메인을 설정하면 주소가 달라집니다.

워크플로는 main 푸시, 수동 실행, 매일 한국 시간 08:17(UTC 23:17)에 검증·만료 정리·배포합니다. 예약 실행 시각은 GitHub 상황에 따라 지연될 수 있습니다. 정리 커밋이 새 실행을 유발하지 않아도 같은 실행에서 변경 데이터를 배포합니다. 저장소 규칙이 봇의 main 직접 푸시를 차단하면 커밋 단계가 실패하므로 규칙에 맞는 별도 업데이트 경로가 필요합니다.

참고: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 로컬 실행과 검증

Python 3.12 이상과 Node.js를 사용합니다. 추가 패키지는 필요하지 않습니다.

```sh
python scripts/validate_events.py
python -m unittest discover -s tests
node --check assets/app.js
python -m http.server 8000
```

http://localhost:8000 으로 엽니다. 파일을 직접 열면 브라우저가 JSON 로딩을 차단할 수 있습니다.

## 이벤트 데이터

data/events.json의 최상위 필드는 updated_at(마지막 정보 검색 시각 또는 null), events(배열)입니다. 모든 이벤트는 무료 초대로 확인된 항목만 등록합니다. 다음은 **스키마 설명용 예시이며 실제 이벤트가 아닙니다**.

```json
{
  "id": "stable-event-id",
  "title": "공연명",
  "genre": "연극",
  "region": "서울",
  "venue": "공연장",
  "starts_at": "2026-10-20T19:00:00+09:00",
  "deadline": "2026-10-18T23:59:59+09:00",
  "tickets_per_person": 2,
  "value_for_two": null,
  "discovered_at": "2026-10-13T09:00:00+09:00",
  "checked_at": "2026-10-13T09:00:00+09:00",
  "sources": [{"name": "공식 응모처", "url": "https://example.org/event"}],
  "description": "응모 방법, 초대 인원, 발표일, 응모처별 조건 등"
}
```

장르: 영화/연극/뮤지컬/클래식/국악/기타. 지역: 서울/수원/용인/성남/화성/기타. value_for_two는 근거 있는 2매 정상가 합계(원)이며 미확인은 null입니다. 날짜에는 시간대가 필요합니다. 동일 공연은 sources로 응모처를 묶고 id를 유지해야 브라우저 응모 체크가 유지됩니다.

cleanup.py는 응모 마감 또는 공연 시작이 지난 항목만 삭제합니다. 재확인 없이 updated_at을 바꾸지 않습니다. 원문 확인 자체를 수행하는 스크립트는 아닙니다.

## 자동 수집 상태

**신규 이벤트 검색 자동화는 아직 연결되지 않았습니다.** AUTOMATION_PROMPT.md는 별도 검색 작업에 사용할 지침입니다. GitHub Actions 자체에는 검색 모델, 크롤러 또는 외부 서비스 키가 없습니다. 기존 ChatGPT 예약 작업도 이 저장소 업로드만으로 변경되지 않습니다. 검증된 events.json을 커밋하면 사이트에 반영됩니다.

응모 체크는 현재 브라우저 localStorage에만 저장하며 브라우저 간 동기화되지 않습니다. 외부 폰트 연결이 실패하면 시스템 글꼴로 표시됩니다.
