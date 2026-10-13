import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import Pagination from '../features/catalog/Pagination.jsx'
import ArtisanCard from '../features/artisans/ArtisanCard.jsx'
import ArtisanFilters from '../features/artisans/ArtisanFilters.jsx'
import ArtisansHero from '../features/artisans/ArtisansHero.jsx'
import ArtisanVillageTabs from '../features/artisans/ArtisanVillageTabs.jsx'
import VillageCard from '../features/artisans/VillageCard.jsx'
import ArtisanProductsSection from '../features/artisans/ArtisanProductsSection.jsx'
import artisanService from '../services/artisanService.js'

function parseQueryParams() {
  if (typeof window === 'undefined') {
    return {
      craft: 'all',
      page: 1,
      province: 'all',
      region: 'all',
      search: '',
      sort: 'featured',
      tab: 'artisans',
    }
  }

  const searchParams = new URLSearchParams(window.location.search)
  const tab = searchParams.get('tab') === 'villages' ? 'villages' : 'artisans'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const search = searchParams.get('search') || ''
  const craft = searchParams.get('craft') || 'all'
  const province = searchParams.get('province') || 'all'
  const region = searchParams.get('region') || 'all'
  const sort = searchParams.get('sort') || 'featured'

  return { craft, page, province, region, search, sort, tab }
}

function ArtisansPage() {
  const [params, setParams] = useState(parseQueryParams)
  const [data, setData] = useState({
    items: [],
    loading: true,
    page: 1,
    total: 0,
    totalPages: 1,
  })

  // Sync state with browser back/forward history
  useEffect(() => {
    const handlePopState = () => {
      setData((prev) => ({ ...prev, loading: true }))
      setParams(parseQueryParams())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Sync state to URL without reloading page
  const updateParams = (newParams) => {
    setData((prev) => ({ ...prev, loading: true }))
    setParams((prev) => {
      const merged = { ...prev, ...newParams }
      const searchParams = new URLSearchParams()

      if (merged.tab && merged.tab !== 'artisans') {
        searchParams.set('tab', merged.tab)
      }
      if (merged.search && merged.search.trim()) {
        searchParams.set('search', merged.search.trim())
      }
      if (merged.craft && merged.craft !== 'all') {
        searchParams.set('craft', merged.craft)
      }
      if (merged.province && merged.province !== 'all') {
        searchParams.set('province', merged.province)
      }
      if (merged.region && merged.region !== 'all') {
        searchParams.set('region', merged.region)
      }
      if (merged.sort && merged.sort !== 'featured') {
        searchParams.set('sort', merged.sort)
      }
      if (merged.page && merged.page > 1) {
        searchParams.set('page', String(merged.page))
      }

      const queryString = searchParams.toString()
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname

      window.history.pushState(null, '', newUrl)
      return merged
    })
  }

  // Load data whenever params change
  useEffect(() => {
    let active = true

    const fetchPromise =
      params.tab === 'villages'
        ? artisanService.listCraftVillages({
            craft: params.craft,
            limit: 6,
            page: params.page,
            province: params.province,
            region: params.region,
            search: params.search,
            sort: params.sort,
          })
        : artisanService.listArtisans({
            craft: params.craft,
            limit: 6,
            page: params.page,
            province: params.province,
            region: params.region,
            search: params.search,
            sort: params.sort,
          })

    fetchPromise.then((result) => {
      if (active) {
        setData({
          items: result.items,
          loading: false,
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        })
      }
    })

    return () => {
      active = false
    }
  }, [params])

  // Document Title
  useEffect(() => {
    const originalTitle = document.title
    document.title = 'Nghệ nhân & Làng nghề truyền thống — M4N'
    return () => {
      document.title = originalTitle
    }
  }, [])

  // Filter options derived from dataset
  const { crafts: craftOptions, provinces: provinceOptions } = useMemo(() => {
    return artisanService.getFilterOptions(params.tab)
  }, [params.tab])

  // Tab change handler
  const handleTabChange = (newTab) => {
    if (newTab === params.tab) return
    updateParams({
      craft: 'all',
      page: 1,
      province: 'all',
      region: 'all',
      search: '',
      sort: 'featured',
      tab: newTab,
    })
  }

  // Filter change handler
  const handleFilterChange = (key, value) => {
    updateParams({ [key]: value, page: 1 })
  }

  // Clear all filters
  const handleClearFilters = () => {
    updateParams({
      craft: 'all',
      page: 1,
      province: 'all',
      region: 'all',
      search: '',
      sort: 'featured',
    })
  }

  const isArtisansTab = params.tab === 'artisans'

  return (
    <div className="w-full flex flex-col bg-white">
      {/* 1. COMPACT EDITORIAL HERO */}
      <ArtisansHero
        stats={{
          artisans: 8,
          crafts: 6,
          villages: 8,
        }}
      />

      {/* 2. MAIN DISCOVERY & FILTER SECTION */}
      <section
        aria-labelledby="heritage-discovery-heading"
        className="py-10 sm:py-14 bg-white border-b border-border/80"
        id="heritage-discovery"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:gap-8">
          {/* Header & Tabs Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
            <div>
              <h2
                id="heritage-discovery-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-sans"
              >
                {isArtisansTab ? 'Danh sách nghệ nhân tiêu biểu' : 'Danh sách làng nghề truyền thống'}
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                {isArtisansTab
                  ? 'Gặp gỡ những bàn tay tài hoa chế tác và gìn giữ âm sắc nhạc cụ Việt'
                  : 'Khám phá các làng nghề giàu truyền thống văn hóa trên khắp mọi miền'}
              </p>
            </div>

            {/* Dual Tabs: [ Nghệ nhân (8) ] [ Làng nghề (8) ] */}
            <ArtisanVillageTabs
              activeTab={params.tab}
              artisanCount={8}
              onChangeTab={handleTabChange}
              villageCount={8}
            />
          </div>

          {/* Search Bar and Dropdown Filters */}
          <ArtisanFilters
            activeTab={params.tab}
            craftOptions={craftOptions}
            filters={params}
            onClearFilters={handleClearFilters}
            onFilterChange={handleFilterChange}
            provinceOptions={provinceOptions}
            totalResults={data.total}
          />

          {/* Grid of Results / Empty / Skeleton State */}
          {data.loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="aspect-4/5 rounded-2xl bg-surface-secondary/60 border border-border animate-pulse"
                />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="py-12">
              <EmptyState
                message="Thử thay đổi từ khóa hoặc bộ lọc để khám phá thêm nghệ nhân và làng nghề."
                title="Chưa tìm thấy kết quả phù hợp"
              >
                <button
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors shadow-xs mt-3 cursor-pointer"
                  onClick={handleClearFilters}
                  type="button"
                >
                  Xóa bộ lọc
                </button>
              </EmptyState>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {data.items.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    {isArtisansTab ? (
                      <ArtisanCard artisan={item} />
                    ) : (
                      <VillageCard village={item} />
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <Pagination
                  currentPage={data.page}
                  onPageChange={(nextPage) => {
                    updateParams({ page: nextPage })
                    const el = document.getElementById('heritage-discovery')
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  totalPages={data.totalPages}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. CONNECTED CRAFTED PRODUCTS */}
      <ArtisanProductsSection />
    </div>
  )
}

export default ArtisansPage
