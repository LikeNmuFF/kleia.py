'use client'

import { useLoading } from "@/lib/context/LoadingContext";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function RouterLoader() {
  const { setIsLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500); // Minimum loading time
    return () => clearTimeout(timer);
  }, [pathname, searchParams, setIsLoading]);

  return null;
}
