// 화면 구성과 동작을 모았습니다. 데이터 형식은 mock.js에서 수정할 수 있습니다.
const page = document.body.dataset.page;
let storageError = '';
let records = loadRecords();
const params = new URLSearchParams(location.search);
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  book: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M12 8h5M12 12h5"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  leaf: '<path d="M19 4C6 2 2 9 7 16s15 0 12-12Z"/><path d="m5 21 10-12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  drop: '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/>'
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`; }
function esc(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) { const seed = initialRecords(); localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return seed; }
    const data = JSON.parse(saved);
    if (!Array.isArray(data) || data.some(r => !r || typeof r.id !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !TYPES.includes(r.type) || typeof r.content !== 'string' || !r.weather || ['temperature', 'probability', 'wind', 'solar', 'rain'].some(k => !Number.isFinite(r.weather[k])))) throw new Error('Invalid data');
    return data;
  } catch (error) {
    storageError = '브라우저에 저장된 기록을 불러올 수 없습니다. 현재는 샘플을 표시합니다. 저장 공간과 브라우저 설정을 확인해주세요.';
    return initialRecords();
  }
}
function persist(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); records = next; return true; }
  catch (error) { alert('기록을 저장하지 못했습니다. 브라우저의 저장 공간 또는 개인정보 설정을 확인해주세요. 입력한 내용은 이 화면에 남아 있습니다.'); return false; }
}
function sorted(items = records) { return [...items].sort((a, b) => b.date.localeCompare(a.date)); }
function pretty(date) { return new Date(`${date}T12:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }); }
function badge(type) { return `<span class="badge type-${TYPES.indexOf(type)}">${esc(type)}</span>`; }
function latest(type) { return sorted().find(r => r.type === type && r.date <= dateKey()); }
function count(items, type) { return items.filter(r => r.type === type).length; }
function periodRecords(period) { return sorted().filter(r => r.date <= dateKey() && (period === 'all' || r.date >= daysAgo(Number(period) - 1))); }
function heading(eyebrow, title, description, action = '') { return `<header class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${action}</header>`; }
const writeLink = '<a class="button primary" href="write.html"><span>＋</span> 팜 다이어리 작성</a>';
const navItems = [['home', 'index.html', '투데이 팜', 'home'], ['list', 'list.html', '팜 다이어리', 'book'], ['report', 'report.html', 'AI 농장 리포트', 'spark']];
document.getElementById('app').innerHTML = `
  <aside class="sidebar"><a class="brand" href="index.html"><img class="brand-logo" src="assets/grinbeelogo.png" alt="그린비 로고"><span>마이 팜<small>디지털 팜 다이어리 + AI</small></span></a>
  <div class="nav-label">MY FARM</div><nav aria-label="주요 메뉴">${navItems.map(([key, href, title, symbol]) => `<a href="${href}" ${page === key || (key === 'list' && ['write', 'detail'].includes(page)) ? 'class="active" aria-current="page"' : ''}>${icon(symbol)}<span>${title}</span></a>`).join('')}</nav>
  <div class="sidebar-bottom"><div class="farm-avatar">${icon('leaf')}</div><div><strong>우리 감귤 농장</strong><small>함께 쌓아가는 농장 이야기</small></div></div></aside>
  <div class="workspace"><div class="topbar"><span>나의 농장 관리</span><span class="demo-label"><i></i> Mock Data 체험 버전</span></div>
  <main id="main">${storageError ? `<p class="notice" role="alert">${storageError}</p>` : ''}</main><footer>마이 팜 · 작은 기록이 더 나은 농장을 만듭니다.<span>날씨·AI는 테스트 데이터입니다.</span></footer></div>`;
const main = document.getElementById('main');
function weatherPanel(w, title = '자동 연결된 환경정보') {
  return `<section class="card weather-panel"><div class="section-top"><h2>${title}</h2><span class="subtle">테스트 날씨</span></div><div class="weather-state">${icon('sun')} ${esc(w.state)}</div><div class="weather-grid">${[
    ['기온', `${w.temperature}<small>°C</small>`, 'sun'], ['강수확률', `${w.probability}<small>%</small>`, 'drop'],
    ['풍속', `${w.wind}<small>m/s</small>`, 'wind'], ['일사량', `${w.solar}<small>MJ/m²</small>`, 'sun']
  ].map(([label, value, symbol]) => `<div>${icon(symbol)}<span>${label}</span><strong>${value}</strong></div>`).join('')}</div><p class="hint">작업 날짜 기준으로 자동 연결되는 테스트 환경정보입니다.</p></section>`;
}
function recordRows(items) {
  if (!items.length) return '<div class="empty">아직 기록이 없어요.<p>첫 팜 다이어리를 작성해 농장의 이야기를 남겨보세요.</p><a href="write.html" class="text-link">＋ 팜 다이어리 작성</a></div>';
  return `<div class="record-table"><div class="table-head"><span>작업일</span><span>작업 종류</span><span>작업 내용</span><span>작업량</span><span>당시 날씨</span><span></span></div>${items.map(r => `<a class="record-row" href="detail.html?id=${encodeURIComponent(r.id)}"><span class="record-date">${esc(r.date.replaceAll('-', '.'))}</span><span>${badge(r.type)}</span><span class="record-content"><strong>${esc(r.content)}</strong><small>${esc(r.product || '우리 감귤 농장')}</small></span><span>${esc(r.amount || '—')}</span><span class="row-weather">${icon('sun')} ${r.weather.temperature}° <small>${esc(r.weather.state)} · ${r.weather.wind}m/s</small></span><span class="arrow">↗</span></a>`).join('')}</div>`;
}
function briefing(items) {
  if (!items.length) return '선택한 기간에 기록이 없습니다. 팜 다이어리를 남기면 작업과 환경정보를 함께 요약해드려요.';
  return `총 ${items.length}건의 농작업을 기록했어요. 농약 작업 ${count(items, '농약')}회, 관수 ${count(items, '관수')}회, 비료 작업 ${count(items, '비료')}회가 포함되어 있어요. 가장 최근 작업은 ${pretty(items[0].date)}의 ${items[0].type} 작업입니다.`;
}
function homePage() {
  const w = weatherFor(dateKey());
  main.insertAdjacentHTML('beforeend', heading('TODAY’S FARM', '투데이 팜', '오늘도, 마이 팜의 하루를 살펴보세요.', writeLink) + `
    <p class="hero-date">${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
    <section class="hero"><div class="hero-image"><img src="assets/aifarm.png" alt="에너지 자립, IoT 센싱, AI 의사결정이 연결된 오렌지팜 AI 통합 솔루션"></div></section>
    <section class="card current-weather"><div class="current-temperature">${icon('sun')}<div><span>오늘의 날씨 · ${w.state}</span><strong>${w.temperature}<small>°C</small></strong></div></div><div class="weather-stat"><span>강수확률</span><strong>${w.probability}<small>%</small></strong></div><div class="weather-stat"><span>풍속</span><strong>${w.wind}<small>m/s</small></strong></div><div class="weather-stat"><span>일사량</span><strong>${w.solar}<small>MJ/m²</small></strong></div><span class="weather-note">테스트 환경정보</span></section>
    <div class="section-top outside"><h2>최근 작업 한눈에 보기</h2><span class="subtle">꾸준한 기록, 꼼꼼한 농장 관리</span></div><div class="latest-grid">${['농약', '관수', '비료'].map((type, i) => { const r = latest(type); return `<a class="card latest-card" href="${r ? `detail.html?id=${encodeURIComponent(r.id)}` : 'write.html'}"><span class="metric-icon color-${i}">${icon(i === 1 ? 'drop' : 'leaf')}</span><div><span>최근 ${type} 작업</span><strong>${r ? pretty(r.date) : '기록 없음'}</strong><small>${r ? esc(r.content) : '첫 작업을 기록해보세요'}</small></div><span class="arrow">↗</span></a>`; }).join('')}</div>
    <section class="briefing"><div class="briefing-icon">${icon('spark')}</div><div><div class="section-top"><h2>오늘의 AI 농장 소식</h2><span class="pill">MOCK AI</span></div><p>최근 7일 동안 ${briefing(periodRecords('7'))}</p><a class="text-link" href="report.html">농장 리포트 자세히 보기 <span>→</span></a></div></section>
    <section class="card records-card"><div class="section-top"><h2>최근 팜 다이어리 <span class="count">${records.length}</span></h2><a class="text-link muted" href="list.html">전체 보기 →</a></div>${recordRows(sorted().slice(0, 4))}</section>`);
}
function writePage() {
  const editId = params.get('id');
  const existing = records.find(r => r.id === editId);
  if (editId && !existing) return missingPage();
  const r = existing || { date: dateKey(), type: '농약', content: '', product: '', amount: '', memo: '' };
  main.insertAdjacentHTML('beforeend', heading('FARM JOURNAL', existing ? '팜 다이어리 수정' : '팜 다이어리 작성', '오늘의 작업을 간단히 남겨주세요. 날씨는 자동으로 연결됩니다.') + `
    <a class="back-link" href="${existing ? `detail.html?id=${encodeURIComponent(editId)}` : 'index.html'}">← ${existing ? '작업 상세' : '투데이 팜'}으로</a>
    <div class="form-layout"><form id="journal-form" class="card form-card"><h2>어떤 작업을 하셨나요?</h2><label for="date">작업 날짜 <span class="required">*</span></label><input id="date" name="date" type="date" required max="${dateKey()}" value="${r.date}">
    <fieldset><legend>작업 종류 <span class="required">*</span></legend><div class="type-options">${TYPES.map(t => `<label><input type="radio" name="type" value="${t}" ${r.type === t ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></fieldset>
    <label for="content">작업 내용 <span class="required">*</span></label><input id="content" name="content" required maxlength="200" placeholder="예: 감귤밭 전체 관수" value="${esc(r.content)}">
    <div class="input-pair"><div><label for="product">농약·비료명 <span class="optional">선택</span></label><input id="product" name="product" maxlength="100" placeholder="사용한 제품명" value="${esc(r.product)}"></div><div><label for="amount">작업량 <span class="optional">선택</span></label><input id="amount" name="amount" maxlength="100" placeholder="예: 20kg, 2시간" value="${esc(r.amount)}"></div></div>
    <label for="memo">메모 <span class="optional">선택</span></label><textarea id="memo" name="memo" rows="4" maxlength="2000" placeholder="다음에 기억하고 싶은 내용을 적어주세요.">${esc(r.memo)}</textarea><div class="form-actions"><a class="button secondary" href="${existing ? `detail.html?id=${encodeURIComponent(editId)}` : 'index.html'}">취소</a><button class="button primary" type="submit">${existing ? '수정 내용 저장' : '저장하기'} →</button></div></form>
    <aside><div id="linked-weather">${weatherPanel(existing ? r.weather : weatherFor(r.date))}</div><p class="local-note">${icon('book')} 기록은 이 브라우저에 저장됩니다.<br>다른 기기와 자동으로 동기화되지 않습니다.</p></aside></div>`);
  document.getElementById('date').addEventListener('change', e => { if (e.target.validity.valid && e.target.value) document.getElementById('linked-weather').innerHTML = weatherPanel(existing && e.target.value === existing.date ? existing.weather : weatherFor(e.target.value)); });
  document.getElementById('journal-form').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const contentInput = form.elements.content;
    if (!contentInput.value.trim()) { contentInput.setCustomValidity('작업 내용을 입력해주세요.'); contentInput.reportValidity(); contentInput.addEventListener('input', () => contentInput.setCustomValidity(''), { once: true }); return; }
    const data = new FormData(form);
    const entry = { id: existing ? existing.id : `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: data.get('date'), type: data.get('type'), content: data.get('content').trim(), product: data.get('product').trim(), amount: data.get('amount').trim(), memo: data.get('memo').trim() };
    entry.weather = existing && entry.date === existing.date ? existing.weather : weatherFor(entry.date);
    if (persist(existing ? records.map(item => item.id === existing.id ? entry : item) : [...records, entry])) location.href = 'list.html?saved=1';
  });
}
function listPage() {
  main.insertAdjacentHTML('beforeend', heading('FARM JOURNAL', '팜 다이어리', '차곡차곡 쌓인 마이 팜의 기록을 만나보세요.', writeLink) + `${params.has('saved') ? '<p class="success" role="status">팜 다이어리를 저장했습니다.</p>' : ''}${params.has('deleted') ? '<p class="success" role="status">기록을 삭제했습니다.</p>' : ''}
    <section class="card filters"><div class="filter-tabs" role="group" aria-label="작업 종류 필터">${['전체', ...TYPES].map((t, i) => `<button type="button" data-type="${t}" class="filter-tab ${i === 0 ? 'selected' : ''}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div><div class="search-fields"><div class="search-input"><label for="search">작업·농약·비료 검색</label><input id="search" type="search" placeholder="작업 내용이나 제품명을 검색하세요"></div><div><label for="from">시작일</label><input id="from" type="date"></div><div><label for="to">종료일</label><input id="to" type="date"></div><button id="reset" class="button secondary" type="button">초기화</button></div></section><div class="section-top outside"><h2>작업 기록 <span id="result-count" class="count"></span></h2><span class="subtle">최근 날짜순</span></div><p id="filter-error" role="status"></p><section id="list-results" class="card" aria-live="polite"></section>`);
  let selected = '전체';
  function refresh() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const from = document.getElementById('from').value, to = document.getElementById('to').value;
    document.getElementById('filter-error').textContent = from && to && from > to ? '종료일을 시작일 이후로 선택해주세요.' : '';
    const matches = sorted().filter(r => (selected === '전체' || selected === r.type) && (!from || r.date >= from) && (!to || r.date <= to) && [r.content, r.product, r.memo].join(' ').toLowerCase().includes(query));
    document.getElementById('result-count').textContent = `${matches.length}건`;
    document.getElementById('list-results').innerHTML = matches.length ? recordRows(matches) : '<div class="empty">조건에 맞는 기록이 없습니다.<p>검색어나 날짜를 변경하거나 새 기록을 작성해주세요.</p></div>';
  }
  document.querySelectorAll('[data-type]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.type; document.querySelectorAll('[data-type]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); refresh(); }));
  ['search', 'from', 'to'].forEach(id => document.getElementById(id).addEventListener('input', refresh));
  document.getElementById('reset').addEventListener('click', () => { ['search', 'from', 'to'].forEach(id => document.getElementById(id).value = ''); document.querySelector('[data-type="전체"]').click(); });
  refresh();
}
function missingPage() { main.insertAdjacentHTML('beforeend', '<section class="card empty"><h1>기록을 찾을 수 없습니다.</h1><p>삭제된 기록이거나 올바르지 않은 주소입니다.</p><a class="button primary" href="list.html">팜 다이어리로 돌아가기</a></section>'); }
function detailPage() {
  const r = records.find(item => item.id === params.get('id'));
  if (!r) return missingPage();
  main.insertAdjacentHTML('beforeend', heading('JOURNAL DETAIL', '작업 상세', '그날의 작업과 농장 환경을 함께 확인하세요.') + `<a class="back-link" href="list.html">← 이전 팜 다이어리</a><div class="form-layout"><section class="card detail-card"><div class="section-top">${badge(r.type)}<span class="subtle">${esc(r.date)}</span></div><h2>${esc(r.content)}</h2><dl><div><dt>작업 날짜</dt><dd>${esc(r.date)}</dd></div><div><dt>작업 종류</dt><dd>${esc(r.type)}</dd></div><div><dt>농약·비료명</dt><dd>${esc(r.product || '입력하지 않음')}</dd></div><div><dt>작업량</dt><dd>${esc(r.amount || '입력하지 않음')}</dd></div><div><dt>메모</dt><dd class="preserve">${esc(r.memo || '메모가 없습니다.')}</dd></div></dl><div class="form-actions"><button id="delete" type="button" class="button danger">기록 삭제</button><a class="button primary" href="write.html?id=${encodeURIComponent(r.id)}">기록 수정</a></div></section>${weatherPanel(r.weather, '작업 당시 환경정보')}</div>`);
  document.getElementById('delete').addEventListener('click', () => { if (confirm('이 작업 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.') && persist(records.filter(item => item.id !== r.id))) location.href = 'list.html?deleted=1'; });
}
function environmentSummary(period, items) {
  // 일별 테스트 날씨를 한 번씩 집계합니다. 작업이 많은 날도 중복 집계하지 않습니다.
  const start = period === 'all' ? (items.length ? items[items.length - 1].date : dateKey()) : daysAgo(Number(period) - 1);
  const end = new Date(`${dateKey()}T12:00:00`), day = new Date(`${start}T12:00:00`);
  let temperature = 0, wind = 0, rain = 0, days = 0;
  while (day <= end) { const w = weatherFor(dateKey(day)); temperature += w.temperature; wind += w.wind; rain += w.rain; days++; day.setDate(day.getDate() + 1); }
  return { temperature: (temperature / days).toFixed(1), wind: (wind / days).toFixed(1), rain, days };
}
function answerQuestion(question, period) {
  let selectedPeriod = /한\s*달|30일|한달/.test(question) ? '30' : /7일|일주일/.test(question) ? '7' : /전체/.test(question) ? 'all' : period;
  const items = periodRecords(selectedPeriod);
  const type = TYPES.find(t => question.includes(t)) || (question.includes('방제') ? '농약' : null);
  if (/마지막|최근.*언제/.test(question) && type) {
    const last = latest(type);
    return last ? `전체 기록 기준, 마지막 ${type} 작업일은 ${last.date}입니다. 작업 내용은 “${last.content}”이며 작업량은 ${last.amount || '기록되지 않았습니다.'}${last.amount ? '입니다.' : ''}` : `${type} 작업 기록이 아직 없습니다.`;
  }
  const label = selectedPeriod === 'all' ? '전체 기간' : `오늘을 포함한 최근 ${selectedPeriod}일`;
  if (type) return `${label}의 ${type} 작업은 총 ${count(items, type)}회입니다.${items.filter(r => r.type === type).map(r => `\n• ${r.date}: ${r.content}${r.product ? ` (${r.product})` : ''}`).join('')}`;
  if (/날씨|기온|강수|풍속|환경/.test(question)) { const env = environmentSummary(selectedPeriod, items); return `${label}의 일별 테스트 날씨 기준 평균 기온은 ${env.temperature}°C, 누적 강수량은 ${env.rain}mm, 평균 풍속은 ${env.wind}m/s입니다.`; }
  if (/요약|작업|기록|소식/.test(question)) return `${label}: ${briefing(items)}`;
  return '이 체험 버전은 저장된 작업 횟수, 마지막 작업일, 환경 요약에 답할 수 있어요. “최근 한 달간 농약을 몇 번 사용했어?” 또는 “마지막 관수는 언제 했어?”라고 질문해보세요.';
}
function reportPage() {
  main.insertAdjacentHTML('beforeend', heading('FARM INSIGHTS', 'AI 농장 리포트', '마이 팜의 기록을 모아, 이해하기 쉬운 이야기로.', '<span class="pill">MOCK AI</span>') + `<div class="report-toolbar"><div class="filter-tabs" role="group" aria-label="리포트 기간">${[['7', '최근 7일'], ['30', '최근 30일'], ['all', '전체 기간']].map(([value, label], i) => `<button class="filter-tab ${i === 0 ? 'selected' : ''}" data-period="${value}" aria-pressed="${i === 0}">${label}</button>`).join('')}</div><span id="period-label" class="subtle"></span></div><div id="report-results" aria-live="polite"></div><section class="card chat-card"><div class="section-top"><h2>${icon('spark')} 마이 팜에 대해 물어보세요</h2><span class="pill">MOCK AI</span></div><p class="subtle">실제 AI 연결 없이 저장된 기록을 바탕으로 답하는 체험 기능입니다.</p><div id="chat-log" class="chat-log" role="log" aria-label="농장 질문과 답변"><div class="chat-message assistant">안녕하세요! 작업 횟수와 마지막 작업일, 농장 환경이 궁금하신가요?</div></div><div class="suggestions"><button type="button">최근 한 달간 농약을 몇 번 사용했어?</button><button type="button">마지막 관수는 언제 했어?</button></div><form id="question-form" class="question-form"><label class="sr-only" for="question">농장 데이터 질문</label><input id="question" required maxlength="300" placeholder="농장 기록에 대해 질문해보세요"><button class="button primary" type="submit">질문하기 ↑</button></form></section>`);
  let period = '7';
  function refresh() {
    const items = periodRecords(period), env = environmentSummary(period, items);
    document.getElementById('period-label').textContent = `${period === 'all' ? (items.length ? items[items.length - 1].date : dateKey()) : daysAgo(Number(period) - 1)} ~ ${dateKey()}`;
    document.getElementById('report-results').innerHTML = `<div class="latest-grid report-metrics">${['농약', '관수', '비료'].map((type, i) => `<section class="card"><span class="metric-icon color-${i}">${icon(i === 1 ? 'drop' : 'leaf')}</span><span>${type === '농약' ? '농약 · 방제' : type} 작업</span><strong>${count(items, type)}<small>회</small></strong></section>`).join('')}</div><section class="card"><div class="section-top"><h2>환경 요약</h2><span class="subtle">기간 내 ${env.days}일 · 일별 테스트 날씨</span></div><div class="environment-grid"><div><span>평균 기온</span><strong>${env.temperature}<small>°C</small></strong></div><div><span>누적 강수량</span><strong>${env.rain}<small>mm</small></strong></div><div><span>평균 풍속</span><strong>${env.wind}<small>m/s</small></strong></div></div></section><section class="briefing"><div class="briefing-icon">${icon('spark')}</div><div><h2>기록으로 살펴본 마이 팜</h2><p>${briefing(items)}</p><span class="hint">저장된 기록을 요약한 Mock AI 소식입니다.</span></div></section>`;
  }
  document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => { period = button.dataset.period; document.querySelectorAll('[data-period]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); refresh(); }));
  const form = document.getElementById('question-form');
  form.addEventListener('submit', e => { e.preventDefault(); const input = document.getElementById('question'); const question = input.value.trim(); if (!question) return; const log = document.getElementById('chat-log'); log.insertAdjacentHTML('beforeend', `<div class="chat-message user">${esc(question)}</div><div class="chat-message assistant preserve">${esc(answerQuestion(question, period))}</div>`); input.value = ''; log.scrollTop = log.scrollHeight; input.focus(); });
  document.querySelectorAll('.suggestions button').forEach(b => b.addEventListener('click', () => { document.getElementById('question').value = b.textContent; form.requestSubmit(); }));
  refresh();
}
({ home: homePage, write: writePage, list: listPage, detail: detailPage, report: reportPage }[page] || homePage)();
