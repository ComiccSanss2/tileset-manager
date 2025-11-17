import React, { useState } from "react";
import Dropzone from "./components/Dropzone";
import TileOptions from "./components/TileOptions";
import TileGrid from "./components/TileGrid";
import TileInfoPanel from "./components/TileInfoPanel";
import ZoomControls from "./components/ZoomControls";
import JSZip from "jszip";
import "./styles.css";

export default function App() {
  const [image, setImage] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [tileSize, setTileSize] = useState(16);
  const [customSize, setCustomSize] = useState(16);

  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredTile, setHoveredTile] = useState(null);

  /* ================================
      TILE SLICING
  ================================== */
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

  const effectiveTileSize =
    tileSize === "custom" ? customSize : tileSize;

  /* ================================
       EXPORT JSON
  ================================== */
  const handleExportJSON = () => {
    if (tiles.length === 0) return;

    const json = tiles.map((tile, index) => ({
      id: index,
      x: tile.x,
      y: tile.y,
      size: tile.size,
      src: tile.src,
    }));

    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tileset-data.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ================================
       EXPORT PNG
  ================================== */
  const handleExportPNG = () => {
    if (!image) return;

    const img = new Image();
    img.src = image;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tileset.png";
        a.click();
        URL.revokeObjectURL(url);
      });
    };
  };

  /* ================================
       EXPORT ZIP (Commit #6)
  ================================== */
  const handleExportZIP = async () => {
    if (!image || tiles.length === 0) return;

    const zip = new JSZip();

    // --- 1. Save full tileset image ---
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const tilesetBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    zip.file("tileset.png", tilesetBlob);

    // --- 2. Save JSON metadata ---
    const json = tiles.map((tile, index) => ({
      id: index,
      x: tile.x,
      y: tile.y,
      size: tile.size,
    }));

    zip.file("tileset-data.json", JSON.stringify(json, null, 2));

    // --- 3. Save individual tiles ---
    const folder = zip.folder("tiles");

    for (const tile of tiles) {
      const res = await fetch(tile.src);
      const blob = await res.blob();
      folder.file(`${tile.x}-${tile.y}.png`, blob);
    }

    // --- 4. Download ZIP ---
    zip.generateAsync({ type: "blob" }).then((zipFile) => {
      const url = URL.createObjectURL(zipFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tileset_export.zip";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  /* ================================
       UI RENDER
  ================================== */
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

      {/* 🔧 Export buttons */}
      {tiles.length > 0 && (
        <div className="export-row">
          <button className="btn-export" onClick={handleExportJSON}>
            Export JSON
          </button>
          <button className="btn-export" onClick={handleExportPNG}>
            Export PNG
          </button>
          <button className="btn-export" onClick={handleExportZIP}>
            Export ZIP
          </button>
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
