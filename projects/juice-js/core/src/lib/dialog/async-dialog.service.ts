import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Directive } from '@angular/core';

@Directive()
export abstract class AsyncDialog<ComponentType, DataType, ReturnType = unknown> {
  constructor(protected matDialog: MatDialog) {
  }

  abstract open(data: DataType): Promise<MatDialogRef<ComponentType, ReturnType>>;
}