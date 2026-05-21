export const ten_minutes_ago_or_even_before = (timestamp?: number) => {

  if (!timestamp) {
    return true
  }

  const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 1) return false
    if (seconds < 60) return false

    const minutes = Math.floor(seconds / 60)
    if (minutes < 10) false


    return true
}