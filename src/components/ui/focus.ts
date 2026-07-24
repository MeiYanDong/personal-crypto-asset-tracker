const focusReturnSelector = [
  "button:not(:disabled)",
  "a[href]",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function focusReturnTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  const candidate = target.matches(focusReturnSelector)
    ? target
    : target.closest(focusReturnSelector);
  return candidate instanceof HTMLElement ? candidate : null;
}

export function focusElement(element: HTMLElement | null | undefined) {
  if (
    !element ||
    !element.isConnected ||
    element.matches(":disabled, [hidden]") ||
    element.closest("[inert]") ||
    element.getClientRects().length === 0
  ) {
    return false;
  }

  element.focus({ preventScroll: true });
  return document.activeElement === element;
}
