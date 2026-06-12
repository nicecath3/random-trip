export interface Region {
  id: string;
  name: string;
  areaCode: number;
  parentId?: string;
  geoCode?: string; // korea-municipalities.json 에서 시군구를 필터할 앞 2자리 코드
}

export const REGIONS: Region[] = [
  // ── 9개 도 (지도에 표시되는 주요 단위) ──────────────────────────────
  { id: 'gyeonggi',          name: '경기도',   areaCode: 31, geoCode: '31' },
  { id: 'gangwon',           name: '강원도',   areaCode: 32, geoCode: '32' },
  { id: 'north-chungcheong', name: '충청북도', areaCode: 33, geoCode: '33' },
  { id: 'south-chungcheong', name: '충청남도', areaCode: 34, geoCode: '34' },
  { id: 'north-jeolla',      name: '전라북도', areaCode: 35, geoCode: '35' },
  { id: 'south-jeolla',      name: '전라남도', areaCode: 36, geoCode: '36' },
  { id: 'north-gyeongsang',  name: '경상북도', areaCode: 37, geoCode: '37' },
  { id: 'south-gyeongsang',  name: '경상남도', areaCode: 38, geoCode: '38' },
  { id: 'jeju',              name: '제주도',   areaCode: 39, geoCode: '39' },

  // ── 광역시/특별시 ──
  { id: 'seoul',    name: '서울',  areaCode: 1,  parentId: 'gyeonggi',          geoCode: '11' },
  { id: 'incheon',  name: '인천',  areaCode: 2,  parentId: 'gyeonggi',          geoCode: '23' },
  { id: 'daejeon',  name: '대전',  areaCode: 3,  parentId: 'south-chungcheong', geoCode: '25' },
  { id: 'sejong',   name: '세종',  areaCode: 8,  parentId: 'south-chungcheong', geoCode: '29' },
  { id: 'daegu',    name: '대구',  areaCode: 4,  parentId: 'north-gyeongsang',  geoCode: '22' },
  { id: 'gwangju',  name: '광주',  areaCode: 5,  parentId: 'south-jeolla',      geoCode: '24' },
  { id: 'busan',    name: '부산',  areaCode: 6,  parentId: 'south-gyeongsang',  geoCode: '21' },
  { id: 'ulsan',    name: '울산',  areaCode: 7,  parentId: 'south-gyeongsang',  geoCode: '26' },
];
