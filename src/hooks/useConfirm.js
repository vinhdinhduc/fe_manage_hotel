import { useState, useCallback } from 'react';

const useConfirm = () => {
  const [state, setState] = useState({ open: false, resolve: null, message: '', title: '' });

  const confirm = useCallback((message, title = 'Xác nhận') => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, message, title });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve(true);
    setState(s => ({ ...s, open: false }));
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve(false);
    setState(s => ({ ...s, open: false }));
  }, [state]);

  return { confirm, confirmState: state, handleConfirm, handleCancel };
};

export default useConfirm;
