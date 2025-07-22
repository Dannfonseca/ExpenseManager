import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface PaymentType {
  _id: string;
  name: string;
}

interface Transaction {
  _id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: Category | null;
  paymentType: PaymentType | null;
  date: string;
  notes?: string;
}

interface MonthTotals {
  income: number;
  expenses: number;
  balance: number;
}

const months = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: new Date(0, i).toLocaleString("pt-BR", { month: "long" }),
}));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) =>
  (currentYear - i).toString()
);

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allPaymentTypes, setAllPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    type: "expense" as "expense" | "income",
    description: "",
    amount: "",
    category: "",
    paymentType: "",
    notes: "",
  });
  const [editDate, setEditDate] = useState<Date | undefined>();

  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<
    "all" | "income" | "expense"
  >("all");
  const [monthTotals, setMonthTotals] = useState<MonthTotals>({
    income: 0,
    expenses: 0,
    balance: 0,
  });

  const navigate = useNavigate();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);

      const url = new URL("/api/transactions", window.location.origin);
      url.searchParams.append("month", selectedMonth);
      url.searchParams.append("year", selectedYear);

      if (selectedCategory && selectedCategory !== "all") {
        url.searchParams.append("category", selectedCategory);
      }
      if (selectedPaymentType && selectedPaymentType !== "all") {
        url.searchParams.append("paymentType", selectedPaymentType);
      }
      if (searchTerm) {
        url.searchParams.append("search", searchTerm);
      }
      if (transactionTypeFilter !== "all") {
        url.searchParams.append("type", transactionTypeFilter);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao buscar transações.");
      const data = await response.json();
      setTransactions(data.transactions || []);
      setMonthTotals(
        data.monthTotals || { income: 0, expenses: 0, balance: 0 }
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInitialData = async () => {
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);
      
      const [catRes, ptRes] = await Promise.all([
        fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/payment-types", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (!catRes.ok) throw new Error("Falha ao buscar categorias.");
      if (!ptRes.ok) throw new Error("Falha ao buscar tipos de pagamento.");

      const catData = await catRes.json();
      const ptData = await ptRes.json();

      setAllCategories(catData);
      setAllPaymentTypes(ptData);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [
    selectedMonth,
    selectedYear,
    selectedCategory,
    selectedPaymentType,
    searchTerm,
    transactionTypeFilter,
  ]);

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category?._id || "",
      paymentType: transaction.paymentType?._id || "",
      notes: transaction.notes || "",
    });
    setEditDate(new Date(transaction.date));
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;

    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);

      const updatedData: any = {
        type: editFormData.type,
        description: editFormData.description,
        amount: parseFloat(editFormData.amount),
        date: editDate?.toISOString(),
        notes: editFormData.notes,
        paymentType: editFormData.paymentType || null
      };

      if (editFormData.type === "expense") {
        updatedData.category = editFormData.category;
      }

      const response = await fetch(
        `/api/transactions/${editingTransaction._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao atualizar a transação.");
      }
      toast.success("Transação atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);

      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Falha ao remover transação.");
      }

      toast.success("Transação removida com sucesso!");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => navigate("/add-transaction")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              Resumo de {months.find((m) => m.value === selectedMonth)?.label}{" "}
              {selectedYear}
            </CardTitle>
            <div className="flex gap-2 items-center">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-green-100 dark:bg-green-900/50">
            <TrendingUp className="h-6 w-6 text-success" />
            <div>
              <div className="text-sm text-muted-foreground">Receita Total</div>
              <div className="text-xl font-bold text-success">
                R${" "}
                {(monthTotals?.income || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/50">
            <TrendingDown className="h-6 w-6 text-destructive" />
            <div>
              <div className="text-sm text-muted-foreground">Despesa Total</div>
              <div className="text-xl font-bold text-destructive">
                R${" "}
                {(monthTotals?.expenses || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <Scale className="h-6 w-6 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Saldo Final</div>
              <div
                className={cn(
                  "text-xl font-bold",
                  (monthTotals?.balance || 0) >= 0
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                R${" "}
                {(monthTotals?.balance || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <ToggleGroup
                type="single"
                value={transactionTypeFilter}
                onValueChange={(value) =>
                  value && setTransactionTypeFilter(value as any)
                }
                className="flex-wrap"
              >
                <ToggleGroupItem value="all">Todos</ToggleGroupItem>
                <ToggleGroupItem value="income">Receitas</ToggleGroupItem>
                <ToggleGroupItem value="expense">Despesas</ToggleGroupItem>
              </ToggleGroup>
              <div className="flex gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {allCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedPaymentType}
                  onValueChange={setSelectedPaymentType}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tipos de Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {allPaymentTypes.map((pt) => (
                      <SelectItem key={pt._id} value={pt._id}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
             <p>
              Exibindo{" "}
              <span className="font-bold text-foreground">{transactions.length}</span>{" "}
              transações.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (transactions.length) > 0 ? (
          transactions.map((transaction) => (
            <Card
              key={transaction._id}
              className="border-border bg-card hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === "income"
                          ? "bg-success/20"
                          : "bg-destructive/20"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUp className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground truncate">
                        {transaction.description}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(transaction.date).toLocaleDateString(
                            "pt-BR",
                            { timeZone: "UTC" }
                          )}
                        </div>
                        {transaction.category && (
                          <Badge style={{
                            backgroundColor: transaction.category.color,
                            color: getContrastColor(transaction.category.color || "#000000")
                          }}>
                            {transaction.category.name}
                          </Badge>
                        )}
                        {transaction.paymentType && (<Badge variant="secondary">{transaction.paymentType.name}</Badge>)}
                      </div>
                      {transaction.notes && <p className="text-xs text-muted-foreground mt-1">{transaction.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-xl font-bold ${
                        transaction.type === "income"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"} R${" "}
                      {transaction.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(transaction._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center p-8">
            <p className="text-muted-foreground">
              Nenhuma transação encontrada para os filtros selecionados.
            </p>
          </Card>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Descrição</Label>
                <Input value={editFormData.description} onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label>Valor</Label>
                <Input type="number" value={editFormData.amount} onChange={(e) => setEditFormData((p) => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {editFormData.type === "expense" && (
                <div>
                  <Label>Categoria</Label>
                  <Select value={editFormData.category} onValueChange={(value) => setEditFormData((p) => ({ ...p, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{allCategories.map((c) => (<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              )}
               <div>
                  <Label>Tipo de Pagamento</Label>
                  <Select value={editFormData.paymentType} onValueChange={(value) => setEditFormData((p) => ({ ...p, paymentType: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                    <SelectContent>{allPaymentTypes.map((pt) => (<SelectItem key={pt._id} value={pt._id}>{pt.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
            </div>
            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{editDate ? format(editDate, "PP", { locale: ptBR }) : (<span>Escolha uma data</span>)}</Button>
                </PopoverTrigger>
                <PopoverContent><Calendar mode="single" selected={editDate} onSelect={setEditDate} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={editFormData.notes} onChange={(e) => setEditFormData((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancelar</Button></DialogClose>
            <Button onClick={handleUpdate}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;