'use client';

import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import municipalData from '@/app/data/korea-merged-municipalities.json';
import provinceData from '@/app/data/korea-provinces.json';
import { Region } from '@/app/data/regions';
import styles from './ProvinceMap.module.scss';

interface CityFeature {
  code: string;      // 2자리(광역시) 또는 5자리(시군)
  name: string;
  path: string;
  centroid: [number, number];
}

interface Props {
  province: Region;
  subRegions: Region[];   // 해당 도의 광역시 목록
  highlighted: string | null;
  selected: string | null;
  onSelect: (name: string, geoCode: string) => void;
}

const WIDTH = 400;
const HEIGHT = 340;

export function ProvinceMap({ province, subRegions, highlighted, selected, onSelect }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  const { allFeatures, metroGeoCodes } = useMemo(() => {
    const metroGeoCodes = new Set(subRegions.map((r) => r.geoCode!).filter(Boolean));

    // 도(道) 시군구 features (광역시 구 제외)
    const doFeatures = (municipalData as FeatureCollection).features.filter((f) => {
      const code: string = (f.properties as any).code ?? '';
      return code.startsWith(province.geoCode!) && !metroGeoCodes.has(code.substring(0, 2));
    });

    // 광역시는 province-level 단일 폴리곤 사용
    const metroFeatures = (provinceData as FeatureCollection).features.filter((f) => {
      const code: string = (f.properties as any).code ?? '';
      return metroGeoCodes.has(code);
    });

    return { allFeatures: [...doFeatures, ...metroFeatures], metroGeoCodes };
  }, [province, subRegions]);

  const cities = useMemo(() => {
    if (allFeatures.length === 0) return [];
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], {
      type: 'FeatureCollection',
      features: allFeatures,
    } as FeatureCollection);
    const pathGen = geoPath(projection);

    return allFeatures.map((f) => {
      const props = f.properties as any;
      const code: string = props.code;
      // 광역시는 2자리 코드, 시군은 5자리 코드
      return {
        code,
        name: props.name as string,
        path: pathGen(f as Feature<Geometry>) ?? '',
        centroid: pathGen.centroid(f as Feature<Geometry>) as [number, number],
      } satisfies CityFeature;
    });
  }, [allFeatures]);

  const getClass = (code: string) => {
    const gc = code.length === 2 ? code : code.substring(0, 2);
    const isSelected    = code === selected    || gc === selected;
    const isHighlighted = code === highlighted || gc === highlighted;
    if (isSelected)    return `${styles.region} ${styles.selected}`;
    if (isHighlighted) return `${styles.region} ${styles.highlighted}`;
    return styles.region;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = WIDTH  / rect.width;
    const scaleY = HEIGHT / rect.height;
    setTooltip((prev) =>
      prev ? { ...prev, x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY } : prev
    );
  };

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {cities.map((city) => {
          const geoCode = city.code.length === 2 ? city.code : city.code.substring(0, 2);
          return (
            <g
              key={city.code}
              onClick={() => onSelect(city.name, geoCode)}
              onMouseEnter={() => setTooltip({ name: city.name, x: city.centroid[0], y: city.centroid[1] })}
            >
              <path d={city.path} className={getClass(city.code)} />
            </g>
          );
        })}

        {tooltip && (
          <g pointerEvents="none">
            <rect
              x={tooltip.x - 36}
              y={tooltip.y - 26}
              width={72}
              height={20}
              rx={4}
              className={styles.tooltipBg}
            />
            <text x={tooltip.x} y={tooltip.y - 13} className={styles.tooltipText}>
              {tooltip.name}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
