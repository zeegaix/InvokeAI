import { Flex } from '@chakra-ui/react';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import { useAppSelector } from 'app/store/storeHooks';
import { stateSelector } from 'app/store/store';
import IAIDropOverlay from 'common/components/IAIDropOverlay';
import IAICanvas from 'features/canvas/components/IAICanvas';
import IAICanvasToolbar from 'features/canvas/components/IAICanvasToolbar/IAICanvasToolbar';
import { useDroppableTypesafe } from 'features/dnd/hooks/typesafeHooks';
import { CanvasInitialImageDropData } from 'features/dnd/types';
import { isValidDrop } from 'features/dnd/util/isValidDrop';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import IAIColorPointer from 'features/canvas/components/IAICanvasToolbar/IAIColorPointer';
import IAIPopover from 'common/components/IAIPopover';
import IAIBrushSettingsPopup from 'features/canvas/components/IAIBrushSettingsPopup';
import IAICanvasMaskOptions from 'features/canvas/components/IAICanvasToolbar/IAICanvasMaskOptions';
const droppableData: CanvasInitialImageDropData = {
  id: 'canvas-intial-image',
  actionType: 'SET_CANVAS_INITIAL_IMAGE',
};
export const selector = createMemoizedSelector(
  [stateSelector, isStagingSelector],
  ({ canvas }, isStaging) => {
    const { maskColor, layer, isMaskEnabled, shouldPreserveMaskedArea } =
      canvas;

    return {
      layer,
      maskColor,
      isMaskEnabled,
      shouldPreserveMaskedArea,
      isStaging,
    };
  }
);


const UnifiedCanvasContent = () => {
  const { t } = useTranslation();
  const {
    isOver,
    setNodeRef: setDroppableRef,
    active,
  } = useDroppableTypesafe({
    id: 'unifiedCanvas',
    data: droppableData,
  });

  const {
    layer,
  } = useAppSelector(selector);


  return (
    
        
    <Flex
      layerStyle="first"
      ref={setDroppableRef}
      tabIndex={-1}
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        p: 2,
        borderRadius: 'base',
        w: 'full',
        h: 'full',
      }}
    >
      <Flex width="100%">
      <IAIPopover
        triggerComponent={
          <IAIColorPointer 
             aria-label={`${t('unifiedCanvas.colorPointer')} (C)`} mr="3px"    
          />
        }
      >
         {layer == 'mask' ? <IAICanvasMaskOptions /> : <IAIBrushSettingsPopup />}
      </IAIPopover>
          

          <Flex alignItems='center' justifyContent= 'center' width="100%">
            <IAICanvasToolbar />
          </Flex>
      </Flex>
          <IAICanvas />
          {isValidDrop(droppableData, active) && (
            <IAIDropOverlay
              isOver={isOver}
              label={t('toast.setCanvasInitialImage')}
            />
          )}
    </Flex>
    
  );
};

export default memo(UnifiedCanvasContent);
