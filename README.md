# G-Guard 🛡️

**G-Guard** is a secure, 100% client-side password generator and strength analyzer. It is designed with a "privacy-first" architecture, ensuring that no password data is ever sent to a server or stored in cookies.

![G-Guard Screenshot](https://via.placeholder.com/800x400?text=G-Guard+Screenshot+Placeholder) 
## 🚀 Key Features

* **100% Client-Side:** All logic runs in the browser. No API calls transmit your passwords.
* **Advanced Strength Analysis:** Powered by `zxcvbn` for realistic entropy calculation and crack time estimation.
* **Dual Modes:**
    * **String Mode:** Generate complex random strings with customizable character sets.
    * **Passphrase Mode:** Generate readable, high-entropy phrases (e.g., `correct-horse-battery-staple`) separated by hyphens.
* **Ambiguous Character Filtering:** Option to exclude confusing characters like `I`, `l`, `1`, `O`, and `0`.
* **Security & UX:**
    * Visibility toggle (Show/Hide).
    * Dark mode UI optimized for focus.
    * Clipboard integration.

## 🛠️ Tech Stack

* **Framework:** Fastify / React (Next.js)
* **Styling:** Tailwind CSS
* **Crypto Logic:** `zxcvbn` + Web Crypto API
* **State Management:** React Hooks

## 📦 Getting Started

To run G-Guard locally on your machine:

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/g-guard.git](https://github.com/yourusername/g-guard.git)
    cd g-guard
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    npm start
    ```

## 🔒 Security Philosophy

G-Guard is built on the principle of **Zero Trust**.
* **No Analytics:** We do not track user inputs.
* **No Storage:** Passwords are not saved in LocalStorage or Cookies.
* **Open Source:** The cryptographic logic is transparent and verifiable.

## 🤝 Contributing

Contributions are welcome!
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feat/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed by [Gökhan Yildan](https://gokhanyildan.com)**
