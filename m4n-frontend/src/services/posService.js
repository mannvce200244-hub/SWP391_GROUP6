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

export async function downloadInvoicePdf(id) {
  const blob = await apiClient.getBlob(`/pos/invoices/${encodeURIComponent(id)}/pdf`)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Invoice-${id}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export async function listInvoices({ page = 0, size = 15, search = '' } = {}) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('size', size)
  if (search && search.trim()) {
    params.append('search', search.trim())
  }
  return apiClient.get(`/pos/invoices?${params.toString()}`)
}

export default {
  searchProducts,
  lookupBarcode,
  previewSale,
  finalizeSale,
  getInvoice,
  downloadInvoicePdf,
  listInvoices,
}
