class GlobalDialog {
  open(dialogId: string): void {
    const dialog = document.getElementById(dialogId) as any;
    if (dialog && typeof dialog.open === 'function') {
      dialog.open();
    } else {
      console.warn(`Dialog with ID '${dialogId}' not found or cannot be opened.`);
    }
  }

  close(dialogId: string): void {
    const dialog = document.getElementById(dialogId) as any;
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    } else {
      console.warn(`Dialog with ID '${dialogId}' not found or cannot be closed.`);
    }
  }
}

export default new GlobalDialog();
