/*
 * Adicionado um diálogo de confirmação para a exclusão de categorias.
 * - Utiliza o componente AlertDialog para alertar o usuário sobre a perda de dados.
 * - Adicionado espaçamento no topo para corrigir sobreposição do título no modo mobile.
 * - Implementada a funcionalidade completa de edição de categorias.
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
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
import { Plus, Edit, Trash2, Palette, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
  color?: string;
}

const colors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#F7B801", "#f94144",
  "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#43aa8b", "#577590"
];


const Settings = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(colors[0]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");


  const fetchCategories = async () => {
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);
      const response = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao buscar categorias");
      const data = await response.json();
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode ser vazio.");
      return;
    }
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      });
      if (!response.ok) throw new Error("Falha ao adicionar categoria.");
      toast.success("Categoria adicionada com sucesso!");
      setNewCategoryName("");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color || colors[0]);
    setIsEditDialogOpen(true);
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) throw new Error("Usuário não autenticado.");
        const { token } = JSON.parse(userInfoString);

        const response = await fetch(`/api/categories/${editingCategory._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: editCategoryName, color: editCategoryColor }),
        });

        if (!response.ok) {
            throw new Error("Falha ao atualizar a categoria.");
        }
        toast.success("Categoria atualizada com sucesso!");
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
    } catch (error: any) {
        toast.error(error.message);
    }
  };


  const handleDeleteCategory = async (id: string) => {
    try {
      const userInfoString = localStorage.getItem("userInfo");
      if (!userInfoString) throw new Error("Usuário não autenticado.");
      const { token } = JSON.parse(userInfoString);
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Falha ao remover categoria.");
      toast.success("Categoria removida com sucesso!");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 pt-16 sm:pt-6 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-card-foreground">
                  Avisos de Meta
                </div>
                <div className="text-sm text-muted-foreground">
                  Receber alertas quando se aproximar da meta
                </div>
              </div>
              <Button variant="outline" size="sm">
                Ativo
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-card-foreground">
                  Resumo Mensal
                </div>
                <div className="text-sm text-muted-foreground">
                  Relatório no final de cada mês
                </div>
              </div>
              <Button variant="outline" size="sm">
                Ativo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Categorias
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Nova categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleAddCategory}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || "#ccc" }}
                    />
                    <span className="font-medium text-card-foreground">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(category)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Você tem certeza absoluta?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Todas as despesas
                            associadas a esta categoria serão permanentemente
                            excluídas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            Continuar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Exportar Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Baixar relatórios dos seus gastos</Label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Exportar CSV
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Sobre o App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium text-card-foreground">
                  1.0.0
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Última atualização
                </span>
                <span className="font-medium text-card-foreground">
                  Dezembro 2024
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Verificar atualizações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            {editingCategory && (
                <form onSubmit={handleUpdateCategory}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category-name">Nome da Categoria</Label>
                            <Input id="edit-category-name" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Cor</Label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(color => (
                                    <button
                                        type="button"
                                        key={color}
                                        className="w-8 h-8 rounded-full border-2"
                                        style={{ backgroundColor: color, borderColor: editCategoryColor === color ? 'hsl(var(--primary))' : 'transparent' }}
                                        onClick={() => setEditCategoryColor(color)}
                                    />
                                ))}
                            </div>
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

export default Settings;