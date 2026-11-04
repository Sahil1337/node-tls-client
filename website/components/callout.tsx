import type { ComponentProps, CSSProperties, ReactNode } from "react";

// Replaces Fumadocs' callout (left bar + icon + muted text) with a tinted
// box: the title takes the type's colour, the body stays readable.
const colours = {
  info: "info",
  tip: "info",
  idea: "info",
  success: "success",
  warn: "warning",
  warning: "warning",
  error: "error",
} as const;

export interface CalloutProps extends Omit<ComponentProps<"div">, "title"> {
  type?: keyof typeof colours;
  title?: ReactNode;
}

export function Callout({
  type = "info",
  title,
  children,
  className = "",
  style,
  ...props
}: CalloutProps) {
  const colour = `var(--color-fd-${colours[type] ?? "info"})`;
  return (
    <div
      role="note"
      className={`my-5 rounded-lg border border-(--callout-color)/25 bg-(--callout-color)/6 px-4 py-3 ${className}`}
      style={{ "--callout-color": colour, ...style } as CSSProperties}
      {...props}
    >
      {title && (
        <p className="my-0! mb-1! font-semibold text-(--callout-color)">
          {title}
        </p>
      )}
      <div className="prose-no-margin text-fd-foreground/90">{children}</div>
    </div>
  );
}
