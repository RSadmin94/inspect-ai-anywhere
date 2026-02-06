import { PenTool, ArrowRight, Circle, Minus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnnotationToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  thickness: number;
  onThicknessChange: (thickness: number) => void;
}

const COLORS = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Purple', value: '#800080' },
  { name: 'White', value: '#FFFFFF' },
];

const TOOLS = [
  { id: 'freehand', label: 'Draw', icon: PenTool },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'text', label: 'Text', icon: Type },
];

export function AnnotationToolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  thickness,
  onThicknessChange,
}: AnnotationToolbarProps) {
  return (
    <div className="bg-background border-b px-4 py-3 flex items-center gap-4 overflow-x-auto">
      {/* Tools */}
      <div className="flex items-center gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className="flex items-center gap-1"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Color:</span>
        <div className="flex items-center gap-1">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                currentColor === color.value ? 'border-foreground' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Thickness */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Thickness:</span>
        <input
          type="range"
          min="1"
          max="10"
          value={thickness}
          onChange={(e) => onThicknessChange(parseInt(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-muted-foreground w-6">{thickness}px</span>
      </div>
    </div>
  );
}
