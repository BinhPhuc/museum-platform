import { useState, useEffect, useRef } from "react";
import MemorySidebar from "./components/MemorySidebar";
import WelcomeContent from "./components/WelcomeContent";
import ContentViewer from "./components/ContentViewer";
import "./App.css";

export default function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handleSelectItem = (item) => {
    clearTimeout(closeTimer.current);
    setIsClosing(false);
    setSelectedItem(item);
    setSidebarOpen(false);
  };

  const handleCloseReader = () => {
    clearTimeout(closeTimer.current);
    setIsClosing(true);
    closeTimer.current = setTimeout(() => {
      setSelectedItem(null);
      setIsClosing(false);
    }, 300);
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo museum-logo" aria-hidden="true">📖</span>
        <h1 className="app-title">TRẠM VĂN</h1>
        <div className="header-spacer" />
        {selectedItem && <span className="reading-indicator">Đang xem: {selectedItem.name}</span>}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen((value) => !value)}
          aria-label={sidebarOpen ? "Đóng bộ sưu tập" : "Mở bộ sưu tập"}
          aria-expanded={sidebarOpen}
          aria-controls="memory-sidebar"
        >☰</button>
      </header>
      <main className="app-main">
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        <div id="memory-sidebar" className={`sidebar-wrapper${sidebarOpen ? " sidebar-wrapper--open" : ""}`}>
          <MemorySidebar selectedItem={isClosing ? null : selectedItem} onSelectItem={handleSelectItem} />
        </div>
        <div className="content-panel">
          {!selectedItem ? <WelcomeContent /> : (
            <div className={`reader-panel${isClosing ? " reader-panel--closing" : ""}`}>
              <ContentViewer key={`${selectedItem.id}:${selectedItem.file}`} item={selectedItem} onClose={handleCloseReader} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
