import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";
import { toast } from "sonner";

const fetchLogs = async () => {
  const userInfoString = localStorage.getItem("userInfo");
  if (!userInfoString) {
    throw new Error("Usuário não autenticado.");
  }

  const userInfo = JSON.parse(userInfoString);
  const token = userInfo?.token;

  if (!token) {
    throw new Error("Token de autenticação não encontrado.");
  }

  const response = await fetch("/api/logs", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }
    throw new Error("Falha ao buscar logs do servidor.");
  }
  return response.json();
};

const DeveloperLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLogs = () => {
      fetchLogs()
        .then(setLogs)
        .catch((err) => {
          console.error(err);
          setError(err.message);
          toast.error(err.message);
        });
    };

    getLogs();
    const intervalId = setInterval(getLogs, 5000);

    return () => clearInterval(intervalId);
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