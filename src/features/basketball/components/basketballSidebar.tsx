import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// Pulsating skeleton loader component
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div
    className={`animate-pulse bg-snow-200 dark:bg-[#1F2937] rounded ${className}`}
    style={{ minHeight: "1em" }}
  />
);

interface BasketballLeague {
  league_id: number;
  name: string;
  country: string;
  season: string;
}

interface LeagueListProps {
  allLeagues: BasketballLeague[];
  loading?: boolean;
  searchQuery?: string;
}

const LeagueList: React.FC<LeagueListProps> = ({
  allLeagues,
  loading,
  searchQuery,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleExpand = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const grouped = useMemo(() => {
    const q = (searchQuery ?? "").trim().toLowerCase();
    const filtered = q
      ? allLeagues.filter((l) => (l.name ?? "").toLowerCase().includes(q))
      : allLeagues;

    const map = new Map<string, BasketballLeague[]>();
    for (const league of filtered) {
      const key = (league.country || "Other").trim() || "Other";
      const prev = map.get(key) || [];
      prev.push(league);
      map.set(key, prev);
    }

    const entries = Array.from(map.entries()).map(([category, leagues]) => {
      leagues.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      return { category, leagues };
    });

    entries.sort((a, b) => a.category.localeCompare(b.category));
    return entries;
  }, [allLeagues, searchQuery]);

  if (loading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, idx) => (
          <li key={idx} className="flex mt-4 items-center gap-2 mb-2">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-24 h-4 flex-1" />
            <Skeleton className="w-4 h-4" />
          </li>
        ))}
      </>
    );
  }

  return (
    <>
      {grouped.map(({ category, leagues }) => (
        <div key={category} className="flex flex-col">
          <li
            className="flex mt-4 dark:text-snow-200 items-center gap-2 text-[#586069] text-sm mb-2 cursor-pointer hover:text-brand-primary dark:hover:text-brand-secondary transition-colors"
            onClick={() => toggleExpand(category)}
          >
            <span className="flex-1 font-medium">{category}</span>
            <ChevronUpDownIcon
              className={`ml-auto w-6 transition-transform ${
                expandedCategory === category ? "rotate-180" : ""
              }`}
            />
          </li>

          {expandedCategory === category ? (
            <div className="flex flex-col pl-4">
              {leagues.map((league, idx) => (
                <li
                  key={`${category}-${league.league_id}-${idx}`}
                  className="flex mt-3 dark:text-snow-200 items-center gap-2 text-[#586069] text-sm mb-1 cursor-pointer hover:text-brand-primary dark:hover:text-brand-secondary transition-colors"
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    🏀
                  </div>
                  <span className="flex-1 truncate">{league.name}</span>
                </li>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
};

export const BasketballLeftBar = () => {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<BasketballLeague[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fetchRunIdRef = useRef(0);

  useEffect(() => {
    fetchRunIdRef.current += 1;
    const runId = fetchRunIdRef.current;
    let cancelled = false;

    const fetchAllPages = async () => {
      const limit = 100;

      try {
        setLoading(true);

        const response = await fetch(
          `https://tikianaly-service-backend.onrender.com/api/v1/basketball/leagues/all-leagues?page=1&limit=${limit}`,
        );
        const first = await response.json();
        const firstItemsRaw = first?.responseObject?.items;
        const firstMapped = Array.isArray(firstItemsRaw) ? firstItemsRaw : [];

        if (cancelled || fetchRunIdRef.current !== runId) return;

        setLeagues(firstMapped);
        setLoading(false);

        const totalPages = first?.responseObject?.totalPages;
        let page = 1;
        let hasMore =
          typeof totalPages === "number"
            ? page < totalPages
            : firstMapped.length === limit;

        while (!cancelled && hasMore) {
          page += 1;
          const res = await fetch(
            `https://tikianaly-service-backend.onrender.com/api/v1/basketball/leagues/all-leagues?page=${page}&limit=${limit}`,
          );
          const data = await res.json();
          const raw = data?.responseObject?.items;
          const mapped = Array.isArray(raw) ? raw : [];

          if (cancelled || fetchRunIdRef.current !== runId) return;
          if (mapped.length > 0) {
            setLeagues((prev) => {
              const seen = new Set(prev.map((x) => x.league_id));
              const next = [...prev];
              for (const l of mapped) {
                if (!seen.has(l.league_id)) {
                  seen.add(l.league_id);
                  next.push(l);
                }
              }
              return next;
            });
          }

          const pages = data?.responseObject?.totalPages;
          hasMore =
            typeof pages === "number" ? page < pages : mapped.length === limit;

          await new Promise((r) => setTimeout(r, 75));
        }
      } catch (error) {
        console.error("Error fetching basketball leagues:", error);
        if (!cancelled && fetchRunIdRef.current === runId) setLoading(false);
      }
    };

    fetchAllPages();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get popular leagues (first 10)
  const popularLeagues = useMemo(() => {
    return leagues.slice(0, 10);
  }, [leagues]);

  return (
    <div>
      <div className="flex flex-col gap-y-10">
        {/* Popular Leagues Section */}
        <ul className="bg-white dark:bg-[#161B22] dark:border-[#1F2937] border-1 h-fit border-snow-200 rounded p-5">
          <p className="font-[500] text-[#23272A] dark:text-white">
            Popular Leagues
          </p>
          {loading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <li key={idx} className="flex mt-5 items-center gap-2 mb-4">
                  <Skeleton className="w-6 h-6" />
                  <Skeleton className="w-24 h-4" />
                </li>
              ))
            : popularLeagues.map((league, idx) => (
                <li
                  key={`${league.league_id}-${idx}`}
                  className="flex mt-5 items-center gap-2 dark:text-snow-200 text-[#586069] text-sm mb-4 cursor-pointer hover:text-brand-primary dark:hover:text-brand-secondary transition-colors"
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    🏀
                  </div>
                  <span className="truncate">{league.name}</span>
                </li>
              ))}
        </ul>

        {/* All Leagues Section */}
        <ul className="bg-white dark:bg-[#161B22] dark:border-[#1F2937] border-1 h-fit border-snow-200 rounded p-5">
          <div className="flex items-center my-auto">
            <p className="font-[500] dark:text-white text-[#23272A]">
              All Leagues
            </p>
            <button
              type="button"
              className="ml-auto hover:opacity-70 transition-opacity"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search leagues"
            >
              <MagnifyingGlassIcon className="w-5 h-5 theme-text" />
            </button>
          </div>
          {searchOpen ? (
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-3 w-full rounded border border-snow-200 bg-white px-3 py-2 text-sm text-[#23272A] outline-none focus:border-brand-primary dark:border-[#1F2937] dark:bg-[#0D1117] dark:text-snow-200"
              placeholder="Search leagues..."
            />
          ) : null}
          <LeagueList
            allLeagues={leagues}
            loading={loading}
            searchQuery={searchQuery}
          />
        </ul>
      </div>
    </div>
  );
};

export default BasketballLeftBar;
