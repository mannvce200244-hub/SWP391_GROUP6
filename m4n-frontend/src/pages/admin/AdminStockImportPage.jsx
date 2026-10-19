import { useState, useCallback } from 'react'
import { getInventory, importStock } from '../../services/inventoryService.js'
import useToast from '../../components/ui/useToast.js'
import { PackagePlus, Search, CircleCheck } from 'lucide-react'

export default function AdminStockImportPage() {
  const { addToast } = useToast()

  // Product search
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Selected product for import
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [importing, setImporting] = useState(false)
  const [lastImport, setLastImport] = useState(null)

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    setSearching(true)
    setHasSearched(true)
    try {
      const res = await getInventory({ page: 0, size: 20, keyword: q })
      setSearchResults(res?.content || (Array.isArray(res) ? res : []))
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [searchInput])

  const handleImport = async () => {
    if (!selectedProduct) return
    const qty = parseInt(quantity, 10)
    if (!qty || qty <= 0) {
      addToast({ message: 'Số lượng nhập phải lớn hơn 0.', type: 'error' })
      return
    }
    setImporting(true)
    try {
      const result = await importStock(selectedProduct.productId, { quantity: qty, notes: notes.trim() })
      setLastImport({
        productName: selectedProduct.productName,
        productCode: selectedProduct.productCode,
        quantityAdded: qty,
        newQuantity: result?.newQuantity ?? (selectedProduct.quantity + qty),
      })
      addToast({ message: `Đã nhập ${qty} sản phẩm vào kho thành công.`, type: 'success' })
      setSelectedProduct(null)
      setQuantity('')
      setNotes('')
    } catch (err) {
      addToast({ message: err.message || 'Nhập kho thất bại.', type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-[#17191B]">Nhập kho</h2>
        <p className="text-sm text-secondary mt-0.5">Tìm sản phẩm và nhập thêm số lượng vào kho</p>
      </div>

      {/* Success banner */}
      {lastImport && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CircleCheck size={18} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-emerald-800">Nhập kho thành công</p>
            <p className="text-emerald-700 mt-0.5">
              Đã nhập <strong>{lastImport.quantityAdded}</strong> sản phẩm &quot;{lastImport.productName}&quot; ({lastImport.productCode}).
              Tồn kho mới: <strong>{lastImport.newQuantity}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastImport(null)}
            className="ml-auto text-emerald-400 hover:text-emerald-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 1: Search product */}
      {!selectedProduct && (
        <div className="bg-white rounded-xl border border-[#E3E6E8] p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-semibold text-[#17191B]">Bước 1: Chọn sản phẩm</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên hoặc mã sản phẩm…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchInput.trim()}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#17191B] text-white hover:bg-[#2C3033] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {searching ? 'Đang tìm…' : 'Tìm kiếm'}
            </button>
          </form>

          {hasSearched && !searching && searchResults.length === 0 && (
            <p className="text-sm text-secondary py-4 text-center">Không tìm thấy sản phẩm phù hợp.</p>
          )}

          {searchResults.length > 0 && (
            <div className="border border-[#E3E6E8] rounded-lg overflow-hidden">
              {searchResults.map((item) => (
                <button
                  key={item.productId}
                  type="button"
                  onClick={() => { setSelectedProduct(item); setSearchResults([]) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-[#F6F7F8] border-b border-[#F2F4F5] last:border-b-0 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-[#17191B]">{item.productName}</p>
                    <p className="text-xs text-secondary font-mono">{item.productCode}</p>
                  </div>
                  <span className="text-xs text-secondary">Tồn: {item.quantity}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Import quantity */}
      {selectedProduct && (
        <div className="bg-white rounded-xl border border-[#E3E6E8] p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-semibold text-[#17191B]">Bước 2: Nhập số lượng</h3>
          <div className="p-3 rounded-lg bg-[#F6F7F8] border border-[#E3E6E8]">
            <p className="text-sm font-medium text-[#17191B]">{selectedProduct.productName}</p>
            <p className="text-xs text-secondary font-mono">{selectedProduct.productCode}</p>
            <p className="text-xs text-secondary mt-1">Tồn kho hiện tại: <strong>{selectedProduct.quantity}</strong></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#17191B] mb-1">Số lượng nhập thêm</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="VD: 10"
              className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#17191B] mb-1">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Nhập lô mới từ xưởng Đào Xá…"
              className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-[#E3E6E8] text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
            >
              Chọn sản phẩm khác
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !quantity}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#A62F25] text-white hover:bg-[#84231D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <PackagePlus size={15} />
              {importing ? 'Đang nhập…' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
