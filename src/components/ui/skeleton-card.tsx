import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => (
  <div className="w-[260px] bg-card rounded-xl border shadow-sm overflow-hidden shrink-0">
    <Skeleton className="h-52 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

export const BlogCardSkeleton = () => (
  <div className="w-[260px] bg-card rounded-xl border shadow-sm overflow-hidden shrink-0">
    <Skeleton className="h-44 w-full" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <Skeleton className="h-16 md:h-28 rounded-lg md:rounded-xl" />
);

export const ProductDetailSkeleton = () => (
  <div className="container py-8">
    <div className="grid md:grid-cols-2 gap-8">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <div className="h-28 bg-muted/50" />
    <div className="container py-12 space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);
