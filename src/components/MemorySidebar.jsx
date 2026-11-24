import { useState } from "react";
import { treeData } from "../data/memories";
import { getContentType, CONTENT_LABELS } from "../lib/content";

export default function MemorySidebar({ selectedItem, onSelectItem }) {
  const [openCategories, setOpenCategories] = useState({});

  const toggleCategory = (catId) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <nav className="sidebar" aria-label="Bộ sưu tập ký ức">
      <div className="sidebar-list">
        {treeData.children.map((cat) => {
          const isOpen = !!openCategories[cat.id];
          return (
            <div key={cat.id} className="sidebar-category">
              <button
                className={`sidebar-cat-btn ${isOpen ? "sidebar-cat-btn--open" : ""}`}
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={isOpen}
              >
                <span className="sidebar-cat-icon">📁</span>
                <span className="sidebar-cat-name">{cat.name}</span>
                <span
                  className={`sidebar-chevron ${isOpen ? "sidebar-chevron--open" : ""}`}
                >
                  ▸
                </span>
              </button>

              {isOpen && (
                <ul className="sidebar-items">
                  {cat.children.map((item) => (
                    <li key={item.id}>
                      <button
                        className={`sidebar-item-btn ${
                          selectedItem?.id === item.id
                            ? "sidebar-item-btn--active"
                            : ""
                        }`}
                        onClick={() => onSelectItem(item)}
                        title={item.name}
                        aria-current={
                          selectedItem?.id === item.id ? "true" : undefined
                        }
                      >
                        <ItemThumb item={item} />
                        <span className="sidebar-item-name">
                          {item.name}
                          <small className="content-type-label">
                            {CONTENT_LABELS[getContentType(item)]}
                          </small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function ItemThumb({ item }) {
  const type = getContentType(item);
  return (
    <span
      className={`sidebar-thumb sidebar-thumb--format sidebar-thumb--${type}`}
    >
      {CONTENT_LABELS[type]}
    </span>
  );
}
