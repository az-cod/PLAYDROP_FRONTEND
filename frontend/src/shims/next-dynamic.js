import React, { Suspense } from 'react';

// Shim for `next/dynamic`. Returns a component that lazy-loads the module's
// default export and renders it inside a Suspense boundary.
export default function dynamic(loader, options = {}) {
  const LazyComp = React.lazy(() =>
    Promise.resolve(loader()).then((mod) => ({ default: mod.default || mod }))
  );
  const fallback = options && options.loading ? React.createElement(options.loading) : null;
  return function DynamicComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <LazyComp {...props} />
      </Suspense>
    );
  };
}
