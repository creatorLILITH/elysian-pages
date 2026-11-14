"use client";

import { useState, type ReactNode } from "react";

/**
 * The single book-cover card used by every shelf in the app (public library,
 * personal library, dashboard rows).
 *
 * Cover imagery keeps its natural 2:3 proportion inside a fixed frame, so the
 * grid never shifts while images load. A cover that fails to load degrades to a
 * labelled placeholder instead of a broken image.
 */
export default function BookCard({
  title,
  author,
  coverSrc,
  fallbackIcon = "📕",
  tags,
  actions,
}: {
  title: string;
  author?: string | null;
  coverSrc?: string | null;
  fallbackIcon?: string;
  tags?: ReactNode;
  actions?: ReactNode;
}) {
  const [coverBroken, setCoverBroken] = useState(false);
  const showCover = Boolean(coverSrc) && !coverBroken;

  return (
    <article className="book-card">
      <div className="book-card__frame">
        {showCover ? (
          <img
            src={coverSrc as string}
            alt={`Cover of ${title}`}
            className="book-card__cover"
            loading="lazy"
            decoding="async"
            onError={() => setCoverBroken(true)}
          />
        ) : (
          <div className="book-card__placeholder">
            <span aria-hidden="true">{fallbackIcon}</span>
            {title}
          </div>
        )}
      </div>

      <h3 className="book-card__title">{title}</h3>

      {author ? <p className="book-card__author">{author}</p> : null}

      {tags ? <div className="book-card__tags">{tags}</div> : null}

      {actions ? <div className="book-card__actions">{actions}</div> : null}
    </article>
  );
}
