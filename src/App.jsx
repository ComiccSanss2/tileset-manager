import React, { useState, useEffect } from "react";
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
  const [selectedTile, setSelectedTile] = useState(null);


  // 🎯 Collision par tile : { [tile.id]: "solid" | "none" | ... }
  const [collisions, setCollisions] = useState({});

  // Charger le thème à partir du localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gba-theme");
    if (saved === "light") {
      document.body.classList.add("theme-light");
    }
  }, []);

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
      const newCollisions = {};

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
          const id = `${x}-${y}`;

          slicedTiles.push({
            id,
            index: slicedTiles.length,
            x,
            y,
            size,
            src: tileURL,
          });

          // Par défaut : pas de collision
          newCollisions[id] = "none";
        }
      }

      setTiles(slicedTiles);
      setHoveredTile(null);
      setCollisions(newCollisions);
    };
  };

  const effectiveTileSize =
    tileSize === "custom" ? customSize : tileSize;

  /* ================================
       EXPORT JSON
  ================================== */
  const handleExportJSON = () => {
    if (tiles.length === 0) return;

    const json = tiles.map((tile) => ({
      id: tile.index,
      x: tile.x,
      y: tile.y,
      size: tile.size,
      collision: collisions[tile.id] || "none",
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
      EXPORT MANIFEST (UNITY + GODOT)
  ================================== */
  const handleExportManifest = () => {
    if (!tiles.length) return;

    const size = effectiveTileSize;

    // UNITY SPRITE ATLAS JSON
    const unityAtlas = {
      name: "TilesetAtlas",
      tileSize: size,
      columns: Math.max(...tiles.map((t) => t.x)) + 1,
      rows: Math.max(...tiles.map((t) => t.y)) + 1,
      sprites: tiles.map((tile) => ({
        name: `tile_${tile.x}_${tile.y}`,
        x: tile.x * size,
        y: tile.y * size,
        w: size,
        h: size,
        collision: collisions[tile.id] || "none",
      })),
    };

    // GODOT TRES (AtlasTexture) – simple manifest
    const godotTres =
`[resource]
resource_name = "TilesetAtlas"
tile_size = ${size}
tiles = [
${tiles
  .map((tile) => {
    const c = collisions[tile.id] || "none";
    return `  { x = ${tile.x}, y = ${tile.y}, w = ${size}, h = ${size}, collision = "${c}" }`;
  })
  .join(",\n")}
]`;

    const zip = new JSZip();

    zip.file("unity/spriteatlas.json", JSON.stringify(unityAtlas, null, 2));
    zip.file("godot/atlas_texture.tres", godotTres);

    zip.generateAsync({ type: "blob" }).then((zipFile) => {
      const url = URL.createObjectURL(zipFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tileset_manifest.zip";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  /* ================================
       EXPORT ZIP COMPLET
  ================================== */
  const handleExportZIP = async () => {
    if (!image || tiles.length === 0) return;

    const zip = new JSZip();

    // full tileset
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

    // JSON metadata
    const json = tiles.map((tile) => ({
      id: tile.index,
      x: tile.x,
      y: tile.y,
      size: tile.size,
      collision: collisions[tile.id] || "none",
    }));

    zip.file("tileset-data.json", JSON.stringify(json, null, 2));

    // individual tiles
    const folder = zip.folder("tiles");

    for (const tile of tiles) {
      const res = await fetch(tile.src);
      const blob = await res.blob();
      folder.file(`${tile.x}-${tile.y}.png`, blob);
    }

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
       COLLISION HANDLER
  ================================== */
  const handleCollisionChange = (tileId, type) => {
    setCollisions((prev) => ({
      ...prev,
      [tileId]: type,
    }));
  };



  /* ================================
       UI RENDER
  ================================== */
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="title">Tileset Manager</h1>
        <p className="subtitle">
          Import, slice, inspect and tag tiles with collision data.
        </p>

        <div className="gba-toggle-wrapper">
          <div
            className="gba-toggle"
            onClick={() => {
              const isLight =
                document.body.classList.toggle("theme-light");
              localStorage.setItem("gba-theme", isLight ? "light" : "dark");
            }}
          >
            <div className="gba-toggle-slider"></div>
          </div>
        </div>
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
          <button className="btn-export" onClick={handleExportManifest}>
            Export Manifest
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
            onTileSelect={setSelectedTile}
            tileSize={effectiveTileSize}
            collisions={collisions}
          />
          <TileInfoPanel
            tile={selectedTile || hoveredTile}
            tileSize={effectiveTileSize}
            collisions={collisions}
            onCollisionChange={handleCollisionChange}
          />
        </div>
      )}
    </div>
  );
}
