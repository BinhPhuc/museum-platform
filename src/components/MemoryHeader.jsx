export default function MemoryHeader({ item, onClose }) {
  return (
    <div className="reader-header">
      <button className="back-btn" onClick={onClose}>Quay lại</button>
      <h2 className="reader-title">{item.name}</h2>
      <span className="reader-spacer" />
      <a className="download-link" href={item.file} download>Tải bản gốc</a>
    </div>
  );
}
