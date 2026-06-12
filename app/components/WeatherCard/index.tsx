'use client';

import { useEffect, useState } from 'react';
import styles from './WeatherCard.module.scss';

interface WeatherData {
  date: string;
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
}

interface WeatherCardProps {
  city: string;
}

const today = new Date().toISOString().slice(0, 10);

function getMaxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toISOString().slice(0, 10);
}

export function WeatherCard({ city }: WeatherCardProps) {
  const [date, setDate] = useState(today);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/weather?city=${encodeURIComponent(city)}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWeather(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [city, date]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>날씨</span>
        <input
          type="date"
          className={styles.datePicker}
          value={date}
          min={today}
          max={getMaxDate()}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p className={styles.status}>날씨 불러오는 중...</p>}
      {error && <p className={styles.statusError}>{error}</p>}

      {!loading && !error && weather && (
        <div className={styles.body}>
          <div className={styles.main}>
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className={styles.icon}
            />
            <div>
              <p className={styles.temp}>{weather.temp}°</p>
              <p className={styles.desc}>{weather.description}</p>
            </div>
          </div>
          <div className={styles.details}>
            <span>최고 {weather.temp_max}°</span>
            <span>최저 {weather.temp_min}°</span>
            <span>습도 {weather.humidity}%</span>
            <span>체감 {weather.feels_like}°</span>
          </div>
        </div>
      )}
    </div>
  );
}
