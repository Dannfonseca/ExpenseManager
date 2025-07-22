import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, AlertCircle, Repeat, CreditCard, CalendarClock, Palette, Calculator, HelpCircle, MessageSquare, Instagram } from "lucide-react";

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
              <AccordionContent className="space-y-4">
                <p>
                  O <strong>Dashboard</strong> é sua central de controle. Aqui
                  você tem uma visão geral da sua saúde financeira.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Cards de Resumo:</strong> Mostram o total de{" "}
                    <Badge variant="secondary" className="text-success">
                      Receitas
                    </Badge>
                    ,{" "}
                    <Badge variant="secondary" className="text-destructive">
                      Despesas
                    </Badge>{" "}
                    e o <strong>Saldo Final</strong> do período selecionado.
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
                <div className="p-3 mt-2 bg-muted rounded-md flex items-start">
                  <CalendarClock className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold">Modo Previsão</h4>
                    <p className="text-sm text-muted-foreground">
                      Ative a chave <strong>"Previsão"</strong> para ver uma projeção dos seus saldos futuros. O sistema calculará automaticamente suas receitas e despesas recorrentes para qualquer mês futuro, ajudando você a se planejar financeiramente.
                    </p>
                  </div>
                </div>
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
                    lançamentos que se repetem, como salários ou aluguéis.
                  </li>
                  <li>
                    <strong>Tipo de Pagamento:</strong> (Opcional) Especifique como a despesa foi paga (ex: Cartão de Crédito, Pix, Dinheiro) para uma análise mais detalhada. Você pode criar seus próprios tipos de pagamento na tela de Configurações.
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
                    efetuados. Você pode filtrar por mês, ano, tipo, categoria ou tipo de pagamento.
                  </li>
                  <li>
                    <strong>Recorrências:</strong> Um local centralizado para
                    ver e gerenciar todos os seus gastos e receitas fixas. Você
                    pode editar valores, datas e frequências, ou excluir uma
                    recorrência que não existe mais.
                  </li>
                </ul>
                <div className="p-3 mt-2 bg-muted rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold">Dica de mestre</h4>
                    <p className="text-sm text-muted-foreground">Na página de Transações, as recorrências que ainda vão acontecer no mês selecionado aparecem com um design tracejado e um ícone <Repeat className="inline h-4 w-4" /> para fácil identificação.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Configurações</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p>
                  Na área de <strong>Configurações</strong>, você pode
                  personalizar sua experiência.
                </p>
                 <div className="p-3 bg-card border rounded-md">
                    <h4 className="font-semibold flex items-center mb-1">
                      <Palette className="h-4 w-4 mr-2" />
                      Categorias de Despesa
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Crie e gerencie as categorias para classificar suas despesas. Atribua cores para facilitar a identificação visual nos gráficos e relatórios.
                    </p>
                 </div>
                 <div className="p-3 bg-card border rounded-md">
                    <h4 className="font-semibold flex items-center mb-1">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Tipos de Pagamento
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Cadastre as formas como você realiza seus pagamentos (ex: "Cartão Nubank", "Conta Corrente Itaú", "Dinheiro"). Isso permite um controle ainda mais fino sobre para onde seu dinheiro está indo.
                    </p>
                 </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
                <AccordionTrigger>Calculadora Financeira</AccordionTrigger>
                <AccordionContent className="space-y-3">
                    <p>
                        Uma suíte completa de ferramentas para o seu planejamento. Acesse através do ícone <Calculator className="inline h-4 w-4" /> no menu.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Aba Padrão:</strong> Use para cálculos rápidos, científicos e de porcentagem. Selecione um mês e ano para usar os totais de Receita, Despesa e Saldo daquele período em suas contas.</li>
                        <li><strong>Aba Metas:</strong> Simule o crescimento de seus investimentos com juros compostos. Informe um valor inicial, aportes mensais, a taxa de juros e o período para ver a projeção do seu patrimônio.</li>
                        <li><strong>Aba Financiamento:</strong> Calcule o valor da parcela de um empréstimo ou financiamento. Basta inserir o valor total, a taxa de juros e o número de parcelas.</li>
                        <li><strong>Aba Histórico:</strong> Todos os cálculos feitos na aba "Padrão" ficam salvos aqui para consulta ou reutilização.</li>
                    </ul>
                </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center">
                <HelpCircle className="mr-2 h-5 w-5" /> FAQ e Suporte
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
                Se você encontrou um problema, tem alguma dúvida que não foi respondida neste guia ou gostaria de dar um feedback, sua opinião é muito importante! Entre em contato através de um dos canais abaixo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://wa.me/5521989324855" target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4"/> WhatsApp
                    </Button>
                </a>
                <a href="https://www.instagram.com/codantalker" target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full">
                        <Instagram className="mr-2 h-4 w-4"/> Instagram
                    </Button>
                </a>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Guide;
