import React from "react";

export default function TileInfoPanel({ tile, tileSize }) {
  if (!tile) {
    return (
      <div className="tile-info pixel-panel">
        <h2>Tile info</h2>
        <p>Hover a tile in the grid to inspect it.</p>
      </div>
    );
  }

  const pixelX = tile.x * tile.size;
  const pixelY = tile.y * tile.size;

  return (
    <div className="tile-info pixel-panel">
      <h2>Tile info</h2>
      <ul>
        <li>
          <strong>Index:</strong> {tile.index}
        </li>
        <li>
          <strong>Grid position:</strong> x {tile.x} · y {tile.y}
        </li>
        <li>
          <strong>Pixel rect:</strong> ({pixelX}, {pixelY}) – {tile.size}×
          {tile.size}
        </li>
        <li>
          <strong>Size:</strong> {tileSize}×{tileSize}
        </li>
      </ul>
    </div>
  );
}
