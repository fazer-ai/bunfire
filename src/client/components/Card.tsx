import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/client/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-bg-secondary p-6 rounded-xl border border-border",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
