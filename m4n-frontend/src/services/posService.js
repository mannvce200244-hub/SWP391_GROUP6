import apiClient from '../api/apiClient.js'

export async function searchProducts(keyword = '') {
  const query = keyword ? `?q=${encodeURIComponent(keyword.trim())}` : ''
  return apiClient.get(`/pos/products/search${query}`)
}

export async function lookupBarcode(codeOrBarcode) {
  if (!codeOrBarcode || !codeOrBarcode.trim()) {
    throw new Error('Mã barcode hoặc mã sản phẩm không được để trống')
  }
  return apiClient.get(`/pos/products/barcode/${encodeURIComponent(codeOrBarcode.trim())}`)
}

export async function previewSale({ items, voucherCode = '' }) {
  return apiClient.post('/pos/checkout/preview', {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    })),
    voucherCode: voucherCode ? voucherCode.trim() : null,
  })
}

export async function finalizeSale({
  items,
  voucherCode = '',
  paymentMethod = 'CASH',
  amountReceived = null,
  customerName = '',
  customerPhone = '',
  notes = '',
}) {
  return apiClient.post('/pos/sales', {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    })),
    voucherCode: voucherCode ? voucherCode.trim() : null,
    paymentMethod,
    amountReceived: amountReceived !== null ? Number(amountReceived) : null,
    customerName: customerName ? customerName.trim() : null,
    customerPhone: customerPhone ? customerPhone.trim() : null,
    notes: notes ? notes.trim() : null,
  })
}

export async function getInvoice(id) {
  return apiClient.get(`/pos/invoices/${encodeURIComponent(id)}`)
}

export function getInvoicePdfUrl(id) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
  return `${baseUrl}/pos/invoices/${encodeURIComponent(id)}/pdf`
}

export default {
  searchProducts,
  lookupBarcode,
  previewSale,
  finalizeSale,
  getInvoice,
  getInvoicePdfUrl,
}
