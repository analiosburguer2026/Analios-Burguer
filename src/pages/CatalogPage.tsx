import { useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Power, Image as ImageIcon, Upload, X } from "lucide-react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Select, Textarea } from "../components/ui/Form";
import { useCatalogStore } from "../store/catalogStore";
import { formatCurrency } from "../lib/utils";
import type { Product, ProductAddon } from "../types";

const emptyForm = {
  name: "",
  description: "",
  categoryId: "",
  basePrice: "",
  costPrice: "",
  imageUrl: "",
  active: true,
  featured: false,
  addonsEnabled: false,
  addonsText: "",
};

type AddonRow = { name: string; price: string; kind: "addon" | "removal" };

export function CatalogPage() {
  const { categories, products, addProduct, updateProduct, removeProduct, toggleProductActive, addCategory, updateCategory, removeCategory } =
    useCatalogStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [addonRows, setAddonRows] = useState<AddonRow[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function openNewProduct() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setAddonRows([]);
    setModalOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      basePrice: String(product.basePrice),
      costPrice: product.costPrice !== undefined ? String(product.costPrice) : "",
      imageUrl: product.imageUrl ?? "",
      active: product.active,
      featured: !!product.featured,
      addonsEnabled: Boolean(product.addons?.length),
      addonsText: (product.addons ?? []).map((addon) => `${addon.name}|${addon.price}`).join("\n"),
    });
    setAddonRows((product.addons ?? []).map((addon) => ({ name: addon.name, price: String(addon.price), kind: addon.kind ?? "addon" })));
    setModalOpen(true);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido.");
      e.target.value = "";
      return;
    }

    // Reduz a imagem antes de salvar no localStorage para evitar exceder o limite do navegador.
    const image = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      image.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        setForm((f) => ({
          ...f,
          imageUrl: canvas.toDataURL("image/jpeg", 0.82),
        }));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      basePrice: Number(form.basePrice) || 0,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      imageUrl: form.imageUrl || undefined,
      active: form.active,
      featured: form.featured,
      addons: form.addonsEnabled
        ? addonRows.filter((row) => row.name.trim()).map((row, index): ProductAddon => ({
            id: `addon-${index}-${row.name.trim()}`,
            name: row.name.trim(),
            price: row.kind === "removal" ? 0 : Number(row.price.replace(",", ".")) || 0,
            kind: row.kind,
          }))
        : [],
    };

    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      addProduct(payload);
    }
    setModalOpen(false);
  }

  function categoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "Sem categoria";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-black">Catálogo</h1>
          <p className="text-sm text-black/50">
            Gerencie produtos, categorias e ajuste de preços do cardápio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            <Plus size={16} /> Nova Categoria
          </Button>
          <Button onClick={openNewProduct}>
            <Plus size={16} /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="max-w-[200px]"
        >
          <option value="all">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="h-36 w-full bg-brand-cream/40 flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="text-brand-orange/40" size={36} />
              )}
            </div>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-brand-black leading-tight">{product.name}</p>
                  <p className="text-xs text-black/40">{categoryName(product.categoryId)}</p>
                </div>
                <Badge tone={product.active ? "success" : "neutral"}>
                  {product.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-xs text-black/50 line-clamp-2">{product.description}</p>
              <p className="font-display text-lg text-brand-orange">
                {formatCurrency(product.basePrice)}
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEditProduct(product)}>
                  <Pencil size={14} /> Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleProductActive(product.id)}>
                  <Power size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Remover "${product.name}" do catálogo?`)) {
                      removeProduct(product.id);
                    }
                  }}
                >
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <p className="col-span-full text-center text-sm text-black/40 py-10">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Produto" : "Novo Produto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome do produto">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <Select
                required
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Preço de venda (R$)" hint="Ajuste o preço quando quiser">
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Custo de produção (R$) - opcional" hint="Usado para calcular sua margem de lucro">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
            />
          </Field>
          <Field
            label="Foto do produto"
            hint="Importe JPG, PNG ou WEBP. A imagem será reduzida e salva localmente neste navegador."
          >
            <input
              ref={imageInputRef}
              id="product-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="sr-only"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload size={16} /> Importar imagem
              </Button>
              {form.imageUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  aria-label="Remover imagem"
                >
                  <X size={16} /> Remover
                </Button>
              )}
            </div>
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Pré-visualização do produto"
                className="mt-3 h-32 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mt-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-brand-orange/30 bg-brand-cream/20 text-sm text-black/40">
                Nenhuma imagem importada
              </div>
            )}
          </Field>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Ativo no cardápio
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Destaque
            </label>
          </div>
          <Field label="Adicionais" hint="Cadastre cada opção na tabela. Use 'Retirar ingrediente' para remoções sem custo.">
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.addonsEnabled} onChange={(e) => setForm((f) => ({ ...f, addonsEnabled: e.target.checked }))} />
              Este produto aceita adicionais
            </label>
            {form.addonsEnabled && <div className="overflow-hidden rounded-lg border border-black/10">
              <div className="grid grid-cols-[1fr_130px_90px] bg-brand-black px-3 py-2 text-xs font-bold text-white"><span>Nome do item</span><span>Valor do adicional</span><span>Tipo</span></div>
              {addonRows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_130px_90px] items-center gap-2 border-t border-black/10 p-2">
                <Input placeholder="Ex.: Bacon extra" value={row.name} onChange={(e) => setAddonRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} />
                <Input type="number" min="0" step="0.01" placeholder="R$ 0,00" disabled={row.kind === "removal"} value={row.price} onChange={(e) => setAddonRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item))} />
                <Select value={row.kind} onChange={(e) => setAddonRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, kind: e.target.value as AddonRow["kind"] } : item))}><option value="addon">Adicionar</option><option value="removal">Retirar</option></Select>
              </div>)}
              <button type="button" className="w-full border-t border-black/10 px-3 py-2 text-left text-sm font-semibold text-brand-orange" onClick={() => setAddonRows((rows) => [...rows, { name: "", price: "0", kind: "addon" }])}>+ Adicionar linha</button>
            </div>}
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? "Salvar alterações" : "Adicionar produto"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={categoryModalOpen}
        onClose={() => { setCategoryModalOpen(false); setEditingCategoryId(null); }}
        title="Gerenciar categorias"
      >
        <div className="mb-5 space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2 rounded-lg border border-black/5 px-3 py-2">
              {editingCategoryId === category.id ? (
                <input
                  autoFocus
                  defaultValue={category.name}
                  className="min-w-0 flex-1 rounded border border-brand-orange px-2 py-1 text-sm"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const value = event.currentTarget.value.trim();
                      if (value) updateCategory(category.id, value);
                      setEditingCategoryId(null);
                    }
                    if (event.key === "Escape") setEditingCategoryId(null);
                  }}
                />
              ) : (
                <span className="min-w-0 flex-1 text-sm font-medium">{category.name}</span>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingCategoryId(category.id)}>
                <Pencil size={14} /> Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Remover a categoria "${category.name}"? Os produtos não serão excluídos.`)) {
                    removeCategory(category.id);
                  }
                }}
              >
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newCategoryName.trim()) {
              addCategory(newCategoryName.trim());
              setNewCategoryName("");
            }
          }}
          className="space-y-4"
        >
          <Field label="Nome da categoria">
            <Input
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Sanduíches, Sobremesas..."
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar categoria</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
