import type { ReactNode } from "react";

/**
 * Inline status message. `role` follows the tone: failures interrupt
 * assistive tech, successes are announced politely.
 */
export default function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const toneClass = tone === "info" ? "" : ` alert--${tone}`;

  return (
    <div
      className={`alert${toneClass}`}
      role={tone === "error" ? "alert" : "status"}
      data-reveal
    >
      <span>{children}</span>
    </div>
  );
}
