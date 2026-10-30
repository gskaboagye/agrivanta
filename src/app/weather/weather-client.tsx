
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  RefreshCw,
  Search,
  Sun,
  Thermometer,
  Wind,
  Sprout,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
  Sunrise,
  Sunset,
  Umbrella,
} from "lucide-react";

type LocationResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

type WeatherData = {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    wind_speed_10m_max: number[];
  };
  timezone: string;
};

type Place = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
};

const DEFAULT_PLACE: Place = {
  name: "Accra",
  latitude: 5.6037,
  longitude: -0.187,
  admin1: "Greater Accra",
  country: "Ghana",
};

function getWeatherDescription(code: number) {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([56, 57].includes(code)) return "Freezing drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([66, 67].includes(code)) return "Freezing rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if ([96, 99].includes(code)) return "Thunderstorm with hail";
  return "Conditions unavailable";
}

function WeatherIcon({
  code,
  size = 32,
}: {
  code: number;
  size?: number;
}) {
  const props = { size, strokeWidth: 1.7 };

  if (code === 0) return <Sun {...props} />;
  if ([1, 2].includes(code)) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if ([45, 48].includes(code)) return <CloudFog {...props} />;
  if ([51, 53, 55, 56, 57].includes(code))
    return <CloudDrizzle {...props} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain {...props} />;
  if ([95, 96, 99].includes(code))
    return <CloudLightning {...props} />;
  return <Cloud {...props} />;
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Today";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    weekday: "short",
    timeZone: "UTC",
  });
}

function formatTime(value?: string) {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFarmingAdvice(data: WeatherData) {
  const todayRain = data.daily.precipitation_sum[0] ?? 0;
  const rainChance = data.daily.precipitation_probability_max[0] ?? 0;
  const temperature = data.current.temperature_2m;
  const wind = data.current.wind_speed_10m;
  const humidity = data.current.relative_humidity_2m;
  const uv = data.daily.uv_index_max[0] ?? 0;

  const advice: {
    title: string;
    description: string;
    kind: "good" | "caution" | "info";
  }[] = [];

  if (todayRain >= 10 || rainChance >= 70) {
    advice.push({
      title: "Prepare for possible rainfall",
      description:
        "Check field drainage, protect harvested produce, and postpone work that depends on dry soil if rain develops.",
      kind: "caution",
    });
  } else if (rainChance <= 20 && todayRain < 2) {
    advice.push({
      title: "Check crop water needs",
      description:
        "Rainfall looks limited today. Check soil moisture and consider irrigation where crops need it.",
      kind: "info",
    });
  } else {
    advice.push({
      title: "Monitor soil conditions",
      description:
        "Check the field before planting or watering. Local rainfall and soil moisture can differ from the forecast.",
      kind: "good",
    });
  }

  if (temperature >= 33 || uv >= 8) {
    advice.push({
      title: "Take precautions against heat",
      description:
        "Plan strenuous outdoor work for cooler hours and ensure workers and livestock have access to water and shade.",
      kind: "caution",
    });
  }

  if (wind >= 25) {
    advice.push({
      title: "Check wind conditions",
      description:
        "Avoid spraying in unsuitable wind conditions and secure lightweight farm materials.",
      kind: "caution",
    });
  }

  if (humidity >= 85 && todayRain > 0) {
    advice.push({
      title: "Inspect crops for disease",
      description:
        "Humid and wet conditions can favor some fungal diseases. Inspect leaves and follow crop-specific guidance.",
      kind: "info",
    });
  }

  if (advice.length < 3) {
    advice.push({
      title: "Plan field activities",
      description:
        "Use the daily forecast to plan field visits, harvesting, and transport. Recheck conditions before starting.",
      kind: "good",
    });
  }

  return advice.slice(0, 3);
}

export default function WeatherPage() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");

  const loadWeather = useCallback(async (selectedPlace: Place) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        latitude: String(selectedPlace.latitude),
        longitude: String(selectedPlace.longitude),
        timezone: "auto",
        forecast_days: "7",
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "is_day",
          "precipitation",
          "weather_code",
          "wind_speed_10m",
        ].join(","),
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "precipitation_probability_max",
          "sunrise",
          "sunset",
          "uv_index_max",
          "wind_speed_10m_max",
        ].join(","),
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("The weather service could not return a forecast.");
      }

      const data: WeatherData = await response.json();

      if (!data.current || !data.daily?.time?.length) {
        throw new Error("The weather service returned incomplete data.");
      }

      setWeather(data);
    } catch (err) {
      setWeather(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load weather data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWeather(place);
  }, [place, loadWeather]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchTerm = query.trim();

    if (searchTerm.length < 2) {
      setSearchError("Enter a town, city, or location.");
      setResults([]);
      return;
    }

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const params = new URLSearchParams({
        name: searchTerm,
        count: "8",
        language: "en",
        format: "json",
      });

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Location search is temporarily unavailable.");
      }

      const data = await response.json();
      const matches: LocationResult[] = data.results ?? [];

      if (!matches.length) {
        setSearchError("No matching location found. Try another name.");
        return;
      }

      setResults(matches);
    } catch (err) {
      setSearchError(
        err instanceof Error
          ? err.message
          : "Could not search for that location."
      );
    } finally {
      setSearching(false);
    }
  }

  function chooseLocation(result: LocationResult) {
    setPlace({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: result.admin1,
      country: result.country,
    });

    setQuery("");
    setResults([]);
    setSearchError("");
  }

  const advice = weather ? getFarmingAdvice(weather) : [];

  return (
    <main className="min-h-screen bg-[#F8F6EE] px-4 py-6 text-[#183D2B] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#55735D]">
              <Sprout size={18} />
              <span>AGRIVANTA INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Weather &amp; Farming
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776B] sm:text-base">
              Forecasts and practical weather insights to help you plan
              agricultural activities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadWeather(place)}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#DCE4D9] bg-white px-4 py-3 text-sm font-semibold transition hover:border-[#17472D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh forecast
          </button>
        </header>

        {/* Location search */}
        <section className="rounded-2xl border border-[#E4E8DE] bg-white p-4 shadow-sm sm:p-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839184]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a town or city, e.g. Kumasi"
                aria-label="Search weather by location"
                className="w-full rounded-xl border border-[#DCE4D9] bg-[#FCFCF8] py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#9AA59B] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 font-semibold text-white transition hover:bg-[#103720] disabled:opacity-60"
            >
              {searching && <LoaderCircle size={17} className="animate-spin" />}
              Search location
            </button>
          </form>

          {searchError && (
            <p className="mt-3 text-sm text-red-700">{searchError}</p>
          )}

          {results.length > 0 && (
            <div className="mt-4 divide-y divide-[#E9EDE6] rounded-xl border border-[#E4E8DE]">
              {results.map((result) => (
                <button
                  type="button"
                  key={`${result.id}-${result.latitude}`}
                  onClick={() => chooseLocation(result)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F4F7F0]"
                >
                  <MapPin size={18} className="shrink-0 text-[#62816A]" />
                  <span>
                    <span className="block font-semibold">{result.name}</span>
                    <span className="text-sm text-[#748174]">
                      {[result.admin1, result.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-[#68776B]">
            <MapPin size={15} />
            <span>
              Showing weather for{" "}
              <strong className="text-[#17472D]">
                {[place.name, place.admin1, place.country]
                  .filter(Boolean)
                  .join(", ")}
              </strong>
            </span>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-semibold">Unable to load the forecast</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadWeather(place)}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !weather && !error && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-[#E4E8DE] bg-white">
            <LoaderCircle size={32} className="animate-spin text-[#17472D]" />
            <p className="text-sm text-[#68776B]">Loading local weather data...</p>
          </div>
        )}

        {weather && (
          <>
            {/* Current conditions */}
            <section className="relative overflow-hidden rounded-3xl bg-[#17472D] p-6 text-white shadow-sm sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />

              <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="flex items-center gap-2 text-sm text-white/75">
                    <MapPin size={16} />
                    Current conditions
                  </div>

                  <h2 className="mt-3 text-2xl font-bold">
                    {place.name}
                  </h2>

                  <p className="mt-1 text-sm text-white/65">
                    {weather.timezone.replaceAll("_", " ")}
                  </p>

                  <div className="mt-7 flex items-center gap-5">
                    <div className="text-6xl font-semibold tracking-tight sm:text-7xl">
                      {Math.round(weather.current.temperature_2m)}°
                    </div>
                    <div>
                      <WeatherIcon
                        code={weather.current.weather_code}
                        size={46}
                      />
                      <p className="mt-2 text-base font-medium">
                        {getWeatherDescription(weather.current.weather_code)}
                      </p>
                      <p className="mt-1 text-sm text-white/65">
                        Feels like{" "}
                        {Math.round(weather.current.apparent_temperature)}°C
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 text-sm text-white/70">
                    Updated for the latest available weather observation
                    from the weather provider.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 self-end">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <Thermometer
                      size={20}
                      className="text-[#E5C16B]"
                    />
                    <p className="mt-4 text-sm text-white/65">Humidity</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {weather.current.relative_humidity_2m}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <Wind size={20} className="text-[#E5C16B]" />
                    <p className="mt-4 text-sm text-white/65">Wind speed</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {Math.round(weather.current.wind_speed_10m)}
                      <span className="ml-1 text-sm font-normal">km/h</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <Droplets size={20} className="text-[#E5C16B]" />
                    <p className="mt-4 text-sm text-white/65">Rain now</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {weather.current.precipitation}
                      <span className="ml-1 text-sm font-normal">mm</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <Sun size={20} className="text-[#E5C16B]" />
                    <p className="mt-4 text-sm text-white/65">UV index</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {weather.daily.uv_index_max[0] ?? "--"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Forecast */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-[#E5ECDD] p-2.5 text-[#17472D]">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">7-day forecast</h2>
                  <p className="mt-1 text-sm text-[#748174]">
                    Plan your farm activities for the week ahead.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                {weather.daily.time.map((date, index) => (
                  <article
                    key={date}
                    className={`rounded-2xl border p-4 ${
                      index === 0
                        ? "border-[#17472D]/20 bg-[#EAF0E5]"
                        : "border-[#E4E8DE] bg-white"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {formatDay(date, index)}
                    </p>

                    <p className="mt-1 text-xs text-[#849083]">
                      {new Date(`${date}T12:00:00`).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", timeZone: "UTC" }
                      )}
                    </p>

                    <div className="my-5 flex justify-center text-[#557D5B]">
                      <WeatherIcon
                        code={weather.daily.weather_code[index]}
                        size={34}
                      />
                    </div>

                    <p className="min-h-9 text-center text-xs text-[#68776B]">
                      {getWeatherDescription(
                        weather.daily.weather_code[index]
                      )}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                      <span className="font-bold">
                        {Math.round(weather.daily.temperature_2m_max[index])}°
                      </span>
                      <span className="text-[#899488]">
                        {Math.round(weather.daily.temperature_2m_min[index])}°
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 border-t border-[#DDE5D9] pt-3 text-xs text-[#527C8A]">
                      <Droplets size={14} />
                      <span>
                        {weather.daily.precipitation_probability_max[index] ??
                          0}
                        %
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#829083]">
                      {(
                        weather.daily.precipitation_sum[index] ?? 0
                      ).toFixed(1)}{" "}
                      mm expected
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Farming advice */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-[#F0E8D2] p-2.5 text-[#80611E]">
                  <Sprout size={21} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    Farming recommendations
                  </h2>
                  <p className="mt-1 text-sm text-[#748174]">
                    Weather-based suggestions for your farm.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {advice.map((item, index) => (
                  <article
                    key={`${item.title}-${index}`}
                    className="rounded-2xl border border-[#E4E8DE] bg-white p-5"
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                        item.kind === "caution"
                          ? "bg-amber-50 text-amber-700"
                          : item.kind === "good"
                            ? "bg-[#E8F0E5] text-[#17472D]"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.kind === "caution" ? (
                        <Umbrella size={20} />
                      ) : (
                        <Sprout size={20} />
                      )}
                    </div>

                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#68776B]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Sunrise and sunset */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-2xl border border-[#E4E8DE] bg-white p-5">
                <div className="rounded-xl bg-[#F6EBD0] p-3 text-[#9B762C]">
                  <Sunrise size={24} />
                </div>
                <div>
                  <p className="text-sm text-[#748174]">Sunrise</p>
                  <p className="mt-1 text-xl font-bold">
                    {formatTime(weather.daily.sunrise[0])}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-[#E4E8DE] bg-white p-5">
                <div className="rounded-xl bg-[#E8ECE8] p-3 text-[#55735D]">
                  <Sunset size={24} />
                </div>
                <div>
                  <p className="text-sm text-[#748174]">Sunset</p>
                  <p className="mt-1 text-xl font-bold">
                    {formatTime(weather.daily.sunset[0])}
                  </p>
                </div>
              </div>
            </section>

            {/* Attribution and disclaimer */}
            <footer className="border-t border-[#E0E5DB] py-5 text-xs leading-5 text-[#748174]">
              Weather data provided by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                Open-Meteo
              </a>
              . Forecasts are estimates and may change. Farming
              recommendations are general guidance, not official weather
              warnings or crop-specific diagnoses. Check local conditions
              before making important farming decisions.
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
