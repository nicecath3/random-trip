// 카카오 로컬 API — 지역명 기반 관광지/음식점 검색
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');        // 지역명 (예: 부산, 진주시)
  const category = searchParams.get('category') ?? 'AT4'; // AT4=관광명소, FD6=음식점, CE7=카페

  if (!region) {
    return Response.json({ error: 'region이 필요합니다' }, { status: 400 });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return Response.json({ error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다' }, { status: 500 });
  }

  const page = searchParams.get('page') ?? '1';

  const keywordUrl = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  keywordUrl.searchParams.set('query', `${region} ${category === 'FD6' ? '맛집' : category === 'CE7' ? '카페' : '관광지'}`);
  keywordUrl.searchParams.set('category_group_code', category);
  keywordUrl.searchParams.set('size', '15');
  keywordUrl.searchParams.set('page', page);

  const res = await fetch(keywordUrl.toString(), {
    headers: { Authorization: `KakaoAK ${key}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return Response.json({ error: '장소 정보 로딩 실패' }, { status: res.status });
  }

  const data = await res.json();
  const documents = data.documents ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spots = documents.map((d: any) => ({
    id: d.id,
    title: d.place_name,
    address: d.road_address_name || d.address_name,
    category: d.category_name,
    phone: d.phone,
    url: d.place_url,
  }));

  return Response.json({ spots, isEnd: data.meta?.is_end ?? true });
}
