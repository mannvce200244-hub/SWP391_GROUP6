import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

const PRINCIPLES = Object.freeze([
  {
    num: '01',
    title: 'Con người',
    desc: 'Mỗi sản phẩm mang dấu ấn của người đã dành nhiều năm để hiểu và làm chủ nghề. Từ nhát chạm, đường vuốt men đến mối quấn chỉ đều là sự tỉ mẩn không thể thay thế bằng máy móc.',
  },
  {
    num: '02',
    title: 'Văn hóa',
    desc: 'Kỹ thuật, hoa văn và vật liệu phản ánh câu chuyện của từng vùng đất. Một thân gỗ ngô đồng, một nẹp sừng trâu hay một tấc lụa vân đều gói trọn hồn cốt dân tộc qua nhiều thế hệ.',
  },
  {
    num: '03',
    title: 'Sự tiếp nối',
    desc: 'Khi một sản phẩm thủ công được lựa chọn và trân trọng, nghề truyền thống có thêm cơ hội tiếp tục tồn tại, nuôi sống các xưởng nghề và truyền lại cho thế hệ mai sau.',
  },
])

function WhyArtisansMatter() {
  return (
    <section
      aria-labelledby="why-artisans-matter-heading"
      className="py-16 sm:py-20 bg-surface border-t border-border/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left Column: Heading */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <EditorialEyebrow label="GIÁ TRỊ NGHỀ TRUYỀN THỐNG" />
          <h2
            id="why-artisans-matter-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans leading-snug"
          >
            Không chỉ là một món đồ
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Mỗi tạo tác thủ công rời xưởng nghề mang theo tâm huyết, thời gian và câu chuyện văn hóa của một vùng đất Việt.
          </p>
        </div>

        {/* Right Column: 3 Editorial Narrative Columns */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PRINCIPLES.map((item) => (
            <div
              key={item.num}
              className="flex flex-col gap-3 p-5 sm:p-6 rounded-2xl bg-canvas border border-border/70 shadow-2xs"
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-brand font-mono">
                {item.num}
              </span>
              <h3 className="text-lg font-bold text-ink font-sans">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyArtisansMatter
