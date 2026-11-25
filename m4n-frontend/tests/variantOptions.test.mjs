import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAttributeGroups,
  buildMissingVariantMatrix,
  buildVariantMatrix,
  findVariantByOptions,
  optionAvailability,
  selectVariantOption,
} from '../src/features/catalog/variantOptions.js'
import { matrixFormErrors, matrixVariantRequests } from '../src/features/catalog/productVariantForm.js'

const danTranhVariants = [
  { id: 1, option1Name: 'Chất liệu', option2Name: 'Số dây', option1Value: 'Gỗ trắc', option2Value: '16 dây', variantLabel: 'Gỗ trắc · 16 dây', price: 5000000, stockQuantity: 4 },
  { id: 2, option1Name: 'Chất liệu', option2Name: 'Số dây', option1Value: 'Gỗ trắc', option2Value: '18 dây', variantLabel: 'Gỗ trắc · 18 dây', price: 5500000, stockQuantity: 0 },
  { id: 3, option1Name: 'Chất liệu', option2Name: 'Số dây', option1Value: 'Gỗ mun', option2Value: '16 dây', variantLabel: 'Gỗ mun · 16 dây', price: 6000000, stockQuantity: 7 },
  { id: 4, option1Name: 'Chất liệu', option2Name: 'Số dây', option1Value: 'Gỗ mun', option2Value: '18 dây', variantLabel: 'Gỗ mun · 18 dây', price: 6500000, stockQuantity: 2 },
]

test('buildAttributeGroups extracts two independent option dimensions and falls back for legacy flat labels', () => {
  const groups = buildAttributeGroups(danTranhVariants)
  assert.equal(groups.structured, true)
  assert.equal(groups.option1Name, 'Chất liệu')
  assert.equal(groups.option2Name, 'Số dây')
  assert.deepEqual(groups.option1Values, ['Gỗ trắc', 'Gỗ mun'])
  assert.deepEqual(groups.option2Values, ['16 dây', '18 dây'])

  const legacy = buildAttributeGroups([{ id: 10, variantLabel: 'Tone Đô (C)', price: 200000, stockQuantity: 3 }])
  assert.equal(legacy.structured, false)
})

test('selecting either attribute resolves the matching combination SKU and falls back cleanly when sparse', () => {
  assert.equal(findVariantByOptions(danTranhVariants, 'Gỗ mun', '18 dây')?.id, 4)
  assert.equal(selectVariantOption(danTranhVariants, danTranhVariants[0], 1, 'Gỗ mun')?.id, 3)
  assert.equal(selectVariantOption(danTranhVariants, danTranhVariants[2], 2, '18 dây')?.id, 4)

  const sparse = [danTranhVariants[0], danTranhVariants[3]]
  // Switching from (Gỗ trắc, 16 dây) to Gỗ mun jumps cleanly to (Gỗ mun, 18 dây)
  assert.equal(selectVariantOption(sparse, sparse[0], 1, 'Gỗ mun')?.id, 4)
  const avail = optionAvailability(sparse, sparse[0], 2, '18 dây')
  assert.equal(avail.exists, false)
  assert.equal(avail.anyExists, true)
  assert.equal(avail.anyInStock, true)

  const allOut = danTranhVariants.map((v) => ({ ...v, stockQuantity: v.option1Value === 'Gỗ trắc' ? 0 : v.stockQuantity }))
  assert.equal(optionAvailability(allOut, allOut[0], 1, 'Gỗ trắc').anyInStock, false)
  assert.equal(optionAvailability(allOut, allOut[0], 1, 'Gỗ mun').anyInStock, true)
})

test('buildVariantMatrix creates Cartesian product while preserving existing row edits', () => {
  const initial = buildVariantMatrix(['Gỗ trắc', 'Gỗ mun'], ['16 dây', '18 dây'], [], '5000000')
  assert.equal(initial.length, 4)
  assert.deepEqual(initial.map((r) => r.label), [
    'Gỗ trắc · 16 dây',
    'Gỗ trắc · 18 dây',
    'Gỗ mun · 16 dây',
    'Gỗ mun · 18 dây',
  ])
  initial[0].price = '5200000'
  initial[0].code = 'DT-TRAC-16'
  const expanded = buildVariantMatrix(['Gỗ trắc', 'Gỗ mun'], ['16 dây', '18 dây', '21 dây'], initial, '5000000')
  assert.equal(expanded.length, 6)
  assert.equal(expanded[0].price, '5200000')
  assert.equal(expanded[0].code, 'DT-TRAC-16')
  assert.equal(expanded[2].price, '5000000')
})

test('matrixFormErrors and matrixVariantRequests validate and emit structured payloads', () => {
  const config = { option1Name: 'Chất liệu', option2Name: 'Số dây', useOption2: true }
  const rows = buildVariantMatrix(['Gỗ trắc', 'Gỗ mun'], ['16 dây', '18 dây'], [], '5000000')
  assert.deepEqual(matrixFormErrors(config, rows), {})

  const base = { name: 'Đàn Tranh', categoryId: 1, isActive: true, media: [] }
  const reqs = matrixVariantRequests(base, config, rows)
  assert.equal(reqs.length, 4)
  assert.equal(reqs[0].option1Name, 'Chất liệu')
  assert.equal(reqs[0].option2Name, 'Số dây')
  assert.equal(reqs[0].option1Value, 'Gỗ trắc')
  assert.equal(reqs[0].option2Value, '16 dây')
  assert.equal(reqs[0].variantLabel, 'Gỗ trắc · 16 dây')
  assert.equal(reqs[0].price, 5000000)

  const duplicateNames = matrixFormErrors({ option1Name: 'Chất liệu', option2Name: 'chất liệu', useOption2: true }, rows)
  assert.ok(duplicateNames.option2Name)
})

test('adding a third value to one group preserves the other group through the save payload and reload', () => {
  const config = { option1Name: 'Chất liệu', option2Name: 'Số dây', useOption2: true }
  const initial = buildVariantMatrix(['Gỗ trắc', 'Gỗ mun'], ['16 dây', '18 dây'], [], '5000000')
  initial[1] = { ...initial[1], price: '5500000', code: 'DT-TRAC-18', barcode: '8938500000010' }
  const expanded = buildVariantMatrix(['Gỗ trắc', 'Gỗ mun', 'Gỗ hương'], ['16 dây', '18 dây'], initial, '6000000')
  const payload = matrixVariantRequests({ name: 'Đàn Tranh', categoryId: 1 }, config, expanded)
  const reopened = buildAttributeGroups(JSON.parse(JSON.stringify(payload)))

  assert.equal(payload.length, 6)
  assert.deepEqual(reopened, {
    structured: true,
    option1Name: 'Chất liệu',
    option2Name: 'Số dây',
    option1Values: ['Gỗ trắc', 'Gỗ mun', 'Gỗ hương'],
    option2Values: ['16 dây', '18 dây'],
  })
  assert.deepEqual(payload.filter((sku) => sku.option1Value === 'Gỗ hương').map((sku) => sku.option2Value), ['16 dây', '18 dây'])
  const unchanged = payload.find((sku) => sku.code === 'DT-TRAC-18')
  assert.equal(unchanged.price, 5500000)
  assert.equal(unchanged.barcode, '8938500000010')
})

test('matrixFormErrors maps first-row errors to top-level keys and detects existing sibling combos', () => {
  const config = { option1Name: 'Chất liệu', option2Name: 'Số dây', useOption2: true }
  const existing = new Set(['gỗ trắc · 16 dây'])
  const errors = matrixFormErrors(
    config,
    [
      { option1Value: 'Gỗ trắc', option2Value: '16 dây', price: '6800000', code: '', barcode: '' },
      { option1Value: 'Gỗ hương', option2Value: '21 dây', price: '7500000', code: '', barcode: '' },
      { option1Value: 'Gỗ hương', option2Value: '21 dây', price: '7600000', code: '', barcode: '' },
    ],
    { firstRowTopLevel: true, existingCombos: existing },
  )
  assert.equal(errors.variantLabel, 'Tổ hợp biến thể này đã tồn tại trên hệ thống.')
  assert.equal(errors['variants[0].variantLabel'], undefined)
  assert.equal(errors['variants[1].variantLabel'], undefined)
  assert.equal(errors['variants[2].variantLabel'], 'Tổ hợp biến thể bị trùng trong danh sách.')
})

test('buildMissingVariantMatrix generates only new combinations not present in existing family variants', () => {
  const missing = buildMissingVariantMatrix(
    ['Gỗ trắc', 'Gỗ mun', 'Gỗ hương'],
    ['16 dây', '18 dây'],
    danTranhVariants,
    [],
    '6200000',
  )
  assert.deepEqual(missing.map((r) => r.label), ['Gỗ hương · 16 dây', 'Gỗ hương · 18 dây'])
  assert.equal(missing[0].price, '6200000')

  missing[0].price = '6900000'
  missing[0].code = 'DT-HUONG-16'
  const expanded = buildMissingVariantMatrix(
    ['Gỗ trắc', 'Gỗ mun', 'Gỗ hương'],
    ['16 dây', '18 dây', '21 dây'],
    danTranhVariants,
    missing,
    '6200000',
  )
  assert.equal(expanded.length, 5)
  assert.equal(expanded.find((r) => r.label === 'Gỗ hương · 16 dây')?.price, '6900000')
  assert.equal(expanded.find((r) => r.label === 'Gỗ hương · 16 dây')?.code, 'DT-HUONG-16')
  assert.equal(expanded.find((r) => r.label === 'Gỗ trắc · 21 dây')?.price, '6200000')
})

test('adding a second group keeps explicitly classified existing SKUs out of the new combination batch', () => {
  const existing = [
    { id: 1, option1Value: 'Gỗ trắc', option2Value: '16 dây' },
    { id: 2, option1Value: 'Gỗ mun', option2Value: '18 dây' },
    { id: 3, option1Value: 'Gỗ hương', option2Value: '16 dây' },
  ]
  const rows = buildMissingVariantMatrix(['Gỗ trắc', 'Gỗ mun', 'Gỗ hương'], ['16 dây', '18 dây'], existing, [], '6000000')
  assert.deepEqual(rows.map((row) => row.label), ['Gỗ trắc · 18 dây', 'Gỗ mun · 16 dây', 'Gỗ hương · 18 dây'])
  const payload = matrixVariantRequests({ familyId: 42 }, { option1Name: 'Chất liệu', option2Name: 'Số dây', useOption2: true }, rows)
  assert.ok(payload.every((sku) => sku.familyId === 42 && sku.option1Value && sku.option2Value))
  assert.equal(payload.length, 3)
})

test('an incomplete two-group family can add its missing combination without adding another option value', () => {
  const siblings = [
    { id: 1, option1Value: 'Gỗ trắc', option2Value: '16 dây' },
    { id: 2, option1Value: 'Gỗ mun', option2Value: '16 dây' },
    { id: 3, option1Value: 'Gỗ mun', option2Value: '18 dây', isActive: false },
  ]
  const missing = buildMissingVariantMatrix(['Gỗ trắc', 'Gỗ mun'], ['16 dây', '18 dây'], siblings, [], '100000')
  assert.deepEqual(missing.map((row) => row.label), ['Gỗ trắc · 18 dây'])
  const requests = matrixVariantRequests({ familyId: 42 }, { option1Name: 'Chất liệu', option2Name: 'Số dây', useOption2: true }, missing)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].familyId, 42)
})
