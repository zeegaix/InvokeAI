import { Divider, Flex } from '@chakra-ui/react';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIIconButton from 'common/components/IAIIconButton';
import IAIButton from 'common/components/IAIButton';
import IAIPopover from 'common/components/IAIPopover';
import IAISimpleCheckbox from 'common/components/IAISimpleCheckbox';
import ClearCanvasHistoryButtonModal from 'features/canvas/components/ClearCanvasHistoryButtonModal';
import { useCopyImageToClipboard } from 'common/hooks/useCopyImageToClipboard';
import { useImageUploadButton } from 'common/hooks/useImageUploadButton';

import {
  setShouldAntialias,
  setShouldAutoSave,
  setShouldCropToBoundingBoxOnSave,
  setShouldDarkenOutsideBoundingBox,
  setShouldRestrictStrokesToBox,
  setShouldShowCanvasDebugInfo,
  setShouldShowGrid,
  setShouldShowSliders,
  setShouldShowIntermediates,
  setShouldSnapToGrid,
  resetCanvas,
} from 'features/canvas/store/canvasSlice';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import {
  canvasCopiedToClipboard,
  canvasDownloadedAsImage,
  canvasMerged,
  canvasSavedToGallery,
} from 'features/canvas/store/actions';
import { ChangeEvent, memo, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import {
  FaCopy,
  FaDownload,
  FaLayerGroup,
  FaSave,
  FaWrench,
  FaTrash,
  FaUpload,
} from 'react-icons/fa';

export const canvasControlsSelector = createMemoizedSelector(
  [stateSelector, isStagingSelector],
  ({ canvas }, isStaging ) => {
    const {
      shouldAutoSave,
      shouldCropToBoundingBoxOnSave,
      shouldDarkenOutsideBoundingBox,
      shouldShowCanvasDebugInfo,
      shouldShowGrid,
      shouldShowIntermediates,
      shouldSnapToGrid,
      shouldRestrictStrokesToBox,
      shouldAntialias,
      shouldShowSliders,
    } = canvas;

    return {
      shouldAutoSave,
      shouldCropToBoundingBoxOnSave,
      shouldDarkenOutsideBoundingBox,
      shouldShowCanvasDebugInfo,
      shouldShowGrid,
      shouldShowIntermediates,
      shouldSnapToGrid,
      shouldRestrictStrokesToBox,
      shouldAntialias,
      shouldShowSliders,
      isStaging,
    };
  }
);

const IAICanvasSettingsButtonPopover = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isClipboardAPIAvailable } = useCopyImageToClipboard();

  const { getUploadButtonProps, getUploadInputProps } = useImageUploadButton({
    postUploadAction: { type: 'SET_CANVAS_INITIAL_IMAGE' },
  });

  const {
    shouldAutoSave,
    shouldCropToBoundingBoxOnSave,
    shouldDarkenOutsideBoundingBox,
    shouldShowCanvasDebugInfo,
    shouldShowGrid,
    shouldShowIntermediates,
    shouldSnapToGrid,
    shouldRestrictStrokesToBox,
    shouldAntialias,
    shouldShowSliders,
    isStaging,
  } = useAppSelector(canvasControlsSelector);

  useHotkeys(
    ['n'],
    () => {
      dispatch(setShouldSnapToGrid(!shouldSnapToGrid));
    },
    {
      enabled: true,
      preventDefault: true,
    },
    [shouldSnapToGrid]
  );

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

  const handleResetCanvas = useCallback(() => {
    dispatch(resetCanvas());
  }, [dispatch]);





  const handleChangeShouldSnapToGrid = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldSnapToGrid(e.target.checked)),
    [dispatch]
  );

  const handleChangeShouldShowIntermediates = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldShowIntermediates(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldShowGrid = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldShowGrid(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldDarkenOutsideBoundingBox = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldDarkenOutsideBoundingBox(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldAutoSave = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldAutoSave(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldCropToBoundingBoxOnSave = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldCropToBoundingBoxOnSave(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldRestrictStrokesToBox = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldRestrictStrokesToBox(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldShowCanvasDebugInfo = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldShowCanvasDebugInfo(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldAntialias = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldAntialias(e.target.checked)),
    [dispatch]
  );
  const handleChangeShouldSliders = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      dispatch(setShouldShowSliders(e.target.checked)),
    [dispatch]
  );

  return (
    <IAIPopover
      isLazy={false}
      triggerComponent={
        <IAIIconButton
          tooltip={t('unifiedCanvas.canvasSettings')}
          aria-label={t('unifiedCanvas.canvasSettings')}
          icon={<FaWrench />}
        />
      }
    >
      <Flex direction="column" gap={2}>
        
          <IAIButton
            aria-label={`${t('unifiedCanvas.mergeVisible')} (Shift+M)`}
            tooltip={`${t('unifiedCanvas.mergeVisible')} (Shift+M)`}
            leftIcon={<FaLayerGroup />}
            onClick={handleMergeVisible}
            isDisabled={isStaging}
          >
            {t('unifiedCanvas.mergeVisible')}
          </IAIButton>

          <IAIButton
            aria-label={`${t('unifiedCanvas.saveToGallery')} (Shift+S)`}
            tooltip={`${t('unifiedCanvas.saveToGallery')} (Shift+S)`}
            leftIcon={<FaSave />}
            onClick={handleSaveToGallery}
            isDisabled={isStaging}
          > 
            {t('unifiedCanvas.saveToGallery')}
          </IAIButton>

          {isClipboardAPIAvailable && (
            <IAIButton
              aria-label={`${t('unifiedCanvas.copyToClipboard')} (Cmd/Ctrl+C)`}
              tooltip={`${t('unifiedCanvas.copyToClipboard')} (Cmd/Ctrl+C)`}
              leftIcon={<FaCopy />}
              onClick={handleCopyImageToClipboard}
              isDisabled={isStaging}
            >
              {t('unifiedCanvas.copyToClipboard')}
            </IAIButton>
          )}

          <IAIButton
            aria-label={`${t('unifiedCanvas.downloadAsImage')} (Shift+D)`}
            tooltip={`${t('unifiedCanvas.downloadAsImage')} (Shift+D)`}
            leftIcon={<FaDownload />}
            onClick={handleDownloadAsImage}
            isDisabled={isStaging}
          >
            {t('unifiedCanvas.downloadAsImage')}
          </IAIButton>       
        
          <IAIButton
            aria-label={`${t('common.upload')}`}
            tooltip={`${t('common.upload')}`}
            leftIcon={<FaUpload />}
            isDisabled={isStaging}
            {...getUploadButtonProps()}
          >
            {t('common.upload')}
          </IAIButton>

          <IAIButton
            aria-label={`${t('unifiedCanvas.clearCanvas')}`}
            tooltip={`${t('unifiedCanvas.clearCanvas')}`}
            leftIcon={<FaTrash />}
            onClick={handleResetCanvas}
            colorScheme="error"
            isDisabled={isStaging}
          >
            {t('unifiedCanvas.clearCanvas')}
          </IAIButton>
          
          <Divider my={1} />
          <input {...getUploadInputProps()} />
        
        <IAISimpleCheckbox
          label={t('unifiedCanvas.showIntermediates')}
          isChecked={shouldShowIntermediates}
          onChange={handleChangeShouldShowIntermediates}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.showGrid')}
          isChecked={shouldShowGrid}
          onChange={handleChangeShouldShowGrid}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.snapToGrid')}
          isChecked={shouldSnapToGrid}
          onChange={handleChangeShouldSnapToGrid}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.darkenOutsideSelection')}
          isChecked={shouldDarkenOutsideBoundingBox}
          onChange={handleChangeShouldDarkenOutsideBoundingBox}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.autoSaveToGallery')}
          isChecked={shouldAutoSave}
          onChange={handleChangeShouldAutoSave}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.saveBoxRegionOnly')}
          isChecked={shouldCropToBoundingBoxOnSave}
          onChange={handleChangeShouldCropToBoundingBoxOnSave}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.limitStrokesToBox')}
          isChecked={shouldRestrictStrokesToBox}
          onChange={handleChangeShouldRestrictStrokesToBox}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.showCanvasDebugInfo')}
          isChecked={shouldShowCanvasDebugInfo}
          onChange={handleChangeShouldShowCanvasDebugInfo}
        />

        <IAISimpleCheckbox
          label={t('unifiedCanvas.antialiasing')}
          isChecked={shouldAntialias}
          onChange={handleChangeShouldAntialias}
        />

        <IAISimpleCheckbox
          label={t('unifiedCanvas.showSliders')}
          isChecked={shouldShowSliders}
          onChange={handleChangeShouldSliders}
        />
        <Divider my={2} />
        <ClearCanvasHistoryButtonModal />

        

      </Flex>
    </IAIPopover>
  );
};

export default memo(IAICanvasSettingsButtonPopover);
