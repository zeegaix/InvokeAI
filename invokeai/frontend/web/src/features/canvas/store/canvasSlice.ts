import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import {
  roundDownToMultiple,
  roundToMultiple,
} from 'common/util/roundDownToMultiple';
import { setAspectRatio } from 'features/parameters/store/generationSlice';
import { IRect, Vector2d } from 'konva/lib/types';
import { clamp, cloneDeep } from 'lodash-es';
import { RgbaColor } from 'react-colorful';
import { ImageDTO } from 'services/api/types';
import calculateCoordinates from 'features/canvas/util/calculateCoordinates';
import calculateScale from 'features/canvas/util/calculateScale';
import { STAGE_PADDING_PERCENTAGE } from 'features/canvas/util/constants';
import floorCoordinates from 'features/canvas/util/floorCoordinates';
import getScaledBoundingBoxDimensions from 'features/canvas/util/getScaledBoundingBoxDimensions';
import roundDimensionsTo64 from 'features/canvas/util/roundDimensionsTo64';
import {
  BoundingBoxScale,
  CanvasBaseLine,
  CanvasImage,
  CanvasLayer,
  CanvasLayerState,
  CanvasMaskLine,
  CanvasState,
  CanvasTool,
  Dimensions,
  isCanvasAnyLine,
  isCanvasBaseImage,
  isCanvasMaskLine,
} from './canvasTypes';
import { appSocketQueueItemStatusChanged } from 'services/events/actions';
import { queueApi } from 'services/api/endpoints/queue';

export const initialLayerState: CanvasLayerState = {
  objects: [],
  stagingArea: {
    images: [],
    selectedImageIndex: -1,
  },
};

export const initialCanvasState: CanvasState = {
  boundingBoxCoordinates: { x: 0, y: 0 },
  boundingBoxDimensions: { width: 512, height: 512 },
  boundingBoxPreviewFill: { r: 0, g: 0, b: 0, a: 0.5 },
  boundingBoxScaleMethod: 'none',
  brushColor: { r: 90, g: 90, b: 255, a: 1 },
  brushSize: 50,
  colorPickerColor: { r: 90, g: 90, b: 255, a: 1 },
  cursorPosition: null,
  futureLayerStates: [],
  isDrawing: false,
  isMaskEnabled: true,
  isMouseOverBoundingBox: false,
  isMoveBoundingBoxKeyHeld: false,
  isMoveStageKeyHeld: false,
  isMovingBoundingBox: false,
  isMovingStage: false,
  isTransformingBoundingBox: false,
  layer: 'base',
  layerState: initialLayerState,
  maskColor: { r: 255, g: 90, b: 90, a: 1 },
  maxHistory: 128,
  minimumStageScale: 1,
  pastLayerStates: [],
  scaledBoundingBoxDimensions: { width: 512, height: 512 },
  shouldAntialias: true,
  shouldAutoSave: false,
  shouldCropToBoundingBoxOnSave: false,
  shouldDarkenOutsideBoundingBox: false,
  shouldLockBoundingBox: false,
  shouldPreserveMaskedArea: false,
  shouldRestrictStrokesToBox: true,
  shouldShowBoundingBox: true,
  shouldShowBrush: true,
  shouldShowBrushPreview: false,
  shouldShowCanvasDebugInfo: false,
  shouldShowCheckboardTransparency: false,
  shouldShowGrid: true,
  shouldShowIntermediates: true,
  shouldShowStagingImage: true,
  shouldShowStagingOutline: true,
  shouldSnapToGrid: true,
  shouldShowSliders: true,
  stageCoordinates: { x: 0, y: 0 },
  stageDimensions: { width: 0, height: 0 },
  stageScale: 1,
  tool: 'brush',
  batchIds: [],
};

export const canvasSlice = createSlice({
  name: 'canvas',
  initialState: initialCanvasState,
  reducers: {
    setTool: (state, action: PayloadAction<CanvasTool>) => {
      const tool = action.payload;
      state.tool = action.payload;
      if (tool !== 'move') {
        state.isTransformingBoundingBox = false;
        state.isMouseOverBoundingBox = false;
        state.isMovingBoundingBox = false;
        state.isMovingStage = false;
      }
    },
    setLayer: (state, action: PayloadAction<CanvasLayer>) => {
      state.layer = action.payload;
    },
    toggleTool: (state) => {
      const currentTool = state.tool;
      if (currentTool !== 'move') {
        state.tool = currentTool === 'brush' ? 'eraser' : 'brush';
      }
    },
    setMaskColor: (state, action: PayloadAction<RgbaColor>) => {
      state.maskColor = action.payload;
    },
    setBrushColor: (state, action: PayloadAction<RgbaColor>) => {
      state.brushColor = action.payload;
    },
    setBrushSize: (state, action: PayloadAction<number>) => {
      state.brushSize = action.payload;
    },
    clearMask: (state) => {
      state.pastLayerStates.push(cloneDeep(state.layerState));
      state.layerState.objects = state.layerState.objects.filter(
        (obj) => !isCanvasMaskLine(obj)
      );
      state.futureLayerStates = [];
      state.shouldPreserveMaskedArea = false;
    },
    toggleShouldInvertMask: (state) => {
      state.shouldPreserveMaskedArea = !state.shouldPreserveMaskedArea;
    },
    toggleShouldShowMask: (state) => {
      state.isMaskEnabled = !state.isMaskEnabled;
    },
    setShouldPreserveMaskedArea: (state, action: PayloadAction<boolean>) => {
      state.shouldPreserveMaskedArea = action.payload;
    },
    setIsMaskEnabled: (state, action: PayloadAction<boolean>) => {
      state.isMaskEnabled = action.payload;
      state.layer = action.payload ? 'mask' : 'base';
    },
    setShouldShowCheckboardTransparency: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.shouldShowCheckboardTransparency = action.payload;
    },
    setShouldShowBrushPreview: (state, action: PayloadAction<boolean>) => {
      state.shouldShowBrushPreview = action.payload;
    },
    setShouldShowBrush: (state, action: PayloadAction<boolean>) => {
      state.shouldShowBrush = action.payload;
    },
    setCursorPosition: (state, action: PayloadAction<Vector2d | null>) => {
      state.cursorPosition = action.payload;
    },
    setInitialCanvasImage: (state, action: PayloadAction<ImageDTO>) => {
      const image = action.payload;
      const { width, height } = image;
      const { stageDimensions } = state;

      const newBoundingBoxDimensions = {
        width: roundDownToMultiple(clamp(width, 64, 512), 64),
        height: roundDownToMultiple(clamp(height, 64, 512), 64),
      };

      const newBoundingBoxCoordinates = {
        x: roundToMultiple(width / 2 - newBoundingBoxDimensions.width / 2, 64),
        y: roundToMultiple(
          height / 2 - newBoundingBoxDimensions.height / 2,
          64
        ),
      };

      if (state.boundingBoxScaleMethod === 'auto') {
        const scaledDimensions = getScaledBoundingBoxDimensions(
          newBoundingBoxDimensions
        );
        state.scaledBoundingBoxDimensions = scaledDimensions;
      }

      state.boundingBoxDimensions = newBoundingBoxDimensions;
      state.boundingBoxCoordinates = newBoundingBoxCoordinates;

      state.pastLayerStates.push(cloneDeep(state.layerState));

      state.layerState = {
        ...cloneDeep(initialLayerState),
        objects: [
          {
            kind: 'image',
            layer: 'base',
            x: 0,
            y: 0,
            width: width,
            height: height,
            imageName: image.image_name,
          },
        ],
      };
      state.futureLayerStates = [];
      state.batchIds = [];

      const newScale = calculateScale(
        stageDimensions.width,
        stageDimensions.height,
        width,
        height,
        STAGE_PADDING_PERCENTAGE
      );

      const newCoordinates = calculateCoordinates(
        stageDimensions.width,
        stageDimensions.height,
        0,
        0,
        width,
        height,
        newScale
      );
      state.stageScale = newScale;
      state.stageCoordinates = newCoordinates;
    },
    setBoundingBoxDimensions: (state, action: PayloadAction<Dimensions>) => {
      const newDimensions = roundDimensionsTo64(action.payload);
      state.boundingBoxDimensions = newDimensions;

      if (state.boundingBoxScaleMethod === 'auto') {
        const scaledDimensions = getScaledBoundingBoxDimensions(newDimensions);
        state.scaledBoundingBoxDimensions = scaledDimensions;
      }
    },
    flipBoundingBoxAxes: (state) => {
      const [currWidth, currHeight] = [
        state.boundingBoxDimensions.width,
        state.boundingBoxDimensions.height,
      ];
      const [currScaledWidth, currScaledHeight] = [
        state.scaledBoundingBoxDimensions.width,
        state.scaledBoundingBoxDimensions.height,
      ];
      state.boundingBoxDimensions = {
        width: currHeight,
        height: currWidth,
      };
      state.scaledBoundingBoxDimensions = {
        width: currScaledHeight,
        height: currScaledWidth,
      };
    },
    setBoundingBoxCoordinates: (state, action: PayloadAction<Vector2d>) => {
      state.boundingBoxCoordinates = floorCoordinates(action.payload);
    },
    setStageCoordinates: (state, action: PayloadAction<Vector2d>) => {
      state.stageCoordinates = action.payload;
    },
    setBoundingBoxPreviewFill: (state, action: PayloadAction<RgbaColor>) => {
      state.boundingBoxPreviewFill = action.payload;
    },
    setStageScale: (state, action: PayloadAction<number>) => {
      state.stageScale = action.payload;
    },
    setShouldDarkenOutsideBoundingBox: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.shouldDarkenOutsideBoundingBox = action.payload;
    },
    setIsDrawing: (state, action: PayloadAction<boolean>) => {
      state.isDrawing = action.payload;
    },
    clearCanvasHistory: (state) => {
      state.pastLayerStates = [];
      state.futureLayerStates = [];
    },
    setShouldLockBoundingBox: (state, action: PayloadAction<boolean>) => {
      state.shouldLockBoundingBox = action.payload;
    },
    toggleShouldLockBoundingBox: (state) => {
      state.shouldLockBoundingBox = !state.shouldLockBoundingBox;
    },
    setShouldShowBoundingBox: (state, action: PayloadAction<boolean>) => {
      state.shouldShowBoundingBox = action.payload;
    },
    setIsTransformingBoundingBox: (state, action: PayloadAction<boolean>) => {
      state.isTransformingBoundingBox = action.payload;
    },
    setIsMovingBoundingBox: (state, action: PayloadAction<boolean>) => {
      state.isMovingBoundingBox = action.payload;
    },
    setIsMouseOverBoundingBox: (state, action: PayloadAction<boolean>) => {
      state.isMouseOverBoundingBox = action.payload;
    },
    setIsMoveBoundingBoxKeyHeld: (state, action: PayloadAction<boolean>) => {
      state.isMoveBoundingBoxKeyHeld = action.payload;
    },
    setIsMoveStageKeyHeld: (state, action: PayloadAction<boolean>) => {
      state.isMoveStageKeyHeld = action.payload;
    },
    canvasBatchIdAdded: (state, action: PayloadAction<string>) => {
      state.batchIds.push(action.payload);
    },
    canvasBatchIdsReset: (state) => {
      state.batchIds = [];
    },
    stagingAreaInitialized: (
      state,
      action: PayloadAction<{
        boundingBox: IRect;
      }>
    ) => {
      const { boundingBox } = action.payload;

      state.layerState.stagingArea = {
        boundingBox,
        images: [],
        selectedImageIndex: -1,
      };
    },
    addImageToStagingArea: (state, action: PayloadAction<ImageDTO>) => {
      const image = action.payload;

      if (!image || !state.layerState.stagingArea.boundingBox) {
        return;
      }

      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      state.layerState.stagingArea.images.push({
        kind: 'image',
        layer: 'base',
        ...state.layerState.stagingArea.boundingBox,
        imageName: image.image_name,
      });

      state.layerState.stagingArea.selectedImageIndex =
        state.layerState.stagingArea.images.length - 1;

      state.futureLayerStates = [];
    },
    discardStagedImages: (state) => {
      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      state.layerState.stagingArea = cloneDeep(
        cloneDeep(initialLayerState)
      ).stagingArea;

      state.futureLayerStates = [];
      state.shouldShowStagingOutline = true;
      state.shouldShowStagingImage = true;
      state.batchIds = [];
    },
    addFillRect: (state) => {
      const { boundingBoxCoordinates, boundingBoxDimensions, brushColor } =
        state;

      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      state.layerState.objects.push({
        kind: 'fillRect',
        layer: 'base',
        ...boundingBoxCoordinates,
        ...boundingBoxDimensions,
        color: brushColor,
      });

      state.futureLayerStates = [];
    },
    addEraseRect: (state) => {
      const { boundingBoxCoordinates, boundingBoxDimensions } = state;

      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      state.layerState.objects.push({
        kind: 'eraseRect',
        layer: 'base',
        ...boundingBoxCoordinates,
        ...boundingBoxDimensions,
      });

      state.futureLayerStates = [];
    },
    addLine: (state, action: PayloadAction<number[]>) => {
      const { tool, layer, brushColor, brushSize, shouldRestrictStrokesToBox } =
        state;

      if (tool === 'move' || tool === 'colorPicker') {
        return;
      }

      const newStrokeWidth = brushSize / 2;

      // set & then spread this to only conditionally add the "color" key
      const newColor =
        layer === 'base' && tool === 'brush' ? { color: brushColor } : {};

      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      const newLine: CanvasMaskLine | CanvasBaseLine = {
        kind: 'line',
        layer,
        tool,
        strokeWidth: newStrokeWidth,
        points: action.payload,
        ...newColor,
      };

      if (shouldRestrictStrokesToBox) {
        newLine.clip = {
          ...state.boundingBoxCoordinates,
          ...state.boundingBoxDimensions,
        };
      }

      state.layerState.objects.push(newLine);

      state.futureLayerStates = [];
    },
    addPointToCurrentLine: (state, action: PayloadAction<number[]>) => {
      const lastLine = state.layerState.objects.findLast(isCanvasAnyLine);

      if (!lastLine) {
        return;
      }

      lastLine.points.push(...action.payload);
    },
    undo: (state) => {
      const targetState = state.pastLayerStates.pop();

      if (!targetState) {
        return;
      }

      state.futureLayerStates.unshift(cloneDeep(state.layerState));

      if (state.futureLayerStates.length > state.maxHistory) {
        state.futureLayerStates.pop();
      }

      state.layerState = targetState;
    },
    redo: (state) => {
      const targetState = state.futureLayerStates.shift();

      if (!targetState) {
        return;
      }

      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      state.layerState = targetState;
    },
    setShouldShowGrid: (state, action: PayloadAction<boolean>) => {
      state.shouldShowGrid = action.payload;
    },
    setShouldShowSliders: (state, action: PayloadAction<boolean>) => {
      state.shouldShowSliders = action.payload;
    },
    setIsMovingStage: (state, action: PayloadAction<boolean>) => {
      state.isMovingStage = action.payload;
    },
    setShouldSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.shouldSnapToGrid = action.payload;
    },
    setShouldAutoSave: (state, action: PayloadAction<boolean>) => {
      state.shouldAutoSave = action.payload;
    },
    setShouldShowIntermediates: (state, action: PayloadAction<boolean>) => {
      state.shouldShowIntermediates = action.payload;
    },
    resetCanvas: (state) => {
      state.pastLayerStates.push(cloneDeep(state.layerState));

      state.layerState = cloneDeep(initialLayerState);
      state.futureLayerStates = [];
      state.batchIds = [];
    },
    canvasResized: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      const { width, height } = action.payload;
      const newStageDimensions = {
        width: Math.floor(width),
        height: Math.floor(height),
      };

      state.stageDimensions = newStageDimensions;

      if (!state.layerState.objects.find(isCanvasBaseImage)) {
        const newScale = calculateScale(
          newStageDimensions.width,
          newStageDimensions.height,
          512,
          512,
          STAGE_PADDING_PERCENTAGE
        );

        const newCoordinates = calculateCoordinates(
          newStageDimensions.width,
          newStageDimensions.height,
          0,
          0,
          512,
          512,
          newScale
        );

        const newBoundingBoxDimensions = { width: 512, height: 512 };

        state.stageScale = newScale;

        state.stageCoordinates = newCoordinates;
        state.boundingBoxCoordinates = { x: 0, y: 0 };
        state.boundingBoxDimensions = newBoundingBoxDimensions;

        if (state.boundingBoxScaleMethod === 'auto') {
          const scaledDimensions = getScaledBoundingBoxDimensions(
            newBoundingBoxDimensions
          );
          state.scaledBoundingBoxDimensions = scaledDimensions;
        }
      }
    },
    resetCanvasView: (
      state,
      action: PayloadAction<{
        contentRect: IRect;
        shouldScaleTo1?: boolean;
      }>
    ) => {
      const { contentRect, shouldScaleTo1 } = action.payload;
      const {
        stageDimensions: { width: stageWidth, height: stageHeight },
      } = state;

      const { x, y, width, height } = contentRect;

      if (width !== 0 && height !== 0) {
        const newScale = shouldScaleTo1
          ? 1
          : calculateScale(
              stageWidth,
              stageHeight,
              width,
              height,
              STAGE_PADDING_PERCENTAGE
            );

        const newCoordinates = calculateCoordinates(
          stageWidth,
          stageHeight,
          x,
          y,
          width,
          height,
          newScale
        );

        state.stageScale = newScale;
        state.stageCoordinates = newCoordinates;
      } else {
        const newScale = calculateScale(
          stageWidth,
          stageHeight,
          512,
          512,
          STAGE_PADDING_PERCENTAGE
        );

        const newCoordinates = calculateCoordinates(
          stageWidth,
          stageHeight,
          0,
          0,
          512,
          512,
          newScale
        );

        const newBoundingBoxDimensions = { width: 512, height: 512 };

        state.stageScale = newScale;
        state.stageCoordinates = newCoordinates;
        state.boundingBoxCoordinates = { x: 0, y: 0 };
        state.boundingBoxDimensions = newBoundingBoxDimensions;

        if (state.boundingBoxScaleMethod === 'auto') {
          const scaledDimensions = getScaledBoundingBoxDimensions(
            newBoundingBoxDimensions
          );
          state.scaledBoundingBoxDimensions = scaledDimensions;
        }
      }
    },
    nextStagingAreaImage: (state) => {
      if (!state.layerState.stagingArea.images.length) {
        return;
      }

      const nextIndex = state.layerState.stagingArea.selectedImageIndex + 1;
      const lastIndex = state.layerState.stagingArea.images.length - 1;

      state.layerState.stagingArea.selectedImageIndex =
        nextIndex > lastIndex ? 0 : nextIndex;
    },
    prevStagingAreaImage: (state) => {
      if (!state.layerState.stagingArea.images.length) {
        return;
      }

      const prevIndex = state.layerState.stagingArea.selectedImageIndex - 1;
      const lastIndex = state.layerState.stagingArea.images.length - 1;

      state.layerState.stagingArea.selectedImageIndex =
        prevIndex < 0 ? lastIndex : prevIndex;
    },
    commitStagingAreaImage: (state) => {
      if (!state.layerState.stagingArea.images.length) {
        return;
      }

      const { images, selectedImageIndex } = state.layerState.stagingArea;

      state.pastLayerStates.push(cloneDeep(state.layerState));

      if (state.pastLayerStates.length > state.maxHistory) {
        state.pastLayerStates.shift();
      }

      const imageToCommit = images[selectedImageIndex];

      if (imageToCommit) {
        state.layerState.objects.push({
          ...imageToCommit,
        });
      }
      state.layerState.stagingArea = cloneDeep(initialLayerState).stagingArea;

      state.futureLayerStates = [];
      state.shouldShowStagingOutline = true;
      state.shouldShowStagingImage = true;
      state.batchIds = [];
    },
    fitBoundingBoxToStage: (state) => {
      const {
        boundingBoxDimensions,
        boundingBoxCoordinates,
        stageDimensions,
        stageScale,
      } = state;
      const scaledStageWidth = stageDimensions.width / stageScale;
      const scaledStageHeight = stageDimensions.height / stageScale;

      if (
        boundingBoxCoordinates.x < 0 ||
        boundingBoxCoordinates.x + boundingBoxDimensions.width >
          scaledStageWidth ||
        boundingBoxCoordinates.y < 0 ||
        boundingBoxCoordinates.y + boundingBoxDimensions.height >
          scaledStageHeight
      ) {
        const newBoundingBoxDimensions = {
          width: roundDownToMultiple(clamp(scaledStageWidth, 64, 512), 64),
          height: roundDownToMultiple(clamp(scaledStageHeight, 64, 512), 64),
        };

        const newBoundingBoxCoordinates = {
          x: roundToMultiple(
            scaledStageWidth / 2 - newBoundingBoxDimensions.width / 2,
            64
          ),
          y: roundToMultiple(
            scaledStageHeight / 2 - newBoundingBoxDimensions.height / 2,
            64
          ),
        };

        state.boundingBoxDimensions = newBoundingBoxDimensions;
        state.boundingBoxCoordinates = newBoundingBoxCoordinates;

        if (state.boundingBoxScaleMethod === 'auto') {
          const scaledDimensions = getScaledBoundingBoxDimensions(
            newBoundingBoxDimensions
          );
          state.scaledBoundingBoxDimensions = scaledDimensions;
        }
      }
    },
    setBoundingBoxScaleMethod: (
      state,
      action: PayloadAction<BoundingBoxScale>
    ) => {
      state.boundingBoxScaleMethod = action.payload;

      if (action.payload === 'auto') {
        const scaledDimensions = getScaledBoundingBoxDimensions(
          state.boundingBoxDimensions
        );
        state.scaledBoundingBoxDimensions = scaledDimensions;
      }
    },
    setScaledBoundingBoxDimensions: (
      state,
      action: PayloadAction<Dimensions>
    ) => {
      state.scaledBoundingBoxDimensions = action.payload;
    },
    setShouldShowStagingImage: (state, action: PayloadAction<boolean>) => {
      state.shouldShowStagingImage = action.payload;
    },
    setShouldShowStagingOutline: (state, action: PayloadAction<boolean>) => {
      state.shouldShowStagingOutline = action.payload;
    },
    setShouldShowCanvasDebugInfo: (state, action: PayloadAction<boolean>) => {
      state.shouldShowCanvasDebugInfo = action.payload;
    },
    setShouldRestrictStrokesToBox: (state, action: PayloadAction<boolean>) => {
      state.shouldRestrictStrokesToBox = action.payload;
    },
    setShouldAntialias: (state, action: PayloadAction<boolean>) => {
      state.shouldAntialias = action.payload;
    },
    setShouldCropToBoundingBoxOnSave: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.shouldCropToBoundingBoxOnSave = action.payload;
    },
    setColorPickerColor: (state, action: PayloadAction<RgbaColor>) => {
      state.colorPickerColor = action.payload;
    },
    commitColorPickerColor: (state) => {
      state.brushColor = {
        ...state.colorPickerColor,
        a: state.brushColor.a,
      };
      state.tool = 'brush';
    },
    setMergedCanvas: (state, action: PayloadAction<CanvasImage>) => {
      state.pastLayerStates.push(cloneDeep(state.layerState));

      state.futureLayerStates = [];

      state.layerState.objects = [action.payload];
    },
    resetCanvasInteractionState: (state) => {
      state.cursorPosition = null;
      state.isDrawing = false;
      state.isMouseOverBoundingBox = false;
      state.isMoveBoundingBoxKeyHeld = false;
      state.isMoveStageKeyHeld = false;
      state.isMovingBoundingBox = false;
      state.isMovingStage = false;
      state.isTransformingBoundingBox = false;
    },
    mouseLeftCanvas: (state) => {
      state.cursorPosition = null;
      state.isDrawing = false;
      state.isMouseOverBoundingBox = false;
      state.isMovingBoundingBox = false;
      state.isTransformingBoundingBox = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(appSocketQueueItemStatusChanged, (state, action) => {
      const batch_status = action.payload.data.batch_status;
      if (!state.batchIds.includes(batch_status.batch_id)) {
        return;
      }

      if (batch_status.in_progress === 0 && batch_status.pending === 0) {
        state.batchIds = state.batchIds.filter(
          (id) => id !== batch_status.batch_id
        );
      }
    });
    builder.addCase(setAspectRatio, (state, action) => {
      const ratio = action.payload;
      if (ratio) {
        state.boundingBoxDimensions.height = roundToMultiple(
          state.boundingBoxDimensions.width / ratio,
          64
        );
        state.scaledBoundingBoxDimensions.height = roundToMultiple(
          state.scaledBoundingBoxDimensions.width / ratio,
          64
        );
      }
    });
    builder.addMatcher(
      queueApi.endpoints.clearQueue.matchFulfilled,
      (state) => {
        state.batchIds = [];
      }
    );
    builder.addMatcher(
      queueApi.endpoints.cancelByBatchIds.matchFulfilled,
      (state, action) => {
        state.batchIds = state.batchIds.filter(
          (id) => !action.meta.arg.originalArgs.batch_ids.includes(id)
        );
      }
    );
  },
});

export const {
  addEraseRect,
  addFillRect,
  addImageToStagingArea,
  addLine,
  addPointToCurrentLine,
  clearCanvasHistory,
  clearMask,
  commitColorPickerColor,
  commitStagingAreaImage,
  discardStagedImages,
  fitBoundingBoxToStage,
  mouseLeftCanvas,
  nextStagingAreaImage,
  prevStagingAreaImage,
  redo,
  resetCanvas,
  resetCanvasInteractionState,
  resetCanvasView,
  setBoundingBoxCoordinates,
  setBoundingBoxDimensions,
  setBoundingBoxPreviewFill,
  setBoundingBoxScaleMethod,
  flipBoundingBoxAxes,
  setBrushColor,
  setBrushSize,
  setColorPickerColor,
  setCursorPosition,
  setInitialCanvasImage,
  setIsDrawing,
  setIsMaskEnabled,
  setIsMouseOverBoundingBox,
  setIsMoveBoundingBoxKeyHeld,
  setIsMoveStageKeyHeld,
  setIsMovingBoundingBox,
  setIsMovingStage,
  setIsTransformingBoundingBox,
  setLayer,
  setMaskColor,
  setMergedCanvas,
  setShouldAutoSave,
  setShouldCropToBoundingBoxOnSave,
  setShouldDarkenOutsideBoundingBox,
  setShouldLockBoundingBox,
  setShouldPreserveMaskedArea,
  setShouldShowBoundingBox,
  setShouldShowBrush,
  setShouldShowBrushPreview,
  setShouldShowCanvasDebugInfo,
  setShouldShowCheckboardTransparency,
  setShouldShowGrid,
  setShouldShowSliders,
  setShouldShowIntermediates,
  setShouldShowStagingImage,
  setShouldShowStagingOutline,
  setShouldSnapToGrid,
  setStageCoordinates,
  setStageScale,
  setTool,
  toggleShouldLockBoundingBox,
  toggleTool,
  undo,
  setScaledBoundingBoxDimensions,
  setShouldRestrictStrokesToBox,
  stagingAreaInitialized,
  setShouldAntialias,
  canvasResized,
  canvasBatchIdAdded,
  canvasBatchIdsReset,
} = canvasSlice.actions;

export default canvasSlice.reducer;
