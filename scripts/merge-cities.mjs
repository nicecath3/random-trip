/**
 * 시군구 GeoJSON에서 "창원시의창구" 같은 시-구 패턴을 감지해
 * 같은 시(市) 소속 구(區)들을 topojson으로 병합 → 단일 폴리곤으로 출력
 */
import { readFileSync, writeFileSync } from 'fs';
import { topology } from 'topojson-server';
import { merge as topoMerge } from 'topojson-client';

const raw = JSON.parse(readFileSync('./app/data/korea-municipalities.json', 'utf8'));

const cityGuPattern = /^(.+시)(.+구)$/;

// 부모 시 이름 추출 (없으면 null)
function parentCity(name) {
  const m = name.match(cityGuPattern);
  return m ? m[1] : null;
}

// feature들을 그룹별로 묶음: { groupName → Feature[] }
function groupFeatures(features) {
  const groups = {};
  for (const f of features) {
    const name = f.properties.name;
    const parent = parentCity(name);
    const key = parent ?? name;  // 구 → 부모시, 그 외 → 자기 자신
    if (!groups[key]) groups[key] = { features: [], code: f.properties.code.substring(0, 5) };
    groups[key].features.push(f);
    // 코드는 그룹의 첫 feature 코드 사용
  }
  return groups;
}

// 그룹을 topojson으로 병합하여 단일 GeoJSON Feature 반환
function mergeGroup(name, group) {
  if (group.features.length === 1) return group.features[0];

  // topojson 변환 후 merge
  const fc = { type: 'FeatureCollection', features: group.features };
  const topo = topology({ layer: fc });
  const merged = topoMerge(topo, topo.objects.layer.geometries);
  return {
    type: 'Feature',
    properties: { name, code: group.code },
    geometry: merged,
  };
}

// 도(道) 코드들 (광역시 제외, 도 자체만)
const DO_CODES = ['31', '32', '33', '34', '35', '36', '37', '38', '39'];

const result = { type: 'FeatureCollection', features: [] };

for (const doCode of DO_CODES) {
  const doFeatures = raw.features.filter(f => f.properties.code.startsWith(doCode));
  const groups = groupFeatures(doFeatures);

  for (const [name, group] of Object.entries(groups)) {
    const merged = mergeGroup(name, group);
    if (merged) result.features.push(merged);
  }
}

writeFileSync('./app/data/korea-merged-municipalities.json', JSON.stringify(result));
console.log(`완료: ${result.features.length}개 시군 (병합 전 ${raw.features.filter(f => DO_CODES.some(c => f.properties.code.startsWith(c))).length}개)`);
