'use client'

import React, { createContext, useContext, useState, ReactNode } from "react";
import dynamic from "next/dynamic";

const KleiaLoader = dynamic(() => import("@/components/KleiaLoader"));

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
  fetchWithLoading: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = async function <T>(fn: () => Promise<T>): Promise<T> {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithLoading = async (input: RequestInfo | URL, init?: RequestInit) => {
    setIsLoading(true);
    try {
      return await fetch(input, init);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, withLoading, fetchWithLoading }}>
      {isLoading && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          style={{ pointerEvents: "auto" }}
        >
          <KleiaLoader size={120} background="transparent" />
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used within LoadingProvider");
  return context;
}
