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
} from 'features/canvas/store/canvasSlice';
import { getCanvasBaseLayer } from 'features/canvas/util/konvaInstanceProvider';
import { memo, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import {
  FaArrowsAlt,
  FaCopy,
  FaCrosshairs,
  FaDownload,
  FaLayerGroup,
  FaSave,
  FaTrash,
  FaUpload,
  FaMask,
} from 'react-icons/fa';

import IAICanvasRedoButton from './IAICanvasRedoButton';
import IAICanvasSettingsButtonPopover from './IAICanvasSettingsButtonPopover';
import IAICanvasToolChooserOptions from './IAICanvasToolChooserOptions';
import IAICanvasUndoButton from './IAICanvasUndoButton';

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

  const handleToggleMaskLayer = useCallback(() => {
    dispatch(setLayer(layer === 'mask' ? 'base' : 'mask'));
  }, [dispatch, layer]);

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


  return (
       
      <Flex
        sx={{
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
      

        <IAIIconButton
          aria-label={t('unifiedCanvas.maskingOptions')}
          tooltip={t('unifiedCanvas.maskingOptions')}
          icon={<FaMask />}
          isChecked={layer === 'mask'}
          onClick={handleToggleMaskLayer}
          isDisabled={isStaging}
        />
        
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
          <IAIIconButton
            aria-label={`${t('unifiedCanvas.mergeVisible')} (Shift+M)`}
            tooltip={`${t('unifiedCanvas.mergeVisible')} (Shift+M)`}
            icon={<FaLayerGroup />}
            onClick={handleMergeVisible}
            isDisabled={isStaging}
          />
          <IAIIconButton
            aria-label={`${t('unifiedCanvas.saveToGallery')} (Shift+S)`}
            tooltip={`${t('unifiedCanvas.saveToGallery')} (Shift+S)`}
            icon={<FaSave />}
            onClick={handleSaveToGallery}
            isDisabled={isStaging}
          />
          {isClipboardAPIAvailable && (
            <IAIIconButton
              aria-label={`${t('unifiedCanvas.copyToClipboard')} (Cmd/Ctrl+C)`}
              tooltip={`${t('unifiedCanvas.copyToClipboard')} (Cmd/Ctrl+C)`}
              icon={<FaCopy />}
              onClick={handleCopyImageToClipboard}
              isDisabled={isStaging}
            />
          )}
          <IAIIconButton
            aria-label={`${t('unifiedCanvas.downloadAsImage')} (Shift+D)`}
            tooltip={`${t('unifiedCanvas.downloadAsImage')} (Shift+D)`}
            icon={<FaDownload />}
            onClick={handleDownloadAsImage}
            isDisabled={isStaging}
          />
        </ButtonGroup>
        <ButtonGroup isAttached>
          <IAICanvasUndoButton />
          <IAICanvasRedoButton />
        </ButtonGroup>

        <ButtonGroup isAttached>
          <IAIIconButton
            aria-label={`${t('common.upload')}`}
            tooltip={`${t('common.upload')}`}
            icon={<FaUpload />}
            isDisabled={isStaging}
            {...getUploadButtonProps()}
          />
          <input {...getUploadInputProps()} />
          <IAIIconButton
            aria-label={`${t('unifiedCanvas.clearCanvas')}`}
            tooltip={`${t('unifiedCanvas.clearCanvas')}`}
            icon={<FaTrash />}
            onClick={handleResetCanvas}
            colorScheme="error"
            isDisabled={isStaging}
          />
        </ButtonGroup>
        <ButtonGroup isAttached>
          <IAICanvasSettingsButtonPopover />
        </ButtonGroup>
      </Flex>
  );
};

export default memo(IAICanvasToolbar);
