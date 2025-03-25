let timers = {};

async function loadTimers() {
  const data = await browser.storage.local.get('timers');
  timers = data.timers || {};
  Object.keys(timers).forEach(tabId => {
    const { endTime } = timers[tabId];
    const remainingTime = Math.max(0, endTime - Date.now());
    if (remainingTime > 0) {
      timers[tabId].timeoutId = setTimeout(() => {
        browser.tabs.remove(parseInt(tabId));
        playBeepSound();
        browser.notifications.create({
          "type": "basic",
          "iconUrl": browser.extension.getURL("icons/icon.png"),
          "title": "Tab Timer",
          "message": `Tab ${tabId} has been closed.`
        });
        delete timers[tabId];
        saveTimers();
      }, remainingTime);
    } else {
      delete timers[tabId];
    }
  });
}

async function saveTimers() {
  await browser.storage.local.set({ timers });
}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.command === "setTimer") {
    const { tabId, timeInSeconds } = message;

    if (timers[tabId]) {
      clearTimeout(timers[tabId].timeoutId);
    }

    const endTime = Date.now() + timeInSeconds * 1000;
    const timeoutId = setTimeout(() => {
      browser.tabs.remove(parseInt(tabId));
      playBeepSound();
      delete timers[tabId];
      saveTimers();
    }, timeInSeconds * 1000);

    timers[tabId] = { timeoutId, endTime };
    await saveTimers();
  } else if (message.command === "clearTimer") {
    const { tabId } = message;

    if (timers[tabId]) {
      clearTimeout(timers[tabId].timeoutId);
      delete timers[tabId];
      await saveTimers();
    }
  } else if (message.command === "getRemainingTime") {
    const { tabId } = message;
    if (timers[tabId]) {
      const remainingTime = Math.max(0, timers[tabId].endTime - Date.now());
      return Promise.resolve(remainingTime);
    } else {
      return Promise.resolve(0);
    }
  }
});

function playBeepSound() {
  const audio = new Audio(browser.extension.getURL("sounds/ding.mp3"));
  audio.play();
}

// Load timers on startup
loadTimers();
