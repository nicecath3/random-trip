# 🗺️ RandomTrip — 랜덤 여행지 추천 서비스

SVG 지도 기반 룰렛으로 국내 여행지를 랜덤으로 선택하고, 카카오 로컬 API로 추천 장소와 날씨를 함께 보여주는 포트폴리오 프로젝트

---

## 💡 개발 동기

어디로 여행을 갈지 고민하는 상황에서, 직접 선택하는 부담 없이 룰렛으로 여행지를 뽑는 서비스를 만들어보고 싶었습니다.
단순 랜덤 선택에 그치지 않고, SVG 지도 인터랙션 · 애니메이션 룰렛 · 외부 API 연동까지 실무적인 구현 경험을 쌓는 것을 목표로 개발했습니다.

---

## ⚡ 주요 기능

- **전국 지도 룰렛** — SVG 기반 17개 광역시도 지도, 클릭 또는 룰렛으로 지역 선택
- **세부 지역 룰렛** — 선택된 도의 시군구 세부 지도, 클릭 또는 룰렛으로 세부 지역 선택
- **여행지 추천** — 카카오 로컬 API 기반 관광지 / 맛집 / 카페 최대 45개 조회
- **날씨 정보** — 선택된 지역의 현재 날씨 및 최대 5일 예보 (날짜 선택 가능)
- **다시 뽑기** — 결과에서 바로 세부 룰렛으로 재진입

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 언어 | TypeScript |
| 스타일 | SCSS Modules, 디자인 토큰 |
| 지도 | SVG (`@svg-maps/south-korea`), GeoJSON + d3-geo, topojson |
| API | 카카오 로컬 API, OpenWeather API |
| 배포 | Vercel |

---

## 📁 프로젝트 구조

```
app/
├── api/
│   ├── travel/route.ts       # 카카오 로컬 API 프록시 (관광지/맛집/카페)
│   └── weather/route.ts      # OpenWeather API 프록시 (현재 날씨 + 5일 예보)
├── components/
│   ├── KoreaMap/             # SVG 전국 지도 (17개 광역시도, 룰렛 하이라이트)
│   ├── ProvinceMap/          # GeoJSON 세부 지도 (시군구, d3-geo 프로젝션)
│   ├── TravelResult/         # 여행지 추천 카드 목록 + 카테고리 탭
│   └── WeatherCard/          # 날씨 카드 + 날짜 선택
├── data/
│   ├── regions.ts                        # 17개 광역시도 + 시군구 메타데이터
│   ├── korea-merged-municipalities.json  # 시군구 GeoJSON (창원시 등 병합 처리)
│   └── korea-provinces.json             # 광역시도 단일 폴리곤 GeoJSON
├── scripts/
│   └── merge-cities.mjs      # topojson 기반 창원시 구 병합 빌드 스크립트
├── styles/
│   └── tokens.scss           # 디자인 토큰 (색상, 모서리 등)
├── page.tsx                  # 메인 페이지 (2단계 룰렛 상태 관리)
└── globals.scss              # 전역 스타일
```

---

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성 후 아래 값을 입력하세요.

```env
KAKAO_REST_API_KEY=your_kakao_rest_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

#### 카카오 REST API 키 발급
1. [카카오 디벨로퍼스](https://developers.kakao.com) 접속 후 애플리케이션 등록
2. 앱 설정 → 요약 정보 → **REST API 키** 복사
3. 카카오 로컬 서비스 활성화 필요

#### OpenWeather API 키 발급
1. [openweathermap.org](https://openweathermap.org) 가입
2. API keys 탭에서 **Default** 키 복사
3. 키 활성화까지 최대 2시간 소요

### 3. 개발 서버 실행

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000) 접속

---

## 🔧 개발하면서 해결한 문제들

### 1. SVG 상대 좌표 `m`이 절대 좌표 `M`으로 잘못 변환되는 문제

`@svg-maps/south-korea` 패키지에서 광역시 path는 소문자 `m`(상대 좌표)으로 시작합니다. 이를 단순히 `M`(절대 좌표)으로 치환하면 이후 좌표들이 절대값으로 해석되어 지도 전체에 대각선이 그어지는 문제가 발생했습니다.

첫 번째 좌표만 절대 이동(`M`)으로 바꾸고, 나머지는 상대 선(`l`)으로 유지하는 방식으로 해결했습니다.

```ts
path.replace(/^m\s*([-\d.]+\s*,\s*[-\d.]+)/, 'M $1 l')
```

---

### 2. 창원시가 5개 구로 쪼개져 표시되는 문제

원본 GeoJSON 데이터에서 창원시는 의창구·성산구·마산합포구·마산회원구·진해구 5개 구로 분리되어 있었습니다. 세부 지도에서 창원시가 5조각으로 나뉘어 보이고, 룰렛도 5개 코드를 별도로 순환하는 문제가 있었습니다.

빌드 타임에 `topojson-server`로 위상 구조를 분석하고, `topojson-client`의 `merge()`로 같은 시에 속하는 구를 하나의 폴리곤으로 병합하는 스크립트를 작성해 해결했습니다.

---

### 3. 룰렛 결과가 매번 비슷한 위치에서 나오는 문제

총 스텝을 고정값으로 설정하니 `스텝 수 % 지역수`가 항상 같은 오프셋을 만들어 결과 편향이 생겼습니다.

시작 인덱스를 랜덤으로 정하고, 총 스텝을 `최소 바퀴 수 × 항목 수 + 목표까지의 거리`로 동적으로 계산해 항상 목표 항목에서 자연스럽게 멈추도록 수정했습니다.

```ts
const gap = (targetIdx - start + n) % n;
const total = minLaps * n + gap;
```

---

### 4. 소도시 날씨를 가져오지 못하는 문제

OpenWeather API에 한국어 도시명을 직접 전달하면 "의성군" 같은 소도시는 위치를 찾지 못해 오류가 발생했습니다.

카카오 키워드 검색 API로 도시명을 좌표(위도·경도)로 먼저 변환하고, 좌표 기반으로 OpenWeather API를 호출하는 방식으로 변경해 모든 시군구에서 날씨를 정상적으로 가져오도록 했습니다.

---

## 📌 구현 참고 사항

### 지도 데이터
전국 지도는 `@svg-maps/south-korea` npm 패키지, 세부 시군구 지도는 공개 GeoJSON 데이터를 사용합니다. 울릉군은 지리적 특성상 제외했습니다.

### 여행지 조회
카카오 로컬 API는 한 번에 최대 15개, 최대 3페이지(총 45개)까지 조회 가능합니다. 진입 시 3페이지를 순차적으로 요청해 한꺼번에 표시합니다.

### 날씨 예보
OpenWeather 무료 플랜 기준 오늘 포함 최대 5일 예보를 지원합니다.
