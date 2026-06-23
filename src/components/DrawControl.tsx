import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl/maplibre';
import { drawTheme } from '../utils/drawTheme';

interface DrawControlProps {
  onUpdate: (event: any) => void;
  onCreate: (event: any) => void;
  onDelete: (event: any) => void;
  drawRef?: React.MutableRefObject<MapboxDraw | null>;
}

export default function DrawControl(props: DrawControlProps) {
  useControl<any>(
    () => {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        styles: drawTheme,
        controls: {},
        defaultMode: 'simple_select'
      });
      if (props.drawRef) props.drawRef.current = draw;
      return draw;
    },
    ({ map }) => {
      map.on('draw.create', props.onCreate);
      map.on('draw.update', props.onUpdate);
      map.on('draw.delete', props.onDelete);
    },
    ({ map }) => {
      map.off('draw.create', props.onCreate);
      map.off('draw.update', props.onUpdate);
      map.off('draw.delete', props.onDelete);
    },
    {
      position: 'top-left'
    }
  );

  return null;
}
