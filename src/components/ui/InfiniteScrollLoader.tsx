import React, { useEffect, useRef } from "react";
import { AnimeCardSkeleton } from "@/components/ui/skeleton-loader";

interface InfiniteScrollLoaderProps {
  onVisible?: () => void;
  isLoading?: boolean;
}

export function InfiniteScrollLoader({ onVisible, isLoading }: InfiniteScrollLoaderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onVisible) {
          onVisible();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [onVisible]);

  return (
    <div ref={ref} className="w-full py-8">
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}