import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  loading = false,
  error = null,
  empty = false,
  emptyText,
  children,
}: Props) {
  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="alert" className="alert alert-danger mb-0">Unable to load {title.toLowerCase()}. {error}</p>
        </div>
      </section>
    );
  }

  if (empty) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">{emptyText ?? `No ${title.toLowerCase()} available.`}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
