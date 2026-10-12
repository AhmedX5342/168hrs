import { useEffect, useState } from "react";
import { db } from "./db";

/** Object URL for a stored image id (revoked automatically). */
export function useImageUrl(id: string | undefined) {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    setUrl(undefined);
    if (!id) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    void db.images.get(id).then((row) => {
      if (cancelled || !row) return;
      objectUrl = URL.createObjectURL(row.blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return url;
}
