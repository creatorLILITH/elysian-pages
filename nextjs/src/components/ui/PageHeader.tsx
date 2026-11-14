import type { ReactNode } from "react";

/** Editorial page header: optional eyebrow, display title, description, actions. */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      {(actions || eyebrow) && (
        <div className="page-head__top">
          {eyebrow ? <p className="eyebrow" data-reveal>{eyebrow}</p> : <span />}
          {actions}
        </div>
      )}
      <h1 className="page-head__title" data-reveal>
        {title}
      </h1>
      {description && (
        <p className="page-head__desc" data-reveal>
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
