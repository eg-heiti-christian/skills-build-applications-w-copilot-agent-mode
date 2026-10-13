import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ teams?: Team[] }>('/api/teams')
      .then((data) => {
        if (!active) return;
        setTeams(data.teams ?? []);
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
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0 && !loading && !error}
      emptyText="No teams"
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name}-${index}`} className="list-group-item">
            <strong>{team.name}</strong>
            {team.members.length > 0 ? <div>{team.members.join(', ')}</div> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
