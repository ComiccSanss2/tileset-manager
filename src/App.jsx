import React, { useState, useEffect } from "react";
import Dropzone from "./components/Dropzone";
import TileOptions from "./components/TileOptions";
import TileGrid from "./components/TileGrid";
import TileInfoPanel from "./components/TileInfoPanel";
import ZoomControls from "./components/ZoomControls";
import JSZip from "jszip";
import "./styles.css";
import logo from "./public/logo.png";

export default function App() {
  const [image, setImage] = useState(null);
  const [imageObj, setImageObj] = useState(null);

  const [tiles, setTiles] = useState([]);
  const [tileSize, setTileSize] = useState(16);
  const [customSize, setCustomSize] = useState(16);
  const [showSplash, setShowSplash] = useState(true);

  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);

  const [collisions, setCollisions] = useState({});
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  /* ======================================================
     THEME LOAD
  ====================================================== */
  useEffect(() => {
    const saved = localStorage.getItem("gba-theme");
    if (saved === "light") {
      document.body.classList.add("theme-light");
    }
  }, []);

  /* ======================================================
     ERROR TOAST
  ====================================================== */
  const throwError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3500);
  };

  /* ======================================================
     IMAGE UPLOAD
  ====================================================== */
  const handleImageLoad = (fileUrl) => {
    const img = new Image();
    img.src = fileUrl;

    img.onload = () => {
      setImage(fileUrl);
      setImageObj(img);
      img.onload = null;
      img.onerror = null;
    };

    img.onerror = () => {
      throwError("Invalid or corrupted image file.");
      img.onload = null;
      img.onerror = null;
    };
  };

  /* ======================================================
     TILE SLICING
  ====================================================== */
  const handleSlice = () => {
    if (!imageObj) {
      throwError("No image loaded.");
      return;
    }

    const size = tileSize === "custom" ? customSize : tileSize;

    if (imageObj.width > 8192 || imageObj.height > 8192) {
      throwError("Image is too large. Max allowed size is 8192x8192.");
      return;
    }

    if (imageObj.width % size !== 0 || imageObj.height % size !== 0) {
      throwError(`Image size is not divisible by ${size}px.`);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const cols = imageObj.width / size;
        const rows = imageObj.height / size;

        const slicedTiles = [];
        const newCollisions = {};

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            canvas.width = size;
            canvas.height = size;

            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(
              imageObj,
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

            newCollisions[id] = "none";
          }
        }

        setTiles(slicedTiles);
        setHoveredTile(null);
        setCollisions(newCollisions);

        canvas.remove();
      } catch (e) {
        throwError("Failed to slice the image.");
      }

      setLoading(false);
    }, 200);
  };

  const effectiveTileSize = tileSize === "custom" ? customSize : tileSize;

  const handleCollisionChange = (tileId, type) => {
  setCollisions((prev) => ({ ...prev, [tileId]: type }));
};

  /* ======================================================
     EXPORT JSON
  ====================================================== */
  const handleExportJSON = () => {
    if (!tiles.length) return;

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

  /* ======================================================
     EXPORT PNG
  ====================================================== */
  const handleExportPNG = () => {
    if (!imageObj) return;

    const canvas = document.createElement("canvas");
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageObj, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "tileset.png";
      a.click();

      URL.revokeObjectURL(url);
      canvas.remove();
    });
  };

  /* ======================================================
     EXPORT MANIFEST
  ====================================================== */
  const handleExportManifest = () => {
    if (!tiles.length) return;

    const size = effectiveTileSize;

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

    const godotTres = `[resource]
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

  /* ======================================================
     EXPORT ZIP
  ====================================================== */
  const handleExportZIP = async () => {
    if (!imageObj || !tiles.length) return;

    const zip = new JSZip();

    const canvas = document.createElement("canvas");
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageObj, 0, 0);

    const tilesetBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    zip.file("tileset.png", tilesetBlob);

    const json = tiles.map((tile) => ({
      id: tile.index,
      x: tile.x,
      y: tile.y,
      size: tile.size,
      collision: collisions[tile.id] || "none",
    }));
    zip.file("tileset-data.json", JSON.stringify(json, null, 2));

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
      canvas.remove();
    });
  };

  /* ======================================================
     SPLASH SCREEN
  ====================================================== */
  if (showSplash) {
    return (
      <div className="splash-screen">
        <img src={logo} alt="logo" className="splash-logo" />

        <h1 className="splash-title">PIXENO</h1>
        <p className="splash-subtitle">A Tileset Manager</p>

        <div className="splash-info">
          <p>• Slice tiles</p>
          <p>• Export PNG / JSON / ZIP / Manifest</p>
          <p>• Collision Editor</p>
          <p>• Unity / Godot Tools</p>
        </div>

        <button className="splash-btn" onClick={() => setShowSplash(false)}>
          ENTER EDITOR
        </button>

        <div className="crt-effect"></div>
      </div>
    );
  }

  /* ======================================================
     MAIN UI
  ====================================================== */
  return (
    <>
      {errorMessage && <div className="error-toast">{errorMessage}</div>}

      {loading && (
        <div className="loader-screen">
          <div className="loader-title">Processing tiles</div>
          <div className="loader-dots">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
        </div>
      )}

      <div className="app">
        <header className="app-header">
          <div className="app-logo-title">
            <img src={logo} alt="logo" className="header-logo" />
            <h1 className="title">Tileset Manager</h1>
          </div>

          <p className="subtitle">
            Import, slice, inspect and tag tiles with collision data.
          </p>

          <div className="gba-toggle-wrapper">
            <div
              className="gba-toggle"
              onClick={() => {
                const isLight = document.body.classList.toggle("theme-light");
                localStorage.setItem("gba-theme", isLight ? "light" : "dark");
              }}
            >
              <div className="gba-toggle-slider"></div>
            </div>
          </div>
        </header>

        <Dropzone setImage={handleImageLoad} />

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
    </>
  );
}
