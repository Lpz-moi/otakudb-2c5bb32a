import { cn } from "@/lib/utils";

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  );
};

export const AnimeCardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-[3/4] w-full rounded-xl" />
    <div className="space-y-1.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const AnimeGridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <AnimeCardSkeleton key={i} />
    ))}
  </div>
);

export const ProfileHeaderSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="h-16 w-16 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const DiscoverCardSkeleton = () => (
  <div className="relative h-[calc(100dvh-260px)] min-h-[380px] max-h-[520px] w-full rounded-2xl overflow-hidden bg-muted/30 animate-pulse">
    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  </div>
);