import { ROUTE_CHANGE_EVENT } from './customerRoutes.js'

function scrollToHash(hash) {
  if (!hash) return

  const id = decodeURIComponent(hash.slice(1))
  const target = document.getElementById(id)

  // Omitting `behavior` uses the document's CSS `scroll-behavior` (smooth),
  // which global.css already overrides to instant for prefers-reduced-motion.
  target?.scrollIntoView({ block: 'start' })
}

function RouterLink({ children, download, href, onClick, target, ...anchorProps }) {
  const handleClick = (event) => {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== '_self') ||
      (download !== undefined && download !== false)
    ) {
      return
    }

    const destination = new URL(href, window.location.href)

    if (destination.origin !== window.location.origin) {
      return
    }

    event.preventDefault()

    // Hash navigation (e.g. /#artisans): update the URL and let a hash-scroll
    // handler on the target page scroll once the section has rendered. When the
    // section is already in the DOM, scroll immediately.
    if (destination.hash) {
      window.history.pushState(null, '', destination)
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
      scrollToHash(destination.hash)
      return
    }

    window.history.pushState(null, '', destination)
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
    window.scrollTo(0, 0)
  }

  return (
    <a
      {...anchorProps}
      download={download}
      href={href}
      onClick={handleClick}
      target={target}
    >
      {children}
    </a>
  )
}

export default RouterLink
