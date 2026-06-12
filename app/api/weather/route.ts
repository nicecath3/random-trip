const WEATHER_KO: Record<number, string> = {
  200: '가벼운 비 동반 뇌우', 201: '비 동반 뇌우', 202: '폭우 동반 뇌우',
  210: '약한 뇌우', 211: '뇌우', 212: '강한 뇌우', 221: '불규칙적인 뇌우',
  230: '가는 비 동반 뇌우', 231: '비 동반 뇌우', 232: '폭우 동반 뇌우',
  300: '가는 이슬비', 301: '이슬비', 302: '강한 이슬비',
  310: '가는 이슬비', 311: '이슬비', 312: '강한 이슬비',
  313: '소나기 동반 이슬비', 314: '강한 소나기 동반 이슬비', 321: '이슬비 소나기',
  500: '가는 비', 501: '보통 비', 502: '강한 비', 503: '매우 강한 비', 504: '극심한 비',
  511: '진눈깨비', 520: '약한 소나기', 521: '소나기', 522: '강한 소나기', 531: '불규칙적인 소나기',
  600: '가는 눈', 601: '눈', 602: '강한 눈',
  611: '진눈깨비', 612: '약한 진눈깨비 소나기', 613: '진눈깨비 소나기',
  615: '약한 비와 눈', 616: '비와 눈', 620: '약한 눈 소나기', 621: '눈 소나기', 622: '강한 눈 소나기',
  701: '안개', 711: '연기', 721: '실안개', 731: '먼지 소용돌이',
  741: '안개', 751: '모래', 761: '먼지', 762: '화산재', 771: '돌풍', 781: '토네이도',
  800: '맑음',
  801: '약간 흐림', 802: '구름 조금', 803: '구름 많음', 804: '흐림',
};

function toKo(id: number, fallback: string): string {
  return WEATHER_KO[id] ?? fallback;
}

async function getCoords(city: string): Promise<{ lat: number; lon: number } | null> {
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) return null;
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(city)}&size=1`,
    { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lon: parseFloat(doc.x) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const date = searchParams.get('date');

  if (!city) return Response.json({ error: 'city가 필요합니다' }, { status: 400 });

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return Response.json({ error: 'OPENWEATHER_API_KEY가 설정되지 않았습니다' }, { status: 500 });

  const coords = await getCoords(city);
  if (!coords) return Response.json({ error: `"${city}" 위치를 찾을 수 없습니다` }, { status: 404 });

  const { lat, lon } = coords;
  const isToday = !date || date === new Date().toISOString().slice(0, 10);

  if (isToday) {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return Response.json({ error: '날씨 정보를 가져올 수 없습니다' }, { status: res.status });
    const data = await res.json();
    const w = data.weather[0];
    return Response.json({
      date: new Date().toISOString().slice(0, 10),
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      description: toKo(w.id, w.description),
      icon: w.icon,
    });
  }

  // 5일 예보
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric&cnt=40`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return Response.json({ error: '날씨 정보를 가져올 수 없습니다' }, { status: res.status });
  const data = await res.json();

  const target = data.list.find((item: any) => item.dt_txt.startsWith(date) && item.dt_txt.includes('12:00'))
    ?? data.list.find((item: any) => item.dt_txt.startsWith(date));

  if (!target) return Response.json({ error: '해당 날짜의 예보가 없습니다 (최대 5일)' }, { status: 404 });

  const w = target.weather[0];
  return Response.json({
    date,
    temp: Math.round(target.main.temp),
    feels_like: Math.round(target.main.feels_like),
    temp_min: Math.round(target.main.temp_min),
    temp_max: Math.round(target.main.temp_max),
    humidity: target.main.humidity,
    description: toKo(w.id, w.description),
    icon: w.icon,
  });
}
