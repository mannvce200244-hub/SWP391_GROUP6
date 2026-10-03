import SiteFooter from '../components/common/SiteFooter.jsx'
import SiteHeader from '../components/common/SiteHeader.jsx'

function CustomerLayout({ children, pathname }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Bỏ qua đến nội dung chính
      </a>
      <SiteHeader pathname={pathname} />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  )
}

export default CustomerLayout
