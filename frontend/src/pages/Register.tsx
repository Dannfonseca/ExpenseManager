import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Github, Chrome } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/expense-hero.jpg";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Necessário para o backend definir o cookie
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao registrar");
      }

      toast.success("Registro realizado com sucesso!");
      navigate("/"); // Apenas navega
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
              Comece a organizar sua vida financeira hoje mesmo.
            </p>
          </div>
          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Criar Conta
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
            Já possui uma conta?{" "}
            <Link to="/login" className="underline">
              Login
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src={heroImage}
          alt="Imagem ilustrativa de planejamento financeiro"
          className="h-screen w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default Register;