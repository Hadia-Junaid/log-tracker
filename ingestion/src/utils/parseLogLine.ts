export const parseLogLine = (line: string) => {
  const regex = /^\[(.+?)\] \[(.+?)\] \[traceid=(.+?)\] (.*)$/;
  const match = line.match(regex);

  if (!match) throw new Error("Malformed log line: " + line);

  const [, dateStr, level, traceId, message] = match;

  return {
    timestamp: new Date(dateStr.replace(',', '.')), // convert milliseconds format
    log_level: level,
    trace_id: traceId,
    message,
  };
};
