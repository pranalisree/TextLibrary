"use client";
import React, { useRef, useEffect, useState } from "react";
import Moveable from "moveable";

export default function MoveableTextBox({
  id,
  text = "New Text",
  x = 100,
  y = 100,
  width = 120,
  height = 40,
  fontSize = "16px",
  color = "#111",
  highlight = "transparent",
  bold = false,
  italic = false,
  underline = false,
  outline = false,
  fontFamily = "Montserrat",
  borderWidth = 1,
  borderStyle = "dashed",
  borderColor = "#008080",
  isSelected,
  onSelect,
  onUpdate,
}) {
  const ref = useRef(null);
  const moveableRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);

  const [styleState, setStyleState] = useState({
    top: y,
    left: x,
    width,
    height,
    rotate: 0,
    scale: [1, 1],
  });

  // Sync from props when position/size change externally
  useEffect(() => {
    setStyleState((prev) => ({
      ...prev,
      top: y,
      left: x,
      width,
      height,
    }));
  }, [x, y, width, height]);

  useEffect(() => {
    const target = ref.current;

    // Clean up old instance
    if (moveableRef.current?.destroy) {
      try {
        moveableRef.current.destroy();
      } catch {}
    }
    moveableRef.current = null;

    if (!isSelected || isEditing || !target) return;

    const moveable = new Moveable(document.body, {
      target,
      container: document.body,
      draggable: true,
      resizable: true,
      scalable: true,
      rotatable: false, // no rotate handle
      pinchable: true,
      origin: false,
    });

    moveableRef.current = moveable;

    // Drag
    moveable.on("drag", ({ left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
      setStyleState((prev) => ({ ...prev, left, top }));
    });

    moveable.on("dragEnd", ({ lastEvent }) => {
      if (lastEvent) {
        onUpdate(id, { x: lastEvent.left, y: lastEvent.top });
      }
    });

    // Resize
    moveable.on("resize", ({ width, height, drag }) => {
      const { left, top } = drag;
      Object.assign(target.style, {
        width: `${width}px`,
        height: `${height}px`,
        left: `${left}px`,
        top: `${top}px`,
      });
      setStyleState((prev) => ({ ...prev, width, height, left, top }));
    });

    moveable.on("resizeEnd", ({ lastEvent }) => {
      if (!lastEvent) return;
      const { width, height, drag } = lastEvent;
      onUpdate(id, { width, height, x: drag.left, y: drag.top });
    });

    return () => moveable.destroy();
  }, [isSelected, isEditing, onUpdate, id]);

  return (
    <div
      ref={ref}
      data-text-layer-element="true"
      contentEditable={isEditing}
      suppressContentEditableWarning
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      onBlur={(e) => {
        setIsEditing(false);
        onUpdate(id, { text: e.target.textContent ?? "" });
      }}
      style={{
        position: "absolute",
        top: styleState.top,
        left: styleState.left,
        width: styleState.width,
        height: styleState.height,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        fontSize,
        color,
        fontFamily,
        background: highlight,
        fontWeight: bold ? "bold" : "normal",
        fontStyle: italic ? "italic" : "normal",
        textDecoration: underline ? "underline" : "none",
        transform: `rotate(${styleState.rotate}deg) scale(${styleState.scale[0]}, ${styleState.scale[1]})`,
        userSelect: isEditing ? "text" : "none",
        whiteSpace: "pre-wrap",
        cursor: isEditing ? "text" : "move",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 8px",
        borderRadius: "6px",
        pointerEvents: "auto", // important so it works atop pointer-events:none overlay
      }}
    >
      {text}
    </div>
  );
}
