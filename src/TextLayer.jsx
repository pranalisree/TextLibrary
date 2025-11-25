"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Palette, Trash2 } from "lucide-react";
import MoveableTextBox from "./MoveableTextBox";

// Default new text box size
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 40;

// 👉 This is what you export from your library
const TextLayer = forwardRef(function TextLayer(props, ref) {
  const containerRef = useRef(null);

  const [textLabels, setTextLabels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Ghost placement state
  const [isPlacing, setIsPlacing] = useState(false);
  const [ghostPos, setGhostPos] = useState(null);

  // Border dropdown inside toolbar
  const [borderMenuOpen, setBorderMenuOpen] = useState(false);
  const borderMenuRef = useRef(null);

  // Expose an API to parent via ref
  useImperativeHandle(ref, () => ({
    startPlacement() {
      setIsPlacing(true);
      setSelectedId(null);
      setGhostPos(null);
    },
  }));

  const selectedLabel = textLabels.find((l) => l.id === selectedId) || null;

  // Placement: ghost follows mouse, click places real box
  useEffect(() => {
    if (!isPlacing) return;
    const container = containerRef.current;
    if (!container) return;

    function handleMouseMove(e) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - DEFAULT_WIDTH / 2;
      const y = e.clientY - rect.top - DEFAULT_HEIGHT / 2;
      setGhostPos({ x, y });
    }

    function handleClick(e) {
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inside) {
        // clicked outside container: cancel placement
        setIsPlacing(false);
        setGhostPos(null);
        return;
      }

      const x = e.clientX - rect.left - DEFAULT_WIDTH / 2;
      const y = e.clientY - rect.top - DEFAULT_HEIGHT / 2;

      const newLabel = {
        id: Date.now(),
        text: "New Text",
        x,
        y,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        color: "#111",
        highlight: "transparent",
        fontSize: "16px",
        fontFamily: "Montserrat",
        bold: false,
        italic: false,
        underline: false,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#008080",
      };

      setTextLabels((prev) => [...prev, newLabel]);
      setSelectedId(newLabel.id);
      setIsPlacing(false);
      setGhostPos(null);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
    };
  }, [isPlacing]);

  // Click outside text/toolbar → hide toolbar (deselect)
  useEffect(() => {
    function handleClickOutside(e) {
      const container = containerRef.current;
      if (!container) return;

      const clickedInsideText =
        e.target.closest?.('[data-text-layer-element="true"]');
      const clickedToolbar =
        e.target.closest?.('[data-text-layer-toolbar="true"]');

      if (!clickedInsideText && !clickedToolbar) {
        setSelectedId(null);
        setBorderMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Border dropdown click-outside (just for the small menu)
  useEffect(() => {
    function handleBorderClickOutside(e) {
      if (
        borderMenuRef.current &&
        !borderMenuRef.current.contains(e.target)
      ) {
        setBorderMenuOpen(false);
      }
    }

    if (borderMenuOpen) {
      document.addEventListener("mousedown", handleBorderClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleBorderClickOutside);
  }, [borderMenuOpen]);

  const updateSelectedLabel = (updates) => {
    if (!selectedLabel) return;
    const id = selectedLabel.id;
    setTextLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // background stays interactive
      }}
    >
      {/* Actual text labels */}
      {textLabels.map((label) => (
        <MoveableTextBox
          key={label.id}
          {...label}
          isSelected={selectedId === label.id}
          onSelect={(id) => setSelectedId(id)}
          onUpdate={(id, updates) => {
            setTextLabels((prev) =>
              prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
            );
          }}
        />
      ))}

      {/* GHOST "New Text" while placing */}
      {isPlacing && ghostPos && (
        <div
          style={{
            position: "absolute",
            left: ghostPos.x,
            top: ghostPos.y,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            border: "1px dashed #008080",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.6)",
            color: "#008080",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          New Text
        </div>
      )}

      {/* FIXED toolbar (top center) */}
      {selectedLabel && (
        <div
          data-text-layer-toolbar="true"
          className="fixed left-1/2 top-4 -translate-x-1/2 z-[2000] bg-white border border-gray-300 shadow-xl rounded-2xl p-2 flex items-center gap-2"
          style={{ pointerEvents: "auto" }}
        >
          {/* Bold */}
          <button
            className="px-2 py-1 rounded-md font-bold border border-gray-200 text-[#008080] hover:bg-[#008080]/10"
            onClick={() =>
              updateSelectedLabel({ bold: !selectedLabel.bold })
            }
          >
            B
          </button>

          {/* Italic */}
          <button
            className="px-2 py-1 rounded-md italic border border-gray-200 text-[#008080] hover:bg-[#008080]/10"
            onClick={() =>
              updateSelectedLabel({ italic: !selectedLabel.italic })
            }
          >
            I
          </button>

          {/* Underline */}
          <button
            className="px-2 py-1 rounded-md underline border border-gray-200 text-[#008080] hover:bg-[#008080]/10"
            onClick={() =>
              updateSelectedLabel({ underline: !selectedLabel.underline })
            }
          >
            U
          </button>

          {/* Text color */}
          <div className="relative group">
            <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-md text-[#008080] hover:bg-[#008080]/10">
              <Palette size={18} />
            </button>
            <input
              type="color"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={selectedLabel.color || "#111111"}
              onChange={(e) => updateSelectedLabel({ color: e.target.value })}
            />
          </div>

          {/* Border dropdown */}
          <div className="relative" ref={borderMenuRef}>
            <button
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-md text-[#008080] hover:bg-[#008080]/10"
              onClick={(e) => {
                e.stopPropagation();
                setBorderMenuOpen((prev) => !prev);
              }}
            >
              O
            </button>

            {borderMenuOpen && (
              <div className="absolute left-0 top-12 w-44 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-[5000]">
                {/* Border width */}
                <div className="mb-2">
                  <label className="text-xs text-gray-500">Width</label>
                  <select
                    className="w-full border p-1 rounded-md text-[#008080]"
                    value={selectedLabel.borderWidth ?? 1}
                    onChange={(e) =>
                      updateSelectedLabel({
                        borderWidth: Number(e.target.value),
                      })
                    }
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}px
                      </option>
                    ))}
                  </select>
                </div>

                {/* Border style */}
                <div className="mb-2">
                  <label className="text-xs text-gray-500">Style</label>
                  <select
                    className="w-full border p-1 rounded-md text-[#008080]"
                    value={selectedLabel.borderStyle || "dashed"}
                    onChange={(e) =>
                      updateSelectedLabel({ borderStyle: e.target.value })
                    }
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {/* Border color */}
                <div>
                  <label className="text-xs text-gray-500">Color</label>
                  <input
                    type="color"
                    className="w-full mt-1 h-8 border border-gray-300 rounded cursor-pointer"
                    value={selectedLabel.borderColor || "#008080"}
                    onChange={(e) =>
                      updateSelectedLabel({ borderColor: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Font family */}
          <select
            className="border border-gray-200 rounded-md p-1 text-[#008080]"
            value={selectedLabel.fontFamily || "Montserrat"}
            onChange={(e) =>
              updateSelectedLabel({ fontFamily: e.target.value })
            }
          >
            {[
              "Montserrat",
              "Arial",
              "Helvetica",
              "Times New Roman",
              "Georgia",
              "Courier New",
              "Verdana",
              "Tahoma",
              "Trebuchet MS",
              "Garamond",
            ].map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>

          {/* Delete */}
          <button
            className="px-2 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-100"
            onClick={() => {
              setTextLabels((prev) =>
                prev.filter((l) => l.id !== selectedLabel.id)
              );
              setSelectedId(null);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
});

export default TextLayer;
