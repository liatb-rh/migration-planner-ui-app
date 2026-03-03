/**
 * Parses a Go duration string (e.g., "989h19m27.587096774s") and returns
 * the total number of seconds.
 */
export const parseDuration = (duration: string): number => {
  let totalSeconds = 0;

  const regex = /(\d+(?:\.\d+)?)(ns|us|µs|μs|ms|s|m|h)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];

    switch (unit) {
      case "h":
        totalSeconds += value * 3600;
        break;
      case "m":
        totalSeconds += value * 60;
        break;
      case "s":
        totalSeconds += value;
        break;
      case "ms":
        totalSeconds += value * 1e-3;
        break;
      case "us":
      case "µs":
      case "μs":
        totalSeconds += value * 1e-6;
        break;
      case "ns":
        totalSeconds += value * 1e-9;
        break;
    }
  }

  return totalSeconds;
};

/**
 * Formats a duration string (e.g., "989h19m27.587096774s") into a
 * human-readable format like "41 days 5 hours 19 minutes".
 */
export const formatDuration = (duration: string): string => {
  const totalSeconds = parseDuration(duration);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  return parts.join(" ");
};
