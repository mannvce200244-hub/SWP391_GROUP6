import { ROUTE_CHANGE_EVENT } from './customerRoutes.js'

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

    if (destination.origin !== window.location.origin || destination.hash) {
      return
    }

    event.preventDefault()
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
