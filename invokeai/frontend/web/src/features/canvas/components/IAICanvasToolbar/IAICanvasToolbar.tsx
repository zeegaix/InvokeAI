import { ButtonGroup, Flex } from '@chakra-ui/react';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIIconButton from 'common/components/IAIIconButton';
import { useCopyImageToClipboard } from 'common/hooks/useCopyImageToClipboard';
import { useImageUploadButton } from 'common/hooks/useImageUploadButton';
import { useSingleAndDoubleClick } from 'common/hooks/useSingleAndDoubleClick';
import {
  canvasCopiedToClipboard,
  canvasDownloadedAsImage,
  canvasMerged,
  canvasSavedToGallery,
} from 'features/canvas/store/actions';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import {
  resetCanvas,
  resetCanvasView,
  setTool,
  setLayer,
  setIsMaskEnabled,
  clearMask,
} from 'features/canvas/store/canvasSlice';
import { getCanvasBaseLayer } from 'features/canvas/util/konvaInstanceProvider';
import { memo, useCallback, ChangeEvent } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import {
  FaArrowsAlt,
  FaCrosshairs,
  FaMask,
  FaTrash,
} from 'react-icons/fa';
import SettingSwitch from 'features/system/components/SettingsModal/SettingSwitch';
import IAICanvasRedoButton from './IAICanvasRedoButton';
import IAICanvasSettingsButtonPopover from './IAICanvasSettingsButtonPopover';
import IAICanvasToolChooserOptions from './IAICanvasToolChooserOptions';
import IAICanvasUndoButton from './IAICanvasUndoButton';
import IAIColorPointer from 'features/canvas/components/IAICanvasToolbar/IAIColorPointer';
import IAIPopover from 'common/components/IAIPopover';
import IAIBrushSettingsPopup from 'features/canvas/components/IAIBrushSettingsPopup';
import IAICanvasMaskOptions from 'features/canvas/components/IAICanvasToolbar/IAICanvasMaskOptions';


export const selector = createMemoizedSelector(
  [stateSelector, isStagingSelector],
  ({ canvas }, isStaging) => {
    const { maskColor, tool, shouldCropToBoundingBoxOnSave, layer, isMaskEnabled } =
      canvas;

    return {
      isStaging,
      isMaskEnabled,
      maskColor,
      tool,
      layer,
      shouldCropToBoundingBoxOnSave,
    };
  }
);

const IAICanvasToolbar = () => {
  const dispatch = useAppDispatch();
  
  const canvasBaseLayer = getCanvasBaseLayer();

  const { t } = useTranslation();
  const { isClipboardAPIAvailable } = useCopyImageToClipboard();

  const { getUploadButtonProps, getUploadInputProps } = useImageUploadButton({
    postUploadAction: { type: 'SET_CANVAS_INITIAL_IMAGE' },
  });

  const {
    layer,
    isMaskEnabled,
    isStaging,
    tool,
  } = useAppSelector(selector);

  
  useHotkeys(
    ['q'],
    () => {
      handleToggleMaskLayer();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [layer]
  );

  useHotkeys(
    ['shift+c'],
    () => {
      handleClearMask();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    []
  );

  useHotkeys(
    ['h'],
    () => {
      handleToggleEnableMask();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [isMaskEnabled]
  );

  useHotkeys(
    ['v'],
    () => {
      handleSelectMoveTool();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    []
  );

  useHotkeys(
    ['r'],
    () => {
      handleResetCanvasView();
    },
    {
      enabled: () => true,
      preventDefault: true,
    },
    [canvasBaseLayer]
  );

  useHotkeys(
    ['shift+m'],
    () => {
      handleMergeVisible();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [canvasBaseLayer]
  );

  useHotkeys(
    ['shift+s'],
    () => {
      handleSaveToGallery();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [canvasBaseLayer]
  );

  useHotkeys(
    ['meta+c', 'ctrl+c'],
    () => {
      handleCopyImageToClipboard();
    },
    {
      enabled: () => !isStaging && isClipboardAPIAvailable,
      preventDefault: true,
    },
    [canvasBaseLayer, isClipboardAPIAvailable]
  );

  useHotkeys(
    ['shift+d'],
    () => {
      handleDownloadAsImage();
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [canvasBaseLayer]
  );

  const handleSelectMoveTool = useCallback(() => {
    dispatch(setTool('move'));
  }, [dispatch]);

  const handleClickResetCanvasView = useSingleAndDoubleClick(
    () => handleResetCanvasView(false),
    () => handleResetCanvasView(true)
  );

  const handleResetCanvasView = (shouldScaleTo1 = false) => {
    const canvasBaseLayer = getCanvasBaseLayer();
    if (!canvasBaseLayer) {
      return;
    }
    const clientRect = canvasBaseLayer.getClientRect({
      skipTransform: true,
    });
    dispatch(
      resetCanvasView({
        contentRect: clientRect,
        shouldScaleTo1,
      })
    );
  };

  const handleResetCanvas = useCallback(() => {
    dispatch(resetCanvas());
  }, [dispatch]);

  const handleMergeVisible = useCallback(() => {
    dispatch(canvasMerged());
  }, [dispatch]);

  const handleSaveToGallery = useCallback(() => {
    dispatch(canvasSavedToGallery());
  }, [dispatch]);

  const handleCopyImageToClipboard = useCallback(() => {
    if (!isClipboardAPIAvailable) {
      return;
    }
    dispatch(canvasCopiedToClipboard());
  }, [dispatch, isClipboardAPIAvailable]);

  const handleDownloadAsImage = useCallback(() => {
    dispatch(canvasDownloadedAsImage());
  }, [dispatch]);

  const handleToggleEnableMask = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setIsMaskEnabled(e.target.checked));
    }, 
      [dispatch]
  );


  const handleClearMask = useCallback(() => {
    dispatch(clearMask());
  }, [dispatch]);


  const handleToggleMaskLayer = useCallback(() => {
    dispatch(setLayer(layer === 'mask' ? 'base' : 'mask'));
    if (!isMaskEnabled) {
      dispatch(setIsMaskEnabled(!isMaskEnabled));
    }
  }, [dispatch, layer, isMaskEnabled]);


  return (
       
      <Flex width="100%"
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >

        <IAIPopover
          triggerComponent={
            <IAIColorPointer 
              aria-label={`${t('unifiedCanvas.colorPointer')} (C)`} mr="3px"    
            />
          }
        >
          {layer == 'mask' ? <IAICanvasMaskOptions /> : <IAIBrushSettingsPopup />}
        </IAIPopover>

          <Flex gap="2">
            <Flex
              sx={{
                backgroundColor: 'rgb(124, 135, 156)', // slightly gray color
                borderRadius: '5px', // rounded corners
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >


                <IAIIconButton
                    aria-label={t('unifiedCanvas.clearMask')}
                    tooltip={t('unifiedCanvas.clearMask')}
                    icon={<FaTrash />}
                    onClick={handleClearMask}
                    isDisabled={isStaging}
                />

                <SettingSwitch
                        // label={t('unifiedCanvas.enableMask')}
                          tooltip={t('unifiedCanvas.enableMask')}
                          isChecked={isMaskEnabled}
                          onChange={handleToggleEnableMask}
                          //isDisabled={isStaging}
                />

                <IAIIconButton
                  aria-label={t('unifiedCanvas.maskingOptions')}
                  tooltip={t('unifiedCanvas.maskingOptions')}
                  icon={<FaMask />}
                  isChecked={layer === 'mask'}
                  onClick={handleToggleMaskLayer}
                  isDisabled={isStaging}
                />
                  
            </Flex>

            <IAICanvasToolChooserOptions />

            <ButtonGroup isAttached>
              <IAIIconButton
                aria-label={`${t('unifiedCanvas.move')} (V)`}
                tooltip={`${t('unifiedCanvas.move')} (V)`}
                icon={<FaArrowsAlt />}
                isChecked={tool === 'move' || isStaging}
                onClick={handleSelectMoveTool}
              />
              <IAIIconButton
                aria-label={`${t('unifiedCanvas.resetView')} (R)`}
                tooltip={`${t('unifiedCanvas.resetView')} (R)`}
                icon={<FaCrosshairs />}
                onClick={handleClickResetCanvasView}
              />
            </ButtonGroup>

            <ButtonGroup isAttached>
              <IAICanvasUndoButton />
              <IAICanvasRedoButton />
            </ButtonGroup>
          </Flex>
            
          <ButtonGroup isAttached>
            <IAICanvasSettingsButtonPopover />
          </ButtonGroup>
        </Flex>
  );
};

export default memo(IAICanvasToolbar);
