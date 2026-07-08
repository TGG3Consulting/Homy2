import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  X, ChevronLeft, ChevronRight, Maximize, Minimize,
  Loader2, AlertTriangle, RefreshCw, MapPin, ZoomIn, ZoomOut, RotateCw
} from "lucide-react";
import { useT, getLocalized } from "@/lib/i18n";

/* ── Constants ── */
const DEFAULT_FOV = 75;
const MIN_FOV = 35;
const MAX_FOV = 100;
const BG_OVERLAY = "rgba(30,30,30,0.45)";
const VIOLET = "#8B6CFF";

/* ── Texture cache ── */
const textureCache = {};

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    if (textureCache[url]) return resolve(textureCache[url]);
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => { textureCache[url] = tex; resolve(tex); },
      undefined,
      () => reject(new Error("Failed to load"))
    );
  });
}

export default function VirtualTour({ property, onClose }) {
  const { t, lang } = useT();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const fovRef = useRef(DEFAULT_FOV);

  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [visitedRooms, setVisitedRooms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const tour = property?.virtual_tour;
  const rooms = useMemo(() => tour?.rooms || [], [tour]);
  const roomMap = useMemo(() => {
    const map = {};
    rooms.forEach((r) => { map[r.id] = r; });
    return map;
  }, [rooms]);
  const currentRoom = roomMap[currentRoomId];
  const roomIndex = rooms.findIndex((r) => r.id === currentRoomId);

  /* ── Destroy Three.js scene ── */
  const destroyScene = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current && rendererRef.current.domElement.parentNode) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current = null;
    }
    if (sceneRef.current) {
      sceneRef.current.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) {
            // keep in cache, don't dispose
          }
          obj.material.dispose();
        }
      });
      sceneRef.current = null;
    }
    cameraRef.current = null;
  }, []);

  /* ── Reset camera to default ── */
  const resetView = useCallback(() => {
    lonRef.current = 0;
    latRef.current = 0;
    fovRef.current = DEFAULT_FOV;
    if (cameraRef.current) {
      cameraRef.current.fov = DEFAULT_FOV;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  /* ── Zoom controls ── */
  const zoomIn = useCallback(() => {
    fovRef.current = Math.max(MIN_FOV, fovRef.current - 8);
    if (cameraRef.current) {
      cameraRef.current.fov = fovRef.current;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  const zoomOut = useCallback(() => {
    fovRef.current = Math.min(MAX_FOV, fovRef.current + 8);
    if (cameraRef.current) {
      cameraRef.current.fov = fovRef.current;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  /* ── Create Three.js scene ── */
  const createScene = useCallback(async (room) => {
    if (!containerRef.current || !room?.panorama_url) return;
    destroyScene();

    setLoading(true);
    setLoadProgress(0);
    setError(null);
    resetView();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Load texture
    try {
      const texture = await loadTexture(room.panorama_url);
      texture.colorSpace = THREE.SRGBColorSpace;

      // Sphere
      const geometry = new THREE.SphereGeometry(50, 64, 32);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);

      setLoading(false);
      setLoadProgress(100);
    } catch (err) {
      setError(err.message || "Failed to load panorama");
      setLoading(false);
      return;
    }

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Update camera from spherical coordinates
      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);
      const target = new THREE.Vector3();
      target.x = Math.sin(phi) * Math.cos(theta);
      target.y = Math.cos(phi);
      target.z = Math.sin(phi) * Math.sin(theta);
      camera.lookAt(target);

      renderer.render(scene, camera);
    };
    animate();
  }, [destroyScene, resetView]);

  /* ── Mouse / Touch handlers ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e) => {
      e.preventDefault();
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX || (e.touches && e.touches[0].clientX) || 0, y: e.clientY || (e.touches && e.touches[0].clientY) || 0 };
      if (showHint) setShowHint(false);
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const dx = clientX - prevMouseRef.current.x;
      const dy = clientY - prevMouseRef.current.y;
      lonRef.current += dx * 0.3;
      latRef.current -= dy * 0.2;
      latRef.current = Math.max(-85, Math.min(85, latRef.current));
      prevMouseRef.current = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      fovRef.current += e.deltaY * 0.05;
      fovRef.current = Math.max(MIN_FOV, Math.min(MAX_FOV, fovRef.current));
      if (cameraRef.current) {
        cameraRef.current.fov = fovRef.current;
        cameraRef.current.updateProjectionMatrix();
      }
      if (showHint) setShowHint(false);
    };

    const onKeyDown = (e) => {}; // handled at window level

    container.addEventListener("mousedown", onPointerDown);
    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("mouseup", onPointerUp);
    container.addEventListener("mouseleave", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onPointerDown, { passive: false });
    container.addEventListener("touchmove", onPointerMove, { passive: false });
    container.addEventListener("touchend", onPointerUp);

    return () => {
      container.removeEventListener("mousedown", onPointerDown);
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("mouseleave", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onPointerDown);
      container.removeEventListener("touchmove", onPointerMove);
      container.removeEventListener("touchend", onPointerUp);
    };
  }, [showHint]);

  /* ── Resize handler ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  /* ── Load room when currentRoomId changes ── */
  useEffect(() => {
    if (currentRoom) {
      createScene(currentRoom);
    }
    return () => destroyScene();
  }, [currentRoomId]);

  /* ── Init from tour ── */
  useEffect(() => {
    const startRoomId = tour?.start_room_id || rooms[0]?.id;
    if (startRoomId && !currentRoomId) {
      setCurrentRoomId(startRoomId);
      setVisitedRooms((prev) => new Set([...prev, startRoomId]));
    }
  }, [tour, rooms, currentRoomId]);

  /* ── Keyboard ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (showRoomList) setShowRoomList(false);
        else onClose();
      }
      if (e.key === "ArrowLeft") navigatePrev();
      if (e.key === "ArrowRight") navigateNext();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [showRoomList, roomIndex, rooms, currentRoomId]);

  /* ── Fullscreen ── */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current?.closest(".vt-fullscreen-target") || containerRef.current?.parentElement;
    if (!isFullscreen) {
      el?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  /* ── Navigation ── */
  const navigateToRoom = (roomId) => {
    if (roomId && roomMap[roomId]) {
      setCurrentRoomId(roomId);
      setVisitedRooms((prev) => new Set([...prev, roomId]));
    }
  };

  const navigatePrev = () => {
    if (rooms.length === 0) return;
    const idx = (roomIndex - 1 + rooms.length) % rooms.length;
    const newId = rooms[idx].id;
    setCurrentRoomId(newId);
    setVisitedRooms((prev) => new Set([...prev, newId]));
  };

  const navigateNext = () => {
    if (rooms.length === 0) return;
    const idx = (roomIndex + 1) % rooms.length;
    const newId = rooms[idx].id;
    setCurrentRoomId(newId);
    setVisitedRooms((prev) => new Set([...prev, newId]));
  };

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget && !showRoomList) onClose();
  };

  /* ── Unavailable state ── */
  if (!tour?.enabled || rooms.length === 0) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: BG_OVERLAY, backdropFilter: "blur(20px)" }} />
        <div
          className="relative z-10 rounded-2xl px-8 py-10 text-center max-w-[360px]"
          style={{
            backgroundColor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          }}
        >
          <AlertTriangle size={32} style={{ color: "#D4A54A", margin: "0 auto 12px" }} />
          <p className="text-[15px] font-body font-semibold mb-1" style={{ color: "#242424" }}>{t("virtualTour.unavailable")}</p>
          <p className="text-[12px] font-body mb-4" style={{ color: "#999" }}>{t("virtualTour.unavailableDesc")}</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-[13px] font-body font-semibold transition-all duration-200"
            style={{ backgroundColor: VIOLET, color: "#FFF" }}
          >
            {t("virtualTour.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 rounded-[28px] overflow-hidden vt-fullscreen-target"
      onClick={handleOutsideClick}
    >
      {/* Overlay bg */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: BG_OVERLAY, backdropFilter: "blur(24px) saturate(140%)", WebkitBackdropFilter: "blur(24px) saturate(140%)" }}
      />

      {/* Tour Container */}
      <div
        className="absolute inset-4 md:inset-6 rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "rgba(18,18,18,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ backgroundColor: "rgba(18,18,18,0.4)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRoomList(!showRoomList)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-medium transition-all duration-200"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <MapPin size={13} />
              {currentRoom ? getLocalized(currentRoom.name, lang) : ""}
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>▾</span>
            </button>
            <span className="text-[11px] font-body" style={{ color: "rgba(255,255,255,0.35)" }}>
              {roomIndex + 1} {t("virtualTour.of")} {rooms.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={zoomIn}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={zoomOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={resetView}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Reset view"
            >
              <RotateCw size={14} />
            </button>
            <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
            <button
              onClick={navigatePrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
              title={t("virtualTour.previous")}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={navigateNext}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
              title={t("virtualTour.next")}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
              title={isFullscreen ? t("virtualTour.exitFullscreen") : t("virtualTour.fullscreen")}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
            <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.7)" }}
              title={t("virtualTour.close")}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Panorama Area ── */}
        <div className="flex-1 relative min-h-0">
          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backgroundColor: "rgba(18,18,18,0.7)" }}>
              <Loader2 size={36} className="animate-spin mb-3" style={{ color: VIOLET }} />
              <p className="text-[12px] font-body mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{t("virtualTour.loading")}</p>
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${loadProgress}%`, backgroundColor: VIOLET }}
                />
              </div>
              <p className="text-[10px] font-body mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{loadProgress}%</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backgroundColor: "rgba(18,18,18,0.8)" }}>
              <AlertTriangle size={32} style={{ color: "#D4A54A", marginBottom: 12 }} />
              <p className="text-[14px] font-body mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>{t("virtualTour.error")}</p>
              <p className="text-[11px] font-body mb-4" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 280, textAlign: "center" }}>{error}</p>
              <button
                onClick={() => currentRoom && createScene(currentRoom)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-body font-medium transition-all duration-200"
                style={{ backgroundColor: "rgba(139,108,255,0.2)", color: VIOLET, border: "1px solid rgba(139,108,255,0.3)" }}
              >
                <RefreshCw size={13} />
                {t("virtualTour.retry")}
              </button>
            </div>
          )}

          {/* Three.js container */}
          <div ref={containerRef} className="absolute inset-0" />

          {/* Hint */}
          {showHint && !loading && !error && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span
                className="text-[11px] font-body px-4 py-1.5 rounded-full"
                style={{
                  backgroundColor: "rgba(0,0,0,0.55)",
                  color: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {t("virtualTour.hint")}
              </span>
            </div>
          )}

          {/* Hotspot overlay */}
          {currentRoom?.hotspots?.map((hs, i) => {
            const targetRoom = roomMap[hs.target_room_id];
            if (!targetRoom) return null;
            return (
              <div
                key={i}
                className="absolute cursor-pointer group z-10"
                style={{
                  left: `${hs.x * 100}%`,
                  top: `${hs.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto",
                }}
                onClick={(e) => { e.stopPropagation(); navigateToRoom(hs.target_room_id); }}
                title={getLocalized(targetRoom.name, lang)}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
                  style={{
                    backgroundColor: "rgba(139,108,255,0.25)",
                    border: "1.5px solid rgba(139,108,255,0.5)",
                    boxShadow: "0 0 16px rgba(139,108,255,0.2)",
                  }}
                >
                  <ChevronRight size={18} style={{ color: VIOLET }} />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <span
                    className="text-[9px] font-body font-medium whitespace-nowrap px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#fff" }}
                  >
                    {getLocalized(targetRoom.name, lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Room Navigator ── */}
        <div
          className="flex-shrink-0 px-4 py-2.5 overflow-x-auto"
          style={{
            backgroundColor: "rgba(18,18,18,0.3)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-2 min-w-max">
            {rooms.map((room) => {
              const isActive = room.id === currentRoomId;
              const isVisited = visitedRooms.has(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => navigateToRoom(room.id)}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-body font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? "rgba(139,108,255,0.2)" : isVisited ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                    color: isActive ? VIOLET : isVisited ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${isActive ? "rgba(139,108,255,0.3)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {isVisited && !isActive && <span style={{ color: VIOLET, marginRight: 3 }}>✓</span>}
                  {getLocalized(room.name, lang)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Room List Popover ── */}
      {showRoomList && (
        <div className="absolute top-14 left-6 z-30" onClick={(e) => e.stopPropagation()}>
          <div
            className="rounded-xl p-1.5 min-w-[180px]"
            style={{
              backgroundColor: "rgba(30,30,30,0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            }}
          >
            {rooms.map((room) => {
              const isActive = room.id === currentRoomId;
              const isVisited = visitedRooms.has(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => { navigateToRoom(room.id); setShowRoomList(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-body text-left transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? "rgba(139,108,255,0.15)" : "transparent",
                    color: isActive ? VIOLET : "rgba(255,255,255,0.75)",
                  }}
                >
                  <MapPin size={12} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
                  <span className="flex-1">{getLocalized(room.name, lang)}</span>
                  {isActive && <span style={{ fontSize: "9px", backgroundColor: "rgba(139,108,255,0.25)", color: VIOLET, padding: "1px 6px", borderRadius: 4 }}>{t("virtualTour.current")}</span>}
                  {isVisited && !isActive && <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}