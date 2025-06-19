document.addEventListener("DOMContentLoaded", async () => {
  const contentDiv = document.getElementById("content");

  async function initializePopup() {
    try {
      contentDiv.innerHTML = `
        <div>Welcome to Stellardex!</div>
      `;
    } catch (error) {
      console.error("Error initializing popup:", error);
      contentDiv.innerHTML = `<div class="error">Error loading content</div>`;
    }
  }

  await initializePopup();
});
