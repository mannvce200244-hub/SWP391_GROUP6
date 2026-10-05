import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

// Homepage copy and static showcase data. Featured products are local
// placeholders until the product catalog API is approved and connected.
import heroDanTranh from '../../assets/images/hero-dan-tranh.jpg'
import catNhacCuDay from '../../assets/images/cat-nhac-cu-day.jpg'
import catNhacCuHoi from '../../assets/images/cat-nhac-cu-hoi.jpg'
import catNhacCuGo from '../../assets/images/cat-nhac-cu-go.jpg'
import prodDanTranh from '../../assets/images/prod-dan-tranh.jpg'
import prodDanBau from '../../assets/images/prod-dan-bau.jpg'
import prodSaoTruc from '../../assets/images/prod-sao-truc.jpg'
import prodDanNguyet from '../../assets/images/prod-dan-nguyet.jpg'
import thanhAmDanNguyet from '../../assets/images/thanh-am-dan-nguyet.jpg'
import artisanWorkshop from '../../assets/images/artisan-workshop.jpg'

export const HERO = Object.freeze({
  image: heroDanTranh,
  alt: 'Nghệ sĩ chơi đàn tranh truyền thống Việt Nam',
})

export const TRUST_ITEMS = Object.freeze([
  Object.freeze({
    title: 'Nguồn gốc rõ ràng',
    desc: 'Thông tin về chất liệu, kích thước và xuất xứ được trình bày minh bạch.',
  }),
  Object.freeze({
    title: 'Nghệ nhân & làng nghề',
    desc: 'Khám phá sản phẩm theo nghệ nhân và làng nghề liên quan.',
  }),
  Object.freeze({
    title: 'Hỗ trợ trực tuyến',
    desc: 'Trao đổi với nhân viên trực tuyến khi cần tư vấn.',
  }),
  Object.freeze({
    title: 'Nhạc cụ truyền thống',
    desc: 'Tập trung vào các nhóm dây, hơi và gõ trong phạm vi M4N.',
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

export const STORY = Object.freeze({
  image: thanhAmDanNguyet,
  alt: 'Cận cảnh mặt đàn nguyệt gỗ sáng trên nền vân gỗ, nhìn rõ cầu đàn và cần đàn',
  intro:
    'Mỗi nhạc cụ mang theo một cách tạo âm, chất liệu và bối cảnh văn hóa riêng. M4N mong muốn giúp người dùng tiếp cận nhạc cụ truyền thống qua thông tin rõ ràng, hình ảnh trực quan và trải nghiệm mua sắm dễ hiểu hơn.',
  points: Object.freeze([
    Object.freeze({
      title: 'CHẤT LIỆU',
      desc: 'Gỗ, tre, nứa và các vật liệu truyền thống khác tạo nên đặc trưng âm sắc riêng.',
    }),
    Object.freeze({
      title: 'CẤU TẠO',
      desc: 'Mỗi loại nhạc cụ có hình thức chế tác và cách tạo âm khác nhau.',
    }),
    Object.freeze({
      title: 'ÂM SẮC',
      desc: 'Từ tiếng đàn ngân dài đến tiếng sáo mộc mạc hay nhịp gõ mạnh mẽ.',
    }),
  ]),
})

export const ARTISAN = Object.freeze({
  image: artisanWorkshop,
  alt: 'Nghệ nhân chế tác nhạc cụ trong xưởng gỗ tại làng nghề',
  intro:
    'Thông tin về nghệ nhân và làng nghề giúp người dùng hiểu rõ hơn về nguồn gốc và bối cảnh chế tác của từng sản phẩm.',
})

export const KNOWLEDGE_BLOCKS = Object.freeze([
  Object.freeze({
    title: 'Chọn theo nhóm nhạc cụ',
    desc: 'Dây, hơi và gõ có cách tạo âm và trải nghiệm sử dụng khác nhau.',
  }),
  Object.freeze({
    title: 'Xem thông tin chế tác',
    desc: 'Tham khảo chất liệu, kích thước, xuất xứ, nghệ nhân hoặc làng nghề nếu sản phẩm có thông tin.',
  }),
  Object.freeze({
    title: 'Trao đổi với nhân viên',
    desc: 'Sử dụng Chat để hỏi thêm về thông tin sản phẩm trước khi đặt hàng.',
    linkLabel: 'Chat với nhân viên',
    href: CUSTOMER_ROUTES.login,
  }),
])

export const VALUES = Object.freeze([
  Object.freeze({
    num: '01',
    title: 'Thông tin rõ ràng',
    desc: 'Trình bày các thông tin sản phẩm như chất liệu, kích thước, nguồn gốc, nghệ nhân và làng nghề khi dữ liệu có sẵn.',
  }),
  Object.freeze({
    num: '02',
    title: 'Tôn trọng giá trị truyền thống',
    desc: 'M4N tập trung vào các sản phẩm thuộc nhóm nhạc cụ truyền thống Việt Nam trong phạm vi hệ thống.',
  }),
  Object.freeze({
    num: '03',
    title: 'Hỗ trợ trong quá trình mua hàng',
    desc: 'Khách hàng có thể trao đổi với nhân viên trực tuyến và theo dõi trạng thái đơn hàng trong hệ thống.',
  }),
])

export const SUPPORT = Object.freeze({
  title: 'Bạn cần thêm thông tin về một nhạc cụ?',
  desc: 'Trao đổi với nhân viên trực tuyến để tìm hiểu thêm về sản phẩm trước khi đặt hàng.',
  linkLabel: 'Chat với nhân viên',
  href: CUSTOMER_ROUTES.login,
})
