import { useState, useEffect, useCallback, useTransition } from 'react'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import adminProductService from '../../services/adminProductService.js'
import categoryService from '../../services/categoryService.js'
import artisanService from '../../services/artisanService.js'
import craftVillageService from '../../services/craftVillageService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import useToast from '../../components/ui/useToast.js'
import ProductFormModal from '../../components/admin/ProductFormModal.jsx'
import CategoryManagementModal from '../../components/admin/CategoryManagementModal.jsx'
import ArtisanManagementModal from '../../components/admin/ArtisanManagementModal.jsx'
import CraftVillageManagementModal from '../../components/admin/CraftVillageManagementModal.jsx'
import {
  Plus,
  Search,
  Package,
  CircleAlert,
  Layers,
  Landmark,
  UserRound,
  CircleCheck,
  X,
  Eye,
  Pencil,
  Mail,
  Send,
  Copy,
} from 'lucide-react'
import { IconInstrument } from '../../components/ui/Icons.jsx'

export default function AdminInstrumentsPage() {
  const { addToast } = useToast()
  const [, startTransition] = useTransition()

  // Master filters state
  const [categories, setCategories] = useState([])
  const [artisans, setArtisans] = useState([])
  const [craftVillages, setCraftVillages] = useState([])

  // Query state
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedArtisan, setSelectedArtisan] = useState('')
  const [selectedVillage, setSelectedVillage] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL') // ALL | ACTIVE | INACTIVE
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)

  // Products data state
  const [products, setProducts] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [masterDataError, setMasterDataError] = useState('')
  const [togglingProductId, setTogglingProductId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Bulk Restock Request Mode (Ý 2)
  const [restockMode, setRestockMode] = useState(false)
  const [selectedRestockItems, setSelectedRestockItems] = useState({})
  const [warehouseEmail, setWarehouseEmail] = useState('kho@m4n.vn')
  const [restockNote, setRestockNote] = useState('')
  const [sentEmailPreview, setSentEmailPreview] = useState(null)

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [artisanModalOpen, setArtisanModalOpen] = useState(false)
  const [villageModalOpen, setVillageModalOpen] = useState(false)

  // Load dropdown master data
  const loadMasterData = useCallback(async () => {
    try {
      const [cats, arts, vils] = await Promise.all([
        categoryService.getCategories(),
        artisanService.getAdminArtisans(),
        craftVillageService.getCraftVillages(),
      ])
      setCategories(cats || [])
      setArtisans(arts || [])
      setCraftVillages(vils || [])
      setMasterDataError('')
    } catch (err) {
      setMasterDataError(err.message || 'Không thể tải dữ liệu bộ lọc.')
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      categoryService.getCategories(),
      artisanService.getAdminArtisans(),
      craftVillageService.getCraftVillages(),
    ]).then(([cats, arts, vils]) => {
      if (active) {
        setCategories(cats || [])
        setArtisans(arts || [])
        setCraftVillages(vils || [])
      }
    }).catch((err) => { if (active) setMasterDataError(err.message || 'Không thể tải dữ liệu bộ lọc.') })
    return () => {
      active = false
    }
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch products from backend
  useEffect(() => {
    let active = true
    let isActiveFilter
    if (selectedStatus === 'ACTIVE') isActiveFilter = true
    else if (selectedStatus === 'INACTIVE') isActiveFilter = false

    Promise.resolve().then(() => {
      if (!active) return null
      setLoading(true)
      setError(null)
      return adminProductService.listProducts({
        keyword,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        artisanId: selectedArtisan ? Number(selectedArtisan) : undefined,
        craftVillageId: selectedVillage ? Number(selectedVillage) : undefined,
        isActive: isActiveFilter,
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      })
    })
      .then((response) => {
        if (active && response) {
          const content = response.content || []
          setProducts(content)
          setTotalElements(response.totalElements || 0)
          setTotalPages(Math.max(1, response.totalPages || 1))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải danh sách nhạc cụ')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [
    keyword,
    selectedCategory,
    selectedArtisan,
    selectedVillage,
    selectedStatus,
    page,
    pageSize,
    refreshKey,
  ])

  // Action handlers
  const handleOpenCreateProduct = () => {
    setEditingProductId(null)
    setProductModalOpen(true)
  }

  const handleOpenEditProduct = (productId) => {
    setEditingProductId(productId)
    setProductModalOpen(true)
  }

  const handleProductSaved = () => {
    setRefreshKey((k) => k + 1)
    loadMasterData()
  }

  const handleToggleStatus = async (product) => {
    if (togglingProductId !== null) return
    setTogglingProductId(product.id)
    const newStatus = !product.isActive
    try {
      await adminProductService.updateStatus(product.id, newStatus)
      addToast({
        message: newStatus
          ? `Đã kích hoạt kinh doanh "${product.name}".`
          : `Đã tạm ngừng kinh doanh "${product.name}".`,
        type: newStatus ? 'success' : 'info',
      })
      setRefreshKey((key) => key + 1)
    } catch (err) {
      addToast({
        message: err.message || 'Không thể thay đổi trạng thái sản phẩm',
        type: 'error',
      })
    } finally {
      setTogglingProductId(null)
    }
  }

  const handleResetFilters = () => {
    startTransition(() => {
      setSearchInput('')
      setKeyword('')
      setSelectedCategory('')
      setSelectedArtisan('')
      setSelectedVillage('')
      setSelectedStatus('ALL')
      setPage(0)
    })
  }

  // Bulk Restock Selection Handlers (Ý 2)
  const toggleRestockProduct = (product) => {
    setSelectedRestockItems((prev) => {
      const next = { ...prev }
      if (next[product.id]) {
        delete next[product.id]
      } else {
        next[product.id] = {
          id: product.id,
          code: product.code,
          name: product.name,
          currentStock: product.stockQuantity || 0,
          requestedQuantity: 10,
        }
      }
      return next
    })
  }

  const updateRestockQuantity = (product, value) => {
    const parsed = Math.max(1, Math.min(9999, Number(value) || 1))
    setSelectedRestockItems((prev) => ({
      ...prev,
      [product.id]: {
        id: product.id,
        code: product.code,
        name: product.name,
        currentStock: product.stockQuantity || 0,
        requestedQuantity: parsed,
      },
    }))
  }

  const toggleSelectAllCurrentPage = () => {
    const allSelectedOnPage =
      products.length > 0 && products.every((p) => Boolean(selectedRestockItems[p.id]))
    setSelectedRestockItems((prev) => {
      const next = { ...prev }
      if (allSelectedOnPage) {
        products.forEach((p) => {
          delete next[p.id]
        })
      } else {
        products.forEach((p) => {
          if (!next[p.id]) {
            next[p.id] = {
              id: p.id,
              code: p.code,
              name: p.name,
              currentStock: p.stockQuantity || 0,
              requestedQuantity: 10,
            }
          }
        })
      }
      return next
    })
  }

  const selectLowOrOutOfStockOnPage = () => {
    const lowOrEmpty = products.filter(
      (p) => (p.stockQuantity || 0) === 0 || p.availability === 'LOW_STOCK' || (p.stockQuantity || 0) <= 10
    )
    if (lowOrEmpty.length === 0) {
      addToast({ message: 'Trang hiện tại không có sản phẩm nào sắp hết hoặc hết hàng.', type: 'info' })
      return
    }
    setSelectedRestockItems((prev) => {
      const next = { ...prev }
      lowOrEmpty.forEach((p) => {
        if (!next[p.id]) {
          next[p.id] = {
            id: p.id,
            code: p.code,
            name: p.name,
            currentStock: p.stockQuantity || 0,
            requestedQuantity: 15,
          }
        }
      })
      return next
    })
    addToast({ message: `Đã tích chọn ${lowOrEmpty.length} sản phẩm cần bổ sung tồn kho.`, type: 'success' })
  }

  const handleSendRestockEmail = () => {
    const selectedList = Object.values(selectedRestockItems)
    if (selectedList.length === 0) {
      addToast({ message: 'Vui lòng tích chọn ít nhất 1 sản phẩm cần nhập thêm hàng.', type: 'error' })
      return
    }
    const emailTrimmed = warehouseEmail.trim()
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      addToast({ message: 'Vui lòng nhập địa chỉ email nhân viên kho hợp lệ.', type: 'error' })
      return
    }

    const totalQty = selectedList.reduce((sum, item) => sum + Number(item.requestedQuantity || 0), 0)
    const subject = `[M4N Kho] Yêu cầu nhập thêm hàng (${selectedList.length} mã nhạc cụ - Tổng ${totalQty} SP)`
    const lines = [
      'Kính gửi Bộ phận Kho / Cung ứng M4N,',
      '',
      'Hệ thống Quản trị M4N gửi yêu cầu nhập bổ sung tồn kho cho các nhạc cụ sau:',
      '',
      ...selectedList.map(
        (item, idx) =>
          `${idx + 1}. [${item.code}] ${item.name} — Tồn hiện tại: ${item.currentStock} | Số lượng yêu cầu nhập thêm: +${item.requestedQuantity}`
      ),
      '',
      `Tổng số mã sản phẩm: ${selectedList.length}`,
      `Tổng số lượng yêu cầu nhập: ${totalQty} sản phẩm`,
      restockNote.trim() ? `Ghi chú từ Quản trị: ${restockNote.trim()}` : '',
      '',
      'Trân trọng,',
      'Ban Quản trị Hệ thống M4N',
    ].filter(Boolean)

    const body = lines.join('\n')
    setSentEmailPreview({
      to: emailTrimmed,
      subject,
      body,
      items: selectedList,
      totalQty,
    })

    addToast({
      message: `Đã khởi tạo phiếu yêu cầu nhập thêm ${selectedList.length} sản phẩm gửi tới ${emailTrimmed}.`,
      type: 'success',
    })
  }

  const hasActiveFilters = Boolean(
    keyword ||
      selectedCategory ||
      selectedArtisan ||
      selectedVillage ||
      selectedStatus !== 'ALL'
  )

  // Metric computations for active products view
  const activeCount = products.filter((p) => p.isActive).length
  const outOfStockCount = products.filter((p) => (p.stockQuantity || 0) === 0).length
  const selectedRestockList = Object.values(selectedRestockItems)
  const totalRequestedRestockQty = selectedRestockList.reduce(
    (sum, item) => sum + Number(item.requestedQuantity || 0),
    0
  )
  const allCurrentPageSelected =
    products.length > 0 && products.every((p) => Boolean(selectedRestockItems[p.id]))

  return (
    <div className="flex flex-col gap-6">
      {masterDataError && <div role="alert" className="rounded-xl border border-danger bg-white p-4 text-sm text-danger">{masterDataError} <button type="button" onClick={loadMasterData} className="underline">Tải lại bộ lọc</button></div>}
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E5E8EB] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Quản trị dữ liệu nhạc cụ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17191B] tracking-tight">
            Quản lý Nhạc cụ & Sản phẩm
          </h1>
          <p className="text-sm text-secondary mt-1 max-w-2xl leading-relaxed">
            Khai báo thông số kỹ thuật nhạc cụ truyền thống, liên kết danh mục di sản, nghệ nhân, làng nghề và theo dõi tồn kho thực tế.
          </p>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setRestockMode((prev) => !prev)
              setSentEmailPreview(null)
            }}
            className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-2 ${
              restockMode
                ? 'border-[#17191B] bg-[#17191B] text-white'
                : 'border-[#0D9488]/35 bg-[#FFFFFF] hover:bg-[#F6F7F8] text-[#0D9488]'
            }`}
          >
            <Mail size={16} />
            <span>{restockMode ? 'Đóng chế độ yêu cầu nhập hàng' : 'Yêu cầu nhập thêm hàng'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.adminCategories)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F6F7F8] hover:border-zinc-300 text-sm font-medium text-[#17191B] transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <Layers size={16} className="text-secondary" />
            <span>Danh mục</span>
          </button>

          <button
            type="button"
            onClick={() => setArtisanModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F6F7F8] hover:border-zinc-300 text-sm font-medium text-[#17191B] transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <UserRound size={16} className="text-secondary" />
            <span>Nghệ nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setVillageModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F6F7F8] hover:border-zinc-300 text-sm font-medium text-[#17191B] transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <Landmark size={16} className="text-secondary" />
            <span>Làng nghề</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateProduct}
            className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm mới nhạc cụ</span>
          </button>
        </div>
      </div>

      {/* Bulk Restock Request Panel (Ý 2) */}
      {restockMode && (
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border-2 border-[#0D9488] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E8EB]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0D9488]/10 text-[#0D9488]">
                  Chế độ tích chọn nhập kho
                </span>
                <h2 className="text-base font-bold text-[#17191B]">
                  Yêu cầu nhập thêm hàng theo danh sách sản phẩm
                </h2>
              </div>
              <p className="text-xs text-secondary mt-1">
                Tích chọn các sản phẩm bên dưới, nhập số lượng cần bổ sung trên từng dòng và gửi email yêu cầu cho nhân viên kho.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={selectLowOrOutOfStockOnPage}
                className="px-3 py-1.5 rounded-lg border border-[#E5E8EB] bg-[#F6F7F8] hover:bg-[#E5E8EB] text-xs font-semibold text-[#17191B] transition-colors cursor-pointer"
              >
                Chọn nhanh SP sắp hết / hết hàng
              </button>
              {selectedRestockList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRestockItems({})}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-xs font-semibold text-rose-600 transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả ({selectedRestockList.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label htmlFor="restock-warehouse-email" className="block text-xs font-semibold text-[#17191B] mb-1">
                Email nhân viên kho / bộ phận cung ứng
              </label>
              <input
                id="restock-warehouse-email"
                type="email"
                value={warehouseEmail}
                onChange={(e) => setWarehouseEmail(e.target.value)}
                placeholder="kho@m4n.vn"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-white text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
              />
            </div>

            <div className="md:col-span-5">
              <label htmlFor="restock-note" className="block text-xs font-semibold text-[#17191B] mb-1">
                Ghi chú yêu cầu nhập hàng
              </label>
              <input
                id="restock-note"
                type="text"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                placeholder="VD: Ưu tiên nhập bổ sung các mẫu đàn phục vụ đơn hàng trong tuần..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-white text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <span className="text-xs text-secondary">
                Đã chọn: <strong className="text-[#17191B]">{selectedRestockList.length}</strong> SP · Tổng SL:{' '}
                <strong className="text-[#0D9488]">{totalRequestedRestockQty}</strong>
              </span>
              <button
                type="button"
                onClick={handleSendRestockEmail}
                disabled={selectedRestockList.length === 0}
                className="w-full py-2 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>Gửi mail yêu cầu nhập</span>
              </button>
            </div>
          </div>

          {sentEmailPreview && (
            <div className="p-4 rounded-xl bg-[#F6F7F8] border border-[#E5E8EB] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#17191B]">
                  Nội dung email yêu cầu nhập kho gửi tới <span className="text-[#0D9488] font-mono">{sentEmailPreview.to}</span>:
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(sentEmailPreview.body)
                      addToast({ message: 'Đã sao chép nội dung yêu cầu nhập kho vào bộ nhớ tạm.', type: 'success' })
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-xs font-semibold text-[#17191B] cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Sao chép nội dung</span>
                  </button>
                  <a
                    href={`mailto:${encodeURIComponent(sentEmailPreview.to)}?subject=${encodeURIComponent(
                      sentEmailPreview.subject
                    )}&body=${encodeURIComponent(sentEmailPreview.body)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-xs font-semibold text-white"
                  >
                    <Mail size={13} />
                    <span>Mở ứng dụng Mail để gửi</span>
                  </a>
                </div>
              </div>
              <pre className="text-xs text-[#17191B] bg-white p-3 rounded-lg border border-[#E5E8EB] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                {sentEmailPreview.body}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E8EB] shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold text-lg shrink-0">
            <Package size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-secondary block">
              Tổng số nhạc cụ
            </span>
            <span className="text-2xl font-bold text-[#17191B] font-mono">
              {totalElements}
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E8EB] shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-secondary text-emerald-600 flex items-center justify-center shrink-0">
            <CircleCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-secondary block">
              Đang kinh doanh (trang này)
            </span>
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {activeCount}
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E8EB] shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-secondary text-rose-600 flex items-center justify-center shrink-0">
            <CircleAlert size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-secondary block">
              Hết hàng (trang này)
            </span>
            <span className="text-2xl font-bold text-rose-600 font-mono">
              {outOfStockCount}
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E8EB] shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#F6F7F8] text-amber-700 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-secondary block">
              Danh mục đã phân loại
            </span>
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {categories.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã nhạc cụ, tên, barcode..."
              className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs"
            />
          </div>

          {/* Category filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Artisan filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedArtisan}
              onChange={(e) => {
                setSelectedArtisan(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs"
            >
              <option value="">Tất cả nghệ nhân</option>
              {artisans.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Craft Village filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedVillage}
              onChange={(e) => {
                setSelectedVillage(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs"
            >
              <option value="">Tất cả làng nghề</option>
              {craftVillages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang kinh doanh (trang này)</option>
              <option value="INACTIVE">Tạm ngừng bán</option>
            </select>
          </div>
        </div>

        {/* Filter status row & Clear */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E8EB]">
            <span className="text-secondary">
              Đang áp dụng bộ lọc tùy chỉnh
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#0D9488] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <X size={13} />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden flex flex-col">
        {error && (
          <div className="p-4 bg-surface-secondary border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-500 font-semibold">
              Đang tải danh sách nhạc cụ...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-secondary">
              <IconInstrument size={28} />
            </div>
            <h3 className="text-base font-bold text-[#17191B]">
              Không tìm thấy nhạc cụ nào
            </h3>
            <p className="text-sm text-secondary max-w-md">
              Không có sản phẩm nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại. Thử thay đổi từ khóa hoặc đặt lại bộ lọc.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 rounded-xl border border-[#E5E8EB] text-sm font-semibold text-zinc-700 hover:bg-[#F2F4F5] transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateProduct}
                className="mt-2 px-4 py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-[#0F766E] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>Thêm mới nhạc cụ đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E8EB] bg-[#F6F7F8] text-secondary font-semibold text-xs">
                  {restockMode && (
                    <th className="py-3.5 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả sản phẩm trang hiện tại"
                        checked={allCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        className="w-4 h-4 rounded border-[#E5E8EB] text-[#0D9488] focus:ring-[#0D9488] cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4">Nhạc cụ</th>
                  <th className="py-3.5 px-4">Phân loại & Di sản</th>
                  <th className="py-3.5 px-4 text-right">Đơn giá</th>
                  <th className="py-3.5 px-4 text-center">Tồn kho</th>
                  {restockMode && (
                    <th className="py-3.5 px-4 text-center">Số lượng yêu cầu nhập</th>
                  )}
                  <th className="py-3.5 px-4 text-center">Kinh doanh</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8EB]">
                {products.map((p) => {
                  const isOutOfStock = (p.stockQuantity || 0) === 0
                  const isLowStock = p.availability === 'LOW_STOCK'
                  const selectedRestock = selectedRestockItems[p.id]

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#F6F7F8]/80 transition-colors group ${
                        selectedRestock ? 'bg-[#F6F7F8]' : ''
                      }`}
                    >
                      {restockMode && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Chọn nhập kho ${p.name}`}
                            checked={Boolean(selectedRestock)}
                            onChange={() => toggleRestockProduct(p)}
                            className="w-4 h-4 rounded border-[#E5E8EB] text-[#0D9488] focus:ring-[#0D9488] cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Product identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-[#E5E8EB] overflow-hidden shrink-0 flex items-center justify-center">
                          {p.primaryImage ? (
                            <img
                                src={p.primaryImage}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <IconInstrument size={22} className="text-secondary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                restockMode
                                  ? toggleRestockProduct(p)
                                  : navigateTo(CUSTOMER_ROUTES.adminInstrumentDetail(p.id))
                              }
                              className="text-sm font-semibold text-[#17191B] hover:text-[#0D9488] transition-colors text-left truncate block max-w-xs sm:max-w-md cursor-pointer"
                              title={p.name}
                            >
                              {p.name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs font-medium text-secondary bg-[#F2F4F5] px-2 py-0.5 rounded">
                                {p.code}
                              </span>
                              {p.barcode && (
                                <span className="font-mono text-xs text-muted">
                                  {p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classification & Heritage */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-[#0D9488]/10 text-[#0D9488] self-start">
                            {p.category?.name || 'Chưa phân loại'}
                          </span>
                          {p.artisan?.name && (
                            <span className="text-xs text-secondary truncate max-w-[180px] flex items-center gap-1">
                              <UserRound size={14} className="text-secondary shrink-0" />
                              <span>{p.artisan.name}</span>
                            </span>
                          )}
                          {p.craftVillage?.name && (
                            <span className="text-xs text-muted truncate max-w-[180px] flex items-center gap-1">
                              <Landmark size={14} className="text-muted shrink-0" />
                              <span>{p.craftVillage.name}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-[#17191B]">
                          {formatCurrencyVND(p.price)}
                        </span>
                      </td>

                      {/* Inventory Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-sm text-[#17191B]">
                            {p.stockQuantity || 0}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              isOutOfStock
                                ? 'bg-surface-secondary text-rose-600 border border-rose-200'
                                : isLowStock
                                ? 'bg-[#F6F7F8] text-amber-800 border border-amber-200'
                                : 'bg-surface-secondary text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? 'Hết hàng' : isLowStock ? 'Sắp hết' : 'Còn hàng'}
                          </span>
                        </div>
                      </td>

                      {restockMode && (
                        <td className="py-3.5 px-4 text-center">
                          {selectedRestock ? (
                            <input
                              type="number"
                              min={1}
                              max={9999}
                              aria-label={`Số lượng cần nhập cho ${p.name}`}
                              value={selectedRestock.requestedQuantity}
                              onChange={(e) => updateRestockQuantity(p, e.target.value)}
                              className="w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm rounded-lg border border-[#0D9488] bg-white text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleRestockProduct(p)}
                              className="text-xs text-secondary hover:text-[#0D9488] underline cursor-pointer"
                            >
                              + Chọn nhập
                            </button>
                          )}
                        </td>
                      )}

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            p.isActive
                              ? 'bg-surface-secondary text-emerald-700 border-emerald-200 hover:bg-surface-secondary'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                          }`}
                          title="Nhấn để bật / tắt trạng thái bán"
                        >
                          {p.isActive ? 'Kinh doanh' : 'Tạm ngừng'}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigateTo(CUSTOMER_ROUTES.adminInstrumentDetail(p.id))
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F2F4F5] text-[#17191B] font-medium text-sm transition-colors cursor-pointer"
                            title="Xem trang chi tiết nhạc cụ"
                          >
                            <Eye size={15} />
                            <span>Chi tiết</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigateTo(`${CUSTOMER_ROUTES.adminInventory}?keyword=${encodeURIComponent(p.code)}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-surface-secondary hover:bg-surface-secondary text-emerald-700 font-medium text-sm transition-colors cursor-pointer"
                            title="Nhập thêm số lượng tồn kho"
                          >
                            <Package size={15} />
                            <span>Nhập kho</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488]/10 hover:bg-[#0D9488]/20 text-[#0D9488] font-medium text-sm transition-colors cursor-pointer"
                            title="Chỉnh sửa thông số sản phẩm"
                          >
                            <Pencil size={15} />
                            <span>Sửa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && products.length > 0 && (
          <div className="p-4 border-t border-[#E5E8EB] flex items-center justify-between text-sm bg-[#FFFFFF]">
            <span className="text-secondary">
              Hiển thị <strong>{products.length}</strong> / <strong>{totalElements}</strong> nhạc cụ
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F2F4F5] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-zinc-700 transition-colors cursor-pointer text-sm"
              >
                ← Trang trước
              </button>

              <span className="px-3 py-2 font-semibold text-[#17191B] text-sm">
                Trang {page + 1} / {totalPages || 1}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F2F4F5] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-zinc-700 transition-colors cursor-pointer text-sm"
              >
                Trang sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal (Create / Edit) */}
      {productModalOpen && <ProductFormModal
        isOpen={productModalOpen}
        productId={editingProductId}
        onClose={() => setProductModalOpen(false)}
        onSuccess={handleProductSaved}
      />}

      {/* Category Management Modal */}
      {categoryModalOpen && <CategoryManagementModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={() => {
          loadMasterData()
          setRefreshKey((k) => k + 1)
        }}
      />}

      {/* Artisan Management Modal */}
      {artisanModalOpen && <ArtisanManagementModal
        isOpen={artisanModalOpen}
        onClose={() => setArtisanModalOpen(false)}
        onSuccess={() => {
          loadMasterData()
          setRefreshKey((k) => k + 1)
        }}
      />}

      {/* Craft Village Management Modal */}
      {villageModalOpen && <CraftVillageManagementModal
        isOpen={villageModalOpen}
        onClose={() => setVillageModalOpen(false)}
        onSuccess={() => {
          loadMasterData()
          setRefreshKey((k) => k + 1)
        }}
      />}

    </div>
  )
}
