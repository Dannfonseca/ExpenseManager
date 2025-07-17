/*
 * Adicionado controle de data independente para os cards de resumo.
 * - Novos estados para gerenciar os dados dos cards e dos gráficos.
 * - Adicionada a funcionalidade de "Previsão" para gastos e receitas recorrentes.
 * - Os gráficos de "Análise Gráfica" e "Top Categorias" mantêm seus próprios controles de data.
 * - Desabilitada a exibição dos gráficos e top categorias no modo "Previsão".
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  ChevronsUpDown,
  TrendingDown,
  TrendingUp,
  Plus,
  Scale,
  PieChart as PieChartIcon,
  TrendingUpDown,
  LineChart as LineChartIcon,
  CalendarClock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import heroImage from "@/assets/expense-hero.jpg";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Interfaces
interface DailyExpense {
  day: number;
  amount: number;
}
interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  dailyExpenses: DailyExpense[];
  comparisonDailyExpenses: DailyExpense[] | null;
  topCategories: { name: string; total: number }[];
}
interface BreakdownData {
  name: string;
  total: number;
}
interface ComparisonPieData {
  [key: string]: {
    expenses: BreakdownData[];
    incomes: BreakdownData[];
  };
}
interface ChartData {
  day: string;
  currentMonth: number;
  comparisonMonth?: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const months = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: new Date(0, i).toLocaleString("pt-BR", { month: "long" }),
}));
const years = ["2022", "2023", "2024", "2025"];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [activeChart, setActiveChart] = useState<"line" | "pie">("line");
  const navigate = useNavigate();

  // State for Summary Cards and Forecast
  const [summaryMonth, setSummaryMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [summaryYear, setSummaryYear] = useState(
    new Date().getFullYear().toString()
  );
  const [isForecastView, setIsForecastView] = useState(false); // Controls the forecast view
  const [summaryData, setSummaryData] = useState<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // State for Line Chart
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [isComparing, setIsComparing] = useState(false);
  const [compareMonth, setCompareMonth] = useState(
    (((new Date().getMonth() + 12 - 1) % 12) + 1).toString()
  );
  const [compareYear, setCompareYear] = useState(
    new Date().getFullYear().toString()
  );

  // State for Pie Chart
  const [piePopoverOpen, setPiePopoverOpen] = useState(false);
  const [pieSelectedMonths, setPieSelectedMonths] = useState<string[]>([
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
      2,
      "0"
    )}`,
  ]);
  const [pieChartData, setPieChartData] = useState<ComparisonPieData | null>(
    null
  );
  const [pieChartDataType, setPieChartDataType] = useState<
    "expenses" | "incomes"
  >("expenses");
  const [loadingPie, setLoadingPie] = useState(false);

  // State for Top Categories
  const [categoriesMonth, setCategoriesMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [categoriesYear, setCategoriesYear] = useState(
    new Date().getFullYear().toString()
  );
  const [topCategories, setTopCategories] = useState<
    { name: string; total: number }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const availableMonths = useMemo(() => {
    const monthsList = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      monthsList.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`,
        label: `${date.toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        })}`,
      });
    }
    return monthsList;
  }, []);

  // Fetch data for Summary Cards or Forecast
  useEffect(() => {
    const fetchSummaryOrForecastData = async () => {
      setLoadingSummary(true);
      try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);

        const endpoint = isForecastView ? 'forecast' : 'summary';
        const url = `/api/dashboard/${endpoint}/${summaryYear}/${summaryMonth}`;
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Falha ao buscar dados de ${isForecastView ? 'previsão' : 'resumo'}.`);
        const data = await response.json();
        setSummaryData({
          totalIncome: data.totalIncome,
          totalExpenses: data.totalExpenses,
          balance: data.balance,
        });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummaryOrForecastData();
  }, [summaryMonth, summaryYear, isForecastView]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);
        let url = `/api/dashboard/summary/${selectedYear}/${selectedMonth}`;
        if (isComparing && activeChart === "line") {
          url += `?compareYear=${compareYear}&compareMonth=${compareMonth}`;
        }
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error("Falha ao buscar dados do dashboard.");
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (activeChart === "line" || !dashboardData) {
      fetchDashboardData();
    }
  }, [selectedYear, selectedMonth, isComparing, compareYear, compareMonth, activeChart]);

  useEffect(() => {
    const fetchTopCategories = async () => {
      setLoadingCategories(true);
      try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);
        const url = `/api/dashboard/summary/${categoriesYear}/${categoriesMonth}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error("Falha ao buscar dados das categorias.");
        const data: DashboardData = await response.json();
        setTopCategories(data.topCategories || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchTopCategories();
  }, [categoriesMonth, categoriesYear]);

  useEffect(() => {
    const fetchPieChartData = async () => {
      if (pieSelectedMonths.length === 0) {
        setPieChartData(null);
        return;
      }
      setLoadingPie(true);
      try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);
        const response = await fetch("/api/dashboard/category-breakdown", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ months: pieSelectedMonths }),
        });
        if (!response.ok)
          throw new Error("Falha ao buscar dados para o gráfico de pizza.");
        const data = await response.json();
        setPieChartData(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoadingPie(false);
      }
    };
    if (activeChart === "pie") {
      fetchPieChartData();
    }
  }, [pieSelectedMonths, activeChart]);

  const lineChartData: ChartData[] = useMemo(() => {
    if (!dashboardData?.dailyExpenses) return [];
    const maxDays = 31;
    return Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1;
      const currentDataPoint = dashboardData.dailyExpenses.find(
        (d) => d.day === day
      );
      const compareDataPoint = dashboardData.comparisonDailyExpenses?.find(
        (d) => d.day === day
      );
      return {
        day: day.toString(),
        currentMonth: currentDataPoint?.amount || 0,
        comparisonMonth: isComparing ? compareDataPoint?.amount || 0 : undefined,
      };
    });
  }, [dashboardData, isComparing]);

  const topCategoriesWithPercentage = useMemo(() => {
    if (!topCategories) return [];
    const totalExpenses = topCategories.reduce((sum, cat) => sum + cat.total, 0);
    return topCategories.map((cat) => ({
      ...cat,
      percentage: ((cat.total / (totalExpenses || 1)) * 100).toFixed(1),
    }));
  }, [topCategories]);

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
      <div className="relative h-24 overflow-hidden rounded-b-2xl">
        <img
          src={heroImage}
          alt="Dashboard background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1">ExpenseManager</h1>
            <p className="text-sm opacity-90">
              Controle total das suas finanças
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6 -mt-4 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-muted-foreground">
                {isForecastView ? "Previsão para" : "Visão geral de"}{" "}
                {months.find((m) => m.value === summaryMonth)?.label}{" "}
                {summaryYear}
              </p>
              <Select value={summaryMonth} onValueChange={setSummaryMonth}>
                <SelectTrigger className="w-36 h-8 text-xs">
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
              <Select value={summaryYear} onValueChange={setSummaryYear}>
                <SelectTrigger className="w-24 h-8 text-xs">
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
              <div className="flex items-center space-x-2">
                <Switch
                    id="forecast-switch"
                    checked={isForecastView}
                    onCheckedChange={setIsForecastView}
                />
                <Label htmlFor="forecast-switch" className="flex items-center gap-1 text-sm">
                    <CalendarClock className="h-4 w-4" />
                    Previsão
                </Label>
              </div>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            onClick={() => navigate("/add-transaction")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingSummary ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isForecastView ? "Receitas Previstas" : "Receitas do Mês"}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    R${" "}
                    {(summaryData?.totalIncome ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isForecastView ? "Despesas Previstas" : "Despesas do Mês"}
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    R${" "}
                    {(summaryData?.totalExpenses ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isForecastView ? "Saldo Previsto" : "Saldo do Mês"}
                  </CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R${" "}
                    {(summaryData?.balance ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
                <CardTitle className="flex items-center">
                  <TrendingUpDown className="mr-2 h-5 w-5" />
                  Análise Gráfica
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
                  <Select
                    value={activeChart}
                    onValueChange={(v) => setActiveChart(v as "line" | "pie")}
                    disabled={isForecastView}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">
                        <div className="flex items-center">
                          <LineChartIcon className="mr-2 h-4 w-4" />
                          Gastos Diários
                        </div>
                      </SelectItem>
                      <SelectItem value="pie">
                        <div className="flex items-center">
                          <PieChartIcon className="mr-2 h-4 w-4" />
                          Distribuição %
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {activeChart === "line" && (
                    <div className="flex gap-2 items-center flex-wrap">
                      <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                        disabled={isForecastView}
                      >
                        <SelectTrigger className="w-36">
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
                      <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isForecastView}>
                        <SelectTrigger className="w-24">
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
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="compare-switch"
                          checked={isComparing}
                          onCheckedChange={setIsComparing}
                          disabled={isForecastView}
                        />
                        <Label htmlFor="compare-switch">Comparar</Label>
                      </div>
                    </div>
                  )}
                  {activeChart === "pie" && (
                    <Popover open={piePopoverOpen} onOpenChange={setPiePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full sm:w-[200px] justify-between"
                          disabled={isForecastView}
                        >
                          Selecionar Meses
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar mês..." />
                          <CommandEmpty>Nenhum mês.</CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {availableMonths.map((month) => (
                                <CommandItem
                                  key={month.value}
                                  onSelect={() => {
                                    setPieSelectedMonths((current) => {
                                      const newSelection = new Set(current);
                                      if (newSelection.has(month.value)) {
                                        newSelection.delete(month.value);
                                      } else if (newSelection.size < 3) {
                                        newSelection.add(month.value);
                                      } else {
                                        toast.warning(
                                          "Você pode comparar no máximo 3 meses."
                                        );
                                      }
                                      return Array.from(newSelection);
                                    });
                                    setPiePopoverOpen(true);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      pieSelectedMonths.includes(month.value)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {month.label}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              {activeChart === "line" && isComparing && (
                <div className="flex gap-2 mt-4 justify-end">
                  <Select value={compareMonth} onValueChange={setCompareMonth} disabled={isForecastView}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={compareYear} onValueChange={setCompareYear} disabled={isForecastView}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Ano" />
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
              )}
            </CardHeader>
            <CardContent className="w-full aspect-video lg:h-96 lg:aspect-auto">
              {isForecastView ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Análise gráfica ainda não disponível para o modo de previsão.
                </div>
              ) : activeChart === "line" ? (
                loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                        formatter={(v: number) => `R$${v.toFixed(2)}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="currentMonth"
                        name={`${
                          months.find((m) => m.value === selectedMonth)?.label
                        } ${selectedYear}`}
                        stroke="hsl(var(--success))"
                      />
                      {isComparing && (
                        <Line
                          type="monotone"
                          dataKey="comparisonMonth"
                          name={`${
                            months.find((m) => m.value === compareMonth)?.label
                          } ${compareYear}`}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="5 5"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )
              ) : loadingPie ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pieChartData &&
                      Object.entries(pieChartData).map(([month, data]) => (
                        <div
                          key={month}
                          className="flex flex-col items-center min-h-[300px]"
                        >
                          <h3 className="font-semibold mb-2">
                            {
                              availableMonths.find((m) => m.value === month)
                                ?.label
                            }
                          </h3>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data[pieChartDataType]}
                                dataKey="total"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={(entry) =>
                                  `${(entry.percent * 100).toFixed(0)}%`
                                }
                              >
                                {(data[pieChartDataType] || []).map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) =>
                                  `R$ ${value.toFixed(2)}`
                                }
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ))}
                  </div>
                  <ToggleGroup
                    type="single"
                    value={pieChartDataType}
                    onValueChange={(v: "expenses" | "incomes") =>
                      v && setPieChartDataType(v)
                    }
                    className="mt-4 justify-center"
                    disabled={isForecastView}
                  >
                    <ToggleGroupItem value="expenses">Despesas</ToggleGroupItem>
                    <ToggleGroupItem value="incomes">Receitas</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5" />
                  Top Categorias de Despesa
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Select
                    value={categoriesMonth}
                    onValueChange={setCategoriesMonth}
                    disabled={isForecastView}
                  >
                    <SelectTrigger className="w-32">
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
                  <Select
                    value={categoriesYear}
                    onValueChange={setCategoriesYear}
                    disabled={isForecastView}
                  >
                    <SelectTrigger className="w-20">
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
            <CardContent className="space-y-4">
              {isForecastView ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-8">
                     Top Categorias ainda não disponível para o modo de previsão.
                  </div>
              ) : loadingCategories ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                    >
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-5 w-1/4" />
                    </div>
                  ))
                ) : topCategoriesWithPercentage.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `hsl(${
                              200 + index * 40
                            }, 76%, ${40 + index * 10}%)`,
                          }}
                        />
                        <span className="text-sm font-medium text-card-foreground">
                          {category.name || "Sem Categoria"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-card-foreground">
                          R${" "}
                          {category.total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;