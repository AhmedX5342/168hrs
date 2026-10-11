import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AREA_COLORS } from "./colors";

/** Round swatch that opens a palette + custom color picker. */
export function AreaColorButton({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change color"
          title="Change color"
          className="size-8 shrink-0 rounded-full border-2 border-background ring-1 ring-border"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 space-y-3 p-3">
        <div className="grid grid-cols-6 gap-2">
          {AREA_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => onChange(c)}
              className={cn(
                "size-7 rounded-full ring-offset-2 ring-offset-popover transition",
                c.toLowerCase() === color.toLowerCase() && "ring-2 ring-foreground",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Custom
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-12 cursor-pointer rounded border bg-transparent p-0"
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}
