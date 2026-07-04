const ANSI_RESET = "\u001b[0m"
const TARGET_LOG_COLOR_COUNT = 12

const targetColorIndex = (targetId: string): number => {
  let hash = 0
  for (const char of targetId) {
    hash = (hash * 31 + char.charCodeAt(0)) % TARGET_LOG_COLOR_COUNT
  }
  return hash
}

const targetColorCode = (targetId: string): string => {
  switch (targetColorIndex(targetId)) {
    case 0:
      return "31"
    case 1:
      return "32"
    case 2:
      return "33"
    case 3:
      return "34"
    case 4:
      return "35"
    case 5:
      return "36"
    case 6:
      return "91"
    case 7:
      return "92"
    case 8:
      return "93"
    case 9:
      return "94"
    case 10:
      return "95"
    case 11:
      return "96"
    default:
      return "37"
  }
}

/** Apply a stable terminal color to a log message for one Benchmark Target. */
export const targetLogStyle = (targetId: string, message: string): string => {
  if (process.env.NO_COLOR !== undefined) return message
  return `\u001b[${targetColorCode(targetId)}m${message}${ANSI_RESET}`
}
