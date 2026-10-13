import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const userEmail = encodeURIComponent('mona@example.com');

    getJson<{ suggestions?: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then((data) => {
        if (!active) return;
        setSuggestions(data.suggestions ?? []);
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={suggestions.length === 0 && !loading && !error}
      emptyText="No workout suggestions"
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title ?? suggestion.focus ?? 'workout'}-${index}`} className="list-group-item">
            <strong>{suggestion.title ?? suggestion.focus ?? 'Workout'}</strong>
            {suggestion.reason ? <div>{suggestion.reason}</div> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
