(function initButtons(window) {
  'use strict';

  var ui = window.English365UI || {};

  function commandButton(action, label, className, attrs) {
    var extraAttrs = attrs || '';
    return '<button class="' + (className || 'primary-button') + '" type="button" data-action="' + action + '" ' + extraAttrs + '>' + ui.escapeHtml(label) + '</button>';
  }

  ui.commandButton = commandButton;
  window.English365UI = ui;
})(window);
