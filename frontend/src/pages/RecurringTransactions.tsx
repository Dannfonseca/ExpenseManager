import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Repeat, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para obter uma cor de texto contrastante (preto ou branco)
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#000000';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

interface Category {
  _id: string;
  name: string;
  color?: string;
}

interface RecurringTransaction {
  _id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: Category | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextOccurrenceDate: string;
  endDate?: string;
  notes?: string;
}

const frequencyMap = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual'
};

const RecurringTransactions = () => {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

  const [editFormData, setEditFormData] = useState({
    type: "expense" as "expense" | "income",
    description: "",
    amount: "",
    category: "",
    notes: "",
    frequency: "monthly",
  });
  const [editStartDate, setEditStartDate] = useState<Date | undefined>();
  const [editEndDate, setEditEndDate] = useState<Date | undefined>();

  const fetchRecurringTransactions = async () => {
    setLoading(true);
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);

      const response = await fetch('/api/recurring-transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar transações recorrentes');
      const data = await response.json();
      setTransactions(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) return;
        const { token } = JSON.parse(userInfoString);
        const response = await fetch("/api/categories", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
            const data = await response.json();
            setAllCategories(data);
        }
    } catch (error) {
        console.error("Failed to fetch categories for edit dialog");
    }
  };


  useEffect(() => {
    fetchRecurringTransactions();
    fetchAllCategories();
  }, []);

  const monthlyTotals = useMemo(() => {
    return transactions.reduce((totals, tx) => {
      let monthlyAmount = 0;
      switch (tx.frequency) {
        case 'daily':
          monthlyAmount = tx.amount * 30;
          break;
        case 'weekly':
          monthlyAmount = tx.amount * 4;
          break;
        case 'monthly':
          monthlyAmount = tx.amount;
          break;
        case 'yearly':
          monthlyAmount = tx.amount / 12;
          break;
      }

      if (tx.type === 'income') {
        totals.income += monthlyAmount;
      } else {
        totals.expenses += monthlyAmount;
      }

      return totals;
    }, { income: 0, expenses: 0 });
  }, [transactions]);

  const handleEditClick = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category?._id || "",
      notes: transaction.notes || "",
      frequency: transaction.frequency,
    });
    setEditStartDate(parseISO(transaction.startDate));
    setEditEndDate(transaction.endDate ? parseISO(transaction.endDate) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);

        const updatedData: any = {
            type: editFormData.type,
            description: editFormData.description,
            amount: parseFloat(editFormData.amount),
            startDate: editStartDate?.toISOString(),
            endDate: editEndDate?.toISOString() || null,
            frequency: editFormData.frequency,
            notes: editFormData.notes,
        };

        if (editFormData.type === 'expense') {
            updatedData.category = editFormData.category;
        }

        const response = await fetch(`/api/recurring-transactions/${editingTransaction._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Falha ao atualizar a transação recorrente.");
        }
        toast.success("Transação recorrente atualizada!");
        setIsEditDialogOpen(false);
        setEditingTransaction(null);
        fetchRecurringTransactions();
    } catch (error: any) {
        toast.error(error.message);
    }
  };
  
  const handleDelete = async (transactionId: string) => {
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);

      const response = await fetch(`/api/recurring-transactions/${transactionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Falha ao remover transação recorrente.");
      }
      toast.success("Transação recorrente removida com sucesso!");
      fetchRecurringTransactions();
    } catch (error: any) {
        toast.error(error.message);
    }
  };

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
       <div>
        <h1 className="text-3xl font-bold text-foreground">Transações Recorrentes</h1>
        <p className="text-muted-foreground">Gerencie suas receitas e despesas que se repetem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Recorrentes (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {monthlyTotals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
             <p className="text-xs text-muted-foreground">
              Total de receitas recorrentes por mês.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas Recorrentes (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
               R$ {monthlyTotals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de despesas recorrentes por mês.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Repeat className="mr-2 h-5 w-5" /> Suas Recorrências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p>Carregando...</p>
            ) : transactions.length > 0 ? (
              transactions.map(tx => (
                <Card key={tx._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex items-center gap-4 mb-4 md:mb-0 flex-1">
                    <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                      {tx.type === 'income' ? <ArrowUp className="h-5 w-5 text-success" /> : <ArrowDown className="h-5 w-5 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{tx.description}</p>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{frequencyMap[tx.frequency]}</Badge>
                        {tx.category && (
                            <Badge style={{
                                backgroundColor: tx.category.color,
                                color: getContrastColor(tx.category.color || "#000000")
                            }}>
                                {tx.category.name}
                            </Badge>
                        )}
                        <span>Próxima: {format(parseISO(tx.nextOccurrenceDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        {tx.endDate && <span>Termina em: {format(parseISO(tx.endDate), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                      </div>
                      {tx.notes && <p className="text-xs text-muted-foreground mt-1">{tx.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end md:self-center">
                     <p className={`font-bold text-lg ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                       {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </p>
                     <div>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(tx)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza que deseja excluir a recorrência "{tx.description}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(tx._id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma transação recorrente encontrada.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Transação Recorrente</DialogTitle>
            </DialogHeader>
            {editingTransaction && (
                <form onSubmit={handleUpdate}>
                    <div className="py-4 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Descrição</Label>
                            <Input value={editFormData.description} onChange={(e) => setEditFormData(p => ({ ...p, description: e.target.value }))} />
                          </div>
                           <div>
                            <Label>Valor</Label>
                            <Input type="number" value={editFormData.amount} onChange={(e) => setEditFormData(p => ({ ...p, amount: e.target.value }))} />
                          </div>
                       </div>
                       {editFormData.type === 'expense' && (
                          <div>
                            <Label>Categoria</Label>
                            <Select value={editFormData.category} onValueChange={(value) => setEditFormData(p => ({ ...p, category: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allCategories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </div>
                       )}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <Label>Data de Início</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{editStartDate ? format(editStartDate, "PP", { locale: ptBR }) : <span>Escolha a data</span>}</Button>
                                    </PopoverTrigger>
                                    <PopoverContent><Calendar mode="single" selected={editStartDate} onSelect={setEditStartDate} /></PopoverContent>
                                </Popover>
                           </div>
                           <div>
                                <Label>Data Final (Opcional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{editEndDate ? format(editEndDate, "PP", { locale: ptBR }) : <span>Sem data final</span>}</Button>
                                    </PopoverTrigger>
                                    <PopoverContent><Calendar mode="single" selected={editEndDate} onSelect={setEditEndDate} /></PopoverContent>
                                </Popover>
                           </div>
                       </div>
                        <div>
                            <Label>Frequência</Label>
                            <Select value={editFormData.frequency} onValueChange={(value) => setEditFormData(p => ({...p, frequency: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Diária</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                       <div>
                            <Label>Observações</Label>
                            <Textarea value={editFormData.notes} onChange={(e) => setEditFormData(p => ({ ...p, notes: e.target.value }))} />
                       </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                        <Button type="submit">Salvar Alterações</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringTransactions;