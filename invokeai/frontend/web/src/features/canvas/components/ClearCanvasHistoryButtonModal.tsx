import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIAlertDialog from 'common/components/IAIAlertDialog';
import IAIButton from 'common/components/IAIButton';
import { clearCanvasHistory } from 'features/canvas/store/canvasSlice';
import { useTranslation } from 'react-i18next';
import { FaTrash } from 'react-icons/fa';
import { isStagingSelector } from 'features/canvas/store/canvasSelectors';
import { memo, useCallback } from 'react';

const ClearCanvasHistoryButtonModal = () => {
  const isStaging = useAppSelector(isStagingSelector);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const acceptCallback = useCallback(
    () => dispatch(clearCanvasHistory()),
    [dispatch]
  );

  return (
    <IAIAlertDialog
      title={t('unifiedCanvas.clearCanvasHistory')}
      acceptCallback={acceptCallback}
      acceptButtonText={t('unifiedCanvas.clearHistory')}
      triggerComponent={
        <IAIButton size="sm" leftIcon={<FaTrash />} colorScheme="error" isDisabled={isStaging} >
          {t('unifiedCanvas.clearCanvasHistory')}
        </IAIButton>
      }
    >
      <p>{t('unifiedCanvas.clearCanvasHistoryMessage')}</p>
      <br />
      <p>{t('unifiedCanvas.clearCanvasHistoryConfirm')}</p>
    </IAIAlertDialog>
  );
};
export default memo(ClearCanvasHistoryButtonModal);
