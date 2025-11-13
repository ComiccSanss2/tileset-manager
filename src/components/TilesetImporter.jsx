import React, { useState } from "react";

export default function TilesetImporter() {
  const [imageSrc, setImageSrc] = useState(null);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="tileset-importer">
      {!imageSrc ? (
        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <p>Dépose ton tileset ici ou clique pour importer</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="preview">
          <img src={imageSrc} alt="Tileset" />
        </div>
      )}
    </div>
  );
}
