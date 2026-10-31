import Button from '../ui/Button.jsx'

const heading = 'px-4 py-3 text-left font-semibold text-ink whitespace-nowrap'
const cell = 'px-4 py-3 align-top'
const number = new Intl.NumberFormat('vi-VN')
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
const movementLabels = {
  IMPORT: 'Nhập kho cũ', RECEIPT: 'Phiếu nhập', ISSUE: 'Phiếu xuất', ORDER_CONFIRMATION: 'Xác nhận đơn online',
  POS_SALE: 'Bán tại quầy', ORDER_CANCELLATION: 'Hoàn kho khi hủy đơn',
}
const sourceLabels = { STOCK_DOCUMENT: 'Phiếu kho', ORDER: 'Đơn online', INVOICE: 'Hóa đơn POS' }

export function InventoryBalanceTable({ items, onDraft, onHistory }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Tồn kho bán được theo sản phẩm</caption>
        <thead className="bg-[#F6F7F8]"><tr>
          <th scope="col" className={heading}>Sản phẩm</th><th scope="col" className={`${heading} text-right`}>Tồn kho</th>
          <th scope="col" className={heading}>Trạng thái</th><th scope="col" className={heading}>Thao tác</th>
        </tr></thead>
        <tbody>{items.map((item) => <tr key={item.productId} className="border-t border-border">
          <th scope="row" className={`${cell} text-left min-w-52 max-w-sm font-medium break-words`}>
            {item.productName}<span className="block text-xs text-muted font-normal mt-1" translate="no">{item.productCode}</span>
          </th>
          <td className={`${cell} text-right tabular-nums font-semibold`}>{number.format(item.quantity)}</td>
          <td className={`${cell} whitespace-nowrap`}><span className={item.status === 'OUT_OF_STOCK' ? 'text-danger' : item.status === 'LOW_STOCK' ? 'font-semibold text-ink' : 'text-muted'}>{item.statusLabel}</span></td>
          <td className={cell}><div className="flex flex-wrap gap-2 min-w-64">
            <Button size="sm" variant="secondary" onClick={() => onDraft(item, 'RECEIPT')}>Tạo phiếu nhập</Button>
            <Button size="sm" variant="secondary" onClick={() => onDraft(item, 'ISSUE')}>Tạo phiếu xuất</Button>
            <Button size="sm" variant="ghost" onClick={() => onHistory(item)}>Lịch sử</Button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}

export function StockDocumentsTable({ items, onConfirm, onHistory }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Phiếu nhập và xuất kho</caption>
        <thead className="bg-[#F6F7F8]"><tr>
          <th scope="col" className={heading}>Phiếu / sản phẩm</th><th scope="col" className={heading}>Số lượng</th>
          <th scope="col" className={heading}>Trạng thái</th><th scope="col" className={heading}>Thao tác</th>
        </tr></thead>
        <tbody>{items.map((item) => <tr key={item.id} className="border-t border-border">
          <th scope="row" className={`${cell} text-left min-w-60 max-w-sm font-medium break-words`}>
            {movementLabels[item.type]} #{item.id} · {item.productName}
            <span className="block text-xs font-normal text-muted mt-1" translate="no">{item.productCode}</span>
            <span className="block text-xs font-normal text-muted mt-1">{date.format(new Date(item.createdAt))} · {item.createdBy}</span>
            <details className="mt-2 font-normal text-xs"><summary className="cursor-pointer focus-visible:outline focus-visible:outline-brand">Chi tiết phiếu</summary>
              <p className="mt-2 break-words">Lý do: {item.reason}</p>
              {item.confirmedAt && <p className="mt-1 break-words">Xác nhận: {date.format(new Date(item.confirmedAt))} · {item.confirmedBy}</p>}
              {item.rejectedQuantity > 0 && <p className="mt-1 break-words">Lý do loại hàng: {item.rejectionReason}</p>}
            </details>
          </th>
          <td className={`${cell} tabular-nums whitespace-nowrap`}>{number.format(item.quantity)} trên phiếu
            {item.status === 'CONFIRMED' && <>
              <span className="block text-xs text-muted mt-1">{item.type === 'RECEIPT' ? 'Đạt chất lượng' : 'Đã xuất'}: {number.format(item.acceptedQuantity)}</span>
              {item.type === 'RECEIPT' && <span className="block text-xs text-muted mt-1">Bị loại: {number.format(item.rejectedQuantity)}</span>}
              <span className="block text-xs text-muted mt-1">Tồn kho: {number.format(item.quantityBefore)} → {number.format(item.quantityAfter)}</span>
            </>}
          </td>
          <td className={`${cell} whitespace-nowrap`}>{item.status === 'DRAFT' ? 'Chờ xác nhận' : 'Đã xác nhận'}</td>
          <td className={cell}><div className="flex flex-wrap gap-2 min-w-40">
            {item.status === 'DRAFT' && <Button size="sm" onClick={() => onConfirm(item)} aria-label={`Xác nhận phiếu ${item.id}`}>Xác nhận</Button>}
            <Button size="sm" variant="secondary" onClick={() => onHistory(item)}>Lịch sử</Button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}

export function InventoryMovementsTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Lịch sử biến động kho và nguồn giao dịch</caption>
        <thead className="bg-[#F6F7F8]"><tr>
          <th scope="col" className={heading}>Thời gian / sản phẩm</th><th scope="col" className={heading}>Biến động</th>
          <th scope="col" className={heading}>Tồn trước → sau</th><th scope="col" className={heading}>Nguồn / chi tiết</th>
        </tr></thead>
        <tbody>{items.map((item) => <tr key={item.id} className="border-t border-border">
          <th scope="row" className={`${cell} text-left min-w-52 max-w-sm font-medium break-words`}>
            {item.productName}<span className="block text-xs text-muted font-normal mt-1" translate="no">{item.productCode}</span>
            <span className="block text-xs text-muted font-normal mt-1">{date.format(new Date(item.createdAt))}</span>
          </th>
          <td className={`${cell} whitespace-nowrap`}>{movementLabels[item.type] || item.type}
            <span className="block font-semibold tabular-nums mt-1">{item.quantityAfter > item.quantityBefore ? '+' : item.quantityAfter < item.quantityBefore ? '−' : ''}{number.format(item.quantity)}</span>
            {item.rejectedQuantity > 0 && <span className="block text-xs text-muted mt-1">Bị loại: {number.format(item.rejectedQuantity)}</span>}
          </td>
          <td className={`${cell} tabular-nums whitespace-nowrap`}>{number.format(item.quantityBefore)} → {number.format(item.quantityAfter)}</td>
          <td className={`${cell} min-w-52 max-w-sm break-words`}>
            {item.sourceType ? `${sourceLabels[item.sourceType] || item.sourceType} #${item.sourceId}` : 'Giao dịch kho cũ'}
            <details className="mt-2 text-xs"><summary className="cursor-pointer focus-visible:outline focus-visible:outline-brand">Lý do và người thực hiện</summary>
              <p className="mt-2 break-words">{item.reason}</p>
              {item.rejectionReason && <p className="mt-1 break-words">Lý do loại: {item.rejectionReason}</p>}
              <p className="mt-1 break-words">Người thực hiện: {item.actorEmail || 'Hệ thống'}</p>
            </details>
          </td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}
