import { Box, Flex } from '@chakra-ui/react';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIButton from 'common/components/IAIButton';
import IAIColorPicker from 'common/components/IAIColorPicker';
import IAISimpleCheckbox from 'common/components/IAISimpleCheckbox';
import { canvasMaskSavedToGallery } from 'features/canvas/store/actions';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import {
  clearMask,
  setIsMaskEnabled,
  setMaskColor,
  setShouldPreserveMaskedArea,
} from 'features/canvas/store/canvasSlice';
import { rgbaColorToString } from 'features/canvas/util/colorToString';
import { ChangeEvent, memo, useCallback } from 'react';
import { RgbaColor } from 'react-colorful';

import { useTranslation } from 'react-i18next';
import { FaSave, FaTrash } from 'react-icons/fa';

export const selector = createMemoizedSelector(
  [stateSelector, isStagingSelector],
  ({ canvas }, isStaging) => {
    const { maskColor, layer, isMaskEnabled, shouldPreserveMaskedArea } =
      canvas;

    return {
      layer,
      maskColor,
      maskColorString: rgbaColorToString(maskColor),
      isMaskEnabled,
      shouldPreserveMaskedArea,
      isStaging,
    };
  }
);
const IAICanvasMaskOptions = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const {
    layer,
    isMaskEnabled,
    isStaging,
    shouldPreserveMaskedArea,
    maskColor,
  } = useAppSelector(selector);
  

 

  const handleClearMask = useCallback(() => {
    dispatch(clearMask());
  }, [dispatch]);

  const handleToggleEnableMask = useCallback(() => {
    dispatch(setIsMaskEnabled(!isMaskEnabled));
  }, [dispatch, isMaskEnabled]);

  const handleSaveMask = useCallback(async () => {
    dispatch(canvasMaskSavedToGallery());
  }, [dispatch]);

  const handleChangePreserveMaskedArea = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(setShouldPreserveMaskedArea(e.target.checked));
    },
    [dispatch]
  );

  const handleChangeMaskColor = useCallback(
    (newColor: RgbaColor) => {
      dispatch(setMaskColor(newColor));
    },
    [dispatch]
  );

  return (
    <Flex direction="column" gap={2}>
        <IAISimpleCheckbox
          label={`${t('unifiedCanvas.enableMask')} (H)`}
          isChecked={isMaskEnabled}
          onChange={handleToggleEnableMask}
        />
        <IAISimpleCheckbox
          label={t('unifiedCanvas.preserveMaskedArea')}
          isChecked={shouldPreserveMaskedArea}
          onChange={handleChangePreserveMaskedArea}
        />
        <Box sx={{ paddingTop: 2, paddingBottom: 2 }}>
          <IAIColorPicker color={maskColor} onChange={handleChangeMaskColor} />
        </Box>
        <IAIButton size="sm" leftIcon={<FaSave />} onClick={handleSaveMask}>
          {t('unifiedCanvas.saveMask')}
        </IAIButton>
        <IAIButton size="sm" leftIcon={<FaTrash />} onClick={handleClearMask}>
          {t('unifiedCanvas.clearMask')}
        </IAIButton>
      </Flex>
  );
};


export default memo(IAICanvasMaskOptions);
