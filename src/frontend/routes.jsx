import { Children, isValidElement, useEffect, useMemo, useState } from 'react';
import { navigateTo } from './shared/navigation.js';

function getCurrentPath() {
  return window.location.pathname;
}

export function Link({ to, children, onClick, ...props }) {
  function handleClick(event) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      props.target
    ) {
      return;
    }

    event.preventDefault();
    navigateTo(to);
  }

  return (
    <a href={to} {...props} onClick={handleClick}>
      {children}
    </a>
  );
}

export function Route() {
  return null;
}

export function Routes({ children, fallback = null }) {
  const [path, setPath] = useState(getCurrentPath);
  const routeElements = useMemo(
    () => Children.toArray(children).filter(isValidElement),
    [children]
  );

  useEffect(() => {
    function handleLocationChange() {
      setPath(getCurrentPath());
    }

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const route = routeElements.find((element) => element.props.path === path);

  return route?.props.element ?? fallback;
}
