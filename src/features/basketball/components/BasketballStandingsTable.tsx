import { useEffect, useState } from "react";
import { getBasketballStandings } from "@/lib/api/endpoints";

// Types based on expected standings data structure
// Since we don't have the exact response type for standings, we'll try to support a generic structure
// similar to the one seen in other parts of the app or standard sports API formats.
interface DisplayStandingRow {
  position: number;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  percentage?: string;
  pointsDiff?: string;
  streak?: string;
  points?: number; // Some leagues might use points
}

interface BasketballStandingsTableProps {
  standingPath?: string;
}

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-snow-200 dark:bg-[#1F2937] rounded ${className}`}
    style={{ minHeight: "1em" }}
  />
);

export const BasketballStandingsTable = ({
  standingPath,
}: BasketballStandingsTableProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [standings, setStandings] = useState<DisplayStandingRow[]>([]);

  useEffect(() => {
    if (!standingPath) return;

    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError("");

        let data = await getBasketballStandings(standingPath);

        // Handle potential different response structures
        // Case 1: HTML/Text response (if it's just a raw table, we can't parse it easily)
        if (typeof data === "string") {
          // If the API returns HTML, we might be in trouble unless we want to render it directly.
          // For now, let's assume JSON.
          console.log(
            "Received string data for standings, likely specific format needed",
          );
        }

        // Mock parsing logic - adapting to whatever the API returns if possible
        // Ideally, we expect: { success: true, responseObject: { item: [ { ...standings... } ] } }
        // OR just a list.

        // Since we can't confirm the structure without a working curl, I'll add safe guards.
        const items = data?.responseObject?.item || data?.item || []; // Adjust based on real API

        // If items are in a nested property like 'standings' inside 'item'
        let rows: any[] = [];
        if (Array.isArray(items)) {
          // Check if items[0] contains 'standings' array
          if (items[0]?.standings && Array.isArray(items[0].standings)) {
            rows = items[0].standings;
          } else {
            rows = items;
          }
        }

        // Map to display structure
        const mapped: DisplayStandingRow[] = rows
          .map((r: any, idx: number) => ({
            position: Number(r.position) || idx + 1,
            teamName: r.team?.name || r.name || r.team_name || "Unknown Team",
            played: Number(r.played) || Number(r.overall?.played) || 0,
            wins: Number(r.wins) || Number(r.overall?.wins) || 0,
            losses: Number(r.losses) || Number(r.overall?.losses) || 0,
            percentage:
              r.percentage ||
              (Number(r.wins) / (Number(r.played) || 1)).toFixed(3),
            pointsDiff:
              r.pointsDiff ||
              r.diff ||
              `${Number(r.points_for || r.goals_for || 0) - Number(r.points_against || r.goals_against || 0)}`,
            streak: r.streak || "-",
            points: Number(r.points) || 0,
          }))
          .sort((a: any, b: any) => a.position - b.position);

        setStandings(mapped);
      } catch (err) {
        console.error("Error fetching standings:", err);
        setError("Could not load standings.");
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [standingPath]);

  if (!standingPath) {
    return (
      <div className="p-5 text-center text-neutral-n4 dark:text-neutral-m6 font-medium">
        Standings data not available for this league.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="block-style overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-snow-200 dark:border-[#1F2937]">
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-5 h-4" />
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-2 h-4" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-snow-200 dark:border-[#1F2937] items-center"
          >
            <Skeleton className="col-span-1 h-4 w-6" />
            <div className="col-span-5 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="col-span-1 h-4" />
            <Skeleton className="col-span-1 h-4" />
            <Skeleton className="col-span-1 h-4" />
            <Skeleton className="col-span-1 h-4" />
            <Skeleton className="col-span-2 h-4" />
          </div>
        ))}
      </div>
    );
  }

  if (error || standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 block-style min-h-[200px]">
        <p className="text-neutral-n4 dark:text-neutral-m6 mb-2">
          {error || "No standings records found."}
        </p>
      </div>
    );
  }

  return (
    <div className="block-style overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-snow-200 dark:border-[#1F2937] bg-snow-100/50 dark:bg-[#161B22] font-semibold text-xs text-brand-primary uppercase tracking-wider">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Team</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">PCT</div>
          <div className="col-span-2 text-center">Diff</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {standings.map((row) => (
            <div
              key={row.position + row.teamName}
              className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-snow-200 dark:border-[#1F2937] items-center hover:bg-snow-100 dark:hover:bg-neutral-n2 transition-colors"
            >
              <div className="col-span-1 text-center font-bold text-sm text-neutral-n4 dark:text-white">
                {row.position}
              </div>
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs ring-1 ring-inset ring-white/10">
                  {/* Logo Placeholder - If we had logo url, we'd use GetTeamLogo */}
                  {row.teamName.charAt(0)}
                </div>
                <span className="font-medium text-sm text-[#23272A] dark:text-snow-200 truncate">
                  {row.teamName}
                </span>
              </div>
              <div className="col-span-1 text-center text-sm font-medium text-neutral-n4 dark:text-neutral-m6">
                {row.played}
              </div>
              <div className="col-span-1 text-center text-sm font-medium text-neutral-n4 dark:text-neutral-m6">
                {row.wins}
              </div>
              <div className="col-span-1 text-center text-sm font-medium text-neutral-n4 dark:text-neutral-m6">
                {row.losses}
              </div>
              <div className="col-span-1 text-center text-sm font-medium text-neutral-n4 dark:text-neutral-m6">
                {row.percentage}
              </div>
              <div className="col-span-2 text-center text-sm font-medium text-neutral-n4 dark:text-neutral-m6">
                {row.pointsDiff}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
