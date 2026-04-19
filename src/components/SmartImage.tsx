import { useEffect, useMemo, useState } from "react";

interface SmartImageProps {
  sources: Array<string | null | undefined>;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallbackClassName?: string;
}

export default function SmartImage({
  sources,
  alt,
  className,
  loading = "lazy",
  fallbackClassName,
}: SmartImageProps) {
  const validSources = useMemo(
    () => sources.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index),
    [sources]
  );
  const sourcesKey = validSources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);
  const activeSource = validSources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
  }, [sourcesKey]);

  if (!activeSource) {
    return (
      <div className={fallbackClassName || "flex h-full w-full items-center justify-center bg-muted text-muted-foreground"}>
        <img
          src="https://via.placeholder.com/400x300/cccccc/666666?text=No+Image"
          alt="No image available"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <img
      src={activeSource}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => {
        setSourceIndex((currentIndex) => currentIndex + 1);
      }}
    />
  );
}
