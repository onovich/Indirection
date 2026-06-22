const result = {
  fixture: "minimal-browser-harness",
  status: "ready"
};

window.__indirectionE2E = result;
document.querySelector("[data-testid='status']").textContent = result.status;
