import { SkeletonCard } from "@/components/ui";

export default function LoadingPage() {
  return (
    <div className="space-y-6">
      <SkeletonCard />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );
}
