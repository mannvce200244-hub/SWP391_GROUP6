import { useState, useMemo } from 'react'
import useToast from '../../components/ui/useToast.js'
import prodDanTranh from '../../assets/images/prod-dan-tranh.jpg'
import prodDanBau from '../../assets/images/prod-dan-bau.jpg'
import prodDanNguyet from '../../assets/images/prod-dan-nguyet.jpg'
import prodSaoTruc from '../../assets/images/prod-sao-truc.jpg'
import catNhacCuGo from '../../assets/images/cat-nhac-cu-go.jpg'
import catNhacCuHoi from '../../assets/images/cat-nhac-cu-hoi.jpg'

import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconCheck,
  IconClose,
  IconPackage,
  IconAlertCircle,
} from '../../components/ui/Icons.jsx'

// Standard seed data for traditional instrument inventory
const INITIAL_INSTRUMENTS = [
  {
    id: 'INS-001',
    sku: 'TRN-CL-19',
    name: 'Đàn Tranh 19 Dây Gỗ Cẩm Lai Khảm Trai',
    category: 'DAY',
    categoryLabel: 'Nhạc cụ dây',
    artisan: 'NNƯT Nguyễn Văn Bách',
    craftVillage: 'Làng Đào Xá',
    price: 14500000,
    stock: 6,
    maxStock: 15,
    status: 'AVAILABLE', // AVAILABLE, LOW_STOCK, OUT_OF_STOCK
    image: prodDanTranh,
  },
  {
    id: 'INS-002',
    sku: 'BAU-MT-01',
    name: 'Đàn Bầu Gỗ Mun Thân Liền Cần Sừng Trâu',
    category: 'DAY',
    categoryLabel: 'Nhạc cụ dây',
    artisan: 'Nghệ nhân Đỗ Bá Kiên',
    craftVillage: 'Làng Đào Xá',
    price: 9800000,
    stock: 4,
    maxStock: 10,
    status: 'AVAILABLE',
    image: prodDanBau,
  },
  {
    id: 'INS-003',
    sku: 'NGY-TT-02',
    name: 'Đàn Nguyệt Gỗ Trắc Cần Dài Phím Đồng',
    category: 'DAY',
    categoryLabel: 'Nhạc cụ dây',
    artisan: 'NNƯT Phạm Chí Khánh',
    craftVillage: 'Làng Đào Xá',
    price: 11200000,
    stock: 2,
    maxStock: 8,
    status: 'LOW_STOCK',
    image: prodDanNguyet,
  },
  {
    id: 'INS-004',
    sku: 'SAO-DN-C5',
    name: 'Sáo Trúc Tone Đô (C5) Trúc Già Hun Khói',
    category: 'HOI',
    categoryLabel: 'Nhạc cụ hơi',
    artisan: 'Nghệ nhân Bùi Gia Định',
    craftVillage: 'Làng Trúc Sơn',
    price: 1250000,
    stock: 18,
    maxStock: 30,
    status: 'AVAILABLE',
    image: prodSaoTruc,
  },
  {
    id: 'INS-005',
    sku: 'TIEU-BK-N8',
    name: 'Tiêu Bát Khổng Nứa Bắc Đốt Tròn Tự Nhiên',
    category: 'HOI',
    categoryLabel: 'Nhạc cụ hơi',
    artisan: 'Nghệ nhân Lê Đình Hưng',
    craftVillage: 'Làng Trúc Sơn',
    price: 2400000,
    stock: 3,
    maxStock: 12,
    status: 'LOW_STOCK',
    image: catNhacCuHoi,
  },
  {
    id: 'INS-006',
    sku: 'TRG-DT-40',
    name: 'Trống Đế Lễ Hội Da Trâu Gỗ Mít Cổ Truyền',
    category: 'GO',
    categoryLabel: 'Nhạc cụ gõ',
    artisan: 'Nghệ nhân Trần Văn Tự',
    craftVillage: 'Làng Đọi Tam',
    price: 4800000,
    stock: 0,
    maxStock: 10,
    status: 'OUT_OF_STOCK',
    image: catNhacCuGo,
  },
  {
    id: 'INS-007',
    sku: 'NHI-MT-08',
    name: 'Đàn Nhị Líu Gỗ Cẩm Mặt Da Trăn Vàng Tuyển Chọn',
    category: 'DAY',
    categoryLabel: 'Nhạc cụ dây',
    artisan: 'NNƯT Nguyễn Văn Bách',
    craftVillage: 'Làng Đào Xá',
    price: 7600000,
    stock: 5,
    maxStock: 12,
    status: 'AVAILABLE',
    image: prodDanNguyet,
  },
  {
    id: 'INS-008',
    sku: 'KHEN-HM-06',
    name: 'Khèn Bè Ống Nứa Dân Tộc Tây Bắc Chế Tác Thủ Công',
    category: 'HOI',
    categoryLabel: 'Nhạc cụ hơi',
    artisan: 'Nghệ nhân Lò Văn Sâm',
    craftVillage: 'Bản Cát Cát',
    price: 3600000,
    stock: 4,
    maxStock: 8,
    status: 'AVAILABLE',
    image: catNhacCuHoi,
  },
]

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function AdminInstrumentsPage() {
  const { addToast } = useToast()
  const [instruments, setInstruments] = useState(INITIAL_INSTRUMENTS)
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockItem, setStockItem] = useState(null)
  const [stockAdjustment, setStockAdjustment] = useState(0)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'DAY',
    categoryLabel: 'Nhạc cụ dây',
    artisan: 'NNƯT Nguyễn Văn Bách',
    craftVillage: 'Làng Đào Xá',
    price: 5000000,
    stock: 5,
    maxStock: 15,
  })

  // Filtered instruments
  const filteredInstruments = useMemo(() => {
    return instruments.filter((item) => {
      const matchKeyword =
        !keyword.trim() ||
        item.name.toLowerCase().includes(keyword.toLowerCase()) ||
        item.sku.toLowerCase().includes(keyword.toLowerCase()) ||
        item.artisan.toLowerCase().includes(keyword.toLowerCase())

      const matchCategory = !selectedCategory || item.category === selectedCategory
      const matchStatus = !selectedStatus || item.status === selectedStatus

      return matchKeyword && matchCategory && matchStatus
    })
  }, [instruments, keyword, selectedCategory, selectedStatus])

  // Statistics
  const totalStockCount = instruments.reduce((sum, item) => sum + item.stock, 0)
  const lowStockCount = instruments.filter((item) => item.status === 'LOW_STOCK').length
  const outOfStockCount = instruments.filter((item) => item.status === 'OUT_OF_STOCK').length
  const totalValuation = instruments.reduce((sum, item) => sum + item.price * item.stock, 0)

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      sku: `INS-${Date.now().toString().slice(-4)}`,
      category: 'DAY',
      categoryLabel: 'Nhạc cụ dây',
      artisan: 'NNƯT Nguyễn Văn Bách',
      craftVillage: 'Làng Đào Xá',
      price: 5000000,
      stock: 5,
      maxStock: 15,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      categoryLabel: item.categoryLabel,
      artisan: item.artisan,
      craftVillage: item.craftVillage,
      price: item.price,
      stock: item.stock,
      maxStock: item.maxStock,
    })
    setModalOpen(true)
  }

  const handleDelete = (item) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhạc cụ "${item.name}" khỏi danh mục không?`)) {
      setInstruments((prev) => prev.filter((i) => i.id !== item.id))
      addToast({
        message: `Đã xóa nhạc cụ ${item.sku} thành công.`,
        type: 'info',
      })
    }
  }

  const handleSaveInstrument = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.sku.trim()) {
      addToast({ message: 'Vui lòng nhập đầy đủ tên và mã nhạc cụ.', type: 'error' })
      return
    }

    const categoryLabels = {
      DAY: 'Nhạc cụ dây',
      HOI: 'Nhạc cụ hơi',
      GO: 'Nhạc cụ gõ',
    }

    let status = 'AVAILABLE'
    if (Number(formData.stock) === 0) status = 'OUT_OF_STOCK'
    else if (Number(formData.stock) <= 3) status = 'LOW_STOCK'

    if (editingItem) {
      setInstruments((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
                maxStock: Number(formData.maxStock),
                categoryLabel: categoryLabels[formData.category] || 'Nhạc cụ truyền thống',
                status,
              }
            : item,
        ),
      )
      addToast({ message: 'Đã cập nhật thông tin nhạc cụ thành công.', type: 'success' })
    } else {
      const newItem = {
        id: `INS-${Date.now().toString().slice(-6)}`,
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        maxStock: Number(formData.maxStock),
        categoryLabel: categoryLabels[formData.category] || 'Nhạc cụ truyền thống',
        status,
        image:
          formData.category === 'DAY'
            ? prodDanTranh
            : formData.category === 'HOI'
              ? prodSaoTruc
              : catNhacCuGo,
      }
      setInstruments((prev) => [newItem, ...prev])
      addToast({ message: 'Đã thêm nhạc cụ mới vào kho thành công.', type: 'success' })
    }

    setModalOpen(false)
  }

  const handleOpenStockAdjust = (item) => {
    setStockItem(item)
    setStockAdjustment(item.stock)
    setStockModalOpen(true)
  }

  const handleSaveStock = () => {
    if (!stockItem) return
    const newStock = Math.max(0, Number(stockAdjustment))
    let status = 'AVAILABLE'
    if (newStock === 0) status = 'OUT_OF_STOCK'
    else if (newStock <= 3) status = 'LOW_STOCK'

    setInstruments((prev) =>
      prev.map((i) =>
        i.id === stockItem.id
          ? { ...i, stock: newStock, status }
          : i,
      ),
    )
    addToast({
      message: `Đã cập nhật tồn kho cho "${stockItem.name}" thành ${newStock} cây.`,
      type: 'success',
    })
    setStockModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-border p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
              Kho & Di Sản M4N
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-muted font-medium">Danh mục & Tồn kho</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
            Danh mục Nhạc cụ Truyền thống
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Quản trị thông tin kỹ thuật, số lượng tồn kho, giá bán và xuất xứ nghệ nhân chế tác.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <IconPlus size={16} />
          <span>Thêm nhạc cụ mới</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tổng mẫu nhạc cụ</span>
            <p className="text-2xl font-extrabold text-ink">{instruments.length} mẫu</p>
            <span className="text-xs text-zinc-500 mt-0.5">Tổng cộng {totalStockCount} cây trong kho</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">
            <IconPackage size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Sẵn sàng xuất kho</span>
            <p className="text-2xl font-extrabold text-[#1F6B5A]">
              {instruments.filter((i) => i.status === 'AVAILABLE').length} mẫu
            </p>
            <span className="text-xs text-[#1F6B5A] font-semibold mt-0.5">Đạt chuẩn âm sắc & kho</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1F6B5A] flex items-center justify-center shrink-0">
            <IconCheck size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Cần bổ sung / Hết</span>
            <p className="text-2xl font-extrabold text-amber-600">
              {lowStockCount + outOfStockCount} mẫu
            </p>
            <span className="text-xs text-amber-600 font-medium mt-0.5">
              {lowStockCount} sắp hết · {outOfStockCount} hết hàng
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <IconAlertCircle size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Ước tính giá trị kho</span>
            <p className="text-2xl font-extrabold text-ink">{formatVND(totalValuation)}</p>
            <span className="text-xs text-zinc-500 mt-0.5">Theo giá bán niêm yết</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center shrink-0">
            <span className="font-bold text-sm">₫</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên nhạc cụ, mã SKU hoặc nghệ nhân..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-sm text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            >
              <IconClose size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Counter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-xs sm:text-sm font-medium text-ink focus:outline-hidden focus:border-[#0D9488] cursor-pointer"
          >
            <option value="">Tất cả dòng nhạc cụ</option>
            <option value="DAY">Nhạc cụ dây</option>
            <option value="HOI">Nhạc cụ hơi</option>
            <option value="GO">Nhạc cụ gõ</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-xs sm:text-sm font-medium text-ink focus:outline-hidden focus:border-[#0D9488] cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Còn hàng</option>
            <option value="LOW_STOCK">Sắp hết hàng (≤ 3)</option>
            <option value="OUT_OF_STOCK">Đã hết hàng (0)</option>
          </select>

          <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap hidden xl:inline px-2">
            Hiển thị <span className="text-ink font-bold">{filteredInstruments.length}</span> / {instruments.length} mẫu
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F8FAFC] text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nhạc cụ & Mã SKU</th>
                <th className="py-3.5 px-4">Dòng & Nghệ nhân</th>
                <th className="py-3.5 px-4 text-right">Giá niêm yết</th>
                <th className="py-3.5 px-4 text-center">Tồn kho</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredInstruments.length > 0 ? (
                filteredInstruments.map((item) => {
                  const stockPercent = Math.min(100, Math.round((item.stock / item.maxStock) * 100))

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Instrument & Thumbnail */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-11 h-11 rounded-xl object-cover border border-border shadow-2xs shrink-0 bg-zinc-100"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-ink hover:text-[#0D9488] transition-colors line-clamp-1">
                              {item.name}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono tracking-tight mt-0.5">
                              {item.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Artisan */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#0D9488]">
                            {item.categoryLabel}
                          </span>
                          <span className="text-xs text-zinc-700 mt-0.5 font-medium">
                            {item.artisan}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {item.craftVillage}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-ink whitespace-nowrap">
                        {formatVND(item.price)}
                      </td>

                      {/* Stock with visual gauge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1 min-w-[70px]">
                          <span className="font-bold text-xs text-ink">
                            {item.stock} / {item.maxStock}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.stock === 0
                                  ? 'bg-rose-500'
                                  : item.stock <= 3
                                    ? 'bg-amber-500'
                                    : 'bg-[#1F6B5A]'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'AVAILABLE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Còn hàng
                          </span>
                        )}
                        {item.status === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Sắp hết
                          </span>
                        )}
                        {item.status === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Hết hàng
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenStockAdjust(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-[#0D9488] hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Cập nhật số lượng kho"
                          >
                            <IconPackage size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-ink hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa nhạc cụ"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconAlertCircle size={24} className="text-zinc-400" />
                      <p className="font-semibold text-sm text-ink">Không tìm thấy nhạc cụ nào khớp với bộ lọc.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setKeyword('')
                          setSelectedCategory('')
                          setSelectedStatus('')
                        }}
                        className="text-xs font-bold text-[#0D9488] hover:underline mt-1 cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination Info */}
        <div className="px-6 py-3.5 border-t border-border bg-[#F8FAFC] flex items-center justify-between text-xs text-zinc-500">
          <span>
            Hiển thị <span className="font-semibold text-ink">{filteredInstruments.length}</span> trên tổng số <span className="font-semibold text-ink">{instruments.length}</span> nhạc cụ di sản
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="px-3 py-1 rounded-lg border border-border bg-white text-zinc-400 text-xs font-medium cursor-not-allowed opacity-60"
            >
              Trước
            </button>
            <span className="px-2 font-bold text-ink">1</span>
            <button
              type="button"
              disabled
              className="px-3 py-1 rounded-lg border border-border bg-white text-zinc-400 text-xs font-medium cursor-not-allowed opacity-60"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Instrument */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-border w-full max-w-xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
              <h3 className="text-lg font-bold text-ink">
                {editingItem ? 'Chỉnh sửa thông tin nhạc cụ' : 'Thêm nhạc cụ di sản mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-ink hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInstrument} className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                  Tên nhạc cụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đàn Nguyệt Gỗ Trắc Cần Dài"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Mã SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TRN-CL-19"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink font-mono focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Dòng nhạc cụ
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] cursor-pointer"
                  >
                    <option value="DAY">Nhạc cụ dây</option>
                    <option value="HOI">Nhạc cụ hơi</option>
                    <option value="GO">Nhạc cụ gõ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Giá niêm yết (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={50000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Số lượng tồn hiện tại
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Nghệ nhân chế tác
                  </label>
                  <input
                    type="text"
                    value={formData.artisan}
                    onChange={(e) => setFormData({ ...formData, artisan: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-ink text-xs uppercase tracking-wider">
                    Làng nghề truyền thống
                  </label>
                  <input
                    type="text"
                    value={formData.craftVillage}
                    onChange={(e) => setFormData({ ...formData, craftVillage: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-ink hover:bg-zinc-100 text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <IconCheck size={16} />
                  <span>{editingItem ? 'Lưu thay đổi' : 'Thêm nhạc cụ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Stock Adjustment */}
      {stockModalOpen && stockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-base font-bold text-ink mb-1">Cập nhật số lượng kho</h3>
            <p className="text-xs text-muted mb-4 line-clamp-1">{stockItem.name}</p>

            <div className="flex items-center justify-center gap-4 my-6">
              <button
                type="button"
                onClick={() => setStockAdjustment((prev) => Math.max(0, Number(prev) - 1))}
                className="w-10 h-10 rounded-xl bg-zinc-100 border border-border flex items-center justify-center text-lg font-bold text-ink hover:text-[#0D9488] hover:bg-teal-50 transition-colors cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-20 py-2 text-center text-xl font-bold bg-[#F5F7FA] border border-border rounded-xl text-ink focus:outline-hidden focus:border-[#0D9488]"
              />
              <button
                type="button"
                onClick={() => setStockAdjustment((prev) => Number(prev) + 1)}
                className="w-10 h-10 rounded-xl bg-zinc-100 border border-border flex items-center justify-center text-lg font-bold text-ink hover:text-[#0D9488] hover:bg-teal-50 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-zinc-600 hover:text-ink cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition-colors cursor-pointer shadow-xs"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInstrumentsPage
