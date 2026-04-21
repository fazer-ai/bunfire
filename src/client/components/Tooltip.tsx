import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

interface TooltipBaseProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

// NOTE: when `asChild` is true (default), children is passed directly as the
// trigger via Radix Slot, which requires a single ReactElement — when absent,
// the internal fallback button is used. When `asChild` is false, children is
// wrapped by Radix Trigger, so any ReactNode is fine. The discriminated union
// below surfaces that constraint at the type level instead of at runtime.
type TooltipProps =
  | (TooltipBaseProps & { asChild?: true; children?: ReactElement })
  | (TooltipBaseProps & { asChild: false; children: ReactNode });

// NOTE: when asChild=true (default), Radix Slot clones `children` and merges
// props — including `className`. If the cloned child receives a function
// className (e.g. `<NavLink className={({ isActive }) => ...}>`), Slot
// stringifies it during the merge and the serialized function ends up in the
// rendered `class` attribute. If you hit that, wrap the child in a plain
// `<span>` so Slot clones the span instead; the inner component keeps its own
// className semantics. See Sidebar.tsx.
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 6,
  asChild = true,
}: TooltipProps) {
  const trigger = children ?? (
    <button
      type="button"
      className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border bg-transparent p-0 font-medium text-[10px] text-text-muted"
      aria-label={content}
    >
      {/* biome-ignore lint/style/noJsxLiterals: decorative glyph, accessible name comes from aria-label */}
      ?
    </button>
  );

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild={asChild || !children}>
        {trigger}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          className="data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 z-(--z-tooltip) whitespace-nowrap rounded-md border border-border bg-bg-primary px-2.5 py-1.5 text-text-primary text-xs shadow-lg data-[state=closed]:animate-out data-[state=delayed-open]:animate-in"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
