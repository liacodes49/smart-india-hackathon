"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { HealthSeverity } from "@/features/analytics/types";
import {
  Box,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Eye,
} from "lucide-react";

export interface Analytics3DAsset {
  id: string;
  name: string;
  category: "GENERATOR" | "FUEL_TANK" | "POWER_INFRA";
  state: HealthSeverity;
  position: [number, number, number];
  dimensions: [number, number, number];
  primaryMetric: string;
  primaryValue: string;
  temperatureC?: number;
  statusText: string;
  details: { label: string; value: string }[];
}

interface Station3DAnalyticsViewProps {
  stationName: string;
  stationId: "MAITRI" | "BHARATI";
}

export function Station3DAnalyticsView({
  stationName,
  stationId,
}: Station3DAnalyticsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("GEN-02"); // Default to GEN-02 which has a warning
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    "ALL" | "GENERATOR" | "FUEL_TANK" | "POWER_INFRA"
  >("ALL");

  // Telemetry assets list for the 3D station
  const assets: Analytics3DAsset[] = useMemo(() => {
    const isMaitri = stationId === "MAITRI";
    return [
      // 1. Generators
      {
        id: "GEN-01",
        name: isMaitri ? "Generator 01 (Cummins 250kVA)" : "Generator 01 (Volvo 350kVA)",
        category: "GENERATOR",
        state: "HEALTHY",
        position: [-6, 1.2, 0],
        dimensions: [3, 2.2, 1.8],
        primaryMetric: "Load",
        primaryValue: isMaitri ? "82%" : "70%",
        temperatureC: isMaitri ? 84.2 : 78.4,
        statusText: "RUNNING — Synchronized to 50Hz microgrid bus",
        details: [
          { label: "Rated Output", value: isMaitri ? "250 kVA" : "350 kVA" },
          { label: "Fuel Burn", value: isMaitri ? "28.6 L/h" : "30.1 L/h" },
          { label: "Efficiency", value: isMaitri ? "41.8%" : "43.6%" },
          { label: "Vibration", value: isMaitri ? "2.1 mm/s (Nominal)" : "1.6 mm/s" },
        ],
      },
      {
        id: "GEN-02",
        name: isMaitri ? "Generator 02 (Cummins 250kVA)" : "Generator 02 (Volvo 350kVA)",
        category: "GENERATOR",
        state: isMaitri ? "WARNING" : "HEALTHY",
        position: [-6, 1.2, 3.5],
        dimensions: [3, 2.2, 1.8],
        primaryMetric: "Load",
        primaryValue: isMaitri ? "71%" : "66%",
        temperatureC: isMaitri ? 91.6 : 76.2,
        statusText: isMaitri
          ? "WARNING — Elevated cylinder manifold temperature (91.6°C)"
          : "RUNNING — Optimal thermal efficiency",
        details: [
          { label: "Thermal Advisory", value: isMaitri ? "+7.2°C over baseline" : "Nominal" },
          { label: "Fuel Burn", value: isMaitri ? "23.8 L/h" : "28.1 L/h" },
          { label: "Efficiency", value: isMaitri ? "38.4%" : "42.9%" },
          { label: "Next Service", value: isMaitri ? "in 42 hours" : "in 380 hours" },
        ],
      },
      {
        id: "GEN-03",
        name: isMaitri ? "Generator 03 (Standby Backup)" : "Generator 03 (Volvo 350kVA)",
        category: "GENERATOR",
        state: "HEALTHY",
        position: [-6, 1.2, -3.5],
        dimensions: [3, 2.2, 1.8],
        primaryMetric: "State",
        primaryValue: "STANDBY",
        temperatureC: 22.4,
        statusText: "WARM STANDBY — Block pre-heater active, auto-start ready",
        details: [
          { label: "Pre-heat Temp", value: "22.4°C (Ready)" },
          { label: "Auto-Start", value: "Armed (Grid Failure Trigger)" },
          { label: "Battery Cranking", value: "27.4V (Optimal)" },
          { label: "Fuel Line", value: "Pressurized & Trace Heated" },
        ],
      },

      // 2. Fuel Tanks
      {
        id: "TANK-01",
        name: "POL Bulk Storage Tank Alpha",
        category: "FUEL_TANK",
        state: "HEALTHY",
        position: [4, 1.8, -4],
        dimensions: [3.8, 3.2, 2.4],
        primaryMetric: "Level",
        primaryValue: isMaitri ? "72.8% (58.2k L)" : "88.4% (88.4k L)",
        temperatureC: -12.0,
        statusText: "OPTIMAL — Internal thermal circulation coils nominal",
        details: [
          { label: "Fuel Type", value: "Aviation/Polar Grade ATF" },
          { label: "Capacity", value: isMaitri ? "80,000 Litres" : "100,000 Litres" },
          { label: "Burn Feed", value: "Active primary draw" },
          { label: "Bottom Sludge", value: "<0.1% Nominal" },
        ],
      },
      {
        id: "TANK-02",
        name: "POL Bulk Storage Tank Bravo",
        category: "FUEL_TANK",
        state: "HEALTHY",
        position: [4, 1.8, 0],
        dimensions: [3.8, 3.2, 2.4],
        primaryMetric: "Level",
        primaryValue: isMaitri ? "58.5% (46.8k L)" : "79.2% (79.2k L)",
        temperatureC: -13.5,
        statusText: "OPTIMAL — Pressure relief and breather valve nominal",
        details: [
          { label: "Fuel Type", value: "Aviation/Polar Grade ATF" },
          { label: "Capacity", value: isMaitri ? "80,000 Litres" : "100,000 Litres" },
          { label: "Burn Feed", value: "Secondary standby manifold" },
          { label: "Inspection", value: "Current certified" },
        ],
      },
      {
        id: "TANK-03",
        name: "Emergency Reserve Tank Charlie",
        category: "FUEL_TANK",
        state: "HEALTHY",
        position: [4, 1.8, 4],
        dimensions: [3.2, 2.8, 2.2],
        primaryMetric: "Level",
        primaryValue: isMaitri ? "82.5% (19.8k L)" : "83.6% (41.8k L)",
        temperatureC: -14.0,
        statusText: "RESERVE — Isolated security buffer for polar winter lock",
        details: [
          { label: "Capacity", value: isMaitri ? "24,000 Litres" : "50,000 Litres" },
          { label: "Purpose", value: "Emergency Life Support Reserve" },
          { label: "Isolation Valve", value: "Interlocked Closed" },
        ],
      },
      {
        id: "TANK-04",
        name: "Day Service Gravity Feeder Tank",
        category: "FUEL_TANK",
        state: "HEALTHY",
        position: [-2.5, 2.5, 0],
        dimensions: [1.8, 1.6, 1.6],
        primaryMetric: "Level",
        primaryValue: isMaitri ? "90.0% (3,600 L)" : "92.0% (4,600 L)",
        temperatureC: 18.5,
        statusText: "OPTIMAL — Gravity feeding active running generators",
        details: [
          { label: "Capacity", value: isMaitri ? "4,000 Litres" : "5,000 Litres" },
          { label: "Internal Temp", value: "+18.5°C Heated" },
          { label: "Feed Pressure", value: "2.4 bar Gravity" },
        ],
      },

      // 3. Power Infrastructure
      {
        id: "GRID-SUB",
        name: "Central Microgrid Substation & Switchgear",
        category: "POWER_INFRA",
        state: "HEALTHY",
        position: [-0.5, 1.2, 0],
        dimensions: [3.2, 2.4, 2.4],
        primaryMetric: "Frequency",
        primaryValue: "50.04 Hz",
        temperatureC: 24.1,
        statusText: "NOMINAL — Automated load balancing and power factor correction",
        details: [
          { label: "Bus Voltage", value: "415V 3-Phase 50Hz" },
          { label: "Power Factor", value: "0.94 Lagging" },
          { label: "Harmonic Distortion", value: "<2.1% THD" },
          { label: "Breakers", value: "All feeder circuits online" },
        ],
      },
      {
        id: "BESS-01",
        name: "BESS Battery Storage Unit (100 kWh)",
        category: "POWER_INFRA",
        state: "HEALTHY",
        position: [-0.5, 1.0, 3.8],
        dimensions: [2.5, 2.0, 1.8],
        primaryMetric: "SOC",
        primaryValue: "94.2%",
        temperatureC: 21.0,
        statusText: "BUFFER ACTIVE — Absorbing load transients and frequency dips",
        details: [
          { label: "Chemistry", value: "Lithium Iron Phosphate (LiFePO4)" },
          { label: "Cycle Count", value: "482 Cycles (98% Health)" },
          { label: "Inverter Output", value: "50 kW Max Peak Surge" },
          { label: "Thermal Loop", value: "+21.0°C Enclosure" },
        ],
      },
      {
        id: "TRACE-HEAT",
        name: "Perimeter Pipeline Heat Tracing Controller",
        category: "POWER_INFRA",
        state: isMaitri ? "WARNING" : "HEALTHY",
        position: [0.5, 0.8, -4.5],
        dimensions: [2.0, 1.6, 1.4],
        primaryMetric: "Duty Cycle",
        primaryValue: isMaitri ? "88% (High)" : "62%",
        temperatureC: -34.8,
        statusText: isMaitri
          ? "WARNING — High continuous thermal duty due to -35°C polar cold"
          : "NOMINAL — Water & fuel line anti-freeze protection active",
        details: [
          { label: "Active Circuits", value: "14 of 14 Heated" },
          { label: "Current Draw", value: isMaitri ? "34 kW" : "22 kW" },
          { label: "Loop Integrity", value: "100% Continuity" },
          { label: "Ground Fault", value: "0.0 mA Leakage" },
        ],
      },
    ];
  }, [stationId]);

  const selectedAsset =
    assets.find((a) => a.id === selectedAssetId) || assets[0];

  const filteredAssets = useMemo(() => {
    if (activeCategoryFilter === "ALL") return assets;
    return assets.filter((a) => a.category === activeCategoryFilter);
  }, [assets, activeCategoryFilter]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040810);
    scene.fog = new THREE.FogExp2(0x040810, 0.022);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const defaultCamPos = new THREE.Vector3(14, 12, 16);
    camera.position.copy(defaultCamPos);
    const targetLookAt = new THREE.Vector3(0, 1, 0);
    camera.lookAt(targetLookAt);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const bluePoint = new THREE.PointLight(0x06b6d4, 1.5, 30);
    bluePoint.position.set(-6, 4, 0);
    scene.add(bluePoint);

    const warningPoint = new THREE.PointLight(0xf59e0b, 1.8, 20);
    warningPoint.position.set(-6, 3, 3.5);
    scene.add(warningPoint);

    // 5. Antarctic Ice Pad & Reticle Grid
    const gridHelper = new THREE.GridHelper(36, 36, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070d18,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Cable Conduits on Floor (Connecting powerhouse to substation & tanks)
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    });

    const conduitGeo1 = new THREE.BoxGeometry(6, 0.08, 0.3);
    const conduit1 = new THREE.Mesh(conduitGeo1, conduitMat);
    conduit1.position.set(-3, 0.04, 0);
    scene.add(conduit1);

    const conduitGeo2 = new THREE.BoxGeometry(4.5, 0.08, 0.3);
    const conduit2 = new THREE.Mesh(conduitGeo2, conduitMat);
    conduit2.position.set(1.8, 0.04, 0);
    scene.add(conduit2);

    // 6. Build Interactive Station Asset Meshes
    const interactiveMeshes: THREE.Mesh[] = [];
    const meshesByAssetId = new Map<string, THREE.Group>();

    assets.forEach((asset) => {
      const group = new THREE.Group();
      group.position.set(...asset.position);

      const [w, h, d] = asset.dimensions;
      const isHealthy = asset.state === "HEALTHY";
      const isWarning = asset.state === "WARNING";

      // Color mapping
      const baseColor =
        asset.category === "GENERATOR"
          ? 0x0f172a // slate dark body
          : asset.category === "FUEL_TANK"
          ? 0x0c1e33 // dark navy tank
          : 0x0a192f;

      const stateAccent = isHealthy
        ? 0x10b981 // emerald
        : isWarning
        ? 0xf59e0b // amber
        : 0xf43f5e; // rose

      // Primary body geometry
      let mainMesh: THREE.Mesh;
      if (asset.category === "FUEL_TANK") {
        // Cylindrical tank
        const tankGeo = new THREE.CylinderGeometry(d / 2, d / 2, w, 24);
        const tankMat = new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.6,
          roughness: 0.35,
        });
        mainMesh = new THREE.Mesh(tankGeo, tankMat);
        mainMesh.rotation.z = Math.PI / 2;
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
      } else {
        // Box enclosure for generators and switchgear
        const boxGeo = new THREE.BoxGeometry(w, h, d);
        const boxMat = new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.5,
          roughness: 0.4,
        });
        mainMesh = new THREE.Mesh(boxGeo, boxMat);
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
      }

      // Attach asset metadata for raycasting
      mainMesh.userData = { assetId: asset.id };
      interactiveMeshes.push(mainMesh);
      group.add(mainMesh);

      // Operational Status Glow Rings / Accent Caps
      const accentGeo = new THREE.BoxGeometry(w * 0.95, 0.12, d * 0.95);
      const accentMat = new THREE.MeshStandardMaterial({
        color: stateAccent,
        emissive: stateAccent,
        emissiveIntensity: isWarning ? 0.9 : 0.5,
        roughness: 0.2,
      });
      const accentMesh = new THREE.Mesh(accentGeo, accentMat);
      accentMesh.position.y = h / 2 + 0.06;
      group.add(accentMesh);

      // Flashing status beacon light on top
      const beaconGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: stateAccent });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(0, h / 2 + 0.35, 0);
      group.add(beaconMesh);

      // If generator: add exhaust stack detail
      if (asset.category === "GENERATOR") {
        const exhaustGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12);
        const exhaustMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.8,
          roughness: 0.2,
        });
        const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
        exhaust.position.set(w * 0.35, h / 2 + 0.6, 0);
        group.add(exhaust);
      }

      // Selection indicator halo (starts hidden, toggled via selection)
      const haloGeo = new THREE.RingGeometry(
        Math.max(w, d) * 0.65,
        Math.max(w, d) * 0.75,
        32
      );
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.05;
      halo.name = "selectionHalo";
      halo.visible = asset.id === selectedAssetId;
      group.add(halo);

      scene.add(group);
      meshesByAssetId.set(asset.id, group);
    });

    // 7. Interactive Orbit Math (Mouse Drag / Touch)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let sphericalTheta = Math.PI / 4;
    let sphericalPhi = Math.PI / 3.2;
    let sphericalRadius = 24;

    const updateCameraFromSpherical = () => {
      camera.position.x =
        targetLookAt.x +
        sphericalRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y =
        targetLookAt.y + sphericalRadius * Math.cos(sphericalPhi);
      camera.position.z =
        targetLookAt.z +
        sphericalRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(targetLookAt);
    };
    updateCameraFromSpherical();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalTheta -= deltaX * 0.008;
      sphericalPhi = Math.max(
        0.2,
        Math.min(Math.PI / 2.1, sphericalPhi - deltaY * 0.008)
      );
      updateCameraFromSpherical();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRadius = Math.max(10, Math.min(45, sphericalRadius + e.deltaY * 0.03));
      updateCameraFromSpherical();
    };

    // 8. Raycaster for clicking objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const assetId = hit.userData.assetId;
        if (assetId) {
          setSelectedAssetId(assetId);
        }
      }
    };

    // Attach listeners
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("click", onClick);

    // 9. Resize handler
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", onResize);

    // 10. Animation render loop (with pulsing beacon animation)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle atmospheric pulsation on warning assets
      warningPoint.intensity = 1.4 + Math.sin(elapsedTime * 4) * 0.8;

      // Update halos
      meshesByAssetId.forEach((group, assetId) => {
        const halo = group.getObjectByName("selectionHalo");
        if (halo) {
          halo.visible = assetId === selectedAssetId;
          if (halo.visible) {
            halo.rotation.z = elapsedTime * 0.5;
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [assets, selectedAssetId]);

  return (
    <section
      aria-label="3D Station Analytics Viewport"
      className="p-4 rounded-2xl border border-cyan-500/30 bg-[#080d16]/95 backdrop-blur-md font-mono select-none flex flex-col gap-3.5 shadow-[0_0_25px_rgba(6,182,212,0.1)]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-200">
              INTERACTIVE 3D STATION ANALYTICS — [{stationName}]
            </h3>
            <p className="text-[10px] text-slate-400">
              Spatial Telemetry View: Generators • POL Fuel Farm • Power Infrastructure
            </p>
          </div>
        </div>

        {/* Operational State Legend */}
        <div className="flex items-center gap-2 text-[9.5px]">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            HEALTHY
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            WARNING
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            CRITICAL
          </span>
        </div>
      </div>

      {/* Main 3D Canvas & Telemetry Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left 8 cols: Three.js WebGL Viewport Container */}
        <div className="lg:col-span-8 flex flex-col rounded-xl border border-white/[0.08] bg-[#03060c] overflow-hidden relative min-h-[380px] lg:min-h-[440px]">
          {/* Viewport Top Bar Controls Overlay */}
          <div className="absolute top-2 left-2 right-2 z-10 flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-lg bg-[#060a12]/80 backdrop-blur-md border border-white/[0.08] text-[10px]">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 px-1 font-bold uppercase hidden sm:inline">
                FILTER:
              </span>
              {(
                [
                  { id: "ALL", label: "ALL ASSETS" },
                  { id: "GENERATOR", label: "GENSETS" },
                  { id: "FUEL_TANK", label: "FUEL TANKS" },
                  { id: "POWER_INFRA", label: "POWER GRID" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(f.id)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeCategoryFilter === f.id
                      ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[9px] px-1">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Drag to orbit • Scroll to zoom • Click asset to inspect</span>
            </div>
          </div>

          {/* Three.js DOM Container */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full min-h-[380px] lg:min-h-[440px] cursor-grab active:cursor-grabbing"
          />

          {/* Bottom Quick-Select Strip */}
          <div className="p-2 border-t border-white/[0.06] bg-[#060a12]/90 flex items-center gap-1.5 overflow-x-auto text-[9.5px]">
            <span className="text-slate-400 font-bold uppercase shrink-0 px-1">
              SELECT:
            </span>
            {filteredAssets.map((a) => {
              const isSelected = selectedAssetId === a.id;
              const isHealthy = a.state === "HEALTHY";
              const isWarning = a.state === "WARNING";

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isHealthy
                        ? "bg-emerald-400"
                        : isWarning
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span>{a.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 4 cols: Selected Asset Live Telemetry Inspector Dock */}
        <div className="lg:col-span-4 p-3.5 rounded-xl border border-white/[0.08] bg-slate-950/80 backdrop-blur-md flex flex-col justify-between gap-3">
          <div>
            {/* Asset Identity Banner */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    ACTIVE 3D TARGET
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1 leading-snug truncate">
                  {selectedAsset.name}
                </h4>
                <span className="text-[9.5px] text-slate-400">
                  ID: [{selectedAsset.id}] • {selectedAsset.category}
                </span>
              </div>

              {/* State Badge */}
              <span
                className={`text-[9.5px] px-2 py-0.5 rounded border font-bold uppercase shrink-0 flex items-center gap-1 ${
                  selectedAsset.state === "HEALTHY"
                    ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                    : selectedAsset.state === "WARNING"
                    ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                    : "bg-rose-950/80 border-rose-500/50 text-rose-300"
                }`}
              >
                {selectedAsset.state === "HEALTHY" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : selectedAsset.state === "WARNING" ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <ShieldAlert className="w-3 h-3" />
                )}
                {selectedAsset.state}
              </span>
            </div>

            {/* Primary Vitals Strip */}
            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.04]">
                <span className="text-[9px] text-slate-400 block uppercase">
                  {selectedAsset.primaryMetric}
                </span>
                <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                  {selectedAsset.primaryValue}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.04]">
                <span className="text-[9px] text-slate-400 block uppercase">
                  Temperature
                </span>
                <span
                  className={`text-sm font-bold mt-0.5 block ${
                    selectedAsset.temperatureC && selectedAsset.temperatureC > 85
                      ? "text-amber-400"
                      : "text-slate-200"
                  }`}
                >
                  {selectedAsset.temperatureC !== undefined
                    ? `${selectedAsset.temperatureC}°C`
                    : "Nominal"}
                </span>
              </div>
            </div>

            {/* Status Narrative Callout */}
            <div
              className={`p-2.5 rounded-lg border text-[10.5px] leading-relaxed mb-3 ${
                selectedAsset.state === "WARNING"
                  ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                  : selectedAsset.state === "CRITICAL"
                  ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                  : "bg-cyan-950/20 border-cyan-500/20 text-slate-300"
              }`}
            >
              <span className="font-bold block text-[10px] uppercase mb-0.5">
                OPERATIONAL DIAGNOSTIC:
              </span>
              {selectedAsset.statusText}
            </div>

            {/* Detailed Telemetry Channels */}
            <div className="space-y-1.5 text-[10px]">
              <span className="text-slate-400 font-bold uppercase text-[9px] block mb-1">
                Subsystem Parameters:
              </span>
              {selectedAsset.details.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-white/[0.04]"
                >
                  <span className="text-slate-400">{d.label}:</span>
                  <span className="font-bold text-slate-200">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.04] text-[9px] text-slate-500 flex items-center justify-between">
            <span>Spatial telemetry synced with 3D model</span>
            <span className="text-cyan-400">100% Raycast Link</span>
          </div>
        </div>
      </div>
    </section>
  );
}
