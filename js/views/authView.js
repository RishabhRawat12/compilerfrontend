import { authStore } from "../store/authStore.js";
import { toast } from "../lib/toast.js";
import { renderIcons } from "../lib/utils.js";

export class AuthView {
  constructor(container) {
    this.container = container;
    this.render();
    this.bindEvents();
  }


  render() {
    this.container.innerHTML = `
      <main class="min-h-screen h-full flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-md">
          <header class="flex items-center gap-3 justify-center mb-8">
            <span class="size-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow" style="box-shadow: var(--shadow-elegant)">
              <i data-lucide="zap" class="size-5 text-primary-foreground"></i>
            </span>
            <div>
              <h1 class="text-xl font-semibold tracking-tight">CompilerHub</h1>
              <p class="text-xs text-muted-foreground">C compiler — every phase, one screen</p>
            </div>
          </header>

          <section class="panel p-6">
            <div id="auth-tabs" class="tabs-list mb-6">
              <button class="tabs-trigger" data-state="active" data-tab="login">Login</button>
              <button class="tabs-trigger" data-state="inactive" data-tab="signup">Sign Up</button>
            </div>

            <!-- Login Form -->
            <form id="login-form" class="flex flex-col gap-4">
              <div>
                <label class="label" for="login-email">Email</label>
                <input class="input" id="login-email" type="email" placeholder="you@example.com" required>
              </div>
              <div>
                <label class="label" for="login-password">Password</label>
                <input class="input" id="login-password" type="password" placeholder="••••••••" required>
              </div>
              <button type="submit" class="btn btn-gradient w-full mt-2">Login</button>
            </form>

            <!-- Signup Form -->
            <form id="signup-form" class="hidden flex-col gap-4">
              <div>
                <label class="label" for="signup-username">Username</label>
                <input class="input" id="signup-username" type="text" placeholder="yourname" required>
              </div>
              <div>
                <label class="label" for="signup-email">Email</label>
                <input class="input" id="signup-email" type="email" placeholder="you@example.com" required>
              </div>
              <div>
                <label class="label" for="signup-password">Password</label>
                <input class="input" id="signup-password" type="password" placeholder="At least 6 characters" required>
              </div>
              <button type="submit" class="btn btn-gradient w-full mt-2">Create account</button>
            </form>
          </section>
        </div>
      </main>
    `;
    renderIcons(this.container);
  }

  bindEvents() {
    const tabs = this.container.querySelectorAll(".tabs-trigger");
    const loginForm = this.container.querySelector("#login-form");
    const signupForm = this.container.querySelector("#signup-form");

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.setAttribute("data-state", "inactive"));
        tab.setAttribute("data-state", "active");

        const target = tab.getAttribute("data-tab");
        if (target === "login") {
          loginForm.classList.remove("hidden");
          loginForm.classList.add("flex");
          signupForm.classList.add("hidden");
          signupForm.classList.remove("flex");
        } else {
          signupForm.classList.remove("hidden");
          signupForm.classList.add("flex");
          loginForm.classList.add("hidden");
          loginForm.classList.remove("flex");
        }
      });
    });

    // Login Handle
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = this.container.querySelector("#login-email").value;
      const pass = this.container.querySelector("#login-password").value;
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const ogText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = "Logging in…";

      try {
        await authStore.login(email, pass);
        toast.success("Welcome back");
        window.location.hash = "#/workspace";
      } catch (err) {
        toast.error(err?.response?.data?.error || "Invalid credentials");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = ogText;
      }
    });

    // Signup Handle
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = this.container.querySelector("#signup-username").value;
      const email = this.container.querySelector("#signup-email").value;
      const pass = this.container.querySelector("#signup-password").value;

      if (pass.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const ogText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = "Creating account…";

      try {
        await authStore.signup(user, email, pass);
        toast.success("Account created");
        window.location.hash = "#/workspace";
      } catch (err) {
        toast.error(err?.response?.data?.error || "Registration failed");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = ogText;
      }
    });
  }

  destroy() {
    // cleanup not strictly needed for basic event listeners on unmounting dom element
    this.container.innerHTML = "";
  }
}
