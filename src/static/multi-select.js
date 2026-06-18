export function getNextOptionIndex(currentIndex, optionCount, direction) {
  if (optionCount === 0) return -1

  if (currentIndex < 0) {
    return direction > 0 ? 0 : optionCount - 1
  }

  return (currentIndex + direction + optionCount) % optionCount
}

export function buildHttpCalendarUrl(origin, fullPath) {
  const url = new URL(fullPath, origin)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Calendar URLs must use HTTP or HTTPS')
  }
  return url.href
}

export function getRenderedOptionIndex(currentIndex, optionCount, resetActive) {
  if (optionCount === 0) return -1
  if (resetActive) return 0
  return Math.min(currentIndex, optionCount - 1)
}

export function resolveActiveOptionIndex(
  options,
  currentIndex,
  resetActive,
  activeValue
) {
  if (activeValue !== undefined) {
    const matchingIndex = options.findIndex(
      option => option.value === activeValue
    )
    if (matchingIndex >= 0) return matchingIndex
  }

  return getRenderedOptionIndex(currentIndex, options.length, resetActive)
}

export function toggleSelectedValue(selectedValues, value) {
  if (selectedValues.has(value)) {
    selectedValues.delete(value)
    return false
  }

  selectedValues.add(value)
  return true
}
