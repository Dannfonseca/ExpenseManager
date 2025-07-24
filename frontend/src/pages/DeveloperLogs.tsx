import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";
import { toast } from "sonner";

const DeveloperLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/logs", {
          credentials: 'include', // Usa cookie para autenticação
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Não autorizado para ver os logs.");
          }
          throw new Error("Falha ao buscar logs do servidor.");
        }
        return response.json();
      } catch (err: any) {
        // Apenas para o console, o toast já é mostrado no getLogs
        console.error(err);
        // Lança o erro novamente para ser pego pelo .catch do getLogs
        throw err;
      }
    };

    const getLogs = () => {
      fetchLogs()
        .then(setLogs)
        .catch((err) => {
          setError(err.message);
          toast.error(err.message);
          // Para o intervalo se houver um erro de autorização
          if (err.message.includes("Não autorizado")) {
            clearInterval(intervalId);
          }
        });
    };

    getLogs(); // Busca inicial
    const intervalId = setInterval(getLogs, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, []);

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Logs do Desenvolvedor
        </h1>
        <p className="text-muted-foreground">
          Visualização dos logs de comunicação com o banco de dados.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center">
            <Terminal className="mr-2 h-5 w-5" />
            Logs do Backend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] w-full rounded-md border bg-muted p-4">
            {error ? (
              <pre className="text-destructive whitespace-pre-wrap break-all">
                {error}
              </pre>
            ) : (
              <pre className="text-sm text-foreground whitespace-pre-wrap break-all">
                {logs.length > 0
                  ? logs.join("\n")
                  : "Aguardando logs do servidor..."}
              </pre>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperLogs;