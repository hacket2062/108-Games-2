(() => {
  const status = document.getElementById('startup-status');
  const message = document.getElementById('startup-message');
  const retry = document.getElementById('startup-retry');
  if (!status || !message || !retry) return;
  retry.addEventListener('click', () => window.location.reload());
  const showRecovery = () => {
    if (!status.isConnected) return;
    message.textContent = '遊戲尚未成功載入，請檢查連線後重試。你的存檔不會被清除。';
    retry.hidden = false;
  };
  window.addEventListener('error', event => {
    if (event.target instanceof HTMLScriptElement || event instanceof ErrorEvent) showRecovery();
  }, true);
  window.addEventListener('unhandledrejection', showRecovery);
  const timer = window.setTimeout(showRecovery, 15000);
  const observer = new MutationObserver(() => {
    if (!status.isConnected) {
      window.clearTimeout(timer);
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById('root'), {childList:true});
})();
