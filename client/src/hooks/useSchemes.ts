import { useState, useEffect } from "react";
import { Scheme, Category } from "../types/scheme";
import * as api from "../utils/api";

export function useSchemes(search: string, category: string) {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getSchemes(search || undefined, category || undefined)
      .then((data) => {
        if (!cancelled) {
          setSchemes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, category]);

  return { schemes, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  return categories;
}

export function useScheme(id: number) {
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [related, setRelated] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getScheme(id), api.getRelatedSchemes(id)])
      .then(([s, r]) => {
        if (!cancelled) {
          setScheme(s);
          setRelated(r);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { scheme, related, loading };
}

export function useNewSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getNewSchemes()
      .then(setSchemes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { schemes, loading };
}
