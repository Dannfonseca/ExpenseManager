const logs = [];
const MAX_LOGS = 100;

const logger = {
  logEvent: (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(logMessage);

   
    if (level === 'AUTH' || level === 'ERROR') {
      if (logs.length >= MAX_LOGS) {
        logs.shift();
      }
      logs.push(logMessage);
    }
  },
  getLogs: () => {
    return [...logs].reverse();
  },
};

export default logger;