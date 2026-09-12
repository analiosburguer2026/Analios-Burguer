import type { Category, Product, StoreSettings, WhatsAppTemplate } from "../types";

export const seedCategories: Category[] = [
  { id: "cat-burgers", name: "Burguers", order: 1 },
  { id: "cat-porcoes", name: "Porções", order: 2 },
  { id: "cat-bebidas", name: "Bebidas", order: 3 },
  { id: "cat-sobremesas", name: "Sobremesas", order: 4 },
  { id: "cat-combos", name: "Combos", order: 5 },
];

const now = new Date().toISOString();

export const seedProducts: Product[] = [
  {
    id: "prod-classico",
    name: "Analio's Clássico",
    description: "Pão brioche, blend 160g, queijo cheddar, alface, tomate e molho especial da casa.",
    categoryId: "cat-burgers",
    basePrice: 28.9,
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-bacon",
    name: "Analio's Bacon",
    description: "Pão brioche, blend 160g, cheddar duplo, bacon crocante e cebola caramelizada.",
    categoryId: "cat-burgers",
    basePrice: 32.9,
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-picanha",
    name: "Analio's Picanha",
    description: "Pão brioche, blend de picanha 180g, queijo prato, cebola roxa e maionese trufada.",
    categoryId: "cat-burgers",
    basePrice: 39.9,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-veggie",
    name: "Analio's Veggie",
    description: "Pão brioche, hambúrguer de grão de bico, queijo, rúcula e tomate seco.",
    categoryId: "cat-burgers",
    basePrice: 29.9,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-batata",
    name: "Batata Frita",
    description: "Porção de batatas fritas crocantes temperadas com sal da casa.",
    categoryId: "cat-porcoes",
    basePrice: 18.9,
    active: true,
    sizes: [
      { id: "size-p", label: "Pequena", price: 18.9 },
      { id: "size-g", label: "Grande", price: 28.9 },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-onion",
    name: "Onion Rings",
    description: "Anéis de cebola empanados e crocantes, acompanha molho barbecue.",
    categoryId: "cat-porcoes",
    basePrice: 22.9,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-refri",
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Fanta - 350ml.",
    categoryId: "cat-bebidas",
    basePrice: 7.0,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-suco",
    name: "Suco Natural",
    description: "Suco natural da fruta do dia - 400ml.",
    categoryId: "cat-bebidas",
    basePrice: 9.9,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-brownie",
    name: "Brownie com Sorvete",
    description: "Brownie de chocolate quente com bola de sorvete de creme.",
    categoryId: "cat-sobremesas",
    basePrice: 16.9,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod-combo-classico",
    name: "Combo Clássico",
    description: "Analio's Clássico + Batata Pequena + Refrigerante Lata.",
    categoryId: "cat-combos",
    basePrice: 44.9,
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const seedSettings: StoreSettings = {
  storeName: "Analio's Burguer",
  whatsappNumber: "5599999999999",
  address: "Rua Principal, 123 - Centro",
  deliveryFee: 6.0,
  freeDeliveryAbove: 60,
  serviceMode: "both",
  openingHours: "Ter a Dom - 18h às 23h30",
  loyalty: {
    enabled: true,
    pointsPerCurrency: 1,
    currencyPerPoint: 0.05,
    minPointsToRedeem: 50,
  },
};

export const seedWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: "tpl-boasvindas",
    name: "Boas-vindas",
    message:
      "Olá {{nome}}! 🍔 Bem-vindo(a) à Analio's Burguer! Aproveite e confira nosso cardápio, temos promoções especiais essa semana.",
    createdAt: now,
  },
  {
    id: "tpl-promocao",
    name: "Aviso de Promoção",
    message:
      "Oi {{nome}}! 🔥 Temos uma promoção imperdível hoje na Analio's Burguer. Faça já seu pedido e aproveite!",
    createdAt: now,
  },
  {
    id: "tpl-pontos",
    name: "Lembrete de Pontos",
    message:
      "Olá {{nome}}! Você já tem {{pontos}} pontos de fidelidade na Analio's Burguer. Que tal trocar por um desconto no seu próximo pedido? 🎉",
    createdAt: now,
  },
  {
    id: "tpl-pedido-confirmado",
    name: "Pedido Confirmado",
    message:
      "Oi {{nome}}, seu pedido na Analio's Burguer foi confirmado e já está sendo preparado! 🍟🍔 Em breve chega até você.",
    createdAt: now,
  },
];
