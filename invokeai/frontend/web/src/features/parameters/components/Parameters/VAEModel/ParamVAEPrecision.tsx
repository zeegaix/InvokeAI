import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIInformationalPopover from 'common/components/IAIInformationalPopover/IAIInformationalPopover';
import IAIMantineSelect from 'common/components/IAIMantineSelect';
import { vaePrecisionChanged } from 'features/parameters/store/generationSlice';
import { ParameterPrecision } from 'features/parameters/types/parameterSchemas';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const selector = createMemoizedSelector(stateSelector, ({ generation }) => {
  const { vaePrecision } = generation;
  return { vaePrecision };
});

const DATA = ['fp16', 'fp32'];

const ParamVAEModelSelect = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { vaePrecision } = useAppSelector(selector);

  const handleChange = useCallback(
    (v: string | null) => {
      if (!v) {
        return;
      }

      dispatch(vaePrecisionChanged(v as ParameterPrecision));
    },
    [dispatch]
  );

  return (
    <IAIInformationalPopover feature="paramVAEPrecision">
      <IAIMantineSelect
        label={t('modelManager.vaePrecision')}
        value={vaePrecision}
        data={DATA}
        onChange={handleChange}
      />
    </IAIInformationalPopover>
  );
};

export default memo(ParamVAEModelSelect);
