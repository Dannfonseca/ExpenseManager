import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, AlertCircle, Repeat } from "lucide-react"; // Ícone 'Repeat' importado aqui

const Guide = () => {
  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <BookOpen className="mr-3 h-8 w-8 text-primary" />
          Guia de Uso do ExpenseManager
        </h1>
        <p className="text-muted-foreground">
          Aprenda a tirar o máximo proveito da nossa plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Principais</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Dashboard</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>
                  O <strong>Dashboard</strong> é sua central de controle. Aqui
                  você tem uma visão geral da sua saúde financeira para o mês e
                  ano selecionados.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Cards de Resumo:</strong> Mostram o total de{" "}
                    <Badge variant="secondary" className="text-success">
                      Receitas
                    </Badge>
                    ,{" "}
                    <Badge variant="secondary" className="text-destructive">
                      Despesas
                    </Badge>{" "}
                    e o <strong>Saldo Final</strong> do período.
                  </li>
                  <li>
                    <strong>Análise Gráfica:</strong> Visualize seus gastos
                    diários em um gráfico de linhas ou a distribuição de suas
                    despesas por categoria em um gráfico de pizza. Use os
                    filtros para comparar diferentes meses.
                  </li>
                  <li>
                    <strong>Top Categorias:</strong> Veja para onde seu dinheiro
                    está indo com uma lista das suas maiores categorias de
                    despesa no mês.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Adicionar Transação</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>
                  Clicando em <strong>"Adicionar"</strong> no menu ou no botão
                  no Dashboard, você pode registrar qualquer movimentação
                  financeira.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Tipo:</strong> Escolha entre{" "}
                    <Badge variant="secondary" className="text-destructive">
                      Despesa
                    </Badge>{" "}
                    e{" "}
                    <Badge variant="secondary" className="text-success">
                      Receita
                    </Badge>
                    .
                  </li>
                  <li>
                    <strong>Transação Recorrente:</strong> Ative esta opção para
                    lançamentos que se repetem, como salários, aluguéis ou
                    assinaturas. Você poderá definir a frequência (mensal,
                    semanal, etc.) e uma data final, se houver.
                  </li>
                  <li>
                    <strong>Categoria:</strong> Atribua uma categoria a cada
                    despesa para organizar melhor seus gastos.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Páginas de Transações e Recorrências</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>
                  As páginas <strong>"Transações"</strong> e{" "}
                  <strong>"Recorrências"</strong> são onde você gerencia seus
                  lançamentos.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Transações:</strong> Lista todos os lançamentos já
                    efetuados. Você pode filtrar por mês, ano, tipo ou
                    categoria. Também mostra as recorrências que estão para
                    acontecer no mês selecionado.
                  </li>
                  <li>
                    <strong>Recorrências:</strong> Um local centralizado para
                    ver e gerenciar todos os seus gastos e receitas fixas. Você
                    pode editar valores, datas e frequências, ou excluir uma
                    recorrência que não existe mais.
                  </li>
                </ul>
                <div className="p-3 mt-2 bg-muted rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                    <div>
                        <h4 className="font-semibold">Dica de mestre</h4>
                        <p className="text-sm text-muted-foreground">Na página de Transações, as recorrências futuras aparecem com um design tracejado e um ícone <Repeat className="inline h-4 w-4" /> para fácil identificação.</p>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Configurações</AccordionTrigger>
              <AccordionContent>
                <p>
                  Na área de <strong>Configurações</strong>, você pode
                  personalizar sua experiência. Crie novas categorias de
                  despesas, defina cores para elas e gerencie outras
                  preferências da sua conta.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default Guide;