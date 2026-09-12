export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

/** Remove tudo que não for dígito de um telefone. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Monta um link wa.me pronto para abrir o WhatsApp Web/App
 * com o número e a mensagem já preenchidos.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = onlyDigits(phone);
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${withCountryCode}?text=${encodedMessage}`;
}

/** Substitui variáveis {{nome}}, {{pontos}}, {{loja}} em um template de mensagem. */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

export function generateOrderCode(sequence: number): string {
  return `#${String(sequence).padStart(4, "0")}`;
}
