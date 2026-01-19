import { useEffect, useState, useMemo } from "react";
import PageHeader from "../../../components/layout/PageHeader";
import { FooterComp } from "../../../components/layout/Footer";
import Leftbar from "@/components/layout/LeftBar";
import { RightBar } from "@/components/layout/RightBar";
import { navigate } from "../../../lib/router/navigate";
import { Category } from "@/features/dashboard/components/Category";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  InboxIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  getLiveBasketballMatches,
  getBasketballFixtures,
  searchBasketballFixturesByStatus,
} from "@/lib/api/endpoints";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, subDays, isToday, format } from "date-fns";

interface Team {
  id: number;
  name: string;
  totalscore: string | number;
  q1: string | number;
  q2: string | number;
  q3: string | number;
  q4: string | number;
  ot: string | number;
}

interface Match {
  _id: string;
  match_id: number;
  localteam: Team;
  awayteam: Team;
  status: string;
  period?: string;
  timer?: string;
  date?: string;
  time?: string;
  league_name: string;
  league_id?: number;
  venue?: string;
  season?: string;
  stage?: string;
}

interface LeagueBlock {
  leagueId: number;
  leagueName: string;
  matches: Match[];
}

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-snow-200 dark:bg-[#1F2937] rounded ${className}`}
    style={{ minHeight: "1em" }}
  />
);

const BasketballPage = () => {
  const [activeMode, setActiveMode] = useState<"live" | "fixtures" | "results">(
    "live"
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<string>("All Leagues");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // NBA is default, add other leagues as needed
  const availableLeagues = useMemo(() => {
    const uniqueLeagues = new Set(
      matches.map((m) => m.league_name).filter(Boolean)
    );
    return ["All Leagues", ...Array.from(uniqueLeagues)];
  }, [matches]);

  // Group matches by league
  const leagueBlocks = useMemo(() => {
    const filtered =
      selectedLeague === "All Leagues"
        ? matches
        : matches.filter((m) => m.league_name === selectedLeague);

    const grouped = new Map<string, Match[]>();

    filtered.forEach((match) => {
      const leagueName = match.league_name || "Unknown League";
      const existing = grouped.get(leagueName) || [];
      existing.push(match);
      grouped.set(leagueName, existing);
    });

    return Array.from(grouped.entries()).map(([leagueName, matches]) => ({
      leagueId: matches[0]?.league_id || 0,
      leagueName,
      matches: matches.sort((a, b) => {
        // Sort by date/time
        if (activeMode === "fixtures") {
          return (
            new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
          );
        } else if (activeMode === "results") {
          return (
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
        }
        return 0;
      }),
    }));
  }, [matches, selectedLeague, activeMode]);

  // Fetch data based on active mode and page
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data;

        if (activeMode === "live") {
          data = await getLiveBasketballMatches(currentPage);
        } else if (activeMode === "fixtures") {
          data = await getBasketballFixtures(currentPage);
        } else {
          data = await searchBasketballFixturesByStatus(
            "finished",
            currentPage
          );
        }

        if (data && data.success && data.responseObject) {
          setMatches(data.responseObject.items || []);
          setTotalPages(data.responseObject.totalPages || 1);
          setHasNextPage(data.responseObject.hasNextPage || false);
          setHasPreviousPage(data.responseObject.hasPreviousPage || false);
          setCurrentPage(data.responseObject.page || 1);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error("Error fetching basketball data:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh live matches every 30 seconds
    const interval =
      activeMode === "live" ? setInterval(fetchData, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMode, currentPage, selectedDate]);

  // Reset to page 1 when changing modes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMode]);

  const getStatusDisplay = (match: Match) => {
    if (activeMode === "live") {
      return {
        text: match.period || match.status,
        isLive: true,
        time: match.timer || "",
      };
    } else if (activeMode === "fixtures") {
      return {
        text: match.date
          ? new Date(match.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "TBD",
        isLive: false,
        time: match.time || "",
      };
    } else {
      return {
        text: "FT",
        isLive: false,
        time: match.date
          ? new Date(match.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "",
      };
    }
  };

  return (
    <div className="transition-all">
      <PageHeader />

      <Category />

      {/* Basketball Header Banner */}
      {/* <div
        className="relative w-full overflow-hidden h-[150px]"
        style={{
          backgroundImage: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="text-4xl">🏀</div>
            <h1 className="font-bold text-3xl">Basketball</h1>
          </div>
        </div>
      </div> */}

      <div
        className="flex page-padding-x dark:bg-[#0D1117] gap-5 py-5 justify-around"
        style={{ height: "calc(100vh - 20px)" }}
      >
        {/* Left Sidebar */}
        <section className="h-full pb-30 overflow-y-auto hide-scrollbar w-1/5 hidden lg:block pr-2">
          <Leftbar />
        </section>

        {/* Main Content Area */}
        <div className="w-full pb-30 flex flex-col gap-y-3 md:gap-y-5 lg:w-3/5 h-full overflow-y-auto hide-scrollbar pr-2">
          {/* Date and Filter Controls */}
          <div className="flex-col">
            <div className="block-style">
              <div className="flex dark:text-snow-200 justify-center flex-col">
                {/* Date Navigation - Only show for fixtures and results */}
                {activeMode === "results" && (
                  <div className="relative flex items-center mb-3 justify-between">
                    <ArrowLeftIcon
                      className="text-neutral-n4 h-5 cursor-pointer"
                      onClick={() =>
                        setSelectedDate((prevDate) =>
                          subDays(prevDate || new Date(), 1)
                        )
                      }
                    />
                    <div
                      className="flex gap-3 items-center cursor-pointer"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      <p>
                        {selectedDate && isToday(selectedDate)
                          ? "Today"
                          : selectedDate
                          ? selectedDate.toDateString()
                          : new Date().toDateString()}
                      </p>
                      <CalendarIcon className="text-neutral-n4 h-5" />
                    </div>
                    <ArrowRightIcon
                      className="text-neutral-n4 h-5 cursor-pointer"
                      onClick={() =>
                        setSelectedDate((prevDate) =>
                          addDays(prevDate || new Date(), 1)
                        )
                      }
                    />
                    {showDatePicker && (
                      <div className="absolute z-10 top-full right-0 mt-2">
                        <DatePicker
                          selected={selectedDate}
                          calendarClassName="bg-black"
                          onChange={(date: Date | null) => {
                            setSelectedDate(date);
                            setShowDatePicker(false);
                          }}
                          dateFormat="yyyy-MM-dd"
                          inline
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Filter Buttons */}
                <div className="flex gap-3 overflow-x-auto overflow-y-hidden mb-3">
                  <div className="dark:text-snow-200 overflow-x-hidden flex gap-3 w-full hide-scrollbar">
                    <button
                      className={`filter-btn dark:border-[#1F2937] ${
                        activeMode === "live"
                          ? "text-brand-secondary hover:text-white"
                          : "hover:text-white"
                      }`}
                      onClick={() => setActiveMode("live")}
                    >
                      Live Games
                      {activeMode === "live" && matches.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {matches.length}
                        </span>
                      )}
                    </button>
                    <button
                      className={`filter-btn dark:border-[#1F2937] ${
                        activeMode === "fixtures"
                          ? "text-brand-secondary hover:text-white"
                          : "hover:text-white"
                      }`}
                      onClick={() => setActiveMode("fixtures")}
                    >
                      Fixtures
                    </button>
                    <button
                      className={`filter-btn dark:border-[#1F2937] ${
                        activeMode === "results"
                          ? "text-brand-secondary hover:text-white"
                          : "hover:text-white"
                      }`}
                      onClick={() => setActiveMode("results")}
                    >
                      Results
                    </button>
                  </div>
                </div>

                {/* League Filter */}
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-snow-100 dark:bg-[#1F2937] text-sm theme-text px-3 py-2 rounded-lg border border-snow-200 dark:border-transparent hover:border-neutral-n5 transition pr-8"
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                  >
                    {availableLeagues.map((league) => (
                      <option key={league} value={league}>
                        {league}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-neutral-n4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Games Loop */}
          <div className="flex flex-col gap-y-3 md:gap-y-6">
            {/* Desktop Section */}
            <div className="hidden md:block">
              {loading ? (
                <div className="block-style">
                  <div className="flex gap-3 border-b-1 px-5 py-3 border-snow-200">
                    <Skeleton className="w-10 h-10" />
                    <Skeleton className="w-32 h-6" />
                  </div>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex justify-around items-center gap-4 border-b-1 px-5 py-3 border-snow-200 last:border-b-0"
                    >
                      <Skeleton className="w-8 h-4" />
                      <div className="flex flex-3/9 justify-end items-center gap-3">
                        <Skeleton className="w-20 h-4" />
                        <Skeleton className="w-8 h-8" />
                        <Skeleton className="w-8 h-4" />
                      </div>
                      <div className="flex flex-4/9 justify-start items-center gap-3">
                        <Skeleton className="w-8 h-4" />
                        <Skeleton className="w-8 h-8" />
                        <Skeleton className="w-20 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : leagueBlocks.length > 0 ? (
                leagueBlocks.map((leagueBlock, leagueIdx) => (
                  <div
                    key={leagueBlock.leagueId + "-" + leagueIdx}
                    className="block-style mb-4"
                  >
                    <div className="flex gap-3 border-b-1 px-5 py-3 border-snow-200 dark:border-[#1F2937]">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        🏀
                      </div>
                      <p className="font-[500] text-[#23272A] dark:text-neutral-m6 text-[14px] md:text-base">
                        {leagueBlock.leagueName}
                      </p>
                    </div>
                    {leagueBlock.matches.map(
                      (match: Match, gameIdx: number) => {
                        const status = getStatusDisplay(match);

                        return (
                          <div
                            key={gameIdx}
                            onClick={() =>
                              navigate(`/basketball/match/${match.match_id}`)
                            }
                            className={`flex hover:bg-snow-100 dark:hover:bg-neutral-n2 cursor-pointer transition-colors items-center gap-2 border-b-1 px-5 py-3 dark:border-[#1F2937] border-snow-200 ${
                              gameIdx === leagueBlock.matches.length - 1
                                ? "last:border-b-0 border-b-0"
                                : ""
                            }`}
                          >
                            {status.isLive ? (
                              <>
                                <p className="text-brand-secondary animate-pulse flex-1/11 font-bold text-xs">
                                  {status.text}
                                  {status.time && (
                                    <span className="block text-[10px]">
                                      {status.time}
                                    </span>
                                  )}
                                </p>
                                <div className="flex dark:text-white flex-4/11 justify-end items-center gap-3">
                                  <p className="text-sm">
                                    {match.localteam.name}
                                  </p>
                                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">🏠</span>
                                  </div>
                                </div>
                                <div className="flex-2/11 flex justify-between">
                                  <p className="score text-lg font-bold">
                                    {match.localteam.totalscore || 0}
                                  </p>
                                  <p className="score text-lg font-bold">
                                    {match.awayteam.totalscore || 0}
                                  </p>
                                </div>
                                <div className="flex dark:text-white flex-4/11 justify-start items-center gap-3">
                                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">✈️</span>
                                  </div>
                                  <p className="text-sm">
                                    {match.awayteam.name}
                                  </p>
                                </div>
                              </>
                            ) : activeMode === "results" ? (
                              <>
                                <p className="text-brand-secondary flex-1/11 font-bold">
                                  FT
                                </p>
                                <div className="flex dark:text-white flex-4/11 justify-end items-center gap-3">
                                  <p className="text-sm">
                                    {match.localteam.name}
                                  </p>
                                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">🏠</span>
                                  </div>
                                </div>
                                <div className="flex-2/11 flex justify-between">
                                  <p className="score text-lg font-bold">
                                    {match.localteam.totalscore || "-"}
                                  </p>
                                  <p className="score text-lg font-bold">
                                    {match.awayteam.totalscore || "-"}
                                  </p>
                                </div>
                                <div className="flex dark:text-white flex-4/11 justify-start items-center gap-3">
                                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">✈️</span>
                                  </div>
                                  <p className="text-sm">
                                    {match.awayteam.name}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex dark:text-white flex-5/11 justify-end items-center gap-3">
                                  <p className="text-sm">
                                    {match.localteam.name}
                                  </p>
                                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">🏠</span>
                                  </div>
                                </div>
                                <p className="neutral-n1 flex-2/11 items-center whitespace-nowrap text-center py-0.5 px-2 dark:bg-neutral-500 dark:text-white bg-snow-200 text-xs">
                                  {status.text}
                                  {status.time && (
                                    <span className="block text-[10px]">
                                      {status.time}
                                    </span>
                                  )}
                                </p>
                                <div className="flex dark:text-white flex-4/11 justify-start items-center gap-3">
                                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">✈️</span>
                                  </div>
                                  <p className="text-sm">
                                    {match.awayteam.name}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[55vh] w-full">
                  <InboxIcon className="w-10 h-10 text-neutral-n4 dark:text-neutral-m6" />
                  <p className="mt-2 text-center dark:text-neutral-m6 text-neutral-n4">
                    No {activeMode} matches available.
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Section */}
            <div className="block md:hidden">
              {loading ? (
                <div className="bg-white dark:bg-[#161B22] border-1 h-fit flex-col border-snow-200 rounded">
                  <div className="flex gap-3 border-b-1 px-5 py-3 dark:border-[#1F2937] border-snow-200 items-center">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b-1 border-snow-200 px-2 py-1.5 last:border-b-0 bg-neutral-n9"
                    >
                      <Skeleton className="w-10 h-3" />
                      <div className="flex flex-col flex-1 mx-1 gap-0.5">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-6" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-6" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leagueBlocks.length > 0 ? (
                leagueBlocks.map((leagueBlock, leagueIdx) => (
                  <div
                    key={leagueBlock.leagueId + "-" + leagueIdx}
                    className="bg-white text-sm dark:bg-[#161B22] dark:border-[#1F2937] border-1 h-fit flex-col border-snow-200 rounded mb-4"
                  >
                    <div className="flex gap-3 border-b-1 px-5 py-3 dark:border-[#1F2937] border-snow-200">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        🏀
                      </div>
                      <p className="font-[500] text-[#23272A] dark:text-snow-200 text-[14px] md:text-base">
                        {leagueBlock.leagueName}
                      </p>
                    </div>
                    {leagueBlock.matches.map(
                      (match: Match, gameIdx: number) => {
                        const status = getStatusDisplay(match);

                        return (
                          <div
                            key={gameIdx}
                            onClick={() =>
                              navigate(`/basketball/match/${match.match_id}`)
                            }
                            className="flex items-center justify-between dark:border-[#1F2937] border-b-1 border-snow-200 px-2 py-1.5 last:border-b-0 bg-neutral-n9"
                          >
                            <p
                              className={`text-xs text-center w-15 px-2 font-bold ${
                                status.isLive
                                  ? "text-brand-secondary animate-pulse"
                                  : "text-brand-secondary"
                              }`}
                            >
                              {status.text}
                              {status.time && (
                                <span className="block text-[10px]">
                                  {status.time}
                                </span>
                              )}
                            </p>
                            <div className="flex flex-col flex-1 mx-1 gap-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium dark:text-white text-neutral-n4">
                                  {match.localteam.name}
                                </span>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 min-w-[24px] text-center">
                                  <span className="text-xs font-bold dark:text-white text-neutral-n4">
                                    {activeMode === "live" ||
                                    activeMode === "results"
                                      ? match.localteam.totalscore || 0
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium dark:text-white text-neutral-n4">
                                  {match.awayteam.name}
                                </span>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 min-w-[24px] text-center">
                                  <span className="text-xs font-bold dark:text-white text-neutral-n4">
                                    {activeMode === "live" ||
                                    activeMode === "results"
                                      ? match.awayteam.totalscore || 0
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[55vh] w-full">
                  <InboxIcon className="w-10 h-10 text-neutral-n4 dark:text-neutral-m6" />
                  <p className="mt-2 text-center dark:text-neutral-m6 text-neutral-n4">
                    No {activeMode} matches available.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="flex items-center justify-between block-style">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={!hasPreviousPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                    hasPreviousPage
                      ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                      : "bg-snow-200 dark:bg-[#1F2937] text-neutral-n4 cursor-not-allowed"
                  }`}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-sm theme-text">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={!hasNextPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                    hasNextPage
                      ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                      : "bg-snow-200 dark:bg-[#1F2937] text-neutral-n4 cursor-not-allowed"
                  }`}
                >
                  Next
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-1/5 pb-30 hidden lg:block h-full overflow-y-auto hide-scrollbar">
          <RightBar />
        </div>
      </div>

      <FooterComp />
    </div>
  );
};

export default BasketballPage;
