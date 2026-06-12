'use client';

import { useState, useCallback } from 'react';
import { REGIONS, Region } from '@/app/data/regions';
import { KoreaMap } from '@/app/components/KoreaMap';
import { ProvinceMap } from '@/app/components/ProvinceMap';
import { TravelResult } from '@/app/components/TravelResult';
import mergedMunicipalData from '@/app/data/korea-merged-municipalities.json';
import styles from './page.module.scss';

function getCityCodes(province: Region, subRegions: Region[]): string[] {
  const geoCodes = [province.geoCode!, ...subRegions.map((r) => r.geoCode!)].filter(Boolean);
  return (mergedMunicipalData as any).features
    .filter((f: any) => geoCodes.some((gc) => f.properties.code.startsWith(gc)))
    .map((f: any) => f.properties.code as string);
}

function runRoulette(
  items: string[],
  onTick: (id: string) => void,
  onDone: (id: string) => void,
  speed: { base: number; range: number },
) {
  const target = items[Math.floor(Math.random() * items.length)];
  const start = Math.floor(Math.random() * items.length);
  const gap = (items.indexOf(target) - start + items.length) % items.length;
  const total = 3 * items.length + gap;
  let step = start;
  const tick = () => {
    onTick(items[step % items.length]);
    step++;
    if (step < start + total) {
      const progress = (step - start) / total;
      setTimeout(tick, speed.base + speed.range * Math.pow(progress, 2.5));
    } else {
      onDone(target);
    }
  };
  setTimeout(tick, 0);
}

const PROVINCES = REGIONS.filter((r) => !r.parentId);

export default function Home() {
  const [highlighted, setHighlighted]   = useState<string | null>(null);
  const [province, setProvince]         = useState<Region | null>(null);
  const [subHighlight, setSubHighlight] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ name: string; geoCode: string } | null>(null);
  const [isSpinning, setIsSpinning]     = useState(false);

  const subRegions = province ? REGIONS.filter((r) => r.parentId === province.id) : [];

  const pickProvince = (region: Region) => {
    setProvince(region);
    setSelectedCity(null);
    setSubHighlight(null);
  };

  const spinMap = useCallback(() => {
    if (isSpinning) return;
    setProvince(null);
    setSelectedCity(null);
    setIsSpinning(true);
    const ids = PROVINCES.map((r) => r.id);
    runRoulette(
      ids,
      (id) => setHighlighted(id),
      (targetId) => {
        setHighlighted(targetId);
        setIsSpinning(false);
        setTimeout(() => {
          pickProvince(PROVINCES.find((r) => r.id === targetId)!);
          setHighlighted(null);
        }, 400);
      },
      { base: 60, range: 520 },
    );
  }, [isSpinning]);

  const spinProvince = useCallback(() => {
    if (!province || isSpinning) return;
    setSelectedCity(null);
    setIsSpinning(true);
    const allCodes = getCityCodes(province, subRegions);
    if (allCodes.length === 0) { setIsSpinning(false); return; }
    runRoulette(
      allCodes,
      (code) => setSubHighlight(code),
      (targetCode) => {
        setSubHighlight(targetCode);
        setIsSpinning(false);
        setTimeout(() => {
          const geoCode = targetCode.substring(0, 2);
          const name = (mergedMunicipalData as any).features
            .find((f: any) => f.properties.code === targetCode)?.properties.name
            ?? REGIONS.find((r) => r.geoCode === geoCode)?.name
            ?? province.name;
          setSelectedCity({ name, geoCode });
          setSubHighlight(null);
        }, 400);
      },
      { base: 40, range: 300 },
    );
  }, [province, subRegions, isSpinning]);

  const handleCitySelect = (name: string, geoCode: string) => {
    if (isSpinning) return;
    setSelectedCity({ name, geoCode });
    setSubHighlight(null);
  };

  const resetToProvince = () => {
    setSelectedCity(null);
    setSubHighlight(null);
    setTimeout(() => spinProvince(), 0);
  };

  const selectedRegion = selectedCity
    ? { ...(REGIONS.find((r) => r.geoCode === selectedCity.geoCode) ?? province!), name: selectedCity.name }
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>RandomTrip</span>
        <span className={styles.logoSub}>랜덤 여행지 추천</span>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>전국 지도</span>
          <KoreaMap
            highlighted={highlighted}
            selected={province?.id ?? null}
            onSelect={(r) => !isSpinning && pickProvince(r)}
            isSpinning={isSpinning}
          />
          <button
            className={`${styles.spinBtn} ${isSpinning ? styles.spinning : ''}`}
            onClick={spinMap}
            disabled={isSpinning}
          >
            {isSpinning && !province ? '돌아가는 중...' : '🎲 지역 룰렛'}
          </button>
        </aside>

        <main className={styles.panel}>
          {!province && (
            <div className={styles.placeholder}>
              <p className={styles.placeholderIcon}>✈️</p>
              <p className={styles.placeholderText}>
                지도를 클릭하거나<br />룰렛을 돌려 지역을 선택하세요
              </p>
            </div>
          )}

          {province && !selectedCity && (
            <div className={styles.subPanel}>
              <div className={styles.subTop}>
                <div>
                  <p className={styles.subLabel}>세부 지역 선택</p>
                  <h2 className={styles.subTitle}>{province.name}</h2>
                </div>
                <button
                  className={`${styles.subSpinBtn} ${isSpinning ? styles.spinning : ''}`}
                  onClick={spinProvince}
                  disabled={isSpinning}
                >
                  {isSpinning ? '돌아가는 중...' : '🎲 세부 룰렛'}
                </button>
              </div>
              <div className={styles.subMapWrap}>
                <ProvinceMap
                  province={province}
                  subRegions={subRegions}
                  highlighted={subHighlight}
                  selected={null}
                  onSelect={handleCitySelect}
                />
              </div>
            </div>
          )}

          {province && selectedCity && selectedRegion && (
            <TravelResult region={selectedRegion as Region} onReset={resetToProvince} />
          )}
        </main>
      </div>
    </div>
  );
}
