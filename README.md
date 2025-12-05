# **BioLoom Labs — Website**

Official website for **BioLoom Labs**, a computational biodiversity & drug-discovery research group.
Built with **React**, **Vite**, **TailwindCSS**, **Framer Motion**, and **JSONC-driven dynamic content**.

This repository contains the full source for the lab’s public site, including pages for people, research, publications, and interactive visual elements.

---

## 🚀 **Tech Stack**

* **React 18**
* **Vite** (fast dev + bundling)
* **TailwindCSS** (styling)
* **Framer Motion** (animations)
* **Lucide Icons**
* **JSONC content loader** for editable site content
* **Cloudflare Pages** for hosting / deployment
* **GitHub → Cloudflare CI** (optional)

---

## 📂 **Project Structure**

```
bioloom-labs-website/
│
├── public/                 # static assets (logos, images, favicons)
│   └── images/
│
├── src/
│   ├── components/         # reusable UI components
│   ├── pages/              # top-level routed pages (Home, People, Research, etc.)
│   ├── content/            # JSONC files defining editable content
│   ├── utils/              # helper utilities (JSONC parser, etc.)
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md               # this file
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes & ensure build works
3. Submit a pull request

For design consistency, follow:

* Brand colour palette
* Tailwind utility-first classes
* Framer Motion animation patterns used in the repo

---

## 📜 License

This project is licensed under the **MIT License** unless replaced by lab policy.

---

## 📧 Contact

**BioLoom Labs**
Queen Mary University of London
📧 [bioloomlabs](mailto:s.pironon@qmul.ac.uk)
🌐 [https://bioloom-labs.com](https://bioloom-labs.com)
