chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Stellardex extension installed');
  } else if (details.reason === 'update') {
    console.log('Stellardex extension updated');
  }
});
