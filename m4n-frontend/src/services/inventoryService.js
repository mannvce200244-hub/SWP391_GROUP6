import apiClient from '../api/apiClient.js'

export async function getInventory({ page = 0, size = 10, keyword = '', status = '' } = {}) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('size', size)
  if (keyword && keyword.trim()) {
    params.append('keyword', keyword.trim())
  }
  if (status && status !== 'ALL') {
    params.append('status', status)
  }

  return apiClient.get(`/inventory?${params.toString()}`)
}

export async function importStock(productId, { quantity, unitCost, notes = '' }) {
  return apiClient.post(`/inventory/${encodeURIComponent(productId)}/import`, {
    quantity: Number(quantity),
    unitCost: Number(unitCost),
    notes,
  })
}

export async function getStockDocuments({ page = 0, size = 10, productId, type = '', status = '' } = {}) {
  const params = new URLSearchParams({ page, size })
  if (productId) params.set('productId', productId)
  if (type) params.set('type', type)
  if (status) params.set('status', status)
  return apiClient.get(`/inventory/documents?${params}`)
}

export async function confirmStockDocument(documentId, { rejectedQuantity = 0, rejectionReason = '' } = {}) {
  return apiClient.post(`/inventory/documents/${encodeURIComponent(documentId)}/confirm`, {
    rejectedQuantity,
    rejectionReason,
  })
}

export async function getInventoryMovements({ page = 0, size = 10, productId, type = '' } = {}) {
  const params = new URLSearchParams({ page, size })
  if (productId) params.set('productId', productId)
  if (type) params.set('type', type)
  return apiClient.get(`/inventory/movements?${params}`)
}

export async function exportStockReceipt(documentId, preview = false) {
  const previewWindow = preview ? window.open('', '_blank') : null
  if (preview && !previewWindow) throw new Error('Cho phép cửa sổ bật lên để xem/in, hoặc chọn Tải PDF.')
  if (previewWindow) previewWindow.opener = null
  try {
    const blob = await apiClient.getBlob(`/inventory/documents/${encodeURIComponent(documentId)}/pdf`, {
      headers: { Accept: 'application/pdf, application/json' },
    })
    const url = URL.createObjectURL(blob)
    if (previewWindow) previewWindow.location.href = url
    else {
      const link = document.createElement('a')
      link.href = url
      link.download = `Phieu-nhap-${documentId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (error) {
    previewWindow?.close()
    throw error
  }
}

export default {
  getInventory,
  importStock,
  getStockDocuments,
  confirmStockDocument,
  getInventoryMovements,
}
