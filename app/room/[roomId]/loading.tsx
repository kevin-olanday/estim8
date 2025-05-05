import { LoadingSpinner } from "@/app/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size={48} />
      <p className="mt-4 text-muted-foreground">Loading room...</p>
    </div>
  )
}
