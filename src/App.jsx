import React from "react";
import TilesetImporter from "./components/TilesetImporter.jsx";

export default function App() {
  return (
    <div className="app-container">
      <h1>🎨 Tileset Manager</h1>
      <p>Importe un tileset et prépare-le pour Unity.</p>

      <TilesetImporter />
    </div>
  );
}
