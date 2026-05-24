document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-snippet");
  if (!button) return;

  const block = button.closest(".codeblock");
  const code = block?.querySelector("pre code");
  if (!code) return;

  const text = code.innerText.replace(/\n$/, "");

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied!";
    button.classList.add("is-copied");
  } catch {
    button.textContent = "Failed";
    button.classList.add("is-error");
  }

  window.setTimeout(() => {
    button.textContent = "Copy";
    button.classList.remove("is-copied", "is-error");
  }, 2000);
});
