import React from "react";

export default function TileGrid({
  tiles,
  zoom,
  showGrid,
  onTileHover,
  onTileSelect,
  tileSize,
  collisions,
  selectedTile,
}) {
  const scale = zoom || 1;

  return (
    <div className="tile-grid-wrapper">
      <div
        className="tile-grid"
        style={{
          gridTemplateColumns: `repeat(auto-fill, ${tileSize * scale + 8}px)`,
        }}
      >
        {tiles.map((tile) => {
          const collisionType = collisions[tile.id] || "none";
          const isSelected = selectedTile?.id === tile.id;

          return (
            <div
              key={tile.id}
              className={`tile-preview ${isSelected ? "is-selected" : ""}`}
              data-collision={collisionType}
              onMouseEnter={() => onTileHover(tile)}
              onMouseLeave={() => onTileHover(null)}
              onClick={() => onTileSelect(tile)}
            >
              <img
                src={tile.src}
                alt={tile.id}
                style={{
                  width: tileSize * scale,
                  height: tileSize * scale,
                  imageRendering: "pixelated",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
