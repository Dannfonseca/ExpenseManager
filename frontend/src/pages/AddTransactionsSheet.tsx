import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, ArrowLeft, Save, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
}
interface PaymentType {
  _id: string;
  name: string;
}
interface TransactionRow {
  id: number;
  type: "expense" | "income";
  date: Date;
  description: string;
  amount: string;
  category: string;
  paymentType: string;
}

const AddTransactionsSheet = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<TransactionRow[]>([
    {
      id: Date.now(),
      type: "expense",
      date: new Date(),
      description: "",
      amount: "",
      category: "",
      paymentType: "",
    },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);

  useEffect(() => {
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
        
        setCategories(await catRes.json());
        setPaymentTypes(await ptRes.json());
      } catch (error: any) {
        toast.error(error.message);
      }
    };
    fetchInitialData();
  }, []);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now(),
        type: "expense",
        date: new Date(),
        description: "",
        amount: "",
        category: "",
        paymentType: "",
      },
    ]);
  };

  const handleRemoveRow = (id: number) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleRowChange = (id: number, field: keyof TransactionRow, value: any) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleSubmit = async () => {
    try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);

        const transactionsToSubmit = rows.map((row, index) => {
            if (!row.description || !row.amount) {
                throw new Error(`A linha ${index + 1} está incompleta. Descrição e valor são obrigatórios.`);
            }
            if (row.type === 'expense' && !row.category) {
                throw new Error(`A linha ${index + 1} é uma despesa e precisa de uma categoria.`);
            }
            return {
                type: row.type,
                date: row.date.toISOString(),
                description: row.description,
                amount: parseFloat(row.amount),
                category: row.type === 'expense' ? row.category : undefined,
                paymentType: row.paymentType || undefined
            };
        });

        const response = await fetch('/api/transactions/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(transactionsToSubmit)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar transações.');
        }

        toast.success(`${transactionsToSubmit.length} transações salvas com sucesso!`);
        navigate('/transactions');

    } catch (error: any) {
        toast.error(error.message);
    }
  };

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        Adicionar em Massa
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Use o modo planilha para adicionar várias transações.
                    </p>
                </div>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
                <Button className="flex-1 sm:flex-initial" variant="outline" onClick={handleAddRow}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                </Button>
                <Button className="flex-1 sm:flex-initial" onClick={handleSubmit}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                </Button>
            </div>
        </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[180px]">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[150px]">Valor</TableHead>
              <TableHead className="w-[200px]">Categoria</TableHead>
              <TableHead className="w-[200px]">Tipo Pagamento</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="p-2">
                  <ToggleGroup type="single" value={row.type} onValueChange={(value: 'expense' | 'income') => value && handleRowChange(row.id, 'type', value)} className="flex-nowrap">
                    <ToggleGroupItem value="expense" className="p-2"><ArrowDown className="h-4 w-4 text-destructive" /></ToggleGroupItem>
                    <ToggleGroupItem value="income" className="p-2"><ArrowUp className="h-4 w-4 text-success" /></ToggleGroupItem>
                  </ToggleGroup>
                </TableCell>
                <TableCell className="p-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !row.date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {row.date ? format(row.date, "PP", { locale: ptBR }) : <span>Escolha a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={row.date} onSelect={(date) => date && handleRowChange(row.id, 'date', date)} initialFocus /></PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="p-2">
                  <Input placeholder="Ex: Compras no mercado" value={row.description} onChange={e => handleRowChange(row.id, 'description', e.target.value)} />
                </TableCell>
                <TableCell className="p-2">
                  <Input type="number" placeholder="0,00" value={row.amount} onChange={e => handleRowChange(row.id, 'amount', e.target.value)} />
                </TableCell>
                <TableCell className="p-2">
                  <Select value={row.category} onValueChange={value => handleRowChange(row.id, 'category', value)} disabled={row.type === 'income'}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-2">
                    <Select value={row.paymentType} onValueChange={value => handleRowChange(row.id, 'paymentType', value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{paymentTypes.map(pt => <SelectItem key={pt._id} value={pt._id}>{pt.name}</SelectItem>)}</SelectContent>
                    </Select>
                </TableCell>
                <TableCell className="p-2">
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(row.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {rows.map(row => (
            <Card key={row.id} className="relative">
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleRemoveRow(row.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <CardContent className="p-4 space-y-4">
                    <ToggleGroup type="single" value={row.type} onValueChange={(value: 'expense' | 'income') => value && handleRowChange(row.id, 'type', value)} className="grid grid-cols-2">
                        <ToggleGroupItem value="expense"><ArrowDown className="mr-2 h-4 w-4 text-destructive" />Despesa</ToggleGroupItem>
                        <ToggleGroupItem value="income"><ArrowUp className="mr-2 h-4 w-4 text-success" />Receita</ToggleGroupItem>
                    </ToggleGroup>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input placeholder="Ex: Compras no mercado" value={row.description} onChange={e => handleRowChange(row.id, 'description', e.target.value)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input type="number" placeholder="0,00" value={row.amount} onChange={e => handleRowChange(row.id, 'amount', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label>Data</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !row.date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {row.date ? format(row.date, "dd/MM/yy") : <span>Data</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={row.date} onSelect={(date) => date && handleRowChange(row.id, 'date', date)} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Categoria</Label>
                           <Select value={row.category} onValueChange={value => handleRowChange(row.id, 'category', value)} disabled={row.type === 'income'}>
                               <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                               <SelectContent>{categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                           </Select>
                        </div>
                         <div className="space-y-2">
                           <Label>Pagamento</Label>
                            <Select value={row.paymentType} onValueChange={value => handleRowChange(row.id, 'paymentType', value)}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>{paymentTypes.map(pt => <SelectItem key={pt._id} value={pt._id}>{pt.name}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
};

export default AddTransactionsSheet;