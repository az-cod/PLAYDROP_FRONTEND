// Shim for `next/navigation` backed by react-router-dom.
import { useNavigate, useSearchParams as useRRSearchParams, useLocation } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href) => navigate(href),
    replace: (href) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function useSearchParams() {
  const [params] = useRRSearchParams();
  return params; // URLSearchParams has .get/.has/etc.
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function redirect(href) {
  if (typeof window !== 'undefined') window.location.assign(href);
}
