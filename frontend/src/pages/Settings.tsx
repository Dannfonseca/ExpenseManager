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
import { Plus, Edit, Trash2, Palette, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
  color?: string;
}

interface PaymentType {
  _id: string;
  name: string;
}

const Settings = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#4ECDC4");
  const [newPaymentTypeName, setNewPaymentTypeName] = useState("");

  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");

  const [isPaymentTypeEditDialogOpen, setIsPaymentTypeEditDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [editPaymentTypeName, setEditPaymentTypeName] = useState("");

  const getToken = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) throw new Error("Usuário não autenticado.");
    return JSON.parse(userInfoString).token;
  }

  const fetchCategories = async () => {
    try {
      const token = getToken();
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

  const fetchPaymentTypes = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/payment-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao buscar tipos de pagamento");
      const data = await response.json();
      setPaymentTypes(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPaymentTypes();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode ser vazio.");
      return;
    }
    try {
      const token = getToken();
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

  const handleAddPaymentType = async () => {
    if (!newPaymentTypeName.trim()) {
      toast.error("O nome do tipo de pagamento não pode ser vazio.");
      return;
    }
    try {
      const token = getToken();
      const response = await fetch("/api/payment-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newPaymentTypeName }),
      });
      if (!response.ok) throw new Error("Falha ao adicionar tipo de pagamento.");
      toast.success("Tipo de pagamento adicionado com sucesso!");
      setNewPaymentTypeName("");
      fetchPaymentTypes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color || "#000000");
    setIsCategoryEditDialogOpen(true);
  }

  const handleEditPaymentTypeClick = (pt: PaymentType) => {
    setEditingPaymentType(pt);
    setEditPaymentTypeName(pt.name);
    setIsPaymentTypeEditDialogOpen(true);
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
        const token = getToken();
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
        setIsCategoryEditDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
    } catch (error: any) {
        toast.error(error.message);
    }
  };
  
  const handleUpdatePaymentType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentType) return;
    try {
        const token = getToken();
        const response = await fetch(`/api/payment-types/${editingPaymentType._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: editPaymentTypeName }),
        });

        if (!response.ok) {
            throw new Error("Falha ao atualizar o tipo de pagamento.");
        }
        toast.success("Tipo de pagamento atualizado com sucesso!");
        setIsPaymentTypeEditDialogOpen(false);
        setEditingPaymentType(null);
        fetchPaymentTypes();
    } catch (error: any) {
        toast.error(error.message);
    }
  };


  const handleDeleteCategory = async (id: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao remover categoria.");
      toast.success("Categoria removida com sucesso!");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeletePaymentType = async (id: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/payment-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao remover tipo de pagamento.");
      toast.success("Tipo de pagamento removido com sucesso!");
      fetchPaymentTypes();
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
            <CardTitle className="text-card-foreground flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Categorias de Despesa
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Nova categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Input type="color" value={newCategoryColor} onChange={e => setNewCategoryColor(e.target.value)} className="w-12 h-10 p-1" />
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
            </div>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category._id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color || "#ccc" }} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCategoryClick(category)}><Edit className="h-3 w-3" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Todas as despesas associadas a esta categoria também serão removidas.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(category._id)}>Continuar</AlertDialogAction></AlertDialogFooter>
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
            <CardTitle className="text-card-foreground flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Tipos de Pagamento
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Novo tipo de pagamento..."
                  value={newPaymentTypeName}
                  onChange={(e) => setNewPaymentTypeName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddPaymentType}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
            </div>
            <div className="space-y-2">
              {paymentTypes.map((pt) => (
                <div key={pt._id} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="font-medium">{pt.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPaymentTypeClick(pt)}><Edit className="h-3 w-3" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. As transações associadas perderão este tipo de pagamento.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePaymentType(pt._id)}>Continuar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCategoryEditDialogOpen} onOpenChange={setIsCategoryEditDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Categoria</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateCategory}>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label htmlFor="edit-category-name">Nome</Label><Input id="edit-category-name" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} /></div>
                    <div className="grid gap-2">
                      <Label>Cor</Label>
                      <div className="flex items-center gap-2">
                        <Input id="edit-category-color" type="color" value={editCategoryColor} onChange={(e) => setEditCategoryColor(e.target.value)} className="w-12 h-10 p-1" />
                        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: editCategoryColor }} />
                        <span className="text-sm text-muted-foreground">{editCategoryColor.toUpperCase()}</span>
                      </div>
                    </div>
                </div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPaymentTypeEditDialogOpen} onOpenChange={setIsPaymentTypeEditDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Tipo de Pagamento</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdatePaymentType}>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label htmlFor="edit-pt-name">Nome</Label><Input id="edit-pt-name" value={editPaymentTypeName} onChange={(e) => setEditPaymentTypeName(e.target.value)} /></div>
                </div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;