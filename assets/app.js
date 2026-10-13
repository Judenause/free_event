'use strict';
const $ = id => document.getElementById(id);
const key = 'free-event-radar.applied.v1';
let applied = new Set(), events = [];
try {
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  if (!Array.isArray(saved)) throw new Error('Invalid saved selections');
  applied = new Set(saved.filter(v => typeof v === 'string'));
} catch { $('storage-warning').hidden = false; }
const date = value => new Date(value);
const format = value => new Intl.DateTimeFormat('ko-KR', {timeZone:'Asia/Seoul', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}).format(date(value));
const day = value => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'}).format(date(value));
function node(tag, text, cls) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
function render() {
  const now = new Date(), query = $('search').value.trim().toLocaleLowerCase();
  const recent = e => now - date(e.discovered_at) >= 0 && now - date(e.discovered_at) < 86400000;
  const list = events.filter(e => date(e.deadline) >= now && date(e.starts_at) >= now)
    .filter(e => !query || [e.title,e.venue,e.description].join(' ').toLocaleLowerCase().includes(query))
    .filter(e => !$('genre').value || e.genre === $('genre').value)
    .filter(e => !$('region').value || e.region === $('region').value)
    .filter(e => !$('two').checked || e.tickets_per_person === 2)
    .filter(e => !$('new').checked || recent(e))
    .filter(e => !$('hide').checked || !applied.has(e.id));
  const sort = $('sort').value;
  list.sort((a,b) => sort === 'value_for_two' ? (b.value_for_two ?? -1) - (a.value_for_two ?? -1) : sort === 'discovered_at' ? date(b[sort]) - date(a[sort]) : date(a[sort]) - date(b[sort]));
  $('count').textContent = `${list.length}건`;
  $('events').replaceChildren();
  if (!list.length) $('events').append(node('p', events.length ? '조건에 맞는 열려 있는 초대가 없습니다.' : '확인된 초대를 기다리고 있어요. 새 정보가 등록되면 여기에 표시됩니다.', 'empty'));
  for (const e of list) {
    const card = node('article', undefined, 'card'), badges = node('div', undefined, 'badges');
    badges.append(node('span', e.genre, 'badge'));
    if (recent(e)) badges.append(node('span', 'NEW', 'badge'));
    if (day(e.deadline) === day(now)) badges.append(node('span', '오늘 마감', 'badge urgent'));
    if (e.tickets_per_person === 2) badges.append(node('span', '1인 2매', 'badge'));
    card.append(badges, node('h3',e.title), node('p',`${format(e.starts_at)} · ${e.region} ${e.venue}`), node('p',`응모 마감 ${format(e.deadline)}`), node('p',e.value_for_two === null ? '무료 초대 · 2매 가치 미확인' : `무료 초대 · 2매 가치 ${e.value_for_two.toLocaleString('ko-KR')}원`));
    const details = node('details');
    details.append(node('summary','상세정보'),node('p',e.description),node('p',`마지막 확인 ${format(e.checked_at)}`));
    const sources = node('div',undefined,'sources');
    for (const source of e.sources) {
      const url = new URL(source.url);
      if (url.protocol !== 'https:') continue;
      const link = node('a',`${source.name} 응모하기`);
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; sources.append(link);
    }
    const label = node('label',undefined,'applied'), check = node('input');
    check.type = 'checkbox'; check.checked = applied.has(e.id);
    check.addEventListener('change', () => {
      check.checked ? applied.add(e.id) : applied.delete(e.id);
      try { localStorage.setItem(key,JSON.stringify([...applied])); } catch { $('storage-warning').hidden = false; }
      if ($('hide').checked) render();
    });
    label.append(check,document.createTextNode(' 응모완료'));
    card.append(details,sources,label); $('events').append(card);
  }
}
for (const id of ['search','genre','region','sort','two','new','hide']) $(id).addEventListener('input', render);
async function load() {
  try {
    const response = await fetch('data/events.json',{cache:'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.events)) throw new Error('Invalid events data');
    events = data.events;
    $('updated').textContent = data.updated_at ? `정보 확인 ${format(data.updated_at)} · 한국 시간 기준` : '아직 확인된 이벤트가 없습니다 · 한국 시간 기준';
    render();
  } catch (error) {
    console.error('Event loading failed',error);
    $('updated').textContent = '정보를 불러오지 못했습니다';
    $('events').replaceChildren(node('p','목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.','empty'));
  }
}
load();
setInterval(render,60000);
