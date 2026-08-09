import React, { useEffect, useState } from 'react';
import { POSTER_FALLBACK, posterOf } from '../utils/format';

/**
 * Resolves a poster to a URL that is known to actually load.
 *
 * `posterOf` swaps in the placeholder only when `posterUrl` is missing, but the
 * seeded catalogue points at `example.com` links that resolve to nothing — so a
 * present-but-broken URL still renders as a torn-image icon. We probe the URL
 * once and fall back the moment it fails.
 *
 * Needed for the two hero sections that paint the poster as a CSS
 * `background-image`, where there is no `onError` to hook into.
 */
export const usePosterSrc = (source) => {
  const candidate = posterOf(source);
  const [src, setSrc] = useState(candidate);

  useEffect(() => {
    if (candidate === POSTER_FALLBACK) {
      setSrc(POSTER_FALLBACK);
      return undefined;
    }

    let cancelled = false;
    setSrc(candidate);

    const probe = new Image();
    probe.onerror = () => {
      if (!cancelled) setSrc(POSTER_FALLBACK);
    };
    probe.src = candidate;

    return () => {
      cancelled = true;
    };
  }, [candidate]);

  return src;
};

/**
 * An `<img>` that quietly degrades to the placeholder instead of showing a
 * broken image. `source` is the event or booking the poster belongs to.
 */
export const Poster = ({ source, alt, ...imgProps }) => {
  const src = usePosterSrc(source);

  return (
    <img
      {...imgProps}
      alt={alt}
      src={src}
      onError={(event) => {
        // Belt and braces: covers a URL that starts loading and then fails.
        if (event.currentTarget.src !== POSTER_FALLBACK) {
          event.currentTarget.src = POSTER_FALLBACK;
        }
      }}
    />
  );
};

/**
 * A `<div>` that paints the poster as a CSS background, degrading to the
 * placeholder the same way `Poster` does.
 *
 * `overlay` is an optional gradient laid over the image — pass the gradient
 * alone and it is composited above the poster, matching the usual
 * `linear-gradient(...), url(...)` ordering.
 *
 * Being its own component matters: the hero carousel renders these inside a
 * `.map()`, where a hook could not be called directly.
 */
export const PosterBackdrop = ({ source, overlay, style, children, ...divProps }) => {
  const src = usePosterSrc(source);
  const backgroundImage = overlay ? `${overlay}, url(${src})` : `url(${src})`;

  return (
    <div {...divProps} style={{ ...style, backgroundImage }}>
      {children}
    </div>
  );
};

export default Poster;
