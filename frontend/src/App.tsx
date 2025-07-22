import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import DeveloperLogs from "./pages/DeveloperLogs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/Users";
import RecurringTransactions from "./pages/RecurringTransactions";
import Guide from "./pages/Guide";
import AddTransactionsSheet from "./pages/AddTransactionsSheet";
import Calculator from "./pages/Calculator"; // Nova página

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/add-transaction" element={<AddTransaction />} />
              <Route path="/add-transactions-sheet" element={<AddTransactionsSheet />} />
              <Route path="/recurring" element={<RecurringTransactions />} />
              <Route path="/calculator" element={<Calculator />} /> {/* Nova rota */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/dev-logs" element={<DeveloperLogs />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;