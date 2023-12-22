import { Box, Flex } from '@chakra-ui/react';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIColorPicker from 'common/components/IAIColorPicker';

import IAISlider from 'common/components/IAISlider';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import {
  setBrushColor,
  setBrushSize,
} from 'features/canvas/store/canvasSlice';
import { clamp } from 'lodash-es';
import { memo, useCallback } from 'react';
import { RgbaColor } from 'react-colorful';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';

export const selector = createMemoizedSelector(
  [stateSelector, isStagingSelector],
  ({ canvas }, isStaging) => {
    const { tool, brushColor, brushSize } = canvas;

    return {
      tool,
      isStaging,
      brushColor,
      brushSize,
    };
  }
);

const IAIBrushSettingsPopup = () => {
  const dispatch = useAppDispatch();
  const { brushColor, brushSize, isStaging } = useAppSelector(selector);
  const { t } = useTranslation();

    useHotkeys(
    ['BracketLeft'],
    () => {
      if (brushSize - 5 <= 5) {
        dispatch(setBrushSize(Math.max(brushSize - 1, 1)));
      } else {
        dispatch(setBrushSize(Math.max(brushSize - 5, 1)));
      }
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [brushSize]
  );

  useHotkeys(
    ['BracketRight'],
    () => {
      dispatch(setBrushSize(Math.min(brushSize + 5, 500)));
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [brushSize]
  );

  useHotkeys(
    ['Shift+BracketLeft'],
    () => {
      dispatch(
        setBrushColor({
          ...brushColor,
          a: clamp(brushColor.a - 0.05, 0.05, 1),
        })
      );
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [brushColor]
  );

  useHotkeys(
    ['Shift+BracketRight'],
    () => {
      dispatch(
        setBrushColor({
          ...brushColor,
          a: clamp(brushColor.a + 0.05, 0.05, 1),
        })
      );
    },
    {
      enabled: () => !isStaging,
      preventDefault: true,
    },
    [brushColor]
  );

 
  const handleChangeBrushSize = useCallback(
    (newSize: number) => {
      dispatch(setBrushSize(newSize));
    },
    [dispatch]
  );
  const handleChangeBrushColor = useCallback(
    (newColor: RgbaColor) => {
      dispatch(setBrushColor(newColor));
    },
    [dispatch]
  );

  return (
    <Flex minWidth={60} direction="column" gap={4} width="100%">
          
          <Box
            sx={{
              width: '100%',
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            <IAIColorPicker
              withNumberInput={true}
              color={brushColor}
              onChange={handleChangeBrushColor}
            />
          </Box>
          <Flex gap={4} justifyContent="space-between">
            <IAISlider
              label={t('unifiedCanvas.brushSize')}
              value={brushSize}
              withInput
              onChange={handleChangeBrushSize}
              sliderNumberInputProps={{ max: 500 }}
            />
          </Flex>
    </Flex>
  );
};

export default memo(IAIBrushSettingsPopup);