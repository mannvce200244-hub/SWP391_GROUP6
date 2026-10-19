import artisanWorkshop from '../../assets/images/artisan-workshop.jpg'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function ArtisanVillageSection({ artisan, craftVillage }) {
  const artisanObj = typeof artisan === 'string' ? { name: artisan } : artisan
  const villageObj = typeof craftVillage === 'string' ? { name: craftVillage } : craftVillage

  if (!artisanObj && !villageObj) {
    return null
  }

  return (
    <section aria-labelledby="artisan-village-heading" className="py-8">
      <div className="mb-6">
        <EditorialEyebrow label="Nguồn gốc & chế tác" />
        <h2
          className="text-lg sm:text-xl font-bold text-ink tracking-tight mt-1.5"
          id="artisan-village-heading"
        >
          Nghệ nhân & làng nghề truyền thống
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Workshop Imagery */}
        <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-surface-secondary/50 border border-border/60 aspect-4/3 sm:aspect-16/10 lg:aspect-4/3">
          <img
            alt="Xưởng chế tác nhạc cụ truyền thống của nghệ nhân"
            className="w-full h-full object-cover"
            decoding="async"
            height="600"
            loading="lazy"
            src={villageObj?.imageUrl || artisanWorkshop}
            width="800"
          />
        </div>

        {/* Informational Details */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {artisanObj && (
            <div className="flex flex-col gap-2">
              <EditorialEyebrow label="Nghệ nhân chế tác" showResonance={false} />
              <h3 className="text-xl font-bold text-ink">{artisanObj.name}</h3>
              {artisanObj.biography && (
                <p className="text-sm text-ink/80 leading-relaxed pt-1">
                  {artisanObj.biography}
                </p>
              )}
            </div>
          )}

          {artisanObj && villageObj && <div className="border-t border-border/60" />}

          {villageObj && (
            <div className="flex flex-col gap-2">
              <EditorialEyebrow label="Làng nghề di sản" showResonance={false} />
              <h3 className="text-xl font-bold text-ink">{villageObj.name}</h3>
              {villageObj.location && (
                <p className="text-xs font-medium text-muted">
                  Địa danh: {villageObj.location}
                </p>
              )}
              {villageObj.description && (
                <p className="text-sm text-ink/80 leading-relaxed pt-1">
                  {villageObj.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ArtisanVillageSection
