import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export const StarOfDavidIcon = forwardRef<SVGSVGElement, LucideProps>(
  function StarOfDavidIcon(
    {
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      className,
      ...rest
    },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        <path d="M12 2 19 14H5Z" />
        <path d="M12 22 5 10h14Z" />
      </svg>
    );
  },
) as LucideIcon;
