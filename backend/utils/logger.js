/*
 * Utilitário de log centralizado com níveis de severidade.
 * - Adicionada a função logEvent que aceita um nível (INFO, AUTH, ERROR).
 * - Apenas logs do tipo AUTH e ERROR são armazenados em memória para consulta.
 * - Logs do tipo INFO são exibidos apenas no console para depuração.
 */
const logs = [];
const MAX_LOGS = 100;

const logger = {
  logEvent: (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(logMessage);

    // Armazenar apenas logs importantes para a visualização do admin
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