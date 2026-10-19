import { useState, useEffect, useCallback, useTransition } from 'react'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import adminProductService from '../../services/adminProductService.js'
import categoryService from '../../services/categoryService.js'
import artisanService from '../../services/artisanService.js'
import craftVillageService from '../../services/craftVillageService.js'
import { importStock } from '../../services/inventoryService.js'
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
  const [refreshKey, setRefreshKey] = useState(0)

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [artisanModalOpen, setArtisanModalOpen] = useState(false)
  const [villageModalOpen, setVillageModalOpen] = useState(false)

  // Stock Import state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importTargetProduct, setImportTargetProduct] = useState(null)
  const [importQuantity, setImportQuantity] = useState(1)
  const [importNotes, setImportNotes] = useState('')
  const [submittingImport, setSubmittingImport] = useState(false)

  // Load dropdown master data
  const loadMasterData = useCallback(async () => {
    try {
      const [cats, arts, vils] = await Promise.all([
        categoryService.getCategories().catch(() => []),
        artisanService.getArtisans().catch(() => []),
        craftVillageService.getCraftVillages().catch(() => []),
      ])
      setCategories(cats || [])
      setArtisans(arts || [])
      setCraftVillages(vils || [])
    } catch {
      // master data soft fail
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      categoryService.getCategories().catch(() => []),
      artisanService.getArtisans().catch(() => []),
      craftVillageService.getCraftVillages().catch(() => []),
    ]).then(([cats, arts, vils]) => {
      if (active) {
        setCategories(cats || [])
        setArtisans(arts || [])
        setCraftVillages(vils || [])
      }
    })
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

    adminProductService
      .listProducts({
        keyword,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        artisanId: selectedArtisan ? Number(selectedArtisan) : undefined,
        craftVillageId: selectedVillage ? Number(selectedVillage) : undefined,
        isActive: isActiveFilter,
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      })
      .then((response) => {
        if (active) {
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
    const newStatus = !product.isActive
    try {
      await adminProductService.updateStatus(product.id, newStatus)
      addToast({
        message: newStatus
          ? `Đã kích hoạt kinh doanh "${product.name}".`
          : `Đã tạm ngừng kinh doanh "${product.name}".`,
        type: newStatus ? 'success' : 'info',
      })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: newStatus } : p))
      )
    } catch (err) {
      addToast({
        message: err.message || 'Không thể thay đổi trạng thái sản phẩm',
        type: 'error',
      })
    }
  }

  const handleOpenImportModal = (product) => {
    setImportTargetProduct(product)
    setImportQuantity(1)
    setImportNotes('')
    setImportModalOpen(true)
  }

  const handleImportSubmit = async (e) => {
    e.preventDefault()
    if (!importTargetProduct) return
    const qty = parseInt(importQuantity, 10)
    if (isNaN(qty) || qty <= 0) {
      addToast({ message: 'Số lượng nhập phải lớn hơn 0', type: 'error' })
      return
    }

    setSubmittingImport(true)
    try {
      await importStock(importTargetProduct.id, {
        quantity: qty,
        notes: importNotes.trim() || undefined,
      })
      addToast({
        message: `Đã nhập kho +${qty} cho "${importTargetProduct.name}".`,
        type: 'success',
      })
      setImportModalOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      addToast({
        message: err.message || 'Nhập kho thất bại',
        type: 'error',
      })
    } finally {
      setSubmittingImport(false)
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

  return (
    <div className="flex flex-col gap-6">
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
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
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
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
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
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
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
              <option value="ACTIVE">Đang kinh doanh</option>
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
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
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
                  <th className="py-3.5 px-4">Nhạc cụ</th>
                  <th className="py-3.5 px-4">Phân loại & Di sản</th>
                  <th className="py-3.5 px-4 text-right">Đơn giá</th>
                  <th className="py-3.5 px-4 text-center">Tồn kho</th>
                  <th className="py-3.5 px-4 text-center">Kinh doanh</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8EB]">
                {products.map((p) => {
                  const isOutOfStock = (p.stockQuantity || 0) === 0
                  const isLowStock = !isOutOfStock && (p.stockQuantity || 0) <= 5

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#F6F7F8]/80 transition-colors group"
                    >
                      {/* Product identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-[#E5E8EB] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.primaryImageUrl ? (
                              <img
                                src={p.primaryImageUrl}
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
                                navigateTo(CUSTOMER_ROUTES.adminInstrumentDetail(p.id))
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
                            {p.categoryName || 'Chưa phân loại'}
                          </span>
                          {p.artisanName && (
                            <span className="text-xs text-secondary truncate max-w-[180px] flex items-center gap-1">
                              <UserRound size={14} className="text-secondary shrink-0" />
                              <span>{p.artisanName}</span>
                            </span>
                          )}
                          {p.craftVillageName && (
                            <span className="text-xs text-muted truncate max-w-[180px] flex items-center gap-1">
                              <Landmark size={14} className="text-muted shrink-0" />
                              <span>{p.craftVillageName}</span>
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
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? 'Hết hàng' : isLowStock ? 'Sắp hết' : 'Còn hàng'}
                          </span>
                        </div>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
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
                            onClick={() => handleOpenImportModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors cursor-pointer"
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
        {!loading && totalPages > 1 && (
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
                Trang {page + 1} / {totalPages}
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
      <ProductFormModal
        isOpen={productModalOpen}
        productId={editingProductId}
        onClose={() => setProductModalOpen(false)}
        onSuccess={handleProductSaved}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={() => {
          loadMasterData()
          setRefreshKey((k) => k + 1)
        }}
      />

      {/* Artisan Management Modal */}
      <ArtisanManagementModal
        isOpen={artisanModalOpen}
        onClose={() => setArtisanModalOpen(false)}
        onSuccess={() => {
          loadMasterData()
          setRefreshKey((k) => k + 1)
        }}
      />

      {/* Craft Village Management Modal */}
      <CraftVillageManagementModal
        isOpen={villageModalOpen}
        onClose={() => setVillageModalOpen(false)}
        onSuccess={() => {
          loadMasterData()
          setRefreshKey((k) => k + 1)
        }}
      />

      {/* Stock Import Modal */}
      {importModalOpen && importTargetProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-[#E5E8EB] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17191B]">
                Nhập kho nhạc cụ: <span className="font-mono text-secondary">{importTargetProduct.code}</span>
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="text-secondary hover:text-[#17191B] cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-xs text-secondary block mb-1">Tên sản phẩm</span>
                <span className="text-base font-bold text-[#17191B] block">
                  {importTargetProduct.name}
                </span>
                <span className="text-xs text-secondary block mt-1">
                  Tồn kho hiện tại: <strong className="text-[#17191B] font-mono">{importTargetProduct.stockQuantity || 0}</strong>
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Số lượng nhập thêm <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportQuantity((q) => Math.max(1, (parseInt(q, 10) || 1) - 1))}
                    className="w-10 h-10 rounded-xl border border-[#E5E8EB] bg-[#F6F7F8] hover:bg-[#E5E8EB] font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={importQuantity}
                    onChange={(e) => setImportQuantity(e.target.value)}
                    className="flex-1 text-center py-2 text-base font-bold text-[#17191B] rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setImportQuantity((q) => (parseInt(q, 10) || 0) + 1)}
                    className="w-10 h-10 rounded-xl border border-[#E5E8EB] bg-[#F6F7F8] hover:bg-[#E5E8EB] font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Ghi chú nhập kho (tùy chọn)
                </label>
                <input
                  type="text"
                  value={importNotes}
                  onChange={(e) => setImportNotes(e.target.value)}
                  placeholder="VD: Nhập đợt nghệ nhân hoàn thiện nhạc cụ..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:text-[#17191B] hover:bg-[#F2F4F5] rounded-xl border border-[#E5E8EB] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingImport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-2"
                >
                  {submittingImport ? 'Đang cập nhật...' : 'Xác nhận nhập kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
