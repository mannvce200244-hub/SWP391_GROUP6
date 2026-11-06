import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

// Homepage editorial content. Transactional product data is loaded from the API.
import heroDanTranh from '../../assets/images/hero-dan-tranh.jpg'
import catNhacCuDay from '../../assets/images/cat-nhac-cu-day.jpg'
import catNhacCuHoi from '../../assets/images/cat-nhac-cu-hoi.jpg'
import catNhacCuGo from '../../assets/images/cat-nhac-cu-go.jpg'

export const HERO = Object.freeze({
  image: heroDanTranh,
  alt: 'Nghệ sĩ diễn tấu Đàn Tranh 16 Dây truyền thống Việt Nam',
  instrumentName: 'Đàn Tranh 16 Dây',
  materialNote: 'Chế tác thủ công từ danh mộc cẩm lai khảm xà cừ',
})

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

export const ARTISAN = Object.freeze({
  image: '/assets/images/vietnamese-instrument-shop.jpg',
  alt: 'Không gian cửa hàng nhạc cụ thực tế tại Việt Nam với nhiều nhạc cụ truyền thống',
  caption: 'Không gian nhạc cụ tại Việt Nam',
  credit: 'Dianne Hope / Wikimedia Commons',
  creditUrl: 'https://commons.wikimedia.org/wiki/File:Musical_instrument_shop_in_Vietnam_(2015-08-02_by_Dianne_Hope_@pexels_313288).jpg',
})

// Five strongest craft excellence pillars covering wood selection,
// heritage craftsmanship, acoustic calibration, cultural respect, and support.
export const WHY_M4N = Object.freeze([
  Object.freeze({
    title: 'Thông Tin Sản Phẩm',
    desc: 'Xem vật liệu, kích thước, khoảng âm và thông tin xuất xứ được lưu trong hồ sơ sản phẩm.',
  }),
  Object.freeze({
    title: 'Nghệ Nhân & Làng Nghề',
    desc: 'Tra cứu người chế tác và làng nghề khi sản phẩm có thông tin liên kết trong hệ thống.',
  }),
  Object.freeze({
    title: 'Tìm Kiếm & Lọc',
    desc: 'Tìm sản phẩm theo nhóm nhạc cụ, nghệ nhân, làng nghề và khoảng giá.',
  }),
  Object.freeze({
    title: 'Tôn Trọng Di Sản Văn Hóa',
    desc: 'Đồng hành cùng cộng đồng người yêu âm nhạc cổ truyền, mang âm vang ngũ cung dân tộc tiếp nối qua các thế hệ trẻ.',
  }),
  Object.freeze({
    title: 'Hỗ Trợ Trực Tuyến',
    desc: 'Gửi câu hỏi cho Online Staff khi cần hỗ trợ về thông tin sản phẩm hoặc đơn hàng.',
    linkLabel: 'Chat với nhân viên',
    href: CUSTOMER_ROUTES.login,
  }),
])
