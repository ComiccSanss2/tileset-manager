import React from "react";

export default function TileGrid({
  tiles,
  zoom,
  showGrid,
  onTileHover,
  tileSize,
}) {
  return (
    <div className="tile-grid-wrapper pixel-panel">
      <h2>Tiles</h2>
      <div
        className={`tile-grid ${showGrid ? "tile-grid--grid" : ""}`}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
        onMouseLeave={() => onTileHover(null)}
      >
        {tiles.map((t, index) => (
          <div
            className="tile-preview"
            key={t.id}
            onMouseEnter={() => onTileHover({ ...t, index })}
          >
            <img src={t.src} alt={`tile-${t.x}-${t.y}`} />
          </div>
        ))}
      </div>
      <p className="tile-grid-hint">
        Hover a tile to see its details. Use zoom to inspect closely.
      </p>
    </div>
  );
}
