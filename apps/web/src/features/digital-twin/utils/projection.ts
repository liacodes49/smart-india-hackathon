import * as THREE from "three";
import proj4 from "proj4";

proj4.defs(
  "EPSG:3031",
  "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
);

const SCENE_SCALE = 1 / 150000;

export function projectToShapeSpace(
  longitude: number,
  latitude: number,
): THREE.Vector2 {
  const [x, y] = proj4(
    "EPSG:4326",
    "EPSG:3031",
    [longitude, latitude],
  );

  return new THREE.Vector2(
    x * SCENE_SCALE,
    y * SCENE_SCALE,
  );
}

export function projectToWorldXZ(
  longitude: number,
  latitude: number,
): {
  x: number;
  z: number;
} {
  const point =
    projectToShapeSpace(
      longitude,
      latitude,
    );

  return {
    x: point.x,
    z: -point.y,
  };
}