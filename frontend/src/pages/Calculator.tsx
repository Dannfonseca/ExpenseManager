import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator as CalculatorIcon, TrendingUp, TrendingDown, Scale, PiggyBank, Landmark, History, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
    _id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
}

interface SummaryData {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactions: Transaction[];
}

const Calculator = () => {
    // Estados gerais
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

    // Estados da Calculadora Padrão
    const [display, setDisplay] = useState("0");
    const [expression, setExpression] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'income' | 'expense'>('expense');
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [history, setHistory] = useState<{ expression: string; result: string }[]>([]);
    
    // Estados da Calculadora de Metas
    const [metaState, setMetaState] = useState({ initial: '', monthly: '', rate: '', years: '' });
    const [metaResult, setMetaResult] = useState<{ futureValue: number; totalInvested: number; totalInterest: number} | null>(null);

    // Estados da Calculadora de Financiamento
    const [loanState, setLoanState] = useState({ amount: '', rate: '', months: '' });
    const [loanResult, setLoanResult] = useState<{ monthlyPayment: number; totalPaid: number; totalInterest: number} | null>(null);

    useEffect(() => {
        const fetchSummaryData = async () => {
          try {
            const userInfoString = localStorage.getItem("userInfo");
            if (!userInfoString) throw new Error("Usuário não autenticado.");
            const { token } = JSON.parse(userInfoString);
        
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
        
            const response = await fetch(`/api/transactions?year=${currentYear}&month=${currentMonth}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
        
            if (!response.ok) throw new Error("Falha ao buscar dados de resumo.");
        
            const data = await response.json();
            setSummaryData({
              totalIncome: data.monthTotals.income,
              totalExpenses: data.monthTotals.expenses,
              balance: data.monthTotals.balance,
              transactions: data.transactions,
            });
          } catch (error: any) {
            toast.error(error.message);
          } finally {
            setLoadingSummary(false);
          }
        };
        fetchSummaryData();
    }, []);
    
    const handleValueInsert = (valueStr: string) => {
        if (display === "0" || display === "Erro" || expression === "") {
            setDisplay(valueStr);
            setExpression(valueStr);
        } else if (/[+\-*/\^(]$/.test(expression)) {
            setDisplay(display + valueStr);
            setExpression(expression + valueStr);
        } else {
            toast.info("Por favor, insira um operador antes de adicionar outro valor.");
        }
    };
    
    const evaluateExpression = (expr: string): string => {
        try {
            let processedExpr = expr;
    
            processedExpr = processedExpr.replace(/(\d+(\.\d+)?) *([+\-]) *(\d+(\.\d+)?)%/g, (match, p1, _, p3, p4) => {
                const base = parseFloat(p1);
                const percentage = parseFloat(p4);
                const value = base * (percentage / 100);
                return `${base} ${p3} ${value}`;
            });
            
            processedExpr = processedExpr
              .replace(/\^/g, "**")
              .replace(/π/g, String(Math.PI))
              .replace(/e/g, String(Math.E));
    
            const result = eval(processedExpr);
            if (typeof result !== 'number' || !isFinite(result)) return "Erro";
            return String(result);
        } catch (error) {
            return "Erro";
        }
    };

    const handleButtonClick = (value: string) => {
        if (value === "AC") {
            setDisplay("0");
            setExpression("");
            return;
        }
        
        if (value === "C") {
            setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
            setExpression(expression.length > 1 ? expression.slice(0, -1) : "");
            return;
        }

        if (value === "=") {
            const result = evaluateExpression(expression);
            if(result !== "Erro") {
                setHistory(prev => [{ expression, result }, ...prev]);
            }
            setDisplay(result);
            setExpression(result);
            return;
        }
        
        if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(value)) {
            try {
                const number = eval(expression);
                let result;
                switch(value) {
                    case 'sin': result = Math.sin(number * Math.PI / 180); break;
                    case 'cos': result = Math.cos(number * Math.PI / 180); break;
                    case 'tan': result = Math.tan(number * Math.PI / 180); break;
                    case 'log': result = Math.log10(number); break;
                    case 'sqrt': result = Math.sqrt(number); break;
                }
                setDisplay(String(result));
                setExpression(String(result));
            } catch {
                setDisplay("Erro");
                setExpression("");
            }
            return;
        }
        
        if (value === 'Saldo' && summaryData) {
            handleValueInsert(String(summaryData.balance));
            return;
        }
    
        if (display === "0" && "0123456789(.".includes(value)) {
          setDisplay(value);
          setExpression(value);
        } else {
          if (display === "Erro") {
            setDisplay(value);
            setExpression(value);
          } else {
            setDisplay(display + value);
            setExpression(expression + value);
          }
        }
    };
    
    const openSelectionDialog = (mode: 'income' | 'expense') => {
        setDialogMode(mode);
        setSelectedTransactions([]);
        setIsDialogOpen(true);
    }
    
    const handleSelectionConfirm = () => {
        const totalSelected = summaryData?.transactions
          .filter(t => selectedTransactions.includes(t._id))
          .reduce((sum, t) => sum + t.amount, 0) || 0;
        
        handleValueInsert(String(totalSelected));
        setIsDialogOpen(false);
    }

    const handleCalculateMeta = () => {
        const P = parseFloat(metaState.initial) || 0;
        const PMT = parseFloat(metaState.monthly) || 0;
        const r_anual = parseFloat(metaState.rate) / 100;
        const t = parseFloat(metaState.years);

        if(isNaN(r_anual) || isNaN(t) || t <= 0) {
            toast.error("Por favor, preencha a taxa de juros e o período corretamente.");
            return;
        }

        const r = r_anual / 12; // taxa mensal
        const n = t * 12; // número de meses
        
        const futureValue = P * Math.pow(1 + r, n) + PMT * ( (Math.pow(1 + r, n) - 1) / r );
        const totalInvested = P + (PMT * n);
        const totalInterest = futureValue - totalInvested;

        setMetaResult({ futureValue, totalInvested, totalInterest });
    }
    
    const handleCalculateLoan = () => {
        const P = parseFloat(loanState.amount);
        const r_anual = parseFloat(loanState.rate) / 100;
        const n = parseInt(loanState.months);

        if(isNaN(P) || isNaN(r_anual) || isNaN(n) || P <= 0 || r_anual <= 0 || n <= 0) {
            toast.error("Por favor, preencha todos os campos corretamente.");
            return;
        }

        const r = r_anual / 12; // taxa mensal
        const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPaid = monthlyPayment * n;
        const totalInterest = totalPaid - P;

        setLoanResult({ monthlyPayment, totalPaid, totalInterest });
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    const buttons = [
        "sin", "cos", "tan", "AC", "C",
        "log", "(", ")", "^", "/",
        "sqrt", "7", "8", "9", "*",
        "π", "4", "5", "6", "-",
        "e", "1", "2", "3", "+",
        "%", "0", ".", "="
    ];
    
    const filteredTransactions = summaryData?.transactions.filter(t => t.type === dialogMode) || [];
    const totalSelectedValue = summaryData?.transactions
          .filter(t => selectedTransactions.includes(t._id))
          .reduce((sum, t) => sum + t.amount, 0) || 0;

    return (
        <div className="p-4 md:p-6 min-h-screen">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Card className="w-full max-w-lg mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl md:text-2xl">
                            <CalculatorIcon className="mr-2 h-6 w-6" /> Calculadora Financeira
                        </CardTitle>
                        <CardDescription>
                            Ferramentas para auxiliar no seu planejamento financeiro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="padrao" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="padrao">Padrão</TabsTrigger>
                                <TabsTrigger value="metas">Metas</TabsTrigger>
                                <TabsTrigger value="financiamento">Financ.</TabsTrigger>
                                <TabsTrigger value="historico">Histórico</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="padrao" className="mt-4">
                                <div className="bg-muted text-right p-4 rounded-lg mb-4 text-3xl font-mono break-all min-h-[64px] flex items-center justify-end">
                                    {display}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <DialogTrigger asChild>
                                        <Button variant="outline" onClick={() => openSelectionDialog('income')} disabled={loadingSummary} className="flex-col h-auto">
                                            <TrendingUp className="h-4 w-4 mb-1 text-green-500"/>
                                            <span className="text-xs">Receitas</span>
                                            <span className="text-xs font-bold">{summaryData?.totalIncome.toFixed(2)}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" onClick={() => openSelectionDialog('expense')} disabled={loadingSummary} className="flex-col h-auto">
                                            <TrendingDown className="h-4 w-4 mb-1 text-red-500"/>
                                            <span className="text-xs">Despesas</span>
                                            <span className="text-xs font-bold">{summaryData?.totalExpenses.toFixed(2)}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <Button variant="outline" onClick={() => handleButtonClick('Saldo')} disabled={loadingSummary} className="flex-col h-auto">
                                        <Scale className="h-4 w-4 mb-1"/>
                                        <span className="text-xs">Saldo</span>
                                        <span className="text-xs font-bold">{summaryData?.balance.toFixed(2)}</span>
                                    </Button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {buttons.map((btn) => (
                                        <Button key={btn} onClick={() => handleButtonClick(btn)} variant={["=", "+", "-", "*", "/", "^"].includes(btn) ? "default" : "secondary"} className={`text-lg font-bold ${btn === "=" ? "col-span-2" : ""}`}>
                                            {btn}
                                        </Button>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="metas" className="mt-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="meta-initial">Valor Inicial (R$)</Label>
                                        <Input id="meta-initial" type="number" placeholder="Ex: 1000" value={metaState.initial} onChange={e => setMetaState({...metaState, initial: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label htmlFor="meta-monthly">Aporte Mensal (R$)</Label>
                                        <Input id="meta-monthly" type="number" placeholder="Ex: 300" value={metaState.monthly} onChange={e => setMetaState({...metaState, monthly: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label htmlFor="meta-rate">Taxa de Juros Anual (%)</Label>
                                        <Input id="meta-rate" type="number" placeholder="Ex: 8.5" value={metaState.rate} onChange={e => setMetaState({...metaState, rate: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label htmlFor="meta-years">Período (anos)</Label>
                                        <Input id="meta-years" type="number" placeholder="Ex: 10" value={metaState.years} onChange={e => setMetaState({...metaState, years: e.target.value})} />
                                    </div>
                                    <Button onClick={handleCalculateMeta} className="w-full"><PiggyBank className="mr-2 h-4 w-4"/>Calcular Meta</Button>
                                    {metaResult && (
                                        <Card className="p-4 bg-muted">
                                            <h4 className="font-bold text-center mb-2">Resultado da Projeção</h4>
                                            <div className="text-sm space-y-2">
                                                <p className="flex justify-between"><span>Valor Total Investido:</span> <strong>{formatCurrency(metaResult.totalInvested)}</strong></p>
                                                <p className="flex justify-between"><span>Total em Juros:</span> <strong className="text-green-500">{formatCurrency(metaResult.totalInterest)}</strong></p>
                                                <p className="flex justify-between text-base"><span>Valor Futuro Estimado:</span> <strong className="text-primary">{formatCurrency(metaResult.futureValue)}</strong></p>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="financiamento" className="mt-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="loan-amount">Valor do Empréstimo (R$)</Label>
                                        <Input id="loan-amount" type="number" placeholder="Ex: 50000" value={loanState.amount} onChange={e => setLoanState({...loanState, amount: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label htmlFor="loan-rate">Taxa de Juros Anual (%)</Label>
                                        <Input id="loan-rate" type="number" placeholder="Ex: 12" value={loanState.rate} onChange={e => setLoanState({...loanState, rate: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label htmlFor="loan-months">Nº de Parcelas (meses)</Label>
                                        <Input id="loan-months" type="number" placeholder="Ex: 48" value={loanState.months} onChange={e => setLoanState({...loanState, months: e.target.value})} />
                                    </div>
                                    <Button onClick={handleCalculateLoan} className="w-full"><Landmark className="mr-2 h-4 w-4"/>Calcular Financiamento</Button>
                                    {loanResult && (
                                        <Card className="p-4 bg-muted">
                                            <h4 className="font-bold text-center mb-2">Resultado da Simulação</h4>
                                            <div className="text-sm space-y-2">
                                                <p className="flex justify-between text-base"><span>Valor da Parcela Mensal:</span> <strong className="text-primary">{formatCurrency(loanResult.monthlyPayment)}</strong></p>
                                                <p className="flex justify-between"><span>Custo Total do Financiamento:</span> <strong>{formatCurrency(loanResult.totalPaid)}</strong></p>
                                                <p className="flex justify-between"><span>Total em Juros:</span> <strong className="text-red-500">{formatCurrency(loanResult.totalInterest)}</strong></p>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="historico" className="mt-4">
                                <Button variant="outline" size="sm" className="mb-2 w-full" onClick={() => setHistory([])} disabled={history.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Limpar Histórico
                                </Button>
                                <ScrollArea className="h-80">
                                    <div className="space-y-2 text-sm">
                                        {history.length > 0 ? (
                                            history.map((item, index) => (
                                                <div key={index} className="p-2 rounded-md bg-muted hover:bg-muted/80 cursor-pointer" onClick={() => { handleValueInsert(item.result); }}>
                                                    <p className="text-muted-foreground truncate text-xs">{item.expression}</p>
                                                    <p className="font-bold text-right text-base">{item.result}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted-foreground pt-10">Nenhum cálculo no histórico.</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selecione as {dialogMode === 'income' ? 'Receitas' : 'Despesas'}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-72 my-4">
                        <div className="space-y-2">
                        {filteredTransactions.map(tx => (
                            <div key={tx._id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox id={tx._id} checked={selectedTransactions.includes(tx._id)} onCheckedChange={checked => {setSelectedTransactions(prev => checked ? [...prev, tx._id] : prev.filter(id => id !== tx._id)); }} />
                                <label htmlFor={tx._id} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {tx.description}
                                </label>
                                <span className="text-sm font-mono">{tx.amount.toFixed(2)}</span>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="sm:justify-between">
                        <div className="text-sm font-bold">
                            Total Selecionado: R$ {totalSelectedValue.toFixed(2)}
                        </div>
                        <div>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                            <Button onClick={handleSelectionConfirm} className="ml-2">Confirmar</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="w-full max-w-lg mx-auto shadow-lg mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Info className="mr-2 h-5 w-5" /> Como Utilizar
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    <div>
                        <h4 className="font-semibold text-card-foreground mb-1">Aba Padrão</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Realize cálculos científicos e de porcentagem (Ex: <strong>500 + 15%</strong>).</li>
                            <li>Clique em <strong>Receitas</strong> ou <strong>Despesas</strong> para somar transações específicas do mês.</li>
                            <li>O botão <strong>Saldo</strong> insere seu saldo atual no visor.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-card-foreground mb-1">Aba Metas</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Simule o crescimento de um investimento com juros compostos.</li>
                            <li>Preencha o valor inicial, aportes mensais, taxa de juros anual e o período em anos.</li>
                            <li>Clique em <strong>Calcular Meta</strong> para ver a projeção do seu patrimônio.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-card-foreground mb-1">Aba Financiamento</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Calcule o valor da parcela de um empréstimo ou financiamento.</li>
                            <li>Informe o valor total do empréstimo, a taxa de juros anual e o número de parcelas.</li>
                            <li>O resultado mostrará a parcela mensal e o custo total do financiamento.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-card-foreground mb-1">Aba Histórico</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Todos os cálculos finalizados na aba "Padrão" são salvos aqui.</li>
                            <li>Clique em um item para reutilizar o resultado no visor da calculadora.</li>
                            <li>Use o botão <strong>Limpar Histórico</strong> para apagar todos os registros.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Calculator;