'use client';

import SouthKorea from '@svg-maps/south-korea';
import { REGIONS, Region } from '@/app/data/regions';
import styles from './KoreaMap.module.scss';

interface KoreaMapProps {
  highlighted: string | null;
  selected: string | null;
  onSelect: (region: Region) => void;
  isSpinning: boolean;
}

const regionMap = Object.fromEntries(REGIONS.map((r) => [r.id, r]));


function toAbsoluteStart(path: string): string {
  return path.replace(/^m\s*([-\d.]+\s*,\s*[-\d.]+)/, 'M $1 l');
}

function buildMergedPaths(): Record<string, string> {
  const raw: Record<string, string> = {};
  (SouthKorea.locations as any[]).forEach((loc) => { raw[loc.id] = loc.path; });

  const merged: Record<string, string> = {};
  REGIONS.filter((r) => !r.parentId).forEach((province) => {
    const parts = [raw[province.id]];
    REGIONS.filter((r) => r.parentId === province.id).forEach((city) => {
      if (raw[city.id]) parts.push(toAbsoluteStart(raw[city.id]));
    });
    merged[province.id] = parts.join(' ');
  });
  return merged;
}

const MERGED_PATHS = buildMergedPaths();
const PROVINCES = REGIONS.filter((r) => !r.parentId);

export function KoreaMap({ highlighted, selected, onSelect, isSpinning }: KoreaMapProps) {
  const getClass = (id: string) => {
    if (id === selected) return `${styles.region} ${styles.selected}`;
    if (id === highlighted) return `${styles.region} ${styles.highlighted}`;
    return styles.region;
  };

  return (
    <svg viewBox="0 0 460 631" className={styles.svg} xmlns="http://www.w3.org/2000/svg">
      {PROVINCES.map((region) => (
        <path
          key={region.id}
          d={MERGED_PATHS[region.id]}
          className={getClass(region.id)}
          fillRule="evenodd"
          onClick={() => !isSpinning && onSelect(region)}
          style={{ cursor: isSpinning ? 'not-allowed' : 'pointer' }}
        />
      ))}
    </svg>
  );
}
