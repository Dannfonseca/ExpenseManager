import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Save,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Landmark,
  Sheet,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
}

interface PaymentType {
  _id: string;
  name: string;
}

const AddTransaction = () => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    paymentType: "",
    notes: "",
    frequency: "monthly",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchRequests = [
          fetch("/api/payment-types", { credentials: 'include' }),
        ];

        if (transactionType === "expense") {
          fetchRequests.push(fetch("/api/categories", { credentials: 'include' }));
        }

        const responses = await Promise.all(fetchRequests);
        
        const ptResponse = responses[0];
        if (!ptResponse.ok) throw new Error("Falha ao buscar tipos de pagamento.");
        const ptData = await ptResponse.json();
        setPaymentTypes(ptData);

        if (transactionType === "expense") {
          const catResponse = responses[1];
          if (!catResponse.ok) throw new Error("Falha ao buscar categorias.");
          const catData = await catResponse.json();
          setCategories(catData);
        } else {
          setCategories([]);
          setFormData(prev => ({ ...prev, category: "" }));
        }
      } catch (error: any) {
        toast.error(error.message);
      }
    };
    fetchInitialData();
  }, [transactionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const apiEndpoint = isRecurring ? "/api/recurring-transactions" : "/api/transactions";
    
    const transactionData: any = {
      type: transactionType,
      description: formData.description,
      amount: parseFloat(formData.amount),
      notes: formData.notes,
    };

    if (formData.paymentType) {
      transactionData.paymentType = formData.paymentType;
    }

    if (isRecurring) {
      transactionData.frequency = formData.frequency;
      transactionData.startDate = date ? date.toISOString() : new Date().toISOString();
      if (endDate) {
        transactionData.endDate = endDate.toISOString();
      }
    } else {
      transactionData.date = date ? date.toISOString() : new Date().toISOString();
    }

    if (transactionType === 'expense') {
      transactionData.category = formData.category;
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Usa cookie para autenticação
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao adicionar transação.");
      }

      toast.success(`Transação ${isRecurring ? 'recorrente ' : ''}adicionada com sucesso!`);
      navigate(isRecurring ? "/recurring" : "/transactions");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
              </Button>
              <div>
                  <h1 className="text-3xl font-bold text-foreground">
                      Adicionar Transação
                  </h1>
                  <p className="text-muted-foreground">
                      Registre uma nova receita ou despesa
                  </p>
              </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/add-transactions-sheet')}>
              <Sheet className="mr-2 h-4 w-4" />
              Modo Planilha
          </Button>
      </div>


      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="flex items-center space-x-2">
          <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
          <Label htmlFor="recurring-switch">Transação Recorrente</Label>
        </div>

        <ToggleGroup
          type="single"
          value={transactionType}
          onValueChange={(value: "expense" | "income") => {
            if (value) setTransactionType(value);
          }}
          className="grid grid-cols-2"
        >
          <ToggleGroupItem value="expense" aria-label="Toggle expense">
            <ArrowDown className="mr-2 h-4 w-4 text-destructive" />
            Despesa
          </ToggleGroupItem>
          <ToggleGroupItem value="income" aria-label="Toggle income">
            <ArrowUp className="mr-2 h-4 w-4 text-success" />
            Receita
          </ToggleGroupItem>
        </ToggleGroup>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center">
              <Landmark className="mr-2 h-5 w-5" />
              Informações da Transação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  placeholder={
                    transactionType === "expense"
                      ? "Ex: Plano de Saúde, Aluguel..."
                      : "Ex: Salário, Rendimentos..."
                  }
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRecurring ? "Data de Início *" : "Data *"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "PP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {transactionType === "expense" && (
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Pagamento (Opcional)</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, paymentType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((pt) => (
                    <SelectItem key={pt._id} value={pt._id}>
                      {pt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Frequência *</Label>
                      <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({...prev, frequency: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Data Final (Opcional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "PP", { locale: ptBR })
                            ) : (
                              <span>Sem data final</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className="p-3"
                          />
                        </PopoverContent>
                      </Popover>
                   </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a transação..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Transação
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;