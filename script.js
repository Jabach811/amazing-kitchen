// Hours in America/Los_Angeles, 24h. null = closed.
// Index matches Date.getDay(): 0 = Sunday.
const HOURS = [
  { open: 11, close: 21 }, // Sun
  null,                    // Mon
  { open: 11, close: 21 }, // Tue
  { open: 11, close: 21 }, // Wed
  { open: 11, close: 21 }, // Thu
  { open: 11, close: 21 }, // Fri
  { open: 11, close: 21 }, // Sat
];

const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
const day = now.getDay();
const hour = now.getHours() + now.getMinutes() / 60;

const status = document.getElementById("open-status");
if (status) {
  const today = HOURS[day];
  const label = h => {
    const suffix = h >= 12 ? "pm" : "am";
    const display = h > 12 ? h - 12 : h;
    return display + suffix;
  };

  if (today && hour >= today.open && hour < today.close) {
    status.textContent = "Open now until " + label(today.close);
  } else if (today && hour < today.open) {
    status.textContent = "Opens at " + label(today.open) + " today";
    status.classList.add("closed");
  } else {
    let next = (day + 1) % 7;
    while (!HOURS[next]) next = (next + 1) % 7;
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    status.textContent = "Closed — back " + names[next] + " at " + label(HOURS[next].open);
    status.classList.add("closed");
  }
}

const todayRow = document.querySelector('#hours-table tr[data-day="' + day + '"]');
if (todayRow) todayRow.classList.add("today");

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", e => {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}
