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
  setMaskColor,
  setShouldPreserveMaskedArea,
} from 'features/canvas/store/canvasSlice';
import { rgbaColorToString } from 'features/canvas/util/colorToString';
import { ChangeEvent, memo, useCallback } from 'react';
import { RgbaColor } from 'react-colorful';

import { useTranslation } from 'react-i18next';
import { FaSave} from 'react-icons/fa';

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
    shouldPreserveMaskedArea,
    maskColor,
  } = useAppSelector(selector);
  


  const handleSaveGenerationMask = useCallback(async () => {
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
          label={t('unifiedCanvas.preserveMaskedArea')}
          isChecked={shouldPreserveMaskedArea}
          onChange={handleChangePreserveMaskedArea}
        />
        <Box sx={{ paddingTop: 2, paddingBottom: 2 }}>
          <IAIColorPicker color={maskColor} onChange={handleChangeMaskColor} />
        </Box>
        <IAIButton size="sm" leftIcon={<FaSave />} onClick={handleSaveGenerationMask}>
          {t('unifiedCanvas.saveGenerationMask')}
        </IAIButton>
      </Flex>
  );
};


export default memo(IAICanvasMaskOptions);
