import React from "react";
import { AnimeGridSkeleton, ProfileHeaderSkeleton } from "@/components/ui/skeleton-loader";

export function PageLoader() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <ProfileHeaderSkeleton />
      
      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="flex gap-4 overflow-hidden">
           <div className="h-10 w-32 bg-muted/60 rounded-full animate-pulse" />
           <div className="h-10 w-32 bg-muted/40 rounded-full animate-pulse" />
           <div className="h-10 w-32 bg-muted/40 rounded-full animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted/60 rounded-md animate-pulse" />
          <AnimeGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}