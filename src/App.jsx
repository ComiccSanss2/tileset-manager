import React, { useState } from "react";
import Dropzone from "./components/Dropzone";
import TileOptions from "./components/TileOptions";
import TileGrid from "./components/TileGrid";
import TileInfoPanel from "./components/TileInfoPanel";
import ZoomControls from "./components/ZoomControls";
import "./styles.css";

export default function App() {
  const [image, setImage] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [tileSize, setTileSize] = useState(16);
  const [customSize, setCustomSize] = useState(16);

  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredTile, setHoveredTile] = useState(null);

  const handleSlice = () => {
    if (!image) return;

    const img = new Image();
    img.src = image;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const size = tileSize === "custom" ? customSize : tileSize;

      const cols = Math.floor(img.width / size);
      const rows = Math.floor(img.height / size);

      const slicedTiles = [];

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          canvas.width = size;
          canvas.height = size;

          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(
            img,
            x * size,
            y * size,
            size,
            size,
            0,
            0,
            size,
            size
          );

          const tileURL = canvas.toDataURL("image/png");

          slicedTiles.push({
            id: `${x}-${y}`,
            x,
            y,
            size,
            src: tileURL,
          });
        }
      }

      setTiles(slicedTiles);
      setHoveredTile(null);
    };
  };

  const effectiveTileSize = tileSize === "custom" ? customSize : tileSize;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="title">Tileset Manager</h1>
        <p className="subtitle">Import, slice and inspect your tilesets.</p>
      </header>

      <Dropzone setImage={setImage} />

   {image && (
  <div className="panels-row">
    <TileOptions
      tileSize={tileSize}
      setTileSize={setTileSize}
      customSize={customSize}
      setCustomSize={setCustomSize}
      handleSlice={handleSlice}
    />

    <ZoomControls
      zoom={zoom}
      setZoom={setZoom}
      showGrid={showGrid}
      setShowGrid={setShowGrid}
    />
  </div>
)}

      {tiles.length > 0 && (
        <div className="workspace">
          <TileGrid
            tiles={tiles}
            zoom={zoom}
            showGrid={showGrid}
            onTileHover={setHoveredTile}
            tileSize={effectiveTileSize}
          />
          <TileInfoPanel tile={hoveredTile} tileSize={effectiveTileSize} />
        </div>
      )}
    </div>
  );
}
