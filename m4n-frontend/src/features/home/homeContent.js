import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

// Homepage copy and static showcase data. Featured products are local
// placeholders until the product catalog API is approved and connected.
import authCraftShowcase from '../../assets/images/auth-craft-showcase.jpg'
import heroDanTranh from '../../assets/images/hero-dan-tranh.jpg'
import catNhacCuDay from '../../assets/images/cat-nhac-cu-day.jpg'
import catNhacCuHoi from '../../assets/images/cat-nhac-cu-hoi.jpg'
import catNhacCuGo from '../../assets/images/cat-nhac-cu-go.jpg'
import prodDanTranh from '../../assets/images/prod-dan-tranh.jpg'
import prodDanBau from '../../assets/images/prod-dan-bau.jpg'
import prodSaoTruc from '../../assets/images/prod-sao-truc.jpg'
import prodDanNguyet from '../../assets/images/prod-dan-nguyet.jpg'
import masterpieceDanTranh from '../../assets/images/masterpiece-dan-tranh.jpg'
import masterpieceDanBau from '../../assets/images/masterpiece-dan-bau.jpg'
import masterpieceDanNguyet from '../../assets/images/masterpiece-dan-nguyet.jpg'

export const MASTERPIECE_INSTRUMENTS = Object.freeze([
  Object.freeze({
    id: 'dan-tranh',
    shortName: 'Đàn Tranh 16 Dây',
    fullName: 'Đàn Tranh 16 Dây Cẩm Lai Khảm Trai',
    wood: 'Gỗ Cẩm Lai & Ngô Đồng',
    village: 'Làng Đào Xá, Hà Nội',
    artisan: 'Nghệ nhân Nguyễn Văn Quý',
    price: '8.500.000 ₫',
    tagline: 'Thanh âm réo rắt, trong trẻo như suối ngàn',
    desc: 'Chế tác từ danh mộc cẩm lai sấy khô tự nhiên 3 năm kết hợp mặt đàn gỗ ngô đồng xốp nhẹ, cẩn xà cừ ngũ sắc họa tiết hoa lá cổ truyền.',
    image: masterpieceDanTranh,
    alt: 'Đàn Tranh 16 Dây gỗ cẩm lai khảm xà cừ trên bệ đá trưng bày studio',
    productId: '1',
    hotspots: Object.freeze([
      Object.freeze({
        id: 'hs-mat-dan',
        x: 48,
        y: 50,
        title: 'Mặt đàn gỗ ngô đồng',
        detail: 'Thớ gỗ xốp nhẹ và khô ráo, truyền rung động từ dây xuống thùng đàn đạt âm bồi vang vọng.',
      }),
      Object.freeze({
        id: 'hs-kham-xa-cu',
        x: 20,
        y: 58,
        title: 'Cẩn ốc xà cừ ngũ sắc',
        detail: 'Họa tiết cổ truyền cẩn thủ công từng thớ vỏ ốc tự nhiên, phát quang ánh biếc dưới ánh sáng.',
      }),
      Object.freeze({
        id: 'hs-nhan-dan',
        x: 58,
        y: 45,
        title: '16 nhạn gỗ trắc tiện tay',
        detail: 'Độ dốc chân nhạn tính toán chuẩn xác theo cao độ ngũ cung Hò - Xự - Xang - Xê - Cống.',
      }),
      Object.freeze({
        id: 'hs-tua-chi',
        x: 33,
        y: 78,
        title: 'Tua chỉ tơ tằm truyền thống',
        detail: 'Nút thắt cát tường thắt thủ công từ tơ tằm nhuộm tự nhiên, biểu trưng cho sự thanh tao.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'dan-bau',
    shortName: 'Đàn Bầu Độc Huyền',
    fullName: 'Đàn Bầu Gỗ Mun Hoa Cần Sừng',
    wood: 'Gỗ Mun Hoa & Bầu Tự Nhiên',
    village: 'Làng Đào Xá, Hà Nội',
    artisan: 'Nghệ nhân Phạm Chí Khánh',
    price: '6.200.000 ₫',
    tagline: 'Một dây nắn nót cung trầm, lay động tâm can',
    desc: 'Cần đàn sừng trâu dẻo dai kết hợp quả bầu hồ lô tự nhiên khuếch đại âm sắc, thân đàn gỗ mun đen bóng điểm xuyết vân cẩn xà cừ.',
    image: masterpieceDanBau,
    alt: 'Đàn Bầu Độc Huyền gỗ mun hoa trên bệ đá trưng bày studio',
    productId: '2',
    hotspots: Object.freeze([
      Object.freeze({
        id: 'hs-than-dan',
        x: 48,
        y: 62,
        title: 'Thân đàn gỗ mun hoa',
        detail: 'Gỗ mun già đanh đặc, triệt tiêu tạp âm và chống chịu độ ẩm nhiệt đới bền bỉ hàng chục năm.',
      }),
      Object.freeze({
        id: 'hs-can-dan',
        x: 55,
        y: 42,
        title: 'Cần sừng trâu uốn lửa',
        detail: 'Uốn thủ công bằng nhiệt, độ đàn hồi hoàn hảo cho phép rung ngón và luyến láy vi âm tinh tế.',
      }),
      Object.freeze({
        id: 'hs-qua-bau',
        x: 84,
        y: 56,
        title: 'Quả bầu khuếch đại âm',
        detail: 'Quả bầu hồ lô già sấy kiệt, đóng vai trò như buồng cộng hưởng acoustic làm âm sắc thêm ngọt ngào.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'dan-nguyet',
    shortName: 'Đàn Nguyệt Cổ Truyền',
    fullName: 'Đàn Nguyệt Gỗ Gụ Mật Khảm Hoa',
    wood: 'Gỗ Gụ Mật Tuyển Lựa',
    village: 'Làng Đào Xá, Hà Nội',
    artisan: 'Nghệ nhân Trần Văn Phong',
    price: '5.800.000 ₫',
    tagline: 'Âm sắc đĩnh đạc, linh hồn của Ca trù & Văn ca',
    desc: 'Thùng tròn tượng trưng cho vầng trăng rằm, cần dài với các phím tre già đặc trưng giúp thể hiện trọn vẹn những nốt nhấn vuốt điêu luyện.',
    image: masterpieceDanNguyet,
    alt: 'Đàn Nguyệt Cổ Truyền gỗ gụ mật trên bệ đá trưng bày studio',
    productId: '4',
    hotspots: Object.freeze([
      Object.freeze({
        id: 'hs-thung-dan',
        x: 50,
        y: 68,
        title: 'Thùng đàn gỗ gụ mật',
        detail: 'Dáng tròn vành vạnh như mặt trăng, thành gỗ uốn hơi nước đạt buồng cộng hưởng ấm dày.',
      }),
      Object.freeze({
        id: 'hs-phim-dan',
        x: 50,
        y: 42,
        title: 'Phím tre già gắn cao',
        detail: 'Khoảng cách phím độc bản của nhạc cổ Việt Nam, hỗ trợ ngón bấm ngón nhấn sâu rộng.',
      }),
      Object.freeze({
        id: 'hs-thu-dan',
        x: 50,
        y: 16,
        title: 'Thủ đàn & trục gỗ',
        detail: 'Đẽo gọt dáng lá đề truyền thống, trục tiện khít chặt giữ dây ổn định suốt buổi diễn tấu.',
      }),
    ]),
  }),
])

export const HERO = Object.freeze({
  image: heroDanTranh,
  alt: 'Nghệ sĩ diễn tấu Đàn Tranh 16 Dây truyền thống Việt Nam',
  instrumentName: 'Đàn Tranh 16 Dây',
  materialNote: 'Chế tác thủ công từ danh mộc cẩm lai khảm xà cừ',
  subtext:
    'Mỗi cây đàn tại M4N là một tác phẩm độc bản được nghệ nhân ưu tú đẽo gọt từ gỗ mun, cẩm lai và tre nứa tuyển chọn, bảo tồn trọn vẹn chuẩn mực thẩm âm của âm nhạc cổ truyền Việt Nam.',
})

export const TRUST_ITEMS = Object.freeze([
  Object.freeze({
    title: 'Nguồn gốc rõ ràng',
    desc: 'Chất liệu, kích thước và xuất xứ minh bạch.',
  }),
  Object.freeze({
    title: 'Nghệ nhân & làng nghề',
    desc: 'Sản phẩm gắn liền người thợ và vùng đất.',
  }),
  Object.freeze({
    title: 'Hỗ trợ trực tuyến',
    desc: 'Trao đổi với nhân viên khi cần tư vấn.',
  }),
  Object.freeze({
    title: 'Nhạc cụ truyền thống',
    desc: 'Dây, hơi và gõ trong phạm vi M4N.',
  }),
])

export const CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'day',
    num: '01',
    label: 'DÂY',
    title: 'Nhạc cụ dây',
    desc: 'Âm thanh ngân vang, giàu sắc thái, gắn với nhiều hình thức biểu diễn truyền thống.',
    examples: Object.freeze(['Đàn Tranh', 'Đàn Bầu', 'Đàn Nguyệt', 'Đàn Tỳ Bà']),
    image: catNhacCuDay,
    alt: 'Nhạc cụ dây truyền thống Việt Nam: đàn tranh và đàn bầu',
  }),
  Object.freeze({
    id: 'hoi',
    num: '02',
    label: 'HƠI',
    title: 'Nhạc cụ hơi',
    desc: 'Âm sắc mộc mạc, gần gũi và giàu tính biểu cảm.',
    examples: Object.freeze(['Sáo Trúc', 'Tiêu']),
    image: catNhacCuHoi,
    alt: 'Nhạc cụ hơi truyền thống: sáo trúc và tiêu',
  }),
  Object.freeze({
    id: 'go',
    num: '03',
    label: 'GÕ',
    title: 'Nhạc cụ gõ',
    desc: 'Giữ nhịp và tạo điểm nhấn cho nhiều không gian diễn xướng truyền thống.',
    examples: Object.freeze(['Trống', 'Mõ', 'Thanh la']),
    image: catNhacCuGo,
    alt: 'Nhạc cụ gõ truyền thống: trống và thanh la',
  }),
])

export const FEATURED_PRODUCTS = Object.freeze([
  Object.freeze({
    id: '1',
    name: 'Đàn Tranh 16 Dây',
    groupName: 'Nhạc cụ dây',
    artisanName: 'Nghệ nhân Nguyễn Văn Quý',
    craftVillageName: 'Làng Đào Xá',
    priceDisplay: '8.500.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodDanTranh,
        alt: 'Đàn Tranh 16 Dây gỗ cẩm lai khảm xà cừ',
      }),
    ],
  }),
  Object.freeze({
    id: '2',
    name: 'Đàn Bầu Gỗ Mun',
    groupName: 'Nhạc cụ dây',
    artisanName: 'Nghệ nhân Phạm Chí Khánh',
    craftVillageName: 'Hà Nội',
    priceDisplay: '6.200.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodDanBau,
        alt: 'Đàn Bầu Gỗ Mun cẩn hoa văn truyền thống',
      }),
    ],
  }),
  Object.freeze({
    id: '3',
    name: 'Sáo Trúc Tone C',
    groupName: 'Nhạc cụ hơi',
    artisanName: '',
    craftVillageName: 'Làng nghề Trúc Sơn',
    priceDisplay: '650.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodSaoTruc,
        alt: 'Sáo Trúc Tone C nứa già quấn chỉ đen',
      }),
    ],
  }),
  Object.freeze({
    id: '4',
    name: 'Đàn Nguyệt Gỗ Gụ',
    groupName: 'Nhạc cụ dây',
    artisanName: 'Nghệ nhân Trần Văn Phong',
    craftVillageName: 'Làng Đào Xá',
    priceDisplay: '5.800.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodDanNguyet,
        alt: 'Đàn Nguyệt Gỗ Gụ âm sắc cổ truyền',
      }),
    ],
  }),
])

export const ARTISAN = Object.freeze({
  image: authCraftShowcase,
  alt: 'Xưởng chế tác nhạc cụ truyền thống của nghệ nhân làng Đào Xá với đàn tranh và đàn bầu khảm trai tinh xảo',
  intro:
    'Mỗi cây đàn, ngọn sáo tại M4N được sinh ra từ bàn tay tài hoa của các nghệ nhân làng nghề trăm năm tuổi, gìn giữ chuẩn mực âm sắc và giá trị mỹ nghệ dân tộc qua từng thế hệ.',
  villages: Object.freeze(['Làng nghề Đào Xá', 'Làng nghề Trúc Sơn']),
})

// Five strongest craft excellence pillars covering wood selection,
// heritage craftsmanship, acoustic calibration, cultural respect, and support.
export const WHY_M4N = Object.freeze([
  Object.freeze({
    title: 'Tuyển Lựa Danh Mộc Quý Hiếm',
    desc: 'Gỗ cẩm lai, gỗ mun hoa, gỗ gụ mật từ nguồn già tuổi, sấy khô tự nhiên bảo đảm độ cộng hưởng âm thanh vang dội và bền bỉ trăm năm.',
  }),
  Object.freeze({
    title: 'Bảo Tồn Kỹ Nghệ Đào Xá & Đọi Tam',
    desc: 'Mỗi nhạc cụ lưu giữ trọn vẹn tinh hoa khảm xà cừ, tiện vuốt và căng da truyền thống của các nghệ nhân ưu tú được chứng thực.',
  }),
  Object.freeze({
    title: 'Thẩm Âm & Căn Chỉnh Chuẩn Mực',
    desc: 'Từng cung bậc âm thanh được nghệ nhân trực tiếp so dây, thử cao độ chuẩn xác tuyệt đối trước khi đóng gói gửi đến tay bạn.',
  }),
  Object.freeze({
    title: 'Tôn Trọng Di Sản Văn Hóa',
    desc: 'Đồng hành cùng cộng đồng người yêu âm nhạc cổ truyền, mang âm vang ngũ cung dân tộc tiếp nối qua các thế hệ trẻ.',
  }),
  Object.freeze({
    title: 'Đồng Hành & Bảo Hành Trọn Đời',
    desc: 'Tư vấn chọn nhạc cụ tận tâm, hỗ trợ kỹ thuật căn chỉnh âm sắc và chính sách bảo hành, bảo dưỡng uy tín toàn quốc.',
    linkLabel: 'Chat với nhân viên',
    href: CUSTOMER_ROUTES.login,
  }),
])
