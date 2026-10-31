function ArtisanVillageTabs({
  activeTab = 'artisans',
  artisanCount,
  onChangeTab,
  villageCount,
}) {
  return (
    <div
      aria-label="Chuyển đổi góc nhìn khám phá"
      className="inline-flex items-center p-1.5 rounded-xl bg-surface-secondary border border-border/80 shadow-2xs self-start"
    >
      <button
        aria-pressed={activeTab === 'artisans'}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
          activeTab === 'artisans'
            ? 'bg-surface text-ink shadow-xs border border-border font-bold'
            : 'text-muted hover:text-ink hover:bg-surface/50 border border-transparent'
        }`}
        id="tab-artisans"
        onClick={() => onChangeTab('artisans')}
        type="button"
      >
        <span>Nghệ nhân</span>
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            activeTab === 'artisans'
              ? 'bg-brand-soft text-brand font-bold'
              : 'bg-surface text-muted'
          }`}
        >
          {artisanCount ?? '—'}
        </span>
      </button>

      <button
        aria-pressed={activeTab === 'villages'}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
          activeTab === 'villages'
            ? 'bg-surface text-ink shadow-xs border border-border font-bold'
            : 'text-muted hover:text-ink hover:bg-surface/50 border border-transparent'
        }`}
        id="tab-villages"
        onClick={() => onChangeTab('villages')}
        type="button"
      >
        <span>Làng nghề</span>
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            activeTab === 'villages'
              ? 'bg-brand-soft text-brand font-bold'
              : 'bg-surface text-muted'
          }`}
        >
          {villageCount ?? '—'}
        </span>
      </button>
    </div>
  )
}

export default ArtisanVillageTabs
