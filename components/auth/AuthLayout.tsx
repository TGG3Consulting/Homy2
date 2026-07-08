"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8 md:mb-10">
          <Link href="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary mb-3 md:mb-4">
              <Icon
                className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground"
                aria-hidden="true"
              />
            </div>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
