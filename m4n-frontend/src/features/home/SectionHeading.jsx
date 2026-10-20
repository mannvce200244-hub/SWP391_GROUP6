import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function SectionHeading({ description, eyebrow, id, title }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <div className="mb-2">
          <EditorialEyebrow label={eyebrow} />
        </div>
      ) : null}
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
        {title}
      </h2>
      {description ? (
        <p className="text-sm text-muted leading-relaxed mt-2">{description}</p>
      ) : null}
    </div>
  )
}

export default SectionHeading
