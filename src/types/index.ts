// Tipos centrais do sistema de gestão da Analio's Burguer

export type ID = string;

export interface Category {
  id: ID;
  name: string;
  order: number;
}

export interface ProductSizeOption {
  id: ID;
  label: string; // ex: "Único", "300g", "500g"
  price: number;
}

export interface ProductAddon {
  id: ID;
  name: string;
  price: number;
  kind?: "addon" | "removal";
}

export interface Product {
  id: ID;
  name: string;
  description: string;
  categoryId: ID;
  imageUrl?: string; // base64 ou url
  basePrice: number;
  sizes?: ProductSizeOption[]; // opcional, se tiver variação de tamanho/preço
  addons?: ProductAddon[];
  active: boolean;
  featured?: boolean;
  costPrice?: number; // custo de produção, para margem
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: ID;
  name: string;
  unit: string;
  quantity: number;
  minimumQuantity: number;
  costPerUnit: number;
  active: boolean;
  updatedAt: string;
}

export interface InventoryMovement {
  id: ID;
  itemId: ID;
  type: "entry" | "exit" | "adjustment";
  quantity: number;
  reason: string;
  createdAt: string;
}

export type PromotionType = "percentage" | "fixed" | "combo";

export interface Promotion {
  id: ID;
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number; // percentual (0-100) ou valor fixo em R$
  productIds: ID[]; // produtos aos quais a promoção se aplica (vazio = todos)
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface Address {
  postalCode?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  reference?: string;
}

export interface LoyaltyTransaction {
  id: ID;
  customerId: ID;
  type: "earn" | "redeem" | "adjustment";
  points: number; // positivo para ganho, negativo para resgate
  description: string;
  orderId?: ID;
  createdAt: string;
}

export interface Customer {
  id: ID;
  name: string;
  phone: string; // whatsapp
  email?: string;
  birthDate?: string;
  address?: Address;
  loyaltyPoints: number;
  totalSpent: number;
  ordersCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MotoboyStatus = "available" | "delivering" | "offline";

export interface Motoboy {
  id: ID;
  name: string;
  phone: string;
  vehiclePlate?: string;
  status: MotoboyStatus;
  active: boolean;
  deliveriesCount: number;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderType = "delivery" | "pickup" | "local";

export type PaymentMethod = "cash" | "credit" | "debit" | "pix";
export type PaymentStatus = "pending" | "approved" | "in_process" | "rejected" | "cancelled" | "refunded";

export interface OrderItem {
  id: ID;
  productId: ID;
  productName: string;
  sizeLabel?: string;
  quantity: number;
  unitPrice: number;
  addons?: ProductAddon[];
  notes?: string;
}

export interface Order {
  id: ID;
  code: string; // número/código amigável do pedido
  customerId?: ID;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  type: OrderType;
  tableId?: ID;
  tableNumber?: number;
  address?: Address;
  motoboyId?: ID;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  promotionId?: ID;
  pointsEarned: number;
  pointsRedeemed: number;
  notes?: string;
  trackingNote?: string;
  trackingLatitude?: number;
  trackingLongitude?: number;
  trackingUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TableStatus = "free" | "occupied" | "reserved";

export interface StoreTable {
  id: ID;
  number: number;
  status: TableStatus;
  customerName?: string;
  openedAt?: string;
  notes?: string;
}

export type CashEntryType = "sale" | "withdrawal" | "deposit" | "adjustment";

export interface CashEntry {
  id: ID;
  type: CashEntryType;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerCurrency: number; // pontos ganhos por R$1 gasto
  currencyPerPoint: number; // valor em R$ de cada ponto ao resgatar
  minPointsToRedeem: number;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // número da loja, formato internacional (ex: 5599999999999)
  address: string;
  deliveryFee: number;
  freeDeliveryAbove?: number;
  serviceMode: "delivery" | "pickup" | "both";
  announcementText?: string;
  announcementTone?: "red" | "orange";
  darkMode?: boolean;
  notificationSoundUrl?: string;
  openingHours: string;
  loyalty: LoyaltySettings;
}

export interface WhatsAppTemplate {
  id: ID;
  name: string;
  message: string; // pode conter {{nome}}, {{pontos}}, {{loja}}
  createdAt: string;
}

export interface WhatsAppLogEntry {
  id: ID;
  customerId: ID;
  customerName: string;
  templateId?: ID;
  message: string;
  createdAt: string;
}
