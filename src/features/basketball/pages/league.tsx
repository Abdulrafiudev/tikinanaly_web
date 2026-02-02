import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FooterComp } from "@/components/layout/Footer";
import {
  ChevronUpDownIcon,
  HeartIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import StaggerChildren from "@/animations/staggerChildren";
import { getAllBasketballLeagues } from "@/lib/api/endpoints";
import { useNavigate } from "react-router-dom";

interface League {
  name: string;
  icon?: string;
  id: number;
  category?: string;
}

type ApiLeague = {
  league_id?: number;
  name?: string;
  country?: string;
  season?: string;
};

type ApiResponse = {
  success?: boolean;
  responseObject?: {
    items?: ApiLeague[];
    totalPages?: number;
    page?: number;
  };
};

export const BasketballLeague = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"suggestions" | "all">(
    "suggestions",
  );

  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewLeagues, setPreviewLeagues] = useState<League[]>([]);

  const [loadingAll, setLoadingAll] = useState(false);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [allPage, setAllPage] = useState(1);
  const [allHasMore, setAllHasMore] = useState(true);

  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const mapLeague = (league: ApiLeague): League | null => {
    const id = league.league_id;
    if (!id || !league.name) return null;
    return {
      id,
      name: league.name,
      icon: undefined, // specific icon not always available, generic usage or find flag logic
      category: league.country,
    };
  };

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoadingPreview(true);
        const res = (await getAllBasketballLeagues(1, 100)) as ApiResponse;
        const items = res?.responseObject?.items ?? [];
        const mapped = items.map(mapLeague).filter(Boolean) as League[];
        setPreviewLeagues(mapped);
      } catch (e) {
        console.error(e);
        setPreviewLeagues([]);
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();
  }, []);

  const loadAll = async (page: number) => {
    try {
      setLoadingAll(true);
      const res = (await getAllBasketballLeagues(page, 100)) as ApiResponse;
      const items = res?.responseObject?.items ?? [];
      const mapped = items.map(mapLeague).filter(Boolean) as League[];

      setAllLeagues((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const next = [...prev];
        for (const l of mapped) {
          if (!seen.has(l.id)) next.push(l);
        }
        return next;
      });

      const totalPages = res?.responseObject?.totalPages;
      if (typeof totalPages === "number") {
        setAllHasMore(page < totalPages);
      } else {
        setAllHasMore(mapped.length > 0);
      }
      setAllPage(page);
    } catch (e) {
      console.error(e);
      setAllHasMore(false);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "all") return;
    if (allLeagues.length > 0) return;
    void loadAll(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const suggestions = useMemo(
    () => previewLeagues.slice(0, 6),
    [previewLeagues],
  );

  const groupedCountries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    const filtered = q
      ? previewLeagues.filter((l) => l.name.toLowerCase().includes(q))
      : previewLeagues;

    const map = new Map<string, League[]>();
    for (const league of filtered) {
      const key = (league.category || "Other").trim() || "Other";
      const prev = map.get(key) || [];
      prev.push(league);
      map.set(key, prev);
    }

    const entries = Array.from(map.entries()).map(([country, leagues]) => {
      leagues.sort((a, b) => a.name.localeCompare(b.name));
      return { country, leagues };
    });

    entries.sort((a, b) => a.country.localeCompare(b.country));
    return entries;
  }, [previewLeagues, countrySearchQuery]);

  return (
    <div className="dark:bg-[#0D1117] min-h-screen">
      <PageHeader />

      {/* Toggle Header */}
      <div className="flex border-b cursor-pointer sticky top-0 z-10 backdrop-blur-2xl dark:text-snow-100 theme-border">
        <div
          className={`flex-1 py-3 text-center ${
            activeTab === "suggestions"
              ? "border-b-4 border-brand-secondary"
              : ""
          }`}
          onClick={() => setActiveTab("suggestions")}
        >
          Suggestions
        </div>
        <div
          className={`flex-1 py-3 text-center ${
            activeTab === "all" ? "border-b-4 border-brand-secondary" : ""
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Leagues
        </div>
      </div>

      {/* Animated Content */}
      <div className="page-padding-x overflow-hidden min-h-[70vh]">
        <AnimatePresence mode="wait">
          {activeTab === "suggestions" && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.2 }}
              className="w-full pt-5"
            >
              {/* Suggestions content */}
              <StaggerChildren
                className="grid grid-cols-3 gap-4 text-center items-stretch"
                stagger={0.15}
              >
                {suggestions.map((league, idx) => (
                  <div
                    key={league.name + idx}
                    className="game-block flex flex-col text-center gap-3 theme-text text-sm items-center justify-center p-4 hover:border-brand-primary dark:hover:border-brand-secondary transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to basketball page with filtered league if possible,
                      // currently generic basketball page filters by league via internal state.
                      // For now we might just navigate to main basketball page or if we implement query param support later.
                      navigate("/basketball");
                    }}
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      🏀
                    </div>
                    <span className="text-center">{league.name}</span>
                  </div>
                ))}
              </StaggerChildren>

              <ul className="block-style my-8">
                <div className="flex items-center">
                  <p className="font-[500] dark:text-white text-[#23272A]">
                    All Countries
                  </p>
                  <MagnifyingGlassIcon
                    className="cursor-pointer theme-text ml-auto w-5"
                    onClick={() => setCountrySearchOpen((v) => !v)}
                  />
                </div>
                {countrySearchOpen ? (
                  <input
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="mt-3 w-full rounded border border-snow-200 bg-white px-3 py-2 text-sm text-[#23272A] outline-none focus:border-brand-primary dark:border-[#1F2937] dark:bg-[#0D1117] dark:text-snow-200"
                    placeholder="Search leagues..."
                  />
                ) : null}

                {loadingPreview ? (
                  <div className="mt-4 text-sm text-neutral-n5 dark:text-snow-200">
                    Loading…
                  </div>
                ) : (
                  <>
                    {groupedCountries.map(({ country, leagues }) => (
                      <div key={country} className="flex flex-col">
                        <li
                          className="flex mt-4 dark:text-snow-200 items-center gap-2 text-[#586069] text-sm mb-2 cursor-pointer"
                          onClick={() =>
                            setExpandedCountry((prev) =>
                              prev === country ? null : country,
                            )
                          }
                        >
                          <span className="flex-1 font-medium">{country}</span>
                          <ChevronUpDownIcon
                            className={`ml-auto w-6 transition-transform ${
                              expandedCountry === country ? "rotate-180" : ""
                            }`}
                          />
                        </li>

                        {expandedCountry === country ? (
                          <div className="flex flex-col pl-4">
                            {leagues.map((league, idx) => (
                              <li
                                key={`${country}-${league.id}-${idx}`}
                                className="flex mt-3 dark:text-snow-200 items-center gap-2 text-[#586069] text-sm mb-1 cursor-pointer hover:text-brand-primary dark:hover:text-brand-secondary transition-colors"
                                onClick={() => navigate("/basketball")}
                              >
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  🏀
                                </div>
                                <span className="flex-1">{league.name}</span>
                              </li>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </>
                )}
              </ul>
            </motion.div>
          )}

          {activeTab === "all" && (
            <motion.div
              key="all"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="w-full pt-5"
            >
              {/* All Leagues content */}
              <ul className="block-style mt-6">
                <p className="font-[500] text-[#23272A] dark:text-white">
                  All Leagues
                </p>
                {loadingAll && allLeagues.length === 0 ? (
                  <div className="mt-4 text-sm text-neutral-n5 dark:text-snow-200">
                    Loading…
                  </div>
                ) : (
                  <>
                    {allLeagues.map((league, idx) => (
                      <li
                        key={`${league.id}-${idx}`}
                        className="flex mt-5 items-center gap-2 dark:text-snow-200 text-[#586069] text-sm mb-4 cursor-pointer hover:text-brand-primary dark:hover:text-brand-secondary transition-colors"
                        onClick={() => navigate("/basketball")}
                      >
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          🏀
                        </div>
                        <span>{league.name}</span>
                        <HeartIcon className="cursor-pointer ml-auto w-5" />
                      </li>
                    ))}

                    {allHasMore ? (
                      <button
                        type="button"
                        className="btn-outline-sm w-full"
                        onClick={() => {
                          if (!loadingAll) void loadAll(allPage + 1);
                        }}
                      >
                        {loadingAll ? "Loading..." : "Load more"}
                      </button>
                    ) : null}
                  </>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FooterComp />
    </div>
  );
};

export default BasketballLeague;
