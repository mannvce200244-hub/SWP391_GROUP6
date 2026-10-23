import { useState, useEffect, useCallback } from 'react'
import adminProductService from '../../services/adminProductService.js'
import categoryService from '../../services/categoryService.js'
import artisanService from '../../services/artisanService.js'
import craftVillageService from '../../services/craftVillageService.js'
import useToast from '../ui/useToast.js'
import CategoryManagementModal from './CategoryManagementModal.jsx'
import ArtisanManagementModal from './ArtisanManagementModal.jsx'
import CraftVillageManagementModal from './CraftVillageManagementModal.jsx'
import { IconInstrument } from '../ui/Icons.jsx'
import { ArrowDown, ArrowUp, X, Plus, Trash2, Image, Package } from 'lucide-react'

const vndNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

function normalizeVndInput(value) {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

function formatVndInput(value) {
  return value ? vndNumberFormatter.format(Number(value)) : ''
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  productId = null,
}) {
  const { addToast } = useToast()
  const isEdit = Boolean(productId)

  // Master data state
  const [categories, setCategories] = useState([])
  const [artisans, setArtisans] = useState([])
  const [craftVillages, setCraftVillages] = useState([])

  // Nested modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showArtisanModal, setShowArtisanModal] = useState(false)
  const [showVillageModal, setShowVillageModal] = useState(false)

  // Form fields
  const [code, setCode] = useState('')
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [artisanId, setArtisanId] = useState('')
  const [craftVillageId, setCraftVillageId] = useState('')
  const [material, setMaterial] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [musicalRange, setMusicalRange] = useState('')
  const [origin, setOrigin] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Media items state
  const [mediaList, setMediaList] = useState([])
  const [removedMediaIds, setRemovedMediaIds] = useState([])
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaType, setNewMediaType] = useState('IMAGE')
  const [newMediaAlt, setNewMediaAlt] = useState('')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const resetFormFields = useCallback(() => {
    setCode('')
    setBarcode('')
    setName('')
    setPrice('')
    setCategoryId('')
    setArtisanId('')
    setCraftVillageId('')
    setMaterial('')
    setDimensions('')
    setMusicalRange('')
    setOrigin('')
    setDescription('')
    setIsActive(true)
    setMediaList([])
    setRemovedMediaIds([])
    setFormErrors({})
    setServerError('')
  }, [])

  const loadMasterData = useCallback(async () => {
    try {
      const [cats, arts, vils] = await Promise.all([
        categoryService.getCategories().catch(() => []),
        artisanService.getAdminArtisans().catch(() => []),
        craftVillageService.getCraftVillages().catch(() => []),
      ])
      setCategories(cats || [])
      setArtisans(arts || [])
      setCraftVillages(vils || [])
    } catch {
      // master data fetch soft fail
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let active = true

    Promise.all([
      categoryService.getCategories().catch(() => []),
      artisanService.getAdminArtisans().catch(() => []),
      craftVillageService.getCraftVillages().catch(() => []),
    ]).then(([cats, arts, vils]) => {
      if (active) {
        setCategories(cats || [])
        setArtisans(arts || [])
        setCraftVillages(vils || [])
      }
    })

    if (productId) {
      adminProductService
        .getProductDetail(productId)
        .then((p) => {
          if (active) {
            setCode(p.code || '')
            setBarcode(p.barcode || '')
            setName(p.name || '')
            setPrice(p.price != null ? String(Math.trunc(Number(p.price))) : '')
            setCategoryId(p.category?.id ? String(p.category.id) : '')
            setArtisanId(p.artisan?.id ? String(p.artisan.id) : '')
            setCraftVillageId(p.craftVillage?.id ? String(p.craftVillage.id) : '')
            setMaterial(p.material || '')
            setDimensions(p.dimensions || '')
            setMusicalRange(p.musicalRange || '')
            setOrigin(p.origin || '')
            setDescription(p.description || '')
            setIsActive(Boolean(p.isActive))
            const sortedMedia = [...(p.media || [])].sort(
              (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
            )
            setMediaList(
              sortedMedia.map((m, index) => ({
                id: m.id,
                url: m.url,
                mediaType: m.type || 'IMAGE',
                altText: m.alt || '',
                isPrimary: index === 0,
                sortOrder: index,
              }))
            )
            setRemovedMediaIds([])
            setLoading(false)
          }
        })
        .catch((err) => {
          if (active) {
            setServerError(err.message || 'Không thể tải thông tin sản phẩm')
            setLoading(false)
          }
        })
    }

    return () => {
      active = false
    }
  }, [isOpen, productId])

  const handleClose = () => {
    resetFormFields()
    onClose()
  }

  // When an artisan is selected, auto-fill craft village if available and not yet set
  const handleArtisanChange = (selectedArtisanId) => {
    setArtisanId(selectedArtisanId)
    if (selectedArtisanId && !craftVillageId) {
      const art = artisans.find((a) => String(a.id) === String(selectedArtisanId))
      if (art?.craftVillageId) {
        setCraftVillageId(String(art.craftVillageId))
      }
    }
  }

  // Media helpers
  const handleAddMedia = () => {
    if (!newMediaUrl.trim()) return
    const isFirst = mediaList.length === 0
    const newItem = {
      url: newMediaUrl.trim(),
      mediaType: newMediaType,
      altText: newMediaAlt.trim(),
      isPrimary: isFirst,
      sortOrder: mediaList.length,
    }
    setMediaList((prev) => [...prev, newItem])
    setNewMediaUrl('')
    setNewMediaAlt('')
  }

  const handleRemoveMedia = (index) => {
    const item = mediaList[index]
    if (isEdit && item.id) {
      setRemovedMediaIds((prev) => [...prev, item.id])
    }
    setMediaList((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((media, i) => ({
          ...media,
          isPrimary: i === 0,
          sortOrder: i,
        })),
    )
  }

  const handleSetPrimaryMedia = (index) => {
    setMediaList((prev) => {
      const selected = prev[index]
      const reordered = [selected, ...prev.filter((_, i) => i !== index)]
      return reordered.map((media, i) => ({
        ...media,
        isPrimary: i === 0,
        sortOrder: i,
      }))
    })
 feature/product-master-data
  }

  const handleMoveMedia = (index, direction) => {
    setMediaList((previous) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= previous.length) return previous

      const reordered = [...previous]
      const movedMedia = reordered[index]
      reordered[index] = reordered[targetIndex]
      reordered[targetIndex] = movedMedia
      return reordered.map((media, mediaIndex) => ({
        ...media,
        isPrimary: mediaIndex === 0,
        sortOrder: mediaIndex,
      }))
    })
 main
  }

  const validate = () => {
    const errors = {}
    if (code.trim() && code.trim().length > 50) {
      errors.code = 'Mã sản phẩm không được vượt quá 50 ký tự'
    }

    if (!name.trim()) {
      errors.name = 'Tên sản phẩm không được để trống'
    } else if (name.trim().length > 200) {
      errors.name = 'Tên sản phẩm không được vượt quá 200 ký tự'
    }

    const numPrice = Number(price)
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      errors.price = 'Giá sản phẩm phải lớn hơn 0'
    }

    if (!categoryId) {
      errors.categoryId = 'Vui lòng chọn danh mục cho sản phẩm'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError('')
    try {
      if (isEdit) {
        const updatePayload = {
          barcode: barcode.trim() || null,
          name: name.trim(),
          price: Number(price),
          categoryId: Number(categoryId),
          artisanId: artisanId ? Number(artisanId) : null,
          craftVillageId: craftVillageId ? Number(craftVillageId) : null,
          material: material.trim() || null,
          dimensions: dimensions.trim() || null,
          musicalRange: musicalRange.trim() || null,
          origin: origin.trim() || null,
          description: description.trim() || null,
          isActive: Boolean(isActive),
        }

        await adminProductService.updateProduct(productId, updatePayload)

        for (const mediaId of removedMediaIds) {
          await adminProductService.deleteMedia(productId, mediaId)
        }

        const existingMediaItems = mediaList.filter((m) => m.id)
        for (const m of existingMediaItems) {
          await adminProductService.updateMedia(productId, m.id, {
            mediaType: m.mediaType,
            url: m.url,
            altText: m.altText || null,
            sortOrder: m.sortOrder,
          })
        }

        const newMediaItems = mediaList.filter((m) => !m.id)
        for (const m of newMediaItems) {
          await adminProductService.addMedia(productId, {
            url: m.url,
            mediaType: m.mediaType,
            altText: m.altText || null,
            sortOrder: m.sortOrder || 0,
          })
        }

        addToast({
          message: `Đã cập nhật sản phẩm "${name.trim()}".`,
          type: 'success',
        })
        if (onSuccess) onSuccess(productId)
        handleClose()
      } else {
        const createPayload = {
          code: code.trim() ? code.trim().toUpperCase() : null,
          barcode: barcode.trim() || null,
          name: name.trim(),
          price: Number(price),
          categoryId: Number(categoryId),
          artisanId: artisanId ? Number(artisanId) : null,
          craftVillageId: craftVillageId ? Number(craftVillageId) : null,
          material: material.trim() || null,
          dimensions: dimensions.trim() || null,
          musicalRange: musicalRange.trim() || null,
          origin: origin.trim() || null,
          description: description.trim() || null,
          media: mediaList.map((m, idx) => ({
            url: m.url,
            mediaType: m.mediaType,
            altText: m.altText || null,
            sortOrder: idx,
          })),
        }

        const created = await adminProductService.createProduct(createPayload)
        addToast({
          message: `Đã tạo mới sản phẩm "${name.trim()}". Mã: ${created.code || 'đã tạo tự động'}. Tồn kho = 0.`,
          type: 'success',
        })
        if (onSuccess) onSuccess(created.id)
        handleClose()
      }
    } catch (err) {
      setServerError(err.message || 'Đã xảy ra lỗi khi lưu thông tin sản phẩm')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-modal-title"
      >
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E3E6E8] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
          {/* Modal Header */}
          <div className="px-6 py-4.5 border-b border-[#E3E6E8] flex items-center justify-between bg-[#FFFFFF]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm shrink-0">
                <IconInstrument size={20} />
              </div>
              <div>
                <h2 id="product-form-modal-title" className="text-lg font-bold text-ink">
                  {isEdit ? `Chỉnh sửa nhạc cụ: ${code}` : 'Thêm mới nhạc cụ truyền thống'}
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  {isEdit
                    ? 'Cập nhật thông số kỹ thuật, phân loại và bộ sưu tập đa phương tiện'
                    : 'Khai báo thông tin sản phẩm. Mã và mã vạch được tự động tạo nếu để trống.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-ink hover:bg-[#F2F4F5] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#F6F7F8]">
            {serverError && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {serverError}
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center text-sm text-secondary">
                Đang tải dữ liệu sản phẩm...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* 1. THÔNG TIN CƠ BẢN */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
                  <h3 className="text-base font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8] flex items-center justify-between">
                    <span>1. Thông tin cơ bản</span>
                    <span className="text-xs text-secondary font-normal">
                      * Các trường bắt buộc
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                    {/* If editing, show code as read-only */}
                    {isEdit ? (
                      <div className="p-3 bg-[#F6F7F8] rounded-xl border border-[#E3E6E8]">
                        <span className="text-xs font-semibold text-secondary block mb-0.5">
                          Mã sản phẩm (Không thể đổi)
                        </span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {code}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-1.5">
                          Mã nhạc cụ (tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="Để trống tự tạo (VD: M4N-DAY-0006)"
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                            formErrors.code ? 'border-rose-400 bg-rose-50/30' : 'border-[#E3E6E8]'
                          } bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono`}
                        />
                        {formErrors.code ? (
                          <span className="text-xs text-rose-500 mt-1 block">{formErrors.code}</span>
                        ) : (
                          <span className="text-xs text-secondary mt-1 block">
                            Hệ thống tự tạo mã chuẩn nếu để trống
                          </span>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Mã vạch (Barcode)
                      </label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Để trống tự tạo EAN-13"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono"
                      />
                      <span className="text-xs text-secondary mt-1 block">
                        Nhập từ máy quét hoặc để trống để tự tạo EAN-13
                      </span>
                    </div>

                    <div className={isEdit ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Tên sản phẩm nhạc cụ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Đàn Tranh 17 Dây Gỗ Mun Sừng Cao Cấp"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                          formErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-[#E3E6E8]'
                        } bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30`}
                      />
                      {formErrors.name && (
                        <span className="text-xs text-rose-500 mt-1 block">{formErrors.name}</span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="product-price" className="block text-sm font-semibold text-ink mb-1.5">
                        Đơn giá niêm yết (VND) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="product-price"
                          name="price"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={formatVndInput(price)}
                          onChange={(e) => {
                            setPrice(normalizeVndInput(e.target.value))
                            if (formErrors.price) {
                              setFormErrors((previous) => ({ ...previous, price: undefined }))
                            }
                          }}
                          placeholder="VD: 6.500.000"
                          aria-invalid={Boolean(formErrors.price)}
                          aria-describedby={formErrors.price ? 'product-price-error' : undefined}
                          className={`w-full rounded-xl border bg-[#FFFFFF] px-3.5 py-2.5 pr-10 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 ${
                            formErrors.price ? 'border-rose-400 bg-rose-50/30' : 'border-[#E3E6E8]'
                          }`}
                        />
                        <span
                          className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-semibold text-secondary"
                          aria-hidden="true"
                        >
                          ₫
                        </span>
                      </div>
                      {formErrors.price && (
                        <span id="product-price-error" className="text-xs text-rose-500 mt-1 block">
                          {formErrors.price}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col justify-end pb-1 sm:col-span-2 lg:col-span-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-ink">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 rounded text-brand focus:ring-brand"
                        />
                        <span>Đang kinh doanh (Hiển thị trên Catalog & POS)</span>
                      </label>
                      <span className="text-xs text-secondary mt-1">
                        Bỏ chọn để tạm ngừng bán sản phẩm này trên toàn hệ thống
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. PHÂN LOẠI, NGHỆ NHÂN & LÀNG NGHỀ */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
                  <h3 className="text-base font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8]">
                    2. Phân loại & xuất xứ di sản
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                    {/* Category Select */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-ink">
                          Danh mục <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-xs text-brand hover:underline font-semibold cursor-pointer"
                        >
                          + Quản lý
                        </button>
                      </div>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                          formErrors.categoryId ? 'border-rose-400 bg-rose-50/30' : 'border-[#E3E6E8]'
                        } bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30`}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                      {formErrors.categoryId && (
                        <span className="text-xs text-rose-500 mt-1 block">{formErrors.categoryId}</span>
                      )}
                    </div>

                    {/* Artisan Select */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-ink">
                          Nghệ nhân chế tác
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowArtisanModal(true)}
                          className="text-xs text-brand hover:underline font-semibold cursor-pointer"
                        >
                          + Quản lý
                        </button>
                      </div>
                      <select
                        value={artisanId}
                        onChange={(e) => handleArtisanChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        <option value="">-- Không chọn nghệ nhân cụ thể --</option>
                        {artisans.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Craft Village Select */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-ink">
                          Làng nghề truyền thống
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowVillageModal(true)}
                          className="text-xs text-brand hover:underline font-semibold cursor-pointer"
                        >
                          + Quản lý
                        </button>
                      </div>
                      <select
                        value={craftVillageId}
                        onChange={(e) => setCraftVillageId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        <option value="">-- Không chọn làng nghề cụ thể --</option>
                        {craftVillages.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.location || 'Chưa rõ'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. THÔNG SỐ KỸ THUẬT NHẠC CỤ */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
                  <h3 className="text-base font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8]">
                    3. Thông số kỹ thuật nhạc cụ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Chất liệu chế tác
                      </label>
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="VD: Gỗ mun sừng, gỗ ngô đồng..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Kích thước
                      </label>
                      <input
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="VD: Dài 115cm x Rộng 25cm"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Âm vực
                      </label>
                      <input
                        type="text"
                        value={musicalRange}
                        onChange={(e) => setMusicalRange(e.target.value)}
                        placeholder="VD: 3 quãng tám (Do2 - Do5)"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Xuất xứ địa phương
                      </label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="VD: Hà Nội, Việt Nam"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-sm font-semibold text-ink mb-1.5">
                        Mô tả chi tiết sản phẩm
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Mô tả âm sắc, quy trình thủ công, phụ kiện tặng kèm (bao da, khóa căn dây...)"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. HÌNH ẢNH & VIDEO */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
                  <h3 className="text-base font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8] flex items-center justify-between">
                    <span>4. Thư viện hình ảnh & video ({mediaList.length})</span>
                    <span className="text-xs text-secondary font-normal">
                      Chọn ảnh đại diện để hiển thị ngoài danh mục
                    </span>
                  </h3>

                  {/* Add Media Bar */}
                  <div className="p-3.5 bg-[#F6F7F8] rounded-xl border border-[#E3E6E8] mb-4.5 flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="Nhập URL hình ảnh hoặc video (VD: /assets/... hoặc https://...)"
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <select
                      value={newMediaType}
                      onChange={(e) => setNewMediaType(e.target.value)}
                      className="px-3.5 py-2 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      <option value="IMAGE">Ảnh (IMAGE)</option>
                      <option value="VIDEO">Video (VIDEO)</option>
                    </select>
                    <input
                      type="text"
                      value={newMediaAlt}
                      onChange={(e) => setNewMediaAlt(e.target.value)}
                      placeholder="Mô tả alt..."
                      className="px-3.5 py-2 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/30 sm:w-40"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedia}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Thêm ảnh</span>
                    </button>
                  </div>

                  {/* Media Grid */}
                  {mediaList.length === 0 ? (
                    <div className="py-10 text-center text-sm text-secondary border border-dashed border-[#E3E6E8] rounded-xl flex flex-col items-center gap-2">
                      <Image size={28} className="text-subtle" />
                      <span>Chưa có hình ảnh nào. Thêm URL hình ảnh ở trên để hiển thị trong bộ sưu tập.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
                      {mediaList.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className={`relative group rounded-xl border overflow-hidden flex flex-col bg-[#FFFFFF] ${
                            m.isPrimary
                              ? 'border-brand ring-2 ring-brand/20'
                              : 'border-[#E3E6E8]'
                          }`}
                        >
                          <div className="aspect-square bg-zinc-100 relative overflow-hidden flex items-center justify-center">
                            {m.mediaType === 'VIDEO' ? (
                              <span className="text-xs font-bold text-secondary">VIDEO</span>
                            ) : (
                              <img
                                src={m.url}
                                alt={m.altText || 'Media'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            )}
                            {m.isPrimary && (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-brand text-white text-xs font-semibold shadow-xs">
                                Ảnh chính
                              </span>
                            )}
                          </div>
                          <div className="p-2 flex items-center gap-1 bg-[#FFFFFF] border-t border-[#E3E6E8]">
                            {!m.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryMedia(idx)}
                                className="text-xs text-brand hover:underline font-semibold cursor-pointer"
                              >
                                Đặt chính
                              </button>
                            )}
                            <div className="ml-auto flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveMedia(idx, -1)}
                                disabled={idx === 0}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-secondary hover:bg-surface-secondary hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                                title="Di chuyển ảnh lên"
                                aria-label={`Di chuyển media ${idx + 1} lên`}
                              >
                                <ArrowUp size={14} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveMedia(idx, 1)}
                                disabled={idx === mediaList.length - 1}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-secondary hover:bg-surface-secondary hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                                title="Di chuyển ảnh xuống"
                                aria-label={`Di chuyển media ${idx + 1} xuống`}
                              >
                                <ArrowDown size={14} aria-hidden="true" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(idx)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-800 cursor-pointer"
                              title="Xóa ảnh"
                              aria-label="Xóa ảnh"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  {!isEdit ? (
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Package size={18} className="text-brand shrink-0" />
                      <span>
                        Tồn kho sản phẩm mới sẽ mặc định là 0. Quản lý kho qua chức năng <strong>Nhập kho</strong>.
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-2.5 rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] hover:bg-[#F2F4F5] text-sm font-semibold text-secondary hover:text-ink transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals for inline master data creation */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={loadMasterData}
      />
      <ArtisanManagementModal
        isOpen={showArtisanModal}
        onClose={() => setShowArtisanModal(false)}
        onSuccess={loadMasterData}
      />
      <CraftVillageManagementModal
        isOpen={showVillageModal}
        onClose={() => setShowVillageModal(false)}
        onSuccess={loadMasterData}
      />
    </>
  )
}
