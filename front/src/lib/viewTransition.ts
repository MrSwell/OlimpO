import { flushSync } from 'react-dom'

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => unknown
}

/**
 * Runs a synchronous state update inside a View Transition when the browser
 * supports it and the user has not asked for reduced motion. Otherwise the
 * update applies immediately, so the UI never depends on the animation.
 */
export const transitionUpdate = (update: () => void): void => {
  const doc = document as ViewTransitionDocument
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (typeof doc.startViewTransition !== 'function' || reduced) {
    update()
    return
  }

  doc.startViewTransition(() => flushSync(update))
}
