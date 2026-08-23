import * as React from "react";
import Link from "next/link";
import { BRAND_CONFIG } from "@/lib/brand-config";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string | null;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showTagline = true,
  href = "/",
  className = "",
}: BrandLogoProps) {
  const iconSizeClasses = {
    sm: "h-8 w-8 text-base rounded-lg",
    md: "h-10 w-10 text-xl rounded-xl",
    lg: "h-12 w-12 text-2xl rounded-2xl",
    xl: "h-16 w-16 text-3xl rounded-3xl",
  }[size];

  const titleSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl sm:text-4xl",
  }[size];

  const taglineSizeClasses = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-sm",
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <div
        className={`flex items-center justify-center bg-gradient-to-tr ${BRAND_CONFIG.logo.bgGradient} ${BRAND_CONFIG.logo.shadow} shadow-md text-white font-black transition-transform duration-200 group-hover:scale-105 ${iconSizeClasses}`}
      >
        <span>{BRAND_CONFIG.logo.emoji}</span>
      </div>
      <div>
        <span
          className={`font-black tracking-tight uppercase bg-gradient-to-r ${BRAND_CONFIG.logo.textGradient} bg-clip-text text-transparent block leading-none ${titleSizeClasses}`}
        >
          {BRAND_CONFIG.name}
        </span>
        {showTagline && (
          <span
            className={`font-bold text-muted-foreground uppercase tracking-wider block mt-1 leading-none ${taglineSizeClasses}`}
          >
            {BRAND_CONFIG.tagline} 🇩🇴
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
