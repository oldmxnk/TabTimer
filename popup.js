let interval; // Global variable to store the interval ID

document.getElementById("timer-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const minutes = parseInt(document.getElementById("minutes").value) || 0;
  const seconds = parseInt(document.getElementById("seconds").value) || 0;
  const totalSeconds = (minutes * 60) + seconds;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (totalSeconds > 0 && tab.id) {
    browser.runtime.sendMessage({
      command: "setTimer",
      tabId: tab.id,
      timeInSeconds: totalSeconds,
    });

    updateRemainingTime(tab.id);
  }
});

document.getElementById("clear-btn").addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (tab.id) {
    browser.runtime.sendMessage({
      command: "clearTimer",
      tabId: tab.id,
    });

    clearInterval(interval); // Clear the interval
    clearTimerDisplay(); // Clear the display
  }
});

// Fetch and display the remaining time when the popup is opened
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (tab.id) {
    updateRemainingTime(tab.id);
  }
});

async function updateRemainingTime(tabId) {
  const updateDisplay = async () => {
    const remainingTime = await browser.runtime.sendMessage({ command: "getRemainingTime", tabId });

    if (!isNaN(remainingTime)) { // Ensure remainingTime is a number
      const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
      const remainingSeconds = Math.floor((remainingTime / 1000) % 60);

      document.getElementById("remaining-time").innerText =
        `${remainingMinutes < 10 ? '0' : ''}${remainingMinutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;

      if (remainingTime <= 0) {
        clearInterval(interval);
        document.getElementById("remaining-time").innerText = "00:00";
      }
    } else {
      document.getElementById("remaining-time").innerText = "--:--";
    }
  };

  updateDisplay(); // Start the first update immediately
  interval = setInterval(updateDisplay, 1000); // Continue updating every second
}

function clearTimerDisplay() {
  document.getElementById("remaining-time").innerText = "00:00";
}
