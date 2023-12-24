import {
  forwardRef,
  IconButton,
  IconButtonProps,
  Tooltip,
  TooltipProps,
} from '@chakra-ui/react';
import { memo } from 'react';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import { useAppSelector } from 'app/store/storeHooks';


export const selector = createMemoizedSelector(
  [stateSelector, isStagingSelector],
  ({ canvas }, isStaging) => {
    const { brushColor, layer, maskColor } = canvas;

    return {
      brushColor,
      layer,
      maskColor,
    };
  }
);

export type IAColorPointer = IconButtonProps & {
  role?: string;
  tooltip?: TooltipProps['label'];
  tooltipProps?: Omit<TooltipProps, 'children' | 'label'>;
  isChecked?: boolean;
};

const getColoredSVG = (color: string) => {
  const svg = `<svg width="60px" height="60px" viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
  <g transform="matrix(0.5,0,0,0.5,0,0)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,2.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,7.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,10)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,12.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,15)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,17.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,20)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,22.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,25)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,27.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,30)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-2.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-7.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-10)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-12.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-15)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-17.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-20)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-22.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-25)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-27.5)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
  <g transform="matrix(0.5,0,0,0.5,0,-30)">
      <path d="M-3.5,63.5L64,-4" style="fill:none;stroke:black;stroke-width:1px;"/>
  </g>
</svg>`.replaceAll('black', color);

return encodeURIComponent(svg);
};



const IAColorPointer = forwardRef((props: IAColorPointer, forwardedRef) => {
  const { role, tooltip = '', tooltipProps, isChecked, ...rest } = props;
  const { brushColor, layer, maskColor } = useAppSelector(selector);
  const rgbaColor = `rgba(${brushColor.r}, ${brushColor.g}, ${brushColor.b}, ${brushColor.a})`;
  const rgbaMaskColor = `rgba(${maskColor.r}, ${maskColor.g}, ${maskColor.b}, ${maskColor.a})`;

  const maskSvg = getColoredSVG(rgbaMaskColor);

  return (


      <Tooltip
          label={tooltip}
          hasArrow
          {...tooltipProps}
          {...(tooltipProps?.placement
            ? { placement: tooltipProps.placement }
            : { placement: 'top' })}
        >
        {layer == 'mask' ?
          <IconButton
            ref={forwardedRef}
            variant='outline'
            style={{ 
              border: '2px solid',
              backgroundImage: `url("data:image/svg+xml,${maskSvg}")`, // Use the URL-encoded SVG
              //background: '#fff',
              backgroundRepeat: 'no-repeat', // Don't repeat the SVG
              //backgroundSize: 'cover',
            }}
            isRound={true}
            
            {...rest}
            />
        : 
          <IconButton
            ref={forwardedRef}
            variant='outline'
            style={{ 
              border: '2px solid',
              background: '#fff',
              backgroundImage: `linear-gradient(${rgbaColor}, ${rgbaColor}), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill-opacity='.1'%3E%3Crect x='8' width='8' height='8'/%3E%3Crect y='8' width='8' height='8'/%3E%3C/svg%3E")`,         
              backgroundBlendMode: 'normal, multiply',
            }}
            isRound={true}
            colorScheme='white'
            background={rgbaColor}
            _hover={{ background: rgbaColor }}
            {...rest}
          />

        }
       

        
      </Tooltip>

  );
});

IAColorPointer.displayName = 'IAColorPointer';
export default memo(IAColorPointer);