import json
from pathlib import Path

import numpy as np
import xarray as xr
from PIL import Image, ImageDraw
from pyproj import Transformer


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

GEOJSON_PATH = PROJECT_ROOT / "apps/web/public/data/antarctica.geojson"

BEDMACHINE_PATH = (
    PROJECT_ROOT
    / "NSIDC-0756_BedMachineAntarctica_19700101-20191001_V04.1.nc"
)

OUTPUT_DIR = PROJECT_ROOT / "apps/web/public/data/terrain"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# SETTINGS
# ============================================================

# Browser-friendly terrain resolution.
# 1024 x 1024 = ~1 million height samples.
RESOLUTION = 1024

# Height exaggeration will be handled in Three.js.
# We keep the real elevation values here.

# Small geographic padding around the GeoJSON.
PADDING_METERS = 50_000


# ============================================================
# COORDINATE TRANSFORM
# ============================================================

# GeoJSON:
# longitude / latitude
# EPSG:4326
#
# BedMachine:
# Antarctic Polar Stereographic
# EPSG:3031

transformer = Transformer.from_crs(
    "EPSG:4326",
    "EPSG:3031",
    always_xy=True,
)


# ============================================================
# LOAD GEOJSON
# ============================================================

print()
print("==============================================")
print(" ANTARCTICA TERRAIN PROCESSOR")
print("==============================================")
print()

print("Loading Antarctica GeoJSON...")

with open(GEOJSON_PATH, "r", encoding="utf-8") as file:
    geojson = json.load(file)


# ============================================================
# EXTRACT ALL COORDINATES
# ============================================================

projected_points = []


def collect_coordinates(coords):
    """
    Recursively collect longitude/latitude pairs
    from GeoJSON coordinate arrays.
    """

    if not coords:
        return

    # A coordinate pair looks like:
    # [longitude, latitude]
    if (
        isinstance(coords, list)
        and len(coords) >= 2
        and isinstance(coords[0], (int, float))
        and isinstance(coords[1], (int, float))
    ):
        lon = float(coords[0])
        lat = float(coords[1])

        x, y = transformer.transform(lon, lat)

        projected_points.append((x, y))

        return

    for child in coords:
        collect_coordinates(child)


geometry = geojson["geometry"]

collect_coordinates(geometry["coordinates"])


if not projected_points:
    raise RuntimeError("No coordinates found in antarctica.geojson")


projected_points = np.array(projected_points)


min_x = projected_points[:, 0].min()
max_x = projected_points[:, 0].max()

min_y = projected_points[:, 1].min()
max_y = projected_points[:, 1].max()


# Add padding.

min_x -= PADDING_METERS
max_x += PADDING_METERS
min_y -= PADDING_METERS
max_y += PADDING_METERS


print()
print("Projected GeoJSON bounds:")
print(f"X: {min_x:,.0f} → {max_x:,.0f}")
print(f"Y: {min_y:,.0f} → {max_y:,.0f}")


# ============================================================
# LOAD BEDMACHINE
# ============================================================

print()
print("Opening BedMachine Antarctica...")

dataset = xr.open_dataset(
    BEDMACHINE_PATH,
    engine="netcdf4",
)


print("BedMachine opened.")


# ============================================================
# READ BEDMACHINE COORDINATES
# ============================================================

x = dataset["x"]
y = dataset["y"]


print()
print("BedMachine grid:")
print(f"X: {float(x.min()):,.0f} → {float(x.max()):,.0f}")
print(f"Y: {float(y.min()):,.0f} → {float(y.max()):,.0f}")


# ============================================================
# CLAMP TO BEDMACHINE
# ============================================================

min_x = max(min_x, float(x.min()))
max_x = min(max_x, float(x.max()))

min_y = max(min_y, float(y.min()))
max_y = min(max_y, float(y.max()))


# ============================================================
# SUBSET THE REAL DATA
# ============================================================

print()
print("Extracting terrain region...")

# BedMachine Y coordinates are descending,
# so we handle both directions safely.

if float(y[0]) > float(y[-1]):
    terrain = dataset["surface"].sel(
        x=slice(min_x, max_x),
        y=slice(max_y, min_y),
    )
else:
    terrain = dataset["surface"].sel(
        x=slice(min_x, max_x),
        y=slice(min_y, max_y),
    )


print("Terrain subset loaded.")


# ============================================================
# LOAD INTO NUMPY
# ============================================================

print()
print("Loading elevation values...")

elevation = terrain.values.astype(np.float32)


# Replace invalid values.

elevation[~np.isfinite(elevation)] = 0

elevation = np.maximum(elevation, 0)


print()
print("Elevation statistics:")
print(f"Minimum: {elevation.min():.2f} m")
print(f"Maximum: {elevation.max():.2f} m")


# ============================================================
# RESAMPLE TO BROWSER RESOLUTION
# ============================================================

print()
print(f"Resampling terrain to {RESOLUTION} x {RESOLUTION}...")


source_height, source_width = elevation.shape


# Create target coordinates.

target_y = np.linspace(
    0,
    source_height - 1,
    RESOLUTION,
)

target_x = np.linspace(
    0,
    source_width - 1,
    RESOLUTION,
)


# Horizontal interpolation.

horizontal = np.empty(
    (source_height, RESOLUTION),
    dtype=np.float32,
)


source_x = np.arange(source_width)


for row in range(source_height):
    horizontal[row] = np.interp(
        target_x,
        source_x,
        elevation[row],
    )


# Vertical interpolation.

resampled = np.empty(
    (RESOLUTION, RESOLUTION),
    dtype=np.float32,
)


source_y = np.arange(source_height)


for column in range(RESOLUTION):
    resampled[:, column] = np.interp(
        target_y,
        source_y,
        horizontal[:, column],
    )


elevation = resampled


# ============================================================
# SAVE HEIGHT DATA
# ============================================================

print()
print("Preparing 16-bit heightmap...")


height_min = float(elevation.min())
height_max = float(elevation.max())


# Store elevation using 16-bit unsigned integers.
#
# This keeps the browser file relatively small while
# preserving useful terrain detail.

if height_max == height_min:
    normalized = np.zeros_like(elevation)
else:
    normalized = (
        (elevation - height_min)
        / (height_max - height_min)
    )


height_uint16 = np.round(
    normalized * 65535
).astype(np.uint16)


heightmap_path = OUTPUT_DIR / "antarctica-height.bin"

height_uint16.tofile(heightmap_path)


# ============================================================
# CREATE MASK
# ============================================================

print()
print("Creating Antarctica mask...")


mask = Image.new(
    "L",
    (RESOLUTION, RESOLUTION),
    0,
)

draw = ImageDraw.Draw(mask)


def draw_polygon(coords):
    """
    Draw a GeoJSON polygon after converting
    longitude/latitude → EPSG:3031 → image coordinates.
    """

    points = []

    for lon, lat, *rest in coords:

        x, y = transformer.transform(
            float(lon),
            float(lat),
        )

        # Convert projected coordinates
        # into normalized terrain coordinates.

        u = (
            (x - min_x)
            / (max_x - min_x)
        )

        v = (
            (max_y - y)
            / (max_y - min_y)
        )

        px = int(
            np.clip(
                u * (RESOLUTION - 1),
                0,
                RESOLUTION - 1,
            )
        )

        py = int(
            np.clip(
                v * (RESOLUTION - 1),
                0,
                RESOLUTION - 1,
            )
        )

        points.append((px, py))

    if len(points) >= 3:
        draw.polygon(
            points,
            fill=255,
        )


def process_geometry(geometry_type, coordinates):

    if geometry_type == "Polygon":

        if coordinates:
            # Exterior ring.
            draw_polygon(coordinates[0])

            # Holes are uncommon here, but support them.
            for hole in coordinates[1:]:
                points = []

                for lon, lat, *rest in hole:

                    x, y = transformer.transform(
                        float(lon),
                        float(lat),
                    )

                    u = (
                        (x - min_x)
                        / (max_x - min_x)
                    )

                    v = (
                        (max_y - y)
                        / (max_y - min_y)
                    )

                    px = int(
                        np.clip(
                            u * (RESOLUTION - 1),
                            0,
                            RESOLUTION - 1,
                        )
                    )

                    py = int(
                        np.clip(
                            v * (RESOLUTION - 1),
                            0,
                            RESOLUTION - 1,
                        )
                    )

                    points.append((px, py))

                if len(points) >= 3:
                    draw.polygon(
                        points,
                        fill=0,
                    )

    elif geometry_type == "MultiPolygon":

        for polygon in coordinates:
            process_geometry(
                "Polygon",
                polygon,
            )


process_geometry(
    geometry["type"],
    geometry["coordinates"],
)


mask_path = OUTPUT_DIR / "antarctica-mask.png"

mask.save(mask_path)


# ============================================================
# SAVE METADATA
# ============================================================

metadata = {
    "projection": "EPSG:3031",
    "source": "NSIDC-0756 BedMachine Antarctica v4.1",
    "resolution": RESOLUTION,
    "width": RESOLUTION,
    "height": RESOLUTION,
    "minElevation": height_min,
    "maxElevation": height_max,
    "bounds": {
        "minX": float(min_x),
        "maxX": float(max_x),
        "minY": float(min_y),
        "maxY": float(max_y),
    },
}


metadata_path = OUTPUT_DIR / "antarctica-terrain.json"

with open(
    metadata_path,
    "w",
    encoding="utf-8",
) as file:

    json.dump(
        metadata,
        file,
        indent=2,
    )


# ============================================================
# CLOSE DATASET
# ============================================================

dataset.close()


# ============================================================
# DONE
# ============================================================

print()
print("==============================================")
print(" TERRAIN PROCESSING COMPLETE")
print("==============================================")
print()

print("Generated files:")

print()
print(heightmap_path)
print(mask_path)
print(metadata_path)

print()
print("Terrain resolution:")
print(f"{RESOLUTION} x {RESOLUTION}")

print()
print("Elevation range:")
print(f"{height_min:.2f} m → {height_max:.2f} m")

print()
print("Projection:")
print("EPSG:3031")

print()
print("Next step:")
print("Connect the generated terrain files to Three.js.")
print()