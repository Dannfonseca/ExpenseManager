import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Github, Chrome } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/expense-hero.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      toast.error("Falha na autenticação com o provedor social.");
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Necessário para o backend definir o cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao fazer login");
      }

      // NÃO salva mais no localStorage
      toast.success("Login realizado com sucesso!");
      navigate("/"); // Apenas navega, o Layout vai buscar os dados
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold flex items-center justify-center">
              <Landmark className="h-8 w-8 mr-2 text-primary" />
              ExpenseManager
            </h1>
            <p className="text-sm text-muted-foreground">
              Controle suas finanças com facilidade.
            </p>
            <p className="text-balance text-muted-foreground mt-2">
              Acompanhe seus gastos, defina orçamentos e alcance seus objetivos
              financeiros com o ExpenseManager. Uma plataforma intuitiva para
              gerenciar seu dinheiro de forma eficiente.
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button" onClick={() => handleSocialLogin('google')}>
                    <Chrome className="mr-2 h-4 w-4" /> Google
                </Button>
                <Button variant="outline" type="button" onClick={() => handleSocialLogin('github')}>
                    <Github className="mr-2 h-4 w-4" /> GitHub
                </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link to="/register" className="underline">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src={heroImage}
          alt="Imagem ilustrativa de gerenciamento de finanças"
          className="h-screen w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default Login;