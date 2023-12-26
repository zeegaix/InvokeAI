import { Flex } from '@chakra-ui/react';
import { memo, useCallback } from 'react';
import IAISlider from 'common/components/IAISlider';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { FaCircle } from "react-icons/fa";

import { RgbaColor } from 'react-colorful';

import {
  setBrushSize,
  setBrushColor,
} from 'features/canvas/store/canvasSlice';

const selector = createMemoizedSelector(
    [stateSelector, isStagingSelector],
    ({ canvas }) => {
      const {
        brushSize,
        brushColor,
      } = canvas;
  
      
      return {
        brushSize,
        brushColor,
      };
    }
  );


const IAICanvasSliders = () => {
    const dispatch = useAppDispatch();
    const {
        brushSize,
        brushColor,
      } = useAppSelector(selector);

    const handleChangeBrushSize = useCallback(
        (newSize: number) => {
          dispatch(setBrushSize(newSize));
        },
        [dispatch]
      );
        
      const handleChangeA = useCallback(
      (newColorAlpha: number) => {
        console.log('handleChangeA called with new alpha:', newColorAlpha);
        const newBrushColor: RgbaColor = { ...brushColor, a: newColorAlpha };
        dispatch(setBrushColor(newBrushColor));
      },
      [dispatch, brushColor]
      );

    return (

        <Flex minWidth={5} minHeight="50" direction="column" gap={10} width="0%" height="50%" align='center' background="rgb(43, 48, 59)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', padding: '15px', borderRadius: '20px',
             boxShadow: '0px 0px 1px black', left: '5px' }} >
          <Flex direction="row" gap={4}  height="50%" >
            <IAISlider
             // label={t('unifiedCanvas.brushSize')}
              orientation="vertical"
              isVertical={true}
              value={brushSize}
            //  withInput
              onChange={handleChangeBrushSize}
             
              
              sliderNumberInputProps={{ max: 500 }}
              sliderThumbProps={{
                children: <FaCircle />, // Replace with your icon
                boxSize: 5, // Adjust size as needed
              }}
            />
          </Flex>
            <Flex direction="row" gap={4}  height="50%">
            <IAISlider
             // label={t('unifiedCanvas.brushSize')}
              min={0}
              max={1}
              step={0.01}
              orientation="vertical"
              isVertical={true}
              value={brushColor.a}
              //  withInput
              onChange={handleChangeA}
              sliderThumbProps={{
                children: <FaCircle />, // Replace with your icon
                boxSize: 5, // Adjust size as needed
              }}
            />
            </Flex>
        </Flex>
    );
}

export default memo(IAICanvasSliders);