export const parseLogLine = (line: string) => {
  const regex = /^\[(.+?)\] \[(.+?)\] \[(.+?)\](.*)$/;
  const match = line.match(regex);

  if (!match) throw new Error("Malformed log line: " + line);

  const [, dateStr, level, traceId, message] = match;

  return {
    timestamp: new Date(dateStr),
    log_level: level,
    trace_id: traceId,
    message: message.trim(),
  };
}
