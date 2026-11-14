import type { ReactNode } from "react";

/** Shared empty-shelf / no-results state. */
export default function EmptyState({
  icon = "📚",
  title,
  text,
  action,
}: {
  icon?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state" data-reveal>
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {text ? <p className="empty-state__text">{text}</p> : null}
      {action}
    </div>
  );
}
