import React from "react";

const COLLISION_TYPES = ["none", "solid", "platform", "ladder", "water", "hazard"];

const LABELS = {
  none: "None",
  solid: "Solid",
  platform: "Platform",
  ladder: "Ladder",
  water: "Water",
  hazard: "Hazard",
};

export default function TileInfoPanel({
  tile,
  tileSize,
  collisions,
  onCollisionChange,
}) {
  if (!tile) {
    return (
      <div className="tile-info">
        <h2 className="gba-title">Tile info</h2>
        <p>Hover a tile to see its details and define collisions.</p>
      </div>
    );
  }

  const currentCollision = collisions[tile.id] || "none";

  return (
    <div className="tile-info">
      <h2 className="gba-title">Tile info</h2>

      <p>
        <strong>ID&nbsp;:</strong> {tile.id}
      </p>
      <p>
        <strong>Index&nbsp;:</strong> {tile.index}
      </p>
      <p>
        <strong>Grid Pos&nbsp;:</strong> ({tile.x}, {tile.y})
      </p>
      <p>
        <strong>Size&nbsp;:</strong> {tileSize} × {tileSize}
      </p>

      <div style={{ marginTop: "10px" }}>
        <p style={{ marginBottom: 4 }}>
          <strong>Collision type</strong>
        </p>
        <div className="collision-row">
          {COLLISION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={
                "collision-chip" +
                (currentCollision === type ? " is-active" : "")
              }
              onClick={() => onCollisionChange(tile.id, type)}
            >
              {LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
