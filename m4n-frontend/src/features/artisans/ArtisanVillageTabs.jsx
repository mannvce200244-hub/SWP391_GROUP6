function ArtisanVillageTabs({
  activeTab = 'artisans',
  artisanCount = 0,
  onChangeTab,
  villageCount = 0,
}) {
  return (
    <div
      aria-label="Chuyển đổi góc nhìn khám phá"
      className="inline-flex items-center p-1.5 rounded-xl bg-surface-secondary border border-border/80 shadow-2xs self-start"
      role="tablist"
    >
      <button
        aria-selected={activeTab === 'artisans'}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
          activeTab === 'artisans'
            ? 'bg-surface text-ink shadow-xs border border-border font-bold'
            : 'text-muted hover:text-ink hover:bg-surface/50 border border-transparent'
        }`}
        id="tab-artisans"
        onClick={() => onChangeTab('artisans')}
        role="tab"
        type="button"
      >
        <span>Nghệ nhân</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
            activeTab === 'artisans'
              ? 'bg-brand-soft text-brand font-bold'
              : 'bg-surface text-muted'
          }`}
        >
          {artisanCount}
        </span>
      </button>

      <button
        aria-selected={activeTab === 'villages'}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
          activeTab === 'villages'
            ? 'bg-surface text-ink shadow-xs border border-border font-bold'
            : 'text-muted hover:text-ink hover:bg-surface/50 border border-transparent'
        }`}
        id="tab-villages"
        onClick={() => onChangeTab('villages')}
        role="tab"
        type="button"
      >
        <span>Làng nghề</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
            activeTab === 'villages'
              ? 'bg-brand-soft text-brand font-bold'
              : 'bg-surface text-muted'
          }`}
        >
          {villageCount}
        </span>
      </button>
    </div>
  )
}

export default ArtisanVillageTabs
