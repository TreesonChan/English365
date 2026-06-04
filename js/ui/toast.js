(function initToast(window) {
  'use strict';

  function show(message) {
    var existing = window.document.querySelector('.toast');
    if (existing) {
      existing.remove();
    }
    var toast = window.document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    window.document.body.appendChild(toast);
    window.setTimeout(function removeToast() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 1800);
  }

  window.English365Toast = {
    show: show,
  };
})(window);
