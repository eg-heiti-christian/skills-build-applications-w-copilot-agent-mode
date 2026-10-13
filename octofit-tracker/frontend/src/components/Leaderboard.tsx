import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (!active) return;
        setEntries(data.leaderboard ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unavailable');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={entries.length === 0 && !loading && !error}
      emptyText="No leaderboard"
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>
              #{entry.rank} {entry.teamName}
            </span>
            <span className="badge text-bg-primary rounded-pill">{entry.totalPoints}</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
