import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// Shim for `next/link` -> react-router-dom Link.
// Maps Next's `href` prop to react-router's `to` prop.
// External/absolute links fall back to a plain <a>.
const Link = React.forwardRef(function Link({ href, to, replace, prefetch, scroll, shallow, locale, passHref, legacyBehavior, ...rest }, ref) {
  const target = href ?? to ?? '#';
  const isExternal = typeof target === 'string' && /^(https?:)?\/\//.test(target);
  const isHash = typeof target === 'string' && target.startsWith('#');
  const isMailOrTel = typeof target === 'string' && /^(mailto:|tel:)/.test(target);

  if (isExternal || isHash || isMailOrTel) {
    return <a ref={ref} href={target} {...rest} />;
  }
  return <RouterLink ref={ref} to={target} replace={replace} {...rest} />;
});

export default Link;
