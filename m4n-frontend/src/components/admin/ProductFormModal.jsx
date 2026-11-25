import { useState, useEffect, useCallback, useMemo } from 'react'
import adminProductService from '../../services/adminProductService.js'
import categoryService from '../../services/categoryService.js'
import artisanService from '../../services/artisanService.js'
import craftVillageService from '../../services/craftVillageService.js'
import useToast from '../ui/useToast.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Input from '../ui/Input.jsx'
import MoneyInput from '../ui/MoneyInput.jsx'
import ProductVariantFields from './ProductVariantFields.jsx'
import ProductVariantRows from './ProductVariantRows.jsx'
import ProductEditVariantsSection from './ProductEditVariantsSection.jsx'
import { matrixFormErrors, matrixVariantRequests, variantFormErrors, variantRequests } from '../../features/catalog/productVariantForm.js'
import { buildAttributeGroups, buildMissingVariantMatrix } from '../../features/catalog/variantOptions.js'
import CategoryManagementModal from './CategoryManagementModal.jsx'
import ArtisanManagementModal from './ArtisanManagementModal.jsx'
import CraftVillageManagementModal from './CraftVillageManagementModal.jsx'
import { IconInstrument } from '../ui/Icons.jsx'
import { ArrowDown, ArrowUp, X, Plus, Trash2, Image, Package } from 'lucide-react'

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  productId = null,
  variantSource = null,
  existingVariants = null,
  context = 'catalog',
}) {
  const { addToast } = useToast()
  const [switchedEdit, setSwitchedEdit] = useState(null)
  const activeEditId = switchedEdit?.base === productId ? switchedEdit.id : productId
  const isEdit = Boolean(activeEditId)
  const isVariant = !isEdit && Boolean(variantSource)
  const isInventoryContext = isVariant && context === 'inventory'

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
  const [variantLabel, setVariantLabel] = useState('')
  const [option1Name, setOption1Name] = useState('')
  const [option2Name, setOption2Name] = useState('')
  const [option1Value, setOption1Value] = useState('')
  const [option2Value, setOption2Value] = useState('')
  const [variantRows, setVariantRows] = useState([])
  const [matrixConfig, setMatrixConfig] = useState({
    enabled: false,
    option1Name: '',
    option1Values: [],
    useOption2: false,
    option2Name: '',
    option2Values: [],
  })
  const [matrixRows, setMatrixRows] = useState([])
  const [price, setPrice] = useState('')
  const [billableWeightKg, setBillableWeightKg] = useState('')
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
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaType, setNewMediaType] = useState('IMAGE')
  const [newMediaAlt, setNewMediaAlt] = useState('')

  const [loading, setLoading] = useState(Boolean(productId || variantSource))
  const [switchingVariant, setSwitchingVariant] = useState(false)
  const [masterDataError, setMasterDataError] = useState('')
  const [masterDataReady, setMasterDataReady] = useState(false)
  const [productReady, setProductReady] = useState(!productId && !variantSource)
  const [siblingVariants, setSiblingVariants] = useState([])
  const [loadingSiblings, setLoadingSiblings] = useState(Boolean((productId || variantSource) && !existingVariants?.length))
  const [loadedFamilyId, setLoadedFamilyId] = useState(null)
  const [editStructuredEnabled, setEditStructuredEnabled] = useState(false)
  const [editUseOption2, setEditUseOption2] = useState(false)
  const [originalOption2Name, setOriginalOption2Name] = useState('')
  const [option2Assignments, setOption2Assignments] = useState({})
  const [addedOption1Values, setAddedOption1Values] = useState([])
  const [addedOption2Values, setAddedOption2Values] = useState([])
  const [editNewRows, setEditNewRows] = useState([])
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState(null)
  const [initialEditSnapshot, setInitialEditSnapshot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const resetFormFields = useCallback(() => {
    setCode('')
    setBarcode('')
    setName('')
    setVariantLabel('')
    setOption1Name('')
    setOption2Name('')
    setOption1Value('')
    setOption2Value('')
    setVariantRows([])
    setMatrixConfig({
      enabled: false,
      option1Name: '',
      option1Values: [],
      useOption2: false,
      option2Name: '',
      option2Values: [],
    })
    setMatrixRows([])
    setPrice('')
    setBillableWeightKg('')
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
    setSiblingVariants([])
    setLoadingSiblings(false)
    setLoadedFamilyId(null)
    setEditStructuredEnabled(false)
    setEditUseOption2(false)
    setOriginalOption2Name('')
    setOption2Assignments({})
    setAddedOption1Values([])
    setAddedOption2Values([])
    setEditNewRows([])
    setPendingSwitchTarget(null)
    setInitialEditSnapshot('')
    setSwitchedEdit(null)
    setSwitchingVariant(false)
    setFormErrors({})
    setServerError('')
  }, [])

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
      setMasterDataReady(true)
      setMasterDataError('')
    } catch (error) {
      setMasterDataError(error.message || 'Không thể tải dữ liệu phân loại. Vui lòng tải lại trước khi lưu.')
    }
  }, [])

  // Load master data & sibling variants once when modal opens (never re-fetch on sibling SKU switches)
  useEffect(() => {
    if (!isOpen) return
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
        setMasterDataReady(true)
      }
    }).catch((error) => {
      if (active) setMasterDataError(error.message || 'Không thể tải dữ liệu phân loại. Vui lòng tải lại trước khi lưu.')
    })

    const initialVariantTargetId = variantSource ? variantSource.id : productId
    if (initialVariantTargetId && !(Array.isArray(existingVariants) && existingVariants.length > 0)) {
      adminProductService.listVariants(initialVariantTargetId)
        .then((pageData) => {
          if (active) {
            setSiblingVariants(pageData?.content || (variantSource ? [variantSource] : []))
            setLoadingSiblings(false)
          }
        })
        .catch(() => {
          if (active) {
            setSiblingVariants(variantSource ? [variantSource] : [])
            setLoadingSiblings(false)
          }
        })
    }

    return () => {
      active = false
    }
  }, [isOpen, productId, variantSource, existingVariants])

  // Load only the selected SKU detail — keeps form mounted and scroll position intact when switching siblings
  useEffect(() => {
    if (!isOpen) return
    if (!activeEditId && !variantSource) return
    let active = true

    const request = variantSource ? Promise.resolve(variantSource) : adminProductService.getProductDetail(activeEditId)
    request
      .then((p) => {
        if (active) {
          setServerError('')
          setFormErrors({})
          setAddedOption1Values([])
          setAddedOption2Values([])
          setEditNewRows([])
          setVariantRows([])
          setOption2Assignments({})
          setPendingSwitchTarget(null)
          const nextCode = variantSource ? '' : p.code || ''
          const nextBarcode = variantSource ? '' : p.barcode || ''
          const nextName = p.name || ''
          const nextVariantLabel = variantSource ? '' : p.variantLabel || ''
          const nextOpt1Name = p.option1Name || ''
          const nextOpt2Name = p.option2Name || ''
          const nextOpt1Val = variantSource ? '' : p.option1Value || ''
          const nextOpt2Val = variantSource ? '' : p.option2Value || ''
          const nextPrice = p.price != null ? String(p.price) : ''
          const nextWeight = p.billableWeightKg == null ? '' : String(p.billableWeightKg)
          const nextCatId = p.category?.id ? String(p.category.id) : ''
          const nextArtId = p.artisan?.id ? String(p.artisan.id) : ''
          const nextVilId = p.craftVillage?.id ? String(p.craftVillage.id) : ''
          const nextMaterial = p.material || ''
          const nextDimensions = p.dimensions || ''
          const nextMusicalRange = p.musicalRange || ''
          const nextOrigin = p.origin || ''
          const nextDescription = p.description || ''
          const nextIsActive = variantSource ? true : Boolean(p.isActive)
          setCode(nextCode)
          setBarcode(nextBarcode)
          setName(nextName)
          setVariantLabel(nextVariantLabel)
          setOption1Name(nextOpt1Name)
          setOption2Name(nextOpt2Name)
          setOption1Value(nextOpt1Val)
          setOption2Value(nextOpt2Val)
          setPrice(nextPrice)
          setBillableWeightKg(nextWeight)
          setCategoryId(nextCatId)
          setArtisanId(nextArtId)
          setCraftVillageId(nextVilId)
          setMaterial(nextMaterial)
          setDimensions(nextDimensions)
          setMusicalRange(nextMusicalRange)
          setOrigin(nextOrigin)
          setDescription(nextDescription)
          setIsActive(nextIsActive)
          setLoadedFamilyId(p.familyId || null)
          setEditStructuredEnabled(Boolean(nextOpt1Name))
          setEditUseOption2(Boolean(nextOpt2Name))
          setOriginalOption2Name(nextOpt2Name)
          const sortedMedia = [...(p.media || [])].sort(
            (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
          )
          const mappedMedia = sortedMedia.map((m, index) => ({
            id: m.id,
            url: m.url,
            mediaType: m.type || 'IMAGE',
            altText: m.alt || '',
            isPrimary: index === 0,
            sortOrder: index,
          }))
          setMediaList(mappedMedia)
          if (!variantSource) {
            setInitialEditSnapshot(JSON.stringify({
              barcode: nextBarcode, name: nextName, variantLabel: nextVariantLabel,
              option1Name: nextOpt1Name, option2Name: nextOpt2Name,
              option1Value: nextOpt1Val, option2Value: nextOpt2Val,
              price: nextPrice, billableWeightKg: nextWeight,
              categoryId: nextCatId, artisanId: nextArtId, craftVillageId: nextVilId,
              material: nextMaterial, dimensions: nextDimensions,
              musicalRange: nextMusicalRange, origin: nextOrigin,
              description: nextDescription, isActive: nextIsActive,
              media: mappedMedia.map((m) => `${m.id || ''}|${m.url}|${m.mediaType}|${m.altText}|${m.sortOrder}`),
            }))
          }
          setProductReady(true)
          setLoading(false)
          setSwitchingVariant(false)
        }
      })
      .catch((err) => {
        if (active) {
          setServerError(err.message || 'Không thể tải thông tin sản phẩm')
          setLoading(false)
          setSwitchingVariant(false)
        }
      })

    return () => {
      active = false
    }
  }, [isOpen, activeEditId, variantSource])

  const handleClose = () => {
    if (submitting) return
    resetFormFields()
    onClose()
  }

  const dialogRef = useDialogFocus(isOpen, () => handleClose(), submitting)

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
    if (submitting) return
    if (!newMediaUrl.trim()) return
    if (newMediaUrl.trim().length > 500 || newMediaAlt.trim().length > 255) {
      setFormErrors((current) => ({ ...current, media: 'Đường dẫn media tối đa 500 ký tự; mô tả thay thế tối đa 255 ký tự.' }))
      return
    }
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
    setFormErrors((current) => ({ ...current, media: undefined }))
  }

  const handleRemoveMedia = (index) => {
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
  }

  const useMatrix = !isEdit && !isVariant && matrixConfig.enabled
  const hasStructuredOptions = isEdit ? (editStructuredEnabled || Boolean(option1Name.trim())) : Boolean(option1Name.trim())
  const effectiveUseOption2 = isEdit ? editUseOption2 : Boolean(option2Name.trim())
  const addingSecondOption = isEdit && editUseOption2 && !originalOption2Name
  const additionalVariantCount = hasStructuredOptions ? editNewRows.length : variantRows.length

  const resolvedSiblings = useMemo(
    () => (Array.isArray(existingVariants) && existingVariants.length > 0 ? existingVariants : siblingVariants),
    [existingVariants, siblingVariants],
  )

  const existingAttributeGroups = useMemo(
    () => (resolvedSiblings.length ? buildAttributeGroups(resolvedSiblings) : { option1Values: [], option2Values: [] }),
    [resolvedSiblings],
  )

  const isEditDirty = useMemo(() => {
    if (!isEdit || !initialEditSnapshot) return false
    if (Object.keys(option2Assignments).length || variantRows.length > 0 || editNewRows.length > 0 || addedOption1Values.length > 0 || addedOption2Values.length > 0) return true
    const currentSnapshot = JSON.stringify({
      barcode, name, variantLabel, option1Name, option2Name,
      option1Value, option2Value, price, billableWeightKg,
      categoryId, artisanId, craftVillageId,
      material, dimensions, musicalRange, origin, description, isActive,
      media: mediaList.map((m) => `${m.id || ''}|${m.url}|${m.mediaType}|${m.altText}|${m.sortOrder}`),
    })
    return currentSnapshot !== initialEditSnapshot
  }, [
    isEdit, initialEditSnapshot, option2Assignments, variantRows.length, editNewRows.length,
    addedOption1Values.length, addedOption2Values.length,
    barcode, name, variantLabel, option1Name, option2Name,
    option1Value, option2Value, price, billableWeightKg,
    categoryId, artisanId, craftVillageId,
    material, dimensions, musicalRange, origin, description, isActive, mediaList,
  ])

  const recomputeEditNewRows = (nextAdded1, nextAdded2, nextUseOpt2 = editUseOption2, nextOpt1Val = option1Value, nextOpt2Val = option2Value, prevRows = editNewRows, assignments = option2Assignments) => {
    if (!nextAdded1.length && !nextAdded2.length) {
      setEditNewRows([])
      return
    }
    const base1 = [...existingAttributeGroups.option1Values, ...(nextOpt1Val.trim() ? [nextOpt1Val.trim()] : []), ...nextAdded1]
    const base2 = nextUseOpt2
      ? [...existingAttributeGroups.option2Values, ...(!originalOption2Name ? Object.values(assignments).filter(Boolean) : []), ...(nextOpt2Val.trim() ? [nextOpt2Val.trim()] : []), ...nextAdded2]
      : []
    const existingWithoutSelf = resolvedSiblings.filter((item) => Number(item.id) !== Number(activeEditId))
      .map((item) => !originalOption2Name && nextUseOpt2 ? { ...item, option2Value: assignments[item.id] || '' } : item)
    const effectiveExisting = [
      ...existingWithoutSelf,
      ...(nextOpt1Val.trim() ? [{ id: activeEditId, option1Value: nextOpt1Val.trim(), option2Value: nextUseOpt2 ? nextOpt2Val.trim() : '' }] : []),
    ]
    setEditNewRows(buildMissingVariantMatrix(base1, base2, effectiveExisting, prevRows, price))
  }

  const handleOption2Assignment = (id, value) => {
    const assignments = { ...option2Assignments, [id]: value }
    setOption2Assignments(assignments)
    const selectedValue = Number(id) === Number(activeEditId) ? value : option2Value
    if (Number(id) === Number(activeEditId)) setOption2Value(value)
    recomputeEditNewRows(addedOption1Values, addedOption2Values, editUseOption2, option1Value, selectedValue, editNewRows, assignments)
    setFormErrors((current) => ({ ...current, [`option2Assignments[${id}]`]: '', option2Value: '' }))
  }

  const switchToEditVariant = (variantId) => {
    setPendingSwitchTarget(null)
    setSwitchingVariant(true)
    setSwitchedEdit({ base: productId, id: variantId })
  }

  const handleRequestSwitchSibling = (variant) => {
    if (!variant || Number(variant.id) === Number(activeEditId) || submitting || switchingVariant) return
    if (isEditDirty) {
      setPendingSwitchTarget(variant)
      return
    }
    switchToEditVariant(variant.id)
  }

  const existingComboKeys = useMemo(() => {
    const keys = new Set()
    for (const item of resolvedSiblings) {
      if (isEdit && Number(item.id) === Number(activeEditId)) continue
      if (hasStructuredOptions && item.option1Value) {
        const v1 = item.option1Value.trim().normalize('NFC')
        const v2 = effectiveUseOption2 ? ((addingSecondOption ? option2Assignments[item.id] : item.option2Value) || '').trim().normalize('NFC') : ''
        const combined = (effectiveUseOption2 ? `${v1} · ${v2}` : v1).toLocaleLowerCase('vi')
        if (v1 && (!effectiveUseOption2 || v2)) keys.add(combined)
      } else if (item.variantLabel) {
        keys.add(item.variantLabel.trim().normalize('NFC').toLocaleLowerCase('vi'))
      }
    }
    return keys
  }, [resolvedSiblings, isEdit, activeEditId, hasStructuredOptions, effectiveUseOption2, addingSecondOption, option2Assignments])

  const liveDuplicateWarning = useMemo(() => {
    if ((!isVariant && !isEdit) || !existingComboKeys.size) return ''
    if (hasStructuredOptions) {
      const v1 = option1Value.trim().normalize('NFC')
      const v2 = effectiveUseOption2 ? option2Value.trim().normalize('NFC') : ''
      if (!v1 || (effectiveUseOption2 && !v2)) return ''
      const combined = (effectiveUseOption2 ? `${v1} · ${v2}` : v1).toLocaleLowerCase('vi')
      return existingComboKeys.has(combined)
        ? `Tổ hợp “${effectiveUseOption2 ? `${v1} · ${v2}` : v1}” đã tồn tại. Hãy chọn hoặc nhập tổ hợp khác.`
        : ''
    }
    const labelKey = variantLabel.trim().normalize('NFC').toLocaleLowerCase('vi')
    return labelKey && existingComboKeys.has(labelKey)
      ? `Biến thể “${variantLabel.trim()}” đã tồn tại trên hệ thống.`
      : ''
  }, [isVariant, isEdit, existingComboKeys, hasStructuredOptions, option1Value, option2Value, effectiveUseOption2, variantLabel])

  const validate = () => {
    const errors = {}
    if (!useMatrix && code.trim() && code.trim().length > 50) {
      errors.code = 'Mã sản phẩm không được vượt quá 50 ký tự'
    }

    if (!name.trim()) {
      errors.name = 'Tên sản phẩm không được để trống'
    } else if (name.trim().length > 200) {
      errors.name = 'Tên sản phẩm không được vượt quá 200 ký tự'
    }

    if (!useMatrix) {
      const numPrice = Number(price)
      if (!/^\d+(\.\d{1,2})?$/.test(price) || !Number.isFinite(numPrice) || numPrice <= 0 || numPrice > 999999999999.99) {
        errors.price = 'Giá niêm yết phải lớn hơn 0, tối đa 999.999.999.999,99đ và 2 chữ số thập phân.'
      }
    }
    if (!billableWeightKg.trim()) {
      errors.billableWeightKg = 'Vui lòng nhập khối lượng.'
    } else if (!Number.isFinite(Number(billableWeightKg)) || Number(billableWeightKg) <= 0) {
      errors.billableWeightKg = 'Khối lượng phải lớn hơn 0.'
    }

    if (!categoryId) {
      errors.categoryId = 'Vui lòng chọn danh mục cho sản phẩm'
    }

    for (const [field, value, limit] of [
      ['barcode', barcode, 100], ['material', material, 255],
      ['dimensions', dimensions, 100], ['musicalRange', musicalRange, 100],
      ['origin', origin, 150],
    ]) {
      if (value.trim().length > limit) errors[field] = `Trường này tối đa ${limit} ký tự.`
    }

    if (useMatrix) {
      Object.assign(errors, matrixFormErrors(matrixConfig, matrixRows))
    } else if (hasStructuredOptions) {
      if (addingSecondOption) {
        for (const sku of resolvedSiblings) {
          const value = (option2Assignments[sku.id] || '').trim()
          if (!value || value.length > 48) errors[`option2Assignments[${sku.id}]`] = 'Nhập giá trị nhóm 2 cho SKU này, tối đa 48 ký tự.'
        }
      }
      const structuredRows = [
        { option1Value, option2Value, price, code, barcode },
        ...variantRows,
      ]
      Object.assign(
        errors,
        matrixFormErrors(
          { option1Name, option2Name, useOption2: effectiveUseOption2 },
          structuredRows,
          { firstRowTopLevel: true, existingCombos: (isVariant || isEdit) ? existingComboKeys : null },
        ),
      )
      if (isEdit && editNewRows.length > 0) {
        const activeComboKey = option1Value.trim()
          ? (effectiveUseOption2
            ? `${option1Value.trim().normalize('NFC')} · ${option2Value.trim().normalize('NFC')}`
            : option1Value.trim().normalize('NFC')).toLocaleLowerCase('vi')
          : ''
        const combinedExisting = new Set(existingComboKeys)
        if (activeComboKey) combinedExisting.add(activeComboKey)
        const newRowErrors = matrixFormErrors(
          { option1Name, option2Name, useOption2: effectiveUseOption2 },
          editNewRows,
          { existingCombos: combinedExisting },
        )
        for (const [key, msg] of Object.entries(newRowErrors)) {
          if (key.startsWith('variants[')) {
            errors[key.replace(/^variants\[/, 'newVariants[')] = msg
          } else if (!errors[key]) {
            errors[key] = msg
          }
        }
        const activeCodeUpper = code.trim().toUpperCase()
        const activeBarcodeUpper = barcode.trim().toUpperCase()
        editNewRows.forEach((row, index) => {
          if (activeCodeUpper && (row.code || '').trim().toUpperCase() === activeCodeUpper) {
            errors[`newVariants[${index}].code`] = 'SKU trùng với biến thể đang chỉnh sửa.'
          }
          if (activeBarcodeUpper && (row.barcode || '').trim().toUpperCase() === activeBarcodeUpper) {
            errors[`newVariants[${index}].barcode`] = 'Mã vạch trùng với biến thể đang chỉnh sửa.'
          }
        })
      }
    } else {
      Object.assign(errors, variantFormErrors({ variantLabel, code, barcode, price }, variantRows, isVariant))
      if ((isVariant || isEdit) && existingComboKeys.size) {
        const allFlat = [{ label: variantLabel }, ...variantRows]
        allFlat.forEach((row, index) => {
          const key = (row.label || '').trim().normalize('NFC').toLocaleLowerCase('vi')
          const fieldKey = index ? `variants[${index}].variantLabel` : 'variantLabel'
          if (key && !errors[fieldKey] && existingComboKeys.has(key)) {
            errors[fieldKey] = 'Biến thể này đã tồn tại trên hệ thống.'
          }
        })
      }
    }
    setFormErrors(errors)
    if (Object.keys(errors).length) requestAnimationFrame(() => {
      const invalid = dialogRef.current?.querySelector('[aria-invalid="true"]')
      const details = invalid?.closest('details')
      if (details) details.open = true
      invalid?.focus()
    })
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || switchingVariant || loading || !masterDataReady || !productReady || masterDataError) return
    if (!validate()) return

    setSubmitting(true)
    setServerError('')
    try {
      if (isEdit) {
        const computedLabel = hasStructuredOptions
          ? (effectiveUseOption2 ? `${option1Value.trim()} · ${option2Value.trim()}` : option1Value.trim())
          : (variantLabel.trim() || null)
        const updatePayload = {
          barcode: barcode.trim() || null,
          name: name.trim(),
          variantLabel: computedLabel,
          option1Name: hasStructuredOptions ? option1Name.trim() : null,
          option2Name: hasStructuredOptions && effectiveUseOption2 ? option2Name.trim() : null,
          option1Value: hasStructuredOptions ? option1Value.trim() : null,
          option2Value: hasStructuredOptions && effectiveUseOption2 ? option2Value.trim() : null,
          ...(addingSecondOption ? { option2Assignments: Object.fromEntries(
            resolvedSiblings.map((sku) => [sku.id, (option2Assignments[sku.id] || '').trim()]),
          ) } : {}),
          price: Number(price),
          billableWeightKg: billableWeightKg === '' ? null : Number(billableWeightKg),
          categoryId: Number(categoryId),
          artisanId: artisanId ? Number(artisanId) : null,
          craftVillageId: craftVillageId ? Number(craftVillageId) : null,
          material: material.trim() || null,
          dimensions: dimensions.trim() || null,
          musicalRange: musicalRange.trim() || null,
          origin: origin.trim() || null,
          description: description.trim() || null,
          isActive: Boolean(isActive),
          media: mediaList.map((media, index) => ({
            id: media.id || null,
            mediaType: media.mediaType,
            url: media.url,
            altText: media.altText || null,
            sortOrder: index,
          })),
        }

        const updated = await adminProductService.updateProduct(activeEditId, updatePayload)

        if (additionalVariantCount > 0) {
          const familyIdToUse = updated?.familyId || loadedFamilyId
          const inheritedMedia = (updated?.media || mediaList).map((m, idx) => ({
            url: m.url,
            mediaType: m.type || m.mediaType || 'IMAGE',
            altText: m.alt || m.altText || null,
            sortOrder: idx,
          }))
          const batchBase = {
            familyId: familyIdToUse,
            isActive: true,
            name: name.trim(),
            billableWeightKg: billableWeightKg === '' ? null : Number(billableWeightKg),
            categoryId: Number(categoryId),
            artisanId: artisanId ? Number(artisanId) : null,
            craftVillageId: craftVillageId ? Number(craftVillageId) : null,
            material: material.trim() || null,
            dimensions: dimensions.trim() || null,
            musicalRange: musicalRange.trim() || null,
            origin: origin.trim() || null,
            description: description.trim() || null,
            media: inheritedMedia,
          }
          try {
            const createdExtra = await adminProductService.createVariants(
              hasStructuredOptions
                ? matrixVariantRequests(batchBase, { option1Name, option2Name, useOption2: effectiveUseOption2 }, editNewRows)
                : variantRequests(batchBase, variantRows).slice(1),
            )
            addToast({
              message: `Đã cập nhật “${name.trim()}” và tạo thêm ${createdExtra.length} biến thể mới (tồn kho = 0).`,
              type: 'success',
            })
          } catch (createErr) {
            const fields = createErr.fieldErrors || createErr.data?.fieldErrors || {}
            setFormErrors(Object.fromEntries(Object.entries(fields).map(([key, msg]) => [
              hasStructuredOptions ? key.replace(/^variants\[/, 'newVariants[')
                : key.replace(/^variants\[(\d+)\]/, (_, index) => `variants[${Number(index) + 1}]`),
              msg,
            ])))
            setServerError(`Đã lưu thay đổi cho ${code}, nhưng chưa tạo được các biến thể mới: ${createErr.message || 'Vui lòng kiểm tra lại.'}`)
            if (onSuccess) onSuccess(activeEditId)
            adminProductService.listVariants(activeEditId).then((pageData) => {
              if (pageData?.content) setSiblingVariants(pageData.content)
            }).catch(() => {})
            return
          }
        } else {
          addToast({
            message: `Đã cập nhật sản phẩm "${name.trim()}".`,
            type: 'success',
          })
        }
        if (onSuccess) onSuccess(activeEditId)
        resetFormFields()
        onClose()
      } else {
        const computedLabel = hasStructuredOptions
          ? (option2Name.trim() ? `${option1Value.trim()} · ${option2Value.trim()}` : option1Value.trim())
          : (variantLabel.trim() || null)
        const createPayload = {
          familyId: isVariant ? variantSource.familyId : null,
          isActive: Boolean(isActive),
          code: code.trim() ? code.trim().toUpperCase() : null,
          barcode: barcode.trim() || null,
          name: name.trim(),
          variantLabel: computedLabel,
          option1Name: hasStructuredOptions ? option1Name.trim() : null,
          option2Name: hasStructuredOptions && option2Name.trim() ? option2Name.trim() : null,
          option1Value: hasStructuredOptions ? option1Value.trim() : null,
          option2Value: hasStructuredOptions && option2Name.trim() ? option2Value.trim() : null,
          price: useMatrix ? Number(matrixRows[0]?.price || 1) : Number(price),
          billableWeightKg: billableWeightKg === '' ? null : Number(billableWeightKg),
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

        let createdVariants
        if (useMatrix) {
          createdVariants = await adminProductService.createVariants(
            matrixVariantRequests(createPayload, matrixConfig, matrixRows),
          )
        } else if (variantRows.length) {
          const batch = hasStructuredOptions
            ? matrixVariantRequests(createPayload, { option1Name, option2Name, useOption2: Boolean(option2Name.trim()) }, [
              { option1Value, option2Value, price, code, barcode },
              ...variantRows,
            ])
            : variantRequests(createPayload, variantRows)
          createdVariants = await adminProductService.createVariants(batch)
        } else {
          createdVariants = [await adminProductService.createProduct(createPayload)]
        }
        const created = createdVariants[0]
        addToast({
          message: createdVariants.length > 1 ? `Đã tạo ${createdVariants.length} biến thể cho “${name.trim()}”. Nhập kho riêng cho từng biến thể.`
            : isVariant ? `Đã thêm biến thể “${computedLabel}” cho “${variantSource.familyName || variantSource.name}”. Mã: ${created.code || 'đã tạo tự động'}. Tồn kho = 0.`
              : `Đã tạo mới sản phẩm "${name.trim()}". Mã: ${created.code || 'đã tạo tự động'}. Tồn kho = 0.`,
          type: 'success',
        })
        if (onSuccess) onSuccess(created.id)
        resetFormFields()
        onClose()
      }
    } catch (err) {
      const fields = err.fieldErrors || err.data?.fieldErrors || {}
      setFormErrors(Object.fromEntries(Object.entries(fields).map(([key, message]) => [key.replace(/^variants\[0\]\./, ''), message])))
      setServerError(err.message || 'Đã xảy ra lỗi khi lưu thông tin sản phẩm')
      requestAnimationFrame(() => {
        const invalid = dialogRef.current?.querySelector('[aria-invalid="true"]')
        const details = invalid?.closest('details')
        if (details) details.open = true
        if (invalid) invalid.focus()
        else dialogRef.current?.querySelector('[role="alert"]')?.focus()
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-modal-title"
      >
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E3E6E8] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
          {/* Modal Header */}
          <div className="px-6 py-4.5 border-b border-[#E3E6E8] flex items-center justify-between bg-[#FFFFFF]">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm shrink-0">
                <IconInstrument size={20} />
              </div>
              <div className="min-w-0">
                <h2 id="product-form-modal-title" className="break-words text-lg font-bold text-ink">
                  {isEdit ? `Chỉnh sửa nhạc cụ: ${code}` : isVariant ? `Thêm biến thể cho “${variantSource.familyName || variantSource.name}”` : 'Thêm mới nhạc cụ truyền thống'}
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  {isEdit
                    ? 'Cập nhật thông số kỹ thuật, phân loại và bộ sưu tập đa phương tiện'
                    : isVariant
                      ? hasStructuredOptions
                        ? `Khai báo tổ hợp mới theo ${option1Name}${option2Name ? ` × ${option2Name}` : ''} và giá bán niêm yết. Biến thể mới có tồn kho = 0; SKU và mã vạch tự tạo nếu để trống.`
                        : 'Khai báo phiên bản mới và giá bán niêm yết. Biến thể mới có tồn kho = 0; SKU và mã vạch tự tạo nếu để trống.'
                      : 'Khai báo thông tin sản phẩm. Mã và mã vạch được tự động tạo nếu để trống.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center text-secondary hover:text-ink hover:bg-[#F2F4F5] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#F6F7F8]">
            {serverError && (
              <div role="alert" tabIndex={-1} className="mb-5 p-4 rounded-xl bg-[#FFFFFF] border border-rose-200 text-rose-700 text-sm font-medium">
                {serverError}
              </div>
            )}

            {masterDataError && (
              <div role="alert" className="mb-5 rounded-xl border border-danger p-4 text-sm text-danger">
                <p>{masterDataError}</p>
                <button type="button" onClick={loadMasterData} className="mt-2 underline">Tải lại dữ liệu phân loại</button>
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center text-sm text-secondary">
                Đang tải dữ liệu sản phẩm...
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
                <fieldset disabled={submitting || !masterDataReady || !productReady} className="contents">
                  {/* 1. THÔNG TIN CƠ BẢN */}
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
                    <h3 className="text-base font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8] flex items-center justify-between">
                      <span>{isVariant ? '1. Thông tin biến thể mới' : '1. Thông tin cơ bản'}</span>
                      <span className="text-xs text-secondary font-normal">
                        * Các trường bắt buộc
                      </span>
                    </h3>

                    {isVariant && (
                      <p className="mb-4 text-sm text-secondary">
                        {isInventoryContext
                          ? `Tạo thêm biến thể mới (tồn kho ban đầu = 0) trước khi lập phiếu nhập hàng. Chọn hoặc nhập ${hasStructuredOptions ? `${option1Name}${option2Name ? ` và ${option2Name}` : ''}` : 'tên biến thể'} cùng giá bán lẻ niêm yết bên dưới — số lượng và đơn giá nhập sẽ khai báo ở bước quay lại.`
                          : `Phần thông tin này tạo 1 biến thể mới thuộc sản phẩm gốc. Chọn hoặc nhập ${hasStructuredOptions ? `${option1Name}${option2Name ? ` và ${option2Name}` : ''}` : 'tên biến thể'} và giá bán niêm yết bên dưới. Giá có thể giống hoặc khác các biến thể đã có.`}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                      {!useMatrix && (
                        <>
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
                              <label htmlFor="product-code" className="block text-sm font-semibold text-ink mb-1.5">
                                Mã nhạc cụ (tùy chọn)
                              </label>
                              <input id="product-code" name="code" maxLength={50} aria-invalid={Boolean(formErrors.code)} aria-describedby={formErrors.code ? 'product-code-error' : undefined}
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Để trống tự tạo (VD: M4N-DAY-0006)"
                                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                                  formErrors.code ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E3E6E8]'
                                } bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono`}
                              />
                              {formErrors.code ? (
                                <span id="product-code-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.code}</span>
                              ) : (
                                <span className="text-xs text-secondary mt-1 block">
                                  Hệ thống tự tạo mã chuẩn nếu để trống
                                </span>
                              )}
                            </div>
                          )}

                          <div>
                            <label htmlFor="product-barcode" className="block text-sm font-semibold text-ink mb-1.5">
                              Mã vạch (Barcode)
                            </label>
                            <input id="product-barcode" name="barcode" maxLength={100} aria-invalid={Boolean(formErrors.barcode)} aria-describedby={formErrors.barcode ? 'product-barcode-error' : undefined}
                              type="text"
                              value={barcode}
                              onChange={(e) => { setBarcode(e.target.value); setFormErrors((previous) => ({ ...previous, barcode: '' })) }}
                              placeholder="Để trống tự tạo EAN-13"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono"
                            />
                            {formErrors.barcode && <span id="product-barcode-error" role="alert" className="text-xs text-danger mt-1 block">{formErrors.barcode}</span>}
                            <span className="text-xs text-secondary mt-1 block">
                              Nhập từ máy quét hoặc để trống để tự tạo EAN-13
                            </span>
                          </div>
                        </>
                      )}

                      <div className={useMatrix ? 'sm:col-span-2 lg:col-span-3' : 'sm:col-span-2'}>
                        <label htmlFor="product-name" className="block text-sm font-semibold text-ink mb-1.5">
                          Tên sản phẩm nhạc cụ <span className="text-rose-500">*</span>
                        </label>
                        <input id="product-name" name="name" maxLength={200} readOnly={isVariant} aria-invalid={Boolean(formErrors.name)} aria-describedby={formErrors.name ? 'product-name-error' : isVariant ? 'product-name-source' : undefined}
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="VD: Đàn Tranh 17 Dây Gỗ Mun Sừng Cao Cấp"
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                            formErrors.name ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E3E6E8]'
                          } bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30`}
                        />
                        {isVariant && <p id="product-name-source" className="mt-1 text-xs text-secondary">Biến thể mới thuộc sản phẩm này. Đổi tên chung trong phần chỉnh sửa sản phẩm.</p>}
                        {formErrors.name && (
                          <span id="product-name-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.name}</span>
                        )}
                      </div>

                      {!useMatrix && (
                        <>
                          {(isVariant || isEdit) && (
                            <ProductVariantFields
                              label={variantLabel}
                              required={isVariant || variantRows.length > 0 || hasStructuredOptions}
                              onLabelChange={(value) => { setVariantLabel(value); setFormErrors((previous) => ({ ...previous, variantLabel: '' })) }}
                              error={formErrors.variantLabel}
                              option1Name={hasStructuredOptions ? (option1Name || 'Nhóm phân loại 1') : ''}
                              option2Name={hasStructuredOptions && effectiveUseOption2 ? (option2Name || 'Nhóm phân loại 2') : ''}
                              option1Value={option1Value}
                              option2Value={option2Value}
                              onOption1ValueChange={(value) => {
                                setOption1Value(value)
                                setFormErrors((previous) => ({ ...previous, option1Value: '', variantLabel: '' }))
                                if (isEdit && (addedOption1Values.length || addedOption2Values.length)) {
                                  recomputeEditNewRows(addedOption1Values, addedOption2Values, editUseOption2, value, option2Value)
                                }
                              }}
                              onOption2ValueChange={(value) => {
                                if (addingSecondOption) {
                                  handleOption2Assignment(activeEditId, value)
                                  return
                                }
                                setOption2Value(value)
                                setFormErrors((previous) => ({ ...previous, option2Value: '', variantLabel: '' }))
                                if (isEdit && (addedOption1Values.length || addedOption2Values.length)) {
                                  recomputeEditNewRows(addedOption1Values, addedOption2Values, editUseOption2, option1Value, value)
                                }
                              }}
                              option1Error={formErrors.option1Value}
                              option2Error={formErrors.option2Value}
                              option1Suggestions={(isVariant || isEdit) ? existingAttributeGroups.option1Values : []}
                              option2Suggestions={(isVariant || isEdit) ? existingAttributeGroups.option2Values : []}
                              existingComboWarning={liveDuplicateWarning}
                            />
                          )}
                          <MoneyInput id="product-price" name="price" label={isVariant ? 'Giá bán niêm yết (VND)' : 'Đơn giá niêm yết (VND)'} required
                            value={price} error={formErrors.price} placeholder="Ví dụ: 6.500.000"
                            helperText={isInventoryContext ? 'Giá bán ra cho khách (không phải đơn giá nhập kho).' : undefined}
                            onValueChange={(value) => { setPrice(value); setFormErrors((previous) => ({ ...previous, price: '' })) }} />
                        </>
                      )}

                      <Input id="product-billableWeightKg" name="billableWeightKg" type="number" min="0" step="any" label="Khối lượng tính cước (kg)" required aria-required="true" value={billableWeightKg} error={formErrors.billableWeightKg} helperText="Nhập khối lượng thực tế hoặc quy đổi, lớn hơn 0 kg." onChange={(event) => setBillableWeightKg(event.target.value)} />

                      <div className="flex flex-col justify-end pb-1 sm:col-span-2 lg:col-span-2">
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

                  {isEdit ? (
                    <div className="space-y-4">
                    <ProductEditVariantsSection
                      activeProductId={activeEditId}
                      activeCode={code}
                      activeLabel={hasStructuredOptions
                        ? (effectiveUseOption2 && option2Value.trim() ? `${option1Value.trim()} · ${option2Value.trim()}` : option1Value.trim())
                        : variantLabel}
                      siblings={resolvedSiblings}
                      loadingSiblings={loadingSiblings}
                      switchingVariant={switchingVariant}
                      onSelectSibling={handleRequestSwitchSibling}
                      pendingSwitchTarget={pendingSwitchTarget}
                      onConfirmSwitch={() => {
                        const next = pendingSwitchTarget
                        if (next) switchToEditVariant(next.id)
                      }}
                      onCancelSwitch={() => setPendingSwitchTarget(null)}
                      option1Name={option1Name}
                      option2Name={option2Name}
                      onOption1NameChange={(value) => {
                        setOption1Name(value)
                        setFormErrors((prev) => ({ ...prev, option1Name: '' }))
                      }}
                      onOption2NameChange={(value) => {
                        setOption2Name(value)
                        setFormErrors((prev) => ({ ...prev, option2Name: '' }))
                      }}
                      canToggleStructured={resolvedSiblings.length <= 1 && !existingAttributeGroups.structured && !variantLabel.trim()}
                      structuredEnabled={editStructuredEnabled}
                      onToggleStructured={(checked) => {
                        setEditStructuredEnabled(checked)
                        setVariantRows([])
                        if (!checked) {
                          setEditUseOption2(false)
                          setOption2Assignments({})
                          setOption1Name('')
                          setOption2Name('')
                          setOption1Value('')
                          setOption2Value('')
                          setAddedOption1Values([])
                          setAddedOption2Values([])
                          setEditNewRows([])
                          setFormErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith('option') && !k.startsWith('newVariants['))))
                        }
                      }}
                      canToggleOption2={!originalOption2Name || resolvedSiblings.length <= 1}
                      useOption2={editUseOption2}
                      requiresOption2Assignments={addingSecondOption}
                      option2Assignments={option2Assignments}
                      onOption2AssignmentChange={handleOption2Assignment}
                      onToggleOption2={(checked) => {
                        setEditUseOption2(checked)
                        if (!checked) {
                          setOption2Name('')
                          setOption2Value('')
                          setAddedOption2Values([])
                          setOption2Assignments({})
                          recomputeEditNewRows(addedOption1Values, [], false, option1Value, '')
                        } else {
                          recomputeEditNewRows(addedOption1Values, addedOption2Values, true, option1Value, option2Value)
                        }
                      }}
                      existingOption1Values={existingAttributeGroups.option1Values}
                      existingOption2Values={existingAttributeGroups.option2Values}
                      addedOption1Values={addedOption1Values}
                      addedOption2Values={addedOption2Values}
                      onAddedOption1Change={(nextAdded1) => {
                        setAddedOption1Values(nextAdded1)
                        recomputeEditNewRows(nextAdded1, addedOption2Values)
                      }}
                      onAddedOption2Change={(nextAdded2) => {
                        setAddedOption2Values(nextAdded2)
                        recomputeEditNewRows(addedOption1Values, nextAdded2)
                      }}
                      pendingNewRows={editNewRows}
                      onPendingNewRowsChange={(nextRows, changedField) => {
                        setEditNewRows(nextRows)
                        setFormErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) =>
                          changedField ? key !== changedField : !key.startsWith('newVariants['))))
                      }}
                      defaultPrice={price}
                      errors={formErrors}
                    />
                    {!hasStructuredOptions && <ProductVariantRows
                      editingExisting
                      rows={variantRows}
                      defaultPrice={price}
                      errors={formErrors}
                      onChange={(rows, changedField) => {
                        setVariantRows(rows)
                        setFormErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) =>
                          changedField ? key !== changedField : !key.startsWith('variants['))))
                      }}
                    />}
                    </div>
                  ) : (
                    <ProductVariantRows
                      mode={isVariant ? 'flat' : 'matrix'}
                      rows={variantRows}
                      errors={formErrors}
                      defaultPrice={price}
                      matrixConfig={isVariant ? { option1Name, option2Name } : matrixConfig}
                      matrixRows={matrixRows}
                      option1Suggestions={isVariant ? existingAttributeGroups.option1Values : []}
                      option2Suggestions={isVariant ? existingAttributeGroups.option2Values : []}
                      onMatrixChange={(nextConfig, nextRows, changedField) => {
                        setMatrixConfig(nextConfig)
                        setMatrixRows(nextRows)
                        setFormErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) =>
                          changedField ? key !== changedField : !key.startsWith('variants[') && key !== 'option1Name' && key !== 'option2Name' && key !== 'variantMatrix')))
                      }}
                      onChange={(rows, changedField) => {
                        setVariantRows(rows)
                        setFormErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) =>
                          changedField ? key !== changedField : !key.startsWith('variants['))))
                      }}
                    />
                  )}

                  {(() => {
                    const inheritedSections = (
                      <>
                        {/* 2. PHÂN LOẠI, NGHỆ NHÂN & LÀNG NGHỀ */}
                        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
                          <h3 className="text-base font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8]">
                            2. Phân loại & xuất xứ di sản
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                            {/* Category Select */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="product-categoryId" className="text-sm font-semibold text-ink">
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
                              <select id="product-categoryId" name="categoryId" aria-invalid={Boolean(formErrors.categoryId)} aria-describedby={formErrors.categoryId ? 'product-categoryId-error' : undefined}
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                                  formErrors.categoryId ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E3E6E8]'
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
                                <span id="product-categoryId-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.categoryId}</span>
                              )}
                            </div>

                            {/* Artisan Select */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="product-artisanId" className="text-sm font-semibold text-ink">
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
                              <select id="product-artisanId" name="artisanId" aria-invalid={Boolean(formErrors.artisanId)}
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
                                <label htmlFor="product-craftVillageId" className="text-sm font-semibold text-ink">
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
                              <select id="product-craftVillageId" name="craftVillageId" aria-invalid={Boolean(formErrors.craftVillageId)}
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
                              <label htmlFor="product-material" className="block text-sm font-semibold text-ink mb-1.5">
                                Chất liệu chế tác
                              </label>
                              <input id="product-material" name="material" maxLength={255} aria-invalid={Boolean(formErrors.material)}
                                type="text"
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                placeholder="VD: Gỗ mun sừng, gỗ ngô đồng..."
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                              />
                            </div>

                            <div>
                              <label htmlFor="product-dimensions" className="block text-sm font-semibold text-ink mb-1.5">
                                Kích thước
                              </label>
                              <input id="product-dimensions" name="dimensions" maxLength={100} aria-invalid={Boolean(formErrors.dimensions)}
                                type="text"
                                value={dimensions}
                                onChange={(e) => setDimensions(e.target.value)}
                                placeholder="VD: 115 x 25 x 15 cm"
                                aria-describedby="product-dimensions-help"
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                              />
                              <p id="product-dimensions-help" className="mt-1.5 text-xs text-muted">Khi dùng GHN, nhập dài x rộng x cao của kiện đóng gói bằng cm (mỗi chiều 1–200 cm).</p>
                            </div>

                            <div>
                              <label htmlFor="product-musicalRange" className="block text-sm font-semibold text-ink mb-1.5">
                                Âm vực
                              </label>
                              <input id="product-musicalRange" name="musicalRange" maxLength={100} aria-invalid={Boolean(formErrors.musicalRange)}
                                type="text"
                                value={musicalRange}
                                onChange={(e) => setMusicalRange(e.target.value)}
                                placeholder="VD: 3 quãng tám (Do2 - Do5)"
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                              />
                            </div>

                            <div>
                              <label htmlFor="product-origin" className="block text-sm font-semibold text-ink mb-1.5">
                                Xuất xứ địa phương
                              </label>
                              <input id="product-origin" name="origin" maxLength={150} aria-invalid={Boolean(formErrors.origin)}
                                type="text"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                placeholder="VD: Hà Nội, Việt Nam"
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                              />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-4">
                              <label htmlFor="product-description" className="block text-sm font-semibold text-ink mb-1.5">
                                Mô tả chi tiết sản phẩm
                              </label>
                              <textarea id="product-description" name="description" aria-invalid={Boolean(formErrors.description)}
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
                              name="mediaUrl"
                              aria-label="Đường dẫn hình ảnh hoặc video"
                              maxLength={500}
                              value={newMediaUrl}
                              onChange={(e) => setNewMediaUrl(e.target.value)}
                              placeholder="Nhập URL hình ảnh hoặc video (VD: /assets/... hoặc https://...)"
                              className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/30"
                            />
                            <select
                              name="mediaType"
                              aria-label="Loại media"
                              value={newMediaType}
                              onChange={(e) => setNewMediaType(e.target.value)}
                              className="px-3.5 py-2 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                            >
                              <option value="IMAGE">Ảnh (IMAGE)</option>
                              <option value="VIDEO">Video (VIDEO)</option>
                            </select>
                            <input
                              type="text"
                              name="mediaAlt"
                              aria-label="Mô tả thay thế của media"
                              maxLength={255}
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
                          {formErrors.media && <p role="alert" className="mb-3 text-sm text-danger">{formErrors.media}</p>}

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
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-rose-600 hover:bg-surface-secondary hover:text-rose-800 cursor-pointer"
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
                      </>
                    )
                    if (!isVariant) return inheritedSections
                    const inheritedCategory = categories.find((item) => String(item.id) === String(categoryId))?.name
                    return (
                      <details className="rounded-2xl border border-[#E3E6E8] bg-[#FFFFFF] p-5 shadow-2xs">
                        <summary className="cursor-pointer rounded text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                          Thông tin kế thừa từ sản phẩm gốc (tùy chọn chỉnh sửa)
                          <span className="ml-2 font-normal text-secondary">
                            · {[inheritedCategory, `${mediaList.length} hình ảnh`].filter(Boolean).join(' · ')}
                          </span>
                        </summary>
                        <div className="mt-4 flex flex-col gap-6">
                          {inheritedSections}
                        </div>
                      </details>
                    )
                  })()}

                  {/* Submit Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    {!isEdit ? (
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <Package size={18} className="text-brand shrink-0" />
                        <span>
                          <span className="block font-medium text-ink" aria-live="polite">
                            {useMatrix
                              ? `Sẽ tạo ${matrixRows.length} biến thể tổ hợp mới.`
                              : isVariant || variantRows.length
                                ? `Sẽ tạo ${variantRows.length + 1} biến thể mới.`
                                : 'Sẽ tạo 1 sản phẩm mới.'}
                          </span>
                          {isInventoryContext
                            ? 'Biến thể mới có tồn kho = 0 và sẽ được chọn sẵn để bạn nhập số lượng & đơn giá nhập ở bước quay lại.'
                            : isVariant || useMatrix
                              ? <>Biến thể mới có tồn kho 0, dùng SKU và giá riêng. Nhập hàng qua <strong>Nhập kho</strong>.</>
                              : <>Tồn kho sản phẩm mới sẽ mặc định là 0. Quản lý kho qua chức năng <strong>Nhập kho</strong>.</>}
                        </span>
                      </div>
                    ) : additionalVariantCount > 0 ? (
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <Package size={18} className="text-brand shrink-0" />
                        <span aria-live="polite">
                          <span className="block font-medium text-ink">
                            Sẽ cập nhật {code} và tạo thêm {additionalVariantCount} biến thể mới.
                          </span>
                          Biến thể mới có tồn kho = 0; SKU hiện có giữ nguyên lịch sử.
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
                        disabled={submitting || switchingVariant || loading || !masterDataReady || !productReady || Boolean(masterDataError)}
                        aria-busy={submitting}
                        className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {submitting
                          ? 'Đang lưu…'
                          : isEdit
                            ? additionalVariantCount > 0
                              ? `Lưu & tạo thêm ${additionalVariantCount} biến thể`
                              : 'Lưu thay đổi'
                            : useMatrix
                              ? `Tạo ${matrixRows.length} biến thể`
                              : isInventoryContext && variantRows.length === 0
                                ? 'Tạo biến thể để nhập kho'
                                : isVariant || variantRows.length
                                  ? `Tạo ${variantRows.length + 1} biến thể`
                                  : 'Tạo sản phẩm'}
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals for inline master data creation */}
      {showCategoryModal && <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={loadMasterData}
      />}
      {showArtisanModal && <ArtisanManagementModal
        isOpen={showArtisanModal}
        onClose={() => setShowArtisanModal(false)}
        onSuccess={loadMasterData}
      />}
      {showVillageModal && <CraftVillageManagementModal
        isOpen={showVillageModal}
        onClose={() => setShowVillageModal(false)}
        onSuccess={loadMasterData}
      />}
    </>
  )
}
