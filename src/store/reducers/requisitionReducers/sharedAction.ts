// sharedActions.ts
import { createAction } from '@reduxjs/toolkit';

export const removeRequisitionSerialNumber = createAction<string>('requisition/removeSerialNumber');
