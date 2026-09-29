// 샘플 기록과 날짜별 테스트 날씨입니다. 실제 API는 사용하지 않습니다.
const TYPES = ['농약', '비료', '관수', '전정', '기타'];
const STORAGE_KEY = 'our-farm-journal-v1';
function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateKey(date);
}
function weatherFor(date) {
  const seed = Math.abs(Math.floor(new Date(`${date}T12:00:00`).getTime() / 86400000));
  const rainy = seed % 6 === 0;
  return { temperature: 22 + seed % 7, probability: rainy ? 80 : 10 + seed % 3 * 10,
    wind: Number((1.2 + seed % 5 * 0.4).toFixed(1)), solar: rainy ? 7.2 : 16 + seed % 4,
    rain: rainy ? 8 : 0, state: rainy ? '비' : seed % 3 === 0 ? '구름 조금' : '맑음' };
}
function initialRecords() {
  const samples = [
    [1, '관수', '감귤밭 전체 관수', '', '2시간', '토양 상태를 확인하고 오전에 관수했습니다.'],
    [3, '농약', '감귤밭 방제 작업', '샘플 약제 A', '물 500L', '작업 당시 환경을 함께 기록했습니다.'],
    [5, '전정', '통풍을 위한 가지 정리', '', '12그루', '안쪽으로 자란 가지를 정리했습니다.'],
    [6, '비료', '감귤나무 비료 주기', '샘플 비료 B', '20kg', '농장 전체에 나누어 사용했습니다.'],
    [10, '관수', '동쪽 구역 관수', '', '1시간', ''],
    [14, '기타', '농장 주변 예초 작업', '', '300평', '작업 통로를 정리했습니다.'],
    [19, '농약', '감귤밭 방제 기록', '샘플 약제 A', '물 400L', ''],
    [34, '비료', '비료 사용 기록', '샘플 비료 C', '15kg', '']
  ];
  return samples.map((s, index) => ({ id: `sample-${index + 1}`, date: daysAgo(s[0]), type: s[1],
    content: s[2], product: s[3], amount: s[4], memo: s[5], weather: weatherFor(daysAgo(s[0])) }));
}
