'use client';

import { useEffect, useState } from 'react';
import { Region } from '@/app/data/regions';
import { WeatherCard } from '@/app/components/WeatherCard';
import styles from './TravelResult.module.scss';

interface Spot {
  id: string;
  title: string;
  address: string;
  category: string;
  phone: string;
  url: string;
}

type CategoryType = 'AT4' | 'FD6' | 'CE7';

const CATEGORIES: { key: CategoryType; label: string }[] = [
  { key: 'AT4', label: '🗺️ 관광지' },
  { key: 'FD6', label: '🍽️ 맛집' },
  { key: 'CE7', label: '☕ 카페' },
];

interface TravelResultProps {
  region: Region;
  onReset: () => void;
}

export function TravelResult({ region, onReset }: TravelResultProps) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryType>('AT4');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSpots([]);

    const fetchAll = async () => {
      try {
        const pages = await Promise.all(
          [1, 2, 3].map((page) =>
            fetch(`/api/travel?region=${encodeURIComponent(region.name)}&category=${category}&page=${page}`)
              .then((res) => res.json())
          )
        );
        for (const data of pages) {
          if (data.error) throw new Error(data.error);
        }
        setSpots(pages.flatMap((data) => data.spots ?? []));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [region.name, category]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.sub}>선택된 여행지</p>
          <h2 className={styles.title}>{region.name}</h2>
        </div>
        <button className={styles.resetBtn} onClick={onReset}>
          🎲 다시 뽑기
        </button>
      </div>

      <WeatherCard city={region.name} />

      <div className={styles.tabs}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`${styles.tab} ${category === c.key ? styles.active : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <p className={styles.status}>불러오는 중...</p>}
      {error && <p className={styles.status}>불러오기 실패: {error}</p>}
      {!loading && !error && spots.length === 0 && (
        <p className={styles.status}>검색 결과가 없습니다</p>
      )}

      {!loading && !error && spots.length > 0 && (
        <ul className={styles.grid}>
          {spots.map((spot) => (
            <li key={spot.id} className={styles.card}>
              <div className={styles.info}>
                <p className={styles.spotTitle}>{spot.title}</p>
                <p className={styles.address}>{spot.address}</p>
                {spot.phone && <p className={styles.phone}>{spot.phone}</p>}
              </div>
              {spot.url && (
                <a href={spot.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  지도 보기
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
