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
    const { brushColor } = canvas;

    return {
      brushColor,
    };
  }
);

export type IAColorPointer = IconButtonProps & {
  role?: string;
  tooltip?: TooltipProps['label'];
  tooltipProps?: Omit<TooltipProps, 'children' | 'label'>;
  isChecked?: boolean;
};

const IAColorPointer = forwardRef((props: IAColorPointer, forwardedRef) => {
  const { role, tooltip = '', tooltipProps, isChecked, ...rest } = props;
  const { brushColor } = useAppSelector(selector);
  const rgbaColor = `rgba(${brushColor.r}, ${brushColor.g}, ${brushColor.b}, ${brushColor.a})`;
  return (
    <Tooltip
      label={tooltip}
      hasArrow
      {...tooltipProps}
      {...(tooltipProps?.placement
        ? { placement: tooltipProps.placement }
        : { placement: 'top' })}
    >
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
    </Tooltip>
  );
});

IAColorPointer.displayName = 'IAColorPointer';
export default memo(IAColorPointer);